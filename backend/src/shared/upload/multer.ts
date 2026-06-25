import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { AppError } from '../errors/AppError';

/** Diretório raiz dos uploads (persistido em volume Docker em produção). */
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new AppError('Formato de imagem inválido (use JPG, PNG, WEBP ou GIF)', 400));
      return;
    }
    cb(null, true);
  },
});

/** Monta a URL pública servida pelo backend a partir do arquivo salvo. */
export function avatarPublicUrl(filename: string): string {
  return `/uploads/avatars/${filename}`;
}
