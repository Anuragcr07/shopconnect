import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PriceComparisonSection from "@/components/PriceComparisonSection"; 

export default function Home() {
  return (
    <div className="flex w-full flex-col overflow-hidden bg-white">
      <HeroSection />
      <PriceComparisonSection />
      <HowItWorksSection />
    </div>
  );
}
