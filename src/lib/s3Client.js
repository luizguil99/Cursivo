import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: import.meta.env.VITE_MINIO_REGION,
  endpoint: import.meta.env.VITE_MINIO_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Needed for Minio
});
