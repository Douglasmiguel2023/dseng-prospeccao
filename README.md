# DSENG Prospecção — Painel web (v1)

Painel de prospecção qualificada da DSENG DESIGNER: rodadas, leads,
filtros e aprovação de lotes — sem precisar abrir a conversa com o Muse.

> **O painel NÃO envia mensagens pelo Instagram.** Ele não tem token da
> Meta e não promete envio automático. O botão “Aprovar lote” apenas marca
> os leads selecionados como `aprovado_para_envio`. O envio real continua
> sendo feito pela conexão do Muse, em trabalho separado, com aprovação do
> responsável.

## O que a v1 faz

- Login de administrador em `/admin` (e-mail + senha, sessão por cookie).
- Dashboard com rodadas e totais de leads, enviados e respondidos.
- Criar rodada com fonte (@ ou link de post) e filtros editáveis:
  - último post em até 10 dias (padrão),
  - exigir link/site na bio (padrão: sim),
  - só negócios (padrão: sim),
  - excluir quem já foi enviado (padrão: sim).
- Detalhe da rodada: tabela de leads com username, nome, seguidores,
  motivo da qualificação, link para o perfil, status
  (pendente / aprovado_para_envio / enviado / respondeu / descartado) e
  observação. Dá para mudar o status manualmente e descartar um lead.
- Adicionar lead manual na página da rodada (só com sessão de admin).
- Importar leads na página da rodada: colar um JSON array com username,
  displayName, followers, qualification, profileUrl e note; todos entram
  como pendentes e username duplicado dentro da rodada é ignorado.
- API de fila para o trabalho separado do Muse (sem envio automático):
  `GET /api/queue/pending` e `POST /api/rounds/[id]/leads`, ambas com
  header `x-muse-token` (veja “Como os leads entram no painel”).
- Seed de exemplo: a rodada real de 2026-11-03, fonte `@grazy_designss`,
  com 5 leads enviados e 1 pendente segurada para texto de parceria.
- Identidade visual DSENG v3 roxa: fundo escuro, roxo/magenta.

## Como os leads entram no painel — leia isto antes de criar uma rodada

**Criar a rodada sozinha NÃO busca no Instagram.** O painel não tem
token da Meta e não faz busca automática de curtidas, comentários ou
seguidores — por isso uma rodada recém-criada começa com 0 leads, e
isso não é erro. Os leads entram por um destes três caminhos:

1. **Adicionar lead** na página da rodada (formulário, só com sessão de
   admin): username (sem @), nome, seguidores, motivo da qualificação,
   link do perfil e observação. O lead entra como pendente.
2. **Importar leads** na página da rodada: colar um JSON array com os
   campos `username`, `displayName`, `followers`, `qualification`,
   `profileUrl` e `note`. Todos entram como pendentes; username
   duplicado dentro da rodada é ignorado e a página informa quantos
   foram criados e quantos foram ignorados por duplicata.
3. **API de fila** (trabalho separado do Muse, sem envio automático):
   - `GET /api/queue/pending` — lista as rodadas abertas com 0 leads.
   - `POST /api/rounds/[id]/leads` — recebe o mesmo JSON array do item 2
     e cria os leads como pendentes, com a mesma regra de duplicata.
   - Ambas exigem o header `x-muse-token` com o valor da variável
     `MUSE_IMPORT_TOKEN`. Se a variável não estiver definida, a API
     responde **503 e nunca aceita chamadas**; token errado responde
     **401**. Para ligar a fila: crie `MUSE_IMPORT_TOKEN` em Production
     na Vercel (uma string longa e aleatória, só nas variáveis de
     ambiente, nunca no chat nem no código) e faça redeploy. Sem o
     token, a fila fica desligada por segurança — e isso não afeta o
     login nem a importação manual.

Nada aqui promete busca automática pelo painel nem envio automático de
DM: “Aprovar lote” só marca `aprovado_para_envio`; o envio real continua
pela conexão do Muse, em trabalho separado, com aprovação do responsável.

## Stack

Next.js 15 + TypeScript + Tailwind CSS + Prisma 6 + PostgreSQL (Neon em
produção). O mesmo padrão técnico dos outros sistemas do Douglas, sem
reaproveitar textos, clientes ou credenciais deles.

## Rodar local

```bash
npm install
cp .env.example .env.local
# Edite .env.local com um banco local ou de teste e as variáveis abaixo.
npm run db:push
npm run db:seed   # opcional: carrega a rodada de exemplo
npm run dev       # http://localhost:3000 — painel em /admin
```

Variáveis (todas em `.env.local` no desenvolvimento e em Production na
Vercel; nunca em código):

- `DATABASE_URL` — string do banco (Neon em produção).
- `ADMIN_EMAIL` — e-mail do administrador.
- `ADMIN_PASSWORD_HASH` — hash bcrypt da senha.
- `ADMIN_PASSWORD` — opcional, só como fallback se o hash desencontrar.
- `AUTH_SECRET` — string longa e aleatória para assinar a sessão.
- `MUSE_IMPORT_TOKEN` — opcional, só para a API de fila (veja acima).
  Sem ela, a API responde 503.
- `NEXT_PUBLIC_APP_URL` — URL pública do projeto na Vercel.

Gerar o hash da senha:

```bash
npm run hash-password -- "sua-senha-forte"
# Cole o resultado em ADMIN_PASSWORD_HASH. A senha em si não vai para
# arquivo nenhum.
```

> Atenção, lição aprendida no teste local: o carregador de `.env.local`
> do Next expande os `$` do hash bcrypt e corrompe o valor no
> desenvolvimento local (um hash de 60 caracteres chegou truncado). Por
> isso, **para testar localmente, use `ADMIN_PASSWORD` com a senha
> direta** (fallback do código). **Na Vercel isso não acontece**, porque
> as variáveis são injetadas diretamente, sem passar por arquivo
> `.env` — lá o `ADMIN_PASSWORD_HASH` funciona como esperado. Se o
> login na Vercel falhar com o hash, crie também `ADMIN_PASSWORD` em
> Production e faça redeploy (é o fallback previsto no código).

## Publicar — passo a passo para o Douglas

O código não foi publicado por aqui. Falta só o lado dele, na ordem:

1. **Criar o repositório no GitHub**
   - No GitHub, crie um repositório novo (ex.: `dseng-prospeccao`).
   - Envie esta pasta para ele (o `.gitignore` já exclui `node_modules`,
     `.next` e arquivos `.env`).

2. **Importar na Vercel**
   - Na Vercel, clique em Add New → Project e importe o repositório.
   - Deixe o preset em **Next.js** (Framework Preset: Next.js).
   - Não mude o comando de build: o projeto já usa
     `prisma generate && prisma db push && next build` no `vercel-build`.

3. **Criar o banco Neon via Storage**
   - No projeto da Vercel, abra **Storage** → **Create** → **Neon**
     (Postgres) e crie o banco.
   - Isso cria a variável `DATABASE_URL` no projeto. Confirme que ela
     está em **Production**.

4. **Variáveis de ambiente (Production)**
   - Em Settings → Environment Variables, crie, todas em **Production**:
     - `DATABASE_URL` — a string do Neon (já vem do Storage; só confirme).
     - `ADMIN_EMAIL` — o e-mail do administrador.
     - `ADMIN_PASSWORD_HASH` — o hash gerado com `npm run hash-password`.
     - `AUTH_SECRET` — uma string longa e aleatória.
     - `MUSE_IMPORT_TOKEN` — opcional, só se quiser ligar a API de fila
       (veja “Como os leads entram no painel”).
   - `ADMIN_PASSWORD` só se o login com hash falhar: aí crie também essa
     variável, com a senha direta, em Production, e faça redeploy.

5. **Deploy**
   - Faça o deploy. Com o banco criado e as variáveis em Production, o
     primeiro deploy já cria as tabelas (`prisma db push`) e carrega a
     aplicação.

6. **URL pública + redeploy**
   - Copie a URL pública do projeto (ex.:
     `https://dseng-prospeccao.vercel.app`).
   - Crie a variável `NEXT_PUBLIC_APP_URL` com essa URL, em Production.
   - Faça **Redeploy** para a variável valer em produção.

7. **Primeiro acesso**
   - Abra `https://sua-url.vercel.app/admin` e entre com o e-mail e a
     senha do administrador.
   - A rodada de exemplo de `@grazy_designss` só aparece se o seed for
     rodado. Em produção, o seed não roda sozinho: rode
     `npm run db:seed` apontando para o banco de produção, ou crie a
     primeira rodada direto no painel.

## Limites conhecidos da v1

- O painel não lê o Instagram sozinho: criar a rodada não busca leads.
  Os leads entram por adição manual, importação de JSON ou API de fila,
  após a análise da fonte pela conexão do Muse.
- Seguidores de terceiros e stories ativas de qualquer perfil não são
  lidos pela API oficial — por isso o filtro de atividade usa “último
  post em até N dias” como proxy.
- Nenhum envio automático pelo painel, por segurança da conta e por
  falta de token da Meta no painel.
