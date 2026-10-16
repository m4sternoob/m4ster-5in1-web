import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import SnakeGame from "./SnakeGame";

export const metadata: Metadata = {
  title: "Snake — 5IN1 web play",
  description: "Play Snake in your browser — eat dots, chase golden food.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <GameShell
          title="Snake"
          tagline="The classic, with speeds, wrap walls, and golden food — same rules as the 5IN1 app."
        >
          <SnakeGame />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
