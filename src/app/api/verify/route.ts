import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json({ message: "Invalid verification link" }, { status: 400 });
  }

  // 1. Find the token
  const verifiedToken = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: token }
  });

  if (!verifiedToken || verifiedToken.expires < new Date()) {
    return NextResponse.json({ message: "Token invalid or expired" }, { status: 400 });
  }

  // 2. Update User emailVerified
  await prisma.user.update({
    where: { email: email },
    data: { emailVerified: new Date() }
  });

  // 3. Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verifiedToken.id }
  });

  // 4. Redirect to login with success message
  return NextResponse.redirect(new URL('/login?verified=true', req.url));
}