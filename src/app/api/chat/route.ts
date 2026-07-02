import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitiseString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, customerPostId, shopkeeperId, conversationId, content, after } = body;

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
          shopkeeper: { select: { id: true, name: true, shopName: true } },
        },
      });

      if (!conversation) {
        const post = await prisma.customerPost.findUnique({
          where: { id: customerPostId },
        });
        if (!post) {
          return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const userId = session.user.id;
        const isCustomer = post.customerId === userId;
        const isShopkeeper = shopkeeperId === userId;
        if (!isCustomer && !isShopkeeper) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        conversation = await prisma.conversation.create({
          data: {
            customerPostId,
            shopkeeperId,
            customerId: post.customerId,
          },
          include: {
            messages: true,
            customer: { select: { id: true, name: true } },
            shopkeeper: { select: { id: true, name: true, shopName: true } },
          },
        });
      }

      const shopRequest = await prisma.shopRequest.findFirst({
        where: {
          customerPostId,
          shopkeeperId,
        },
        select: {
          isAvailable: true,
          message: true,
          imageUrls: true,
        },
      });

      return NextResponse.json({
        ...conversation,
        shopRequest,
      });
    }

    if (action === "send") {
      if (!conversationId || !content) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      const sanitisedContent = sanitiseString(content, 2000);
      if (!sanitisedContent) {
        return NextResponse.json(
          { error: "Message cannot be empty." },
          { status: 400 }
        );
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { customerId: true, shopkeeperId: true },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const userId = session.user.id;
      const isParticipant =
        conversation.customerId === userId ||
        conversation.shopkeeperId === userId;

      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: sanitisedContent,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json(newMessage);
    }

    if (action === "fetch") {
      if (!conversationId) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { customerId: true, shopkeeperId: true },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const userId = session.user.id;
      if (
        conversation.customerId !== userId &&
        conversation.shopkeeperId !== userId
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          ...(after && { createdAt: { gt: new Date(after) } }),
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      });

      return NextResponse.json(messages ?? []);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("CHAT_ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: session.user.id },
          { shopkeeperId: session.user.id },
        ],
      },
      include: {
        customer: { select: { id: true, name: true } },
        shopkeeper: { select: { id: true, name: true, shopName: true } },
        customerPost: { select: { id: true, title: true } },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("CHAT_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}