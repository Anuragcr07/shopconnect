import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch all posts for the logged-in customer
export async function GET() {
  const session = await getServerSession(authOptions);

  // Security check: must be logged in as a CUSTOMER
  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerPosts = await prisma.customerPost.findMany({
      where: { customerId: session.user.id },
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
      orderBy: { createdAt: 'desc' },
    });

    // Ensure we always return an array, even if empty
    return NextResponse.json(customerPosts || [], { status: 200 });
  } catch (error) {
    console.error('DATABASE_ERROR:', error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST: Create a new requirement
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
        description: description || "",
        customerId: session.user.id,
        status: "OPEN"
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('CREATE_POST_ERROR:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}