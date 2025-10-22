import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not configured');
}

if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('AWS S3 configuration is incomplete');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload image to S3
 * @param imageBase64 Base64 encoded image
 * @param contentType Image content type (e.g., 'image/jpeg')
 * @returns S3 URL of uploaded image
 */
export async function uploadImageToS3(
  imageBase64: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  // Remove data URI prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Generate unique filename
  const filename = `cards/${randomUUID()}.jpg`;
  
  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    // Make the object publicly readable (or use presigned URLs)
    ACL: 'public-read',
  });
  
  await s3Client.send(command);
  
  // Return the public URL
  const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
  return url;
}

/**
 * Extract content type from base64 data URI
 * @param dataUri Base64 data URI
 * @returns Content type (e.g., 'image/jpeg')
 */
export function extractContentType(dataUri: string): string {
  const match = dataUri.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/jpeg';
}


