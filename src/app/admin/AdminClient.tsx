"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, LogOut, Shield, TreePine,
  MessageSquare, TrendingUp, AlertTriangle, Eye, Loader2,
  RefreshCw, ChevronDown, ChevronUp, ExternalLink, Crown,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { REGIJA_LABELS, PAKET_CONFIG, type KmetijaPaket } from "@/types/database";
import type { Regija } from "@/types/database";
import { nastaviSubscription } from "@/lib/actions/subscriptions";

// ─── Types ───────────────────────────────────────────────────────────────────

type MnenjeStatus = "cakanje" | "odobreno" | "zavrnjeno";

interface Mnenje {
  id: string;
  uporabnik_ime: string;
  ocena: number;
  komentar: string | null;
  status: MnenjeStatus;
  datum: string;
  kmetije: { ime: string; slug: string } | null;
}

interface Kmetija {
  id: string;
  ime: string;
  slug: string;
  regija: string;
  aktivna: boolean;
  premium: boolean;
  paket?: KmetijaPaket;
  ocena: number | null;
  stevilo_ocen: number;
  ustvarjeno: string;
  lastnik_id: string | null;
}

interface Profil {
  id: string;
  ime: string | null;
  vloga: string;
  email: string | null;
}

interface NapakaLog {
  id: string;
  tip: "ai_api" | "email" | "rezervacija" | "sistem";
  vir: string;
  sporocilo: string;
  kontekst: Record<string, unknown> | null;
  reseno: boolean;
  ustvarjeno: string;
}

interface RevMesec {
  mesec: string;
  st_rezervacij: number;
  bruto_gmv: number;
  komisija: number;
  neto_kmetija: number;
}

interface RevProjekcija {
  zadnjih_90_dni_gmv: number;
  zadnjih_90_dni_komisija: number;
  zadnjih_90_dni_rez: number;
  povprecno_dnevno_komisija: number;
  projekcija_30_dni_gmv: number;
  projekcija_30_dni_komisija: number;
}

interface TopKmetija {
  kmetija_id: string;
  ime: string;
  slug: string;
  regija: string;
  st_rezervacij: number;
  bruto_gmv: number;
  komisija: number;
}

interface VsaRezervacija {
  id: string;
  status: string;
  skupaj_cena: number | null;
  ustvarjeno: string;
}

type AdminTab = "prihodki" | "mnenja" | "kmetije" | "napake" | "impersonacija";

interface Props {
  adminIme: string;
  mnenja: Mnenje[];
  kmetije: Kmetija[];
  profili: Profil[];
  skupajUporabnikov: number;
  napake: NapakaLog[];
  revMesecno: RevMesec[];
  revProjekcija: RevProjekcija | null;
  topKmetije: TopKmetija[];
  vseRezervacije: VsaRezervacija[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<MnenjeStatus, string> = {
  cakanje: "bg-amber-50 text-amber-700 border-amber-200",
  odobreno: "bg-green-50 text-green-700 border-green-200",
  zavrnjeno: "bg-red-50 text-red-700 border-red-200",
};

const NAPAKA_TIP_STYLE: Record<NapakaLog["tip"], string> = {
  ai_api:      "bg-purple-50 text-purple-700 border-purple-200",
  email:       "bg-blue-50 text-blue-700 border-blue-200",
  rezervacija: "bg-red-50 text-red-700 border-red-200",
  sistem:      "bg-slate-50 text-slate-700 border-slate-200",
};

// ─── Revenue Tab ─────────────────────────────────────────────────────────────

function PrihodkiTab({
  revMesecno, revProjekcija, topKmetije, vseRezervacije,
}: Pick<Props, "revMesecno" | "revProjekcija" | "topKmetije" | "vseRezervacije">) {
  const skupajGMV   = vseRezervacije.filter(r => ["potrjena","zakljucena"].includes(r.status)).reduce((s, r) => s + (r.skupaj_cena ?? 0), 0);
  const skupajKom   = skupajGMV * 0.12;
  const steviloPotj = vseRezervacije.filter(r => r.status === "potrjena").length;
  const steviloCaka = vseRezervacije.filter(r => r.status === "cakanje").length;

  // Last 6 months for bar chart
  const chart = [...revMesecno].reverse().slice(-6);
  const maxGMV = Math.max(...chart.map(m => Number(m.bruto_gmv)), 1);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Skupaj GMV",          value: fmt(skupajGMV),   sub: "potrjene rezervacije", color: "text-forest-700", bg: "bg-forest-50 border-forest-200" },
          { label: "Komisija (12 %)",      value: fmt(skupajKom),   sub: "zaslužek platforme",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
          { label: "Aktivne rezervacije",  value: String(steviloPotj), sub: "potrjenih",          color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
          { label: "Čaka na potrditev",    value: String(steviloCaka), sub: "v toku",             color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl border p-5 ${c.bg}`}>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs font-semibold text-earth-700 mt-1">{c.label}</p>
            <p className="text-[11px] text-earth-500">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 30-day projection */}
      {revProjekcija && (
        <div className="rounded-2xl bg-gradient-to-br from-forest-600 to-forest-700 text-white p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} />
            <h3 className="font-bold text-base">Projekcija naslednjih 30 dni</h3>
            <span className="ml-auto text-xs text-white/60">(temelji na zadnjih 90 dneh)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Pričakovani GMV</p>
              <p className="text-3xl font-black">{fmt(Number(revProjekcija.projekcija_30_dni_gmv))}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Pričakovana komisija</p>
              <p className="text-3xl font-black text-amber-300">{fmt(Number(revProjekcija.projekcija_30_dni_komisija))}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Povp. dnevna komisija</p>
              <p className="text-2xl font-black">{fmt(Number(revProjekcija.povprecno_dnevno_komisija))}</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly bar chart */}
      {chart.length > 0 && (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-6">
          <h3 className="font-bold text-forest-900 mb-5">Mesečni GMV (zadnjih 6 mesecev)</h3>
          <div className="flex items-end gap-3 h-32">
            {chart.map((m, i) => {
              const h = Math.round((Number(m.bruto_gmv) / maxGMV) * 100);
              const month = new Date(m.mesec).toLocaleDateString("sl-SI", { month: "short", year: "2-digit" });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: "100px" }}>
                    <div
                      style={{ height: `${Math.max(4, h)}%` }}
                      title={`GMV: ${fmt(Number(m.bruto_gmv))}\nKomisija: ${fmt(Number(m.komisija))}\nRezervacije: ${m.st_rezervacij}`}
                      className="w-full bg-forest-500 group-hover:bg-forest-400 rounded-t-lg transition-colors cursor-default"
                    />
                    <div
                      style={{ height: `${Math.max(2, Math.round(h * 0.12))}%` }}
                      className="w-full bg-amber-400 rounded-none absolute bottom-0 opacity-80"
                    />
                  </div>
                  <span className="text-[10px] text-earth-500">{month}</span>
                  <span className="text-[10px] font-semibold text-earth-700">{m.st_rezervacij} rez.</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-earth-500"><span className="w-2.5 h-2.5 rounded-sm bg-forest-500 inline-block" /> GMV</span>
            <span className="flex items-center gap-1.5 text-xs text-earth-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Komisija (12%)</span>
          </div>
        </div>
      )}

      {/* Top farms */}
      {topKmetije.length > 0 && (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-earth-200/60">
            <h3 className="font-bold text-forest-900">Top kmetije po prihodkih</h3>
          </div>
          <div className="divide-y divide-earth-100">
            {topKmetije.map((k, i) => (
              <div key={k.kmetija_id} className="px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-black text-earth-400 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/kmetije/${k.slug}`} className="text-sm font-semibold text-forest-900 hover:underline truncate block">
                    {k.ime}
                  </Link>
                  <p className="text-xs text-earth-500">
                    {REGIJA_LABELS[k.regija as Regija] ?? k.regija} · {k.st_rezervacij} rezervacij
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-forest-900">{fmt(Number(k.bruto_gmv))}</p>
                  <p className="text-xs text-amber-600">{fmt(Number(k.komisija))} kom.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topKmetije.length === 0 && revMesecno.length === 0 && (
        <div className="rounded-2xl bg-white border border-earth-200/60 p-12 text-center text-earth-400">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Še ni potrjenih rezervacij. Prihodki se prikažejo ko gostje začnejo rezervirati.</p>
        </div>
      )}
    </div>
  );
}

// ─── Error Log Tab ────────────────────────────────────────────────────────────

function NapakaTab({ napake: initialNapake }: { napake: NapakaLog[] }) {
  const [napake, setNapake] = useState(initialNapake);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resevam, setResevam] = useState<string | null>(null);
  const [filter, setFilter] = useState<"vse" | "nereseno">("nereseno");
  const [tipFilter, setTipFilter] = useState<string>("vse");

  async function handleResi(id: string) {
    setResevam(id);
    const res = await fetch("/api/admin/napake", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    if ((await res.json()).ok) {
      setNapake(prev => prev.map(n => n.id === id ? { ...n, reseno: true } : n));
    }
    setResevam(null);
  }

  async function handleResiVse() {
    const ids = filtered.filter(n => !n.reseno).map(n => n.id);
    if (!ids.length) return;
    setResevam("vse");
    const res = await fetch("/api/admin/napake", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if ((await res.json()).ok) {
      setNapake(prev => prev.map(n => ids.includes(n.id) ? { ...n, reseno: true } : n));
    }
    setResevam(null);
  }

  const filtered = napake
    .filter(n => filter === "vse" || !n.reseno)
    .filter(n => tipFilter === "vse" || n.tip === tipFilter);

  const neresenih = napake.filter(n => !n.reseno).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {(["nereseno", "vse"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${filter === f ? "bg-forest-600 text-white border-forest-600" : "bg-white text-earth-600 border-earth-200"}`}>
              {f === "nereseno" ? `Neresene (${neresenih})` : "Vse"}
            </button>
          ))}
          {["vse","ai_api","email","rezervacija","sistem"].map(t => (
            <button key={t} onClick={() => setTipFilter(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${tipFilter === t ? "bg-earth-800 text-white border-earth-800" : "bg-white text-earth-600 border-earth-200"}`}>
              {t === "vse" ? "Vsi tipi" : t}
            </button>
          ))}
        </div>
        {neresenih > 0 && (
          <button onClick={handleResiVse} disabled={resevam === "vse"}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 border border-green-300 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
            {resevam === "vse" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Označi vse kot rešene
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-earth-200/60 p-12 text-center">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-sm text-earth-500">Ni napak v evidenci.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden divide-y divide-earth-100">
          {filtered.map(n => (
            <div key={n.id} className={n.reseno ? "opacity-50" : ""}>
              <div className="px-5 py-3 flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${NAPAKA_TIP_STYLE[n.tip]}`}>
                  {n.tip}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-earth-900 truncate">{n.sporocilo}</p>
                  <p className="text-xs text-earth-400">{n.vir} · {fmtDate(n.ustvarjeno)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.kontekst && (
                    <button onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                      className="text-earth-400 hover:text-earth-700 transition-colors">
                      {expanded === n.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  {!n.reseno && (
                    <button onClick={() => handleResi(n.id)} disabled={resevam === n.id}
                      className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 px-2 py-1 rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
                      {resevam === n.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                      Rešeno
                    </button>
                  )}
                </div>
              </div>
              {expanded === n.id && n.kontekst && (
                <div className="mx-5 mb-3 bg-slate-50 rounded-xl border border-slate-200 p-3">
                  <pre className="text-[11px] text-slate-600 whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify(n.kontekst, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Impersonation Tab ────────────────────────────────────────────────────────

function ImpersonacijaTab({ profili }: { profili: Profil[] }) {
  const [iskanje, setIskanje] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [data, setData] = useState<{
    profil: Profil;
    kmetija: Record<string, unknown> | null;
    rezervacije: Record<string, unknown>[];
  } | null>(null);

  const filteredProfili = profili.filter(p =>
    !iskanje || p.ime?.toLowerCase().includes(iskanje.toLowerCase()) || p.email?.toLowerCase().includes(iskanje.toLowerCase())
  );

  async function handleImpersonate(userId: string) {
    setLoading(userId);
    setData(null);
    try {
      const res = await fetch(`/api/admin/impersonate?user_id=${userId}`);
      const json = await res.json();
      if (json.ok) setData(json);
    } catch { /* noop */ }
    setLoading(null);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
        <Eye size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Simulacija uporabnika — samo za branje</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Prikazuje točne podatke ki jih vidi prodajalec v svojem dashboardu. Ne menjate seje, ni pisanja v bazo.
          </p>
        </div>
      </div>

      {/* User search */}
      <div>
        <input
          type="text"
          value={iskanje}
          onChange={e => setIskanje(e.target.value)}
          placeholder="Iščite po imenu ali e-pošti..."
          className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
        />
      </div>

      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden divide-y divide-earth-100 max-h-64 overflow-y-auto">
        {filteredProfili.map(p => (
          <div key={p.id} className="px-5 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-bold text-sm flex-shrink-0">
              {(p.ime || p.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-earth-800 truncate">{p.ime || "—"}</p>
              <p className="text-xs text-earth-400 truncate">{p.email || p.id}</p>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${
              p.vloga === "super_admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
              p.vloga === "lastnik" ? "bg-forest-50 text-forest-700 border-forest-200" :
              "bg-earth-50 text-earth-600 border-earth-200"
            }`}>
              {p.vloga === "super_admin" ? "Admin" : p.vloga === "lastnik" ? "Lastnik" : "Gost"}
            </span>
            <button
              onClick={() => handleImpersonate(p.id)}
              disabled={loading === p.id}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {loading === p.id ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
              Poglej
            </button>
          </div>
        ))}
      </div>

      {/* Result panel */}
      {data && (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-earth-200/60 bg-blue-50 flex items-center gap-3">
            <Eye size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-800">
              Pogled kot: {data.profil.ime || data.profil.email}
            </span>
            <button onClick={() => setData(null)} className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium">
              Zapri
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Profil */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold text-earth-400 mb-2">Profil</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-earth-400 text-xs">ID</span><p className="font-mono text-xs text-earth-700 truncate">{data.profil.id}</p></div>
                <div><span className="text-earth-400 text-xs">Vloga</span><p className="font-semibold">{data.profil.vloga}</p></div>
                <div><span className="text-earth-400 text-xs">Email</span><p className="truncate">{data.profil.email || "—"}</p></div>
              </div>
            </div>

            {/* Kmetija */}
            {data.kmetija ? (
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-earth-400 mb-2 flex items-center gap-2">
                  Kmetija
                  <Link href={`/kmetije/${(data.kmetija as {slug:string}).slug}`} target="_blank"
                    className="inline-flex items-center gap-1 text-forest-600 hover:text-forest-800 font-medium normal-case tracking-normal">
                    <ExternalLink size={11} /> Ogled
                  </Link>
                </h4>
                <div className="rounded-xl border border-earth-200 bg-earth-50 p-4">
                  <p className="font-bold text-forest-900">{(data.kmetija as {ime:string}).ime}</p>
                  <p className="text-xs text-earth-500 mt-1">
                    {REGIJA_LABELS[(data.kmetija as {regija:string}).regija as Regija] ?? (data.kmetija as {regija:string}).regija} ·{" "}
                    {(data.kmetija as {aktivna:boolean}).aktivna ? "✅ Aktivna" : "⏳ V pregledu"}
                  </p>
                  <p className="text-xs text-earth-500">
                    Cena: {(data.kmetija as {cena_noc?:number|null}).cena_noc ? `${(data.kmetija as {cena_noc:number}).cena_noc} €/noč` : "ni nastavljena"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-earth-400 italic">Ta uporabnik nima registrirane kmetije.</p>
            )}

            {/* Rezervacije */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold text-earth-400 mb-2">
                Rezervacije ({data.rezervacije.length})
              </h4>
              {data.rezervacije.length === 0 ? (
                <p className="text-sm text-earth-400 italic">Ni rezervacij.</p>
              ) : (
                <div className="rounded-xl border border-earth-200 overflow-hidden divide-y divide-earth-100">
                  {data.rezervacije.slice(0, 10).map((r) => {
                    const rez = r as {id:string; gost_ime:string; datum_od:string; datum_do:string; status:string; skupaj_cena:number|null};
                    return (
                      <div key={rez.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{rez.gost_ime}</p>
                          <p className="text-xs text-earth-400">{rez.datum_od} → {rez.datum_do}</p>
                        </div>
                        <span className="text-xs text-earth-500">{rez.skupaj_cena ? `${rez.skupaj_cena} €` : "—"}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          rez.status === "potrjena" ? "bg-green-50 text-green-700 border-green-200" :
                          rez.status === "cakanje" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-earth-50 text-earth-600 border-earth-200"
                        }`}>{rez.status}</span>
                      </div>
                    );
                  })}
                  {data.rezervacije.length > 10 && (
                    <p className="px-4 py-2 text-xs text-earth-400 text-center">+ {data.rezervacije.length - 10} več</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kmetije Tab with Tier Management ─────────────────────────────────────────

const ALL_TIERS: KmetijaPaket[] = ["korenine", "avtenticnost", "posesek", "titan_elite"];

const TIER_STYLE: Record<KmetijaPaket, string> = {
  korenine:      "bg-earth-50 text-earth-600 border-earth-200",
  avtenticnost:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  posesek:       "bg-blue-50 text-blue-700 border-blue-200",
  titan_elite:   "bg-amber-50 text-amber-700 border-amber-200",
};

function KmetijeTab({
  kmetije,
  handleAktivacijaKmetije,
}: {
  kmetije: Kmetija[];
  handleAktivacijaKmetije: (id: string, aktivna: boolean) => void;
}) {
  const [tierLoading, setTierLoading] = useState<string | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);
  const [localTiers, setLocalTiers] = useState<Record<string, KmetijaPaket>>(() =>
    Object.fromEntries(kmetije.map((k) => [k.id, k.paket ?? "korenine"]))
  );

  async function handleTierChange(kmetijaId: string, newTier: KmetijaPaket) {
    setTierLoading(kmetijaId);
    setTierError(null);
    const result = await nastaviSubscription(kmetijaId, newTier);
    if (result.ok) {
      setLocalTiers((prev) => ({ ...prev, [kmetijaId]: newTier }));
    } else {
      setTierError(result.napaka ?? "Napaka pri nastavitvi tira.");
    }
    setTierLoading(null);
  }

  return (
    <div className="space-y-3">
      {tierError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{tierError}</div>
      )}

      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-forest-900">Vse kmetije ({kmetije.length})</h2>
          <div className="flex items-center gap-2 text-[11px] text-earth-500">
            <Crown size={12} className="text-amber-500" />
            Tier nastavljaš tukaj — sprememba je takojšnja
          </div>
        </div>
        <div className="divide-y divide-earth-100">
          {kmetije.map((k) => {
            const currentTier = localTiers[k.id] ?? "korenine";
            const cfg = PAKET_CONFIG[currentTier];
            return (
              <div key={k.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/kmetije/${k.slug}`}
                      className="text-sm font-bold text-forest-900 hover:underline"
                    >
                      {k.ime}
                    </Link>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${TIER_STYLE[currentTier]}`}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                        k.aktivna
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-earth-50 text-earth-600 border-earth-200"
                      }`}
                    >
                      {k.aktivna ? "Aktivna" : "V pregledu"}
                    </span>
                  </div>
                  <p className="text-xs text-earth-500">
                    {REGIJA_LABELS[k.regija as Regija] ?? k.regija} ·{" "}
                    {k.ocena ? `⭐ ${k.ocena.toFixed(1)}` : "Brez ocene"} · {k.stevilo_ocen} ocen
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Tier selector */}
                  <div className="relative">
                    <select
                      value={currentTier}
                      onChange={(e) => handleTierChange(k.id, e.target.value as KmetijaPaket)}
                      disabled={tierLoading === k.id}
                      className={`appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-forest-400 ${TIER_STYLE[currentTier]} ${tierLoading === k.id ? "opacity-50" : ""}`}
                    >
                      {ALL_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {PAKET_CONFIG[t].emoji} {PAKET_CONFIG[t].label}
                          {PAKET_CONFIG[t].cena_mesec ? ` (${PAKET_CONFIG[t].cena_mesec} €/m)` : " (brezplačno)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-earth-400"
                    />
                  </div>
                  {tierLoading === k.id && <Loader2 size={14} className="animate-spin text-forest-600" />}
                  <button
                    onClick={() => handleAktivacijaKmetije(k.id, !k.aktivna)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      k.aktivna
                        ? "border-red-300 text-red-600 hover:bg-red-50"
                        : "border-green-300 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {k.aktivna ? "Deaktiviraj" : "Aktiviraj"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminClient ─────────────────────────────────────────────────────────

const TABS: { key: AdminTab; label: string; icon: React.ReactNode; badgeFn?: (p: Props) => number }[] = [
  { key: "prihodki",     label: "Prihodki",         icon: <TrendingUp size={15} /> },
  { key: "mnenja",       label: "Moderacija",        icon: <MessageSquare size={15} />, badgeFn: p => p.mnenja.filter(m => m.status === "cakanje").length },
  { key: "kmetije",      label: "Kmetije",           icon: <TreePine size={15} /> },
  { key: "napake",       label: "Napake",            icon: <AlertTriangle size={15} />, badgeFn: p => p.napake.filter(n => !n.reseno).length },
  { key: "impersonacija",label: "Simulacija",        icon: <Eye size={15} /> },
];

export function AdminClient(props: Props) {
  const { adminIme, mnenja: initialMnenja, kmetije, profili, skupajUporabnikov, napake } = props;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("prihodki");
  const [mnenja, setMnenja] = useState(initialMnenja);
  const [mnenjaFilter, setMnenjaFilter] = useState<MnenjeStatus | "vse">("cakanje");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleOdjava() {
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  async function handleMnenje(id: string, status: "odobreno" | "zavrnjeno") {
    setActionLoading(id);
    setNapaka(null);
    const res = await fetch("/api/admin/mnenja", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json() as { ok?: boolean; napaka?: string };
    if (json.ok) {
      setMnenja(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } else {
      setNapaka(json.napaka ?? "Napaka.");
    }
    setActionLoading(null);
  }

  async function handleAktivacijaKmetije(id: string, aktivna: boolean) {
    setNapaka(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.from("kmetije").update({ aktivna }).eq("id", id);
    if (error) { setNapaka(error.message); return; }
    router.refresh();
  }

  const filteredMnenja = mnenjaFilter === "vse" ? mnenja : mnenja.filter(m => m.status === mnenjaFilter);
  const cakajocaMnenja = mnenja.filter(m => m.status === "cakanje").length;
  const aktivneKmetije = kmetije.filter(k => k.aktivna).length;
  const nereseneNapake = napake.filter(n => !n.reseno).length;

  return (
    <div className="min-h-screen bg-earth-50 pt-[72px]">
      {/* Header */}
      <div className="bg-white border-b border-earth-200 px-6 lg:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-forest-900">Admin Intelligence</h1>
              <p className="text-xs text-earth-500">Prijavljen kot {adminIme}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.refresh()} className="flex items-center gap-1.5 text-xs text-earth-500 hover:text-forest-800 transition-colors">
              <RefreshCw size={13} /> Osveži
            </button>
            <Link href="/dashboard" className="text-sm text-earth-600 hover:text-forest-800 font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/magic-tools" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
              Magic Tools
            </Link>
            <button
              onClick={handleOdjava}
              disabled={isPending}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <LogOut size={14} /> Odjava
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Skupaj kmetij",     value: kmetije.length,        icon: "🌾" },
            { label: "Aktivnih kmetij",   value: aktivneKmetije,        icon: "✅" },
            { label: "Čaka moderacijo",   value: cakajocaMnenja,        icon: "⏳", urgent: cakajocaMnenja > 0 },
            { label: "Neresene napake",   value: nereseneNapake,        icon: "⚠️", urgent: nereseneNapake > 0 },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl bg-white border p-4 shadow-sm ${s.urgent ? "border-amber-300" : "border-earth-200/60"}`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <p className={`text-2xl font-bold ${s.urgent ? "text-amber-700" : "text-forest-900"}`}>{s.value}</p>
              <p className="text-xs text-earth-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-earth-200 rounded-2xl mb-6 w-fit overflow-x-auto">
          {TABS.map(tab => {
            const badge = tab.badgeFn?.(props) ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-forest-600 text-white shadow"
                    : "text-earth-600 hover:text-forest-800"
                }`}
              >
                {tab.icon}
                {tab.label}
                {badge > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {napaka && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{napaka}</div>
        )}

        {/* ── PRIHODKI ──────────────────────────────────────────────── */}
        {activeTab === "prihodki" && (
          <PrihodkiTab
            revMesecno={props.revMesecno}
            revProjekcija={props.revProjekcija}
            topKmetije={props.topKmetije}
            vseRezervacije={props.vseRezervacije}
          />
        )}

        {/* ── MNENJA ────────────────────────────────────────────────── */}
        {activeTab === "mnenja" && (
          <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-bold text-forest-900">Moderacija mnenj</h2>
              <div className="flex gap-1.5">
                {(["cakanje", "odobreno", "zavrnjeno", "vse"] as const).map(f => (
                  <button key={f} onClick={() => setMnenjaFilter(f)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      mnenjaFilter === f ? "bg-forest-600 text-white border-forest-600" : "bg-white text-earth-600 border-earth-200"
                    }`}>
                    {f === "vse" ? "Vse" : f === "cakanje" ? "Čaka" : f === "odobreno" ? "Odobreno" : "Zavrnjeno"}
                  </button>
                ))}
              </div>
            </div>
            {filteredMnenja.length === 0 ? (
              <p className="px-6 py-12 text-center text-earth-400 text-sm">Ni mnenj za ta filter.</p>
            ) : (
              <div className="divide-y divide-earth-100">
                {filteredMnenja.map(m => (
                  <div key={m.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-forest-900">{m.uporabnik_ime}</p>
                          <span className="text-xs text-amber-500">{"★".repeat(m.ocena)}{"☆".repeat(5 - m.ocena)}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[m.status]}`}>
                            {m.status === "cakanje" ? "Čaka" : m.status === "odobreno" ? "Odobreno" : "Zavrnjeno"}
                          </span>
                        </div>
                        {m.kmetije && (
                          <Link href={`/kmetije/${m.kmetije.slug}`} className="text-xs text-forest-600 hover:underline">
                            {m.kmetije.ime}
                          </Link>
                        )}
                        {m.komentar && (
                          <p className="text-sm text-earth-700 mt-2 leading-relaxed">{m.komentar}</p>
                        )}
                        <p className="text-xs text-earth-400 mt-1">{fmtDate(m.datum)}</p>
                      </div>
                      {m.status === "cakanje" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleMnenje(m.id, "odobreno")} disabled={actionLoading === m.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                            <CheckCircle size={12} /> Odobri
                          </button>
                          <button onClick={() => handleMnenje(m.id, "zavrnjeno")} disabled={actionLoading === m.id}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                            <XCircle size={12} /> Zavrni
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KMETIJE ───────────────────────────────────────────────── */}
        {activeTab === "kmetije" && (
          <KmetijeTab kmetije={kmetije} handleAktivacijaKmetije={handleAktivacijaKmetije} />
        )}

        {/* ── NAPAKE ────────────────────────────────────────────────── */}
        {activeTab === "napake" && <NapakaTab napake={napake} />}

        {/* ── IMPERSONACIJA ─────────────────────────────────────────── */}
        {activeTab === "impersonacija" && <ImpersonacijaTab profili={profili} />}

        {/* Skupaj uporabnikov note */}
        {activeTab === "impersonacija" && (
          <p className="text-xs text-earth-400 mt-3 text-center">
            Prikazuje zadnjih 50 od skupaj {skupajUporabnikov} uporabnikov.
          </p>
        )}
      </div>
    </div>
  );
}
