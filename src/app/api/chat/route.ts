// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, customerPostId, shopkeeperId, conversationId, content, messageIds } = body;

    // 1. Initialize Chat
    if (action === "init") {
      let conversation = await prisma.conversation.findFirst({
        where: { customerPostId, shopkeeperId },
        include: { 
          messages: { 
            orderBy: { createdAt: "asc" } 
          },
          customer: {
            select: { id: true, name: true, image: true }
          },
          shopkeeper: {
            select: { id: true, name: true, shopName: true, image: true }
          }
        },
      });

      if (!conversation) {
        const post = await prisma.customerPost.findUnique({
          where: { id: customerPostId },
        });

        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        conversation = await prisma.conversation.create({
          data: {
            customerPostId,
            shopkeeperId,
            customerId: post.customerId,
          },
          include: { 
            messages: true,
            customer: {
              select: { id: true, name: true, image: true }
            },
            shopkeeper: {
              select: { id: true, name: true, shopName: true, image: true }
            }
          },
        });
      }
      return NextResponse.json(conversation);
    }

    // 2. Send Message
    if (action === "send") {
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          content,
        },
      });

      // Update conversation's lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return NextResponse.json(newMessage);
    }

    // 3. Fetch Messages (with timestamp for efficient polling)
    if (action === "fetch") {
      const { after } = body; // Optional timestamp to fetch only new messages
      
      const messages = await prisma.message.findMany({
        where: { 
          conversationId,
          ...(after && { createdAt: { gt: new Date(after) } })
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(messages);
    }

    // 4. Mark Messages as Read
    if (action === "markRead") {
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: session.user.id },
          read: false
        },
        data: { read: true }
      });
      return NextResponse.json({ success: true });
    }

    // 5. Get Unread Count
    if (action === "getUnreadCount") {
      const count = await prisma.message.count({
        where: {
          conversationId,
          senderId: { not: session.user.id },
          read: false
        }
      });
      return NextResponse.json({ count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint for fetching all conversations for a user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");

    const conversations = await prisma.conversation.findMany({
      where: role === "CUSTOMER" 
        ? { customerId: session.user.id }
        : { shopkeeperId: session.user.id },
      include: {
        customer: {
          select: { id: true, name: true, image: true }
        },
        shopkeeper: {
          select: { id: true, name: true, shopName: true, image: true }
        },
        customerPost: {
          select: { id: true, title: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                read: false
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: "desc" }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}