import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminEmail } from "@/lib/auth";
import { createRound, login, logout } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "mt-1 w-full rounded-lg border border-violet/40 bg-ink px-3 py-2 font-normal text-white placeholder:text-lilac/60";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const email = await getAdminEmail();

  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form action={login} className="glass card-glow w-full max-w-sm rounded-2xl p-6">
          <h1 className="text-2xl font-extrabold">DSENG Prospecção — Admin</h1>
          <p className="mt-1 text-sm text-lilac">Entre com o e-mail e a senha de administrador.</p>
          <label className="mt-5 block text-sm font-semibold">
            E-mail
            <input name="email" type="email" required className={inputCls} />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Senha
            <input name="password" type="password" required className={inputCls} />
          </label>
          {sp.error && <p className="mt-3 text-sm font-semibold text-magenta">{sp.error}</p>}
          <button className="mt-5 w-full rounded-full bg-gradient-to-r from-violet to-magenta py-2.5 font-bold text-white">
            Entrar
          </button>
          <a href="/" className="mt-4 block text-center text-sm text-lilac underline">
            Voltar à página inicial
          </a>
        </form>
      </main>
    );
  }

  const [rounds, totalLeads, sent, answered, pending, approved] = await Promise.all([
    prisma.round.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { leads: true } } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "enviado" } }),
    prisma.lead.count({ where: { status: "respondeu" } }),
    prisma.lead.count({ where: { status: "pendente" } }),
    prisma.lead.count({ where: { status: "aprovado_para_envio" } }),
  ]);

  const cards = [
    { label: "Rodadas", value: rounds.length },
    { label: "Leads", value: totalLeads },
    { label: "Enviados", value: sent },
    { label: "Respondidos", value: answered },
    { label: "Pendentes", value: pending },
    { label: "Aprovados p/ envio", value: approved },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-widest text-magenta">DSENG DESIGNER</p>
          <h1 className="text-3xl font-extrabold">Painel de prospecção</h1>
          <p className="text-sm text-lilac">Logado como {email}</p>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-violet/50 px-4 py-2 text-sm font-semibold">
            Sair
          </button>
        </form>
      </div>

      {sp.error && (
        <p className="mt-4 rounded-xl border border-magenta/50 p-3 text-sm font-semibold text-magenta">
          {sp.error}
        </p>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <p className="text-3xl font-extrabold">{c.value}</p>
            <p className="text-sm text-lilac">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="glass card-glow mt-6 rounded-2xl p-5">
        <h2 className="text-xl font-bold">Nova rodada</h2>
        <p className="mt-1 text-sm text-lilac">
          Informe a fonte. Os leads desta rodada são registrados aqui; a
          qualificação detalhada (comentários, curtidas e perfil) continua
          sendo feita pela conexão do Muse e lançada nesta rodada.
        </p>
        <form action={createRound} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            Fonte (@ ou link de post)
            <input name="source" required placeholder="@exemplo ou https://www.instagram.com/p/..." className={inputCls} />
          </label>
          <label className="text-sm font-semibold">
            Último post em até (dias)
            <input name="maxDays" type="number" min={1} defaultValue={10} className={inputCls} />
          </label>
          <div className="space-y-2 text-sm font-semibold">
            <label className="flex items-center gap-2">
              <input name="requireLink" type="checkbox" defaultChecked /> Exigir link/site na bio
            </label>
            <label className="flex items-center gap-2">
              <input name="onlyBusiness" type="checkbox" defaultChecked /> Só negócios
            </label>
            <label className="flex items-center gap-2">
              <input name="excludeSent" type="checkbox" defaultChecked /> Excluir quem já foi enviado
            </label>
          </div>
          <button className="rounded-full bg-gradient-to-r from-violet to-magenta py-2.5 font-bold text-white sm:col-span-2">
            Criar rodada
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Rodadas</h2>
        {rounds.length === 0 ? (
          <p className="mt-3 text-lilac">Nenhuma rodada ainda. Crie a primeira acima.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rounds.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4">
                <Link href={`/admin/${r.id}`} className="font-bold underline decoration-magenta">
                  {r.source}
                </Link>
                <p className="text-sm text-lilac">
                  {r._count.leads} lead(s) · até {r.maxDays} dias · link na bio: {r.requireLink ? "sim" : "não"} ·
                  só negócios: {r.onlyBusiness ? "sim" : "não"} · excluir enviados: {r.excludeSent ? "sim" : "não"} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 rounded-xl bg-ink p-4 text-sm text-lilac">
        Este painel não envia mensagens pelo Instagram e não tem token da Meta.
        “Aprovar lote” apenas marca leads como aprovados para envio; o envio
        real continua pela conexão do Muse, em trabalho separado.
      </p>
    </main>
  );
}
