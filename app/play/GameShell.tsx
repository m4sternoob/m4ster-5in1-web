import Link from "next/link";

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
      <Link
        href="/play"
        className="mb-6 inline-block text-xs font-semibold tracking-widest text-slate-500 uppercase hover:text-arcade"
      >
        ← All games
      </Link>
      <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
        Playable in your browser
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-slate-400">{tagline}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
