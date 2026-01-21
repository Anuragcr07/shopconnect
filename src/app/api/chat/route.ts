import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";

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

      let conversation = await prisma.conversation.findUnique({
        where: {
          customerPostId_shopkeeperId: { customerPostId, shopkeeperId },
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          customer: { select: { id: true, name: true } },
          shopkeeper: { select: { id: true, name: true, shopName: true } }
        },
      });

      if (!conversation) {
        const post = await prisma.customerPost.findUnique({ where: { id: customerPostId } });
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        conversation = await prisma.conversation.create({
          data: { customerPostId, shopkeeperId, customerId: post.customerId },
          include: {
            messages: true, // Will be empty array
            customer: { select: { id: true, name: true } },
            shopkeeper: { select: { id: true, name: true, shopName: true } }
          },
        });
      }

      return NextResponse.json(conversation);
    }

    // 2. Send Message
    if (action === "send") {
      if (!conversationId || !content) return NextResponse.json({ error: "Missing data" }, { status: 400 });

      const newMessage = await prisma.message.create({
        data: { conversationId, senderId: session.user.id, content },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json(newMessage);
    }

    // 3. Fetch New Messages
    if (action === "fetch") {
      const { after } = body;
      if (!conversationId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          ...(after && { createdAt: { gt: new Date(after) } }),
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json(messages || []);
    }

    // 4. Mark Read (Fixes the 400 Error)
    if (action === "markRead") {
      if (!conversationId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: session.user.id }, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("CHAT_ERROR:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: session.user.role === "SHOPKEEPER" ? { shopkeeperId: session.user.id } : { customerId: session.user.id },
    include: {
      customer: { select: { name: true } },
      shopkeeper: { select: { name: true, shopName: true } },
      customerPost: { select: { title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
  return NextResponse.json(conversations);
}