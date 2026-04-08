import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
};

export const generateUploadUrl = async (
  key: string,
  expiresIn: number = 300,
): Promise<string> => {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME || 'colossus-delivery-photos',
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const getPublicUrl = (key: string): string => {
  const bucket = process.env.S3_BUCKET_NAME || 'colossus-delivery-photos';
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};
