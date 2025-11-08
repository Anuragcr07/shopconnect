import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SHOPKEEPER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { latitude, longitude },
    });

    return NextResponse.json({ message: "Location updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SHOPKEEPER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true },
    });
    return NextResponse.json(user || {}, { status: 200 });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
