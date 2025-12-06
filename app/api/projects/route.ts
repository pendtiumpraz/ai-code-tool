import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDriveService } from '@/lib/google-drive';
import { checkProjectQuota } from '@/lib/usage';

export const dynamic = 'force-dynamic';

// ============================================
// PROJECTS API
// ============================================

// GET - List user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspace = searchParams.get('workspace');

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        ...(workspace ? { workspace } : {}),
      },
      include: {
        _count: {
          select: { files: true, tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });

  } catch (error: any) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, workspace } = await req.json();

    if (!name || !workspace) {
      return NextResponse.json({ error: 'Name and workspace required' }, { status: 400 });
    }

    // Check project quota
    const quotaCheck = await checkProjectQuota(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 429 });
    }

    // Create folder in Google Drive
    let googleDriveFolderId: string | undefined;
    const drive = await getDriveService(session.user.id);
    if (drive) {
      googleDriveFolderId = await drive.createProjectFolder(name);
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description,
        workspace,
        googleDriveFolderId,
      },
    });

    return NextResponse.json({ project });

  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, name, description, settings } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(settings ? { settings } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ project });

  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete Google Drive folder
    if (existing.googleDriveFolderId) {
      const drive = await getDriveService(session.user.id);
      if (drive) {
        try {
          await drive.deleteFile(existing.googleDriveFolderId);
        } catch (e) {
          // Folder might already be deleted
        }
      }
    }

    // Delete project (cascades to files, tasks, etc.)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
