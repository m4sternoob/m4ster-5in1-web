import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BackToGames from "../BackToGames";
import GuessingDemo from "../GuessingDemo";

export const metadata: Metadata = {
  title: "Number Guessing — M4STER-5IN1",
  description:
    "Play the Number Guessing Game free in your browser — pick a difficulty, beat the attempts limit, track your streak. No download, no account.",
};

/* The existing demo keeps its own header, so this page just frames it. */

export default function Page() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-0 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-16">
        <div className="flex w-full flex-col items-center md:pt-10">
          <BackToGames />
          <GuessingDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}
