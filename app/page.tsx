"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RpgJourney from "@/components/rpg-journey";
import {
  BookOpen, Brain, Camera, Check, ChevronDown, ChevronRight, Coins, FileText, Flame,
  Heart, Home, Image as ImageIcon, Languages, Lock, LogIn, LogOut, MapPinned, Menu, MessageCircle,
  Package, Play, RotateCcw, Send, Settings, ShoppingBag, Smartphone, Sparkles, Swords, Target, Timer, Trophy, Upload, UserRound, Volume2, X, Zap
} from "lucide-react";
import { authRequest, isSupabaseConfigured, withExpiry, type Session } from "@/lib/supabase";
import {
  BLITZ_QUESTIONS, BlitzQuestion, CG_GALLERY, COURSES, ExpressionMood, JEALOUSY_SHOWDOWNS,
  JealousyShowdown, JealousyShowdownChoice, Lesson, MemoryCG, MistakeNotebookItem, PHONE_MESSAGES,
  PhoneMessageEvent, PlayerStats, ROMANCE_EPISODES, RomanceChoice, RomanceEpisode, SHOP_ITEMS,
  STORY_CHAPTERS, TUTORS, TutorId, TutorProfile, getAffinityRank, getDefaultPlayerStats,
  getJealousyRank, getTutorExpressionImage, loadPlayerStats, playSound, savePlayerStats
} from "@/lib/game-engine";

type Progress = { lesson_id: string; status: "locked" | "in_progress" | "completed"; best_score: number; attempts_count: number };
type Quest = { id: string; title: string; description: string; goal_type: string; goal_value: number; reward_xp: number; progress_value: number; completed_at: string | null };
type AnswerResult = { correct: boolean; correct_answer: string; explanation: string; hearts_remaining: number };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Achievement = { id: string; slug: string; title: string; description: string; icon: string; xp_reward: number; unlocked_at: string | null };

const initialAchievements: Achievement[] = [
  { id: "ach-1", slug: "primeira-vitoria", title: "Primeiro Passo", description: "Conclua sua primeira lição no Kotoba Quest.", icon: "🏆", xp_reward: 20, unlocked_at: "2026-11-01" },
  { id: "ach-2", slug: "tsundere-praise", title: "Coração de Aiko", description: "Alcance mais de 30% de afinidade com a tutora.", icon: "🌸", xp_reward: 35, unlocked_at: null },
  { id: "ach-3", slug: "combo-master", title: "Combo Imparável", description: "Acerte 3 questões consecutivas em uma lição.", icon: "⚡", xp_reward: 30, unlocked_at: null },
  { id: "ach-4", slug: "first-date", title: "Amor Doce", description: "Participe de um encontro romântico com uma tutora.", icon: "💖", xp_reward: 50, unlocked_at: null },
  { id: "ach-5", slug: "polyglot", title: "Poliglota do Mundo", description: "Experimente aulas em mais de dois idiomas.", icon: "🌍", xp_reward: 40, unlocked_at: null }
];

const initialQuests: Quest[] = [
  { id: "q-1", title: "Pratique hoje", description: "Complete uma lição para manter sua ofensiva.", goal_type: "complete_lessons", goal_value: 1, reward_xp: 15, progress_value: 0, completed_at: null },
  { id: "q-2", title: "Coração Aberto", description: "Visite um encontro romântico ou converse com uma tutora.", goal_type: "romance", goal_value: 1, reward_xp: 25, progress_value: 0, completed_at: null },
  { id: "q-3", title: "Mestre dos Idiomas", description: "Ganhe 50 XP acumulados nos exercícios.", goal_type: "earn_xp", goal_value: 50, reward_xp: 30, progress_value: 20, completed_at: null }
];

const languageOptions = [
  { code: "ja", name: "Japonês", native: "日本語", flag: "🇯🇵", tutor: "aiko" as TutorId, course: "Fundamentos do Japonês", destination: "Japão" },
  { code: "en", name: "Inglês", native: "English", flag: "🇬🇧", tutor: "emily" as TutorId, course: "English from Zero", destination: "Londres e o Mundo" },
  { code: "ko", name: "Coreano", native: "한국어", flag: "🇰🇷", tutor: "hana" as TutorId, course: "Coreano do Zero com Hana", destination: "Coreia do Sul" },
  { code: "es", name: "Espanhol", native: "Español", flag: "🇪🇸", tutor: "sofia" as TutorId, course: "Español con Pasión", destination: "Espanha e América Latina" },
  { code: "fr", name: "Francês", native: "Français", flag: "🇫🇷", tutor: "chloe" as TutorId, course: "Français Élégant", destination: "França" }
];

export default function HomePage() {
  const [tab, setTab] = useState("Aprender");
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Game Engine & Romance State
  const [playerStats, setPlayerStats] = useState<PlayerStats>(getDefaultPlayerStats);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("ja");
  const [activeTutor, setActiveTutor] = useState<TutorId>("aiko");
  const [progressRows, setProgressRows] = useState<Progress[]>([]);
  const quests = initialQuests;
  const achievements = initialAchievements;
  const leaderboard = [
    { display_name: "Kenji", total_xp: 420, current_streak: 12, rank_position: 1 },
    { display_name: "Você (Aprendiz)", total_xp: 180, current_streak: 3, rank_position: 2 },
    { display_name: "Yuki", total_xp: 150, current_streak: 2, rank_position: 3 },
    { display_name: "Mateo", total_xp: 120, current_streak: 4, rank_position: 4 },
    { display_name: "Amélie", total_xp: 95, current_streak: 1, rank_position: 5 }
  ];
  const [toast, setToast] = useState("");

  // Lesson Quiz State with Dynamic Expression Reactions
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{ question_id: string; answer: string }[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [lessonResult, setLessonResult] = useState<any>(null);
  const [tutorMood, setTutorMood] = useState<ExpressionMood>("neutral");
  const [tutorQuoteReaction, setTutorQuoteReaction] = useState("");
  const [comboCount, setComboCount] = useState(0);

  // Romance Dating Episode (Amor Doce) State
  const [activeEpisode, setActiveEpisode] = useState<RomanceEpisode | null>(null);
  const [episodeStepIndex, setEpisodeStepIndex] = useState(0);
  const [episodeChoiceChosen, setEpisodeChoiceChosen] = useState<RomanceChoice | null>(null);
  const [giftModalTutor, setGiftModalTutor] = useState<TutorProfile | null>(null);

  // Phone Messenger (Mystic Messenger Style) State
  const [selectedPhoneMsgId, setSelectedPhoneMsgId] = useState<string>("msg-aiko-1");
  const [phoneReplies, setPhoneReplies] = useState<Record<string, { playerReply: string; reply: string }>>({});

  // CG Gallery Modal Preview State
  const [previewCG, setPreviewCG] = useState<MemoryCG | null>(null);

  // 60-Second Speedrun Blitz State
  const [blitzActive, setBlitzActive] = useState(false);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(60);
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzCombo, setBlitzCombo] = useState(0);
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [blitzFinished, setBlitzFinished] = useState(false);

  // Jealousy Showdown Duels (Dual-President Confrontations) State
  const [activeShowdown, setActiveShowdown] = useState<JealousyShowdown | null>(null);
  const [showdownChoiceChosen, setShowdownChoiceChosen] = useState<JealousyShowdownChoice | null>(null);

  // Dressing Room (Camarim & Image Customizer) State
  const [dresserTutorId, setDresserTutorId] = useState<TutorId>("aiko");
  const [dresserPreviewMood, setDresserPreviewMood] = useState<ExpressionMood>("neutral");
  const [customImageInput, setCustomImageInput] = useState<string>("");
  const [customMoodTarget, setCustomMoodTarget] = useState<"all" | "neutral" | "happy" | "angry" | "jealous">("all");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Konnichiwa! Sou a Aiko. Pronta para estudar japonês hoje? Não me faça esperar! ✨" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);
  const chatRequestId = useRef(0);

  // Countdown timer for 60s Blitz mode
  useEffect(() => {
    if (!blitzActive || blitzFinished) return;
    const interval = setInterval(() => {
      setBlitzTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setBlitzActive(false);
          setBlitzFinished(true);
          playSound("levelup");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blitzActive, blitzFinished]);

  // Hydrate player stats safely on client mount to eliminate SSR hydration mismatch
  useEffect(() => {
    const loaded = loadPlayerStats();
    setPlayerStats(loaded);
    setStatsLoaded(true);
  }, []);

  // Save Player Stats locally whenever they change, but ONLY after initial load
  useEffect(() => {
    if (statsLoaded) {
      savePlayerStats(playerStats);
    }
  }, [playerStats, statsLoaded]);

  // Load Session if saved
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const saved = typeof window !== "undefined" ? localStorage.getItem("kotoba-session") : null;
    if (saved) {
      try {
        const parsed = withExpiry(JSON.parse(saved) as Session);
        setSession(parsed);
      } catch {
        localStorage.removeItem("kotoba-session");
      }
    }
  }, []);

  // Sync selected language & tutor
  const currentCourse = useMemo(() => {
    return COURSES.find(c => c.language_code === selectedLanguageCode) || COURSES[0];
  }, [selectedLanguageCode]);

  const currentTutor = useMemo(() => {
    return TUTORS[activeTutor] || TUTORS.aiko;
  }, [activeTutor]);

  const units = currentCourse.units;
  const allLessons = useMemo(() => units.flatMap(u => u.lessons), [units]);
  const progressMap = useMemo(() => new Map(progressRows.map(p => [p.lesson_id, p])), [progressRows]);
  const completedCount = useMemo(() => allLessons.filter(l => progressMap.get(l.id)?.status === "completed").length, [allLessons, progressMap]);
  const level = Math.floor(playerStats.total_xp / 200) + 1;
  const levelProgress = playerStats.total_xp % 200;

  const saveSession = useCallback((next: Session | null) => {
    setSession(next ? withExpiry(next) : null);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem("kotoba-session", JSON.stringify(withExpiry(next)));
      else localStorage.removeItem("kotoba-session");
    }
  }, []);

  async function submitAuth() {
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      if (!isSupabaseConfigured()) {
        // Instant guest account registration
        const guestName = displayName || email.split("@")[0] || "Aprendiz";
        saveSession({
          access_token: "local-token-" + Date.now(),
          refresh_token: "local-refresh",
          user: { id: "local-user-1", email, user_metadata: { display_name: guestName } }
        });
        setAuthOpen(false);
        setToast(`Bem-vindo(a), ${guestName}! Sua conta de aventura está pronta.`);
        return;
      }
      if (authMode === "recover") {
        await authRequest("recover", { email });
        setAuthMessage("Enviamos um link de recuperação para seu e-mail.");
      } else if (authMode === "signup") {
        const result = await authRequest("signup", { email, password, data: { display_name: displayName || "Aprendiz" } });
        if (result.access_token) {
          saveSession(result as Session);
          setAuthOpen(false);
          setToast("Conta criada! Sua jornada no Kotoba Quest começou.");
        } else {
          setAuthMessage("Conta criada! Confira seu e-mail para confirmar.");
          setAuthMode("login");
        }
      } else {
        const result = await authRequest("token?grant_type=password", { email, password });
        saveSession(result as Session);
        setAuthOpen(false);
        setToast("Bem-vindo(a) de volta!");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erro na autenticação.");
    } finally {
      setAuthBusy(false);
    }
  }

  function signOut() {
    saveSession(null);
    setToast("Você agora está no modo visitante.");
  }

  // Speak pronunciation
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setToast("A síntese de voz não está disponível no navegador.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ({ ja: "ja-JP", en: "en-US", ko: "ko-KR", es: "es-ES", fr: "fr-FR" } as Record<string, string>)[selectedLanguageCode] || "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  // Quiz Lesson handlers with dynamic reactions
  function openLesson(item: Lesson, locked: boolean) {
    if (locked) {
      playSound("click");
      setToast("Complete a etapa anterior para desbloquear esta lição.");
      return;
    }
    if (playerStats.hearts <= 0) {
      playSound("wrong");
      setToast("Você ficou sem corações! Visite a Loja de RPG para tomar uma Poção de Energia.");
      setTab("Loja de RPG");
      return;
    }
    playSound("click");
    setLesson(item);
    setQuestionIndex(0);
    setAnswer("");
    setAnswers([]);
    setAnswerResult(null);
    setLessonResult(null);
    setTutorMood("neutral");
    setTutorQuoteReaction(currentTutor.reactions.greeting);
    setComboCount(0);
  }

  function checkAnswer() {
    if (!lesson || !answer.trim()) return;
    setChecking(true);
    const question = lesson.questions[questionIndex];
    const isCorrect = answer.trim() === question.answer_key.trim();

    if (isCorrect) {
      playSound("correct");
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);

      // Reaction
      let mood: ExpressionMood = "happy";
      let quote = currentTutor.reactions.correct[0]?.text || "Muito bem!";
      if (nextCombo >= 3) {
        mood = "blushing";
        quote = currentTutor.reactions.combo[0]?.text || "Combo de acertos! Incrível!";
      } else {
        const pick = currentTutor.reactions.correct[Math.floor(Math.random() * currentTutor.reactions.correct.length)];
        mood = pick.mood;
        quote = pick.text;
      }
      setTutorMood(mood);
      setTutorQuoteReaction(quote);

      // Affinity boost + Jealousy drop for current tutor
      // Other tutors get slightly envious if they already like the player (> 15 affinity)
      setPlayerStats(prev => {
        const tutorId = currentTutor.id;
        const curJealousy = prev.jealousy?.[tutorId] || 0;
        const jealousyDrop = nextCombo >= 2 ? 15 : 6;
        const newJealousyMap = { ...(prev.jealousy || {}) };
        newJealousyMap[tutorId] = Math.max(0, curJealousy - jealousyDrop);

        // Subtle jealousy increase for rivals
        (Object.keys(TUTORS) as TutorId[]).forEach(otherId => {
          if (otherId !== tutorId && (prev.affinity?.[otherId] || 0) > 15) {
            newJealousyMap[otherId] = Math.min(100, (newJealousyMap[otherId] || 0) + 1);
          }
        });

        // Award memory fragment on combo >= 3
        const earnedFragment = nextCombo === 3 ? 1 : 0;
        if (earnedFragment > 0) {
          setToast("✨ Uma memória do seu tempo como Presidente foi restaurada! (+1 Fragmento)");
        }

        return {
          ...prev,
          affinity: {
            ...prev.affinity,
            [tutorId]: Math.min(100, (prev.affinity[tutorId] || 0) + 2)
          },
          jealousy: newJealousyMap,
          memoryFragments: (prev.memoryFragments || 0) + earnedFragment
        };
      });

      setAnswerResult({
        correct: true,
        correct_answer: question.answer_key,
        explanation: question.explanation,
        hearts_remaining: playerStats.hearts
      });
    } else {
      playSound("wrong");
      setComboCount(0);
      const newHearts = Math.max(0, playerStats.hearts - 1);

      // Wrong answer causes slight jealousy / frustration
      setPlayerStats(prev => {
        const tutorId = currentTutor.id;
        const newJealousy = { ...(prev.jealousy || {}) };
        newJealousy[tutorId] = Math.min(100, (newJealousy[tutorId] || 0) + 3);
        return {
          ...prev,
          hearts: newHearts,
          jealousy: newJealousy
        };
      });

      const pick = currentTutor.reactions.wrong[Math.floor(Math.random() * currentTutor.reactions.wrong.length)];
      setTutorMood(pick.mood);
      setTutorQuoteReaction(pick.text);

      // Record mistake into Caderno de Erros for review
      const mistakeItem: MistakeNotebookItem = {
        id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        questionId: question.id,
        prompt: question.prompt,
        prompt_translation: question.prompt_translation,
        answer_key: question.answer_key,
        explanation: question.explanation,
        language: currentCourse.language_name,
        tutorId: currentTutor.id,
        timestamp: new Date().toISOString()
      };
      setPlayerStats(prev => {
        const existing = prev.mistakesNotebook || [];
        const filtered = existing.filter(m => m.prompt !== question.prompt);
        return {
          ...prev,
          mistakesNotebook: [mistakeItem, ...filtered].slice(0, 50)
        };
      });

      setAnswerResult({
        correct: false,
        correct_answer: question.answer_key,
        explanation: question.explanation,
        hearts_remaining: newHearts
      });
    }

    setAnswers(prev => [...prev.filter(a => a.question_id !== question.id), { question_id: question.id, answer: answer.trim() }]);
    setChecking(false);
  }

  function nextQuestion() {
    if (!lesson) return;
    if (questionIndex < lesson.questions.length - 1) {
      playSound("click");
      setQuestionIndex(v => v + 1);
      setAnswer("");
      setAnswerResult(null);
      setTutorMood("neutral");
      setTutorQuoteReaction("");
    } else {
      // Completed lesson
      playSound("levelup");
      const correctCount = answers.filter((a, idx) => a.answer === lesson.questions[idx]?.answer_key).length + (answerResult?.correct ? 1 : 0);
      const score = Math.round((correctCount / lesson.questions.length) * 100);
      const passed = score >= 60;

      if (passed) {
        setPlayerStats(prev => ({
          ...prev,
          total_xp: prev.total_xp + lesson.xp_reward,
          coins: prev.coins + lesson.coin_reward,
          memoryFragments: (prev.memoryFragments || 0) + 1
        }));
        setProgressRows(prev => [
          ...prev.filter(p => p.lesson_id !== lesson.id),
          { lesson_id: lesson.id, status: "completed", best_score: score, attempts_count: 1 }
        ]);
        setToast(`Lição concluída com sucesso! +${lesson.xp_reward} XP, +${lesson.coin_reward} Moedas e +1 Fragmento de Memória!`);
      }

      setLessonResult({
        passed,
        correct: correctCount,
        total: lesson.questions.length,
        score,
        xp_earned: passed ? lesson.xp_reward : 5,
        coins_earned: passed ? lesson.coin_reward : 2
      });
    }
  }

  function closeLesson() {
    setLesson(null);
    setLessonResult(null);
    setAnswer("");
    setAnswers([]);
    setAnswerResult(null);
  }

  // Story Mode Episode Flow
  function startRomanceEpisode(ep: RomanceEpisode) {
    if (ep.requiredFragments && (playerStats.memoryFragments || 0) < ep.requiredFragments) {
      playSound("wrong");
      setToast(`Você precisa de ${ep.requiredFragments} Fragmentos de Memória para desbloquear este capítulo. Pratique lições para recuperar memórias!`);
      return;
    }
    playSound("heart");
    setActiveEpisode(ep);
    setEpisodeStepIndex(0);
    setEpisodeChoiceChosen(null);
  }

  function chooseRomanceOption(choice: RomanceChoice) {
    if (!activeEpisode) return;
    if (choice.soundEffect === "heart") playSound("heart");
    else if (choice.soundEffect === "tsundere") playSound("tsundere");
    else playSound("correct");

    setEpisodeChoiceChosen(choice);
    // Update Affinity & Jealousy & Memory meters!
    const tutorId = activeEpisode.tutorId;
    setPlayerStats(prev => {
      const currentAffinity = prev.affinity[tutorId] || 0;
      const nextAffinity = Math.max(0, Math.min(100, currentAffinity + choice.affinityChange));
      const newJealousy = { ...(prev.jealousy || {}) };
      if (choice.jealousyChange) {
        newJealousy[tutorId] = Math.max(0, Math.min(100, (newJealousy[tutorId] || 0) + choice.jealousyChange));
      }
      const earnedMem = choice.memoryReward || 0;

      return {
        ...prev,
        affinity: {
          ...prev.affinity,
          [tutorId]: nextAffinity
        },
        jealousy: newJealousy,
        memoryFragments: (prev.memoryFragments || 0) + earnedMem
      };
    });
  }

  function nextRomanceStep() {
    if (!activeEpisode) return;
    if (episodeStepIndex < activeEpisode.steps.length - 1) {
      playSound("click");
      setEpisodeStepIndex(v => v + 1);
      setEpisodeChoiceChosen(null);
    } else {
      // Completed episode
      playSound("levelup");
      const bonusMem = activeEpisode.rewardFragments || 1;
      setPlayerStats(prev => ({
        ...prev,
        total_xp: prev.total_xp + activeEpisode.rewardXp,
        coins: prev.coins + activeEpisode.rewardCoins,
        memoryFragments: (prev.memoryFragments || 0) + bonusMem,
        completedEpisodes: [...new Set([...prev.completedEpisodes, activeEpisode.id])]
      }));
      setToast(`Capítulo com ${TUTORS[activeEpisode.tutorId].name} concluído! +${activeEpisode.rewardXp} XP, +${activeEpisode.rewardCoins} Moedas e +${bonusMem} Fragmento(s) de Memória!`);
      setActiveEpisode(null);
    }
  }

  // Gift Giving Modal
  function giveGift(item: typeof SHOP_ITEMS[0], tutor: TutorProfile) {
    if (playerStats.coins < item.cost) {
      playSound("wrong");
      setToast("Você não possui Kotoba Coins suficientes para este presente.");
      return;
    }
    playSound("heart");
    setPlayerStats(prev => {
      const currentAffinity = prev.affinity[tutor.id] || 0;
      const currentJealousy = prev.jealousy?.[tutor.id] || 0;
      const newJealousy = { ...(prev.jealousy || {}) };
      newJealousy[tutor.id] = Math.max(0, currentJealousy - (item.jealousyReduction || 15));

      return {
        ...prev,
        coins: prev.coins - item.cost,
        affinity: {
          ...prev.affinity,
          [tutor.id]: Math.min(100, currentAffinity + (item.affinityBonus || 15))
        },
        jealousy: newJealousy,
        memoryFragments: (prev.memoryFragments || 0) + (item.id === "gift-council-letter" ? 2 : 0)
      };
    });
    setToast(`Você presenteou ${tutor.name} com ${item.name}! Ciúmes apaziguados e afinidade aumentada! 💖`);
    setGiftModalTutor(null);
  }

  function buyShopItem(item: typeof SHOP_ITEMS[0]) {
    if (playerStats.coins < item.cost) {
      playSound("wrong");
      setToast("Moedas insuficientes! Conclua mais lições para ganhar moedas.");
      return;
    }
    if (item.type === "energy") {
      playSound("heart");
      setPlayerStats(prev => ({
        ...prev,
        coins: prev.coins - item.cost,
        hearts: 5
      }));
      setToast("Poção usada! Todos os seus 5 corações foram restaurados!");
    } else {
      playSound("click");
      setPlayerStats(prev => ({
        ...prev,
        coins: prev.coins - item.cost,
        inventory: {
          ...prev.inventory,
          [item.id]: (prev.inventory[item.id] || 0) + 1
        }
      }));
      setToast(`Item adquirido: ${item.name}! Guardado no seu inventário.`);
    }
  }

  // Switch Tutor & Chat
  function switchTutor(tutorKey: TutorId) {
    setActiveTutor(tutorKey);
    const tutor = TUTORS[tutorKey];
    chatRequestId.current += 1;
    setChatMessages([
      { role: "assistant", content: `${tutor.reactions.greeting} ${tutor.quote}` }
    ]);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const reqId = ++chatRequestId.current;
    const next = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(next);
    setChatInput("");
    setChatBusy(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor: activeTutor,
          messages: next.slice(-10),
          learner: { level, totalXp: playerStats.total_xp, currentStreak: playerStats.current_streak }
        })
      });
      const data = await response.json();
      if (reqId === chatRequestId.current) {
        setChatMessages(v => [...v, { role: "assistant", content: data.reply || "Vamos tentar novamente!" }]);
      }
    } catch {
      if (reqId === chatRequestId.current) {
        setChatMessages(v => [...v, { role: "assistant", content: `${currentTutor.name}: Tivemos uma pequena oscilação de conexão, mas estou aqui com você! Vamos continuar!` }]);
      }
    } finally {
      if (reqId === chatRequestId.current) setChatBusy(false);
    }
  }

  // Phone Messenger Choice Handler
  function choosePhoneOption(msg: PhoneMessageEvent, choice: typeof msg.choices[0]) {
    playSound("heart");
    setPlayerStats(prev => ({
      ...prev,
      affinity: {
        ...prev.affinity,
        [msg.tutorId]: Math.min(100, (prev.affinity[msg.tutorId] || 0) + choice.affinityBonus)
      }
    }));
    setPhoneReplies(prev => ({
      ...prev,
      [msg.id]: {
        playerReply: choice.text,
        reply: choice.reply
      }
    }));
    setToast(`Mensagem enviada para ${TUTORS[msg.tutorId].name}! +${choice.affinityBonus}% de Afinidade! 💖`);
  }

  // 60-Second Blitz Speedrun Handlers
  function startBlitz() {
    setBlitzActive(true);
    setBlitzFinished(false);
    setBlitzTimeLeft(60);
    setBlitzScore(0);
    setBlitzCombo(0);
    setBlitzIndex(0);
    playSound("click");
  }

  function answerBlitz(chosen: string) {
    const q = BLITZ_QUESTIONS[blitzIndex % BLITZ_QUESTIONS.length];
    if (chosen === q.correct) {
      playSound("correct");
      const nextCombo = Math.min(5, blitzCombo + 1);
      setBlitzCombo(nextCombo);
      setBlitzScore(prev => prev + 10 * nextCombo);
    } else {
      playSound("wrong");
      setBlitzCombo(0);
    }
    setBlitzIndex(prev => prev + 1);
  }

  function finishAndClaimBlitz() {
    const xpBonus = blitzScore * 2;
    const coinBonus = Math.max(10, Math.floor(blitzScore / 2));
    setPlayerStats(prev => ({
      ...prev,
      total_xp: prev.total_xp + xpBonus,
      coins: prev.coins + coinBonus
    }));
    playSound("levelup");
    setToast(`Blitz concluído! Você recebeu +${xpBonus} XP e +${coinBonus} Moedas! 🔥`);
    setBlitzFinished(false);
  }

  // Camarim & Customizer Handlers
  function applyCustomImage(tutorId: TutorId, moodTarget: string, imageUrl: string) {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    setPlayerStats(prev => {
      const curOverrides = { ...(prev.customImages?.[tutorId] || {}) };
      if (moodTarget === "all") {
        curOverrides.neutral = trimmed;
        curOverrides.happy = trimmed;
        curOverrides.angry = trimmed;
        curOverrides.jealous = trimmed;
      } else if (moodTarget === "happy") {
        curOverrides.happy = trimmed;
      } else if (moodTarget === "angry") {
        curOverrides.angry = trimmed;
      } else if (moodTarget === "jealous") {
        curOverrides.jealous = trimmed;
      } else {
        curOverrides.neutral = trimmed;
      }
      return {
        ...prev,
        customImages: {
          ...(prev.customImages || {}),
          [tutorId]: curOverrides
        }
      };
    });
    setCustomImageInput("");
    playSound("heart");
    setToast(`Arte visual atualizada para ${TUTORS[tutorId].name}! ✨`);
  }

  function resetCustomImages(tutorId: TutorId) {
    setPlayerStats(prev => {
      const nextMap = { ...(prev.customImages || {}) };
      delete nextMap[tutorId];
      return {
        ...prev,
        customImages: nextMap
      };
    });
    playSound("click");
    setToast(`Ilustração mestre original restaurada para ${TUTORS[tutorId].name}.`);
  }

  function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>, tutorId: TutorId, moodTarget: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Por favor selecione um arquivo de imagem válido (PNG, JPEG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = evt => {
      const result = evt.target?.result;
      if (typeof result === "string") {
        applyCustomImage(tutorId, moodTarget, result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Mistakes Notebook Handler
  function removeMistake(id: string) {
    playSound("correct");
    setPlayerStats(prev => ({
      ...prev,
      mistakesNotebook: (prev.mistakesNotebook || []).filter(m => m.id !== id)
    }));
    setToast("Item revisado e arquivado com sucesso! ✓");
  }

  // Jealousy Showdown Duels Handlers
  function startShowdown(duel: JealousyShowdown) {
    playSound("tsundere");
    setActiveShowdown(duel);
    setShowdownChoiceChosen(null);
  }

  function chooseShowdownOption(choice: JealousyShowdownChoice) {
    if (!activeShowdown) return;
    playSound("heart");
    setShowdownChoiceChosen(choice);
    setPlayerStats(prev => {
      const t1 = activeShowdown.tutor1;
      const t2 = activeShowdown.tutor2;
      const newAffinity = { ...(prev.affinity || {}) };
      newAffinity[t1] = Math.max(0, Math.min(100, (newAffinity[t1] || 0) + choice.affinityChange1));
      newAffinity[t2] = Math.max(0, Math.min(100, (newAffinity[t2] || 0) + choice.affinityChange2));

      const newJealousy = { ...(prev.jealousy || {}) };
      newJealousy[t1] = Math.max(0, Math.min(100, (newJealousy[t1] || 0) + choice.jealousyChange1));
      newJealousy[t2] = Math.max(0, Math.min(100, (newJealousy[t2] || 0) + choice.jealousyChange2));

      return {
        ...prev,
        affinity: newAffinity,
        jealousy: newJealousy,
        memoryFragments: (prev.memoryFragments || 0) + (choice.memoryReward || 0)
      };
    });
  }

  function finishShowdown() {
    if (!activeShowdown) return;
    playSound("levelup");
    setToast(`Duelo resolvido diplomaticamente! +${showdownChoiceChosen?.memoryReward || 1} Fragmento(s) de Memória recuperado(s)!`);
    setActiveShowdown(null);
    setShowdownChoiceChosen(null);
  }

  // Navigation Items
  const navItems = [
    { label: "Aprender", icon: Home },
    { label: "Modo História", icon: Heart, tag: "LORE" },
    { label: "Camarim & Tutores", icon: Sparkles, tag: "FOTOS 🎨" },
    { label: "Caderno de Erros", icon: FileText, tag: (playerStats.mistakesNotebook?.length || 0) > 0 ? `${playerStats.mistakesNotebook?.length} 📝` : undefined },
    { label: "Mensagens (SMS)", icon: Smartphone, tag: "CHAT" },
    { label: "Galeria de CGs", icon: Camera, tag: "ÁLBUM" },
    { label: "Blitz 60s", icon: Timer, tag: "DESAFIO" },
    { label: "Jornada RPG", icon: MapPinned },
    { label: "Loja de RPG", icon: ShoppingBag },
    { label: "Conversar", icon: MessageCircle, tag: "IA" },
    { label: "Ranking", icon: Trophy },
    { label: "Meu perfil", icon: UserRound }
  ];

  return (
    <main className="app-shell">
      {/* Topbar Duolingo Stats */}
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobilePanel(v => !v)} aria-label="Abrir menu">
          {mobilePanel ? <X /> : <Menu />}
        </button>
        <a className="brand" href="#inicio" onClick={() => setTab("Aprender")}>
          <span className="brand-mark">言</span>
          <span>KOTOBA <i>QUEST</i></span>
        </a>

        <div className="top-stats" suppressHydrationWarning>
          <div className="stat-pill streak" title="Dias seguidos estudando">
            <Flame size={17} /><b suppressHydrationWarning>{playerStats.current_streak}</b><span>dias</span>
          </div>
          <div className="stat-pill" title="Seus corações de energia. Recarregue na Loja de RPG!">
            <Heart size={17} fill="currentColor" color="#e74c3c" /><b suppressHydrationWarning>{playerStats.hearts}/5</b>
          </div>
          <div className="stat-pill" title="Fragmentos de memória recuperados do seu tempo como Presidente do Conselho!">
            <Brain size={17} color="#a29bfe" /><b suppressHydrationWarning>{playerStats.memoryFragments || 0}</b><span>memórias</span>
          </div>
          <div className="stat-pill coins" title="Kotoba Coins para presentes e poções">
            <Coins size={17} /><b suppressHydrationWarning>{playerStats.coins}</b>
          </div>
          <div className="stat-pill xp" title="Sua experiência total">
            <Zap size={17} fill="currentColor" /><b suppressHydrationWarning>{playerStats.total_xp} XP</b>
          </div>
        </div>

        <button className="avatar-button" suppressHydrationWarning title={session ? "Perfil conectado" : "Entrar ou criar conta"} onClick={() => session ? signOut() : setAuthOpen(true)}>
          {session?.user.email?.slice(0, 2).toUpperCase() || <LogIn size={17} />}
        </button>
      </header>

      {/* Main Layout */}
      <div className="layout">
        <aside className={`sidebar ${mobilePanel ? "sidebar-open" : ""}`}>
          <div className="side-label">MENU DE AVENTURA</div>
          {navItems.map(({ label, icon: Icon, tag }) => (
            <button
              key={label}
              className={`nav-item ${tab === label ? "active" : ""}`}
              onClick={() => { setTab(label); setMobilePanel(false); playSound("click"); }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {tag && <span className="new-tag">{tag}</span>}
            </button>
          ))}

          <div className="side-card">
            <div className="side-card-icon"><Heart size={20} color="#e84393" /></div>
            <b>Modo História & Ciúmes</b>
            <p>Descubra suas memórias perdidas e equilibre o afeto e os ciúmes das 5 Presidentes de Clube!</p>
            <button className="small-cta" onClick={() => setTab("Modo História")}>Ver Modo História</button>
          </div>

          <div className="sidebar-bottom">
            <Settings size={16} /> Kotoba v2.5 · Estilo Duolingo & Amor Doce
          </div>
        </aside>

        <section className="content">
          {/* TAB: APRENDER (Duolingo Learning Path) */}
          {tab === "Aprender" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">DUOLINGO REVERSE-ENGINEERED · ANIME COMPANIONS</div>
                  <h1>Aprenda {currentCourse.language_name} com {currentTutor.name}.</h1>
                  <p className="muted">{currentCourse.description}</p>
                </div>

                <div className="language-select" role="group" aria-label="Idioma de estudo">
                  <span className="language-select-icon"><Languages size={18} /></span>
                  <span className="language-select-copy">
                    <small>IDIOMA ATUAL</small>
                    <strong className="language-select-value">{currentCourse.flag_emoji} {currentCourse.language_name}</strong>
                  </span>
                  <ChevronDown className="language-select-chevron" size={17} />
                  <select
                    className="language-select-native"
                    value={selectedLanguageCode}
                    onChange={e => {
                      const code = e.target.value;
                      setSelectedLanguageCode(code);
                      const opt = languageOptions.find(l => l.code === code);
                      if (opt) setActiveTutor(opt.tutor);
                      playSound("click");
                    }}
                  >
                    {languageOptions.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name} (Tutora: {TUTORS[l.tutor].name})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hero Editorial Card */}
              <section className="hero-card hero-editorial">
                <div className="hero-copy">
                  <span className="chapter-tag"><Sparkles size={12} /> {currentTutor.archetype}</span>
                  <h2>{currentTutor.name}: <em>“{currentTutor.quote}”</em></h2>
                  <p>{currentTutor.bio}</p>
                  <div className="hero-actions">
                    <button className="hero-button" onClick={() => {
                      const first = allLessons[0];
                      if (first) openLesson(first, false);
                    }}>
                      Continuar Trilha de Lições <ChevronRight size={16} />
                    </button>
                    <button className="hero-text-button" onClick={() => setTab("Modo História")}>
                      Explorar Modo História <Heart size={14} color="#ff7aa2" />
                    </button>
                  </div>
                  <div className="hero-meta" suppressHydrationWarning>
                    <span suppressHydrationWarning><Zap size={14} /> Nível {level} ({levelProgress}/200 XP)</span>
                    <span suppressHydrationWarning><Coins size={14} /> {playerStats.coins} Moedas</span>
                    <span suppressHydrationWarning><Flame size={14} /> {playerStats.current_streak} dias de sequência</span>
                  </div>
                </div>

                <div className="aiko-art">
                  <img
                    src={playerStats.customImages?.[currentTutor.id]?.neutral || currentTutor.assets.full || currentTutor.assets.portrait}
                    alt={currentTutor.name}
                    onError={e => { e.currentTarget.src = currentTutor.assets.portrait; }}
                  />
                </div>

                <div className="hero-caption">
                  <b>{currentTutor.name}</b>
                  <strong>{currentTutor.title}</strong>
                  <span>{currentTutor.city} · Afinidade: {playerStats.affinity[currentTutor.id] || 0}%</span>
                </div>
              </section>

              {/* Learning Path Units */}
              <div className="section-heading">
                <div>
                  <div className="eyebrow">TRILHA DE LIÇÕES DUOLINGO</div>
                  <h2>{currentCourse.title}</h2>
                </div>
                <span className="unit-pill">{completedCount}/{allLessons.length} CONCLUÍDAS</span>
              </div>

              {units.map((unit, unitIdx) => (
                <div className="unit-block" key={unit.id}>
                  <div className="unit-heading">
                    <span className="unit-number">{String(unitIdx + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{unit.title}</b>
                      <small>{unit.description}</small>
                    </div>
                  </div>
                  <div className="lesson-list">
                    {unit.lessons.map((item, i) => {
                      const done = progressMap.get(item.id)?.status === "completed";
                      const unlocked = i === 0 || unit.lessons.slice(0, i).every(l => progressMap.get(l.id)?.status === "completed");
                      const locked = !done && !unlocked;
                      return (
                        <div className={`lesson-row ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`} key={item.id}>
                          <div className={`lesson-node ${done ? "done" : unlocked ? "current" : ""}`}>
                            {done ? <Check size={19} /> : locked ? <Lock size={16} /> : <BookOpen size={18} />}
                          </div>
                          <div className="lesson-info">
                            <b>{item.title}</b>
                            <span>{item.description}</span>
                          </div>
                          <div className="lesson-reward"><Zap size={14} />+{item.xp_reward} XP · +{item.coin_reward} 🪙</div>
                          {done ? (
                            <button className="start-button" onClick={() => openLesson(item, false)}>Revisar</button>
                          ) : (
                            <button className="start-button" onClick={() => openLesson(item, locked)}>
                              {locked ? "Bloqueada" : "Iniciar"} <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* TAB: MODO HISTÓRIA (Amnesia Lore, Story Chapters & Jealousy System) */}
          {tab === "Modo História" && (
            <div className="page-view romance-hub">
              <section className="romance-banner">
                <span className="romance-kicker"><Heart size={14} /> MODO HISTÓRIA · A LENDA DO CONSELHO DE IDIOMAS</span>
                <h1>O Despertar do Presidente Sem Memória & As 5 Presidentes</h1>
                <p>
                  Antes da amnésia retrógrada, você era o lendário Presidente Geral do Conselho de Idiomas da Academia Internacional. 
                  Ao perder a memória, você esqueceu todas as 5 línguas e as promessas feitas a cada uma das presidentes de clube. 
                  Reaprenda os idiomas nas lições para resgatar <b>Fragmentos de Memória</b>, avance nos capítulos da história e controle 
                  o <b>Medidor de Ciúmes</b> para evitar brigas entre elas!
                </p>
                <div className="romance-stats-strip">
                  <div className="romance-stat-pill" suppressHydrationWarning>
                    <Brain size={16} color="#a29bfe" /> <b suppressHydrationWarning>{playerStats.memoryFragments || 0}</b> Fragmentos Recuperados
                  </div>
                  <div className="romance-stat-pill">
                    <Heart size={16} color="#ff7aa2" /> 5 Presidentes Apaixonadas
                  </div>
                  <div className="romance-stat-pill">
                    <Sparkles size={16} color="#f1c40f" /> {STORY_CHAPTERS.length} Capítulos de Novela Visual
                  </div>
                </div>
              </section>

              {/* Story Chapters Roadmap */}
              <div className="section-heading">
                <div>
                  <div className="eyebrow">CRÔNICAS DA ACADEMIA</div>
                  <h2>Capítulos da História Principal</h2>
                </div>
                <span className="unit-pill">
                  {playerStats.completedEpisodes?.length || 0}/{STORY_CHAPTERS.length} CAPÍTULOS COMPLETOS
                </span>
              </div>

              <div className="story-chapters-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 36 }}>
                {STORY_CHAPTERS.map(chapter => {
                  const tutor = TUTORS[chapter.tutorId];
                  const isCompleted = playerStats.completedEpisodes?.includes(chapter.id);
                  const reqMem = chapter.requiredFragments || 0;
                  const isLocked = (playerStats.memoryFragments || 0) < reqMem;

                  return (
                    <article
                      key={chapter.id}
                      className="story-chapter-card"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: isCompleted ? "1px solid rgba(46, 204, 113, 0.4)" : isLocked ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(162, 155, 254, 0.4)",
                        borderRadius: 16,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative"
                      }}
                    >
                      <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                        <img src={chapter.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isLocked ? 0.4 : 0.75 }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,16,33,0.95), transparent)" }} />
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 8,
                            backdropFilter: "blur(4px)"
                          }}
                        >
                          CAPÍTULO {chapter.chapterNumber ?? 0}
                        </span>
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "rgba(108, 92, 231, 0.8)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 8
                          }}
                        >
                          {tutor.flag} {tutor.name}
                        </span>
                        <div style={{ position: "absolute", bottom: 8, left: 12, right: 12 }}>
                          <span style={{ fontSize: 11, color: "#a29bfe", display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPinned size={12} /> {chapter.location}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <b style={{ fontSize: 14, color: "#f5f3ff", display: "block", marginBottom: 6 }}>{chapter.title}</b>
                          <p style={{ fontSize: 11, color: "#c1bcb2", lineHeight: 1.5, margin: "0 0 12px" }}>{chapter.description}</p>
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 12, color: "#9589a8" }}>
                            <span>Requer: <b style={{ color: isLocked ? "#e74c3c" : "#2ecc71" }}>{reqMem} Memórias</b></span>
                            <span style={{ color: "#f1c40f" }}>+{chapter.rewardXp} XP · +{chapter.rewardCoins} 🪙</span>
                          </div>

                          <button
                            className="btn-romance-date"
                            style={{
                              width: "100%",
                              opacity: isLocked ? 0.6 : 1,
                              background: isCompleted ? "rgba(46, 204, 113, 0.2)" : undefined,
                              border: isCompleted ? "1px solid #2ecc71" : undefined
                            }}
                            onClick={() => startRomanceEpisode(chapter)}
                          >
                            {isCompleted ? (
                              <><Check size={14} color="#2ecc71" /> Rejogar Capítulo</>
                            ) : isLocked ? (
                              <><Lock size={14} /> Bloqueado ({reqMem} memórias)</>
                            ) : (
                              <><Heart size={14} /> Iniciar Capítulo</>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Jealousy Showdown Duels (Confrontos ao Vivo de Ciúmes) */}
              <div className="section-heading">
                <div>
                  <div className="eyebrow">CONFRONTOS DIRETOS · AMOR DOCE & CIÚMES</div>
                  <h2>⚔️ Duelos de Ciúmes do Conselho Estudantil</h2>
                </div>
                <span className="unit-pill">DISPUTAS DE AFETO AO VIVO</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 36 }}>
                {JEALOUSY_SHOWDOWNS.map(duel => {
                  const t1 = TUTORS[duel.tutor1];
                  const t2 = TUTORS[duel.tutor2];
                  return (
                    <article
                      key={duel.id}
                      style={{
                        background: "linear-gradient(135deg, rgba(35, 18, 55, 0.95), rgba(65, 20, 60, 0.85))",
                        border: "1.5px solid rgba(255, 122, 162, 0.35)",
                        borderRadius: 20,
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 12px 35px rgba(25, 10, 40, 0.35)",
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: "#f7b731", textTransform: "uppercase" }}>
                            ⚔️ DUELO DE CIÚMES
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                            <MapPinned size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            {duel.location}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "14px 0" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", border: "2px solid #8065d9", margin: "0 auto 6px" }}>
                              <img src={getTutorExpressionImage(duel.tutor1, "angry", playerStats.customImages)} alt={t1.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <b style={{ fontSize: 11, color: "#fff" }}>{t1.name}</b>
                          </div>

                          <div style={{ font: "800 18px Manrope", color: "#ff7aa2", letterSpacing: 1 }}>VS</div>

                          <div style={{ textAlign: "center" }}>
                            <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", border: "2px solid #e84393", margin: "0 auto 6px" }}>
                              <img src={getTutorExpressionImage(duel.tutor2, "jealous", playerStats.customImages)} alt={t2.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <b style={{ fontSize: 11, color: "#fff" }}>{t2.name}</b>
                          </div>
                        </div>

                        <b style={{ fontSize: 14, color: "#f5f3ff", display: "block", marginBottom: 6 }}>{duel.title}</b>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "0 0 16px" }}>
                          {duel.context}
                        </p>
                      </div>

                      <button
                        className="btn-romance-date"
                        style={{ width: "100%", background: "linear-gradient(110deg, #ff6b9d, #e84393)", border: "none" }}
                        onClick={() => startShowdown(duel)}
                      >
                        <Swords size={16} /> Resolver Disputa de Ciúmes
                      </button>
                    </article>
                  );
                })}
              </div>

              {/* Dossier & Jealousy Meter for the 5 Presidents */}
              <div className="section-heading">
                <div>
                  <div className="eyebrow">DOSSIÊ DO CONSELHO & CIÚMES</div>
                  <h2>As 5 Presidentes & Status Emocional</h2>
                </div>
              </div>

              <div className="tutors-romance-grid">
                {(Object.keys(TUTORS) as TutorId[]).map(tutorKey => {
                  const tutor = TUTORS[tutorKey];
                  const affinity = playerStats.affinity[tutorKey] || 0;
                  const jealousyScore = playerStats.jealousy?.[tutorKey] || 0;
                  const rank = getAffinityRank(affinity);
                  const jealousyRank = getJealousyRank(jealousyScore);

                  // Expression preview based on dynamic mood & jealousy
                  const displayMood = jealousyRank.isJealous ? "angry" : affinity >= 35 ? "blushing" : "neutral";
                  const portraitSrc = getTutorExpressionImage(tutorKey, displayMood, playerStats.customImages);

                  return (
                    <article className="tutor-romance-card" key={tutorKey}>
                      <div className="tutor-card-cover">
                        <img src={tutor.assets.bg || tutor.scenario} alt="" />
                        <div className="tutor-card-cover-overlay" />
                        <span className="tutor-archetype-tag">{tutor.archetype}</span>
                        <div className="tutor-card-avatar">
                          <img src={portraitSrc} alt={tutor.name} />
                        </div>
                        <span className="tutor-card-city"><MapPinned size={14} /> {tutor.city}</span>
                      </div>

                      <div className="tutor-card-body">
                        <div className="tutor-card-head">
                          <div>
                            <b>{tutor.name}</b>
                            <small>{tutor.title} · {tutor.language}</small>
                          </div>
                          <span className="tutor-card-flag">{tutor.flag}</span>
                        </div>

                        <div className="tutor-quote-box">
                          “{tutor.quote}”
                        </div>

                        {/* Lovômetro (Afinidade) */}
                        <div className="love-meter" style={{ marginBottom: 12 }}>
                          <div className="love-meter-head">
                            <span className="love-meter-title"><Heart size={14} fill="#e84393" /> Lovômetro (Afeto)</span>
                            <span className="love-meter-score">{affinity}%</span>
                          </div>
                          <div className="love-meter-track">
                            <div className="love-meter-fill" style={{ width: `${affinity}%` }} />
                          </div>
                          <div className="love-meter-rank">
                            <span>Status: {rank.title}</span>
                            <span>{rank.stars} ⭐</span>
                          </div>
                        </div>

                        {/* Medidor de Ciúmes (Jealousy Meter) */}
                        <div className="love-meter jealousy-meter" style={{ background: "rgba(0,0,0,0.25)", padding: "10px 12px", borderRadius: 10, border: `1px solid ${jealousyRank.color}40` }}>
                          <div className="love-meter-head" style={{ marginBottom: 6 }}>
                            <span className="love-meter-title" style={{ color: jealousyRank.color, display: "flex", alignItems: "center", gap: 5 }}>
                              <Flame size={14} color={jealousyRank.color} /> Ciúmes: {jealousyRank.badge}
                            </span>
                            <span className="love-meter-score" style={{ color: jealousyRank.color, fontWeight: 800 }}>{jealousyScore}%</span>
                          </div>
                          <div className="love-meter-track" style={{ height: 6, background: "rgba(255,255,255,0.1)" }}>
                            <div
                              className="love-meter-fill"
                              style={{
                                width: `${jealousyScore}%`,
                                background: jealousyRank.isJealous ? "linear-gradient(90deg, #fdcb6e, #d63031)" : "#00b894"
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 10, color: jealousyRank.color, marginTop: 4, fontStyle: "italic" }}>
                            {jealousyRank.title}
                          </div>
                        </div>

                        <div className="tutor-card-actions" style={{ marginTop: 14 }}>
                          <button
                            className="btn-romance-date"
                            onClick={() => {
                              setSelectedLanguageCode(tutor.languageCode);
                              setActiveTutor(tutorKey);
                              setTab("Aprender");
                              playSound("click");
                            }}
                          >
                            <BookOpen size={14} /> Estudar {tutor.language}
                          </button>
                          <button className="btn-romance-gift" onClick={() => setGiftModalTutor(tutor)}>
                            <Package size={14} /> Acalmar Ciúmes
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: JORNADA RPG */}
          {tab === "Jornada RPG" && (
            <RpgJourney
              languageName={currentCourse.language_name}
              languageCode={selectedLanguageCode}
              languageFlag={currentCourse.flag_emoji}
              tutorName={currentTutor.name}
              stats={playerStats}
              units={units}
              progress={Object.fromEntries(progressRows.map(row => [row.lesson_id, row]))}
              quests={quests}
              achievements={achievements}
              onStartLesson={openLesson}
            />
          )}

          {/* TAB: LOJA DE RPG */}
          {tab === "Loja de RPG" && (
            <div className="page-view">
              <div className="eyebrow">MERCADO DE ITENS & PRESENTES</div>
              <h1>Loja de Aventura</h1>
              <p className="muted">Use suas Kotoba Coins ganhas nas lições para recarregar vidas ou comprar presentes para as garotas.</p>

              <div className="shop-grid">
                {SHOP_ITEMS.map(item => (
                  <article className="shop-card" key={item.id}>
                    <div className="shop-card-icon">{item.icon}</div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="shop-card-footer">
                      <span className="shop-card-price"><Coins size={16} /> {item.cost} Moedas</span>
                      <button
                        className="shop-card-btn"
                        disabled={playerStats.coins < item.cost}
                        onClick={() => buyShopItem(item)}
                      >
                        Comprar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CONVERSAR (AI Anime Chat) */}
          {tab === "Conversar" && (
            <div className="page-view tutor-page">
              <div className="eyebrow">PRÁTICA DE CONVERSAÇÃO ANIME</div>
              <h1>Converse com sua Companheira</h1>
              <p className="muted">Escolha sua tutora e pratique diálogos com a personalidade única de cada uma.</p>

              <div className="tutor-selector">
                {(Object.keys(TUTORS) as TutorId[]).map(tKey => (
                  <button
                    key={tKey}
                    className={activeTutor === tKey ? "active" : ""}
                    onClick={() => switchTutor(tKey)}
                  >
                    <b>{TUTORS[tKey].name}</b>
                    <small>{TUTORS[tKey].archetype}</small>
                    <small className="tutor-selector-language">{TUTORS[tKey].flag} {TUTORS[tKey].language}</small>
                  </button>
                ))}
              </div>

              <div className="tutor-layout">
                <div className={`tutor-profile tutor-profile-${activeTutor}`}>
                  <span className="tutor-personality-kicker">{currentTutor.archetype}</span>
                  <img
                    src={currentTutor.assets.full || currentTutor.assets.portrait}
                    alt={currentTutor.name}
                    onError={e => { e.currentTarget.src = currentTutor.assets.portrait; }}
                  />
                  <b>{currentTutor.name}</b>
                  <strong className="tutor-personality-title">{currentTutor.title}</strong>
                  <span>Afinidade: {playerStats.affinity[activeTutor] || 0}%</span>
                  <div className="tutor-tip">“{currentTutor.quote}”</div>
                </div>

                <div className="chat-panel">
                  <div className="chat-head">
                    <div>
                      <b>Sala de Conversação com {currentTutor.name}</b>
                      <small>{currentTutor.language} · {currentTutor.city}</small>
                    </div>
                    <span className="live-dot">● online</span>
                  </div>

                  <div className="chat-messages">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
                    ))}
                    {chatBusy && <div className="chat-bubble assistant typing">{currentTutor.name} está digitando…</div>}
                  </div>

                  <div className="chat-suggestions">
                    {[
                      `Como digo "Bom dia" em ${currentTutor.language}?`,
                      "Você gosta de estudar comigo?",
                      "Me ensine uma expressão típica do seu país!"
                    ].map(s => (
                      <button key={s} onClick={() => setChatInput(s)}>{s}</button>
                    ))}
                  </div>

                  <form className="chat-compose" onSubmit={e => { e.preventDefault(); sendChat(); }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={`Escreva em português ou ${currentTutor.language.toLowerCase()}…`}
                    />
                    <button disabled={chatBusy || !chatInput.trim()} aria-label="Enviar"><Send size={18} /></button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MENSAGENS (SMS / Mystic Messenger Style) */}
          {tab === "Mensagens (SMS)" && (
            <div className="page-view">
              <div className="eyebrow">CELULAR KOTOBA · NOTIFICAÇÕES PRIVADAS</div>
              <h1>Mensagens das Tutores</h1>
              <p className="muted">Troque mensagens de texto com as personagens para aprofundar sua afinidade e desbloquear diálogos exclusivos.</p>

              <div className="phone-hub">
                <div className="phone-sidebar">
                  <div className="phone-sidebar-head">
                    <Smartphone size={18} />
                    <b>Caixa de Entrada ({PHONE_MESSAGES.length})</b>
                  </div>
                  <div className="phone-conv-list">
                    {PHONE_MESSAGES.map(msg => {
                      const tutor = TUTORS[msg.tutorId];
                      const isReplied = !!phoneReplies[msg.id];
                      return (
                        <button
                          key={msg.id}
                          className={`phone-conv-item ${selectedPhoneMsgId === msg.id ? "active" : ""}`}
                          onClick={() => setSelectedPhoneMsgId(msg.id)}
                        >
                          <div className="phone-conv-avatar">
                            <img src={tutor.assets.portrait} alt={tutor.name} />
                          </div>
                          <div className="phone-conv-info">
                            <b>
                              <span>{tutor.name} {tutor.flag}</span>
                              <small>{msg.time}</small>
                            </b>
                            <p>{isReplied ? "✓ Respondido" : msg.preview}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const currentMsg = PHONE_MESSAGES.find(m => m.id === selectedPhoneMsgId) || PHONE_MESSAGES[0];
                  const tutor = TUTORS[currentMsg.tutorId];
                  const stateForMsg = phoneReplies[currentMsg.id];
                  return (
                    <div className="phone-chat-screen">
                      <div className="phone-chat-head">
                        <div className="phone-conv-avatar">
                          <img src={tutor.assets.portrait} alt={tutor.name} />
                        </div>
                        <div>
                          <b style={{ fontSize: 15, color: "#281e3a" }}>{tutor.name}</b>
                          <small style={{ display: "block", color: "#8065d9", fontWeight: 700 }}>
                            {tutor.archetype} · Afinidade {playerStats.affinity[tutor.id] || 0}%
                          </small>
                        </div>
                      </div>

                      <div className="phone-messages-flow">
                        <div className="phone-bubble tutor">
                          {currentMsg.tutorText}
                        </div>

                        {stateForMsg && (
                          <>
                            <div className="phone-bubble player">
                              {stateForMsg.playerReply}
                            </div>
                            <div className="phone-bubble tutor">
                              {stateForMsg.reply}
                            </div>
                          </>
                        )}
                      </div>

                      {!stateForMsg ? (
                        <div className="phone-choice-shelf">
                          <span>ESCOLHA COMO RESPONDER:</span>
                          {currentMsg.choices.map((c, idx) => (
                            <button
                              key={idx}
                              className="phone-option-btn"
                              onClick={() => choosePhoneOption(currentMsg, c)}
                            >
                              <span>{c.text}</span>
                              <small style={{ color: "#e84393" }}>+{c.affinityBonus}% 💖</small>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "#8065d9", fontWeight: 700 }}>
                          ✨ Mensagem concluída! Afinidade aumentada com {tutor.name}.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: GALERIA DE CGS (Memórias Românticas) */}
          {tab === "Galeria de CGs" && (
            <div className="page-view">
              <div className="eyebrow">ÁLBUM DE RECORDAÇÕES · AMOR DOCE</div>
              <h1>Galeria de Memórias (CGs)</h1>
              <p className="muted">Desbloqueie ilustrações exclusivas em alta definição aumentando o Lovômetro com cada tutora.</p>

              <div className="cg-grid">
                {CG_GALLERY.map(cg => {
                  const tutor = TUTORS[cg.tutorId];
                  const currentAffinity = playerStats.affinity[cg.tutorId] || 0;
                  const isUnlocked = currentAffinity >= cg.requiredAffinity;

                  return (
                    <article
                      key={cg.id}
                      className={`cg-card ${isUnlocked ? "" : "locked"}`}
                      onClick={() => isUnlocked && setPreviewCG(cg)}
                    >
                      <img className="cg-card-img" src={cg.image} alt={cg.title} />
                      <div className="cg-card-overlay">
                        <span className="cg-card-badge">
                          {isUnlocked ? <Sparkles size={12} /> : <Lock size={12} />}
                          {isUnlocked ? "MEMÓRIA DESBLOQUEADA" : `Exige ${cg.requiredAffinity}% com ${tutor.name}`}
                        </span>
                        <b>{cg.title}</b>
                        <p>{isUnlocked ? cg.description : "Continue estudando e participando de encontros para revelar esta cena."}</p>
                        <div className="affinity-meter-wrap" style={{ marginTop: 4 }}>
                          <div className="affinity-bar-track" style={{ height: 6 }}>
                            <div className="affinity-bar-fill" style={{ width: `${Math.min(100, (currentAffinity / cg.requiredAffinity) * 100)}%`, height: 6 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                            <span>Afinidade atual</span>
                            <b>{currentAffinity}% / {cg.requiredAffinity}%</b>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: BLITZ 60S (Desafio Speedrun) */}
          {tab === "Blitz 60s" && (
            <div className="page-view">
              <div className="eyebrow">EVENTO ESPECIAL · DESAFIO DE VELOCIDADE</div>
              <h1>Blitz Multilíngue (60 Segundos)</h1>
              <p className="muted">Teste seus reflexos linguísticos! Responda o máximo de perguntas em 60 segundos para multiplicar sua recompensa de XP e Moedas.</p>

              <div className="blitz-shell">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Timer size={24} color="#f7b731" />
                    <div>
                      <b style={{ fontSize: 20 }}>{blitzTimeLeft}s restantes</b>
                      <small style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                        {blitzActive ? "Tempo correndo! Rápido!" : blitzFinished ? "Tempo esgotado!" : "Pronto para o desafio?"}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>PONTUAÇÃO</span>
                      <strong style={{ display: "block", fontSize: 22, color: "#f7b731" }}>{blitzScore} pts</strong>
                    </div>
                    {blitzCombo > 1 && (
                      <span className="combo-badge">🔥 {blitzCombo}x COMBO!</span>
                    )}
                  </div>
                </div>

                <div className="blitz-timer-bar">
                  <div
                    className="blitz-timer-fill"
                    style={{ width: `${(blitzTimeLeft / 60) * 100}%` }}
                  />
                </div>

                {!blitzActive && !blitzFinished && (
                  <div className="blitz-question-card">
                    <Sparkles size={36} color="#f7b731" style={{ margin: "0 auto 10px" }} />
                    <h2>Prepare-se para o Speedrun!</h2>
                    <p style={{ maxWidth: 460, margin: "0 auto 20px", fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
                      Perguntas aleatórias de vocabulário e saudações dos 5 idiomas (Japonês, Inglês, Coreano, Espanhol e Francês). Cada acerto em sequência aumenta o multiplicador de Combo!
                    </p>
                    <button className="primary-button" onClick={startBlitz} style={{ padding: "14px 28px", fontSize: 14 }}>
                      <Play size={18} /> Iniciar Desafio (60s)
                    </button>
                  </div>
                )}

                {blitzActive && (
                  <div className="blitz-question-card">
                    <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                      QUESTÃO #{blitzIndex + 1}
                    </span>
                    <h2>{BLITZ_QUESTIONS[blitzIndex % BLITZ_QUESTIONS.length].prompt}</h2>
                    <div className="blitz-answers-grid">
                      {BLITZ_QUESTIONS[blitzIndex % BLITZ_QUESTIONS.length].options.map(opt => (
                        <button
                          key={opt}
                          className="blitz-ans-btn"
                          onClick={() => answerBlitz(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {blitzFinished && (
                  <div className="blitz-question-card">
                    <div style={{ fontSize: 44, marginBottom: 8 }}>🏆</div>
                    <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#f7b731" }}>
                      DESAFIO CONCLUÍDO!
                    </span>
                    <h2>Pontuação Final: {blitzScore} Pontos!</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", margin: "8px 0 20px" }}>
                      Recompensa calculada: <b>+{blitzScore * 2} XP</b> e <b>+{Math.max(10, Math.floor(blitzScore / 2))} Moedas</b>
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button className="primary-button" onClick={finishAndClaimBlitz}>
                        Resgatar Recompensas & Continuar
                      </button>
                      <button className="secondary-button" onClick={startBlitz}>
                        <RotateCcw size={16} /> Tentar Novamente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: RANKING */}
          {tab === "Ranking" && (
            <div className="page-view">
              <div className="eyebrow">LIGA KOTOBA</div>
              <h1>Classificação Geral</h1>
              <p className="muted">Suba de liga acumulando XP nas lições e encontros românticos!</p>
              <div className="leaderboard-card">
                <div className="leaderboard-title">
                  <Trophy />
                  <div>
                    <b>Liga Diamante</b>
                    <small>Top aprendizes desta semana</small>
                  </div>
                </div>
                {leaderboard.map((entry, i) => (
                  <div className={`leader-row ${entry.display_name.includes("Você") ? "self" : ""}`} key={i}>
                    <span className={`rank-number rank-${i + 1}`}>{entry.rank_position}</span>
                    <span className="leader-avatar">{entry.display_name.slice(0, 1)}</span>
                    <div>
                      <b>{entry.display_name}</b>
                      <small>{entry.current_streak} dias seguidos</small>
                    </div>
                    <strong>{entry.total_xp} XP</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MEU PERFIL */}
          {tab === "Meu perfil" && (
            <div className="page-view profile-page">
              <div className="eyebrow">DADOS DO APRENDIZ</div>
              <h1>Meu Perfil de Aventura</h1>
              <div className="learner-profile-hero">
                <div className="learner-avatar">
                  {session?.user.email?.slice(0, 1).toUpperCase() || "言"}
                </div>
                <div>
                  <span className="chapter-tag">APRENDIZ KOTOBA</span>
                  <h2>{session?.user.user_metadata?.display_name || "Mestre dos Idiomas"}</h2>
                  <p>{session?.user.email || "Perfil local offline sincronizado"}</p>
                </div>
              </div>

              <div className="profile-stat-grid">
                <article><Zap /><b>{playerStats.total_xp}</b><span>XP acumulado</span></article>
                <article><Coins /><b>{playerStats.coins}</b><span>Moedas</span></article>
                <article><Flame /><b>{playerStats.current_streak}</b><span>Dias seguidos</span></article>
                <article><Heart /><b>{playerStats.hearts}/5</b><span>Corações</span></article>
              </div>
            </div>
          )}

          {/* TAB: CAMARIM & TUTORAS (Customizador & Galeria das 5 Presidentes) */}
          {(tab === "Camarim & Tutores" || tab === "Tutoras") && (
            <div className="page-view">
              <div className="eyebrow">ESTÚDIO DE PERSONAGENS · ILUSTRAÇÕES MESTRE & EXPRESSÕES</div>
              <h1>Camarim das 5 Presidentes do Conselho</h1>
              <p className="muted">
                Visualize as ilustrações mestres em alta resolução, teste as reações e expressões emocionais de cada tutora,
                e personalize ou substitua as imagens por qualquer arte ou foto que desejar!
              </p>

              <div className="dresser-shell">
                {/* 5-President Selector Strip */}
                <div className="dresser-selector-strip" role="tablist" aria-label="Selecione a Tutora">
                  {(Object.keys(TUTORS) as TutorId[]).map(id => {
                    const t = TUTORS[id];
                    const active = dresserTutorId === id;
                    return (
                      <button
                        key={id}
                        className={`dresser-tutor-btn ${active ? "active" : ""}`}
                        onClick={() => {
                          setDresserTutorId(id);
                          playSound("click");
                        }}
                      >
                        <span>{t.flag}</span>
                        <b>{t.name}</b>
                        <small style={{ opacity: 0.8 }}>({t.language})</small>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Dressing Stage & Expression Tester */}
                {(() => {
                  const selTutor = TUTORS[dresserTutorId];
                  const currentImg = getTutorExpressionImage(dresserTutorId, dresserPreviewMood, playerStats.customImages);
                  const isCustom = !!playerStats.customImages?.[dresserTutorId];

                  return (
                    <div className="dresser-stage-grid">
                      {/* Left: Sprite Stage & Emotion Tester */}
                      <div className="dresser-stage-card">
                        <div className="dresser-stage-glow" />
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3, marginBottom: 8 }}>
                          <span className="chapter-tag" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                            {selTutor.flag} {selTutor.archetype}
                          </span>
                          {isCustom && (
                            <span style={{ fontSize: 10, background: "#e84393", color: "#fff", padding: "3px 8px", borderRadius: 8, fontWeight: 800 }}>
                              ARTE PERSONALIZADA ATIVA
                            </span>
                          )}
                        </div>

                        <div className="dresser-sprite-container">
                          <img
                            key={`${dresserTutorId}-${dresserPreviewMood}-${currentImg}`}
                            src={currentImg || selTutor.assets.full}
                            alt={selTutor.name}
                            onError={e => { e.currentTarget.src = selTutor.assets.portrait; }}
                          />
                        </div>

                        {/* Emotion Switcher */}
                        <div className="emotion-test-bar">
                          {(
                            [
                              { mood: "neutral" as ExpressionMood, label: "😐 Neutra" },
                              { mood: "happy" as ExpressionMood, label: "🥰 Feliz / Corada" },
                              { mood: "angry" as ExpressionMood, label: "😤 Brava / Tsundere" },
                              { mood: "jealous" as ExpressionMood, label: "💢 Ciumenta" }
                            ] as const
                          ).map(({ mood, label }) => (
                            <button
                              key={mood}
                              className={`emotion-pill-btn ${dresserPreviewMood === mood ? "active" : ""}`}
                              onClick={() => {
                                setDresserPreviewMood(mood);
                                playSound(mood === "happy" ? "heart" : mood === "angry" || mood === "jealous" ? "tsundere" : "click");
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <div style={{ marginTop: 14, textAlign: "center", zIndex: 3 }}>
                          <b style={{ fontSize: 15, color: "#fff", display: "block" }}>{selTutor.name}</b>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{selTutor.title} · {selTutor.city}</span>
                        </div>
                      </div>

                      {/* Right: Customizer & Uploader Form */}
                      <div className="dresser-customizer-card">
                        <div>
                          <span className="chapter-tag" style={{ background: "#f2ecfa", color: "#8065d9", marginBottom: 6 }}>
                            PERSONALIZAR IMAGEM DE {selTutor.name.toUpperCase()}
                          </span>
                          <h3>Substituir ou Atualizar Arte Visual</h3>
                          <p>
                            Você pode carregar uma imagem do seu computador/celular ou colar a URL de uma imagem para substituir o retrato desta tutora.
                            A alteração é salva localmente e aplicada em todas as lições, diálogos do Modo História e duelos!
                          </p>
                        </div>

                        <div className="dresser-form-group">
                          <label>Expressão de Destino</label>
                          <select
                            className="dresser-input"
                            value={customMoodTarget}
                            onChange={e => setCustomMoodTarget(e.target.value as any)}
                          >
                            <option value="all">Todas as Expressões (Substituição Geral)</option>
                            <option value="neutral">Apenas Neutra 😐</option>
                            <option value="happy">Apenas Feliz / Apaixonada 🥰</option>
                            <option value="angry">Apenas Brava / Tsundere 😤</option>
                            <option value="jealous">Apenas Ciumenta / Provocante 💢</option>
                          </select>
                        </div>

                        <div className="dresser-form-group">
                          <label>Opção 1: Enviar Arquivo do seu Dispositivo</label>
                          <label className="dresser-file-drop">
                            <Upload size={24} color="#8065d9" style={{ margin: "0 auto 6px" }} />
                            <b style={{ display: "block", fontSize: 12, color: "#54466b" }}>Clique para escolher uma imagem local</b>
                            <span style={{ fontSize: 10, color: "#9288a7" }}>Formatos recomendados: PNG, JPG ou WebP</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageFileUpload(e, dresserTutorId, customMoodTarget)}
                            />
                          </label>
                        </div>

                        <div className="dresser-form-group">
                          <label>Opção 2: Ou cole uma URL de imagem direta</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="dresser-input"
                              style={{ flex: 1 }}
                              placeholder="https://exemplo.com/minha-imagem.png"
                              value={customImageInput}
                              onChange={e => setCustomImageInput(e.target.value)}
                            />
                            <button
                              className="primary-button"
                              disabled={!customImageInput.trim()}
                              onClick={() => applyCustomImage(dresserTutorId, customMoodTarget, customImageInput)}
                            >
                              Aplicar URL
                            </button>
                          </div>
                        </div>

                        <div className="dresser-actions">
                          {isCustom && (
                            <button
                              className="secondary-button"
                              onClick={() => resetCustomImages(dresserTutorId)}
                              style={{ borderColor: "#e74c3c", color: "#e74c3c" }}
                            >
                              <RotateCcw size={14} /> Restaurar Ilustração Mestre Original
                            </button>
                          )}
                          <button
                            className="primary-button"
                            onClick={() => {
                              setSelectedLanguageCode(selTutor.languageCode);
                              setActiveTutor(dresserTutorId);
                              setTab("Aprender");
                              playSound("click");
                            }}
                          >
                            <BookOpen size={14} /> Praticar {selTutor.language} com {selTutor.name}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* President Dossier Grid */}
                <div className="section-heading" style={{ marginTop: 20 }}>
                  <div>
                    <div className="eyebrow">ELENCO OFICIAL</div>
                    <h2>Todas as 5 Presidentes de Clube</h2>
                  </div>
                </div>

                <div className="tutors-romance-grid">
                  {(Object.keys(TUTORS) as TutorId[]).map(k => {
                    const t = TUTORS[k];
                    const activePortrait = getTutorExpressionImage(k, "neutral", playerStats.customImages);
                    return (
                      <article className="tutor-romance-card" key={k}>
                        <div className="tutor-card-cover">
                          <img src={t.assets.bg || t.scenario} alt="" />
                          <div className="tutor-card-cover-overlay" />
                          <span className="tutor-archetype-tag">{t.archetype}</span>
                          <div className="tutor-card-avatar">
                            <img src={activePortrait} alt={t.name} />
                          </div>
                        </div>
                        <div className="tutor-card-body">
                          <b>{t.name} · {t.language} {t.flag}</b>
                          <small>{t.title}</small>
                          <p style={{ fontSize: 11, color: "#665778", margin: "10px 0", lineHeight: 1.6 }}>{t.bio}</p>
                          <div className="tutor-quote-box">“{t.quote}”</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button
                              className="btn-romance-date"
                              style={{ flex: 1 }}
                              onClick={() => {
                                setDresserTutorId(k);
                                window.scrollTo({ top: 180, behavior: "smooth" });
                              }}
                            >
                              <Sparkles size={14} /> Personalizar
                            </button>
                            <button
                              className="btn-romance-gift"
                              onClick={() => { switchTutor(k); setTab("Conversar"); }}
                            >
                              <MessageCircle size={14} /> Chat
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CADERNO DE ERROS (Mistakes Notebook) */}
          {tab === "Caderno de Erros" && (
            <div className="page-view">
              <div className="eyebrow">REVISÃO INTELIGENTE · CADERNO DE ERROS</div>
              <h1>Caderno de Erros da Academia</h1>
              <p className="muted">
                Todas as questões que você errou nos testes do Duolingo ficam guardadas aqui para você revisar com a explicação
                da tutora e dominar cada idioma com segurança!
              </p>

              {(!playerStats.mistakesNotebook || playerStats.mistakesNotebook.length === 0) ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 24,
                    padding: "48px 24px",
                    textAlign: "center",
                    marginTop: 24,
                    boxShadow: "0 10px 30px rgba(35,20,55,.04)"
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 10 }}>🌟</div>
                  <h2 style={{ font: "800 20px Manrope", color: "#281e3a", margin: "0 0 8px" }}>
                    Seu Caderno de Erros está limpo!
                  </h2>
                  <p style={{ maxWidth: 440, margin: "0 auto 20px", fontSize: 12, color: "#827b92", lineHeight: 1.6 }}>
                    Parabéns, Presidente! Você não possui nenhum erro pendente de revisão. Continue praticando lições na Trilha
                    ou no Blitz de 60s para testar seus limites!
                  </p>
                  <button className="primary-button" onClick={() => setTab("Aprender")}>
                    Ir para a Trilha de Lições <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="notebook-grid">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#8065d9" }}>
                      📝 {playerStats.mistakesNotebook.length} ITEM(NS) PARA REVISÃO
                    </span>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setPlayerStats(prev => ({ ...prev, mistakesNotebook: [] }));
                        playSound("correct");
                        setToast("Caderno de erros limpo! Parabéns pelo estudo! 🎓");
                      }}
                    >
                      Limpar Todo o Caderno
                    </button>
                  </div>

                  {playerStats.mistakesNotebook.map(item => {
                    const tutor = TUTORS[item.tutorId] || TUTORS.aiko;
                    return (
                      <article className="notebook-item" key={item.id}>
                        <div className="notebook-item-content">
                          <div className="notebook-item-head">
                            <span style={{ fontSize: 18 }}>{tutor.flag}</span>
                            <b style={{ fontSize: 12, color: "#8065d9" }}>{tutor.name} ({item.language})</b>
                            <span style={{ fontSize: 10, color: "#a59cb3", marginLeft: "auto" }}>
                              {new Date(item.timestamp).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          <div className="notebook-prompt">{item.prompt}</div>
                          {item.prompt_translation && (
                            <div className="notebook-translation">Tradução: {item.prompt_translation}</div>
                          )}

                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, margin: "10px 0" }}>
                            <div className="notebook-answer-pill">
                              <Check size={14} /> Resposta Correta: {item.answer_key}
                            </div>
                            <button className="sound-button" onClick={() => speak(item.prompt)}>
                              <Volume2 size={14} /> Ouvir Pronúncia
                            </button>
                          </div>

                          <div className="notebook-explanation">
                            <b>💡 Explicação de {tutor.name}:</b> {item.explanation}
                          </div>
                        </div>

                        <button
                          className="secondary-button"
                          style={{ borderColor: "#20bf6b", color: "#20bf6b", flexShrink: 0 }}
                          title="Marcar como revisado e remover do caderno"
                          onClick={() => removeMistake(item.id)}
                        >
                          <Check size={16} /> Entendi ✓
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Panel Summary */}
        <aside className="right-panel">
          <div className="profile-card">
            <div className="profile-top">
              <div className="profile-avatar">{currentTutor.flag}</div>
              <div>
                <b>{currentTutor.name}</b>
                <small>{currentTutor.archetype}</small>
              </div>
            </div>
            <div className="profile-xp" suppressHydrationWarning>
              <span>Afinidade com {currentTutor.name}</span>
              <b suppressHydrationWarning>{playerStats.affinity[currentTutor.id] || 0}%</b>
            </div>
            <div className="tiny-bar">
              <span style={{ width: `${playerStats.affinity[currentTutor.id] || 0}%` }} />
            </div>
          </div>

          <div className="daily-card">
            <div className="card-heading"><Target size={18} /> <b>Missões de Hoje</b></div>
            {quests.map(q => (
              <div className="quest-line" key={q.id}>
                <p>{q.title}</p>
                <div className="daily-progress">
                  <span style={{ width: `${Math.min(100, (q.progress_value / q.goal_value) * 100)}%` }} />
                </div>
                <small>{q.description} · +{q.reward_xp} XP</small>
              </div>
            ))}
          </div>

          <div className="quote-card">
            <span className="quote-spark">✧</span>
            <p>“{currentTutor.quote}”</p>
            <b>— {currentTutor.name} ({currentTutor.title})</b>
          </div>

          {session ? (
            <button className="logout-button" onClick={signOut}><LogOut size={15} /> Sair da conta</button>
          ) : (
            <button className="secondary-button full" onClick={() => setAuthOpen(true)}><LogIn size={15} /> Criar conta / Entrar</button>
          )}
        </aside>
      </div>

      {/* QUIZ LESSON MODAL WITH DYNAMIC ANIME EXPRESSIONS */}
      {lesson && (
        <div className="modal-backdrop lesson-backdrop">
          <div className="lesson-modal lesson-player">
            <div className="lesson-progress-top">
              <button className="icon-button" onClick={closeLesson}><X /></button>
              <div className="lesson-progress-bar">
                <span style={{ width: `${lessonResult ? 100 : (questionIndex / lesson.questions.length) * 100}%` }} />
              </div>
              <span>{lessonResult ? lesson.questions.length : questionIndex + 1}/{lesson.questions.length}</span>
            </div>

            {/* Dynamic Tutor Reaction Banner */}
            <div className={`quiz-reaction-banner ${answerResult ? (answerResult.correct ? "is-correct" : "is-wrong") : ""}`}>
              <div className={`quiz-reaction-avatar mood-${tutorMood} ${answerResult ? (answerResult.correct ? "blushing bouncing" : "shaking") : ""}`}>
                <img src={getTutorExpressionImage(currentTutor.id, tutorMood, playerStats.customImages)} alt={currentTutor.name} />
              </div>
              <div className="quiz-reaction-content">
                <span className="quiz-reaction-archetype">
                  {currentTutor.archetype}
                  {comboCount >= 2 && <span className="combo-badge">🔥 {comboCount}x COMBO!</span>}
                </span>
                <b>{currentTutor.name} ({currentTutor.title})</b>
                <p className="quiz-reaction-quote">
                  {tutorQuoteReaction || `“Preste atenção na questão, estou torcendo por você!”`}
                </p>
              </div>
            </div>

            {lessonResult ? (
              <div className="lesson-complete">
                <div className="complete-medal">{lessonResult.passed ? "🏆" : "💪"}</div>
                <div className="eyebrow">{lessonResult.passed ? "LIÇÃO CONCLUÍDA" : "TENTE MAIS UMA VEZ"}</div>
                <h2>{lessonResult.passed ? "Excelente trabalho!" : "Quase lá, continue firme!"}</h2>
                <p>{lessonResult.correct} de {lessonResult.total} respostas corretas ({lessonResult.score}%)</p>
                {lessonResult.passed && (
                  <div className="xp-earned">
                    <Zap size={16} /> +{lessonResult.xp_earned} XP · +{lessonResult.coins_earned} 🪙
                  </div>
                )}
                <button className="primary-button full" onClick={closeLesson}>
                  Voltar à Trilha
                </button>
              </div>
            ) : (
              <>
                <div className="eyebrow">{lesson.title.toUpperCase()}</div>
                <h2>{lesson.questions[questionIndex].prompt_translation || "Escolha a resposta correta:"}</h2>

                <div className="question-box">
                  <span>{currentCourse.language_name.toUpperCase()}</span>
                  <strong>{lesson.questions[questionIndex].prompt}</strong>
                  <button className="sound-button" onClick={() => speak(lesson.questions[questionIndex].sound_phrase || lesson.questions[questionIndex].prompt)}>
                    <Volume2 size={17} /> Ouvir pronúncia
                  </button>
                </div>

                <div className="answer-list">
                  {lesson.questions[questionIndex].options.map(option => (
                    <button
                      key={option}
                      disabled={!!answerResult}
                      onClick={() => setAnswer(option)}
                      className={`answer-option ${answer === option ? "chosen" : ""} ${answerResult && option === answerResult.correct_answer ? "correct" : ""}`}
                    >
                      {option}
                      {answerResult && option === answerResult.correct_answer && <Check size={18} />}
                    </button>
                  ))}
                </div>

                {answerResult && (
                  <div className={`feedback ${answerResult.correct ? "good" : "bad"}`}>
                    <b>{answerResult.correct ? "Correto! Resposta perfeita!" : `Incorreto. A resposta é: ${answerResult.correct_answer}`}</b>
                    <span>{answerResult.explanation}</span>
                  </div>
                )}

                {!answerResult ? (
                  <button className="primary-button full" disabled={!answer.trim() || checking} onClick={checkAnswer}>
                    {checking ? "Verificando…" : "Verificar Resposta"}
                  </button>
                ) : (
                  <button className="primary-button full" onClick={nextQuestion}>
                    {questionIndex === lesson.questions.length - 1 ? "Finalizar Lição" : "Continuar"} <ChevronRight size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VISUAL NOVEL STORY MODE MODAL WITH SYNCED EXPRESSIONS & JEALOUSY METRICS */}
      {activeEpisode && (
        <div className="vn-modal-backdrop">
          <div className="vn-container">
            <img className="vn-bg" src={activeEpisode.bgImage} alt="" />
            <div className="vn-scrim" />

            <div className="vn-topbar">
              <span className="vn-location-tag"><MapPinned size={14} /> {activeEpisode.location}</span>
              <button className="vn-close-btn" onClick={() => setActiveEpisode(null)}><X size={18} /></button>
            </div>

            {/* Tutor Sprite with dynamic synced bishoujo expressions */}
            <div className="vn-sprite-wrap">
              <img
                className={`vn-sprite mood-${episodeChoiceChosen ? episodeChoiceChosen.replyMood : activeEpisode.steps[episodeStepIndex]?.mood || "neutral"}`}
                src={getTutorExpressionImage(activeEpisode.tutorId, episodeChoiceChosen ? episodeChoiceChosen.replyMood : activeEpisode.steps[episodeStepIndex]?.mood || "neutral", playerStats.customImages)}
                alt={TUTORS[activeEpisode.tutorId].name}
              />
            </div>

            {/* Visual Novel Dialogue Box */}
            <div className="vn-dialogue-box">
              <div className="vn-nameplate">
                <Heart size={14} fill="#fff" />
                {episodeChoiceChosen ? TUTORS[activeEpisode.tutorId].name : activeEpisode.steps[episodeStepIndex]?.speaker}
              </div>

              {activeEpisode.steps[episodeStepIndex]?.sceneNarrative && !episodeChoiceChosen && (
                <div className="vn-narrative">
                  * {activeEpisode.steps[episodeStepIndex].sceneNarrative} *
                </div>
              )}

              <div className="vn-speech">
                {episodeChoiceChosen
                  ? episodeChoiceChosen.reply
                  : activeEpisode.steps[episodeStepIndex]?.dialogue}
              </div>

              {/* Branching Dialogue Choices (Estilo Amor Doce / Visual Novel) */}
              {!episodeChoiceChosen && activeEpisode.steps[episodeStepIndex]?.choices && (
                <div className="vn-choices">
                  {activeEpisode.steps[episodeStepIndex].choices!.map((c, idx) => (
                    <button key={idx} className="vn-choice-btn" onClick={() => chooseRomanceOption(c)}>
                      <span>{c.text}</span>
                      <small style={{ color: "#ff90b4" }}>
                        {c.affinityChange > 0 ? `+${c.affinityChange} Afinidade 💖` : "Neutro 💬"}
                        {c.jealousyChange && c.jealousyChange < 0 ? ` · ${c.jealousyChange} Ciúmes 🕊️` : ""}
                        {c.jealousyChange && c.jealousyChange > 0 ? ` · +${c.jealousyChange} Ciúmes ⚡` : ""}
                        {c.memoryReward ? ` · +${c.memoryReward} Memória 🧠` : ""}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              {/* Next step button */}
              {(episodeChoiceChosen || !activeEpisode.steps[episodeStepIndex]?.choices) && (
                <button className="vn-next-btn" onClick={nextRomanceStep}>
                  {episodeStepIndex === activeEpisode.steps.length - 1 && episodeChoiceChosen ? "Concluir Encontro" : "Continuar"} <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GIFT GIVING MODAL */}
      {giftModalTutor && (
        <div className="modal-backdrop" onClick={() => setGiftModalTutor(null)}>
          <div className="lesson-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <span className="chapter-tag">PRESENTE PARA {giftModalTutor.name.toUpperCase()}</span>
              <button className="icon-button" onClick={() => setGiftModalTutor(null)}><X /></button>
            </div>
            <div className="modal-aiko">
              <img src={giftModalTutor.assets.portrait} alt="" />
            </div>
            <h2>O que você gostaria de dar a ela?</h2>
            <p className="muted">Seu saldo atual: <b>{playerStats.coins} Kotoba Coins</b></p>

            <div className="shop-grid" style={{ marginTop: 14 }}>
              {SHOP_ITEMS.filter(item => item.type === "gift").map(item => (
                <article className="shop-card" key={item.id} style={{ padding: 12 }}>
                  <div className="shop-card-icon" style={{ width: 44, height: 44, fontSize: 24 }}>{item.icon}</div>
                  <b style={{ fontSize: 12 }}>{item.name}</b>
                  <p style={{ fontSize: 9 }}>{item.description}</p>
                  <button
                    className="btn-romance-gift"
                    disabled={playerStats.coins < item.cost}
                    onClick={() => giveGift(item, giftModalTutor)}
                  >
                    Dar Presente ({item.cost} 🪙)
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
          <div className="lesson-modal auth-modal">
            <div className="modal-top">
              <span className="chapter-tag">KOTOBA QUEST · SUA CONTA</span>
              <button className="icon-button" onClick={() => setAuthOpen(false)}><X /></button>
            </div>
            <div className="modal-aiko">
              <img src="/assets/aiko/aiko_portrait_transparent.webp" alt="Aiko" />
            </div>
            <h2>{authMode === "login" ? "Bem-vindo(a) de volta!" : authMode === "signup" ? "Comece sua Aventura" : "Recupere sua Senha"}</h2>
            <p className="muted">Salve seu progresso, Lovômetro e conquistas.</p>

            {authMode === "signup" && (
              <label className="auth-label">Como podemos chamar você?
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Seu apelido no jogo" />
              </label>
            )}
            <label className="auth-label">E-mail
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </label>
            {authMode !== "recover" && (
              <label className="auth-label">Senha
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" />
              </label>
            )}

            {authError && <p className="auth-error">{authError}</p>}
            {authMessage && <p className="auth-success">{authMessage}</p>}

            <button className="primary-button full" disabled={authBusy || !email} onClick={submitAuth}>
              {authBusy ? "Carregando…" : authMode === "login" ? "Entrar" : authMode === "signup" ? "Iniciar Aventura" : "Enviar link"}
            </button>

            <button className="auth-switch" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "Já tem conta? Fazer login" : "Ainda não tem conta? Cadastrar"}
            </button>
          </div>
        </div>
      )}

      {/* FULL-SIZE CG MEMORY MODAL */}
      {previewCG && (
        <div className="modal-backdrop" onClick={() => setPreviewCG(null)}>
          <div className="lesson-modal" style={{ maxWidth: 650, padding: 0, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "relative" }}>
              <img src={previewCG.image} alt={previewCG.title} style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
              <button
                className="icon-button"
                style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "#fff" }}
                onClick={() => setPreviewCG(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <span className="chapter-tag">RECORDAÇÃO AMOR DOCE · {TUTORS[previewCG.tutorId].name.toUpperCase()}</span>
              <h2 style={{ margin: "6px 0 10px" }}>{previewCG.title}</h2>
              <p style={{ fontSize: 12, color: "#c1bcb2", lineHeight: 1.6, margin: "0 0 14px" }}>{previewCG.description}</p>
              <div className="tutor-quote-box" style={{ margin: 0, fontSize: 13 }}>
                {previewCG.unlockedDialogue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JEALOUSY SHOWDOWN DUEL MODAL (CONFRONTO AO VIVO DE CIÚMES) */}
      {activeShowdown && (
        <div className="showdown-modal-backdrop" onClick={() => { if (!showdownChoiceChosen) setActiveShowdown(null); }}>
          <div className="showdown-stage" onClick={e => e.stopPropagation()}>
            <img className="showdown-bg" src={activeShowdown.bgImage} alt="" />

            <div className="showdown-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="chapter-tag" style={{ background: "rgba(255, 75, 120, 0.4)", color: "#fff" }}>
                  <Flame size={14} style={{ marginRight: 4 }} /> CONFRONTO DE CIÚMES
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
                  <MapPinned size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                  {activeShowdown.location}
                </span>
              </div>
              <button
                className="icon-button"
                style={{ color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: "50%" }}
                onClick={() => setActiveShowdown(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Duo Character Confrontation Arena */}
            <div className="showdown-duo-stage">
              {/* Tutor 1 (Left) */}
              <div className="showdown-tutor-side left">
                <div className="showdown-bubble left">
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#8065d9", marginBottom: 2 }}>
                    {TUTORS[activeShowdown.tutor1].name.toUpperCase()}
                  </div>
                  {showdownChoiceChosen ? showdownChoiceChosen.response1 : activeShowdown.dialogue1}
                </div>
                <img
                  className="showdown-sprite"
                  src={getTutorExpressionImage(activeShowdown.tutor1, showdownChoiceChosen ? showdownChoiceChosen.mood1 : "angry", playerStats.customImages)}
                  alt={TUTORS[activeShowdown.tutor1].name}
                />
              </div>

              {/* Tutor 2 (Right) */}
              <div className="showdown-tutor-side right">
                <div className="showdown-bubble right">
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#e84393", marginBottom: 2 }}>
                    {TUTORS[activeShowdown.tutor2].name.toUpperCase()}
                  </div>
                  {showdownChoiceChosen ? showdownChoiceChosen.response2 : activeShowdown.dialogue2}
                </div>
                <img
                  className="showdown-sprite"
                  src={getTutorExpressionImage(activeShowdown.tutor2, showdownChoiceChosen ? showdownChoiceChosen.mood2 : "jealous", playerStats.customImages)}
                  alt={TUTORS[activeShowdown.tutor2].name}
                />
              </div>
            </div>

            {/* Bottom Decision / Dialogue Shelf */}
            <div className="showdown-control-panel">
              <div className="showdown-narrative">
                * {activeShowdown.context} *
              </div>

              {!showdownChoiceChosen ? (
                <div className="showdown-choices-grid">
                  <span style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 800, color: "#a29bfe", textTransform: "uppercase" }}>
                    COMO VOCÊ REAGE COMO PRESIDENTE DO CONSELHO?
                  </span>
                  {activeShowdown.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      className="showdown-choice-btn"
                      onClick={() => chooseShowdownOption(choice)}
                    >
                      <b>{choice.text}</b>
                      <span>
                        {TUTORS[activeShowdown.tutor1].name}: {choice.jealousyChange1 < 0 ? `${choice.jealousyChange1}% Ciúmes 🕊️` : `+${choice.jealousyChange1}% Ciúmes ⚡`}
                        {" · "}
                        {TUTORS[activeShowdown.tutor2].name}: {choice.jealousyChange2 < 0 ? `${choice.jealousyChange2}% Ciúmes 🕊️` : `+${choice.jealousyChange2}% Ciúmes ⚡`}
                        {choice.memoryReward ? ` · +${choice.memoryReward} Memória 🧠` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#2ecc71" }}>
                      ✓ Decisão diplomática tomada!
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                      As presidentes responderam às suas palavras. Ciúmes e afinidade atualizados!
                    </p>
                  </div>
                  <button className="primary-button" onClick={finishShowdown}>
                    Finalizar Confronto e Coletar Recompensas <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <button className="toast" onClick={() => setToast("")}>
          {toast} <X size={14} />
        </button>
      )}
    </main>
  );
}
