import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import SnakeGame from "./SnakeGame";

export const metadata: Metadata = {
  title: "Snake — M4STER-5IN1",
  description:
    "Play Snake free in your browser — eat dots, chain 3 in a row for golden bonus food (5x points), chase the high score. No download, no account.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-0 pt-32 pb-10 sm:px-6 sm:pt-28 sm:pb-16">
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
