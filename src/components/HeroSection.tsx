"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function HeroSection() {
  const textRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);

  // Anime.js fade-up animation for text and metrics
  useEffect(() => {
    if (!textRef.current || !metricsRef.current) return;

    anime({
      targets: textRef.current.querySelectorAll(".fade-up-text"),
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(150),
      easing: "easeOutExpo",
      duration: 1000,
    });

    anime({
      targets: metricsRef.current.querySelectorAll(".fade-up-metric"),
      translateY: [40, 0],
      opacity: [0, 1],
      delay: anime.stagger(200, { start: 500 }), // Delay metrics slightly after text
      easing: "easeOutQuad",
      duration: 800,
    });
  }, []);

  return (
    <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-900 to-blue-900 text-white flex flex-col justify-center items-center p-8 overflow-hidden">
      {/* Background pattern for dashboard feel */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 0h-2v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div ref={textRef} className="relative z-10 text-center mb-12">
        <h1 className="fade-up-text text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg leading-tight">
          Welcome to Your <span className="text-blue-400">LocalTrade Hub</span>
        </h1>
        <p className="fade-up-text text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
          Access real-time insights, manage your local connections, and grow your business with our intuitive dashboard.
        </p>
      </div>

      {/* Dashboard Metrics Cards */}
      <div ref={metricsRef} className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <div className="fade-up-metric bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-blue-700/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-white/15">
          <h3 className="text-5xl font-bold text-white mb-2">1,245</h3>
          <p className="text-blue-200 text-lg">Active Local Shops</p>
        </div>
        <div className="fade-up-metric bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-blue-700/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-white/15">
          <h3 className="text-5xl font-bold text-white mb-2">8,700+</h3>
          <p className="text-blue-200 text-lg">Daily User Inquiries</p>
        </div>
        <div className="fade-up-metric bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-blue-700/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-white/15">
          <h3 className="text-5xl font-bold text-white mb-2">4.8/5</h3>
          <p className="text-blue-200 text-lg">Average Shop Rating</p>
        </div>
      </div>

      <button
        onClick={() => alert("Dashboard Login or Signup!")}
        className="relative z-10 mt-16 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-semibold shadow-lg transition-transform hover:scale-105 transform active:scale-95 text-xl"
      >
        Go to Dashboard
      </button>
    </section>
  );
}