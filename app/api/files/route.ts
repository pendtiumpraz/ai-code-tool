import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all files for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const path = searchParams.get('path');

    const files = await prisma.userFile.findMany({
      where: {
        userId: session.user.id,
        ...(projectId && { projectId }),
        ...(path && { path: { startsWith: path } }),
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        path: true,
        mimeType: true,
        size: true,
        isFolder: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or update file
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, path, content, projectId, isFolder = false } = await req.json();

    if (!name || !path) {
      return NextResponse.json({ error: 'Name and path are required' }, { status: 400 });
    }

    // Check if file exists
    const existing = await prisma.userFile.findUnique({
      where: {
        userId_path: {
          userId: session.user.id,
          path,
        }
      }
    });

    let file;
    if (existing) {
      // Update existing file
      file = await prisma.userFile.update({
        where: { id: existing.id },
        data: {
          name,
          content: content || '',
          size: content ? Buffer.byteLength(content, 'utf8') : 0,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new file
      file = await prisma.userFile.create({
        data: {
          userId: session.user.id,
          projectId,
          name,
          path,
          content: content || '',
          size: content ? Buffer.byteLength(content, 'utf8') : 0,
          isFolder,
          mimeType: getMimeType(name),
        }
      });
    }

    return NextResponse.json({
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      size: file.size,
      isFolder: file.isFolder,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    });

  } catch (error: any) {
    console.error('Failed to save file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete file
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Verify ownership
    const file = await prisma.userFile.findFirst({
      where: {
        userId: session.user.id,
        path,
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If folder, delete all children
    if (file.isFolder) {
      await prisma.userFile.deleteMany({
        where: {
          userId: session.user.id,
          path: { startsWith: path }
        }
      });
    } else {
      await prisma.userFile.delete({
        where: { id: file.id }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to detect MIME type
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'jsx': 'application/javascript',
    'tsx': 'application/typescript',
    'html': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'md': 'text/markdown',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'sql': 'text/x-sql',
    'sh': 'text/x-shellscript',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'xml': 'application/xml',
    'txt': 'text/plain',
  };
  return mimeTypes[ext] || 'text/plain';
}
