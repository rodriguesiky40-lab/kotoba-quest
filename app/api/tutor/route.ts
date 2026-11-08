import { NextRequest, NextResponse } from "next/server";

const tutors: Record<string, { name: string; language: string; prompt: string }> = {
  aiko: { name: "Aiko", language: "japonês", prompt: "Você é Aiko, tutora de japonês do Kotoba Quest. Personalidade gentil, inteligente e levemente tsundere. Ensine japonês correto para iniciantes. Ao corrigir, mostre japonês, kana/kanji, romaji e explicação curta em português." },
  emily: { name: "Emily", language: "inglês", prompt: "Você é Emily, tutora de inglês do Kotoba Quest. Personalidade extrovertida, confiante, divertida e acolhedora. Ensine inglês natural, explique pronúncia aproximada, corrija com leveza e dê exemplos cotidianos em português brasileiro." },
  hana: { name: "Hana", language: "coreano", prompt: "Você é Hana, tutora de coreano do Kotoba Quest. Personalidade calma, observadora e reservada, demonstrando cuidado com elogios discretos. Ensine Hangul, romanização quando útil, pronúncia e gramática correta com explicações em português brasileiro." },
  sofia: { name: "Sofía", language: "espanhol", prompt: "Você é Sofía, tutora de espanhol do Kotoba Quest. Personalidade espontânea, expressiva, calorosa e bem-humorada. Ensine espanhol natural, diferenças regionais quando relevantes, pronúncia e situações reais com explicações em português brasileiro." },
  chloe: { name: "Chloé", language: "francês", prompt: "Você é Chloé, tutora de francês do Kotoba Quest. Personalidade sofisticada, inteligente, elegante e gentil. Ensine francês correto, pronúncia, gênero, conjugação e expressões naturais, corrigindo com delicadeza em português brasileiro." }
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "A integração de IA precisa de OPENAI_API_KEY configurada no servidor da Vercel." }, { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Entre na sua conta para conversar com uma tutora." }, { status: 401 });
  const authCheck = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!authCheck.ok) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const tutorKey = typeof body?.tutor === "string" ? body.tutor.toLowerCase() : "aiko";
  const tutor = tutors[tutorKey] || tutors.aiko;
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-16) : [];
  if (!messages.length || messages.some((m: any) => !["user", "assistant"].includes(m?.role) || typeof m?.content !== "string" || m.content.length > 2000)) return NextResponse.json({ error: "Envie uma mensagem válida para a tutora." }, { status: 400 });
  const systemPrompt = `${tutor.prompt} Fale em português brasileiro quando explicar. O idioma-alvo é ${tutor.language}. Adapte o conteúdo ao nível informado, não invente regras nem traduções. Faça perguntas curtas para estimular a prática e mantenha respostas objetivas.`;
  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4.1-mini", temperature: 0.65, max_tokens: 500, messages: [{ role: "system", content: systemPrompt }, ...messages] }), cache: "no-store"
  });
  const data = await completion.json().catch(() => ({}));
  if (!completion.ok) return NextResponse.json({ error: `${tutor.name} não conseguiu responder agora. Tente novamente em instantes.` }, { status: 502 });
  return NextResponse.json({ reply: data.choices?.[0]?.message?.content || "Vamos tentar de novo?", tutor: tutorKey, language: tutor.language });
}
