import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlayTabs from "./PlayTabs";

export const metadata: Metadata = {
  title: "Play the demos — 5IN1",
  description:
    "Try 5IN1's Guessing Game and Tic-Tac-Toe against the minimax CPU, right in your browser.",
};

/* /play: the playable web demos — a small taste of two 5IN1 games.
   The full games (and the rest of the lineup) ship in the Mac app. */

export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <PlayTabs />
      </main>
      <Footer />
    </div>
  );
}
