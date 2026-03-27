const MAX_DIMENSION = 512;
const QUALITY = 0.85;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Resize an image file client-side before upload.
 * Returns a File object that fits within MAX_DIMENSION and MAX_FILE_SIZE.
 */
export async function resizeImage(file: File): Promise<File> {
  // Validate input type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // If already small enough, return as-is
  if (file.size <= MAX_FILE_SIZE) {
    const img = await loadImage(file);
    if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
      return file;
    }
  }

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');

  // Calculate scaled dimensions
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob — use webp for better compression, fall back to jpeg
  const outputType = 'image/webp';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      outputType,
      QUALITY,
    );
  });

  const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `avatar.${ext}`, { type: outputType });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
