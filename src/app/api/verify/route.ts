import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!token || !email) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`);
    }

    const verifiedToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token: token }
    });

    if (!verifiedToken || verifiedToken.expires < new Date()) {
      return NextResponse.redirect(`${baseUrl}/login?error=Expired`);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: email },
        data: { emailVerified: new Date() }
      }),
      prisma.verificationToken.delete({
        where: { id: verifiedToken.id }
      })
    ]);

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);

  } catch (error) {
    console.error("Verification error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/login?error=ServerError`);
  }
}