import Link from "next/link";

/* Prominent back-to-hub button at the top-left of every /play/<game> page.
   Real button styling (not a muted text link) so players can always
   find their way back to the menu. Touch-friendly 44px target. */

export default function BackToGames() {
  return (
    <div className="mb-6 flex w-full justify-start">
      <Link
        href="/play"
        aria-label="Back to all games"
        className="btn-alive inline-flex min-h-[44px] items-center gap-2 rounded-full border border-edge bg-panel/90 px-5 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur transition-all hover:border-arcade/60 hover:text-white hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
      >
        <span aria-hidden="true" className="text-arcade">
          ←
        </span>
        All games
      </Link>
    </div>
  );
}
