const ApiError = require('../utils/ApiError');
const path = require('path');

// POST /api/export-diagnosis/upload — 단일 파일 업로드 (field name: "file")
// 여러 파일을 올릴 때는 프론트에서 이 엔드포인트를 파일 개수만큼 호출하고,
// 반환된 { fileName, fileUrl, fileType } 배열을 진단 생성 시 productFiles 로 전달한다.
function uploadFile(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, '업로드할 파일이 없습니다. (field name: "file")');
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    return res.json({
      success: true,
      message: '파일 업로드가 완료되었습니다.',
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: ext,
        sizeBytes: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile };
