import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDriveService } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';
import { checkStorageQuota, recordStorageUsage } from '@/lib/usage';

export const dynamic = 'force-dynamic';

// ============================================
// FILE API - Google Drive Operations
// ============================================

// GET - List files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '/';
    const projectId = searchParams.get('projectId');

    // Get files from database (cached)
    const files = await prisma.userFile.findMany({
      where: {
        userId: session.user.id,
        ...(projectId ? { projectId } : {}),
        ...(path !== '/' ? { path: { startsWith: path } } : {}),
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('List files error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create file/folder
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, path, content, isFolder, projectId } = await req.json();

    if (!name || !path) {
      return NextResponse.json({ error: 'Name and path required' }, { status: 400 });
    }

    // Check storage quota
    const sizeMB = content ? Buffer.byteLength(content, 'utf8') / (1024 * 1024) : 0;
    const quotaCheck = await checkStorageQuota(session.user.id, sizeMB);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 429 });
    }

    // Get Google Drive service
    const drive = await getDriveService(session.user.id);
    
    let googleDriveId: string | undefined;
    let googleDriveUrl: string | undefined;

    if (drive) {
      if (isFolder) {
        googleDriveId = await drive.createFolder(name, path);
      } else {
        const driveFile = await drive.createFile({
          name,
          content: content || '',
        });
        googleDriveId = driveFile.id;
        googleDriveUrl = driveFile.webViewLink;
      }
    }

    // Save to database
    const file = await prisma.userFile.create({
      data: {
        userId: session.user.id,
        projectId,
        name,
        path: `${path}/${name}`.replace('//', '/'),
        isFolder: isFolder || false,
        size: content ? Buffer.byteLength(content, 'utf8') : 0,
        content: !isFolder && content && content.length < 10000 ? content : undefined,
        googleDriveId,
        googleDriveUrl,
      },
    });

    // Record storage usage
    if (sizeMB > 0) {
      await recordStorageUsage(session.user.id, sizeMB);
    }

    return NextResponse.json({ file });

  } catch (error: any) {
    console.error('Create file error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update file
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, content, name } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get existing file
    const existingFile = await prisma.userFile.findFirst({
      where: {
        id: fileId,
        userId: session.user.id, // Ensure user owns the file
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Update in Google Drive
    const drive = await getDriveService(session.user.id);
    if (drive && existingFile.googleDriveId) {
      await drive.updateFile({
        fileId: existingFile.googleDriveId,
        content,
        name,
      });
    }

    // Update in database
    const file = await prisma.userFile.update({
      where: { id: fileId },
      data: {
        ...(name ? { name } : {}),
        ...(content !== undefined ? { 
          content: content.length < 10000 ? content : undefined,
          size: Buffer.byteLength(content, 'utf8'),
        } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ file });

  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete file/folder
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get existing file
    const existingFile = await prisma.userFile.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Google Drive
    const drive = await getDriveService(session.user.id);
    if (drive && existingFile.googleDriveId) {
      try {
        await drive.deleteFile(existingFile.googleDriveId);
      } catch (e) {
        // File might already be deleted from Drive
      }
    }

    // Delete from database (cascade delete children if folder)
    if (existingFile.isFolder) {
      await prisma.userFile.deleteMany({
        where: {
          userId: session.user.id,
          path: { startsWith: existingFile.path },
        },
      });
    }

    await prisma.userFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
