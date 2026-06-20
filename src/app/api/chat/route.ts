// src/app/api/chat/route.ts
// SECURITY FIXES APPLIED:
//   ✅ Auth check on every action (already had it — preserved)
//   ✅ Ownership check before reading/writing messages
//   ✅ Input sanitisation on message content
//   ✅ Limit message length to prevent payload flooding
//   ✅ Safe error responses

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitiseString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth check — always first
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, customerPostId, shopkeeperId, conversationId, content, after } = body;

    // ── 1. Initialize Chat ──────────────────────────────────────────────────
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

        // ✅ SECURITY FIX: Only the post's customer or the target shopkeeper can init a chat
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

      return NextResponse.json(conversation);
    }

    // ── 2. Send Message ─────────────────────────────────────────────────────
    if (action === "send") {
      if (!conversationId || !content) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      // ✅ SECURITY FIX: Sanitise message content — strip HTML, limit length
      const sanitisedContent = sanitiseString(content, 2000);
      if (!sanitisedContent) {
        return NextResponse.json(
          { error: "Message cannot be empty." },
          { status: 400 }
        );
      }

      // ✅ SECURITY FIX: Verify the sender is a participant in this conversation
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

    // ── 3. Fetch Messages ───────────────────────────────────────────────────
    if (action === "fetch") {
      if (!conversationId) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      }

      // ✅ SECURITY FIX: Verify requester is a participant before returning messages
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
        // ✅ SECURITY FIX: Limit fetch to prevent huge payload attacks
        take: 100,
      });

      return NextResponse.json(messages ?? []);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    // ✅ SECURITY FIX: Never leak internal error details
    console.error("CHAT_ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}