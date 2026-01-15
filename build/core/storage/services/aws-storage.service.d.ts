import { ConfigService } from '@nestjs/config';
export interface UploadOptions {
    workspaceId?: string;
    userId: string;
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
export declare class AWSStorageService {
    private configService;
    private s3Client;
    private bucketName;
    private cdnDomain?;
    private region;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFile>;
    uploadMultipleFiles(files: Express.Multer.File[], options: UploadOptions): Promise<UploadedFile[]>;
    deleteFile(key: string, workspaceId: string): Promise<void>;
    getPresignedUrl(key: string, workspaceId: string, expiresInSeconds?: number): Promise<string>;
    private validateFile;
    private generateFileKey;
    private getFileUrl;
    parseS3Url(url: string): string;
}
