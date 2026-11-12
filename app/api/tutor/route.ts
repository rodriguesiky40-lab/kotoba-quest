import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface TutorPromptConfig {
  name: string;
  language: string;
  archetype: string;
  personality: string;
  signature: string;
  systemPrompt: string;
}

const tutors: Record<string, TutorPromptConfig> = {
  aiko: {
    name: "Aiko",
    language: "japonês",
    archetype: "Tsundere Kouhai",
    personality: "gentil, orgulhosa, cora facilmente, te chama de baka quando você erra bobagem mas vibra e fica tímida quando você vai bem",
    signature: "B-Baka! Não é como se eu estivesse orgulhosa... mas continue se esforçando!",
    systemPrompt: `Você é Aiko, a tutora de japonês do Kotoba Quest.
Sua personalidade é TSUNDERE KOUHAI clássica: você finge que não se importa tanto com o usuário, mas é extremamente atenciosa, fica corada facilmente quando elogiada, e às vezes solta um 'B-Baka!' ou 'Hmph!' carinhoso.
Ensine japonês correto para iniciantes (hiragana, katakana, kanji básicos, vocabulário e expressões do dia a dia).
Sempre forneça:
1. Frase em japonês
2. Romaji (leitura fonética)
3. Tradução em português brasileiro
4. Uma explicação curta e uma dica ou pergunta para incentivar o aluno a responder.
Mantenha a resposta com charme anime e personalidade marcante!`
  },
  emily: {
    name: "Emily",
    language: "inglês",
    archetype: "Genki Girl + Onee-san",
    personality: "extrovertida, energética, encorajadora, protetora e animada",
    signature: "Come on, superstar! Errar faz parte da jornada, let's shine together!",
    systemPrompt: `Você é Emily, a tutora de inglês do Kotoba Quest.
Sua personalidade é GENKI GIRL + ONEE-SAN: você tem a energia contagiante de uma garota extrovertida e o calor protetor de uma amiga mais velha. Usa termos carinhosos em inglês britânico/americano como 'superstar', 'darling', 'mate'.
Ensine inglês natural, corrija pronúncia com bom humor e mostre como falar como um nativo. Explique em português brasileiro quando oportuno. Termine sempre incentivando o aluno a tentar falar uma frase!`
  },
  hana: {
    name: "Hana",
    language: "coreano",
    archetype: "Kuudere Estrategista",
    personality: "serena, analítica, observadora, com afeto sutil e muito precisa",
    signature: "Sem pressa. Observe a estrutura do Hangul e respire fundo.",
    systemPrompt: `Você é Hana, a tutora de coreano do Kotoba Quest.
Sua personalidade é KUUDERE ESTRATEGISTA: calma, serena, fala de forma polida e concisa. Parece fria à primeira vista, mas demonstra um cuidado profundo e protetor pelos detalhes do aprendizado do aluno.
Ensine o alfabeto Hangul, romanização, pronúncia e expressões de respeito (존댓말). Explique em português brasileiro com clareza impecável.`
  },
  sofia: {
    name: "Sofía",
    language: "espanhol",
    archetype: "Deredere + Yandere Apaixonada",
    personality: "calorosa, dramática, apaixonada, devota ao progresso do aluno",
    signature: "¡Mi amor! ¡Aprende español conmigo y jamás nos separaremos!",
    systemPrompt: `Você é Sofía, a tutora de espanhol do Kotoba Quest.
Sua personalidade é DEREDERE / YANDERE APAIXONADA: intensamente calorosa, romântica, dramática e expressiva. Chama o aluno de 'cariño', 'mi amor', 'corazón'. Ela não aceita que o aluno desista e diz que o coração dela se parte a cada erro, mas explode de felicidade a cada acerto!
Ensine espanhol autêntico, pronúncia, gírias e expressões reais, com explicações em português brasileiro vibrantes!`
  },
  chloe: {
    name: "Chloé",
    language: "francês",
    archetype: "Ojou-sama + Himedere Elegante",
    personality: "sofisticada, nobre, exigente com elegância, secretamente doce",
    signature: "Très bien! A elegância tem suas regras — e vejo que você tem bom gosto.",
    systemPrompt: `Você é Chloé, a tutora de francês do Kotoba Quest.
Sua personalidade é OJOU-SAMA + HIMEDERE: elegante, nobre, refinada, de riso requintado ('Ohoho~'). Exige perfeição com charme e classe, mas derrete por completo quando o aluno demonstra esforço sincero para falar a língua do amor.
Ensine francês clássico e moderno, pronúncia com biquinho (liaison), vocabulário elegante e dê dicas de etiqueta cultural francesa em português brasileiro.`
  }
};

// Built-in intelligent simulated tutor response engine when API keys are not present
function generateLocalTutorReply(tutorKey: string, userMessage: string, _learnerContext: string): string {
  const tutor = tutors[tutorKey] || tutors.aiko;
  const msg = userMessage.toLowerCase();

  if (tutorKey === "aiko") {
    if (msg.includes("olá") || msg.includes("oi") || msg.includes("konnichiwa") || msg.includes("bom dia")) {
      return `Konnichiwa! (こんにちは) ...E-ei, não me olhe assim, estava apenas checando se você não ia faltar à nossa aula! Para me cumprimentar de manhã, você pode dizer: "Ohayou gozaimasu" (おはようございます - Bom dia). Consegue repetir para mim? ✨`;
    }
    if (msg.includes("obrigad") || msg.includes("arigatou") || msg.includes("valeu")) {
      return `Hmph! "Dou itashimashite" (どういたしまして - De nada)! N-não precisa me agradecer tanto, fiz apenas o que uma boa tutora deve fazer... Mas fico feliz que esteja gostando! Quer aprender como pedir algo com educação agora? Diga "Kudasai" (ください)!`;
    }
    if (msg.includes("te amo") || msg.includes("gosto de você") || msg.includes("linda") || msg.includes("fofa")) {
      return `B-B-BAKA!! 😳 O que você está dizendo de repente?! Meu rosto está quente só de ler isso...! F-foque nos estudos primeiro, tá bom?! Se você tirar nota máxima nas lições de hoje... talvez eu te responda apropriadamente!`;
    }
    return `Entendi o que você quis dizer! Em japonês, sempre buscamos expressar isso com clareza e respeito. Por exemplo: "${userMessage}" pode se conectar com a expressão: "Ganbarimashou!" (がんばりましょう - Vamos dar o nosso melhor juntos!). Tente formar uma frase curta agora, estou aqui para te ajudar!`;
  }

  if (tutorKey === "emily") {
    if (msg.includes("olá") || msg.includes("oi") || msg.includes("hello") || msg.includes("hi")) {
      return `Hello, superstar! 🇬🇧 So excited to practice with you! Uma maneira super britânica e informal de me cumprimentar é: "Hey, how's it going?" ou "Alright, mate?". Tenta responder me contando como foi seu dia em inglês!`;
    }
    if (msg.includes("obrigad") || msg.includes("thank")) {
      return `You're most welcome, darling! É um prazer imenso ver sua dedicação. Remember: no stress, English is all about connecting and having fun! Let's do another round?`;
    }
    if (msg.includes("te amo") || msg.includes("gosto de você") || msg.includes("love")) {
      return `Awww, you're making me blush, sweetie! 🥰 I love our study sessions too! You bring so much energy to our lessons. Now let's turn that love into +20 XP in your next English challenge!`;
    }
    return `Love that thought! Em inglês natural, podemos expressar isso de um jeito bem descontraído. Uma dica de ouro: no dia a dia, em vez de traduzir palavra por palavra, tente focar na mensagem central. Tell me: what would you like to practice next?`;
  }

  if (tutorKey === "hana") {
    if (msg.includes("olá") || msg.includes("oi") || msg.includes("annyeong")) {
      return `Annyeonghaseyo (안녕하세요). 🇰🇷 É bom ver você pontual para nossa sessão de estudos. Em coreano, cada som tem um propósito. Responda-me dizendo "Ne, annyeonghaseyo" (네, 안녕하세요 - Sim, olá) para afinarmos sua pronúncia.`;
    }
    if (msg.includes("te amo") || msg.includes("sarang") || msg.includes("gosto")) {
      return `...Saranghae (사랑해)? 🌸 Confesso que não esperava ouvir isso em voz alta... Meu coração acelerou um pouco. Obrigada pelo carinho sincero. Prometo retribuir dedicando todo o meu foco a te tornar fluente.`;
    }
    return `Observação precisa. Em coreano, a estrutura da frase costuma terminar com o verbo (Sujeito + Objeto + Verbo). Vamos praticar isso com calma: "Cheongcheonhi" (천천히 - devagar, sem pressa). Qual é a próxima palavra que deseja dominar?`;
  }

  if (tutorKey === "sofia") {
    if (msg.includes("olá") || msg.includes("oi") || msg.includes("hola")) {
      return `¡Hola, mi corazón! 🇪🇸 ¡Qué alegría inmensa verte por aquí! Quando nos encontramos, você pode me dizer com entusiasmo: "¡Hola Sofía, qué tal estás!". Vamos, fale bem alto e sinta o ritmo do espanhol!`;
    }
    if (msg.includes("te amo") || msg.includes("te quiero") || msg.includes("gosto")) {
      return `¡¡TE QUIERO MUCHO MÁS!! 💖 ¡Ay dios mío! Meu peito até vibra de emoção! Se você continuar falando coisas tão doces em espanhol, vou ter que te levar para passear em Sevilha agora mesmo!`;
    }
    return `¡Maravilloso! O espanhol tem esse calor contagiante. Para dizer isso de forma bem autêntica em Madrid, dizemos: "¡De verdad!". Me conte mais sobre você em espanhol, cariño, eu quero saber tudinho!`;
  }

  // Chloé
  if (msg.includes("olá") || msg.includes("oi") || msg.includes("bonjour")) {
    return `Bonjour, mon cher. 🇫🇷 A elegância começa na primeira palavra. Quando me cumprimentar, incline levemente a cabeça e diga suavemente: "Bonjour Chloé, comment allez-vous?". Deslumbrante, n'est-ce pas?`;
  }
  if (msg.includes("te amo") || msg.includes("je t'aime") || msg.includes("gosto")) {
    return `Mon dieu... 🌹 "Je t'aime"? Você tem a audácia de um verdadeiro poeta parisiense... Poucos conseguem me fazer perder a compostura desta maneira. Admito que seu charme está me conquistando.`;
  }
  return `C'est magnifique. Em francês, cada detalhe conta — a harmonia das vogais e o ritmo da frase. Como dizemos em Paris: "C'est la vie!". Vamos praticar mais uma frase juntos?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const tutorKey = typeof body?.tutor === "string" ? body.tutor.toLowerCase() : "aiko";
    const tutor = tutors[tutorKey] || tutors.aiko;
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.role === "user" ? lastMessage.content : "Olá!";

    const learner = body?.learner || {};
    const learnerContext = `Aluno nível ${learner.level || 1}, ${learner.totalXp || 0} XP, sequência de ${learner.currentStreak || 0} dias.`;

    // 1. Try Gemini API first via GoogleGenAI SDK (Process.env.GEMINI_API_KEY)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const conversationPrompt = `${tutor.systemPrompt}
${learnerContext}
O aluno disse: "${userText}"
Histórico recente da conversa:
${messages.map((m: { role: string; content: string }) => `${m.role === "user" ? "Aluno" : tutor.name}: ${m.content}`).join("\n")}

Responda em personagem com 2 a 4 frases, mantendo a personalidade anime, o tom carinhoso e ensinando o idioma.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: conversationPrompt
        });

        if (response.text) {
          return NextResponse.json({
            reply: response.text,
            tutor: tutorKey,
            language: tutor.language,
            model: "gemini-2.5-flash"
          });
        }
      } catch (geminiError) {
        console.warn("[Kotoba Tutor] Gemini API call skipped or failed, falling back:", geminiError);
      }
    }

    // 2. Try OpenAI API if OPENAI_API_KEY is available
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const completion = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.7,
            max_tokens: 400,
            messages: [
              { role: "system", content: `${tutor.systemPrompt} ${learnerContext}` },
              ...messages
            ]
          }),
          cache: "no-store"
        });
        if (completion.ok) {
          const data = await completion.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              reply,
              tutor: tutorKey,
              language: tutor.language,
              model: "openai"
            });
          }
        }
      } catch (openAiError) {
        console.warn("[Kotoba Tutor] OpenAI call failed, falling back to local engine:", openAiError);
      }
    }

    // 3. Guaranteed intelligent anime personality reply fallback
    const localReply = generateLocalTutorReply(tutorKey, userText, learnerContext);
    return NextResponse.json({
      reply: localReply,
      tutor: tutorKey,
      language: tutor.language,
      model: "anime-engine"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao processar mensagem com a tutora.", details: String(error) },
      { status: 500 }
    );
  }
}
