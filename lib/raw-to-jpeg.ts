import UTIF from "utif2";

export interface RawConvertResult {
  originalName: string;
  jpegName: string;
  blob: Blob;
  originalSize: number;
  jpegSize: number;
  width: number;
  height: number;
}

/**
 * Extracts the embedded full-resolution JPEG preview from a RAW file.
 *
 * Strategy:
 * 1. Parse the TIFF structure (CR2/NEF/DNG are all TIFF-based)
 * 2. Find IFDs with JPEG compression (type 6 or 7)
 * 3. Read StripOffsets/StripByteCounts to get the exact JPEG location
 * 4. Extract and validate each candidate by loading as an image
 * 5. Return the largest valid JPEG
 * 6. Fall back to UTIF pixel decoding if no valid JPEG is found
 */
export async function convertRawToJpeg(
  file: File,
  quality: number = 0.92
): Promise<RawConvertResult> {
  const buffer = await file.arrayBuffer();

  // Step 1: Parse TIFF structure to find embedded JPEG previews
  const jpegCandidates = extractJpegPreviewsFromTiff(buffer);

  // Step 2: Try each candidate, largest first
  jpegCandidates.sort((a, b) => b.length - a.length);

  for (const jpegData of jpegCandidates) {
    const blob = new Blob([jpegData], { type: "image/jpeg" });
    const dims = await getImageDimensions(blob);

    // Strict validation: must load successfully with real dimensions
    if (dims.width >= 1000 && dims.height >= 1000) {
      return {
        originalName: file.name,
        jpegName: file.name.replace(/\.\w+$/, ".jpg"),
        blob,
        originalSize: file.size,
        jpegSize: blob.size,
        width: dims.width,
        height: dims.height,
      };
    }
  }

  // Step 3: Fallback — use UTIF to decode pixel data directly
  const ifds = UTIF.decode(buffer);
  if (ifds.length === 0) {
    throw new Error(`No image data found in ${file.name}`);
  }

  let largest = ifds[0];
  for (const ifd of ifds) {
    if ((ifd.width || 0) > (largest.width || 0)) {
      largest = ifd;
    }
  }

  UTIF.decodeImage(buffer, largest);
  const rgba = UTIF.toRGBA8(largest);

  const canvas = document.createElement("canvas");
  canvas.width = largest.width;
  canvas.height = largest.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const imageData = ctx.createImageData(largest.width, largest.height);
  imageData.data.set(rgba);
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG export failed"))),
      "image/jpeg",
      quality
    );
  });

  return {
    originalName: file.name,
    jpegName: file.name.replace(/\.\w+$/, ".jpg"),
    blob,
    originalSize: file.size,
    jpegSize: blob.size,
    width: largest.width,
    height: largest.height,
  };
}

/**
 * Parses the TIFF structure of a RAW file and extracts all embedded
 * JPEG preview images.
 *
 * TIFF structure:
 *   Bytes 0-1: Byte order ("II" = little-endian, "MM" = big-endian)
 *   Bytes 2-3: Magic number (42)
 *   Bytes 4-7: Offset to first IFD
 *
 * Each IFD:
 *   2 bytes: Number of entries
 *   12 bytes per entry: tag(2) + type(2) + count(4) + value/offset(4)
 *   4 bytes: Offset to next IFD (0 = last)
 *
 * Key tags:
 *   256 (0x100): ImageWidth
 *   257 (0x101): ImageLength (height)
 *   259 (0x103): Compression (6=old JPEG, 7=new JPEG)
 *   273 (0x111): StripOffsets
 *   279 (0x117): StripByteCounts
 */
function extractJpegPreviewsFromTiff(buffer: ArrayBuffer): Uint8Array[] {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const results: Uint8Array[] = [];

  // Validate TIFF header
  if (bytes.length < 8) return results;

  const byteOrder = String.fromCharCode(bytes[0], bytes[1]);
  if (byteOrder !== "II" && byteOrder !== "MM") return results;
  const le = byteOrder === "II"; // little-endian

  const magic = view.getUint16(2, le);
  if (magic !== 42) return results;

  let ifdOffset = view.getUint32(4, le);
  let safety = 0;

  while (ifdOffset !== 0 && ifdOffset < bytes.length - 2 && safety < 20) {
    safety++;

    const numEntries = view.getUint16(ifdOffset, le);
    if (ifdOffset + 2 + numEntries * 12 + 4 > bytes.length) break;

    let width = 0;
    let height = 0;
    let compression = 0;
    let stripOffsets: number[] = [];
    let stripByteCounts: number[] = [];

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      const type = view.getUint16(entryOffset + 2, le);
      const count = view.getUint32(entryOffset + 4, le);

      switch (tag) {
        case 256: // ImageWidth
          width = readUintValue(view, entryOffset, type, le);
          break;
        case 257: // ImageLength
          height = readUintValue(view, entryOffset, type, le);
          break;
        case 259: // Compression
          compression = readUintValue(view, entryOffset, type, le);
          break;
        case 273: // StripOffsets
          stripOffsets = readUintArray(view, entryOffset, type, count, le);
          break;
        case 279: // StripByteCounts
          stripByteCounts = readUintArray(view, entryOffset, type, count, le);
          break;
      }
    }

    // Look for JPEG-compressed IFDs with reasonable dimensions
    // Skip the small thumbnail (width < 1000)
    if ((compression === 6 || compression === 7) && width >= 1000) {
      // Extract JPEG data from strips
      if (stripOffsets.length > 0 && stripByteCounts.length > 0) {
        for (let i = 0; i < stripOffsets.length; i++) {
          const offset = stripOffsets[i];
          const length = stripByteCounts[i];

          if (
            offset + length <= bytes.length &&
            length > 1000 &&
            bytes[offset] === 0xff &&
            bytes[offset + 1] === 0xd8
          ) {
            results.push(bytes.slice(offset, offset + length));
          }
        }
      }
    }

    // Move to next IFD
    const nextIfdPos = ifdOffset + 2 + numEntries * 12;
    ifdOffset = view.getUint32(nextIfdPos, le);
  }

  return results;
}

/**
 * Reads a single unsigned integer value from a TIFF IFD entry.
 * Type 3 = SHORT (2 bytes), Type 4 = LONG (4 bytes).
 * For single values, data is stored inline in the 4-byte value field.
 */
function readUintValue(
  view: DataView,
  entryOffset: number,
  type: number,
  le: boolean
): number {
  if (type === 3) {
    return view.getUint16(entryOffset + 8, le);
  }
  return view.getUint32(entryOffset + 8, le);
}

/**
 * Reads an array of unsigned integers from a TIFF IFD entry.
 * If count * bytesPerValue <= 4, values are stored inline.
 * Otherwise, they're stored at the offset specified in the value field.
 */
function readUintArray(
  view: DataView,
  entryOffset: number,
  type: number,
  count: number,
  le: boolean
): number[] {
  const result: number[] = [];
  const bytesPerValue = type === 3 ? 2 : 4; // SHORT=2, LONG=4

  // Check if values are inline (fit in 4 bytes) or at an external offset
  let dataOffset: number;
  if (count * bytesPerValue <= 4) {
    dataOffset = entryOffset + 8;
  } else {
    dataOffset = view.getUint32(entryOffset + 8, le);
  }

  for (let i = 0; i < count; i++) {
    if (type === 3) {
      result.push(view.getUint16(dataOffset + i * 2, le));
    } else {
      result.push(view.getUint32(dataOffset + i * 4, le));
    }
  }

  return result;
}

function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Batch convert with progress.
 */
export interface RawBatchProgress {
  current: number;
  total: number;
  currentFile: string;
  status: "processing" | "done" | "error";
  errors: string[];
}

export async function convertRawBatch(
  files: File[],
  quality: number,
  onProgress: (p: RawBatchProgress) => void
): Promise<RawConvertResult[]> {
  const results: RawConvertResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress({
      current: i + 1,
      total: files.length,
      currentFile: file.name,
      status: "processing",
      errors: [...errors],
    });

    try {
      const result = await convertRawToJpeg(file, quality);
      results.push(result);
    } catch (err) {
      const msg = `${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  onProgress({
    current: files.length,
    total: files.length,
    currentFile: "",
    status: errors.length === 0 ? "done" : "error",
    errors: [...errors],
  });

  return results;
}