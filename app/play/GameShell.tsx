import AuraBackground from "../components/AuraBackground";
import BackToGames from "./BackToGames";
import FullscreenButton from "./FullscreenButton";
import VolumeControl from "./VolumeControl";

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
      {/* BackToGames must stay a direct child of this tall root: a sticky
          element can only travel within its parent's box, and inside the
          short header wrapper below it ran out of parent after ~250px and
          scrolled away with the header — over a tall board or the online
          lobby (worst inside a short iframe viewport) there was no back
          control anywhere on screen. As a root child its sticky range is
          the full page, so the pill stays pinned in every state. */}
      <BackToGames className="px-4 sm:px-0" />
      <div className="px-4 sm:px-0">
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
          <VolumeControl />
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
