import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      <HeroSection />
      <HowItWorksSection />
    </main>
  );
}