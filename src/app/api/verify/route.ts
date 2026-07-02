

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!token || !email) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`);
    }

    if (token.length !== 64 || !/^[0-9a-f]+$/.test(token)) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`);
    }

    const verifiedToken = await prisma.verificationToken.findFirst({
      where: { identifier: email.toLowerCase().trim() },
    });

   
    if (!verifiedToken) {
      return NextResponse.redirect(`${baseUrl}/login?error=Expired`);
    }

    const expectedBuffer = Buffer.from(verifiedToken.token);
    const actualBuffer = Buffer.from(token);

    const tokensMatch =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (!tokensMatch || verifiedToken.expires < new Date()) {
      return NextResponse.redirect(`${baseUrl}/login?error=Expired`);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: email.toLowerCase().trim() },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { id: verifiedToken.id },
      }),
    ]);

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error("VERIFICATION_ERROR:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/login?error=ServerError`);
  }
}