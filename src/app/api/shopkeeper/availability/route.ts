import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SHOPKEEPER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerPostId, isAvailable, message, imageUrls } = await req.json();

    if (!customerPostId || typeof isAvailable !== 'boolean') {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if the shopkeeper has already responded to this post
    const existingResponse = await prisma.shopRequest.findFirst({
      where: {
        customerPostId: customerPostId,
        shopkeeperId: session.user.id,
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { message: 'You have already responded to this post' },
        { status: 409 }
      );
    }

    const shopRequest = await prisma.shopRequest.create({
      data: {
        customerPostId,
        shopkeeperId: session.user.id,
        isAvailable,
        message,
        imageUrls: imageUrls || [], // ✅ save Cloudinary image URLs
      },
    });

    return NextResponse.json(shopRequest, { status: 201 });
  } catch (error) {
    console.error('Error in /api/shopkeeper/availability POST:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
