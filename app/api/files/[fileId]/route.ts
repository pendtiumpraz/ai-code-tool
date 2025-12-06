import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDriveService } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ============================================
// GET FILE CONTENT
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;

    // Get file from database
    const file = await prisma.userFile.findFirst({
      where: {
        id: fileId,
        userId: session.user.id, // Ensure user owns the file
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If content is cached in database, return it
    if (file.content) {
      return NextResponse.json({ 
        file,
        content: file.content,
      });
    }

    // Otherwise, fetch from Google Drive
    if (file.googleDriveId) {
      const drive = await getDriveService(session.user.id);
      if (drive) {
        const content = await drive.readFile(file.googleDriveId);
        
        // Cache small files
        if (content.length < 10000) {
          await prisma.userFile.update({
            where: { id: fileId },
            data: { content },
          });
        }

        return NextResponse.json({ file, content });
      }
    }

    return NextResponse.json({ 
      file, 
      content: '',
      message: 'File content not available' 
    });

  } catch (error: any) {
    console.error('Get file content error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
