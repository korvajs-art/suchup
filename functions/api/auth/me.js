import { json } from "../../_lib/response.js";
import { requireAdmin, clearSessionCookieHeader } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ authenticated: false }, 200);
  }

  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) {
    const secure = new URL(request.url).protocol === "https:";
    return json(
      { authenticated: false },
      200,
      { "Set-Cookie": clearSessionCookieHeader(secure) }
    );
  }

  return json({ authenticated: true, admin });
}
