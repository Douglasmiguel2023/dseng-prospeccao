import { NextResponse } from "next/server";

// Autenticação da API de fila usada pelo trabalho separado do Muse.
// Regra dura: se MUSE_IMPORT_TOKEN não estiver definida, a API responde
// 503 e nunca aceita uma chamada sem token. Token errado responde 401.
// Retorna null quando a chamada está autorizada, ou a Response de erro.
export function checkMuseToken(request: Request): NextResponse | null {
  const configured = process.env.MUSE_IMPORT_TOKEN;
  if (!configured) {
    return NextResponse.json(
      { error: "API de fila não configurada: MUSE_IMPORT_TOKEN ausente." },
      { status: 503 },
    );
  }
  const provided = request.headers.get("x-muse-token");
  if (!provided || provided !== configured) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  return null;
}
