// Seed idempotente: rodada real de 2026-11-03, fonte @grazy_designss.
// Os 5 primeiros já foram enviados via conexão do Muse (trabalho separado);
// @shinesadobras fica pendente, segurada para texto de parceria.
// Rode com: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROUND_ID = "seed-round-grazy-2026-11-03";

const leads = [
  { id: "seed-lead-incentive-yas", username: "incentive_yas", displayName: "Incentive Yas — Sua loja favorita de tênis", followers: 13120, qualification: "Negócio na bio · Post nos últimos 10 dias · Link/site na bio", status: "enviado" },
  { id: "seed-lead-modellen", username: "modellen_lingerie", displayName: "Modellen Lingerie — Sob medida", followers: 12828, qualification: "Negócio na bio · Post nos últimos 10 dias · Link na bio", status: "enviado" },
  { id: "seed-lead-cp", username: "cp.clothiing", displayName: "Cp.clothing", followers: 195, qualification: "Negócio na bio · Post nos últimos 10 dias · Site próprio · Comentou no post-fonte", status: "enviado" },
  { id: "seed-lead-luzbella", username: "lojaluzbella", displayName: "Luz Bella — Moda íntima", followers: 4972, qualification: "Negócio na bio · Post nos últimos 10 dias · Link na bio", status: "enviado" },
  { id: "seed-lead-todameiga", username: "todameiga2020", displayName: "Toda Meiga — Moda feminina", followers: 5132, qualification: "Negócio na bio · Post nos últimos 10 dias · Link na bio", status: "enviado" },
  { id: "seed-lead-shines", username: "shinesadobras", displayName: "Shinesa do Brás", followers: 2198, qualification: "Divulgação de lojas na bio · Post nos últimos 10 dias · Link na bio", status: "pendente", note: "Divulgadora do Brás, segurada para texto de parceria, não loja." },
];

await prisma.round.upsert({
  where: { id: ROUND_ID },
  update: { source: "@grazy_designss" },
  create: { id: ROUND_ID, source: "@grazy_designss", maxDays: 10, requireLink: true, onlyBusiness: true, excludeSent: true, status: "aberta" },
});

for (const l of leads) {
  await prisma.lead.upsert({
    where: { id: l.id },
    update: { status: l.status, note: l.note ?? "", qualification: l.qualification, followers: l.followers, displayName: l.displayName },
    create: {
      id: l.id,
      roundId: ROUND_ID,
      username: l.username,
      displayName: l.displayName,
      followers: l.followers,
      qualification: l.qualification,
      profileUrl: `https://www.instagram.com/${l.username}/`,
      status: l.status,
      note: l.note ?? "",
    },
  });
}

console.log(`Seed ok: 1 rodada, ${leads.length} leads.`);
await prisma.$disconnect();
