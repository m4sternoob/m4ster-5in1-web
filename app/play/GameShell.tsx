import AuraBackground from "../components/AuraBackground";
import BackToGames from "./BackToGames";
import FullscreenButton from "./FullscreenButton";

/* Shared wrapper for every /play/<game> page: back link, title,
   and the same centered panel the demos use. Full width on mobile
   (edge-to-edge game), centered max-width from sm up. */

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
    <div className="w-full text-center sm:max-w-2xl md:pt-10">
      <AuraBackground />
      <div className="px-4 sm:px-0">
        <BackToGames />
        <p className="pop-in mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
          Playable in your browser
        </p>
        <div
          className="pop-in flex items-center justify-center gap-3"
          style={{ "--pop-delay": "80ms" } as React.CSSProperties}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <FullscreenButton />
        </div>
        <p
          className="pop-in mt-3 text-sm text-slate-400"
          style={{ "--pop-delay": "160ms" } as React.CSSProperties}
        >
          {tagline}
        </p>
      </div>
      <div
        className="pop-in mt-8"
        style={{ "--pop-delay": "240ms" } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
