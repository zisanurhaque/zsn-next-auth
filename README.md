# zsn-next-auth 🔐

A lightweight, secure authentication helper for Next.js applications featuring token management with configurable lifetimes and automatic refresh.

## Features ✨

- **Token Management**: Secure handling of access & refresh tokens
- **Axios Integration**: Pre-configured instances with auto-token refresh
- **Customizable Lifetimes**: Set your preferred token expiration times
- **Secure Cookies**: HTTP-only, sameSite cookies with CSRF protection
- **Request Queuing**: Handles concurrent token refresh gracefully
- **TypeScript Ready**: Fully typed API surface

## Installation 📦

```bash
npm install zsn-next-auth
# or
yarn add zsn-next-auth
```

# Quick Start 🚀

```typescript
import { initAuthConfig, axiosProtectedInstance } from "zsn-next-auth";

// Initialize
initAuthConfig({
  baseURL: "https://api.example.com",
  accessTokenMaxAge: 900, // 15 minutes
  refreshTokenMaxAge: 2592000, // 30 days
  secureCookie: true,
});

// Make authenticated requests
const fetchUser = async () => {
  try {
    const { data } = await axiosProtectedInstance.get("/user");
    return data;
  } catch (error) {
    console.error("Request failed:", error);
  }
};
```

## Configuration ⚙️

### AuthConfig Options

| Option                | Type    | Default              | Description                       |
| --------------------- | ------- | -------------------- | --------------------------------- |
| `baseURL`             | string  | -                    | Your API base URL (required)      |
| `refreshEndpoint`     | string  | `/api/auth/refresh`  | Refresh token endpoint            |
| `accessCookieName`    | string  | `access_token`       | Access token cookie name          |
| `refreshCookieName`   | string  | `refresh_token`      | Refresh token cookie name         |
| `accessTokenMaxAge`   | number  | `300` (5 min)        | Access token lifetime in seconds  |
| `refreshTokenMaxAge`  | number  | `604800` (7 days)    | Refresh token lifetime in seconds |
| `secureCookie`        | boolean | `true` in production | HTTPS-only cookies                |
| `cookieSameSite`      | string  | `lax`                | SameSite cookie policy            |
| `tokenRefreshTimeout` | number  | `5000`               | Token refresh timeout in ms       |
| `debug`               | boolean | `false`              | Enable debug logging              |

## API Reference 📚

### Core Functions

```typescript
initAuthConfig(config: Partial<AuthConfig>): void
setTokens({ access, refresh }: TokenPair): void
getAccessToken(): string | null
refreshAccessToken(): Promise<string>
clearTokens(): void
```

## Axios Instances

```typescript
axiosPublicInstance; // For public endpoints
axiosProtectedInstance; // Auto-handles token refresh
```
## Error Handling

```typescript
class AuthError extends Error {}       // Base auth error
class TokenRefreshError extends Error // Token refresh failures
```

## Examples 💡

### Next.js API Route (Login)

```typescript
// pages/api/login.ts
import { setTokens } from "zsn-next-auth";

export default async function handler(req, res) {
  const { email, password } = req.body;

  try {
    const response = await fetch("https://api.example.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const { accessToken, refreshToken } = await response.json();
    setTokens({ access: accessToken, refresh: refreshToken });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Login failed" });
  }
}
```

### Next.js API Route (Login)

```typescript
// pages/profile.tsx
import { axiosProtectedInstance } from 'zsn-next-auth';

export async function getServerSideProps(context) {
  try {
    const { data } = await axiosProtectedInstance.get('/user/profile', {
      headers: context.req.headers
    });
    return { props: { profile: data } };
  } catch (error) {
    return { redirect: { destination: '/login', permanent: false } };
  }
}
```

## Security Best Practices 🔒

1. **Always use HTTPS in production**

   - Prevents man-in-the-middle attacks
   - Ensures encrypted communication

2. **Token Lifetime Management**

   - Access tokens: 5-30 minutes recommended  
     _(Minimizes exposure if compromised)_
   - Refresh tokens: 7-30 days recommended  
     _(Balance security and user experience)_

3. **Secure Cookie Settings**
   ```typescript
   {
     httpOnly: true,    // Prevents XSS attacks
     secure: true,      // HTTPS-only transmission
     sameSite: 'lax'    // CSRF protection
   }
   ```

## Contributing 🤝

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

## License 📄

MIT
