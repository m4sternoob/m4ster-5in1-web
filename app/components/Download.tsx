import SectionHeading from "./SectionHeading";
import { RELEASES_URL, ANDROID_RELEASES_URL, SYS_REQUIREMENTS } from "../data/site";

/* Download section: Mac + Android releases, honest system requirements,
   and a note about the ad-hoc signature so users know what to expect. */

export default function Download() {
  return (
    <section
      id="download"
      className="scroll-mt-20 border-y border-edge bg-panel/50 px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeading
          eyebrow="Get the app"
          title="Download 5IN1"
          blurb="Pick your platform below. Both builds are free, offline, and ad-free."
        />

        <div className="mx-auto -mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
          {/* macOS */}
          <div className="rounded-2xl border border-edge bg-panel px-6 py-8">
            <h3 className="text-lg font-bold text-white">macOS</h3>
            <p className="mt-1 text-sm text-slate-400">
              v3.2.1 is built and in playtesting — the public release lands once
              testing passes.
            </p>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-xl bg-arcade px-8 py-3 text-base font-bold text-ink shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.03] hover:bg-cyan-300"
            >
              Mac releases
            </a>
          </div>

          {/* Android */}
          <div className="rounded-2xl border border-edge bg-panel px-6 py-8">
            <h3 className="text-lg font-bold text-white">Android</h3>
            <p className="mt-1 text-sm text-slate-400">
              v1.4.0 is out now — five games plus Memory Match, in with-hints
              and no-hints variants. Fully offline, no ads, no accounts.
            </p>
            <a
              href={ANDROID_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-xl bg-arcade px-8 py-3 text-base font-bold text-ink shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.03] hover:bg-cyan-300"
            >
              Android releases
            </a>
          </div>
        </div>

        <dl className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
          {[
            { term: "Requires", detail: SYS_REQUIREMENTS.os },
            { term: "Chip", detail: SYS_REQUIREMENTS.chip },
            { term: "Signing", detail: SYS_REQUIREMENTS.signing },
          ].map((r) => (
            <div
              key={r.term}
              className="rounded-xl border border-edge bg-panel px-5 py-4"
            >
              <dt className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                {r.term}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                {r.detail}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mx-auto mt-8 max-w-2xl text-sm text-slate-400">
          The build is <strong className="text-slate-200">ad-hoc signed</strong>
          , not notarized by Apple. On first launch, macOS may warn you —
          right-click the app and choose <em>Open</em> once. No public Mac
          release is published yet — v3.2.1 is still in playtesting.
        </p>
      </div>
    </section>
  );
}
