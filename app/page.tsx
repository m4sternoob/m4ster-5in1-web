import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Games from "./components/Games";
import Download from "./components/Download";
import Roadmap from "./components/Roadmap";
import TechStack from "./components/TechStack";
import Footer from "./components/Footer";

/* 5IN1 marketing site: hero, game lineup, download, roadmap, tech stack. */

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Games />
        <Download />
        <Roadmap />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
}
