import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { getAuthConfig } from "./config";

export interface TokenPair {
  access: string;
  refresh?: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class TokenRefreshError extends AuthError {
  constructor(message: string = "Failed to refresh access token") {
    super(message);
    this.name = "TokenRefreshError";
  }
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let refreshInProgress = false;
const refreshQueue: QueueItem[] = [];

const validateToken = (token: string): boolean => {
  try {
    const parts = token.split(".");
    return parts.length === 3;
  } catch {
    return false;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = getCookie(getAuthConfig().accessCookieName);
  return typeof token === "string" ? token : null;
};

export const setTokens = ({ access, refresh }: TokenPair): void => {
  const config = getAuthConfig();

  if (!validateToken(access)) {
    throw new AuthError("Invalid access token format");
  }

  setCookie(config.accessCookieName, access, {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: config.cookieSameSite,
    maxAge: config.accessTokenMaxAge,
    path: "/",
    domain: config.cookieDomain,
  });

  if (refresh) {
    if (!validateToken(refresh)) {
      throw new AuthError("Invalid refresh token format");
    }

    setCookie(config.refreshCookieName, refresh, {
      httpOnly: true,
      secure: config.secureCookie,
      sameSite: config.cookieSameSite,
      maxAge: config.refreshTokenMaxAge,
      path: "/",
      domain: config.cookieDomain,
    });
  }
};

export const clearTokens = (): void => {
  const config = getAuthConfig();
  deleteCookie(config.accessCookieName);
  deleteCookie(config.refreshCookieName);
};

export const refreshAccessToken = async (): Promise<string> => {
  if (refreshInProgress) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  refreshInProgress = true;
  try {
    const config = getAuthConfig();
    const refreshToken = getCookie(config.refreshCookieName);

    if (typeof refreshToken !== "string") {
      throw new TokenRefreshError("No refresh token available");
    }

    const { data } = await axios.post<TokenPair>(
      `${config.baseURL}${config.refreshEndpoint}`,
      { refresh: refreshToken },
      { timeout: config.tokenRefreshTimeout }
    );

    if (!data.access) {
      throw new TokenRefreshError("Invalid token response");
    }

    setTokens(data);
    refreshQueue.forEach((item) => item.resolve(data.access));
    return data.access;
  } catch (error: unknown) {
    const authError =
      error instanceof Error
        ? error
        : new TokenRefreshError("Token refresh failed");

    refreshQueue.forEach((item) => item.reject(authError));
    throw authError;
  } finally {
    refreshInProgress = false;
    refreshQueue.length = 0;
  }
};
