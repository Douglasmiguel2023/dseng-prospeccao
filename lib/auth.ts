import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "dseng_prospeccao_admin_session";

function sign(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionToken(email: string): string {
  const payload = `${email}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  // O timestamp fica depois do ÚLTIMO ponto: e-mails contêm pontos
  // (ex.: .com), e separar no primeiro ponto truncaria o e-mail.
  const lastDot = payload.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const email = payload.slice(0, lastDot);
  return email || null;
}

export async function getAdminEmail(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const email = verifySessionToken(token);
  if (!email) return null;
  if (process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL) return null;
  return email;
}

export const SESSION_COOKIE = COOKIE;
