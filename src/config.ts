interface AuthConfig {
  baseURL: string;
  refreshEndpoint: string;
  accessCookieName: string;
  refreshCookieName: string;
  accessTokenMaxAge?: number; // in seconds
  refreshTokenMaxAge?: number; // in seconds
  secureCookie?: boolean;
  cookieDomain?: string;
  cookieSameSite?: "strict" | "lax" | "none";
  tokenRefreshTimeout?: number;
  debug?: boolean;
}

const DEFAULT_CONFIG: Readonly<AuthConfig> = {
  baseURL: "",
  refreshEndpoint: "/api/auth/refresh",
  accessCookieName: "access_token",
  refreshCookieName: "refresh_token",
  accessTokenMaxAge: 300, // 5 minutes (default)
  refreshTokenMaxAge: 604800, // 7 days (default)
  secureCookie: process.env.NODE_ENV === "production",
  cookieSameSite: "lax",
  tokenRefreshTimeout: 5000,
  debug: false,
};

let authConfig: AuthConfig = { ...DEFAULT_CONFIG };

export function initAuthConfig(config: Partial<AuthConfig>) {
  if (!config.baseURL) throw new Error("baseURL is required");
  if (!config.refreshEndpoint?.startsWith("/")) {
    throw new Error('refreshEndpoint must start with "/"');
  }

  // Validate token ages
  if (config.accessTokenMaxAge && config.accessTokenMaxAge > 86400) {
    console.warn("Access token max age >24h is not recommended for security");
  }
  if (config.refreshTokenMaxAge && config.refreshTokenMaxAge < 3600) {
    console.warn("Refresh token max age <1h may degrade user experience");
  }

  authConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    secureCookie: config.secureCookie ?? DEFAULT_CONFIG.secureCookie,
  };

  if (authConfig.debug) {
    console.debug("[Auth] Configuration initialized:", authConfig);
  }
}

export function getAuthConfig(): Readonly<AuthConfig> {
  return authConfig;
}
