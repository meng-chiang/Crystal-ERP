import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './storage/photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface SavedPhoto {
  filename: string;
  originalName: string;
}

export async function savePhoto(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  productId: number
): Promise<SavedPhoto> {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`不支援的圖片格式：${mimeType}`);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('檔案大小不能超過 10MB');
  }

  const ext = extname(originalName) || '.jpg';
  const uuid = uuidv4();
  const filename = `${productId}/${uuid}${ext}`;
  const dir = join(UPLOAD_DIR, String(productId));

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const { writeFile } = await import('fs/promises');
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  return { filename, originalName };
}

export async function deletePhoto(filename: string): Promise<void> {
  const filePath = join(UPLOAD_DIR, filename);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}
