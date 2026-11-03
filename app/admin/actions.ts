"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getAdminEmail, SESSION_COOKIE } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/status";
import { importLeadsForRound, normalizeUsername } from "@/lib/leads";

async function requireAdmin() {
  const email = await getAdminEmail();
  if (!email) redirect("/admin");
  return email;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Ordem: hash bcrypt (ADMIN_PASSWORD_HASH) ou senha direta
  // (ADMIN_PASSWORD) como fallback. O fallback existe porque, no sistema
  // de propostas, só o hash deu desencontro de valor. Ambas as variáveis
  // vivem só nas variáveis de ambiente — nunca em código.
  let passwordOk = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    try {
      passwordOk = await compare(password, process.env.ADMIN_PASSWORD_HASH);
    } catch {
      passwordOk = false;
    }
  }
  if (!passwordOk && process.env.ADMIN_PASSWORD) {
    passwordOk = password.length > 0 && password === process.env.ADMIN_PASSWORD;
  }
  const ok =
    Boolean(process.env.ADMIN_EMAIL) &&
    email === process.env.ADMIN_EMAIL &&
    passwordOk;
  if (!ok) redirect("/admin?error=E-mail%20ou%20senha%20incorretos.");
  (await cookies()).set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin");
}

export async function createRound(formData: FormData) {
  await requireAdmin();
  const source = String(formData.get("source") ?? "").trim();
  if (!source) redirect("/admin?error=Informe%20a%20fonte%20(%40%20ou%20link%20de%20post).");
  const maxDays = Math.max(1, Number(formData.get("maxDays") ?? 10) || 10);
  const round = await prisma.round.create({
    data: {
      source,
      maxDays,
      requireLink: formData.get("requireLink") === "on",
      onlyBusiness: formData.get("onlyBusiness") === "on",
      excludeSent: formData.get("excludeSent") === "on",
    },
  });
  revalidatePath("/admin");
  redirect(`/admin/${round.id}`);
}

export async function addLead(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId"));
  const username = normalizeUsername(formData.get("username"));
  if (!username) {
    redirect(`/admin/${roundId}?error=Informe%20o%20username%20do%20lead.`);
  }
  const existing = await prisma.lead.findMany({
    where: { roundId },
    select: { username: true },
  });
  if (existing.some((l) => l.username.toLowerCase() === username)) {
    redirect(`/admin/${roundId}?error=Este%20lead%20j%C3%A1%20existe%20nesta%20rodada.`);
  }
  const followersRaw = String(formData.get("followers") ?? "").trim();
  const followers = followersRaw === "" ? null : Math.trunc(Number(followersRaw));
  await prisma.lead.create({
    data: {
      roundId,
      username,
      displayName: String(formData.get("displayName") ?? "").trim(),
      followers: Number.isFinite(followers) ? followers : null,
      qualification: String(formData.get("qualification") ?? "").trim(),
      profileUrl: String(formData.get("profileUrl") ?? "").trim(),
      note: String(formData.get("note") ?? "").trim(),
      status: "pendente",
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/${roundId}`);
  redirect(`/admin/${roundId}?ok=Lead%20%40${username}%20adicionado%20como%20pendente.`);
}

export async function importLeads(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId"));
  const raw = String(formData.get("json") ?? "").trim();
  let items: unknown;
  try {
    items = JSON.parse(raw);
  } catch {
    redirect(`/admin/${roundId}?error=JSON%20inv%C3%A1lido%3A%20esperado%20um%20array%20de%20leads.`);
  }
  if (!Array.isArray(items)) {
    redirect(`/admin/${roundId}?error=JSON%20inv%C3%A1lido%3A%20esperado%20um%20array%20de%20leads.`);
  }
  const result = await importLeadsForRound(roundId, items);
  const extra =
    result.skippedInvalid > 0
      ? `%20(${result.skippedInvalid}%20inv%C3%A1lido(s))`
      : "";
  revalidatePath("/admin");
  revalidatePath(`/admin/${roundId}`);
  redirect(
    `/admin/${roundId}?ok=${result.created}%20lead(s)%20criado(s)%2C%20${result.skippedDuplicate}%20ignorado(s)%20por%20duplicata${extra}.`,
  );
}

export async function updateLead(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return;
  const lead = await prisma.lead.update({
    where: { id },
    data: { status, note },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/${lead.roundId}`);
}

export async function discardLead(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const lead = await prisma.lead.update({
    where: { id },
    data: { status: "descartado" },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/${lead.roundId}`);
}

export async function approveBatch(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId"));
  const leadIds = formData.getAll("leadIds").map(String);
  if (leadIds.length === 0) {
    redirect(`/admin/${roundId}?error=Selecione%20pelo%20menos%20um%20lead%20pendente.`);
  }
  // Apenas leads pendentes desta rodada viram aprovados. Nada aqui envia
  // mensagem pelo Instagram: a aprovação é só uma marcação no painel.
  await prisma.lead.updateMany({
    where: { id: { in: leadIds }, roundId, status: "pendente" },
    data: { status: "aprovado_para_envio" },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/${roundId}`);
  redirect(`/admin/${roundId}?ok=${leadIds.length}%20lead(s)%20aprovado(s)%20para%20envio.`);
}
