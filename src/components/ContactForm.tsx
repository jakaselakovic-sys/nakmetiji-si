"use client";

import { useState } from "react";
import { notifyFarmOwner } from "@/lib/edge-functions";

interface ContactFormProps {
  farmName: string;
  farmOwnerEmail: string;
}

export function ContactForm({ farmName, farmOwnerEmail }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const { error: sendError } = await notifyFarmOwner({
      farmName,
      farmOwnerEmail,
      guestName: formData.get("name") as string,
      guestEmail: formData.get("email") as string,
      guestPhone: (formData.get("phone") as string) || undefined,
      dateFrom: (formData.get("dateFrom") as string) || undefined,
      dateTo: (formData.get("dateTo") as string) || undefined,
      guests: Number(formData.get("guests")) || undefined,
      message: (formData.get("message") as string) || undefined,
    });

    setSending(false);

    if (sendError) {
      setError("Pošiljanje ni uspelo. Poskusite znova.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="rounded-2xl bg-white border border-earth-200/60 shadow-lg shadow-earth-200/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-700 to-forest-800 px-6 py-5">
        <h3 className="text-lg font-bold text-white">Napišite nam — z veseljem odgovorimo</h3>
        <p className="mt-1 text-sm text-white/60">
          {farmName} vas pričakuje z odprtimi vrati
        </p>
      </div>

      {/* Form */}
      <div className="p-6">
        {sent ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-100">
              <svg
                className="h-7 w-7 text-forest-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-forest-900 mb-1">
              Sporočilo poslano!
            </h4>
            <p className="text-sm text-earth-600">
              Kmetija vam bo odgovorila v najkrajšem možnem času.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="contact-name"
                className="block text-sm font-semibold text-forest-900 mb-1.5"
              >
                Ime in priimek
              </label>
              <input
                type="text"
                id="contact-name"
                name="name"
                required
                placeholder="Vaše ime"
                className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 placeholder:text-earth-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-semibold text-forest-900 mb-1.5"
              >
                E-pošta
              </label>
              <input
                type="email"
                id="contact-email"
                name="email"
                required
                placeholder="vas.email@primer.si"
                className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 placeholder:text-earth-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <label
                htmlFor="contact-phone"
                className="block text-sm font-semibold text-forest-900 mb-1.5"
              >
                Telefon{" "}
                <span className="text-earth-400 font-normal">(neobvezno)</span>
              </label>
              <input
                type="tel"
                id="contact-phone"
                name="phone"
                placeholder="+386 ..."
                className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 placeholder:text-earth-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="contact-date-from"
                  className="block text-sm font-semibold text-forest-900 mb-1.5"
                >
                  Od
                </label>
                <input
                  type="date"
                  id="contact-date-from"
                  name="dateFrom"
                  className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-date-to"
                  className="block text-sm font-semibold text-forest-900 mb-1.5"
                >
                  Do
                </label>
                <input
                  type="date"
                  id="contact-date-to"
                  name="dateTo"
                  className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
                />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label
                htmlFor="contact-guests"
                className="block text-sm font-semibold text-forest-900 mb-1.5"
              >
                Število gostov
              </label>
              <select
                id="contact-guests"
                name="guests"
                className="w-full appearance-none rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all cursor-pointer"
                defaultValue="2"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "gost" : n === 2 ? "gosta" : n <= 4 ? "gostje" : "gostov"}
                  </option>
                ))}
                <option value="10+">10+</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-semibold text-forest-900 mb-1.5"
              >
                Sporočilo
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder="Povejte nam — kaj si želite doživeti, kakšen oddih iščete..."
                className="w-full rounded-xl border border-earth-200 bg-earth-50/50 px-4 py-3 text-sm text-forest-900 placeholder:text-earth-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="contact-submit"
              disabled={sending}
              className="w-full rounded-xl bg-forest-700 py-3.5 text-sm font-bold text-white shadow-md shadow-forest-800/20 hover:bg-forest-600 hover:shadow-lg hover:shadow-forest-700/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Pošiljam...
                </>
              ) : (
                "Pošljite sporočilo"
              )}
            </button>

            <p className="text-[11px] text-center text-earth-400 leading-relaxed">
              S pošiljanjem se strinjate z našimi{" "}
              <a href="/pogoji" className="underline hover:text-forest-600">
                pogoji uporabe
              </a>{" "}
              in{" "}
              <a href="/zasebnost" className="underline hover:text-forest-600">
                politiko zasebnosti
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
