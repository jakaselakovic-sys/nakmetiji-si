"use server";

// =============================================================================
// NaKmetiji.si — Kronika server action
// Wraps generateAndSendKronika in titanAction so only super_admin can trigger,
// with audit logging baked in. Exposes a single runKronika({ dryRun }) for the
// admin UI.
// =============================================================================

import { z } from "zod";
import { titanAction } from "@/lib/titan/action";
import { generateAndSendKronika, type KronikaSendResult } from "./send";

export const runKronika = titanAction({
  name: "kronika.run",
  severity: "info",
  input: z.object({ dryRun: z.boolean().default(true) }),
  handler: async ({ dryRun }, ctx): Promise<KronikaSendResult> => {
    // Use service client — we need to bypass RLS on kronika_subscribers,
    // which is readable only to self/admin via policy but we want to batch-send.
    return generateAndSendKronika(ctx.serviceClient, {
      dryRun,
      createdBy: ctx.user.id,
    });
  },
});
