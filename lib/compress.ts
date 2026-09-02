import JSZip from "jszip";

export interface CompressResult {
  originalName: string;
  webpName: string;
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  overallProcessed: number;
  totalFiles: number;
  status: "processing" | "done" | "error";
}

function compressOneImage(
  file: File,
  quality: number
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
if (!ctx) {
  URL.revokeObjectURL(url);
  reject(new Error(`Canvas not supported: ${file.name}`));
  return;
}
ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error(`Failed to compress: ${file.name}`));
            return;
          }

          resolve({
            originalName: file.name,
            webpName: file.name.replace(/\.\w+$/, ".webp"),
            compressedBlob: blob,
            originalSize: file.size,
            compressedSize: blob.size,
            savings: ((file.size - blob.size) / file.size) * 100,
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load: ${file.name}`));
    };

    img.src = url;
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function compressBatch(
  files: File[],
  quality: number,
  batchSize: number,
  onProgress: (p: BatchProgress) => void
): Promise<CompressResult[]> {
  const results: CompressResult[] = [];
  const batches = chunkArray(files, batchSize);
  let processed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    onProgress({
      currentBatch: i + 1,
      totalBatches: batches.length,
      overallProcessed: processed,
      totalFiles: files.length,
      status: "processing",
    });

    for (const file of batch) {
      const result = await compressOneImage(file, quality);
      results.push(result);
      processed++;

      onProgress({
        currentBatch: i + 1,
        totalBatches: batches.length,
        overallProcessed: processed,
        totalFiles: files.length,
        status: "processing",
      });
    }

    // Let browser garbage collect between batches
    await new Promise((r) => setTimeout(r, 150));
  }

  onProgress({
    currentBatch: batches.length,
    totalBatches: batches.length,
    overallProcessed: files.length,
    totalFiles: files.length,
    status: "done",
  });

  return results;
}