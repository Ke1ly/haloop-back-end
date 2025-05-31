import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  User,
  Tokens,
} from "../types/User";
import { getElementById } from "../utils/dom-utils.js";

class AuthService {
  private baseURL: string | null;
  private accessToken: string | null;
  //   private refreshToken: string | null;

  constructor(baseURL = `http://localhost:3000/api`) {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem("accessToken");
    // this.refreshToken = localStorage.getItem("refreshToken");
  }

  // 取得認證標頭
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  // 處理 API 回應
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    if (!response.ok) {
      // 如果是 401 錯誤且有 refresh token，拋出特殊錯誤
      //   if (response.status === 401 && this.refreshToken) {
      //     const refreshed = await this.refreshAccessToken();
      //     if (refreshed) {
      //       throw new Error('TOKEN_REFRESHED');
      //     }
      //   }
      throw new Error(data.message || "請求失敗");
    }
    return data;
  }

  // 註冊
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
        }),
      });

      const result = await this.handleResponse<AuthResponse>(response);

      // 儲存認證資訊
      if (result.token) {
        this.accessToken = result.token;
        localStorage.setItem("accessToken", this.accessToken);
      }

      return result;
    } catch (error) {
      console.error("店家註冊失敗:", error);
      throw error;
    }
  }

  // 登入
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      const result = await this.handleResponse<AuthResponse>(response);

      // 儲存認證資訊
      if (result.token) {
        this.accessToken = result.token;
        localStorage.setItem("accessToken", this.accessToken);
      }

      return result;
    } catch (error) {
      console.error("登入失敗:", error);
      throw error;
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("登出失敗:", error);
    } finally {
      // 無論 API 呼叫是否成功，都清除本地認證資訊
      this.accessToken = null;
      localStorage.removeItem("accessToken");
    }
  }

  // 獲取當前使用者資訊
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<AuthResponse>(response);
    } catch (error) {
      //   if (error instanceof Error && error.message === "TOKEN_REFRESHED") {
      //     // Token 已刷新，重新呼叫
      //     return this.getCurrentUser();
      //   }
      console.error("獲取使用者資訊失敗:", error);
      throw error;
    }
  }

  // 檢查是否已登入
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // 獲取當前 access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

const authService = new AuthService();
async function register(registerData: RegisterRequest) {
  try {
    const result = await authService.register(registerData);
    console.log("註冊成功:", result);

    // 註冊成功後可以導向到店家後台
    // window.location.href = "/store/dashboard";
  } catch (error) {
    console.error("註冊失敗:", error.message);
    alert(`註冊失敗: ${error.message}`);
  }
}

async function login(loginData: LoginRequest) {
  try {
    const result = await authService.login(loginData);
    console.log("登入成功:", result);

    // 根據使用者類型導向不同頁面
    // if (result.user.userType === "STORE") {
    //   window.location.href = "/store/dashboard";
    // } else {
    //   window.location.href = "/helper/dashboard";
    // }
  } catch (error) {
    console.error("登入失敗:", error.message);
    alert(`登入失敗: ${error.message}`);
  }
}
