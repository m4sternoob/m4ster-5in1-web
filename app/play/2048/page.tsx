import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import Game2048 from "./Game2048";

export const metadata: Metadata = {
  title: "2048 — 5IN1 web play",
  description: "Play 2048 in your browser — merge tiles to 2048.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <GameShell
          title="2048"
          tagline="The same tile-merging puzzle from the 5IN1 app — chase the 2048 tile."
        >
          <Game2048 />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
