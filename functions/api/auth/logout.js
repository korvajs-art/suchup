import { json } from "../../_lib/response.js";
import { destroySession, clearSessionCookieHeader } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (env.DB) {
    await destroySession(env, request);
  }
  const secure = new URL(request.url).protocol === "https:";
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader(secure) });
}
