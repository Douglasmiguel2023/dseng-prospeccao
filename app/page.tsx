export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12">
      <p className="text-sm font-bold tracking-widest text-magenta">DSENG DESIGNER</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
        Prospecção qualificada,{" "}
        <span className="bg-gradient-to-r from-violet to-magenta bg-clip-text text-transparent">
          sem tiro no escuro.
        </span>
      </h1>
      <p className="mt-4 text-lg text-lilac">
        Painel para registrar rodadas de prospecção, qualificar leads com
        filtros e aprovar lotes para abordagem.
      </p>
      <div className="glass card-glow mt-8 rounded-2xl p-5">
        <p className="font-semibold">Como funciona</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-lilac">
          <li>Entre no painel e crie uma rodada com a fonte (@ ou link de post).</li>
          <li>Os leads entram com o motivo da qualificação e o status.</li>
          <li>Selecione os pendentes e clique em “Aprovar lote”.</li>
        </ol>
        <p className="mt-4 rounded-xl bg-ink p-3 text-sm text-lilac">
          Importante: este painel <strong className="text-white">não envia mensagens
          pelo Instagram</strong> e não tem token da Meta. “Aprovar lote” apenas
          marca os leads como aprovados para envio. O envio real continua sendo
          feito pela conexão do Muse, em trabalho separado, com aprovação do
          responsável.
        </p>
      </div>
      <a
        href="/admin"
        className="mt-8 inline-block w-fit rounded-full bg-gradient-to-r from-violet to-magenta px-6 py-3 font-bold text-white"
      >
        Entrar no painel
      </a>
    </main>
  );
}
