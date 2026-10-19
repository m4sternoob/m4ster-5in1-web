import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BackToGames from "../BackToGames";
import GuessingDemo from "../GuessingDemo";

export const metadata: Metadata = {
  title: "Number Guessing — 5IN1 web play",
  description: "Play the Number Guessing Game in your browser.",
};

/* The existing demo keeps its own header, so this page just frames it. */

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <div className="flex w-full flex-col items-center">
          <BackToGames />
          <GuessingDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}
