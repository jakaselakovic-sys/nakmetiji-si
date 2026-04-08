"use client";

import { useState } from "react";
import { Farm } from "@/types";

export function SettingsView({ farm }: { farm: Farm }) {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    newInquiry: true,
    reviews: true,
    marketing: false,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      {/* ── Account ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Račun
          </h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-forest-900">E-pošta</p>
              <p className="text-sm text-earth-500">{farm.contact?.email}</p>
            </div>
            <button className="text-sm font-semibold text-forest-600 hover:text-forest-800 transition-colors">
              Spremeni
            </button>
          </div>
          <div className="border-t border-earth-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-forest-900">Geslo</p>
              <p className="text-sm text-earth-500">••••••••••••</p>
            </div>
            <button className="text-sm font-semibold text-forest-600 hover:text-forest-800 transition-colors">
              Spremeni
            </button>
          </div>
          <div className="border-t border-earth-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-forest-900">Jezik</p>
              <p className="text-sm text-earth-500">Slovenščina</p>
            </div>
            <button className="text-sm font-semibold text-forest-600 hover:text-forest-800 transition-colors">
              Spremeni
            </button>
          </div>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Obvestila
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { key: "email" as const, label: "E-poštna obvestila", desc: "Prejemajte obvestila po e-pošti" },
            { key: "sms" as const, label: "SMS obvestila", desc: "Prejemajte obvestila po SMS-u" },
            { key: "newInquiry" as const, label: "Nova povpraševanja", desc: "Obvestilo ob novem povpraševanju" },
            { key: "reviews" as const, label: "Nove ocene", desc: "Obvestilo ob novi oceni ali komentarju" },
            { key: "marketing" as const, label: "Marketinška sporočila", desc: "Novice in nasveti za vašo kmetijo" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-forest-900">{item.label}</p>
                <p className="text-xs text-earth-500">{item.desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => toggleNotif(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  notifications[item.key] ? "bg-forest-600" : "bg-earth-300"
                }`}
              >
                <span
                  className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    notifications[item.key] ? "translate-x-[22px]" : "translate-x-[3px]"
                  }`}
                  style={{ width: 18, height: 18 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Premium ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium naročnina
          </h3>
        </div>
        <div className="px-6 py-5">
          {farm.isPremium ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-amber-600 shadow-md">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Premium Partner — Aktiven</p>
                  <p className="text-xs text-amber-700/70">Veljavno do 31. december 2026</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-earth-600">
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Izpostavljen profil na naslovni strani
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Zlatni oznaka na zemljevidu
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Prednostna razvrstitev v iskanju
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Podrobna analitika obiskov
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-earth-600 mb-4">
                Nadgradite na Premium in povečajte vidnost vaše kmetije.
              </p>
              <button className="rounded-xl bg-forest-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-forest-600 transition-colors">
                Nadgradi na Premium
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-red-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100">
          <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Nevarno območje
          </h3>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">Izbriši račun</p>
            <p className="text-xs text-earth-500">Ta operacija je nepreklicna</p>
          </div>
          <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors">
            Izbriši račun
          </button>
        </div>
      </div>
    </div>
  );
}
