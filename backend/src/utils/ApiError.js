// 표준 에러 객체. errorHandler 미들웨어가 statusCode/errors 를 읽어 응답한다.
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // 필드별 검증 에러 배열 등
  }
}

module.exports = ApiError;
