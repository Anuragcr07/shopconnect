import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { prisma } from "@/lib/prisma";

// POST: Handle sending messages, initializing chat, and polling
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, customerPostId, shopkeeperId, conversationId, content } = body;

    // 1. Initialize Chat (Ensures conversation exists)
    if (action === "init") {
      if (!customerPostId || !shopkeeperId) {
        return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
      }

      // Try to find existing conversation
      let conversation = await prisma.conversation.findFirst({
        where: { customerPostId, shopkeeperId },
        include: { 
          messages: { orderBy: { createdAt: "asc" } },
          customer: { select: { id: true, name: true } }
        },
      });

      // If not found, create it
      if (!conversation) {
        const post = await prisma.customerPost.findUnique({
          where: { id: customerPostId },
        });

        if (!post) {
          return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        conversation = await prisma.conversation.create({
          data: {
            customerPostId,
            shopkeeperId,
            customerId: post.customerId,
          },
          include: { 
            messages: true, // Will be empty []
            customer: { select: { id: true, name: true } }
          },
        });
      }

      // ✅ FIX: Ensure messages is always an array
      return NextResponse.json({
        ...conversation,
        messages: conversation.messages || [] 
      });
    }

    // 2. Send Message
    if (action === "send") {
      if (!conversationId || !content) return NextResponse.json({ error: "Missing data" }, { status: 400 });

      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          content,
        },
      });

      // Update timestamp for sorting
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return NextResponse.json(newMessage);
    }

    // 3. Fetch New Messages (Polling)
    if (action === "fetch") {
      const { after } = body; // Timestamp
      if (!conversationId) return NextResponse.json({ error: "No Conv ID" }, { status: 400 });

      const messages = await prisma.message.findMany({
        where: { 
          conversationId,
          ...(after && { createdAt: { gt: new Date(after) } })
        },
        orderBy: { createdAt: "asc" },
      });
      
      // ✅ FIX: Always return array
      return NextResponse.json(messages || []);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch ALL Conversations (For History Tab)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = session.user.role; // Assuming role is in session

    // Fetch conversations where I am involved
    const conversations = await prisma.conversation.findMany({
      where: role === "SHOPKEEPER" 
        ? { shopkeeperId: session.user.id }
        : { customerId: session.user.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        shopkeeper: { select: { id: true, name: true } },
        customerPost: { select: { id: true, title: true } },
        // Get the last message for preview
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { lastMessageAt: "desc" }
    });

    return NextResponse.json(conversations || []);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}