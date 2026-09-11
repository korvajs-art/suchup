import { withSecurityHeaders, assertSameOrigin } from "./_lib/security.js";
import { error } from "./_lib/response.js";

/**
 * 전역 보안 미들웨어 (OWASP A01/A05):
 * - 보안 헤더
 * - 변경 API 에 대한 same-origin 검사 (CSRF)
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (mutating && url.pathname.startsWith("/api/")) {
    if (!assertSameOrigin(request)) {
      return withSecurityHeaders(error("잘못된 요청 출처입니다.", 403), {
        hsts: url.protocol === "https:",
      });
    }
  }

  const response = await next();
  return withSecurityHeaders(response, { hsts: url.protocol === "https:" });
}
