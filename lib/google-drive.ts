import { google, drive_v3 } from 'googleapis';
import { prisma } from './prisma';

// ============================================
// GOOGLE DRIVE CLIENT
// ============================================

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
];

const APP_FOLDER_NAME = 'AI Code Studio';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

interface CreateFileOptions {
  name: string;
  content: string;
  mimeType?: string;
  parentId?: string;
}

interface UpdateFileOptions {
  fileId: string;
  content?: string;
  name?: string;
}

// ============================================
// DRIVE SERVICE CLASS
// ============================================

export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private userId: string;
  
  constructor(accessToken: string, userId: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });
    
    this.drive = google.drive({ version: 'v3', auth });
    this.userId = userId;
  }
  
  // ============================================
  // FOLDER MANAGEMENT
  // ============================================
  
  /**
   * Get or create the user's root app folder
   */
  async getOrCreateAppFolder(): Promise<string> {
    // Check if user already has a folder ID stored
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { googleDriveFolderId: true },
    });
    
    if (user?.googleDriveFolderId) {
      // Verify folder still exists
      try {
        await this.drive.files.get({ fileId: user.googleDriveFolderId });
        return user.googleDriveFolderId;
      } catch {
        // Folder was deleted, create new one
      }
    }
    
    // Search for existing app folder
    const response = await this.drive.files.list({
      q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    let folderId: string;
    
    if (response.data.files && response.data.files.length > 0) {
      folderId = response.data.files[0].id!;
    } else {
      // Create new folder
      const folder = await this.drive.files.create({
        requestBody: {
          name: APP_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folder.data.id!;
    }
    
    // Save folder ID to user
    await prisma.user.update({
      where: { id: this.userId },
      data: { googleDriveFolderId: folderId },
    });
    
    return folderId;
  }
  
  /**
   * Create a project folder
   */
  async createProjectFolder(projectName: string): Promise<string> {
    const appFolderId = await this.getOrCreateAppFolder();
    
    const folder = await this.drive.files.create({
      requestBody: {
        name: projectName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [appFolderId],
      },
      fields: 'id',
    });
    
    return folder.data.id!;
  }
  
  /**
   * Create a subfolder
   */
  async createFolder(name: string, parentId: string): Promise<string> {
    const folder = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });
    
    return folder.data.id!;
  }
  
  // ============================================
  // FILE OPERATIONS
  // ============================================
  
  /**
   * List files in a folder
   */
  async listFiles(folderId?: string): Promise<DriveFile[]> {
    const parentId = folderId || await this.getOrCreateAppFolder();
    
    const response = await this.drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
      orderBy: 'folder,name',
      pageSize: 1000,
    });
    
    return (response.data.files || []) as DriveFile[];
  }
  
  /**
   * Create a new file
   */
  async createFile(options: CreateFileOptions): Promise<DriveFile> {
    const { name, content, mimeType = 'text/plain', parentId } = options;
    const parent = parentId || await this.getOrCreateAppFolder();
    
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType,
        parents: [parent],
      },
      media: {
        mimeType,
        body: content,
      },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
    });
    
    return response.data as DriveFile;
  }
  
  /**
   * Read file content
   */
  async readFile(fileId: string): Promise<string> {
    const response = await this.drive.files.get({
      fileId,
      alt: 'media',
    }, {
      responseType: 'text',
    });
    
    return response.data as string;
  }
  
  /**
   * Update file content
   */
  async updateFile(options: UpdateFileOptions): Promise<DriveFile> {
    const { fileId, content, name } = options;
    
    const requestBody: any = {};
    if (name) requestBody.name = name;
    
    const response = await this.drive.files.update({
      fileId,
      requestBody: Object.keys(requestBody).length > 0 ? requestBody : undefined,
      media: content ? {
        mimeType: 'text/plain',
        body: content,
      } : undefined,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
    });
    
    return response.data as DriveFile;
  }
  
  /**
   * Delete file or folder
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }
  
  /**
   * Move file to trash (recoverable)
   */
  async trashFile(fileId: string): Promise<void> {
    await this.drive.files.update({
      fileId,
      requestBody: { trashed: true },
    });
  }
  
  /**
   * Rename file
   */
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    const response = await this.drive.files.update({
      fileId,
      requestBody: { name: newName },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
    });
    
    return response.data as DriveFile;
  }
  
  /**
   * Move file to different folder
   */
  async moveFile(fileId: string, newParentId: string): Promise<DriveFile> {
    // Get current parents
    const file = await this.drive.files.get({
      fileId,
      fields: 'parents',
    });
    
    const previousParents = file.data.parents?.join(',') || '';
    
    const response = await this.drive.files.update({
      fileId,
      addParents: newParentId,
      removeParents: previousParents,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
    });
    
    return response.data as DriveFile;
  }
  
  /**
   * Copy file
   */
  async copyFile(fileId: string, newName: string, parentId?: string): Promise<DriveFile> {
    const parent = parentId || await this.getOrCreateAppFolder();
    
    const response = await this.drive.files.copy({
      fileId,
      requestBody: {
        name: newName,
        parents: [parent],
      },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
    });
    
    return response.data as DriveFile;
  }
  
  // ============================================
  // STORAGE INFO
  // ============================================
  
  /**
   * Get storage quota info
   */
  async getStorageInfo(): Promise<{ used: number; limit: number }> {
    const response = await this.drive.about.get({
      fields: 'storageQuota',
    });
    
    const quota = response.data.storageQuota;
    return {
      used: parseInt(quota?.usage || '0'),
      limit: parseInt(quota?.limit || '0'),
    };
  }
  
  /**
   * Calculate folder size
   */
  async getFolderSize(folderId: string): Promise<number> {
    let totalSize = 0;
    let pageToken: string | undefined;
    
    do {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, mimeType, size)',
        pageToken,
        pageSize: 1000,
      });
      
      for (const file of response.data.files || []) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Recursively get folder size
          totalSize += await this.getFolderSize(file.id!);
        } else {
          totalSize += parseInt(file.size || '0');
        }
      }
      
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
    
    return totalSize;
  }
  
  // ============================================
  // SEARCH
  // ============================================
  
  /**
   * Search files by name
   */
  async searchFiles(query: string, folderId?: string): Promise<DriveFile[]> {
    const parentId = folderId || await this.getOrCreateAppFolder();
    
    const response = await this.drive.files.list({
      q: `name contains '${query}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
    });
    
    return (response.data.files || []) as DriveFile[];
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get Drive service for a user
 */
export async function getDriveService(userId: string): Promise<GoogleDriveService | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });
  
  if (!user?.googleAccessToken) {
    return null;
  }
  
  // Check if token is expired
  if (user.googleTokenExpiry && new Date(user.googleTokenExpiry) < new Date()) {
    // Refresh token
    if (user.googleRefreshToken) {
      const newToken = await refreshGoogleToken(user.googleRefreshToken);
      if (newToken) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: newToken.access_token,
            googleTokenExpiry: newToken.expiry_date 
              ? new Date(newToken.expiry_date) 
              : undefined,
          },
        });
        return new GoogleDriveService(newToken.access_token, userId);
      }
    }
    return null;
  }
  
  return new GoogleDriveService(user.googleAccessToken, userId);
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date?: number;
} | null> {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await auth.refreshAccessToken();
    return {
      access_token: credentials.access_token!,
      expiry_date: credentials.expiry_date || undefined,
    };
  } catch (error) {
    console.error('Failed to refresh Google token:', error);
    return null;
  }
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Code
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'jsx': 'application/javascript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'rb': 'application/x-ruby',
    'java': 'text/x-java',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'php': 'application/x-php',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'h': 'text/x-c',
    'cs': 'text/x-csharp',
    
    // Web
    'html': 'text/html',
    'css': 'text/css',
    'scss': 'text/x-scss',
    'less': 'text/x-less',
    
    // Data
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'csv': 'text/csv',
    
    // Docs
    'md': 'text/markdown',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    
    // Archives
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export default GoogleDriveService;
