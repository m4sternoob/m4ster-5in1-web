import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BackToGames from "../BackToGames";
import TicTacToeDemo from "../TicTacToeDemo";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe — M4STER-5IN1",
  description:
    "Play Tic-Tac-Toe free in your browser against an unbeatable minimax CPU. No download, no account.",
};

/* The existing demo keeps its own header, so this page just frames it. */

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <div className="flex w-full flex-col items-center md:pt-10">
          <BackToGames />
          <TicTacToeDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}
