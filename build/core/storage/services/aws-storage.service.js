"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSStorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const custom_errors_1 = require("../../error-handler/custom-errors");
let AWSStorageService = class AWSStorageService {
    configService;
    s3Client;
    bucketName;
    cdnDomain;
    region;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('aws.region') || '';
        const accessKeyId = this.configService.get('aws.access_key_id');
        const secretAccessKey = this.configService.get('aws.secret_access_key');
        this.bucketName = this.configService.get('aws.bucket_name') || '';
        this.cdnDomain = this.configService.get('aws.cdn_domain');
        if (!this.region || !accessKeyId || !secretAccessKey || !this.bucketName) {
            throw new Error('AWS S3 configuration is incomplete. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME environment variables.');
        }
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async uploadFile(file, options) {
        this.validateFile(file, options);
        const key = this.generateFileKey(file, options);
        const command = new client_s3_1.PutObjectCommand({
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
        const url = this.getFileUrl(key, options.makePublic);
        return {
            url,
            key,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
    async uploadMultipleFiles(files, options) {
        return Promise.all(files.map((file) => this.uploadFile(file, options)));
    }
    async deleteFile(key, workspaceId) {
        if (!key.startsWith(`workspaces/${workspaceId}/`)) {
            throw custom_errors_1.customError.forbidden('Cannot delete files from other workspaces');
        }
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        await this.s3Client.send(command);
    }
    async getPresignedUrl(key, workspaceId, expiresInSeconds = 3600) {
        if (!key.startsWith(`workspaces/${workspaceId}/`)) {
            throw custom_errors_1.customError.forbidden('Cannot access files from other workspaces');
        }
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
            expiresIn: expiresInSeconds,
        });
    }
    validateFile(file, options) {
        if (!file || !file.buffer) {
            throw custom_errors_1.customError.badRequest('No file provided');
        }
        const maxSize = (options.maxSizeInMB || 10) * 1024 * 1024;
        if (file.size > maxSize) {
            throw custom_errors_1.customError.badRequest(`File size exceeds ${options.maxSizeInMB || 10}MB limit`);
        }
        const allowedTypes = options.allowedMimeTypes || [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/gif',
            'image/webp',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw custom_errors_1.customError.badRequest(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }
    }
    generateFileKey(file, options) {
        const { workspaceId, folder = 'uploads', userId } = options;
        const ext = file.originalname.split('.').pop() || 'bin';
        const uniqueId = (0, crypto_1.randomUUID)();
        const timestamp = Date.now();
        return `workspaces/${workspaceId}/${folder}/${userId}-${timestamp}-${uniqueId}.${ext}`;
    }
    getFileUrl(key, isPublic) {
        if (this.cdnDomain && isPublic) {
            return `https://${this.cdnDomain}/${key}`;
        }
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
    parseS3Url(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.startsWith('/')
                ? urlObj.pathname.slice(1)
                : urlObj.pathname;
        }
        catch {
            throw custom_errors_1.customError.badRequest('Invalid S3 URL');
        }
    }
};
exports.AWSStorageService = AWSStorageService;
exports.AWSStorageService = AWSStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AWSStorageService);
//# sourceMappingURL=aws-storage.service.js.map