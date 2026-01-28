import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { customError } from 'src/core/error-handler/custom-errors';

export type UploadScope = 'user' | 'workspace';

export interface UploadOptions {
  scope: UploadScope;

  userId: string;

  workspaceId?: string; // only required when scope === 'workspace'

  folder?: string;
  maxSizeInMB?: number;
  allowedMimeTypes?: string[];
  makePublic?: boolean;
}


export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class AWSStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain?: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('aws.region') || '';
    const accessKeyId = this.configService.get<string>('aws.access_key_id');
    const secretAccessKey = this.configService.get<string>(
      'aws.secret_access_key',
    );
    this.bucketName = this.configService.get<string>('aws.bucket_name') || '';
    this.cdnDomain = this.configService.get<string>('aws.cdn_domain');

    if (!this.region || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error(
        'AWS S3 configuration is incomplete. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME environment variables.',
      );
    }

    // Initialize S3Client with validated credentials
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload a single file with tenant isolation
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file, options);

    // Generate tenant-scoped key
    const key = this.generateFileKey(file, options);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        ...(options.workspaceId && { workspaceId: options.workspaceId }),
        userId: options.userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    // Generate URL (CDN if available, else S3)
    const url = this.getFileUrl(key, options.makePublic);

    return {
      url,
      key,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: UploadOptions,
  ): Promise<UploadedFile[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, options)));
  }

  /**
   * Delete a file
   */
  async deleteFile(
    key: string,
    options: { scope: 'user' | 'workspace'; workspaceId?: string; userId?: string },
  ): Promise<void> {
    if (options.scope === 'workspace') {
      if (!options.workspaceId || !key.startsWith(`workspaces/${options.workspaceId}/`)) {
        throw customError.forbidden('Cannot delete files from another workspace');
      }
    }

    if (options.scope === 'user') {
      if (!options.userId || !key.startsWith(`users/${options.userId}/`)) {
        throw customError.forbidden('Cannot delete files from another user');
      }
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }


  /**
   * Generate a presigned URL for secure private file access
   */
  async getPresignedUrl(
    key: string,
    workspaceId: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    // Security: Ensure the key belongs to the workspace
    if (!key.startsWith(`workspaces/${workspaceId}/`)) {
      throw customError.forbidden('Cannot access files from other workspaces');
    }

    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): void {
    // Check if file exists
    if (!file || !file.buffer) {
      throw customError.badRequest('No file provided');
    }

    // Check file size
    const maxSize = (options.maxSizeInMB || 10) * 1024 * 1024; // Default 10MB
    if (file.size > maxSize) {
      throw customError.badRequest(
        `File size exceeds ${options.maxSizeInMB || 10}MB limit`,
      );
    }

    // Check MIME type
    const allowedTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw customError.badRequest(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Generate a unique, tenant-scoped file key
   */
  private generateFileKey(
    file: Express.Multer.File,
    options: UploadOptions,
  ): string {
    const { scope, workspaceId, userId, folder = 'uploads' } = options;

    const ext = file.originalname.split('.').pop() || 'bin';
    const uniqueId = randomUUID();
    const timestamp = Date.now();

    if (scope === 'workspace') {
      if (!workspaceId) {
        throw customError.badRequest('workspaceId is required for workspace uploads');
      }

      return `workspaces/${workspaceId}/${folder}/${userId}-${timestamp}-${uniqueId}.${ext}`;
    }

    // USER SCOPE (avatars)
    return `users/${userId}/${folder}/${timestamp}-${uniqueId}.${ext}`;
  }


  /**
   * Get file URL (CDN or S3)
   */
  private getFileUrl(key: string, isPublic?: boolean): string {
    if (this.cdnDomain && isPublic) {
      // Use CloudFront for public files
      return `https://${this.cdnDomain}/${key}`;
    }

    // Use S3 direct URL - Fixed: use stored region property instead of configService.get
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Parse S3 URL to extract key
   */
  parseS3Url(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.startsWith('/')
        ? urlObj.pathname.slice(1)
        : urlObj.pathname;
    } catch {
      throw customError.badRequest('Invalid S3 URL');
    }
  }
}
