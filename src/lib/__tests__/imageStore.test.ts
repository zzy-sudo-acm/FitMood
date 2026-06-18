import { describe, expect, it } from 'vitest';
import { deleteClothingImage, loadClothingImage, saveClothingImage } from '../imageStore';

describe('imageStore', () => {
  it('上传图片后可以得到 imageId 和 thumbDataUrl', async () => {
    const file = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
    const saved = await saveClothingImage(file);

    expect(saved.imageId).toMatch(/^img-/);
    expect(saved.thumbDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('删除图片后 loadClothingImage 读不到对应图片', async () => {
    const file = new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' });
    const saved = await saveClothingImage(file);

    expect(await loadClothingImage(saved.imageId)).toMatch(/^data:image\/jpeg;base64,/);
    await deleteClothingImage(saved.imageId);
    expect(await loadClothingImage(saved.imageId)).toBeUndefined();
  });
});
