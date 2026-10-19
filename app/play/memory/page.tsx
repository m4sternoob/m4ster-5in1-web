import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import MemoryGame from "./MemoryGame";

export const metadata: Metadata = {
  title: "Memory Match — M4STER-5IN1",
  description:
    "Play Memory Match free in your browser — flip cards with real 3D animation, find all pairs in as few moves as possible. No download, no account.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <GameShell
          title="Memory Match"
          tagline="Flip the cards, find the pairs — three sizes, same as the 5IN1 app."
        >
          <MemoryGame />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
