import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const postId = params.postId;

  try {
    const post = await prisma.customerPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (post.customerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You do not own this post' },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.customerPost.update({
      where: { id: postId },
      data: { status: 'FULFILLED' },
    });

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error(`Error fulfilling post ${postId}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
