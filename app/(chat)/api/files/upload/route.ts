import { Client } from "minio";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

// Initialize MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "chatbot-uploads";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Ensure bucket exists
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      }

      // Upload file to MinIO
      const objectName = `${Date.now()}-${filename}`;
      await minioClient.putObject(
        BUCKET_NAME,
        objectName,
        Buffer.from(fileBuffer),
        fileBuffer.byteLength,
        {
          "Content-Type": file.type,
        }
      );

      // Generate presigned URL for accessing the file
      const url = await minioClient.presignedGetObject(
        BUCKET_NAME,
        objectName,
        24 * 60 * 60 // URL valid for 24 hours
      );

      return NextResponse.json({
        url,
        pathname: objectName,
        contentType: file.type,
        contentDisposition: `attachment; filename="${filename}"`,
      });
    } catch (_error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
