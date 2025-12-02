"use client";

import { useState } from "react";
import { Search, ShoppingCart, Clock, XCircle, CheckCircle } from "lucide-react";

interface ProductResult {
  app: string;
  color: string;
  textColor: string;
  productName: string;
  price: number;
  deliveryTime: string;
  available: boolean;
}

export default function PriceComparisonSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]);

    try {
      const res = await fetch(`/api/compare-prices?item=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Failed to fetch prices", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 w-full bg-white flex flex-col items-center min-h-[600px]">
      <div className="max-w-4xl w-full text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Compare & Save Instantly
        </h2>
        <p className="text-gray-500 mb-10">
          Search for an item (e.g., "Milk", "Bread", "Coke") and see prices across Blinkit, Zepto, and Instamart.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-16">
          <input
            type="text"
            placeholder="What do you want to buy today?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-5 pl-14 rounded-full border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg transition-all"
          />
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full font-medium transition-colors disabled:bg-blue-300"
          >
            {loading ? "Scanning..." : "Compare"}
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 animate-pulse">Fetching live prices from delivery apps...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && hasSearched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((item, index) => (
              <div
                key={item.app}
                className={`relative group rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl ${
                  index === 0 ? "border-green-400 ring-2 ring-green-100 scale-105 z-10 bg-green-50/30" : "border-gray-100 bg-white"
                }`}
              >
                {/* Best Value Badge */}
                {index === 0 && item.available && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">
                    Cheapest Option
                  </div>
                )}

                {/* App Header */}
                <div className={`${item.color} ${item.textColor} rounded-lg py-2 px-4 text-center font-bold text-lg mb-6 shadow-sm`}>
                  {item.app}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 text-xl truncate">
                    {item.productName}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-2">
                    {item.available ? (
                      <span className="text-4xl font-extrabold text-gray-900">₹{item.price}</span>
                    ) : (
                      <span className="text-2xl font-bold text-red-500">Out of Stock</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100 mt-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{item.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.available ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span>{item.available ? "In Stock" : "Unavailable"}</span>
                    </div>
                  </div>

                  <button 
                    disabled={!item.available}
                    onClick={() => alert(`Redirecting to ${item.app}...`)}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                      item.available 
                      ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {item.available ? "Order Now" : "Sold Out"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}