"use client";

import { useEffect, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { potrdiRezervacijo, zavrniRezervacijo } from "@/lib/actions/rezervacije";

// Matches ApprovalPayload from lib/jws.ts (verified server-side)
interface BookingData {
  bid: string;
  fid: string;
  price: number;
  guest: string;
  email: string;
  guests: number;
  dateFrom: string;
  dateTo: string;
  farmName: string;
  addons?: { label: string; price: number }[];
}

type TokenError = "expired" | "invalid" | "malformed";

export function PotrdiClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<BookingData | null>(null);
  const [tokenError, setTokenError] = useState<TokenError | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [status, setStatus] = useState<"cakanje" | "potrjena" | "zavrnjena">("cakanje");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      startTransition(() => {
        setTokenError("invalid");
        setTokenLoading(false);
      });
      return;
    }

    fetch("/api/potrdi/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((res: { ok: boolean; payload?: BookingData; error?: string }) => {
        startTransition(() => {
          if (res.ok && res.payload) {
            setData(res.payload);
          } else {
            setTokenError((res.error as TokenError) ?? "invalid");
          }
          setTokenLoading(false);
        });
      })
      .catch(() => {
        startTransition(() => {
          setTokenError("invalid");
          setTokenLoading(false);
        });
      });
  }, [token]);

  const handleAction = async (action: "potrjena" | "zavrnjena") => {
    if (!data) return;
    setLoading(true);
    setActionError(null);

    const result =
      action === "potrjena"
        ? await potrdiRezervacijo(data.bid)
        : await zavrniRezervacijo(data.bid);

    if (result.ok) {
      startTransition(() => setStatus(action));
    } else {
      startTransition(() => setActionError(result.napaka ?? "Napaka pri obdelavi."));
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("sl-SI", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (tokenLoading) {
    return (
      <div className="flex items-center gap-3 text-earth-500 text-sm bg-white p-6 rounded-2xl shadow-sm border border-earth-200">
        <Loader2 size={18} className="animate-spin flex-shrink-0" />
        Preverjam zahtevo...
      </div>
    );
  }

  if (!token || tokenError) {
    const messages: Record<TokenError, string> = {
      expired: "Povezava je potekla (veljavna 48 ur). Lastnik mora poslati novo povabilo.",
      malformed: "Neveljavna zahteva za potrditev.",
      invalid: "Neveljavna ali pretečena povezava.",
    };
    return (
      <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200">
        <AlertCircle size={18} className="flex-shrink-0" />
        {messages[tokenError ?? "invalid"]}
      </div>
    );
  }

  if (status !== "cakanje") {
    const isSuccess = status === "potrjena";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl border border-earth-100 max-w-sm w-full overflow-hidden text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full"
          style={{
            background: isSuccess ? "#dcfce7" : "#fee2e2",
            color: isSuccess ? "#166534" : "#991b1b",
          }}
        >
          {isSuccess ? <CheckCircle size={32} /> : <XCircle size={32} />}
        </motion.div>
        <h2 className="text-2xl font-bold text-forest-900 mb-2">
          {isSuccess ? "Rezervacija potrjena!" : "Rezervacija zavrnjena."}
        </h2>
        <p className="text-earth-500 text-sm">
          {isSuccess
            ? "Gost je prejel potrditveni e-mail in UPN nalog za plačilo."
            : "Gost je bil obveščen o zavrnitvi."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-2xl border border-earth-100 max-w-sm w-full overflow-hidden"
    >
      <div className="bg-forest-900 px-6 py-5 text-white">
        <p className="text-forest-200 text-xs font-semibold uppercase tracking-wider mb-1">
          Nova zahteva
        </p>
        <h2 className="text-xl font-bold">{data!.farmName}</h2>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex flex-col items-center justify-center font-bold flex-shrink-0">
            <span className="text-xs uppercase">{data!.guest.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-forest-900 leading-tight">{data!.guest}</p>
            <p className="text-sm text-earth-500">
              {data!.guests} {data!.guests === 1 ? "oseba" : "oseb"}
            </p>
          </div>
        </div>

        <div className="bg-earth-50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-earth-500 font-medium">Prihod:</span>
            <span className="font-bold text-forest-900">{formatDate(data!.dateFrom)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-earth-500 font-medium">Odhod:</span>
            <span className="font-bold text-forest-900">{formatDate(data!.dateTo)}</span>
          </div>
        </div>

        {data!.addons && data!.addons.length > 0 && (
          <div>
            <p className="text-xs font-bold text-earth-400 uppercase tracking-wider mb-2">
              Izbrani dodatki iz shrambe
            </p>
            <div className="space-y-1.5">
              {data!.addons.map((dodatek, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-earth-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {dodatek.label}
                  </span>
                  <span className="font-medium text-forest-900">{dodatek.price} €</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-earth-100 pt-4">
          <span className="text-earth-500 font-medium">Skupaj znesek:</span>
          <span className="text-2xl font-black text-forest-900">{data!.price} €</span>
        </div>

        {actionError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
            {actionError}
          </p>
        )}
      </div>

      <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAction("zavrnjena")}
          disabled={loading}
          className="py-3.5 rounded-xl border-2 border-earth-200 text-earth-600 font-bold hover:bg-earth-50 transition-colors disabled:opacity-50"
        >
          Zavrni
        </button>
        <button
          onClick={() => handleAction("potrjena")}
          disabled={loading}
          className="py-3.5 rounded-xl bg-forest-600 text-white font-bold shadow-md hover:bg-forest-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Potrdi"}
        </button>
      </div>
    </motion.div>
  );
}
