import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import LaddersGame from "./LaddersGame";

export const metadata: Metadata = {
  title: "Snakes & Ladders — 5IN1 web play",
  description: "Play Snakes & Ladders in your browser vs the CPU.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <GameShell
          title="Snakes & Ladders"
          tagline="Climb ladders, dodge snakes — exact roll to win, same as the 5IN1 app."
        >
          <LaddersGame />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
