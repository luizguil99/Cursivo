import { S3Client } from "@aws-sdk/client-s3";

// Configuração do cliente S3 para MinIO
export const s3Client = new S3Client({
  region: import.meta.env.VITE_MINIO_REGION,
  endpoint: `https://${import.meta.env.VITE_MINIO_ENDPOINT}`,
  credentials: {
    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});
