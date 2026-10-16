import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import LudoGame from "./LudoGame";

export const metadata: Metadata = {
  title: "Ludo — 5IN1 web play",
  description: "Play Ludo in your browser vs the CPU.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <GameShell
          title="Ludo"
          tagline="Roll a 6 to leave base, capture rivals, bring both tokens home — same as the 5IN1 app."
        >
          <LudoGame />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
