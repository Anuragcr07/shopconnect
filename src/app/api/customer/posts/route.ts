import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = Redis.fromEnv();

// GET: Fetch all posts for the logged-in customer (History)
export async function GET() {
  const session = await getServerSession(authOptions);

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

    return NextResponse.json(customerPosts || [], { status: 200 });
  } catch (error) {
    console.error('DATABASE_ERROR:', error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST: Create a new requirement and index it in Redis Geospatial
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, latitude, longitude } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    // 1. Update the customer's location in the User model
    // This keeps the profile location up-to-date with their last post
    if (latitude && longitude) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude) 
        }
      });
    }

    // 2. Create the Requirement Post in PostgreSQL
    const newPost = await prisma.customerPost.create({
      data: {
        title,
        description: description || "",
        customerId: session.user.id,
        status: "OPEN"
      },
    });

    // 3. INDEX IN REDIS GEOSPATIAL
    // We add the postId to the 'active_posts' geospatial index.
    // Important: Redis GEOADD uses the order: Longitude, Latitude.
    if (latitude && longitude) {
      await redis.geoadd("active_posts", {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        member: newPost.id,
      });
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('POST_CREATION_ERROR:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}