import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all chat sessions for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspace = searchParams.get('workspace');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await prisma.chatHistory.findMany({
      where: {
        userId: session.user.id,
        ...(workspace && { 
          messages: {
            path: ['workspace'],
            equals: workspace
          }
        })
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        messages: true,
        model: true,
        tokensUsed: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Extract workspace and message count from messages
    const formattedSessions = sessions.map((s: any) => {
      const msgs = s.messages as any;
      return {
        id: s.id,
        title: s.title || 'Untitled Chat',
        workspace: msgs?.workspace || 'software-dev',
        messageCount: msgs?.messages?.length || 0,
        lastMessage: msgs?.messages?.[msgs.messages.length - 1]?.content?.substring(0, 100) || '',
        model: s.model,
        tokensUsed: s.tokensUsed,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

    const total = await prisma.chatHistory.count({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      sessions: formattedSessions,
      total,
      hasMore: offset + limit < total
    });

  } catch (error: any) {
    console.error('Failed to fetch chat sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, workspace = 'software-dev', messages = [] } = await req.json();

    const chatSession = await prisma.chatHistory.create({
      data: {
        userId: session.user.id,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
        messages: { workspace, messages },
        model: 'gemini-2.0-flash',
        tokensUsed: 0,
      }
    });

    return NextResponse.json({
      id: chatSession.id,
      title: chatSession.title,
      workspace,
      messages: [],
      createdAt: chatSession.createdAt,
    });

  } catch (error: any) {
    console.error('Failed to create chat session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
