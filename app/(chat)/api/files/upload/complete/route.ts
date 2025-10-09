import { NextResponse } from "next/server";
import { CopySourceOptions, CopyDestinationOptions } from "minio";
import { auth } from "@/app/(auth)/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uploadId, objectName, parts } = await request.json();

    if (!uploadId || !objectName || !parts) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hardcode bucket name for now
    const bucketName = "ai-chatbot";

    // Combine all chunk objects into the final file
    // MinIO supports composeObject to concatenate multiple objects
    const sourceObjects = parts
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => {
        const chunkName = `chunks/${uploadId}/${objectName}.part${part.partNumber}`;
        return new CopySourceOptions({
          Bucket: bucketName,
          Object: chunkName,
        });
      });

    console.log("sourceObjects:", sourceObjects);
    console.log("sourceObjects[0]:", sourceObjects[0]);

    // Create destination options
    const destOptions = new CopyDestinationOptions({
      Bucket: bucketName,
      Object: objectName,
    });

    // Use composeObject to combine chunks
    await minioClient.composeObject(destOptions, sourceObjects);

    // Clean up chunk objects
    const chunkNames = parts
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => `chunks/${uploadId}/${objectName}.part${part.partNumber}`);
    await minioClient.removeObjects(bucketName, chunkNames);

    // Generate presigned URL for accessing the file
    const url = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      24 * 60 * 60 // URL valid for 24 hours
    );

    return NextResponse.json({
      url,
      pathname: objectName,
    });
  } catch (error: any) {
    console.error("Failed to complete upload:", error);
    return NextResponse.json(
      { error: "Failed to complete upload", details: error.message },
      { status: 500 }
    );
  }
}
