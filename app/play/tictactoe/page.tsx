import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import TicTacToeDemo from "../TicTacToeDemo";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe — 5IN1 web play",
  description: "Play Tic-Tac-Toe in your browser against the minimax CPU.",
};

/* The existing demo keeps its own header, so this page just frames it. */

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <div className="flex w-full flex-col items-center">
          <Link
            href="/play"
            className="mb-6 text-xs font-semibold tracking-widest text-slate-500 uppercase hover:text-arcade"
          >
            ← All games
          </Link>
          <TicTacToeDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}
