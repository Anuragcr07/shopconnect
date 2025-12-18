import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
// Import the new component
import PriceComparisonSection from "@/components/PriceComparisonSection"; 

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center w-full bg-white">
      {/* 1. Hero Section (Your existing code) */}
      <HeroSection />

      {/* 2. Price Comparison Tool (The new feature) */}
      {/* We place it here so users see it immediately after the intro */}
      <PriceComparisonSection />

      {/* 3. Features / How it Works (Your existing code) */}
      <HowItWorksSection />
    </main>
  );
}