import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TicTacToeDemo from "./TicTacToeDemo";

export const metadata: Metadata = {
  title: "Play the Tic-Tac-Toe demo — 5IN1",
  description:
    "Try 5IN1's Tic-Tac-Toe against an unbeatable minimax CPU, right in your browser.",
};

/* /play: the playable Tic-Tac-Toe demo page. */

export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <TicTacToeDemo />
      </main>
      <Footer />
    </div>
  );
}
