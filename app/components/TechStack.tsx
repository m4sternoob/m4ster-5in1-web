import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/* Tech stack section: what's under the hood. */

const STACK = [
  {
    name: "Next.js + React",
    detail: "One web codebase — the single source of truth for every platform.",
  },
  {
    name: "Tauri (Rust)",
    detail: "Windows .exe and macOS .dmg — tiny, fast native shells.",
  },
  {
    name: "Capacitor",
    detail: "Android .apk and iOS .ipa from the same web code.",
  },
  {
    name: "Vercel",
    detail: "Web deploys automatically on every push to main.",
  },
  {
    name: "Alive UI",
    detail: "Breathing logo, aura backgrounds, pop-in entrances — everywhere.",
  },
  {
    name: "Offline",
    detail: "No network, no accounts, no analytics, no ads.",
  },
];

export default function TechStack() {
  return (
    <section
      id="tech"
      className="scroll-mt-20 border-t border-edge px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="Under the hood"
            title="One codebase, five platforms"
            blurb="Change once, push everywhere. Fewer moving parts means fewer things that can break."
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s, i) => (
            <Reveal key={s.name} delay={i * 80}>
              <div className="card-alive h-full rounded-xl border border-edge bg-panel p-5">
                <h3 className="font-mono text-sm font-bold text-arcade">
                  {s.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {s.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
