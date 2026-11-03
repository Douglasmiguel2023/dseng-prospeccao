import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkMuseToken } from "@/lib/muse-token";
import { importLeadsForRound } from "@/lib/leads";

export const dynamic = "force-dynamic";

// POST /api/rounds/[id]/leads — lança leads qualificados numa rodada.
// Corpo: JSON array com username, displayName, followers, qualification,
// profileUrl e note. Leads novos entram como pendentes; username duplicado
// dentro da rodada é ignorado (nunca criado duas vezes).
// Exige header x-muse-token igual a MUSE_IMPORT_TOKEN; sem a variável
// configurada, responde 503 e nunca aceita a chamada.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMuseToken(request);
  if (denied) return denied;

  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id } });
  if (!round) {
    return NextResponse.json({ error: "Rodada não encontrada." }, { status: 404 });
  }

  let items: unknown;
  try {
    items = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido: esperado um array de leads." },
      { status: 400 },
    );
  }
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "JSON inválido: esperado um array de leads." },
      { status: 400 },
    );
  }

  const result = await importLeadsForRound(id, items);
  return NextResponse.json({ roundId: id, ...result });
}
