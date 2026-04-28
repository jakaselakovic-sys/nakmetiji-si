import { get, set } from "idb-keyval";

export interface PendingStamp {
  id: string;
  farmSlug: string;
  sig: string;       // HMAC from /api/green-stamp/init
  ts: number;        // server-issued ticket timestamp (ms)
  lat: number;
  lng: number;
  accuracy: number;  // GPS accuracy in meters
  timestamp: number; // client enqueue time (ms) — used for UI only
}

const QUEUE_KEY = "nakmetiji_offline_stamps";

export async function addStampToQueue(stamp: Omit<PendingStamp, "id">) {
  const queue: PendingStamp[] = (await get(QUEUE_KEY)) || [];
  const newStamp = { ...stamp, id: crypto.randomUUID() };
  queue.push(newStamp);
  await set(QUEUE_KEY, queue);
  return newStamp;
}

export async function getStampQueue(): Promise<PendingStamp[]> {
  return (await get(QUEUE_KEY)) || [];
}

export async function removeFromQueue(id: string) {
  const queue: PendingStamp[] = (await get(QUEUE_KEY)) || [];
  const filtered = queue.filter((q) => q.id !== id);
  await set(QUEUE_KEY, filtered);
}

export async function clearQueue() {
  await set(QUEUE_KEY, []);
}
