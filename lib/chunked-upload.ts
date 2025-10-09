/**
 * Chunked file upload utility for large files
 * Splits files into chunks and uploads them to MinIO via multipart upload
 */

export interface ChunkedUploadOptions {
  file: File;
  chunkSize?: number; // Default: 25MB
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkNumber: number, totalChunks: number) => void;
}

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
}

const DEFAULT_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB

export async function uploadFileChunked({
  file,
  chunkSize = DEFAULT_CHUNK_SIZE,
  onProgress,
  onChunkComplete,
}: ChunkedUploadOptions): Promise<UploadResult> {
  const totalChunks = Math.ceil(file.size / chunkSize);

  // Step 1: Initialize multipart upload
  const initResponse = await fetch("/api/files/upload/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.json();
    throw new Error(error.error || "Failed to initialize upload");
  }

  const { uploadId, objectName } = await initResponse.json();

  // Step 2: Upload chunks
  const parts: Array<{ etag: string; partNumber: number }> = [];

  for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
    const start = (partNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const chunkResponse = await fetch("/api/files/upload/chunk", {
      method: "POST",
      headers: {
        "x-upload-id": uploadId,
        "x-object-name": objectName,
        "x-part-number": partNumber.toString(),
      },
      body: chunk,
    });

    if (!chunkResponse.ok) {
      // If a chunk fails, we should abort the multipart upload
      // For now, just throw an error
      const error = await chunkResponse.json();
      throw new Error(error.error || `Failed to upload chunk ${partNumber}`);
    }

    const { etag } = await chunkResponse.json();
    parts.push({ etag, partNumber });

    // Call progress callbacks
    const progress = (partNumber / totalChunks) * 100;
    onProgress?.(progress);
    onChunkComplete?.(partNumber, totalChunks);
  }

  // Step 3: Complete the upload
  const completeResponse = await fetch("/api/files/upload/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uploadId,
      objectName,
      parts,
    }),
  });

  if (!completeResponse.ok) {
    const error = await completeResponse.json();
    throw new Error(error.error || "Failed to complete upload");
  }

  const result = await completeResponse.json();

  return {
    url: result.url,
    pathname: result.pathname,
    contentType: file.type,
  };
}

/**
 * Determine if a file should use chunked upload
 * Files larger than 25MB should use chunked upload
 */
export function shouldUseChunkedUpload(file: File): boolean {
  const threshold = 25 * 1024 * 1024; // 25MB
  return file.size > threshold;
}
