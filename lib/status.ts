export const LEAD_STATUSES = [
  "pendente",
  "aprovado_para_envio",
  "enviado",
  "respondeu",
  "descartado",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado_para_envio: "Aprovado p/ envio",
  enviado: "Enviado",
  respondeu: "Respondeu",
  descartado: "Descartado",
};
