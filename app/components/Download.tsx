import SectionHeading from "./SectionHeading";
import { RELEASES_URL, SYS_REQUIREMENTS } from "../data/site";

/* Download section: one prominent releases link, honest system requirements,
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
          title="Download 5IN1 for Mac"
          blurb="Grab the latest build from the GitHub releases page. Free forever."
        />
        <div className="-mt-4">
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-arcade px-10 py-4 text-base font-bold text-ink shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.03] hover:bg-cyan-300"
          >
            Download latest release
          </a>
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
          right-click the app and choose <em>Open</em> once, and it will launch
          fine after that.
        </p>
      </div>
    </section>
  );
}
