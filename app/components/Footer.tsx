import { CONTACT_EMAIL, GITHUB_URL } from "../data/site";
import AliveLogo from "./AliveLogo";

/* Site footer: contact, repo link, and a small disclaimer.
   Brand mark is the 5x alive logo, fluid via clamp(). */

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-edge bg-[linear-gradient(180deg,rgba(11,14,20,0.88),rgba(19,25,43,0.92))] backdrop-blur-md">
      {/* RGB separator as the glowing top border. The border-edge line
          stays as a fallback when RGB is disabled. */}
      <div
        className="rgb-sep pointer-events-none absolute inset-x-0 top-0"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="shrink-0">
          <AliveLogo size="md" />
          <p className="mt-3 text-sm text-slate-400">
            Five games, every platform. Built by m4sternoob.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 text-sm sm:items-end">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-slate-300 transition-colors hover:text-arcade"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 transition-colors hover:text-arcade"
          >
            GitHub — m4sternoob/m4ster-5in1-web
          </a>
        </div>
      </div>
      <p className="border-t border-edge px-4 py-4 text-center text-xs text-slate-400">
        Free and open-source. One codebase — web, Windows, macOS, Android, iOS.
      </p>
    </footer>
  );
}
