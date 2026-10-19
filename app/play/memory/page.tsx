import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import MemoryGame from "./MemoryGame";

export const metadata: Metadata = {
  title: "Memory Match — M4ster-5IN1",
  description:
    "Play Memory Match free in your browser — flip cards with real 3D animation, find all pairs in as few moves as possible. No download, no account.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-0 pt-32 pb-10 sm:px-6 sm:pt-28 sm:pb-16">
        <GameShell
          title="Memory Match"
          tagline="Flip the cards, find the pairs — three sizes, same as the M4ster-5IN1 app."
        >
          <MemoryGame />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
