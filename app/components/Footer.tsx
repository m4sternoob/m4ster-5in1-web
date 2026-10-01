import { CONTACT_EMAIL, GITHUB_URL } from "../data/site";

/* Site footer: contact, repo link, and a small disclaimer. */

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-edge bg-panel/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-white">
            5<span className="text-arcade">IN</span>1
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Five games, one native macOS app. Built by m4sternoob.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 text-sm sm:items-end">
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
            GitHub — m4sternoob/guessing-game-gui
          </a>
        </div>
      </div>
      <p className="border-t border-edge px-4 py-4 text-center text-xs text-slate-500">
        Free and open-source. Built with SwiftUI + SpriteKit.
      </p>
    </footer>
  );
}
