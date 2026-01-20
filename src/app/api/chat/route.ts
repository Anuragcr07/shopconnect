import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// ✅ FIX: Import authOptions from your lib folder, NOT the route file
// This prevents circular dependency errors in Next.js
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";

// POST: Handle actions (init, send, fetch)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, customerPostId, shopkeeperId, conversationId, content } = body;

    // 1. Initialize Chat
    if (action === "init") {
      if (!customerPostId || !shopkeeperId) {
        return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
      }

      // Check if conversation already exists
      let conversation = await prisma.conversation.findFirst({
        where: {
          customerPostId,
          shopkeeperId,
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          customer: { select: { id: true, name: true } },
          shopkeeper: { select: { id: true, name: true, shopName: true } }
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
            customer: { select: { id: true, name: true } },
            shopkeeper: { select: { id: true, name: true, shopName: true } }
          },
        });
      }

      return NextResponse.json(conversation);
    }

    // 2. Send Message
    if (action === "send") {
      if (!conversationId || !content) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      // Create message and update conversation timestamp in one transaction
      const [newMessage] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId,
            senderId: session.user.id,
            content,
          },
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      return NextResponse.json(newMessage);
    }

    // 3. Fetch New Messages (Polling)
    if (action === "fetch") {
      const { after } = body;
      if (!conversationId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          // Only fetch messages newer than the last one we have
          ...(after && { createdAt: { gt: new Date(after) } }),
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json(messages || []);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("CHAT_POST_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch all conversations for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    const conversations = await prisma.conversation.findMany({
      where: role === "SHOPKEEPER" 
        ? { shopkeeperId: userId } 
        : { customerId: userId },
      include: {
        customer: { select: { id: true, name: true } },
        shopkeeper: { select: { id: true, name: true, shopName: true } },
        customerPost: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Just for previewing the last message
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(conversations || []);
  } catch (error: any) {
    console.error("CHAT_GET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}