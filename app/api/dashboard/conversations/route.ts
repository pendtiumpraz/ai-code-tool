import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get user's conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const projectId = searchParams.get('projectId');

    const where: any = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    const [conversations, total] = await Promise.all([
      prisma.chatHistory.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { name: true, workspace: true } },
        },
      }),
      prisma.chatHistory.count({ where }),
    ]);

    const formattedConversations = conversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title || 'Untitled conversation',
      messages: conv.messages as any[],
      model: conv.model,
      tokensUsed: conv.tokensUsed,
      projectId: conv.projectId,
      projectName: conv.project?.name,
      workspace: conv.project?.workspace,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { title, projectId, model } = await req.json();

    const conversation = await prisma.chatHistory.create({
      data: {
        userId,
        title: title || 'New conversation',
        projectId,
        model: model || 'glm-4-plus',
        messages: [],
        tokensUsed: 0,
      },
    });

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      messages: [],
      model: conversation.model,
      createdAt: conversation.createdAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update conversation (add message, update title)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { conversationId, title, message, tokensUsed } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.chatHistory.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const updates: any = {};
    
    if (title) {
      updates.title = title;
    }
    
    if (message) {
      const currentMessages = (existing.messages as any[]) || [];
      updates.messages = [...currentMessages, message];
    }
    
    if (tokensUsed) {
      updates.tokensUsed = existing.tokensUsed + tokensUsed;
    }

    const conversation = await prisma.chatHistory.update({
      where: { id: conversationId },
      data: updates,
    });

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages,
      tokensUsed: conversation.tokensUsed,
      updatedAt: conversation.updatedAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete conversation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify ownership and delete
    const deleted = await prisma.chatHistory.deleteMany({
      where: { id: conversationId, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
