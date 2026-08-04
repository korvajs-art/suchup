const enc = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function randomToken(bytes = 32) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return toHex(arr);
}

export async function hashPassword(password, saltHex) {
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

export async function verifyPassword(password, saltHex, expectedHash) {
  const actual = await hashPassword(password, saltHex);
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return toHex(digest);
}

export function createSalt() {
  return randomToken(16);
}
