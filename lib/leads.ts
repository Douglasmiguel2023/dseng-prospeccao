import { prisma } from "@/lib/prisma";

// Lógica compartilhada de entrada de leads, usada tanto pela action do
// painel (formulário manual / importação) quanto pela API de fila.
// Regra: username normalizado (sem @, minúsculo); duplicata dentro da
// mesma rodada é ignorada, nunca criada duas vezes. Leads novos entram
// sempre como "pendente".

export type LeadImportItem = {
  username?: unknown;
  displayName?: unknown;
  followers?: unknown;
  qualification?: unknown;
  profileUrl?: unknown;
  note?: unknown;
};

export function normalizeUsername(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function toFollowers(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toText(raw: unknown): string {
  return String(raw ?? "").trim();
}

export async function importLeadsForRound(
  roundId: string,
  items: unknown,
): Promise<{
  created: number;
  skippedDuplicate: number;
  skippedInvalid: number;
}> {
  if (!Array.isArray(items)) {
    throw new Error("Esperado um JSON array de leads.");
  }
  const existing = await prisma.lead.findMany({
    where: { roundId },
    select: { username: true },
  });
  const seen = new Set(existing.map((l) => l.username.toLowerCase()));
  let created = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;

  for (const item of items as LeadImportItem[]) {
    if (!item || typeof item !== "object") {
      skippedInvalid += 1;
      continue;
    }
    const username = normalizeUsername(item.username);
    if (!username) {
      skippedInvalid += 1;
      continue;
    }
    if (seen.has(username)) {
      skippedDuplicate += 1;
      continue;
    }
    seen.add(username);
    await prisma.lead.create({
      data: {
        roundId,
        username,
        displayName: toText(item.displayName),
        followers: toFollowers(item.followers),
        qualification: toText(item.qualification),
        profileUrl: toText(item.profileUrl),
        note: toText(item.note),
        status: "pendente",
      },
    });
    created += 1;
  }

  return { created, skippedDuplicate, skippedInvalid };
}
