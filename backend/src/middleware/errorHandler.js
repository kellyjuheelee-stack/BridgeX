const multer = require('multer');
const ApiError = require('../utils/ApiError');

// 404
function notFound(req, res, _next) {
  res.status(404).json({ success: false, message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}` });
}

// 공통 에러 핸들러
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Multer 업로드 에러 → 400
  if (err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: '파일 크기가 제한(10MB)을 초과했습니다.',
      LIMIT_FILE_COUNT: '업로드 가능한 파일 개수를 초과했습니다.',
      LIMIT_UNEXPECTED_FILE: '예상치 못한 파일 필드입니다.',
    };
    return res.status(400).json({ success: false, message: map[err.code] || err.message });
  }

  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message, ...(err.errors ? { errors: err.errors } : {}) });
  }

  console.error('[UnhandledError]', err);
  return res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.' });
}

module.exports = { notFound, errorHandler };
