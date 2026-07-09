const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} = require('../constants/enums');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // 원본명 보존 + 충돌 방지용 타임스탬프 접두어
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (ALLOWED_FILE_EXTENSIONS.includes(ext)) return cb(null, true);
  return cb(
    new multer.MulterError(
      'LIMIT_UNEXPECTED_FILE',
      `허용되지 않는 확장자입니다. 허용: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
    )
  );
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = { upload, UPLOAD_DIR };
