// src/app/api/customer/posts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Create a new customer post
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const newPost = await prisma.customerPost.create({
      data: {
        title,
        description: description || null,
        customerId: session.user.id,
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating customer post:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Get all customer posts for the logged-in customer, with responses
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerPosts = await prisma.customerPost.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        responses: {
          include: {
            shopkeeper: {
              select: {
                id: true,
                name: true,
                shopName: true,
                address: true,
                phone: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(customerPosts, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer posts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}