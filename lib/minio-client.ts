import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "chatbot-uploads";

console.log("MinIO Configuration:");
console.log("  Endpoint:", process.env.MINIO_ENDPOINT);
console.log("  Port:", process.env.MINIO_PORT);
console.log("  Bucket:", process.env.MINIO_BUCKET);
console.log("  BUCKET_NAME constant:", BUCKET_NAME);
