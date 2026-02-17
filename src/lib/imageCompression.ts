/**
 * Client-side image compression using HTML5 Canvas.
 * Resizes to max 1024px (width or height), converts to JPEG,
 * and iteratively reduces quality to enforce a 500KB hard cap.
 */

const MAX_FILE_SIZE = 500 * 1024; // 500KB

function resizeAndCompress(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let { width, height } = img;

    // Scale down preserving aspect ratio against both axes
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

export async function compressImage(
  file: File,
  maxDim = 1024,
  quality = 0.6
): Promise<Blob> {
  const img = await loadImage(file);

  // First pass at requested quality
  let blob = await resizeAndCompress(img, maxDim, quality);

  // Iteratively lower quality if still over 500KB hard cap
  let q = quality - 0.1;
  while (blob.size > MAX_FILE_SIZE && q >= 0.1) {
    blob = await resizeAndCompress(img, maxDim, q);
    q -= 0.1;
  }

  // Last resort: shrink dimensions
  if (blob.size > MAX_FILE_SIZE) {
    blob = await resizeAndCompress(img, Math.round(maxDim * 0.75), 0.3);
  }

  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
