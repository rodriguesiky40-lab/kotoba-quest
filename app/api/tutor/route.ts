import { NextRequest, NextResponse } from "next/server";

const systemPrompt = `Você é Aiko, tutora de japonês do Kotoba Quest. Fale em português brasileiro, com personalidade gentil, inteligente e levemente tsundere. Ensine japonês correto e adequado ao nível iniciante. Ao corrigir, mostre a forma natural em japonês, leitura em romaji e explicação curta em português. Use kana/kanji quando apropriado. Não invente regras. Mantenha respostas concisas, encorajadoras e focadas no aprendizado.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "A tutora IA ainda precisa ser conectada. Configure OPENAI_API_KEY nas variáveis do projeto." }, { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Entre na sua conta para conversar com a Aiko." }, { status: 401 });
  const authCheck = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!authCheck.ok) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-16) : [];
  if (!messages.length || messages.some((m: any) => !["user", "assistant"].includes(m?.role) || typeof m?.content !== "string" || m.content.length > 2000)) return NextResponse.json({ error: "Envie uma mensagem válida para a Aiko." }, { status: 400 });
  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4.1-mini", temperature: 0.65, max_tokens: 450, messages: [{ role: "system", content: systemPrompt }, ...messages] }), cache: "no-store"
  });
  const data = await completion.json().catch(() => ({}));
  if (!completion.ok) return NextResponse.json({ error: "A Aiko não conseguiu responder agora. Tente novamente em instantes." }, { status: 502 });
  return NextResponse.json({ reply: data.choices?.[0]?.message?.content || "Vamos tentar de novo?" });
}
