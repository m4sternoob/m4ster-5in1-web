/* Temporary session names for online play. No accounts, no sign-in:
   a fun generated default, editable, stored ONLY in this browser's
   localStorage and shared peer-to-peer with your opponent. */

const KEY = "m4ster-mp-name";

const ADJ = [
  "Neon", "Turbo", "Pixel", "Cosmic", "Shadow", "Lucky", "Hyper", "Retro",
  "Solar", "Velvet", "Atomic", "Mellow", "Rapid", "Silent", "Golden", "Electric",
];
const ANIMAL = [
  "Fox", "Wolf", "Panda", "Tiger", "Falcon", "Viper", "Bear", "Owl",
  "Lynx", "Raven", "Cobra", "Moose", "Shark", "Koala", "Bison", "Otter",
];

export function generateMpName(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const b = ANIMAL[Math.floor(Math.random() * ANIMAL.length)];
  const n = 10 + Math.floor(Math.random() * 90);
  return `${a}${b}-${n}`;
}

/** Stored name, or a fresh generated default (not yet persisted). */
export function getMpName(): string {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && saved.trim()) return saved;
  } catch {
    /* storage unavailable — fall through */
  }
  return generateMpName();
}

export function saveMpName(name: string): void {
  try {
    window.localStorage.setItem(KEY, name);
  } catch {
    /* ignore */
  }
}

export function cleanName(name: string): string {
  const trimmed = name.trim().slice(0, 20);
  return trimmed || generateMpName();
}
