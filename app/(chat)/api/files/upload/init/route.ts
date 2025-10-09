import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Hardcode bucket name for now
    const bucketName = "ai-chatbot";

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
    }

    // Create unique object name
    const objectName = `${Date.now()}-${filename}`;

    // For MinIO, we'll use a simpler approach:
    // Store chunks as separate objects, then combine them
    // Return a session ID instead of uploadId
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      uploadId: sessionId,
      objectName,
    });
  } catch (error: any) {
    console.error("Failed to initialize upload:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload", details: error.message },
      { status: 500 }
    );
  }
}
