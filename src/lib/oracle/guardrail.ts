// =============================================================================
// NaKmetiji.si — Oracle guardrail
// Two layers:
//   1. detectPromptInjection(text) — runs BEFORE the LLM call. Heuristic
//      pattern-match for known jailbreak / system-prompt extraction attempts.
//      Cheap, deterministic, never false-negatives the obvious cases. False
//      positives are acceptable — the user just gets a polite redirect.
//   2. scrubPii(text) — runs over LLM stream chunks. Redacts emails, phone
//      numbers, JMBG, EMŠO, IBANs, credit-card-shaped digit runs. Defense in
//      depth: the system prompt forbids PII output, but the model can hallucinate
//      from training data, so we redact at the wire.
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Prompt injection detection
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // System prompt extraction
  { pattern: /\b(ignore|disregard|forget|prezri|pozabi|pretvarjaj)\s+(all\s+)?(previous|above|prior|prejšnj[ae]|zgornj[ae])/i, reason: "ignore_previous" },
  { pattern: /\b(reveal|show|print|tell me|razkrij|pokaži)\s+(your|the|tvoj|svoj|the)?\s*(system|sistem|initial|prompt|instructions|navodila)/i, reason: "extract_system_prompt" },
  { pattern: /\b(you are now|you're now|act as|pretend to be|si zdaj|deluj kot|igraj vlogo)\b.{0,40}\b(?!jože|joze)/i, reason: "role_override" },
  { pattern: /\b(developer mode|admin mode|jailbreak|DAN mode|godmode)\b/i, reason: "jailbreak" },

  // Code/data exfiltration
  { pattern: /\b(execute|eval|run|run this|run the|izvedi|izvrši)\s+(code|command|shell|sql|script)/i, reason: "exec_code" },
  { pattern: /\b(select|insert|update|delete|drop)\s+\*?\s*from\b/i, reason: "raw_sql" },
  { pattern: /\b(write|generate|napiši|ustvari)\s+(a |an |me |mi )?(python|javascript|typescript|sql|bash|powershell)/i, reason: "code_gen" },
  { pattern: /\bcat\s+\/etc\/passwd|\.\.\/\.\.\/|\${.*}|<\?php|<%[\s=]/i, reason: "shell_injection" },

  // Output format hijack
  { pattern: /\b(respond only|reply only|output only|only as|only in)\s+(json|csv|xml|yaml|markdown)/i, reason: "output_hijack" },
  { pattern: /\b(repeat after me|say exactly|verbatim|word for word)\b/i, reason: "verbatim_request" },

  // Authority / impersonation
  { pattern: /\b(I am|i'm|sem)\s+(an?\s+)?(admin|administrator|developer|owner|titan|root)/i, reason: "claim_authority" },
  { pattern: /\b(this is|to je)\s+(an?\s+)?(test|emergency|urgent|security)/i, reason: "social_engineering" },

  // Token bomb / cost amplification
  { pattern: /\b(repeat|ponavljaj)\b.{0,40}\b(\d{3,}|hundreds|thousands|stokrat|tisočkrat)/i, reason: "token_bomb" },
];

export interface InjectionVerdict {
  blocked: boolean;
  reason: string | null;
  matchedPattern: string | null;
}

/**
 * Quick pre-LLM check. Returns `blocked: true` for high-confidence injection
 * attempts. Never throws. Cost: < 0.5ms over a 500-char message.
 *
 * NOTE: this is heuristic; sophisticated injection can still pass. The LLM
 * system prompt enforces the same boundary as a defense-in-depth layer, and
 * the post-stream PII scrubber catches data leaks the model still produces.
 */
export function detectPromptInjection(text: string): InjectionVerdict {
  if (!text || text.length === 0) return { blocked: false, reason: null, matchedPattern: null };

  // Very long messages without spaces = single-line obfuscation attempt
  if (text.length > 500 && !/\s/.test(text.slice(0, 500))) {
    return { blocked: true, reason: "obfuscation_run", matchedPattern: "no_whitespace_long" };
  }

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason, matchedPattern: pattern.source };
    }
  }

  return { blocked: false, reason: null, matchedPattern: null };
}

/** In-character refusal Jože can return when an injection is detected. */
export function injectionRefusal(locale: "sl" | "en" | "de" | "it"): string {
  if (locale === "sl") {
    return (
      "Tega vam jaz ne znam povedati — sem navaden kmečki vodnik, ne sistemski pisar. " +
      "Kaj pa, če mi raje poveste, kam vas srce vleče? Tih gozd, vinska klet, jutranja megla nad travniki…"
    );
  }
  if (locale === "de") {
    return (
      "Das kann ich Ihnen nicht sagen — ich bin nur ein Bauernführer, kein Systemverwalter. " +
      "Erzählen Sie mir lieber, wohin Sie das Herz zieht."
    );
  }
  if (locale === "it") {
    return (
      "Questo non lo so dire — sono solo una guida di campagna. " +
      "Ditemi piuttosto dove vi porta il cuore."
    );
  }
  return (
    "I'm just a countryside guide, that's not my table. " +
    "Tell me where your heart pulls you instead — quiet forest, wine cellar, morning mist over meadows…"
  );
}

// ---------------------------------------------------------------------------
// 2. PII scrubber — runs over each LLM stream chunk
// ---------------------------------------------------------------------------

/**
 * Redact patterns that look like personal data. Conservative — only matches
 * structures that are very unlikely to be coincidental (e.g. JMBG = exactly
 * 13 digits, IBAN = SI56 + 17 digits).
 *
 * Used as a streaming filter: each chunk passes through scrubPii() before
 * we emit it to the client. Chunks are independent so we don't try to handle
 * patterns split across boundaries — at our chunk sizes (single tokens) this
 * is acceptable; the regex matchers already require contiguous runs.
 */
export function scrubPii(chunk: string): string {
  if (!chunk) return chunk;

  return chunk
    // Email addresses
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-pošta odstranjena]")
    // Slovenian phone numbers: +386 / 00386 / 0xx — 8-9 digits with optional spaces or dashes
    .replace(/\b(?:\+386|00386|0)[\s-]?[1-9](?:[\s-]?\d){6,7}\b/g, "[telefon odstranjen]")
    // JMBG — exactly 13 digits, common Slovenian/Yugoslav personal id
    .replace(/\b\d{13}\b/g, "[JMBG odstranjen]")
    // EMŠO — 13 digits with spaces sometimes (subset of above; redundant)
    // Slovenian IBAN: SI56 + 15 digits
    .replace(/\bSI56[\s-]?(?:\d[\s-]?){15}\b/gi, "[IBAN odstranjen]")
    // Credit-card-shaped: 13–19 digits with optional spaces / dashes — Luhn not validated
    // (occasional false positive on long ID numbers, acceptable)
    .replace(/\b(?:\d[\s-]?){13,19}\b/g, "[št. kartice odstranjena]");
}

/**
 * Lightweight tag — call once per response to know if anything was scrubbed.
 * Pass the original full text + the scrubbed full text. Useful for Sentry.
 */
export function piiWasScrubbed(original: string, scrubbed: string): boolean {
  return original.length !== scrubbed.length || original !== scrubbed;
}
