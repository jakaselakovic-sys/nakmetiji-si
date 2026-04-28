"use client";

// =============================================================================
// NaKmetiji.si — Oracle Chat Persistence (Zustand + sessionStorage)
//
// Persists Jože's chat history across page navigations within the same session.
// Uses sessionStorage (not localStorage) so history resets on tab close.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface OracleMessage {
  role: "user" | "assistant";
  content: string;
}

interface OracleStore {
  messages: OracleMessage[];
  addMessage: (msg: OracleMessage) => void;
  replaceLastAssistant: (content: string) => void;
  clearMessages: () => void;
  // Magic Fold trigger — call openOracle() from anywhere; OracleConcierge consumes it
  pendingOpen: boolean;
  pendingMessage: string | null;
  openOracle: (seedMessage?: string) => void;
  consumePending: () => { message: string | null };
}

export const useOracleStore = create<OracleStore>()(
  persist(
    (set, get) => ({
      messages: [],
      pendingOpen: false,
      pendingMessage: null,

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, msg].slice(-30), // keep last 30 messages
        })),

      replaceLastAssistant: (content) =>
        set((state) => {
          const msgs = [...state.messages];
          const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
          if (lastIdx >= 0) {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          }
          return { messages: msgs };
        }),

      clearMessages: () => set({ messages: [] }),

      openOracle: (seedMessage) =>
        set({ pendingOpen: true, pendingMessage: seedMessage ?? null }),

      consumePending: () => {
        const { pendingMessage } = get();
        set({ pendingOpen: false, pendingMessage: null });
        return { message: pendingMessage };
      },
    }),
    {
      name: "nakmetiji-oracle-chat",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
