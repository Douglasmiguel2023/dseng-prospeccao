import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEmail } from "@/lib/auth";
import { approveBatch, discardLead, logout, updateLead } from "../actions";
import { LEAD_STATUSES, STATUS_LABEL as statusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

const inputCls =
  "mt-1 w-full rounded-lg border border-violet/40 bg-ink px-3 py-2 text-sm text-white";

export default async function RoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const email = await getAdminEmail();
  if (!email) redirect("/admin");

  const round = await prisma.round.findUnique({
    where: { id },
    include: { leads: { orderBy: { createdAt: "asc" } } },
  });
  if (!round) notFound();

  const pending = round.leads.filter((l) => l.status === "pendente");

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-lilac underline">
            ← Voltar ao painel
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">Rodada: {round.source}</h1>
          <p className="text-sm text-lilac">
            Criada em {new Date(round.createdAt).toLocaleDateString("pt-BR")} · até {round.maxDays} dias ·
            link na bio: {round.requireLink ? "sim" : "não"} · só negócios: {round.onlyBusiness ? "sim" : "não"} ·
            excluir enviados: {round.excludeSent ? "sim" : "não"}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-violet/50 px-4 py-2 text-sm font-semibold">Sair</button>
        </form>
      </div>

      {sp.error && (
        <p className="mt-4 rounded-xl border border-magenta/50 p-3 text-sm font-semibold text-magenta">{sp.error}</p>
      )}
      {sp.ok && (
        <p className="mt-4 rounded-xl border border-violet/50 p-3 text-sm font-semibold text-lilac">{sp.ok}</p>
      )}

      <section className="glass card-glow mt-6 rounded-2xl p-5">
        <h2 className="text-xl font-bold">Aprovar lote</h2>
        <p className="mt-1 text-sm text-lilac">
          Selecione os leads pendentes e clique em aprovar. Isso apenas marca
          os leads como <strong className="text-white">aprovado_para_envio</strong> —
          o painel não envia mensagens pelo Instagram.
        </p>
        {pending.length === 0 ? (
          <p className="mt-3 text-lilac">Nenhum lead pendente nesta rodada.</p>
        ) : (
          <form action={approveBatch} className="mt-4">
            <input type="hidden" name="roundId" value={round.id} />
            <ul className="space-y-2">
              {pending.map((l) => (
                <li key={l.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="leadIds" value={l.id} />
                    <span className="font-semibold">@{l.username}</span>
                    <span className="text-lilac">{l.displayName}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button className="mt-4 rounded-full bg-gradient-to-r from-violet to-magenta px-5 py-2.5 font-bold text-white">
              Aprovar lote
            </button>
          </form>
        )}
      </section>

      <section className="mt-6 overflow-x-auto">
        <h2 className="text-xl font-bold">Leads ({round.leads.length})</h2>
        {round.leads.length === 0 ? (
          <p className="mt-3 text-lilac">
            Nenhum lead nesta rodada ainda. Os leads qualificados são lançados
            aqui após a análise da fonte.
          </p>
        ) : (
          <table className="mt-3 w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-lilac">
                <th className="border-b border-violet/30 py-2 pr-3">Lead</th>
                <th className="border-b border-violet/30 py-2 pr-3">Seguidores</th>
                <th className="border-b border-violet/30 py-2 pr-3">Motivo da qualificação</th>
                <th className="border-b border-violet/30 py-2 pr-3">Status</th>
                <th className="border-b border-violet/30 py-2 pr-3">Observação</th>
                <th className="border-b border-violet/30 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {round.leads.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="border-b border-violet/20 py-3 pr-3">
                    <a
                      href={l.profileUrl || `https://www.instagram.com/${l.username}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline decoration-magenta"
                    >
                      @{l.username}
                    </a>
                    <p className="text-lilac">{l.displayName}</p>
                  </td>
                  <td className="border-b border-violet/20 py-3 pr-3">
                    {l.followers == null ? "—" : l.followers.toLocaleString("pt-BR")}
                  </td>
                  <td className="border-b border-violet/20 py-3 pr-3">{l.qualification || "—"}</td>
                  <td className="border-b border-violet/20 py-3 pr-3">{statusLabel[l.status] ?? l.status}</td>
                  <td className="border-b border-violet/20 py-3 pr-3">{l.note || "—"}</td>
                  <td className="border-b border-violet/20 py-3">
                    <form action={updateLead} className="space-y-2">
                      <input type="hidden" name="id" value={l.id} />
                      <select name="status" defaultValue={l.status} className={inputCls}>
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel[s] ?? s}
                          </option>
                        ))}
                      </select>
                      <input name="note" defaultValue={l.note} placeholder="Observação" className={inputCls} />
                      <button className="w-full rounded-full bg-violet px-3 py-1.5 font-bold text-white">
                        Salvar
                      </button>
                    </form>
                    {l.status !== "descartado" && (
                      <form action={discardLead} className="mt-2">
                        <input type="hidden" name="id" value={l.id} />
                        <button className="w-full rounded-full border border-magenta/60 px-3 py-1.5 font-semibold text-magenta">
                          Descartar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
