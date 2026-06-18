import { fileToDataUrl, isSupportedImageFile, resizeImage, resizeImageToDataUrl } from './imageResize';

const DB_NAME = 'fitmood-images';
const DB_VERSION = 1;
const STORE_NAME = 'clothingImages';

export interface SavedClothingImage {
  imageId: string;
  thumbDataUrl: string;
  storage: 'indexedDB' | 'thumbnail';
}

interface ImageRecord {
  id: string;
  blob: Blob;
  mime: string;
  createdAt: number;
}

const memoryImages = new Map<string, Blob | string>();

const makeImageId = () =>
  `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const isImageStoreAvailable = () => typeof indexedDB !== 'undefined';

const openImageDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isImageStoreAvailable()) {
      reject(new Error('IndexedDB 不可用'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
  });

const withStore = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openImageDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onerror = () => reject(request.error ?? new Error('图片数据库操作失败'));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('图片数据库事务失败'));
    };
  });
};

const toBlob = async (value: Blob | string, fallbackType: string): Promise<Blob> => {
  if (value instanceof Blob) return value;
  const response = await fetch(value);
  return response.blob().then((blob) => (blob.type ? blob : new Blob([blob], { type: fallbackType })));
};

export const saveClothingImage = async (file: Blob): Promise<SavedClothingImage> => {
  if (!isSupportedImageFile(file)) {
    throw new Error('只支持 jpg、jpeg、png、webp 图片');
  }

  const imageId = makeImageId();
  const resized = await resizeImage(file, 800);
  const thumbDataUrl = await resizeImageToDataUrl(file, 320);

  try {
    const blob = await toBlob(resized, file.type || 'image/jpeg');
    const record: ImageRecord = { id: imageId, blob, mime: blob.type || file.type || 'image/jpeg', createdAt: Date.now() };
    await withStore('readwrite', (store) => store.put(record));
    return { imageId, thumbDataUrl, storage: 'indexedDB' };
  } catch {
    memoryImages.set(imageId, resized);
    return { imageId, thumbDataUrl, storage: 'thumbnail' };
  }
};

export const loadClothingImage = async (imageId: string): Promise<string | undefined> => {
  if (!imageId) return undefined;

  try {
    const record = await withStore<ImageRecord | undefined>('readonly', (store) => store.get(imageId));
    if (record?.blob) return fileToDataUrl(record.blob);
  } catch {
    // 继续尝试当前会话内存兜底。
  }

  const memory = memoryImages.get(imageId);
  if (!memory) return undefined;
  return typeof memory === 'string' ? memory : fileToDataUrl(memory);
};

export const deleteClothingImage = async (imageId: string): Promise<void> => {
  if (!imageId) return;
  memoryImages.delete(imageId);

  try {
    await withStore('readwrite', (store) => store.delete(imageId));
  } catch {
    // IndexedDB 不可用或记录不存在时不阻断衣物删除。
  }
};
