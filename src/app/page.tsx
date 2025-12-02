import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PriceComparisonSection from "@/components/PriceComparisonSection"; // Import the new component

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      <HeroSection />
      
      {/* Add the Comparison Section here */}
      <PriceComparisonSection />
      
      <HowItWorksSection />
    </main>
  );
}