import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: import.meta.env.VITE_MINIO_REGION,
  endpoint: `https://${import.meta.env.VITE_MINIO_ENDPOINT}`,
  credentials: {
    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Necessário para MinIO
});

export async function uploadImage(file) {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const contentType = file.type;

    // Criar o comando para upload
    const putCommand = new PutObjectCommand({
      Bucket: "cursivo",
      Key: `chat-images/${fileName}`,
      ContentType: contentType,
    });

    // Gerar URL assinada para upload
    const signedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });

    // Fazer upload da imagem
    const response = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    // Retornar URL pública da imagem
    return `https://${import.meta.env.VITE_MINIO_ENDPOINT}/cursivo/chat-images/${fileName}`;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}
