// src/app/api/shopkeeper/requests/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SHOPKEEPER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // In a real app, you'd want to filter by location/radius
  // For now, fetch all OPEN posts that the current shopkeeper hasn't responded to,
  // or posts they have responded to to show their response history.
  try {
    const customerPosts = await prisma.customerPost.findMany({
      where: {
        status: 'OPEN',
        // Optional: Filter out posts the current shopkeeper has already responded to
        NOT: {
          responses: {
            some: {
              shopkeeperId: session.user.id,
            },
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: { // Include existing responses to check if shopkeeper has already replied
          select: {
            id: true,
            shopkeeperId: true,
            isAvailable: true,
            message: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(customerPosts, { status: 200 });
  } catch (error) {
    console.error('Error fetching shop requests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}