import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { AppError } from '../errors/AppError';

/** Diretório raiz dos uploads (persistido em volume Docker em produção). */
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const CLINIC_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ATTACHMENT_MIME = [...IMAGE_MIME, 'application/pdf'];

function ensureDir(sub: string): string {
  const dir = path.join(UPLOAD_ROOT, sub);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeStorage(sub: string): multer.StorageEngine {
  const dir = ensureDir(sub);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  });
}

function imageFilter(allowed: string[], label: string): multer.Options['fileFilter'] {
  return (_req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(label, 400));
      return;
    }
    cb(null, true);
  };
}

const IMAGE_ERROR = 'Formato de imagem inválido (use JPG, PNG, WEBP ou GIF)';
const CLINIC_IMAGE_ERROR = 'Formato de imagem inválido (use JPG, PNG, JPEG ou WEBP)';
const ATTACHMENT_ERROR = 'Formato inválido (use JPG, PNG, WEBP, GIF ou PDF)';

export const avatarUpload = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter(IMAGE_MIME, IMAGE_ERROR),
});

export const clinicUpload = multer({
  storage: makeStorage('clinic'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter(CLINIC_IMAGE_MIME, CLINIC_IMAGE_ERROR),
});

export const serviceUpload = multer({
  storage: makeStorage('services'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter(IMAGE_MIME, IMAGE_ERROR),
});

export const messageUpload = multer({
  storage: makeStorage('messages'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter(ATTACHMENT_MIME, ATTACHMENT_ERROR),
});

/** Monta a URL pública servida pelo backend a partir do arquivo salvo. */
export function avatarPublicUrl(filename: string): string {
  return `/uploads/avatars/${filename}`;
}

export function clinicPublicUrl(filename: string): string {
  return `/uploads/clinic/${filename}`;
}

export function servicePublicUrl(filename: string): string {
  return `/uploads/services/${filename}`;
}

export function messagePublicUrl(filename: string): string {
  return `/uploads/messages/${filename}`;
}
