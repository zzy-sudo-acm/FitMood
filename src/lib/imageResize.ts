export const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const isSupportedImageFile = (file: Blob) => supportedImageTypes.includes(file.type);

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
};

export const fileToDataUrl = async (file: Blob): Promise<string> => {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('图片读取失败'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  const type = file.type || 'image/jpeg';
  return `data:${type};base64,${await blobToBase64(file)}`;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? new Blob()), type, quality);
  });

const getTargetSize = (width: number, height: number, maxSize: number) => {
  const longest = Math.max(width, height);
  if (longest <= maxSize) return { width, height };
  const ratio = maxSize / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const canUseCanvas = () => typeof document !== 'undefined' && typeof createImageBitmap !== 'undefined';

export const resizeImage = async (file: Blob, maxSize = 800): Promise<Blob | string> => {
  if (!canUseCanvas()) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const size = getTargetSize(bitmap.width, bitmap.height, maxSize);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close?.();
    const targetType = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const blob = await canvasToBlob(canvas, targetType, 0.86);
    return blob.size > 0 ? blob : file;
  } catch {
    return fileToDataUrl(file);
  }
};

export const resizeImageToDataUrl = async (file: Blob, maxSize = 320): Promise<string> => {
  if (!canUseCanvas()) return fileToDataUrl(file);

  try {
    const bitmap = await createImageBitmap(file);
    const size = getTargetSize(bitmap.width, bitmap.height, maxSize);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fileToDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close?.();
    return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.78);
  } catch {
    return fileToDataUrl(file);
  }
};
