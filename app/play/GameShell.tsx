import Link from "next/link";
import AuraBackground from "../components/AuraBackground";

/* Shared wrapper for every /play/<game> page: back link, title,
   and the same centered panel the demos use. */

export default function GameShell({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-2xl text-center">
      <AuraBackground />
      <Link
        href="/play"
        className="btn-alive mb-6 inline-block text-xs font-semibold tracking-widest text-slate-500 uppercase hover:text-arcade"
      >
        ← All games
      </Link>
      <p className="pop-in mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
        Playable in your browser
      </p>
      <h1
        className="pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        style={{ "--pop-delay": "80ms" } as React.CSSProperties}
      >
        {title}
      </h1>
      <p
        className="pop-in mt-3 text-sm text-slate-400"
        style={{ "--pop-delay": "160ms" } as React.CSSProperties}
      >
        {tagline}
      </p>
      <div
        className="pop-in mt-8"
        style={{ "--pop-delay": "240ms" } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
