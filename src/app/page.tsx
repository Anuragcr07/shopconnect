import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PriceComparisonSection from "@/components/PriceComparisonSection"; 

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center w-full bg-white">
      <HeroSection />


      <PriceComparisonSection />

      <HowItWorksSection />
    </main>
  );
}