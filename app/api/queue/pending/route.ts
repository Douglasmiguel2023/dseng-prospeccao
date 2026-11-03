import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkMuseToken } from "@/lib/muse-token";

export const dynamic = "force-dynamic";

// GET /api/queue/pending — rodadas abertas que ainda não têm nenhum lead.
// Usada pelo trabalho separado do Muse para saber onde lançar leads.
// Exige header x-muse-token igual a MUSE_IMPORT_TOKEN; sem a variável
// configurada, responde 503 e nunca aceita a chamada.
export async function GET(request: Request) {
  const denied = checkMuseToken(request);
  if (denied) return denied;

  const rounds = await prisma.round.findMany({
    where: { status: "aberta" },
    include: { _count: { select: { leads: true } } },
    orderBy: { createdAt: "desc" },
  });
  const pending = rounds.filter((r) => r._count.leads === 0);

  return NextResponse.json({
    rounds: pending.map((r) => ({
      id: r.id,
      source: r.source,
      maxDays: r.maxDays,
      requireLink: r.requireLink,
      onlyBusiness: r.onlyBusiness,
      excludeSent: r.excludeSent,
      status: r.status,
      createdAt: r.createdAt,
      leadCount: 0,
    })),
  });
}
