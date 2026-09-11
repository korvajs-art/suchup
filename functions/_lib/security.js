/** OWASP-oriented helpers shared by API routes and middleware. */

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  // theme 부트스트랩·인라인 스타일 때문에 unsafe-inline 유지. 외부 스크립트는 self만.
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
  ].join("; "),
};

export function withSecurityHeaders(response, { hsts = false } = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  if (hsts && !headers.has("Strict-Transport-Security")) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Same-origin check for cookie-authenticated mutating API calls (CSRF). */
export function assertSameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      const o = new URL(origin);
      return o.protocol === url.protocol && o.host === url.host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const r = new URL(referer);
      return r.protocol === url.protocol && r.host === url.host;
    } catch {
      return false;
    }
  }

  // fetch(same-origin) 는 Origin 을 보낸다. 둘 다 없으면 브라우저가 아닌 요청으로 보고 거절.
  return false;
}

export function clampText(value, max) {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max);
}

/** Allow only safe image URLs for contact avatars (A03/A08). */
export function sanitizeAvatar(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.length > 2048) return "";

  if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(raw)) {
    if (raw.length > 200_000) return "";
    return raw;
  }

  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    if (u.username || u.password) return "";
    return u.toString();
  } catch {
    return "";
  }
}

export const FIELD_LIMITS = {
  name: 80,
  region: 40,
  dept: 80,
  position: 80,
  phone: 40,
  email: 120,
  appointDate: 40,
  birthDate: 40,
  militaryBranch: 40,
  militaryRank: 40,
  commission: 40,
  commissionType: 40,
  classNo: 40,
  address: 200,
  remark: 1000,
  username: 64,
  password: 128,
};

export const IMPORT_MAX_ROWS = 5000;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 8;
