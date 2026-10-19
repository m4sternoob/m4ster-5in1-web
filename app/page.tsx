import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Games from "./components/Games";
import Download from "./components/Download";
import Roadmap from "./components/Roadmap";
import TechStack from "./components/TechStack";
import Footer from "./components/Footer";
import RgbSeparator from "./components/RgbSeparator";
import ScrollReveal from "./components/ScrollReveal";

/* M4ster-5IN1 marketing site: hero, game lineup, download, roadmap, tech stack.
   The alive background (aura + tile grid) comes from the root layout.
   Each section unlocks on scroll with its own animation flavor. */

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <RgbSeparator />
        <ScrollReveal variant="scale-in">
          <Games />
        </ScrollReveal>
        <RgbSeparator />
        <ScrollReveal variant="fade-up">
          <Download />
        </ScrollReveal>
        <RgbSeparator />
        <ScrollReveal variant="slide-left">
          <Roadmap />
        </ScrollReveal>
        <RgbSeparator />
        <ScrollReveal variant="blur-in">
          <TechStack />
        </ScrollReveal>
      </main>
      <RgbSeparator />
      <Footer />
    </div>
  );
}
