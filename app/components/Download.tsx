import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import InstallApp from "./InstallApp";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  ANDROID_DOWNLOAD_URL,
  SYS_REQUIREMENTS,
} from "../data/site";

/* Download section: one card per platform, all builds from one codebase. */

const PLATFORMS = [
  {
    name: "Windows",
    desc: "Native .exe installer via Tauri — fast, tiny, offline.",
    href: WINDOWS_DOWNLOAD_URL,
    cta: "Download .exe",
  },
  {
    name: "macOS",
    desc: "Native .dmg via Tauri — Apple Silicon and Intel.",
    href: MAC_DOWNLOAD_URL,
    cta: "Download .dmg",
  },
  {
    name: "Android",
    desc: "Native .apk via Capacitor — offline, no accounts, no ads.",
    href: ANDROID_DOWNLOAD_URL,
    cta: "Download .apk",
  },
];

export default function Download() {
  return (
    <section
      id="download"
      className="relative scroll-mt-20 overflow-hidden border-y border-edge bg-panel/50 px-4 py-20 sm:px-6 sm:py-28"
    >
      {/* ambient aura behind the cards */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="aura-blob aura-a absolute top-1/4 left-1/4" />
        <div className="aura-blob aura-b absolute right-1/4 bottom-1/4" />
      </div>
      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          <SectionHeading
            eyebrow="Get the app"
            title="Download M4ster-5IN1"
            blurb="Pick your platform below. All builds are free, offline, and ad-free — same app, every screen."
          />
        </Reveal>

        <div className="mx-auto -mt-4 grid max-w-5xl gap-4 sm:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100} className="h-full">
              <div className="card-alive flex h-full flex-col rounded-2xl border border-edge bg-panel px-6 py-8">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                  {p.desc}
                </p>
                <a
                  href={p.href}
                  className="btn-alive download-btn mt-6 inline-block rounded-xl bg-arcade px-8 py-3 text-base font-bold text-ink shadow-lg shadow-cyan-500/20 hover:bg-cyan-300"
                >
                  {p.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <div className="mt-10 flex justify-center">
            <InstallApp />
          </div>
        </Reveal>

        <Reveal delay={320}>
          <dl className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
            {[
              { term: "Requires", detail: SYS_REQUIREMENTS.os },
              { term: "Chip", detail: SYS_REQUIREMENTS.chip },
              { term: "Signing", detail: SYS_REQUIREMENTS.signing },
            ].map((r) => (
              <div
                key={r.term}
                className="card-alive rounded-xl border border-edge bg-panel px-5 py-4"
              >
                <dt className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  {r.term}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-100">
                  {r.detail}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={420}>
          <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-slate-400">
            Every release is built from the same codebase —{" "}
            <strong className="text-slate-200">change once, push everywhere</strong>.
            Web deploys automatically, desktop and mobile builds run on every
            version tag.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
