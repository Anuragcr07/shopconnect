"use client";

import { useRef, useEffect } from "react";
import anime from "animejs";

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode; // Using React.ReactNode for SVG icons
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const features: Feature[] = [
    {
      title: "Smart Inquiry System",
      desc: "Effortlessly post your needs and preferences, reaching relevant local businesses instantly.",
      icon: (
        <svg
          className="w-16 h-16 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      ),
    },
    {
      title: "Local Offer Matching",
      desc: "Receive and compare tailored offers from nearby shops, ensuring you get the best deal.",
      icon: (
        <svg
          className="w-16 h-16 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 12l3-3m0 0l3 3m-3-3v6m-4-2h8m4 0a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      ),
    },
    {
      title: "Seamless Transactions",
      desc: "Connect directly with sellers, arrange delivery or pickup, and complete purchases securely.",
      icon: (
        <svg
          className="w-16 h-16 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h18M7 15h10m-9 4h8a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2z"
          ></path>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target.querySelectorAll(".feature-card"),
              opacity: [0, 1],
              translateY: [40, 0],
              delay: anime.stagger(150),
              duration: 700,
              easing: "easeOutQuad",
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-6 bg-gray-50 text-center flex flex-col items-center"
    >
      <h2 className="text-4xl font-bold mb-14 text-gray-800">Platform Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl">
        {features.map((feature, i) => (
          <div
            key={i}
            className="feature-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-2 opacity-0 flex flex-col items-center border border-gray-100"
          >
            <div className="mb-6 w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center p-4">
              {feature.icon}
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed text-center">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}