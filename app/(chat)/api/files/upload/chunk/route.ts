import { NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/app/(auth)/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const uploadId = request.headers.get("x-upload-id");
    const objectName = request.headers.get("x-object-name");
    const partNumber = request.headers.get("x-part-number");

    if (!uploadId || !objectName || !partNumber) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    console.log("BUCKET_NAME:", BUCKET_NAME);
    console.log("uploadId:", uploadId);
    console.log("objectName:", objectName);
    console.log("partNumber:", partNumber);

    // Get the chunk data as arrayBuffer
    const chunkData = await request.arrayBuffer();
    const buffer = Buffer.from(chunkData);

    // Convert buffer to stream for MinIO
    const stream = Readable.from(buffer);

    // Hardcode bucket name for now
    const bucketName = "ai-chatbot";

    // Store this chunk as a temporary object
    // We'll combine them later in the complete endpoint
    const chunkObjectName = `chunks/${uploadId}/${objectName}.part${partNumber}`;

    await minioClient.putObject(
      bucketName,
      chunkObjectName,
      stream,
      buffer.length,
      {
        "Content-Type": "application/octet-stream",
      }
    );

    // Get the etag of the uploaded chunk
    const stat = await minioClient.statObject(bucketName, chunkObjectName);

    return NextResponse.json({
      etag: stat.etag,
      partNumber: parseInt(partNumber),
    });
  } catch (error: any) {
    console.error("Failed to upload chunk:", error);
    return NextResponse.json(
      { error: "Failed to upload chunk", details: error.message },
      { status: 500 }
    );
  }
}
