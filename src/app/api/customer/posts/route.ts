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
        customer: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
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

  if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, latitude, longitude } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);
    let isValidLocation = !isNaN(lat) && !isNaN(lng);

    if (!isValidLocation) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { latitude: true, longitude: true },
      });
      if (user && user.latitude !== null && user.longitude !== null) {
        lat = user.latitude;
        lng = user.longitude;
        isValidLocation = true;
      }
    }

    const hasNewLocation = !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
    if (hasNewLocation && isValidLocation) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          latitude: lat,
          longitude: lng,
        },
      });
    }

    const newPost = await prisma.customerPost.create({
      data: {
        title,
        description: description || "",
        customerId: session.user.id,
        status: "OPEN"
      },
    });

    if (isValidLocation) {
      try {
        await redis.geoadd("active_posts", {
          longitude: lng,
          latitude: lat,
          member: newPost.id,
        });
      } catch (redisError) {
        console.error("REDIS_GEOADD_ERROR:", redisError);
      }
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: unknown) {
    console.error('POST_CREATION_ERROR:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
