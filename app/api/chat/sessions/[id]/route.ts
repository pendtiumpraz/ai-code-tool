import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get single chat session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatSession = await prisma.chatHistory.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Ensure user isolation
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const msgs = chatSession.messages as any;
    return NextResponse.json({
      id: chatSession.id,
      title: chatSession.title,
      workspace: msgs?.workspace || 'software-dev',
      messages: msgs?.messages || [],
      model: chatSession.model,
      tokensUsed: chatSession.tokensUsed,
      createdAt: chatSession.createdAt,
      updatedAt: chatSession.updatedAt,
    });

  } catch (error: any) {
    console.error('Failed to fetch chat session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update chat session (add messages, update title)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.chatHistory.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, messages, workspace, tokensUsed } = body;

    const currentData = existing.messages as any;
    
    const updateData: any = { updatedAt: new Date() };
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (messages !== undefined || workspace !== undefined) {
      updateData.messages = {
        workspace: workspace || currentData?.workspace || 'software-dev',
        messages: messages || currentData?.messages || [],
      };
    }
    
    if (tokensUsed !== undefined) {
      updateData.tokensUsed = tokensUsed;
    }

    const updated = await prisma.chatHistory.update({
      where: { id: id },
      data: updateData,
    });

    const msgs = updated.messages as any;
    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      workspace: msgs?.workspace,
      messages: msgs?.messages || [],
      tokensUsed: updated.tokensUsed,
      updatedAt: updated.updatedAt,
    });

  } catch (error: any) {
    console.error('Failed to update chat session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete chat session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before delete
    const existing = await prisma.chatHistory.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.chatHistory.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Failed to delete chat session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
