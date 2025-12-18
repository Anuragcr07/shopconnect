"use client";

import { useState } from "react";
import { Search, ExternalLink, ArrowRight } from "lucide-react";

export default function QuickLinksSection() {
  const [query, setQuery] = useState("");
  const [showLinks, setShowLinks] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowLinks(true);
  };

  // Helper to generate links
  const getLinks = (term: string) => {
    const encoded = encodeURIComponent(term);
    return {
      blinkit: `https://blinkit.com/s/?q=${encoded}`,
      zepto: `https://www.zeptonow.com/search?query=${encoded}`,
      swiggy: `https://www.swiggy.com/instamart/search?custom_back=true&query=${encoded}`,
    };
  };

  const links = getLinks(query);

  return (
    <section className="py-24 px-4 w-full bg-white flex flex-col items-center min-h-[600px] relative overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-5xl w-full text-center relative z-10">
        
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Find it <span className="text-blue-600">Fast</span>
        </h2>
        <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
          Searching for an item? Type it once here, and instantly open the search results across all major delivery apps.
        </p>

        {/* --- SEARCH BAR --- */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-16 group">
          <div className="absolute inset-0 bg-blue-200 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative flex items-center bg-white rounded-full shadow-xl border border-gray-100 p-2">
            <Search className="ml-4 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="What are you looking for? (e.g., Milk, Bread)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === "") setShowLinks(false);
              }}
              className="w-full p-4 bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Find Item
            </button>
          </div>
        </form>

        {/* --- DIRECT LINKS CARDS --- */}
        
        {/* State: Initial State (Logos) */}
        {!showLinks && (
           <div className="flex justify-center gap-8 opacity-40 grayscale">
              <div className="text-2xl font-bold text-gray-400">Blinkit</div>
              <div className="text-2xl font-bold text-gray-400">Zepto</div>
              <div className="text-2xl font-bold text-gray-400">Swiggy</div>
           </div>
        )}

        {/* State: Active Links */}
        {showLinks && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch animate-fade-in">
            
            {/* Blinkit Card */}
            <a 
              href={links.blinkit} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex flex-col bg-yellow-50 border border-yellow-200 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
            >
              <div className="w-16 h-16 bg-yellow-400 text-black rounded-2xl flex items-center justify-center font-bold text-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                B
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-yellow-700 transition-colors text-left">
                Blinkit
              </h3>
              <p className="text-gray-600 text-left mb-6">
                Search for <span className="font-semibold text-gray-900">"{query}"</span> on Blinkit.
              </p>
              <div className="mt-auto flex items-center text-yellow-700 font-semibold group-hover:translate-x-2 transition-transform">
                Open App <ExternalLink className="w-4 h-4 ml-2" />
              </div>
            </a>

            {/* Zepto Card */}
            <a 
              href={links.zepto} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex flex-col bg-purple-50 border border-purple-200 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
            >
              <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                Z
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors text-left">
                Zepto
              </h3>
              <p className="text-gray-600 text-left mb-6">
                Search for <span className="font-semibold text-gray-900">"{query}"</span> on Zepto.
              </p>
              <div className="mt-auto flex items-center text-purple-700 font-semibold group-hover:translate-x-2 transition-transform">
                Open App <ExternalLink className="w-4 h-4 ml-2" />
              </div>
            </a>

            {/* Swiggy Card */}
            <a 
              href={links.swiggy} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex flex-col bg-orange-50 border border-orange-200 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
            >
              <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                S
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-orange-700 transition-colors text-left">
                Instamart
              </h3>
              <p className="text-gray-600 text-left mb-6">
                Search for <span className="font-semibold text-gray-900">"{query}"</span> on Swiggy.
              </p>
              <div className="mt-auto flex items-center text-orange-700 font-semibold group-hover:translate-x-2 transition-transform">
                Open App <ExternalLink className="w-4 h-4 ml-2" />
              </div>
            </a>

          </div>
        )}
      </div>
    </section>
  );
}