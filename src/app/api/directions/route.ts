import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { start, end } = await req.json();

    if (!start || !end) {
      return NextResponse.json({ message: "Missing coordinates" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": apiKey || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ message: "Routing failed", error: err }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Directions API error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
