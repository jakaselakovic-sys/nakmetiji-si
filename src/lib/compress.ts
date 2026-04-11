// =============================================================================
// NaKmetiji.si — Client-side Image Compression
//
// Compresses images in the browser before upload to Supabase Storage.
// Uses the Canvas API — MUST only be called in client components.
//
// Strategy:
//   1. Decode the file with createImageBitmap() (off-main-thread, native)
//   2. Scale down if wider/taller than the given limits
//   3. Draw to an off-screen canvas and export as WebP (JPEG fallback)
//   4. Return a new File object with the compressed bytes
//
// Typical savings: 60–85% vs raw JPEG from a smartphone camera.
// =============================================================================

/** Options for compressImage */
export interface CompressOptions {
  /** Maximum output width in pixels (default 1920) */
  maxWidth?: number;
  /** Maximum output height in pixels (default 1080) */
  maxHeight?: number;
  /** WebP/JPEG quality 0–1 (default 0.82) */
  quality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  /** Percentage saved, e.g. 72 = "72% smaller" */
  savedPct: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.82,
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compress a browser File on the client side.
 * Returns the original file unchanged on any error or in non-browser envs.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const original = file.size;

  // Guard: server-side or unsupported browser
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !("createImageBitmap" in window)
  ) {
    return { file, originalSize: original, compressedSize: original, savedPct: 0 };
  }

  // Only compress raster images
  if (!file.type.startsWith("image/")) {
    return { file, originalSize: original, compressedSize: original, savedPct: 0 };
  }

  const { maxWidth, maxHeight, quality } = { ...DEFAULTS, ...options };

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Scale proportionally if over limits
    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width  = Math.round(width  * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { file, originalSize: original, compressedSize: original, savedPct: 0 };
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Try WebP (supported in Chrome, Edge, Firefox, Safari ≥ 14)
    let blob = await canvasToBlob(canvas, "image/webp", quality);
    let mimeType = "image/webp";
    let ext = "webp";

    // Fall back to JPEG if WebP output is not supported or is larger
    if (!blob || blob.size === 0 || blob.size >= file.size) {
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (jpegBlob && jpegBlob.size < file.size) {
        blob = jpegBlob;
        mimeType = "image/jpeg";
        ext = "jpg";
      } else {
        // Compression made it bigger — keep original
        return { file, originalSize: original, compressedSize: original, savedPct: 0 };
      }
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const compressed = new File([blob], `${baseName}.${ext}`, { type: mimeType });
    const savedPct = Math.round((1 - compressed.size / original) * 100);

    return {
      file: compressed,
      originalSize: original,
      compressedSize: compressed.size,
      savedPct: Math.max(0, savedPct),
    };
  } catch {
    // Any canvas error — return original
    return { file, originalSize: original, compressedSize: original, savedPct: 0 };
  }
}

/** Format bytes as human-readable string: "1.4 MB", "320 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1_024)          return `${bytes} B`;
  if (bytes < 1_048_576)      return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
