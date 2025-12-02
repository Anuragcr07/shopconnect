import { NextResponse } from "next/server";

// This simulates the response you would get from scraping
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("item");

  if (!query) {
    return NextResponse.json({ error: "Item name required" }, { status: 400 });
  }

  // SIMULATED LATENCY (To look like real searching)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In a real app, you would use Puppeteer here to scrape blinkit.com, zepto.co, etc.
  // For now, we generate realistic mock data based on the query.

  const basePrice = Math.floor(Math.random() * 100) + 20; // Random base price

  const results = [
    {
      app: "Blinkit",
      color: "bg-yellow-400",
      textColor: "text-black",
      productName: `${query} (Fresh)`,
      price: basePrice,
      deliveryTime: "10 mins",
      available: true,
      image: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Blinkit_logo.png", // Placeholder
    },
    {
      app: "Zepto",
      color: "bg-purple-600",
      textColor: "text-white",
      productName: `Premium ${query}`,
      price: basePrice + Math.floor(Math.random() * 20) - 5, // Slightly different price
      deliveryTime: "8 mins",
      available: true,
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Zepto_logo.svg/2560px-Zepto_logo.svg.png",
    },
    {
      app: "Swiggy Instamart",
      color: "bg-orange-500",
      textColor: "text-white",
      productName: `${query} Standard`,
      price: basePrice + Math.floor(Math.random() * 15),
      deliveryTime: "15 mins",
      available: Math.random() > 0.3, // 30% chance of being out of stock
      image: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/2560px-Swiggy_logo.svg.png",
    },
  ];

  // Sort by price (Lowest first)
  results.sort((a, b) => a.price - b.price);

  return NextResponse.json({ results });
}