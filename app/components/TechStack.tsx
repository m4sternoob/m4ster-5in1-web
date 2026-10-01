import SectionHeading from "./SectionHeading";

/* Tech stack section: what's under the hood. */

const STACK = [
  {
    name: "SwiftUI",
    detail: "The whole app UI — toolbar, cards, banners, confetti.",
  },
  {
    name: "SpriteKit",
    detail: "Game boards, animations, and particle effects.",
  },
  {
    name: "Zero dependencies",
    detail: "No third-party frameworks. Every line is first-party.",
  },
  {
    name: "Native macOS",
    detail: "Built for the Mac, not a wrapped web page.",
  },
  {
    name: "Apple Silicon",
    detail: "arm64 builds for modern Macs.",
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
        <SectionHeading
          eyebrow="Under the hood"
          title="Native, lean, offline"
          blurb="A small, honest stack. Fewer moving parts means fewer things that can break."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s) => (
            <div
              key={s.name}
              className="rounded-xl border border-edge bg-panel p-5"
            >
              <h3 className="font-mono text-sm font-bold text-arcade">
                {s.name}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
