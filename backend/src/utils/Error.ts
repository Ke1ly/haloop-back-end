export class AppError extends Error {
  public statusCode: number; // 新增 HTTP 狀態碼
  public code?: string; // 新增錯誤代碼，方便前端辨識

  constructor(statusCode: number, message: string, code?: string) {
    super(message); // 呼叫父類 Error 的 constructor，設定 message
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError"; // 自訂 name
    Error.captureStackTrace(this, this.constructor); // 保留堆疊追蹤，忽略 constructor 本身
  }
}
