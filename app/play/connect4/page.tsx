import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GameShell from "../GameShell";
import Connect4Game from "./Connect4Game";

export const metadata: Metadata = {
  title: "Connect 4 — 5IN1 web play",
  description: "Play Connect 4 in your browser against the CPU.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
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
