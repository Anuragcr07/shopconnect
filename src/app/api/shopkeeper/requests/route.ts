import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SHOPKEEPER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const shopkeeper = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true }
    });

    if (!shopkeeper?.latitude || !shopkeeper?.longitude) {
      return NextResponse.json({ message: 'Location not set' }, { status: 400 });
    }

   
    const geoResults = await redis.geosearch<string>(
      "active_posts",
      {
        type: "FROMLONLAT",
        coordinate: {
          lon: shopkeeper.longitude,
          lat: shopkeeper.latitude
        }
      },
      {
        type: "BYRADIUS",
        radius: 10,
        radiusType: "KM"
      },
      "ASC"
    );

    const nearbyPostIds = geoResults.map((item) => item.member);

    if (!nearbyPostIds || nearbyPostIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const posts = await prisma.customerPost.findMany({
      where: {
        id: { in: nearbyPostIds },
        status: 'OPEN',
        NOT: {
          responses: {
            some: { shopkeeperId: session.user.id }
          }
        }
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        responses: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('Redis Geo Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
