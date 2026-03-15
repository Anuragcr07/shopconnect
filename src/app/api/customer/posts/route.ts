import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Check if session and ID exist
  if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, latitude, longitude } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    // Convert coordinates and validate they are valid numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const isValidLocation = !isNaN(lat) && !isNaN(lng);

    // 1. Update the customer's location in the User model
    if (isValidLocation) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          latitude: lat,
          longitude: lng,
        },
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

    // 3. Index in Redis Geospatial only if location is valid
    if (isValidLocation) {
      try {
        await redis.geoadd("active_posts", {
          longitude: lng,
          latitude: lat,
          member: newPost.id,
        });
      } catch (redisError) {
        console.error("REDIS_GEOADD_ERROR:", redisError);
        // We don't necessarily want to crash the whole request if Redis fails
      }
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error('POST_CREATION_ERROR:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}