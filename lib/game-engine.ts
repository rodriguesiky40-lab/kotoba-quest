// Kotoba Quest — Core Game & Romance RPG Engine (Duolingo + Amor Doce / Anime Otome)

export type TutorId = "aiko" | "emily" | "hana" | "sofia" | "chloe";
export type ExpressionMood = "neutral" | "happy" | "blushing" | "shocked" | "proud" | "worried" | "angry" | "jealous" | "pout";

export interface Question {
  id: string;
  lesson_id?: string;
  prompt: string;
  prompt_translation: string | null;
  question_type: string;
  options: string[];
  answer_key: string;
  explanation: string;
  sort_order?: number;
  sound_phrase?: string;
}

export interface Lesson {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  lesson_type: "vocabulary" | "grammar" | "listening" | "checkpoint";
  xp_reward: number;
  coin_reward: number;
  sort_order: number;
  questions: Question[];
}

export interface Unit {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  language_code: string;
  language_name: string;
  native_name: string;
  flag_emoji: string;
  tutor_id: TutorId;
  title: string;
  description: string;
  destination: string;
  units: Unit[];
}

export interface TutorProfile {
  id: TutorId;
  name: string;
  language: string;
  languageCode: string;
  flag: string;
  archetype: string;
  title: string;
  bio: string;
  quote: string;
  voiceStyle: string;
  city: string;
  scenario: string;
  assets: {
    full: string;
    portrait: string;
    expressions?: string;
    bg?: string;
  };
  reactions: {
    correct: { text: string; mood: ExpressionMood }[];
    wrong: { text: string; mood: ExpressionMood }[];
    combo: { text: string; mood: ExpressionMood }[];
    lowHearts: { text: string; mood: ExpressionMood }[];
    greeting: string;
  };
  preferredGift: string;
}

export interface RomanceChoice {
  text: string;
  affinityChange: number;
  jealousyChange?: number;
  memoryReward?: number;
  reply: string;
  replyMood: ExpressionMood;
  soundEffect?: "heart" | "blush" | "tsundere";
}

export interface RomanceStep {
  id: string;
  speaker: string;
  dialogue: string;
  translation?: string;
  mood: ExpressionMood;
  choices?: RomanceChoice[];
  sceneNarrative?: string;
}

export interface RomanceEpisode {
  id: string;
  tutorId: TutorId;
  chapterNumber?: number;
  title: string;
  location: string;
  bgImage: string;
  requiredAffinity: number;
  requiredFragments?: number;
  description: string;
  rewardXp: number;
  rewardCoins: number;
  rewardFragments?: number;
  steps: RomanceStep[];
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  type: "energy" | "gift" | "freeze";
  targetTutor?: TutorId;
  affinityBonus?: number;
  jealousyReduction?: number;
  description: string;
}

export interface MistakeNotebookItem {
  id: string;
  questionId: string;
  prompt: string;
  prompt_translation: string | null;
  answer_key: string;
  explanation: string;
  language: string;
  tutorId: TutorId;
  timestamp: string;
}

export interface PlayerStats {
  total_xp: number;
  coins: number;
  hearts: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  affinity: Record<TutorId, number>; // 0 to 100
  jealousy: Record<TutorId, number>; // 0 to 100 (Jealousy meter)
  memoryFragments: number; // Fragments of memory to unlock Story Mode
  inventory: Record<string, number>;
  unlockedEpisodes: string[];
  completedEpisodes: string[];
  customImages?: Partial<Record<TutorId, { neutral?: string; happy?: string; angry?: string; jealous?: string }>>;
  mistakesNotebook?: MistakeNotebookItem[];
}

// Sound synthesizer using Web Audio API for immersive sound effects
export function playSound(type: "correct" | "wrong" | "heart" | "levelup" | "click" | "tsundere") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "correct") {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc2.frequency.setValueAtTime(1046.5, now + 0.16); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now + 0.16);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === "wrong") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.28);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "heart" || type === "tsundere") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "levelup") {
      const notes = [440, 554.37, 659.25, 880];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Ignore audio errors in restricted browser contexts
  }
}

// Dynamic Expression Image Getter synced with character mood (with user custom overrides)
export function getTutorExpressionImage(
  tutorId: TutorId,
  mood: ExpressionMood | string,
  customImages?: Partial<Record<TutorId, { neutral?: string; happy?: string; angry?: string; jealous?: string }>>
): string {
  const m = String(mood || "neutral").toLowerCase();

  // Check custom user override first
  if (customImages && customImages[tutorId]) {
    const custom = customImages[tutorId];
    if (m === "happy" || m === "blushing" || m === "proud") {
      if (custom?.happy) return custom.happy;
    }
    if (m === "angry" || m === "shocked" || m === "worried" || m === "pout") {
      if (custom?.angry) return custom.angry;
    }
    if (m === "jealous") {
      if (custom?.jealous) return custom.jealous;
      if (custom?.angry) return custom.angry;
    }
    if (m === "neutral" && custom?.neutral) return custom.neutral;
  }

  // Master visual novel portraits from user master illustrations
  if (m === "happy" || m === "blushing" || m === "proud") {
    return `/assets/presidents/master/${tutorId}_happy.png`;
  }
  if (m === "angry" || m === "shocked" || m === "worried" || m === "pout") {
    return `/assets/presidents/master/${tutorId}_angry.png`;
  }
  if (m === "jealous") {
    return `/assets/presidents/master/${tutorId}_jealous.png`;
  }
  return `/assets/presidents/master/${tutorId}_portrait.png`;
}

// Jealousy Meter Helper
export function getJealousyRank(score: number): { title: string; color: string; badge: string; isJealous: boolean } {
  if (score >= 60) return { title: "Crise Extrema de Ciúmes! 💢🔥", color: "#d63031", badge: "FURISA", isJealous: true };
  if (score >= 35) return { title: "Ciumenta & Desconfiada ⚡", color: "#e17055", badge: "CIUMENTA", isJealous: true };
  if (score >= 15) return { title: "Olhar Alerta 👀", color: "#fdcb6e", badge: "INSEGURA", isJealous: false };
  return { title: "Tranquila e Confiante 🕊️", color: "#00b894", badge: "CALMA", isJealous: false };
}

// ==========================================
// JEALOUSY SHOWDOWN DUELS (DUAL TUTOR CONFRONTATIONS)
// ==========================================
export interface JealousyShowdownChoice {
  text: string;
  response1: string;
  response2: string;
  mood1: ExpressionMood;
  mood2: ExpressionMood;
  jealousyChange1: number;
  jealousyChange2: number;
  affinityChange1: number;
  affinityChange2: number;
  memoryReward?: number;
}

export interface JealousyShowdown {
  id: string;
  title: string;
  location: string;
  bgImage: string;
  tutor1: TutorId;
  tutor2: TutorId;
  dialogue1: string;
  dialogue2: string;
  context: string;
  choices: JealousyShowdownChoice[];
}

export const JEALOUSY_SHOWDOWNS: JealousyShowdown[] = [
  {
    id: "showdown-aiko-sofia",
    title: "Chamas no Corredor do Conselho: Aiko vs Sofía",
    location: "Corredor Central da Academia",
    bgImage: "/assets/scenarios/tokyo_city_street.webp",
    tutor1: "aiko",
    tutor2: "sofia",
    context: "Aiko e Sofía te cercam simultaneamente após descobrirem que você passou o intervalo estudando com a outra!",
    dialogue1: "B-Baka! Eu vi você conversando no pátio com a Sofía! Não me diga que você esqueceu as regras do Clube de Japonês?!",
    dialogue2: "¡Mi amor! ¡No la escuches! Ela só sabe gritar e fingir que não gosta de você, enquanto eu tenho a paixão espanhola inteira pronta para o seu coração!",
    choices: [
      {
        text: "Diplomacia: 'Aiko é a disciplina que guia minha mente, e Sofía é o fogo que aquece minha coragem. Preciso das duas!'",
        response1: "H-Hmph... dizer isso na minha cara com essa voz calma... baka! Não me deixe sem palavras!",
        response2: "¡Ay, qué galán! Você sabe exatamente como derreter o coração de uma espanhola...",
        mood1: "blushing",
        mood2: "happy",
        jealousyChange1: -20,
        jealousyChange2: -20,
        affinityChange1: 15,
        affinityChange2: 15,
        memoryReward: 2
      },
      {
        text: "Apoiar Aiko: 'Aiko, você foi a primeira a me acolher após o acidente. Meu compromisso é restaurar o Japonês!'",
        response1: "V-viu só, Sofía?! O Presidente reconhece quem realmente importa aqui! ...O-obrigada...",
        response2: "¡¿Qué?! ¡Esto no se va a quedar así! Meu coração está queimando de ciúmes agora!",
        mood1: "happy",
        mood2: "jealous",
        jealousyChange1: -30,
        jealousyChange2: 25,
        affinityChange1: 20,
        affinityChange2: -5,
        memoryReward: 1
      },
      {
        text: "Apoiar Sofía: 'Sofía, sua paixão e o espanhol são irresistíveis. Não consigo tirar os olhos de você!'",
        response1: "O QUÊ?! Inacreditável! Então é isso?! Vá embora e não apareça no meu clube amanhã, baka!",
        response2: "¡Te amo! Eu sabia que você preferia o calor da Espanha à frieza daquele clube!",
        mood1: "angry",
        mood2: "happy",
        jealousyChange1: 30,
        jealousyChange2: -30,
        affinityChange1: -5,
        affinityChange2: 20,
        memoryReward: 1
      }
    ]
  },
  {
    id: "showdown-emily-chloe",
    title: "Disputa Aristocrática: Emily vs Chloé",
    location: "Salão Nobre da Academia",
    bgImage: "/assets/scenarios/japanese_classroom.webp",
    tutor1: "emily",
    tutor2: "chloe",
    context: "Emily e Chloé disputam uma conversa diplomática para decidir qual idioma o Presidente deve priorizar.",
    dialogue1: "Presidente! Nós fundamos a aliança do conselho juntos no ano passado! O inglês é o idioma global que conecta todas as nações!",
    dialogue2: "Quelle vulgarité, Emily. O francês é a língua da diplomacia refinada, da arte e da nobreza. O Presidente merece elegância, non pas rotina.",
    choices: [
      {
        text: "Conciliação: 'O inglês nos dá asas para o mundo, e o francês nos dá poesia para a alma. O Conselho precisa de ambas!'",
        response1: "That is brilliantly said! Você realmente é o líder mais justo que a Academia já teve!",
        response2: "Magnifique réponse... Vejo que sua nobreza de espírito sobreviveu à amnésia intacta.",
        mood1: "happy",
        mood2: "blushing",
        jealousyChange1: -20,
        jealousyChange2: -20,
        affinityChange1: 15,
        affinityChange2: 15,
        memoryReward: 2
      },
      {
        text: "Apoiar Emily: 'Emily é minha parceira executiva desde o início. A lealdade dela ao conselho não tem preço.'",
        response1: "Thank you so much, darling! I'll never let you down!",
        response2: "C'est décevant... Vejo que terei que elevar minhas exigências para você me notar.",
        mood1: "happy",
        mood2: "pout",
        jealousyChange1: -30,
        jealousyChange2: 25,
        affinityChange1: 20,
        affinityChange2: -5,
        memoryReward: 1
      }
    ]
  }
];

// 5 Anime Club Presidents with Rich Lore, Personalities & Expression Reactions
export const TUTORS: Record<TutorId, TutorProfile> = {
  aiko: {
    id: "aiko",
    name: "Aiko Tachibana",
    language: "Japonês",
    languageCode: "ja",
    flag: "🇯🇵",
    archetype: "PRESIDENTE TSUNDERE · CLUBE DE NIHONGO",
    title: "Presidente do Clube de Cultura & Japonês",
    bio: "Você era o Presidente Geral do Conselho antes da amnésia. Aiko sempre foi secretamente apaixonada por você e ficou furiosa quando você esqueceu as tardes que passaram estudando juntos... mas ela fará de tudo para restaurar suas memórias!",
    quote: "B-Baka! Como assim você não lembra de mim?! Nós éramos o Conselho! Agora sente-se e aprenda japonês de novo antes que eu perca a paciência!",
    voiceStyle: "Expressiva, brava por fora, profundamente carinhosa por dentro",
    city: "Tóquio & Kyoto",
    scenario: "/assets/scenarios/japanese_classroom.webp",
    assets: {
      full: "/assets/presidents/master/aiko_full.png",
      portrait: "/assets/presidents/master/aiko_portrait.png",
      expressions: "/assets/presidents/master/aiko_happy.png",
      bg: "/assets/scenarios/japanese_classroom.webp"
    },
    reactions: {
      correct: [
        { text: "Hmph! Não é que você ainda tem o talento de antes?! N-não que eu estivesse torcendo tanto assim, baka!", mood: "blushing" },
        { text: "Sugoi! Você lembrou mesmo desta frase?! Meu coração deu um salto... continue assim!", mood: "happy" },
        { text: "C-certo! Você era o melhor presidente da Academia, então trate de manter o nível!", mood: "proud" }
      ],
      wrong: [
        { text: "B-Baka! Não me diga que a amnésia apagou até o bom senso?! O kanji estava bem ali!", mood: "angry" },
        { text: "Ei! Se continuar errando assim, vou achar que você andou se distraindo com a Sofía!", mood: "shocked" },
        { text: "Ugh... respira fundo e tenta de novo. Eu me recuso a ver o meu Presidente passar vergonha!", mood: "angry" }
      ],
      combo: [
        { text: "E-espere aí! Três acertos seguidos?! É como se o antigo Presidente estivesse voltando... estou tão feliz!", mood: "happy" },
        { text: "Incrível! Se continuar nesse ritmo, eu até deixo você segurar minha mão no conselho...", mood: "blushing" }
      ],
      lowHearts: [
        { text: "Olhe seus corações! Se você desmaiar de novo por excesso de estudo, quem vai cuidar de você sou eu, ouviu bem?!", mood: "worried" }
      ],
      greeting: "Konnichiwa, Presidente! Trouxe o material de hoje. Nem pense em me deixar esperando!"
    },
    preferredGift: "Chá Verde Matcha"
  },
  emily: {
    id: "emily",
    name: "Emily Watson",
    language: "Inglês",
    languageCode: "en",
    flag: "🇬🇧",
    archetype: "PRESIDENTE GENKI · SOCIEDADE ANGLOFÔNICA",
    title: "Presidente da Sociedade Anglofônica & Ex-Vice",
    bio: "Sua antiga Vice-Presidente do Conselho. Emily te conhecia melhor do que ninguém e agora lidera a Sociedade Britânica, determinada a te ajudar a recuperar a fluência com o sorriso mais brilhante da Academia.",
    quote: "Welcome back, my dearest President! Não importa quantas memórias você perdeu, nós vamos reconstruir cada uma juntos!",
    voiceStyle: "Entusiasmada, acolhedora, confiante e extremamente leal",
    city: "Londres",
    scenario: "/assets/tutors/emily/Duck-ai-image-2026-11-08-02-35.jpeg",
    assets: {
      full: "/assets/presidents/master/emily_full.png",
      portrait: "/assets/presidents/master/emily_portrait.png",
      expressions: "/assets/presidents/master/emily_happy.png",
      bg: "/assets/tutors/emily/Duck-ai-image-2026-11-08-02-35.jpeg"
    },
    reactions: {
      correct: [
        { text: "YES! Brilliant, Mr. President! É exatamente essa pronúncia que eu me lembrava!", mood: "happy" },
        { text: "Spot on! Sabia que o seu raciocínio continuava afiado! Você é incrível!", mood: "proud" },
        { text: "Look at you! Dá até vontade de te dar um abraço bem apertado de comemoração!", mood: "blushing" }
      ],
      wrong: [
        { text: "Oh dear! Chegou tão perto! Don't worry, sua vice-presidente está aqui para te apoiar!", mood: "worried" },
        { text: "No panic! Um pequeno tropeço não vai parar o nosso líder. Try once more!", mood: "neutral" },
        { text: "Ops! Deixa que eu te dou uma dica de ouro antes que a Aiko venha brigar com você!", mood: "happy" }
      ],
      combo: [
        { text: "UNSTOPPABLE! Uma sequência dessas merece um chá da tarde a sós na biblioteca!", mood: "blushing" },
        { text: "You're on fire! Tenho tanto orgulho de ter você de volta!", mood: "happy" }
      ],
      lowHearts: [
        { text: "Cuidado com sua energia, darling! Se você ficar sem corações, eu cancelo a reunião do clube!", mood: "worried" }
      ],
      greeting: "Hello, my handsome President! O chá britânico está pronto e nossa aula vai ser lendária!"
    },
    preferredGift: "Livro de Mistério de Sherlock"
  },
  hana: {
    id: "hana",
    name: "Hana Park",
    language: "Coreano",
    languageCode: "ko",
    flag: "🇰🇷",
    archetype: "PRESIDENTE KUUDERE · GRÊMIO DE LITERATURA",
    title: "Presidente do Grêmio de Literatura Hangul",
    bio: "Reservada e analítica, Hana guardava em silêncio todas as atas e memórias dos tempos em que você presidia o conselho. Seu olhar calmo esconde um profundo apego emocional que aos poucos derrete a sua máscara de frieza.",
    quote: "Você pode ter esquecido o meu nome por um instante... mas o meu coração nunca se esqueceu de você.",
    voiceStyle: "Serena, precisa, elegante, com ternura velada",
    city: "Seul",
    scenario: "/assets/scenarios/tokyo_city_street.webp",
    assets: {
      full: "/assets/presidents/master/hana_full.png",
      portrait: "/assets/presidents/master/hana_portrait.png",
      expressions: "/assets/presidents/master/hana_happy.png",
      bg: "/assets/scenarios/tokyo_city_street.webp"
    },
    reactions: {
      correct: [
        { text: "Exato. Sua assimilação do Hangul prova que sua alma de líder não mudou.", mood: "happy" },
        { text: "Resposta precisa. Fico... verdadeiramente feliz em ver você recuperar suas habilidades.", mood: "blushing" },
        { text: "Brilhante. Guardarei essa sua conquista no diário oficial do grêmio.", mood: "proud" }
      ],
      wrong: [
        { text: "Incorreto. Mas a calma é necessária para reorganizar suas memórias. Respire.", mood: "neutral" },
        { text: "Não se precipite, Presidente. Erros acontecem na reabilitação. Tentemos juntos.", mood: "worried" },
        { text: "Eu anotei este detalhe. Nós revisaremos até que faça sentido para você.", mood: "neutral" }
      ],
      combo: [
        { text: "Três acertos perfeitos... confesso que ver sua dedicação faz meu coração bater mais rápido.", mood: "blushing" },
        { text: "Sequência impecável. Você sempre foi a pessoa que mais admirei nesta Academia.", mood: "happy" }
      ],
      lowHearts: [
        { text: "Sua energia está baixa. Por favor, descanse. Sua saúde vem antes de qualquer idioma.", mood: "worried" }
      ],
      greeting: "Annyeonghaseyo, Presidente. Eu reservei nossa sala silenciosa. Estou pronta."
    },
    preferredGift: "Álbum K-Pop Edição Especial"
  },
  sofia: {
    id: "sofia",
    name: "Sofía Del Mar",
    language: "Espanhol",
    languageCode: "es",
    flag: "🇪🇸",
    archetype: "PRESIDENTE DEREDERE · ALIANÇA HISPÂNICA",
    title: "Presidente da Aliança Hispânica & Apaixonada",
    bio: "A mais ardente e ciumenta das cinco líderes. Sofía era completamente apaixonada por você antes da amnésia e quase enlouqueceu de ciúmes ao ver as outras presidentes se aproximando. Ela exige que o espanhol seja a sua primeira língua resgatada!",
    quote: "¡Mi amor! ¡Por fin despiertas! Não olhe para as outras... o seu coração e as suas palavras pertencem a mim!",
    voiceStyle: "Apaixonada, intensa, radiante e ciumenta com charme latino",
    city: "Madrid & Sevilha",
    scenario: "/assets/scenarios/japanese_shop.webp",
    assets: {
      full: "/assets/presidents/master/sofia_full.png",
      portrait: "/assets/presidents/master/sofia_portrait.png",
      expressions: "/assets/presidents/master/sofia_happy.png",
      bg: "/assets/scenarios/japanese_shop.webp"
    },
    reactions: {
      correct: [
        { text: "¡Olé! ¡Maravilloso, mi vida! Sabia que você nunca esqueceria o meu espanhol!", mood: "happy" },
        { text: "¡Qué emoción! Cada palavra certa sua me faz querer te beijar no meio do conselho!", mood: "blushing" },
        { text: "¡Eso es! O grande Presidente voltou, e é o meu namorado do conselho!", mood: "proud" }
      ],
      wrong: [
        { text: "¡¿Cómo que erraste?! Você andou estudando com a Aiko ou com a Emily por acaso?!", mood: "jealous" },
        { text: "¡No me hagas enojar! Foco aqui em mim, olhe nos meus olhos e tente de novo!", mood: "jealous" },
        { text: "¡Ay mi dios! Meu coração quebrou um pedacinho... mas eu conserto se você acertar a próxima!", mood: "worried" }
      ],
      combo: [
        { text: "¡DIOS MÍO! ¡Três acertos seguidos! O meu ciúme derreteu todinho de paixão!", mood: "blushing" },
        { text: "¡Qué fuego! Você nasceu para comandar o conselho ao meu lado, mi cielo!", mood: "happy" }
      ],
      lowHearts: [
        { text: "¡Cuidado com suas vidas! Se você desmaiar, eu fecho o conselho inteiro e ninguém mais fala com você!", mood: "worried" }
      ],
      greeting: "¡Hola, mi rey! O sol da Espanha brilha para nós hoje. Vamos com tudo!"
    },
    preferredGift: "Guitarra Espanhola em Miniatura"
  },
  chloe: {
    id: "chloe",
    name: "Chloé De Valois",
    language: "Francês",
    languageCode: "fr",
    flag: "🇫🇷",
    archetype: "PRESIDENTE OJOU-SAMA · ALIANÇA FRANCESA",
    title: "Presidente da Aliança Francesa de Belas Artes",
    bio: "Aristocrata herdeira de alta linhagem. Chloé sempre tratou o protagonista como o único igual à sua altura na Academia. Ela ficou profundamente abalada com a amnésia dele, mas exige elegância absoluta para reatar os laços do passado.",
    quote: "Mon cher Président... não ouse esquecer os nossos votos. A língua francesa exige perfeição — e eu exijo você.",
    voiceStyle: "Nobre, aristocrática, com um deboche gracioso que esconde adoração",
    city: "Paris",
    scenario: "/assets/scenarios/kyoto_traditional_street.webp",
    assets: {
      full: "/assets/presidents/master/chloe_full.png",
      portrait: "/assets/presidents/master/chloe_portrait.png",
      expressions: "/assets/presidents/master/chloe_happy.png",
      bg: "/assets/scenarios/kyoto_traditional_street.webp"
    },
    reactions: {
      correct: [
        { text: "Très bien! Uma resposta digna do líder supremo do conselho. Merece meus aplausos.", mood: "proud" },
        { text: "Magnifique... Vejo que seu requinte e encanto continuam intocados pela amnésia.", mood: "blushing" },
        { text: "C'est parfait! É esse o homem com quem concordei em governar a Academia.", mood: "happy" }
      ],
      wrong: [
        { text: "Mon dieu... Que gafe constrangedora! Esqueceu as maneiras ou esqueceu de mim?!", mood: "angry" },
        { text: "Hmph! Não admito desleixo diante da minha presença. Recupere sua postura!", mood: "angry" },
        { text: "Uma falha lamentável. Mas um verdadeiro fidalgo se levanta e corrige seu erro imediatamente.", mood: "worried" }
      ],
      combo: [
        { text: "Ohoho~ Impressionante! Três acertos sem hesitar. Confesso que você me conquistou de novo...", mood: "blushing" },
        { text: "Incroyable! Seu talento diplomático está voltando com força total.", mood: "proud" }
      ],
      lowHearts: [
        { text: "Atenção ao seu bem-estar! Seria inadmissível ver o Presidente desfalecer no meu salão.", mood: "worried" }
      ],
      greeting: "Bonjour, mon cher. O chá de lavanda está servido e as memórias de Paris nos esperam."
    },
    preferredGift: "Caixa de Macarons Reais de Paris"
  }
};

// Rich Starter Courses for all 5 Languages
export const COURSES: Course[] = [
  {
    id: "course-ja",
    language_code: "ja",
    language_name: "Japonês",
    native_name: "日本語",
    flag_emoji: "🇯🇵",
    tutor_id: "aiko",
    title: "Fundamentos do Japonês",
    description: "Sua primeira aventura em Tóquio e Kyoto: cumprimentos, apresentações e o cotidiano.",
    destination: "Japão",
    units: [
      {
        id: "unit-ja-1",
        course_id: "course-ja",
        title: "Primeiras Palavras e Saudações",
        description: "Aprenda a cumprimentar, pedir desculpas e se apresentar.",
        sort_order: 1,
        lessons: [
          {
            id: "les-ja-1",
            unit_id: "unit-ja-1",
            title: "Saudações Matinais",
            description: "Cumprimente pessoas no início do dia e use expressões de respeito.",
            lesson_type: "vocabulary",
            xp_reward: 20,
            coin_reward: 10,
            sort_order: 1,
            questions: [
              {
                id: "q-ja-1-1",
                prompt: "おはようございます (Ohayou gozaimasu)",
                prompt_translation: "Qual é o significado desta saudação?",
                question_type: "multiple_choice",
                options: ["Bom dia", "Boa noite", "Até logo", "Obrigado"],
                answer_key: "Bom dia",
                explanation: "おはようございます é a maneira polida de dizer 'Bom dia' em japonês.",
                sound_phrase: "おはようございます"
              },
              {
                id: "q-ja-1-2",
                prompt: "ありがとう (Arigatou)",
                prompt_translation: "O que significa esta expressão?",
                question_type: "multiple_choice",
                options: ["Desculpe", "Obrigado(a)", "Com licença", "Por favor"],
                answer_key: "Obrigado(a)",
                explanation: "ありがとう significa 'Obrigado(a)'. Para soar mais formal, usa-se 'ありがとうございます'.",
                sound_phrase: "ありがとう"
              },
              {
                id: "q-ja-1-3",
                prompt: "Qual palavra significa 'Com licença' ou 'Desculpe'?",
                prompt_translation: "Usada para chamar o garçom ou pedir passagem:",
                question_type: "multiple_choice",
                options: ["すみません (Sumimasen)", "さようなら (Sayounara)", "はい (Hai)", "いいえ (Iie)"],
                answer_key: "すみません (Sumimasen)",
                explanation: "すみません é uma das palavras mais úteis do Japão, servindo para pedir desculpas ou chamar atenção.",
                sound_phrase: "すみません"
              }
            ]
          },
          {
            id: "les-ja-2",
            unit_id: "unit-ja-1",
            title: "Apresentando-se",
            description: "Diga seu nome e pergunte quem é a outra pessoa.",
            lesson_type: "grammar",
            xp_reward: 25,
            coin_reward: 12,
            sort_order: 2,
            questions: [
              {
                id: "q-ja-2-1",
                prompt: "わたしは [Nome] です (Watashi wa ... desu)",
                prompt_translation: "O que a partícula 'は' (wa) indica nesta frase?",
                question_type: "multiple_choice",
                options: ["Indica o tópico da frase ('quanto a mim')", "Indica pergunta", "Indica negação", "Indica despedida"],
                answer_key: "Indica o tópico da frase ('quanto a mim')",
                explanation: "A partícula は (lida como 'wa') marca o tópico principal de quem está falando.",
                sound_phrase: "わたしはがくせいです"
              },
              {
                id: "q-ja-2-2",
                prompt: "はじめまして (Hajimemashite)",
                prompt_translation: "Quando se usa esta expressão?",
                question_type: "multiple_choice",
                options: ["Ao encontrar alguém pela primeira vez ('Prazer em conhecer')", "Ao ir dormir", "Ao agradecer pela comida", "Ao sair de casa"],
                answer_key: "Ao encontrar alguém pela primeira vez ('Prazer em conhecer')",
                explanation: "はじめまして vem de 'começar' e é dito ao conhecer alguém novo.",
                sound_phrase: "はじめまして"
              },
              {
                id: "q-ja-2-3",
                prompt: "Como se diz 'Sim' e 'Não' em japonês?",
                prompt_translation: "Respostas básicas:",
                question_type: "multiple_choice",
                options: ["はい (Hai) / いいえ (Iie)", "ねこ (Neko) / いぬ (Inu)", "みず (Mizu) / おちゃ (Ocha)", "これ (Kore) / あれ (Are)"],
                answer_key: "はい (Hai) / いいえ (Iie)",
                explanation: "はい significa Sim e いいえ significa Não.",
                sound_phrase: "はい"
              }
            ]
          },
          {
            id: "les-ja-3",
            unit_id: "unit-ja-1",
            title: "No Café com Aiko",
            description: "Faça pedidos e pergunte o preço com educação.",
            lesson_type: "vocabulary",
            xp_reward: 30,
            coin_reward: 15,
            sort_order: 3,
            questions: [
              {
                id: "q-ja-3-1",
                prompt: "これは いくらですか (Kore wa ikura desu ka?)",
                prompt_translation: "O que você está perguntando no caixa?",
                question_type: "multiple_choice",
                options: ["Quanto custa isto?", "Onde fica o banheiro?", "Que horas são?", "Qual é o seu nome?"],
                answer_key: "Quanto custa isto?",
                explanation: "いくら (ikura) significa 'quanto (custa)'.",
                sound_phrase: "これはいくらですか"
              },
              {
                id: "q-ja-3-2",
                prompt: "これを ください (Kore o kudasai)",
                prompt_translation: "Significado do pedido:",
                question_type: "multiple_choice",
                options: ["Este, por favor", "Não quero este", "Onde está este?", "Até amanhã"],
                answer_key: "Este, por favor",
                explanation: "ください (kudasai) é a forma educada de pedir 'por favor me dê'.",
                sound_phrase: "これをください"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "course-en",
    language_code: "en",
    language_name: "Inglês",
    native_name: "English",
    flag_emoji: "🇬🇧",
    tutor_id: "emily",
    title: "English from Zero with Emily",
    description: "Destrave seu inglês cotidiano com a energia e simpatia da Emily pelas ruas de Londres.",
    destination: "mundo anglófono",
    units: [
      {
        id: "unit-en-1",
        course_id: "course-en",
        title: "Everyday Greetings & Small Talk",
        description: "Cumprimentos naturais e expressões indispensáveis.",
        sort_order: 1,
        lessons: [
          {
            id: "les-en-1",
            unit_id: "unit-en-1",
            title: "Hello & How are you?",
            description: "Aprenda a cumprimentar e responder com naturalidade.",
            lesson_type: "vocabulary",
            xp_reward: 20,
            coin_reward: 10,
            sort_order: 1,
            questions: [
              {
                id: "q-en-1-1",
                prompt: "'How's it going?'",
                prompt_translation: "Qual o sentido dessa expressão comum em conversas?",
                question_type: "multiple_choice",
                options: ["Como vão as coisas? / Tudo bem?", "Onde você vai?", "Quantas horas são?", "Quem é você?"],
                answer_key: "Como vão as coisas? / Tudo bem?",
                explanation: "'How's it going?' é uma forma muito natural e amigável de perguntar 'Tudo bem?'.",
                sound_phrase: "How is it going?"
              },
              {
                id: "q-en-1-2",
                prompt: "Se alguém diz 'Nice to meet you!', o que você responde?",
                prompt_translation: "Resposta educada de apresentação:",
                question_type: "multiple_choice",
                options: ["Nice to meet you too!", "Good night!", "I don't know.", "See you yesterday."],
                answer_key: "Nice to meet you too!",
                explanation: "Adiciona-se 'too' para dizer 'Prazer em conhecer você também!'.",
                sound_phrase: "Nice to meet you too"
              },
              {
                id: "q-en-1-3",
                prompt: "Qual palavra significa 'Com certeza / Certamente'?",
                prompt_translation: "Muito comum ao concordar animadamente:",
                question_type: "multiple_choice",
                options: ["Definitely", "Never", "Maybe not", "Slowly"],
                answer_key: "Definitely",
                explanation: "'Definitely' expressa certeza e entusiasmo em conversas.",
                sound_phrase: "Definitely"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "course-ko",
    language_code: "ko",
    language_name: "Coreano",
    native_name: "한국어",
    flag_emoji: "🇰🇷",
    tutor_id: "hana",
    title: "Fundamentos do Coreano com Hana",
    description: "Descubra o alfabeto Hangul, cumprimentos e as sutilezas da língua coreana em Seul.",
    destination: "Coreia do Sul",
    units: [
      {
        id: "unit-ko-1",
        course_id: "course-ko",
        title: "Primeiros Passos em Seul",
        description: "Saudações básicas e respeito cultural com Hana.",
        sort_order: 1,
        lessons: [
          {
            id: "les-ko-1",
            unit_id: "unit-ko-1",
            title: "Saudações & Apresentações",
            description: "Aprenda a dizer olá e obrigado em coreano polido.",
            lesson_type: "vocabulary",
            xp_reward: 20,
            coin_reward: 10,
            sort_order: 1,
            questions: [
              {
                id: "q-ko-1-1",
                prompt: "안녕하세요 (Annyeonghaseyo)",
                prompt_translation: "Qual o significado da saudação mais famosa da Coreia?",
                question_type: "multiple_choice",
                options: ["Olá / Como vai?", "Adeus", "Desculpe", "Até amanhã"],
                answer_key: "Olá / Como vai?",
                explanation: "안녕하세요 é o cumprimento educado padrão para todas as horas do dia.",
                sound_phrase: "안녕하세요"
              },
              {
                id: "q-ko-1-2",
                prompt: "감사합니다 (Gamsahamnida)",
                prompt_translation: "Como expressar gratidão:",
                question_type: "multiple_choice",
                options: ["Muito obrigado(a)", "Por favor", "Com licença", "Não quero"],
                answer_key: "Muito obrigado(a)",
                explanation: "감사합니다 é a forma polida e respeitosa de agradecer.",
                sound_phrase: "감사합니다"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "course-es",
    language_code: "es",
    language_name: "Espanhol",
    native_name: "Español",
    flag_emoji: "🇪🇸",
    tutor_id: "sofia",
    title: "Español con Pasión con Sofía",
    description: "Fale com espontaneidade, aprenda expressões calorosas e perca o medo com Sofía.",
    destination: "Espanha e América Latina",
    units: [
      {
        id: "unit-es-1",
        course_id: "course-es",
        title: "Encontros e Conversas",
        description: "Cumprimentos e entusiasmo em espanhol.",
        sort_order: 1,
        lessons: [
          {
            id: "les-es-1",
            unit_id: "unit-es-1",
            title: "¡Hola y Bienvenidos!",
            description: "Diga como se sente e cumprimente seus amigos.",
            lesson_type: "vocabulary",
            xp_reward: 20,
            coin_reward: 10,
            sort_order: 1,
            questions: [
              {
                id: "q-es-1-1",
                prompt: "¿Qué tal? / ¿Cómo estás?",
                prompt_translation: "Qual é a tradução mais comum?",
                question_type: "multiple_choice",
                options: ["E aí? Tudo bem?", "O que você comeu?", "De onde você é?", "Quantos anos você tem?"],
                answer_key: "E aí? Tudo bem?",
                explanation: "'¿Qué tal?' é a forma mais espontânea de cumprimentar no dia a dia.",
                sound_phrase: "¿Qué tal?"
              },
              {
                id: "q-es-1-2",
                prompt: "¡Mucho gusto!",
                prompt_translation: "Expressão usada ao conhecer alguém:",
                question_type: "multiple_choice",
                options: ["Muito prazer!", "Muito obrigado!", "Muito gostoso!", "Até mais tarde!"],
                answer_key: "Muito prazer!",
                explanation: "'Mucho gusto' é o clássico 'Muito prazer em conhecê-lo(a)'.",
                sound_phrase: "Mucho gusto"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "course-fr",
    language_code: "fr",
    language_name: "Francês",
    native_name: "Français",
    flag_emoji: "🇫🇷",
    tutor_id: "chloe",
    title: "Français Élégant avec Chloé",
    description: "Descubra a pronúncia refinada, frases clássicas e a arte de viver parisiense com Chloé.",
    destination: "França",
    units: [
      {
        id: "unit-fr-1",
        course_id: "course-fr",
        title: "Bonjour Paris",
        description: "Polidez e encanto pelas ruas de Paris.",
        sort_order: 1,
        lessons: [
          {
            id: "les-fr-1",
            unit_id: "unit-fr-1",
            title: "Polidez à Francesa",
            description: "As palavras mágicas de respeito em Paris.",
            lesson_type: "vocabulary",
            xp_reward: 20,
            coin_reward: 10,
            sort_order: 1,
            questions: [
              {
                id: "q-fr-1-1",
                prompt: "S'il vous plaît",
                prompt_translation: "O que significa esta fórmula de cortesia?",
                question_type: "multiple_choice",
                options: ["Por favor", "Com licença", "De nada", "Bom dia"],
                answer_key: "Por favor",
                explanation: "'S'il vous plaît' é a forma respeitosa e clássica de dizer 'por favor'.",
                sound_phrase: "S'il vous plaît"
              },
              {
                id: "q-fr-1-2",
                prompt: "Enchanté / Enchantée",
                prompt_translation: "Significado ao ser apresentado:",
                question_type: "multiple_choice",
                options: ["Encantado(a) / Muito prazer", "Até amanhã", "Tenha um bom dia", "Desculpe o atraso"],
                answer_key: "Encantado(a) / Muito prazer",
                explanation: "'Enchanté(e)' expressa o prazer de conhecer alguém com sofisticação.",
                sound_phrase: "Enchanté"
              }
            ]
          }
        ]
      }
    ]
  }
];

// Canonical Story Chapters: "O Presidente Sem Memória e as 5 Presidentes de Clube"
export const STORY_CHAPTERS: RomanceEpisode[] = [
  {
    id: "story-prologue",
    tutorId: "aiko",
    chapterNumber: 0,
    title: "Prólogo: O Despertar do Presidente Sem Memória",
    location: "Gabinete Presidencial do Conselho de Idiomas",
    bgImage: "/assets/scenarios/japanese_classroom.webp",
    requiredAffinity: 0,
    requiredFragments: 0,
    description: "Você acorda com uma forte dor de cabeça na mesa da presidência. Aiko está inclinada sobre você com olhos marejados e o caderno oficial de idiomas nas mãos.",
    rewardXp: 50,
    rewardCoins: 30,
    rewardFragments: 1,
    steps: [
      {
        id: "pro1",
        speaker: "Aiko Tachibana",
        dialogue: "...B-Baka! Você finalmente abriu os olhos! Os médicos disseram que você sofreu amnésia retrógrada no incidente... Como assim você olhou nos meus olhos e perguntou quem eu sou?! Nós éramos o Conselho! Você era o nosso Presidente!",
        mood: "angry",
        sceneNarrative: "Aiko bate as mãos na mesa de carvalho do conselho, corando intensamente com uma mistura de raiva, preocupação e alívio."
      },
      {
        id: "pro2",
        speaker: "Você (Presidente)",
        dialogue: "Como você responde à Presidente do Clube de Japonês?",
        mood: "neutral",
        choices: [
          {
            text: "Aiko... me perdoe. Minha mente está em branco, mas ao olhar para você, meu coração sente que você é a pessoa mais importante da minha vida.",
            affinityChange: 12,
            jealousyChange: -15,
            memoryReward: 1,
            reply: "P-pessoa mais importante?! B-Baka! Dizer isso olhando fixamente nos meus olhos com essa expressão séria não vale...! Mas vou aceitar suas desculpas por hoje.",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Eu realmente presidia o Conselho de Idiomas e dominava 5 línguas antes do acidente?!",
            affinityChange: 8,
            jealousyChange: -5,
            memoryReward: 1,
            reply: "Sim! E era o melhor de toda a Academia! Então trate de se esforçar para recuperar tudo de novo comigo!",
            replyMood: "proud",
            soundEffect: "blush"
          },
          {
            text: "Quem são aquelas outras quatro garotas que estavam na porta do gabinete me olhando?",
            affinityChange: 2,
            jealousyChange: 25,
            memoryReward: 0,
            reply: "Hmph! Acabou de acordar do coma e já quer saber da Emily e da Sofía?! Inacreditável! Se olhar para elas antes de mim, você vai ver só!",
            replyMood: "angry",
            soundEffect: "tsundere"
          }
        ]
      }
    ]
  },
  {
    id: "story-aiko-1",
    tutorId: "aiko",
    chapterNumber: 1,
    title: "Capítulo 1: O Primeiro Kanji e a Promessa de Aiko",
    location: "Sala Tradicional do Clube de Nihongo",
    bgImage: "/assets/scenarios/japanese_classroom.webp",
    requiredAffinity: 10,
    requiredFragments: 1,
    description: "Aiko te chama para a sala tradicional do clube para testar se seus reflexos do japonês ainda residem no seu coração.",
    rewardXp: 60,
    rewardCoins: 35,
    rewardFragments: 1,
    steps: [
      {
        id: "a1",
        speaker: "Aiko Tachibana",
        dialogue: "Sente-se aqui na minha frente, Presidente. Antes do acidente, você me prometeu que iríamos juntos ao festival de Kyoto assim que eu dominasse a caligrafia clássica. Não ouse me dizer que esqueceu disso também!",
        mood: "shocked",
        sceneNarrative: "Ela abre um rolo de pergaminho de caligrafia tradicional, as pontas das fitas vermelhas do cabelo balançando com a respiração ansiosa."
      },
      {
        id: "a2",
        speaker: "Você (Presidente)",
        dialogue: "Como responder à Aiko?",
        mood: "neutral",
        choices: [
          {
            text: "Eu prometo ir ao festival com você, Aiko. Vou reaprender cada kanji só para ver seu sorriso em Kyoto.",
            affinityChange: 10,
            jealousyChange: -10,
            memoryReward: 1,
            reply: "V-você sempre foi desse jeito charmoso e irritante...! Tá bom, me dê a sua mão, vamos treinar os traços juntos.",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Estou pronto para o treinamento, sensei Aiko!",
            affinityChange: 6,
            jealousyChange: -5,
            memoryReward: 1,
            reply: "Hmph! Muito bem. Vamos ver se sua disciplina continua à altura do conselho!",
            replyMood: "happy",
            soundEffect: "blush"
          }
        ]
      }
    ]
  },
  {
    id: "story-emily-1",
    tutorId: "emily",
    chapterNumber: 2,
    title: "Capítulo 2: A Ex-Vice Britânica e a Promessa de Londres",
    location: "Biblioteca Real da Sociedade Anglofônica",
    bgImage: "/assets/tutors/emily/Duck-ai-image-2026-11-08-02-35.jpeg",
    requiredAffinity: 10,
    requiredFragments: 1,
    description: "Emily te recebe com um abraço apertado na biblioteca, segurando o antigo livro de atas do Conselho.",
    rewardXp: 60,
    rewardCoins: 35,
    rewardFragments: 1,
    steps: [
      {
        id: "e1",
        speaker: "Emily Watson",
        dialogue: "My dearest President! Nem acredito que você está de pé! Nós éramos uma dupla imbatível como Presidente e Vice. Olha só as fotos da nossa viagem oficial a Londres... seu inglês era tão charmoso!",
        mood: "happy",
        sceneNarrative: "Emily se senta bem perto de você, o aroma suave de lavanda e chá preto preenchendo o ar enquanto ela aponta para o livro."
      },
      {
        id: "e2",
        speaker: "Você (Presidente)",
        dialogue: "Como responder à Emily?",
        mood: "neutral",
        choices: [
          {
            text: "Emily, sua lealdade é o que mantém minhas esperanças vivas. Com você ao meu lado, sinto que posso recuperar tudo.",
            affinityChange: 11,
            jealousyChange: -10,
            memoryReward: 1,
            reply: "Oh, darling... você sabe exatamente como derreter o coração da sua vice! Let's conquer the world again!",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Vamos traduzir as atas de Londres juntos agora mesmo!",
            affinityChange: 7,
            jealousyChange: -5,
            memoryReward: 1,
            reply: "Brilliant! Adoro quando você assume essa postura confiante de líder!",
            replyMood: "happy",
            soundEffect: "blush"
          }
        ]
      }
    ]
  },
  {
    id: "story-hana-1",
    tutorId: "hana",
    chapterNumber: 3,
    title: "Capítulo 3: O Silêncio de Hana e as Cartas em Hangul",
    location: "Arquivo Reservado do Grêmio de Literatura",
    bgImage: "/assets/scenarios/tokyo_city_street.webp",
    requiredAffinity: 10,
    requiredFragments: 1,
    description: "Hana te entrega um envelope de seda preservado com extremo zelo nos arquivos do clube.",
    rewardXp: 60,
    rewardCoins: 35,
    rewardFragments: 1,
    steps: [
      {
        id: "h1",
        speaker: "Hana Park",
        dialogue: "Presidente... os outros falam alto e fazem alvoroço. Mas eu sei o quanto você se esforçava em silêncio. Guardei todas as notas e cartas em coreano que trocamos na sala dos arquivos.",
        mood: "neutral",
        sceneNarrative: "Os olhos prateados de Hana encontram os seus com uma profundidade que faz o tempo ao redor parecer congelar."
      },
      {
        id: "h2",
        speaker: "Você (Presidente)",
        dialogue: "Como responder à Hana?",
        mood: "neutral",
        choices: [
          {
            text: "Hana... o seu silêncio acolhedor me acalma mais do que mil palavras. Obrigado por cuidar de mim.",
            affinityChange: 11,
            jealousyChange: -10,
            memoryReward: 1,
            reply: "...Suas palavras me tocam profundamente. Deixe-me guiar suas mãos pelo alfabeto sagrado do Hangul.",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Quero ler cada uma das cartas que você guardou com tanto carinho.",
            affinityChange: 7,
            jealousyChange: -5,
            memoryReward: 1,
            reply: "Com prazer. Cada linha foi escrita por você em momentos de pura sinceridade.",
            replyMood: "happy",
            soundEffect: "blush"
          }
        ]
      }
    ]
  },
  {
    id: "story-sofia-1",
    tutorId: "sofia",
    chapterNumber: 4,
    title: "Capítulo 4: Chamas de Ciúme — O Confronto de Sofía",
    location: "Pátio das Rosas da Sociedade Hispânica",
    bgImage: "/assets/scenarios/japanese_shop.webp",
    requiredAffinity: 10,
    requiredFragments: 2,
    description: "Sofía te encurrala contra o arco de pedras do pátio com os olhos em chamas após ver você conversando com as outras garotas.",
    rewardXp: 60,
    rewardCoins: 35,
    rewardFragments: 1,
    steps: [
      {
        id: "so1",
        speaker: "Sofía Del Mar",
        dialogue: "¡¡Oye, Presidente!! ¡Párate ahí mismo! Te vi saliendo del club de japonés con Aiko... ¿Acaso crees que mi corazón es de piedra?! ¡Antes del accidente me prometiste que el español era tu pasión!",
        mood: "angry",
        sceneNarrative: "Sofía cruza os braços e se aproxima perigosamente, a expressão de ciúmes intensa deixando suas bochechas vermelhas como rosas."
      },
      {
        id: "so2",
        speaker: "Você (Presidente)",
        dialogue: "Como você lida com a explosão de ciúmes de Sofía?",
        mood: "neutral",
        choices: [
          {
            text: "Sofía, ninguém nesta Academia tem o fogo e a paixão que você tem. Meu coração sempre acelera mais quando estou com você.",
            affinityChange: 14,
            jealousyChange: -30,
            memoryReward: 1,
            reply: "¡¡AYYY, MI CORAZÓN!! ¡Por Dios, no me digas esas cosas tan hermosas que se me pasa el enojo todito...! ¡Ven aquí!",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Sofía, eu preciso reaprender todos os idiomas pelo Conselho, mas você é insubstituível.",
            affinityChange: 8,
            jealousyChange: -15,
            memoryReward: 1,
            reply: "¡Más te vale, mi rey! ¡Porque si te vuelvo a ver con otra, te amarro a mi silla de español!",
            replyMood: "happy",
            soundEffect: "blush"
          },
          {
            text: "Você não acha que está exagerando no ciúme?",
            affinityChange: -5,
            jealousyChange: 35,
            memoryReward: 0,
            reply: "¡¿Exagerando yo?! ¡¡Eres un descarado!! ¡Ahora vas a conjugar cincuenta verbos en subjuntivo antes de salir de aquí!",
            replyMood: "angry",
            soundEffect: "tsundere"
          }
        ]
      }
    ]
  },
  {
    id: "story-chloe-1",
    tutorId: "chloe",
    chapterNumber: 5,
    title: "Capítulo 5: O Pacto Aristocrático da Presidente de Francês",
    location: "Salão Dourado de Música e Belas Artes",
    bgImage: "/assets/scenarios/kyoto_traditional_street.webp",
    requiredAffinity: 10,
    requiredFragments: 2,
    description: "Chloé te convida para uma taça de chá de lavanda em seu salão particular para revalidar seu status de liderança.",
    rewardXp: 60,
    rewardCoins: 35,
    rewardFragments: 1,
    steps: [
      {
        id: "c1",
        speaker: "Chloé De Valois",
        dialogue: "Bonsoir, mon cher Président. Soube dos escândalos pelos corredores... As outras agem como plebeias desesperadas. Mas eu conheço o seu verdadeiro valor aristocrático. Mostre-me que a língua francesa continua viva na sua alma.",
        mood: "proud",
        sceneNarrative: "Chloé te estende uma xícara de porcelana com a ponta dos dedos delicados, olhando com altivez e expectativa romântica."
      },
      {
        id: "c2",
        speaker: "Você (Presidente)",
        dialogue: "Como responder à Presidente da Aliança Francesa?",
        mood: "neutral",
        choices: [
          {
            text: "Chloé, sua graça e nobreza são a bússola que me guiam de volta à elegância. Vous êtes magnifique.",
            affinityChange: 12,
            jealousyChange: -15,
            memoryReward: 1,
            reply: "M-mon dieu... O seu refinamento continua intacto. Quase me faz esquecer que você passou semanas sem me escrever...",
            replyMood: "blushing",
            soundEffect: "heart"
          },
          {
            text: "Obrigado, Chloé. Estou pronto para provar minha dignidade como líder do Conselho.",
            affinityChange: 7,
            jealousyChange: -5,
            memoryReward: 1,
            reply: "C'est bien. A liderança é uma virtude que corre no seu sangue.",
            replyMood: "happy",
            soundEffect: "blush"
          }
        ]
      }
    ]
  }
];

// Alias for backwards compatibility
export const ROMANCE_EPISODES: RomanceEpisode[] = STORY_CHAPTERS;

// RPG Shop items for energy & romance gifts
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "potion-energy",
    name: "Poção de Energia Vital",
    cost: 35,
    icon: "❤️",
    type: "energy",
    description: "Recupera instantaneamente todos os seus 5 corações para continuar estudando sem pausas."
  },
  {
    id: "gift-matcha",
    name: "Caixa de Chá Matcha Artesanal",
    cost: 45,
    icon: "🍵",
    type: "gift",
    targetTutor: "aiko",
    affinityBonus: 15,
    description: "O presente favorito da Aiko! Ela finge que não liga, mas fica radiante e corada ao receber (+15 Afinidade)."
  },
  {
    id: "gift-book",
    name: "Livro de Mistério Londrino",
    cost: 45,
    icon: "📖",
    type: "gift",
    targetTutor: "emily",
    affinityBonus: 15,
    description: "Emily é apaixonada por romances de detetive de Londres (+15 Afinidade)."
  },
  {
    id: "gift-kpop",
    name: "Álbum K-Pop Edição Limitada",
    cost: 45,
    icon: "🎵",
    type: "gift",
    targetTutor: "hana",
    affinityBonus: 15,
    description: "Um presente especial para Hana. Ela vai sorrir comovida e tímida (+15 Afinidade)."
  },
  {
    id: "gift-guitar",
    name: "Miniatura de Violão Espanhol",
    cost: 45,
    icon: "🎸",
    type: "gift",
    targetTutor: "sofia",
    affinityBonus: 15,
    description: "Sofía vai dar um grito de emoção e te cobrir de elogios apaixonados (+15 Afinidade)."
  },
  {
    id: "gift-macaron",
    name: "Torre de Macarons de Framboesa",
    cost: 45,
    icon: "🧁",
    type: "gift",
    targetTutor: "chloe",
    affinityBonus: 15,
    description: "Os doces parisienses favoritos da Chloé (+15 Afinidade)."
  },
  {
    id: "gift-apology-bouquet",
    name: "Buquê de Desculpas Diplomático",
    cost: 50,
    icon: "💐",
    type: "gift",
    jealousyReduction: 35,
    affinityBonus: 10,
    description: "Flores frescas e elegantes para acalmar os ciúmes de qualquer presidente e restaurar a paz (-35 Ciúmes, +10 Afinidade)."
  },
  {
    id: "gift-council-letter",
    name: "Carta Selada do Antigo Conselho",
    cost: 70,
    icon: "📜",
    type: "gift",
    jealousyReduction: 50,
    affinityBonus: 15,
    description: "Um pergaminho oficial com suas memórias seladas, reafirmando sua devoção e dedicação (-50 Ciúmes, +2 Fragmentos, +15 Afinidade)."
  },
  {
    id: "item-freeze",
    name: "Bloqueio de Ofensiva (Streak Freeze)",
    cost: 60,
    icon: "❄️",
    type: "freeze",
    description: "Protege sua sequência de dias caso você esqueça de estudar amanhã."
  }
];

const LOCAL_STORAGE_KEY = "kotoba_quest_save_v2";

export function getDefaultPlayerStats(): PlayerStats {
  return {
    total_xp: 60,
    coins: 80,
    hearts: 5,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: "2026-11-10T00:00:00.000Z",
    affinity: {
      aiko: 25,
      emily: 15,
      hana: 10,
      sofia: 15,
      chloe: 10
    },
    jealousy: {
      aiko: 20,
      emily: 10,
      hana: 5,
      sofia: 25,
      chloe: 15
    },
    memoryFragments: 1,
    inventory: {
      "potion-energy": 1
    },
    unlockedEpisodes: ["story-prologue", "story-aiko-1", "story-emily-1", "story-hana-1", "story-sofia-1", "story-chloe-1"],
    completedEpisodes: []
  };
}

export function loadPlayerStats(): PlayerStats {
  if (typeof window === "undefined") return getDefaultPlayerStats();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return getDefaultPlayerStats();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultPlayerStats();
    return {
      ...defaults,
      ...parsed,
      affinity: {
        ...defaults.affinity,
        ...(parsed.affinity || {})
      },
      jealousy: {
        ...defaults.jealousy,
        ...(parsed.jealousy || {})
      },
      memoryFragments: typeof parsed.memoryFragments === "number" ? parsed.memoryFragments : defaults.memoryFragments,
      customImages: parsed.customImages || {},
      mistakesNotebook: parsed.mistakesNotebook || []
    };
  } catch {
    return getDefaultPlayerStats();
  }
}

export function savePlayerStats(stats: PlayerStats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // LocalStorage quota or private mode
  }
}

// Affinity Level Titles
export function getAffinityRank(affinityScore: number): { title: string; stars: number; color: string } {
  if (affinityScore >= 80) return { title: "Alma Gêmea de Estudos 💖", stars: 5, color: "#e84393" };
  if (affinityScore >= 60) return { title: "Crush Especial da Academia ✨", stars: 4, color: "#fd79a8" };
  if (affinityScore >= 40) return { title: "Amigo(a) Íntimo(a) 🌸", stars: 3, color: "#6c5ce7" };
  if (affinityScore >= 20) return { title: "Companheiro(a) de Estudos 📚", stars: 2, color: "#0984e3" };
  return { title: "Conhecido(a) Curioso(a) 💬", stars: 1, color: "#00b894" };
}

// ==========================================
// CG GALLERY & ROMANTIC MEMORIES
// ==========================================
export interface MemoryCG {
  id: string;
  tutorId: TutorId;
  title: string;
  image: string;
  requiredAffinity: number;
  description: string;
  unlockedDialogue: string;
}

export const CG_GALLERY: MemoryCG[] = [
  {
    id: "cg-aiko",
    tutorId: "aiko",
    title: "O Primeiro Kanji de Aiko",
    image: "/assets/tutors_new/aiko.jpg",
    requiredAffinity: 25,
    description: "Aiko segurando seus cartões de estudo com as bochechas coradas, tentando não demonstrar o quanto gosta de ensinar você.",
    unlockedDialogue: "“B-Baka... eu não estava esperando você tirar essa foto! Mas guarde com carinho, ouviu bem?!”"
  },
  {
    id: "cg-emily",
    tutorId: "emily",
    title: "Sorriso Radiante em Londres",
    image: "/assets/tutors_new/emily.jpg",
    requiredAffinity: 25,
    description: "Emily com seu blazer britânico e apostila de conversação aberta, vibrando com o seu primeiro diálogo completo em inglês.",
    unlockedDialogue: "“Look at you, superstar! Você mandou tão bem que merecia uma foto comemorativa!”"
  },
  {
    id: "cg-hana",
    tutorId: "hana",
    title: "Tarde Serena de Hangul",
    image: "/assets/tutors_new/hana.jpg",
    requiredAffinity: 20,
    description: "Hana na biblioteca de Seul, olhando com serenidade e afeto genuíno para as suas primeiras anotações perfeitas em coreano.",
    unlockedDialogue: "“Sua letra em Hangul está ganhando forma e beleza. É um privilégio ver você evoluir tão rápido.”"
  },
  {
    id: "cg-sofia",
    tutorId: "sofia",
    title: "Paixão Espanhola na Sala de Aula",
    image: "/assets/tutors_new/sofia.jpg",
    requiredAffinity: 25,
    description: "Sofía segurando a apostila de gramática espanhola com um sorriso apaixonado e caloroso.",
    unlockedDialogue: "“¡Eres el mejor! Estudar com você faz o meu coração bater no ritmo do flamenco!”"
  },
  {
    id: "cg-chloe",
    tutorId: "chloe",
    title: "Elegância Parisiense no Chá",
    image: "/assets/tutors_new/chloe.jpg",
    requiredAffinity: 20,
    description: "Chloé com seu xale lavanda e livro clássico de literatura, recompensando sua pronúncia com um sorriso doce e raro.",
    unlockedDialogue: "“Très bien... Poucos conseguem pronunciar esta frase com tanta classe. Você tem um lugar especial nas minhas memórias.”"
  }
];

// ==========================================
// KOTOBA PHONE MESSAGES (MYSTIC MESSENGER STYLE)
// ==========================================
export interface PhoneMessageEvent {
  id: string;
  tutorId: TutorId;
  time: string;
  preview: string;
  tutorText: string;
  choices: {
    text: string;
    affinityBonus: number;
    reply: string;
  }[];
}

export const PHONE_MESSAGES: PhoneMessageEvent[] = [
  {
    id: "msg-aiko-1",
    tutorId: "aiko",
    time: "21:30",
    preview: "Ei... você já foi dormir?",
    tutorText: "Ei! Só mandei mensagem para saber se você já terminou a revisão dos exercícios de hoje... N-não é como se eu estivesse sentindo sua falta na sala de estudos, viu?!",
    choices: [
      {
        text: "Estava justamente pensando em você e revisando meu caderno!",
        affinityBonus: 6,
        reply: "P-pensando em mim?! 😳 B-Baka! Vai logo dormir para não acordar cansado amanhã... boa noite!"
      },
      {
        text: "Tudo revisado e pronto, sensei Aiko!",
        affinityBonus: 4,
        reply: "Humph, muito bem! Sabia que podia confiar na sua disciplina. Até amanhã!"
      }
    ]
  },
  {
    id: "msg-emily-1",
    tutorId: "emily",
    time: "18:45",
    preview: "Quick English question for you! 🇬🇧",
    tutorText: "Hey mate! Tava tomando um chá agora e lembrei da nossa última aula. Do you remember how to say 'que dia incrível' in English?!",
    choices: [
      {
        text: "What an amazing day! Especially with you, Emily!",
        affinityBonus: 7,
        reply: "SPOT ON! 10/10! And you're so sweet! Can't wait for our next lesson!"
      },
      {
        text: "What a wonderful day!",
        affinityBonus: 4,
        reply: "Brilliant! Your vocabulary is expanding so fast! Keep rocking it!"
      }
    ]
  },
  {
    id: "msg-hana-1",
    tutorId: "hana",
    time: "22:15",
    preview: "오늘 하루도 수고했어 (Bom trabalho hoje)",
    tutorText: "A noite em Seul está fria hoje. Preparei alguns novos exercícios para amanhã. Não se esqueça de descansar e beber água morna.",
    choices: [
      {
        text: "Obrigado pelo cuidado, Hana. Sua dedicação aquece meu coração.",
        affinityBonus: 6,
        reply: "...Fico grata por suas palavras calorosas. Tenha bons sonhos."
      },
      {
        text: "Pode deixar, amanhã estarei 100% focado no Hangul!",
        affinityBonus: 4,
        reply: "Confio no seu potencial. Até amanhã."
      }
    ]
  },
  {
    id: "msg-sofia-1",
    tutorId: "sofia",
    time: "16:20",
    preview: "¡Hola corazón! 💖",
    tutorText: "¡¡Mira esto!! Acabei de ouvir uma música linda em espanhol e lembrei do seu sotaque fofo tentando pronunciar os 'R's! Quando vamos estudar de novo?!",
    choices: [
      {
        text: "Agora mesmo se você quiser, mi amor!",
        affinityBonus: 8,
        reply: "¡¡AYYY!! ¡Sabía que eras el mejor! ¡Te espero con el corazón abierto!"
      },
      {
        text: "Hoje à noite sem falta, Sofía!",
        affinityBonus: 4,
        reply: "¡Trato hecho! ¡No me vayas a fallar!"
      }
    ]
  },
  {
    id: "msg-chloe-1",
    tutorId: "chloe",
    time: "20:05",
    preview: "Une pensée pour notre travail... ☕",
    tutorText: "Bonsoir. Estava escolhendo os poemas franceses para o nosso próximo encontro. Espero que esteja pronto para pronunciá-los com a delicadeza que merecem.",
    choices: [
      {
        text: "Vou me esforçar para alcançar a sua elegância, Chloé.",
        affinityBonus: 7,
        reply: "Um elogio refinado. Estou ansiosa para ouvir sua pronúncia amanhã."
      },
      {
        text: "Estarei pronto para o desafio!",
        affinityBonus: 4,
        reply: "C'est bien. A coragem também é uma virtude admirável."
      }
    ]
  }
];

// ==========================================
// RAPID SPEEDRUN QUESTIONS (60-SECOND BLITZ)
// ==========================================
export interface BlitzQuestion {
  prompt: string;
  options: string[];
  correct: string;
  language: string;
}

export const BLITZ_QUESTIONS: BlitzQuestion[] = [
  { prompt: "Como se diz 'Obrigado' em japonês?", options: ["Arigatou", "Konnichiwa", "Sayounara"], correct: "Arigatou", language: "ja" },
  { prompt: "O que significa 'Hello' em inglês?", options: ["Olá", "Tchau", "Por favor"], correct: "Olá", language: "en" },
  { prompt: "Qual saudação coreana significa 'Olá'?", options: ["Annyeonghaseyo", "Gamsahamnida", "Ne"], correct: "Annyeonghaseyo", language: "ko" },
  { prompt: "O que significa 'Gracias' em espanhol?", options: ["Obrigado(a)", "Bom dia", "De nada"], correct: "Obrigado(a)", language: "es" },
  { prompt: "Como se diz 'Por favor' em francês?", options: ["S'il vous plaît", "Merci", "Bonjour"], correct: "S'il vous plaît", language: "fr" },
  { prompt: "'Ohayou' em japonês significa:", options: ["Bom dia", "Boa noite", "Até logo"], correct: "Bom dia", language: "ja" },
  { prompt: "'Good morning' em inglês é:", options: ["Bom dia", "Boa tarde", "Boa noite"], correct: "Bom dia", language: "en" },
  { prompt: "'Mucho gusto' em espanhol expressa:", options: ["Muito prazer", "Muito obrigado", "Com licença"], correct: "Muito prazer", language: "es" },
  { prompt: "'Merci' em francês significa:", options: ["Obrigado(a)", "Desculpe", "Por favor"], correct: "Obrigado(a)", language: "fr" }
];
