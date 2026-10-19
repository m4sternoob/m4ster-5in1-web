import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import Connect4Game from "./Connect4Game";

export const metadata: Metadata = {
  title: "Connect 4 — M4STER-5IN1",
  description:
    "Play Connect 4 free in your browser against the CPU — drop discs, line up four, win. No download, no account.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-0 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-16">
        <GameShell
          title="Connect 4"
          tagline="Drop discs, line up four — the CPU blocks and takes wins on Hard."
        >
          <Connect4Game />
        </GameShell>
      </main>
      <Footer />
    </div>
  );
}
