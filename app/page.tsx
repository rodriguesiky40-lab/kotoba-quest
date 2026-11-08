"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LandingHome from "@/components/landing-home";
import {
  Activity, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Coins, Crown, Flame,
  GraduationCap, Heart, Home, Languages, Lock, LogIn, LogOut, Menu, MessageCircle,
  Send, Settings, ShieldCheck, Sparkles, Target, Trophy, UserRound, Volume2, X, Zap
} from "lucide-react";
import { authRequest, isSupabaseConfigured, restRequest, SupabaseError, withExpiry, type Session } from "@/lib/supabase";

type Question = { id: string; lesson_id: string; prompt: string; prompt_translation: string | null; question_type: string; options: string[]; sort_order: number };
type Lesson = { id: string; unit_id: string; title: string; description: string; lesson_type: string; xp_reward: number; sort_order: number; questions: Question[] };
type Unit = { id: string; title: string; description: string; sort_order: number; lessons: Lesson[] };
type Stats = { total_xp: number; coins: number; hearts: number; current_streak: number; longest_streak: number; last_activity_date: string | null };
type Progress = { lesson_id: string; status: "locked" | "in_progress" | "completed"; best_score: number; attempts_count: number };
type Quest = { id: string; title: string; description: string; goal_type: string; goal_value: number; reward_xp: number; progress_value: number; completed_at: string | null };
type AnswerResult = { correct: boolean; correct_answer: string; explanation: string; hearts_remaining: number };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Achievement = { id: string; slug: string; title: string; description: string; icon: string; xp_reward: number; unlocked_at: string | null };

const emptyStats: Stats = { total_xp: 0, coins: 0, hearts: 5, current_streak: 0, longest_streak: 0, last_activity_date: null };
const tutorNames: Record<string,string> = { aiko: "Aiko", emily: "Emily", hana: "Hana", sofia: "Sofía", chloe: "Chloé" };
const tutorSubjects: Record<string,string> = { aiko: "Tutora de japonês", emily: "Tutora de inglês", hana: "Tutora de coreano", sofia: "Tutora de espanhol", chloe: "Tutora de francês" };
const tutorLanguages: Record<string,string> = { aiko: "Japonês", emily: "Inglês", hana: "Coreano", sofia: "Espanhol", chloe: "Francês" };
const languageOptions = [
  { code: "ja", name: "Japonês", native: "日本語", flag: "🇯🇵", tutor: "aiko", course: "Fundamentos do japonês", destination: "Japão" },
  { code: "en", name: "Inglês", native: "English", flag: "🇺🇸", tutor: "emily", course: "English from Zero", destination: "mundo" },
  { code: "ko", name: "Coreano", native: "한국어", flag: "🇰🇷", tutor: "hana", course: "Coreano do zero", destination: "Coreia do Sul" },
  { code: "es", name: "Espanhol", native: "Español", flag: "🇪🇸", tutor: "sofia", course: "Español desde cero", destination: "mundo hispânico" },
  { code: "fr", name: "Francês", native: "Français", flag: "🇫🇷", tutor: "chloe", course: "Français pas à pas", destination: "mundo francófono" }
];
const storyContent = [
  {
    id: "kyoto", title: "Um passeio por Kyoto", subtitle: "Ajude Aiko a encontrar um templo", image: "/assets/scenarios/kyoto_traditional_street.webp", duration: "5 min",
    steps: [
      { scene: "Você e Aiko chegam a uma rua tradicional de Kyoto.", speaker: "Aiko", japanese: "すみません。お寺はどこですか。", translation: "Com licença. Onde fica o templo?", prompt: "O que significa お寺 (おてら)?", choices: ["Templo", "Estação", "Restaurante"], correct: "Templo", explanation: "お寺 (otera) significa templo budista." },
      { scene: "Uma senhora aponta para o caminho à esquerda.", speaker: "Moradora", japanese: "あそこです。", translation: "É ali.", prompt: "あそこ indica um lugar…", choices: ["Aqui perto de mim", "Perto de você", "Lá, distante de nós"], correct: "Lá, distante de nós", explanation: "あそこ aponta para um local distante de quem fala e de quem ouve." },
      { scene: "Aiko agradece e sorri.", speaker: "Aiko", japanese: "ありがとうございます！", translation: "Muito obrigada!", prompt: "Qual é a expressão mais educada para agradecer?", choices: ["ありがとうございます", "さようなら", "おはよう"], correct: "ありがとうございます", explanation: "ありがとうございます é uma forma polida de dizer muito obrigado(a)." }
    ]
  },
  {
    id: "shop", title: "Uma compra especial", subtitle: "Pratique em uma loja japonesa", image: "/assets/scenarios/japanese_shop.webp", duration: "4 min",
    steps: [
      { scene: "Vocês entram em uma pequena loja de lembranças.", speaker: "Atendente", japanese: "いらっしゃいませ！", translation: "Seja bem-vindo(a)!", prompt: "Quando você costuma ouvir いらっしゃいませ?", choices: ["Ao entrar em uma loja", "Ao se despedir", "Ao acordar"], correct: "Ao entrar em uma loja", explanation: "É a saudação tradicional de atendentes ao receber clientes." },
      { scene: "Aiko encontra um chaveiro bonito.", speaker: "Aiko", japanese: "これはいくらですか。", translation: "Quanto custa isto?", prompt: "いくら pergunta sobre…", choices: ["Preço", "Nome", "Localização"], correct: "Preço", explanation: "いくら significa quanto, usado aqui para perguntar o preço." },
      { scene: "O atendente responde e vocês vão ao caixa.", speaker: "Aiko", japanese: "これをください。", translation: "Este, por favor.", prompt: "O que ください expressa?", choices: ["Um pedido educado", "Uma despedida", "Uma pergunta sobre idade"], correct: "Um pedido educado", explanation: "ください é usado para pedir algo de maneira educada." }
    ]
  }
];

function formatError(error: unknown) {
  if (error instanceof SupabaseError) {
    if (error.message.includes("NO_HEARTS")) return "Você ficou sem corações. Aguarde a recuperação de energia antes de continuar.";
    if (error.status === 400 && /Invalid login credentials/i.test(error.message)) return "E-mail ou senha incorretos.";
    if (/Email not confirmed/i.test(error.message)) return "Confirme seu e-mail antes de entrar.";
    if (/already registered/i.test(error.message)) return "Este e-mail já possui uma conta. Entre em vez de criar outra.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

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
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("ja");
  const [progressRows, setProgressRows] = useState<Progress[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<{display_name:string;total_xp:number;current_streak:number;rank_position:number}[]>([]);
  const [dataBusy, setDataBusy] = useState(true);
  const [dataError, setDataError] = useState("");
  const [toast, setToast] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{question_id:string;answer:string}[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [lessonResult, setLessonResult] = useState<any>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyStep, setStoryStep] = useState(0);
  const [storyChoice, setStoryChoice] = useState("");
  const [storyFeedback, setStoryFeedback] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Olá! Escolha uma tutora e vamos praticar um novo idioma. ✨" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatUnavailable, setChatUnavailable] = useState(false);
  const [activeTutor, setActiveTutor] = useState("aiko");
  const [adminLessonTitle, setAdminLessonTitle] = useState("");
  const [adminQuestionPrompt, setAdminQuestionPrompt] = useState("");
  const [adminQuestionAnswer, setAdminQuestionAnswer] = useState("");
  const [adminQuestionOptions, setAdminQuestionOptions] = useState("Opção A, Opção B, Opção C");
  const [adminQuestionExplanation, setAdminQuestionExplanation] = useState("");
  const [adminUnitId, setAdminUnitId] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const saveSession = useCallback((next: Session | null) => {
    setSession(next ? withExpiry(next) : null);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem("kotoba-session", JSON.stringify(withExpiry(next)));
      else localStorage.removeItem("kotoba-session");
    }
  }, []);

  const refreshSession = useCallback(async (current: Session) => {
    if (!current.refresh_token) throw new Error("Sua sessão expirou. Entre novamente.");
    const refreshed = await authRequest("token?grant_type=refresh_token", { refresh_token: current.refresh_token }) as Session;
    const next = withExpiry(refreshed);
    saveSession(next);
    return next;
  }, [saveSession]);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!session) throw new Error("Entre na sua conta para continuar.");
    try {
      return await restRequest(path, session.access_token, init);
    } catch (error) {
      if (error instanceof SupabaseError && (error.status === 401 || /expired|invalid jwt/i.test(error.message))) {
        const next = await refreshSession(session);
        return restRequest(path, next.access_token, init);
      }
      throw error;
    }
  }, [session, refreshSession]);

  const loadCourse = useCallback(async () => {
    if (!isSupabaseConfigured()) { setDataError("O banco ainda não está configurado."); setDataBusy(false); return; }
    try {
      const courses = await restRequest(`courses?select=id,title,description,level&language_code=eq.${selectedLanguageCode}&is_published=eq.true&order=sort_order.asc&limit=1`, "", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } });
      if (!courses?.length) throw new Error(`O curso de ${languageOptions.find(l => l.code === selectedLanguageCode)?.name || "idioma"} ainda não foi publicado.`);
      const course = courses[0];
      const unitRows = await restRequest(`units?select=id,title,description,sort_order&course_id=eq.${course.id}&order=sort_order.asc`, "", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } });
      if (!unitRows?.length) throw new Error("Nenhuma unidade encontrada para este curso.");
      const ids = unitRows.map((u: any) => u.id).join(",");
      const lessonRows = await restRequest(`lessons?select=id,unit_id,title,description,lesson_type,xp_reward,sort_order&unit_id=in.(${ids})&is_published=eq.true&order=sort_order.asc`, "", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } });
      const lessonIds = lessonRows.map((l: any) => l.id).join(",");
      const questionRows = lessonIds ? await restRequest(`lesson_questions?select=id,lesson_id,prompt,prompt_translation,question_type,options,sort_order&lesson_id=in.(${lessonIds})&order=sort_order.asc`, "", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } }) : [];
      const nextUnits = unitRows.map((unit: any) => ({ ...unit, lessons: lessonRows.filter((l: any) => l.unit_id === unit.id).map((l: any) => ({ ...l, questions: questionRows.filter((q: any) => q.lesson_id === l.id) })) }));
      setUnits(nextUnits);
      setDataError("");
    } catch (error) { setDataError(formatError(error)); }
    finally { setDataBusy(false); }
  }, [selectedLanguageCode]);

  const loadUserData = useCallback(async () => {
    if (!session) { setProgressRows([]); setStats(emptyStats); setQuests([]); setAchievements([]); setLeaderboard([]); return; }
    try {
      const [progressData, statsData, questData, questProgress, achievementData, userAchievements] = await Promise.all([
        api(`user_progress?select=lesson_id,status,best_score,attempts_count&user_id=eq.${session.user.id}`),
        api(`user_stats?select=total_xp,coins,hearts,current_streak,longest_streak,last_activity_date&user_id=eq.${session.user.id}&limit=1`),
        api("daily_quests?select=id,title,description,goal_type,goal_value,reward_xp&is_published=eq.true"),
        api(`user_daily_quests?select=quest_id,progress_value,completed_at&user_id=eq.${session.user.id}&quest_date=eq.${new Date().toISOString().slice(0,10)}`),
        api("achievements?select=id,slug,title,description,icon,xp_reward&is_published=eq.true"),
        api(`user_achievements?select=achievement_id,unlocked_at&user_id=eq.${session.user.id}`)
      ]);
      setProgressRows(progressData || []);
      setStats(statsData?.[0] || emptyStats);
      setQuests((questData || []).map((q: any) => ({ ...q, progress_value: questProgress?.find((p: any) => p.quest_id === q.id)?.progress_value || 0, completed_at: questProgress?.find((p: any) => p.quest_id === q.id)?.completed_at || null })));
      setAchievements((achievementData || []).map((a: any) => ({ ...a, unlocked_at: userAchievements?.find((u: any) => u.achievement_id === a.id)?.unlocked_at || null })));
      try {
        const board = await api("rpc/get_leaderboard", { method: "POST", body: "{}" });
        setLeaderboard(board || []);
      } catch { setLeaderboard([]); }
    } catch (error) { setToast(formatError(error)); }
  }, [session, api]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    let active = true;
    (async () => {
      try {
        const saved = localStorage.getItem("kotoba-session");
        if (saved) {
          const parsed = withExpiry(JSON.parse(saved) as Session);
          const next = parsed.expires_at && parsed.expires_at < Math.floor(Date.now()/1000) + 90 ? await refreshSession(parsed) : parsed;
          if (active) setSession(next);
        }
      } catch { localStorage.removeItem("kotoba-session"); }
    })();
    return () => { active = false; };
  }, [refreshSession]);

  useEffect(() => { const saved = typeof window !== "undefined" ? localStorage.getItem("kotoba-language") : null; if (saved && languageOptions.some(l=>l.code===saved)) { setSelectedLanguageCode(saved); setDataBusy(true); setActiveTutor(languageOptions.find(l=>l.code===saved)?.tutor || "aiko"); } }, []);
  useEffect(() => { loadCourse(); }, [loadCourse]);
  useEffect(() => {
    if (!session) return;
    const name = session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Aprendiz";
    api("profiles?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: session.user.id, display_name: name, preferred_language_code: selectedLanguageCode }) })
      .then(() => api("user_stats?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: session.user.id }) }))
      .then(loadUserData).catch(error => setToast(formatError(error)));
  }, [session, api, loadUserData, selectedLanguageCode]);

  async function submitAuth() {
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      if (authMode === "recover") {
        await authRequest("recover", { email });
        setAuthMessage("Enviamos um link de recuperação para seu e-mail, se ele estiver cadastrado.");
      } else if (authMode === "signup") {
        const result = await authRequest("signup", { email, password, data: { display_name: displayName || "Aprendiz" } });
        if (result.access_token) { saveSession(result as Session); setAuthOpen(false); setToast("Conta criada! Sua jornada começou."); }
        else { setAuthMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre."); setAuthMode("login"); }
      } else {
        const result = await authRequest("token?grant_type=password", { email, password });
        saveSession(result as Session); setAuthOpen(false); setToast("Bem-vindo de volta!");
      }
    } catch (error) { setAuthError(formatError(error)); }
    finally { setAuthBusy(false); }
  }

  async function signOut() {
    try { if (session) await authRequest("logout", {}, session.access_token); } catch { /* local logout remains available */ }
    saveSession(null); setTab("Aprender"); setToast("Você saiu da sua conta.");
  }

  const progressMap = useMemo(() => new Map(progressRows.map(p => [p.lesson_id, p])), [progressRows]);
  const allLessons = useMemo(() => units.flatMap(u => u.lessons), [units]);
  const completedCount = useMemo(() => allLessons.filter(l => progressMap.get(l.id)?.status === "completed").length, [allLessons, progressMap]);
  const selectedLanguage = languageOptions.find(l => l.code === selectedLanguageCode) || languageOptions[0];
  const level = Math.floor(stats.total_xp / 200) + 1;
  const levelProgress = stats.total_xp % 200;
  const admin = session?.user.app_metadata?.role === "admin";
  const navItems = [
    { label: "Aprender", icon: Home }, ...(selectedLanguageCode === "ja" ? [{ label: "Histórias", icon: BookOpen }] : []),
    { label: "Conversar", icon: MessageCircle }, { label: "Ranking", icon: Trophy }, { label: "Meu perfil", icon: UserRound },
    { label: "Aiko", icon: Sparkles }, { label: "Emily", icon: Sparkles }, { label: "Hana", icon: Sparkles }, { label: "Sofía", icon: Sparkles }, { label: "Chloé", icon: Sparkles }, { label: "Premium", icon: Crown },
    ...(admin ? [{ label: "Administração", icon: ShieldCheck }] : [])
  ];

  function openLesson(item: Lesson, locked: boolean) {
    if (locked) { setToast("Conclua a etapa anterior para desbloquear esta lição."); return; }
    if (!session) { setAuthOpen(true); setAuthMode("login"); setToast("Entre ou crie uma conta para salvar sua evolução."); return; }
    if (!item.questions?.length) { setToast("Esta lição ainda não possui exercícios publicados."); return; }
    setLesson(item); setQuestionIndex(0); setAnswer(""); setAnswers([]); setAnswerResult(null); setLessonResult(null);
  }

  async function checkAnswer() {
    if (!lesson || !session || !answer.trim()) return;
    setChecking(true);
    try {
      const question = lesson.questions[questionIndex];
      const result = await api("rpc/check_lesson_answer", { method: "POST", body: JSON.stringify({ p_question_id: question.id, p_answer: answer.trim() }) }) as AnswerResult;
      setAnswerResult(result);
      setStats(current => ({ ...current, hearts: result.hearts_remaining }));
      setAnswers(prev => [...prev.filter(a => a.question_id !== question.id), { question_id: question.id, answer: answer.trim() }]);
    } catch (error) { setToast(formatError(error)); }
    finally { setChecking(false); }
  }

  async function createAdminLesson() {
    if (!session || session.user.app_metadata?.role !== "admin") { setToast("Apenas administradores podem criar aulas."); return; }
    const unitId = adminUnitId || units[0]?.id;
    const options = adminQuestionOptions.split(",").map(v=>v.trim()).filter(Boolean);
    if (!unitId || !adminLessonTitle.trim() || !adminQuestionPrompt.trim() || !adminQuestionAnswer.trim() || options.length < 2 || !options.includes(adminQuestionAnswer.trim())) {
      setToast("Preencha o título, a pergunta, a resposta correta e ao menos duas opções. A resposta deve estar nas opções."); return;
    }
    setAdminSaving(true);
    try {
      const existing = await api(`lessons?select=id&unit_id=eq.${unitId}`) as {id:string}[];
      const created = await api("lessons?select=id", { method:"POST", headers:{ Prefer:"return=representation" }, body:JSON.stringify({ unit_id:unitId, title:adminLessonTitle.trim(), description:adminQuestionPrompt.trim(), lesson_type:"vocabulary", xp_reward:15, sort_order:existing.length+1, is_published:false }) }) as {id:string}[];
      const lessonId = created?.[0]?.id;
      if (!lessonId) throw new Error("Não foi possível criar a aula.");
      await api("lesson_questions", { method:"POST", body:JSON.stringify({ lesson_id:lessonId, prompt:adminQuestionPrompt.trim(), prompt_translation:null, question_type:"multiple_choice", options, answer_key:adminQuestionAnswer.trim(), explanation:adminQuestionExplanation.trim(), sort_order:1 }) });
      await api(`lessons?id=eq.${lessonId}`, { method:"PATCH", body:JSON.stringify({ is_published:true }) });
      setToast("Aula criada e publicada com a primeira questão!");
      setAdminLessonTitle(""); setAdminQuestionPrompt(""); setAdminQuestionAnswer(""); setAdminQuestionExplanation("");
      await loadCourse();
    } catch(error) { setToast(formatError(error)); }
    finally { setAdminSaving(false); }
  }

  async function nextQuestion() {
    if (!lesson) return;
    if (questionIndex < lesson.questions.length - 1) {
      setQuestionIndex(v => v + 1); setAnswer(""); setAnswerResult(null); return;
    }
    setChecking(true);
    try {
      const result = await api("rpc/complete_lesson", { method: "POST", body: JSON.stringify({ p_lesson_id: lesson.id, p_answers: answers }) });
      setLessonResult(result);
      await loadUserData();
    } catch (error) { setToast(formatError(error)); }
    finally { setChecking(false); }
  }

  function closeLesson() { setLesson(null); setLessonResult(null); setAnswer(""); setAnswers([]); setAnswerResult(null); }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setToast("A leitura em voz alta não está disponível neste navegador."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = ({ ja: "ja-JP", en: "en-US", ko: "ko-KR", es: "es-ES", fr: "fr-FR" } as Record<string,string>)[selectedLanguageCode] || "ja-JP"; utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  async function sendChat() {
    const content = chatInput.trim();
    if (!content || chatBusy) return;
    if (!session) { setAuthOpen(true); setToast("Entre para conversar com a Aiko."); return; }
    const next = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(next); setChatInput(""); setChatBusy(true);
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ tutor: activeTutor, messages: next.slice(-12) }) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 503) setChatUnavailable(true); throw new Error(data.error || "A tutora está indisponível."); }
      setChatMessages(v => [...v, { role: "assistant", content: data.reply }]);
    } catch (error) { setChatMessages(v => [...v, { role: "assistant", content: error instanceof Error ? error.message : "Não consegui responder agora." }]); }
    finally { setChatBusy(false); }
  }

  function startStory(index: number) { if (!session) { setAuthOpen(true); setToast("Entre para registrar suas histórias."); return; } setStoryIndex(index); setStoryStep(0); setStoryChoice(""); setStoryFeedback(""); }
  function chooseStory() {
    if (storyIndex === null) return;
    const step = storyContent[storyIndex].steps[storyStep];
    setStoryFeedback(storyChoice === step.correct ? `Correto! ${step.explanation}` : `Quase! A resposta é “${step.correct}”. ${step.explanation}`);
  }
  function nextStory() {
    if (storyIndex === null) return;
    if (storyStep < storyContent[storyIndex].steps.length - 1) { setStoryStep(v => v + 1); setStoryChoice(""); setStoryFeedback(""); }
    else { setStoryIndex(null); setToast("História concluída! Continue praticando nas lições para ganhar XP."); }
  }

  return (
    <main className="app-shell">
      {session && (
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobilePanel(v => !v)} aria-label="Abrir menu">{mobilePanel ? <X/> : <Menu/>}</button>
        <a className="brand" href="#inicio" onClick={() => setTab("Aprender")}><span className="brand-mark">✿</span><span>KOTOBA <i>QUEST</i></span></a>
        <div className="top-stats">
          <div className="stat-pill streak"><Flame size={17}/><b>{stats.current_streak}</b><span>dias</span></div>
          <div className="stat-pill" title="Você recupera um coração a cada quatro horas, até o máximo de cinco."><Heart size={17} fill="currentColor"/><b>{stats.hearts}</b></div>
          <div className="stat-pill coins"><Coins size={17}/><b>{stats.coins}</b></div>
          <div className="stat-pill xp"><Zap size={17} fill="currentColor"/><b>{stats.total_xp} XP</b></div>
        </div>
        <button className="avatar-button" title={session ? "Sair da conta" : "Entrar ou criar conta"} onClick={() => session ? signOut() : setAuthOpen(true)}>{session?.user.email?.slice(0,2).toUpperCase() || <LogIn size={17}/>}</button>
      </header>
      )}

      {session ? <div className="layout">
        <aside className={`sidebar ${mobilePanel ? "sidebar-open" : ""}`}>
          <div className="side-label">SUA JORNADA</div>
          {navItems.map(({label, icon: Icon}) => <button key={label} className={`nav-item ${tab === label ? "active" : ""}`} onClick={() => { setTab(label); setMobilePanel(false); }}><Icon size={19}/><span>{label}</span>{label === "Conversar" && <span className="new-tag">IA</span>}</button>)}
          <div className="side-card"><div className="side-card-icon"><Crown size={20}/></div><b>Desbloqueie mais possibilidades</b><p>Planos para ampliar sua jornada e praticar com tutores.</p><button className="small-cta" onClick={() => setTab("Premium")}>Conhecer Premium</button></div>
          <div className="sidebar-bottom"><Settings size={16}/> Configurações <span>·</span><button onClick={() => setAuthOpen(true)}>Ajuda</button></div>
        </aside>

        <section className="content">
          {tab === "Aprender" && <>
            <div className="welcome-row"><div><div className="eyebrow">KOTOBA QUEST · APRENDER É VIVER</div><h1>{session ? `Sua próxima conquista começa aqui, ${session.user.user_metadata?.display_name || "aprendiz"}.` : "Um novo idioma. Um mundo inteiro."}</h1><p className="muted">Menos decoreba. Mais experiências que fazem sentido.</p></div><label className="language-select"><Languages size={16}/><select aria-label="Escolher idioma" value={selectedLanguageCode} onChange={e=>{const code=e.target.value;setSelectedLanguageCode(code);setActiveTutor(languageOptions.find(l=>l.code===code)?.tutor || "aiko");setDataBusy(true);setDataError("");setTab("Aprender");if(typeof window!=="undefined")localStorage.setItem("kotoba-language",code);}}>{languageOptions.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select><ChevronDown size={14}/></label></div>
            <section className="hero-card hero-editorial">
              <div className="hero-copy">
                <span className="chapter-tag"><Sparkles size={12}/> SUA JORNADA COMEÇA AQUI</span>
                <h2>Não estude apenas palavras. <em>Viva o idioma.</em></h2>
                <p>Explore {selectedLanguage.destination}, converse com {tutorNames[selectedLanguage.tutor]} e transforme cada pequena prática em uma conquista real.</p>
                <div className="hero-actions">
                  <button className="hero-button" onClick={() => { const first = allLessons[0]; if (first) openLesson(first, false); else setToast("A trilha está sendo preparada. Volte em breve!"); }}>Começar a aprender <ChevronRight size={16}/></button>
                  {selectedLanguageCode === "ja" && <button className="hero-text-button" onClick={() => setTab("Histórias")}>Explorar histórias <ArrowRightIcon/></button>}
                </div>
                <div className="hero-meta"><span><Zap size={14}/> {stats.total_xp} XP conquistados</span><span><BookOpen size={14}/> {completedCount} lições concluídas</span><span><Flame size={14}/> {stats.current_streak} dias de sequência</span></div>
              </div>
              <div className="aiko-art"><div className="aiko-glow"/><div className="aiko-orbit orbit-a"/><div className="aiko-orbit orbit-b"/><img src={selectedLanguage.tutor==="aiko"?"/assets/aiko/aiko_full_body_transparent.webp":selectedLanguage.tutor==="hana"?"/assets/tutors/hana/hana-full.png":selectedLanguage.tutor==="sofia"?"/assets/tutors/sofia/sofia-full.png":selectedLanguage.tutor==="emily"?"/assets/tutors/emily/emily-full.webp":"/assets/aiko/aiko_portrait_transparent.webp"} alt={`${tutorNames[selectedLanguage.tutor]}, sua tutora de ${selectedLanguage.name}`} onError={e=>{e.currentTarget.src="/assets/aiko/aiko_portrait_transparent.webp";}}/><span className="spark s1">✧</span><span className="spark s2">✦</span></div>
              <div className="hero-caption"><b>{tutorNames[selectedLanguage.tutor]}</b><span>Sua companheira de jornada</span></div>
              <div className="hero-floating-note"><span className="floating-note-icon">今日</span><div><b>Uma prática por dia</b><small>Seu progresso, no seu ritmo</small></div><span className="floating-check">✓</span></div>
            </section>
            {!session && <div className="guest-banner"><div><b>Guarde cada conquista.</b><span>Crie sua conta gratuita para salvar seu progresso e continuar de onde parou, em qualquer dispositivo.</span></div><button className="primary-button" onClick={() => setAuthOpen(true)}>Criar conta grátis <ChevronRight size={15}/></button></div>}
            <section className="learning-pillars" aria-label="Como funciona o Kotoba Quest">
              <button className="pillar-card" onClick={() => setTab("Aprender")}><span className="pillar-icon pillar-violet"><BookOpen size={19}/></span><span><b>Aprenda na prática</b><small>Lições curtas com evolução clara</small></span><ChevronRight size={16}/></button>
              {selectedLanguageCode === "ja" && <button className="pillar-card" onClick={() => setTab("Histórias")}><span className="pillar-icon pillar-rose"><Sparkles size={19}/></span><span><b>Entre nas histórias</b><small>Use o idioma em situações reais</small></span><ChevronRight size={16}/></button>}
              <button className="pillar-card" onClick={() => setTab("Conversar")}><span className="pillar-icon pillar-mint"><MessageCircle size={19}/></span><span><b>Ganhe confiança</b><small>Pratique conversando com tutores</small></span><ChevronRight size={16}/></button>
            </section>
            {selectedLanguageCode === "ja" && <><section className="destination-section">
              <div className="section-heading"><div><div className="eyebrow">EXPLORE O JAPÃO</div><h2>Aprenda pelo mundo real</h2><p className="muted">Conheça lugares, cultura e expressões que ganham vida em cada destino.</p></div><span className="unit-pill">4 DESTINOS</span></div>
              <div className="destination-grid">
                <a className="destination-card" href="https://unsplash.com/s/photos/kyoto-japan" target="_blank" rel="noreferrer"><img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=82" alt="Rua tradicional de Kyoto"/><span className="destination-overlay"><small>KANSAI</small><b>Kyoto</b><em>Templos, tradição e respeito</em></span></a>
                <a className="destination-card" href="https://unsplash.com/s/photos/tokyo-japan" target="_blank" rel="noreferrer"><img src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=82" alt="Paisagem urbana iluminada"/><span className="destination-overlay"><small>KANTO</small><b>Tóquio</b><em>O cotidiano da cidade moderna</em></span></a>
                <a className="destination-card" href="https://unsplash.com/s/photos/mount-fuji-japan" target="_blank" rel="noreferrer"><img src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=900&q=82" alt="Monte Fuji e paisagem japonesa"/><span className="destination-overlay"><small>SHIZUOKA</small><b>Monte Fuji</b><em>Natureza e contemplação</em></span></a>
                <a className="destination-card" href="https://unsplash.com/s/photos/osaka-japan" target="_blank" rel="noreferrer"><img src="https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=900&q=82" alt="Rua comercial japonesa"/><span className="destination-overlay"><small>KANSAI</small><b>Osaka</b><em>Comida, encontros e diversão</em></span></a>
              </div>
              <p className="photo-credit">Fotografias ilustrativas via Unsplash · <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">licença de uso</a></p>
            </section>
            </>}
            <div className="section-heading"><div><div className="eyebrow">TRILHA DE APRENDIZADO</div><h2>{selectedLanguage.course}</h2></div><span className="unit-pill">{completedCount}/{allLessons.length} LIÇÕES</span></div>
            {dataBusy ? <div className="loading-card"><span className="loader"/> Preparando sua trilha...</div> : dataError ? <div className="error-card"><CircleHelp/><div><b>Não foi possível carregar o curso</b><p>{dataError}</p><button className="secondary-button" onClick={() => { setDataBusy(true); loadCourse(); }}>Tentar novamente</button></div></div> : units.map((unit, unitIndex) => {
              let previousDone = unitIndex === 0 ? true : units.slice(0, unitIndex).every(u => u.lessons.every(l => progressMap.get(l.id)?.status === "completed"));
              return <div className="unit-block" key={unit.id}><div className="unit-heading"><span className="unit-number">{String(unitIndex + 1).padStart(2,"0")}</span><div><b>{unit.title}</b><small>{unit.description}</small></div><span className="unit-count">{unit.lessons.filter(l => progressMap.get(l.id)?.status === "completed").length}/{unit.lessons.length}</span></div><div className="lesson-list">{unit.lessons.map((item, i) => {
                const status = progressMap.get(item.id)?.status;
                const done = status === "completed";
                const unlocked = previousDone && (i === 0 || unit.lessons.slice(0,i).every(l => progressMap.get(l.id)?.status === "completed"));
                const locked = !done && !unlocked;
                return <div className={`lesson-row ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`} key={item.id}><div className={`lesson-node ${done ? "done" : unlocked ? "current" : ""}`}>{done ? <Check size={19}/> : locked ? <Lock size={16}/> : <BookOpen size={18}/>}</div><div className="lesson-info"><b>{item.title}</b><span>{item.description}</span></div><div className="lesson-reward"><Zap size={14}/>{item.xp_reward} XP</div>{done ? <span className="done-label">Concluída</span> : <button className="start-button" onClick={() => openLesson(item, locked)}>{locked ? "Bloqueada" : "Começar"}<ChevronRight size={15}/></button>}</div>;
              })}</div></div>;
            })}
            {selectedLanguageCode === "ja" && <><section className="world-card"><div className="world-copy"><div className="eyebrow">EXPLORE O JAPÃO</div><h2>Seu mundo de aprendizagem</h2><p>Complete lições, abra caminhos e descubra novas regiões com Aiko.</p><div className="world-tags"><span>⛩ Kyoto</span><span>🌸 Vila Sakura</span><span>🏙 Tóquio</span></div></div><img src="/assets/world/japan_learning_world_map.webp" alt="Mapa da jornada de japonês"/></section>
            </>}
            <section className="reward-showcase"><div><div className="eyebrow">RECOMPENSAS DA JORNADA</div><h2>Pequenas conquistas, grandes avanços</h2><p>Ganhe itens ao estudar e completar missões.</p></div><div className="reward-items">{[["coin.webp","Moedas"],["heart.webp","Energia"],["trophy.webp","Conquistas"],["medals_set.webp","Medalhas"],["treasure_chest.webp","Baús"],["xp_badge.webp","Experiência"]].map(([file,label]) => <div key={file}><img src={`/assets/rewards/${file}`} alt=""/><span>{label}</span></div>)}</div></section>
            <section className="achievement-section"><div className="section-heading"><div><div className="eyebrow">SUAS CONQUISTAS</div><h2>Marcos da sua jornada</h2></div><span className="unit-pill">{achievements.filter(a=>a.unlocked_at).length}/{achievements.length} DESBLOQUEADAS</span></div><div className="achievement-grid">{achievements.map(a=><article className={`achievement-card ${a.unlocked_at?"unlocked":"locked"}`} key={a.id}><div className="achievement-icon">{a.icon}</div><div><b>{a.title}</b><span>{a.description}</span></div><strong>+{a.xp_reward} XP</strong></article>)}</div></section>
            {selectedLanguageCode === "ja" && <><section className="scene-grid"><article className="scene-tile"><img src="/assets/scenarios/japanese_classroom.webp" alt="Sala de aula japonesa"/><div><b>Sala da Aiko</b><span>Aprenda o essencial</span></div></article><article className="scene-tile"><img src="/assets/scenarios/kyoto_traditional_street.webp" alt="Rua tradicional de Kyoto"/><div><b>Kyoto tradicional</b><span>Descubra a cultura</span></div></article><article className="scene-tile"><img src="/assets/scenarios/tokyo_city_street.webp" alt="Rua de Tóquio"/><div><b>Tóquio à noite</b><span>Pratique conversação</span></div></article><article className="scene-tile"><img src="/assets/scenarios/japanese_shop.webp" alt="Loja japonesa"/><div><b>Loja japonesa</b><span>Vocabulário do dia a dia</span></div></article></section></>}
          </>}

          {tab === "Histórias" && <div className="page-view"><div className="eyebrow">APRENDA PELO CONTEXTO</div><h1>Histórias interativas</h1><p className="muted">Entre em pequenas aventuras, escolha respostas e aprenda expressões que fazem sentido no cotidiano.</p><div className="story-grid">{storyContent.map((story,i) => <article key={story.id}><img src={story.image} alt=""/><div><span>INICIANTE · {story.duration.toUpperCase()}</span><h2>{story.title}</h2><p>{story.subtitle}</p><button className="primary-button" onClick={() => startStory(i)}>Começar história <ChevronRight size={15}/></button></div></article>)}</div></div>}

          {tab === "Conversar" && <div className="page-view tutor-page"><div className="eyebrow">PRÁTICA DE CONVERSAÇÃO</div><h1>Converse com sua tutora</h1><p className="muted">Escolha uma guia para praticar o idioma com uma personalidade e um método próprios.</p><div className="tutor-selector">{[{id:"aiko",name:"Aiko",lang:"Japonês"},{id:"emily",name:"Emily",lang:"Inglês"},{id:"hana",name:"Hana",lang:"Coreano"},{id:"sofia",name:"Sofía",lang:"Espanhol"},{id:"chloe",name:"Chloé",lang:"Francês"}].map(t=><button key={t.id} className={activeTutor===t.id?"active":""} onClick={()=>{setActiveTutor(t.id);setChatMessages([{role:"assistant",content:`Olá! Sou ${t.name}. Vamos praticar ${t.lang.toLowerCase()}? Escolha uma situação ou me conte o que gostaria de aprender.`}]);setChatUnavailable(false);}}><b>{t.name}</b><small>{t.lang}</small></button>)}</div><div className="tutor-layout"><div className="tutor-profile"><img src={activeTutor==="aiko"?"/assets/aiko/aiko_full_body_transparent.webp":activeTutor==="hana"?"/assets/tutors/hana/hana-full.png":activeTutor==="sofia"?"/assets/tutors/sofia/sofia-full.png":"/assets/aiko/aiko_portrait_transparent.webp"} alt="Tutora selecionada"/><b>{tutorNames[activeTutor]}</b><span>{tutorSubjects[activeTutor]}</span><div className="tutor-status"><span/> {chatUnavailable ? "Conexão de IA pendente" : "Sessão de prática"}</div><div className="tutor-tip">“Não é como se eu estivesse torcendo por você… mas vamos praticar!”</div></div><div className="chat-panel"><div className="chat-head"><div><b>Sala de conversação</b><small>{tutorLanguages[activeTutor]} · iniciante</small></div><span className="live-dot">● online</span></div><div className="chat-messages">{chatMessages.map((m,i) => <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>)}{chatBusy && <div className="chat-bubble assistant typing">Aiko está pensando…</div>}</div><div className="chat-suggestions">{["Como digo ‘meu nome é…’?","Vamos simular um pedido no café.","Corrija minha frase em japonês."] .map(s=><button key={s} onClick={()=>setChatInput(s)}>{s}</button>)}</div><form className="chat-compose" onSubmit={(e: { preventDefault: () => void })=>{e.preventDefault();sendChat();}}><input value={chatInput} onChange={(e: {target:{value:string}})=>setChatInput(e.target.value)} placeholder={`Escreva em português ou ${selectedLanguage.name.toLowerCase()}…`}/><button disabled={chatBusy || !chatInput.trim()} aria-label="Enviar"><Send size={18}/></button></form>{chatUnavailable && <p className="integration-note">A integração de IA precisa da variável secreta <code>OPENAI_API_KEY</code> no Vercel. A interface já está pronta; sem essa chave, a resposta generativa fica desativada.</p>}</div></div></div>}

          {tab === "Ranking" && <div className="page-view"><div className="eyebrow">APRENDA JUNTO COM A COMUNIDADE</div><h1>Liga Kotoba</h1><p className="muted">O ranking é calculado com o XP registrado no banco, não com pontuação de demonstração.</p><div className="leaderboard-card"><div className="leaderboard-title"><Trophy/><div><b>Classificação geral</b><small>Top 20 aprendizes</small></div></div>{!session ? <div className="empty-state">Entre na sua conta para consultar a liga.</div> : leaderboard.length ? leaderboard.map((entry,i)=><div className={`leader-row ${entry.display_name === (session.user.user_metadata?.display_name || session.user.email?.split("@")[0]) ? "self" : ""}`} key={`${entry.rank_position}-${entry.display_name}`}><span className={`rank-number rank-${i+1}`}>{entry.rank_position}</span><span className="leader-avatar">{entry.display_name.slice(0,1).toUpperCase()}</span><div><b>{entry.display_name}</b><small>{entry.current_streak} dias de ofensiva</small></div><strong>{entry.total_xp.toLocaleString("pt-BR")} XP</strong></div>) : <div className="empty-state">Ainda não há participantes suficientes. Seja um dos primeiros a entrar na liga!</div>}</div></div>}

          {tab === "Meu perfil" && <div className="page-view profile-page">
            <div className="eyebrow">SUA JORNADA NO KOTOBA QUEST</div><h1>Meu perfil</h1><p className="muted">Acompanhe suas conquistas, constância e evolução nos estudos.</p>
            {!session ? <div className="empty-state">Entre ou crie uma conta para salvar e consultar seu perfil.</div> : <>
              <div className="learner-profile-hero"><div className="learner-avatar">{(session.user.user_metadata?.display_name || session.user.email || "K").slice(0,1).toUpperCase()}</div><div><span className="chapter-tag">APRENDIZ KOTOBA</span><h2>{session.user.user_metadata?.display_name || session.user.email?.split("@")[0]}</h2><p>{session.user.email}</p></div></div>
              <div className="profile-stat-grid"><article><Zap/><b>{stats.total_xp.toLocaleString("pt-BR")}</b><span>XP total</span></article><article><Coins/><b>{stats.coins.toLocaleString("pt-BR")}</b><span>Moedas</span></article><article><Flame/><b>{stats.current_streak}</b><span>Dias seguidos</span></article><article><BookOpen/><b>{completedCount}/{allLessons.length}</b><span>Lições concluídas</span></article></div>
              <div className="admin-section"><div className="section-heading"><div><div className="eyebrow">PROGRESSO ATUAL</div><h2>{selectedLanguage.name} · {selectedLanguage.course}</h2></div><span className="unit-pill">NÍVEL {level}</span></div><div className="profile-progress-track"><span style={{width:`${allLessons.length ? completedCount/allLessons.length*100 : 0}%`}}/></div><p className="muted">{completedCount} de {allLessons.length} lições concluídas · {Math.round(allLessons.length ? completedCount/allLessons.length*100 : 0)}% da trilha</p></div>
              <div className="admin-section"><div className="section-heading"><div><div className="eyebrow">COLECIONE CONQUISTAS</div><h2>Minhas medalhas</h2></div><span className="unit-pill">{achievements.filter(a=>a.unlocked_at).length}/{achievements.length} DESBLOQUEADAS</span></div><div className="achievement-grid">{achievements.map(a=><article className={a.unlocked_at?"unlocked":""} key={a.id}><span>{a.icon}</span><b>{a.title}</b><small>{a.description}</small>{a.unlocked_at?<em>Conquistada</em>:<em>Bloqueada</em>}</article>)}</div></div>
            </>}
          </div>}

          {tab === "Aiko" && <div className="page-view character-page"><div className="eyebrow">SUA GUIA DE APRENDIZAGEM</div><h1>Conheça a Aiko</h1><p className="muted">Inteligente, dedicada e um pouquinho tsundere. Ela vai acompanhar sua evolução no japonês.</p><div className="character-showcase"><img src="/assets/aiko/aiko_full_body_transparent.webp" alt="Aiko em corpo inteiro"/><div><span className="chapter-tag">TUTORA · JAPONÊS</span><h2>“N-não é como se eu estivesse torcendo por você… mas continue!”</h2><p>Aiko explica expressões, ajuda com pronúncia e orienta suas primeiras conversas. Cada lição foi pensada para construir uma base útil e progressiva.</p><div className="expression-strip"><img src="/assets/aiko/aiko_expressions_sheet.webp" alt="Expressões da Aiko"/></div><button className="primary-button" onClick={()=>setTab("Conversar")}>Conversar com Aiko <MessageCircle size={15}/></button></div></div></div>}

          {tab === "Emily" && <div className="page-view character-page emily-page">
            <div className="eyebrow">SUA GUIA DE APRENDIZAGEM · INGLÊS</div>
            <h1>Conheça a Emily</h1>
            <p className="muted">Uma parceira de conversação que transforma o inglês em uma aventura leve, confiante e natural.</p>
            <div className="emily-showcase">
              <div className="emily-art-panel emily-image-panel">
                <span className="emily-orbit orbit-one">✦</span><span className="emily-orbit orbit-two">✧</span>
                <div className="emily-fallback"><span>E</span><b>EMILY</b><small>ENGLISH TUTOR · 🇬🇧</small></div>
                <img className="emily-full-art" src="/assets/tutors/emily/emily-full.webp" alt="Emily, tutora de inglês do Kotoba Quest" onError={(e)=>{e.currentTarget.style.display="none";}}/>
              </div>
              <div className="emily-copy">
                <span className="emily-label">GENKI GIRL · ONEE-SAN</span>
                <h2>“Come on! You’re doing better than you think.”</h2>
                <p>Emily é extrovertida, confiante e brincalhona. Tem energia de amiga experiente: incentiva sem pressionar, brinca com os pequenos erros e ajuda o aluno a falar sem medo.</p>
                <div className="emily-facts">
                  <div><span>Personalidade</span><b>Genki girl com lado onee-san: animada, protetora e acolhedora</b></div>
                  <div><span>Estilo</span><b>Urbano e elegante, inspirado em Londres</b></div>
                  <div><span>Gosta de</span><b>Música, viagens, cinema e conhecer culturas</b></div>
                  <div><span>Método</span><b>Conversação cotidiana, humor leve e correções gentis</b></div>
                </div>
                <div className="emily-tags"><span>🇬🇧 Inglês britânico</span><span>💬 Conversação</span><span>✨ Confiança ao falar</span></div>
                <button className="primary-button" onClick={()=>setToast("O perfil da Emily está pronto. O curso de inglês e a conversa com IA serão ativados em uma próxima etapa.")}>Perfil da tutora</button>
              </div>
            </div>
            <div className="emily-gallery">
              <article><img src="/assets/tutors/emily/emily-portrait.webp" alt="Retrato da Emily" onError={(e)=>{e.currentTarget.style.display="none";}}/><b>Retrato oficial</b><span>Perfil e seleção de tutora</span></article>
              <article><img src="/assets/tutors/emily/emily-expressions.webp" alt="Expressões da Emily" onError={(e)=>{e.currentTarget.style.display="none";}}/><b>Expressões</b><span>Reações para futuras conversas</span></article>
              <article><img src="/assets/tutors/emily/emily-classroom.webp" alt="Emily em sua sala de aula" onError={(e)=>{e.currentTarget.style.display="none";}}/><b>Sala de aula</b><span>Seu cenário de aprendizagem</span></article>
              <article><img src="/assets/tutors/emily/emily-celebrating.webp" alt="Emily comemorando uma conquista" onError={(e)=>{e.currentTarget.style.display="none";}}/><b>Comemoração</b><span>Reações às conquistas do aluno</span></article>
            </div>
            <div className="emily-note"><b>Identidade oficial definida</b><span>Emily usa cabelo loiro-mel, olhos azuis e roupas azul-marinho com detalhes prateados. As cinco artes serão usadas em áreas diferentes do aplicativo, mantendo o mesmo rosto e figurino.</span></div>
          </div>}
          {["Hana","Sofía","Chloé"].includes(tab) && (() => {
            const profiles = ({
              Hana: {language:"Coreano",flag:"🇰🇷",type:"KUUDERE",quote:"“Não precisa ter pressa. Vamos dominar isso, um passo de cada vez.”",description:"Hana é calma, observadora e reservada no primeiro contato. Demonstra carinho prestando atenção aos detalhes, oferecendo conselhos certeiros e elogiando discretamente cada avanço.",style:"Elegante e contemporâneo, inspirado em Seul",method:"Pronúncia cuidadosa, padrões da fala cotidiana e contexto cultural",color:"hana"},
              "Sofía": {language:"Espanhol",flag:"🇪🇸",type:"GENKI GIRL",quote:"“¡Vamos! Errar faz parte da aventura!”",description:"Sofía é espontânea, calorosa e expressiva. Usa humor, histórias e situações do cotidiano para fazer o aluno perder a vergonha e ganhar fluência.",style:"Mediterrâneo moderno, terracota e creme",method:"Conversação, expressões naturais e encenações do dia a dia",color:"sofia"},
              Chloé: {language:"Francês",flag:"🇫🇷",type:"OJOU-SAMA + DEREDERE",quote:"“Très bien! Sabia que você conseguiria.”",description:"Chloé é sofisticada, inteligente e exigente com elegância. Corrige detalhes com delicadeza e revela um lado doce quando percebe o esforço do aluno.",style:"Chic parisiense, refinado e atemporal",method:"Pronúncia, vocabulário preciso e construção de frases elegantes",color:"chloe"}
            } as Record<string, {language:string;flag:string;type:string;quote:string;description:string;style:string;method:string;color:string}>)[tab];
            if (!profiles) return null;
            return <div className={`page-view character-page tutor-coming-page ${profiles.color}`}>
              <div className="eyebrow">UNIVERSO KOTOBA QUEST · {profiles.language.toUpperCase()}</div>
              <h1>Conheça {tab}</h1>
              <p className="muted">Sua futura companheira para descobrir o idioma e a cultura.</p>
              <div className="tutor-profile-card"><div className={`tutor-art-frame ${tab === "Hana" ? "hana-art" : tab === "Sofía" ? "sofia-art" : "chloe-art"}`}>{tab === "Hana" ? <img src="/assets/tutors/hana/hana-full.png" alt="Hana, tutora de coreano" /> : tab === "Sofía" ? <img src="/assets/tutors/sofia/sofia-full.png" alt="Sofía, tutora de espanhol" /> : <div className="tutor-profile-emblem">{profiles.flag}</div>}</div><div><span className="tutor-archetype">{profiles.type}</span><h2>{profiles.quote}</h2><p>{profiles.description}</p><dl><dt>Estilo</dt><dd>{profiles.style}</dd><dt>Método de ensino</dt><dd>{profiles.method}</dd></dl><span className="tutor-language">{profiles.flag} {profiles.language}</span></div></div>
              <div className={`emily-note ${tab === "Chloé" ? "tutor-pending" : "tutor-art-ready"}`}><b>{tab === "Chloé" ? "Chloé · arte pendente" : "Arte oficial adicionada"}</b><span>{tab === "Chloé" ? "A personagem está reservada e seu perfil já está definido. A arte oficial será adicionada quando estiver pronta." : `A arte oficial de ${tab} já está integrada ao perfil. As expressões, a voz e o curso serão adicionados nas próximas etapas.`}</span></div>
            </div>;
          })()}

          {tab === "Premium" && <div className="page-view"><div className="eyebrow">KOTOBA PLUS</div><h1>Mais caminhos para aprender</h1><p className="muted">Escolha a experiência que combina com seu ritmo. A cobrança ainda não está ativada.</p><div className="plans-grid"><article><span className="plan-label">COMECE AGORA</span><h2>Gratuito</h2><strong>R$ 0 <small>/ sempre</small></strong><ul><li>Trilha de japonês inicial</li><li>Exercícios e progresso</li><li>Histórias selecionadas</li><li>5 corações</li></ul><span className="plan-current">Plano inicial</span></article><article className="featured-plan"><span className="plan-label">PARA IR MAIS LONGE</span><h2>Premium</h2><strong>R$ 14,90 <small>/ mês</small></strong><ul><li>Vidas ilimitadas</li><li>Revisão inteligente</li><li>Mais histórias e desafios</li><li>Estatísticas detalhadas</li></ul><button className="primary-button" onClick={()=>setToast("A cobrança será ativada após configurar um provedor de pagamento.")}>Em breve</button></article><article><span className="plan-label">EXPERIÊNCIA COMPLETA</span><h2>Premium Plus</h2><strong>R$ 24,90 <small>/ mês</small></strong><ul><li>Benefícios Premium</li><li>Prática avançada com tutores IA</li><li>Pronúncia e feedback ampliados</li><li>Conteúdo exclusivo</li></ul><button className="secondary-button" onClick={()=>setToast("A cobrança será ativada após configurar um provedor de pagamento.")}>Em breve</button></article></div><p className="integration-note">Os preços são os valores planejados na etapa de concepção. Nenhum pagamento será processado até integrar e testar um provedor, configurar webhooks e publicar os termos comerciais.</p></div>}

          {tab === "Administração" && admin && <div className="page-view"><div className="eyebrow">CONTROLE DA PLATAFORMA</div><h1>Painel administrativo</h1><p className="muted">Área protegida por app_metadata.role = admin.</p><div style={{margin:"16px 0"}}><Link className="primary-button" href="/admin" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none"}}>Abrir Admin Studio completo <ChevronRight size={16}/></Link></div><div className="admin-metrics"><div><BookOpen/><b>{allLessons.length}</b><span>Lições no curso</span></div><div><Activity/><b>{completedCount}</b><span>Conclusões nesta conta</span></div><div><UsersIcon/><b>{leaderboard.length}</b><span>Participantes no ranking</span></div><div><Languages/><b>{units.length}</b><span>Unidades cadastradas</span></div></div><div className="admin-section"><div className="section-heading"><div><div className="eyebrow">CONTEÚDO DO CURSO</div><h2>Gerenciamento de unidades</h2></div><span className="unit-pill">{selectedLanguage.name.toUpperCase()}</span></div><div className="admin-unit-list">{units.map((unit,index)=><article className="admin-unit-row" key={unit.id}><div className="admin-unit-index">{String(index+1).padStart(2,"0")}</div><div className="admin-unit-info"><b>{unit.title}</b><span>{unit.description}</span><small>{unit.lessons.length} lições · {unit.lessons.reduce((n,l)=>n+l.questions.length,0)} exercícios carregados</small></div><span className="admin-status">{unit.lessons.length ? "Conteúdo disponível" : "Sem lições"}</span></article>)}</div></div><div className="admin-section"><div className="section-heading"><div><div className="eyebrow">CONTROLE E SEGURANÇA</div><h2>Operação da plataforma</h2></div></div><div className="admin-action-grid"><article><b>Banco de aprendizagem</b><span>Progresso, respostas e recompensas processados por funções protegidas no Supabase.</span></article><article><b>Controle de acesso</b><span>Esta área só aparece para contas com app_metadata.role = admin.</span></article><article><b>Assinaturas</b><span>Planos exibidos como oferta planejada. Pagamentos ainda não estão ativos.</span></article><article><b>Inteligência artificial</b><span>O endpoint da tutora exige OPENAI_API_KEY configurada no servidor da Vercel.</span></article></div></div><div className="admin-section admin-editor"><div className="section-heading"><div><div className="eyebrow">EDITOR DE CONTEÚDO</div><h2>Criar uma nova aula</h2></div><span className="unit-pill">PUBLICAÇÃO SEGURA</span></div><p className="muted">Cadastre uma aula inicial com uma questão de múltipla escolha. A publicação só acontece depois que a questão é salva.</p><form className="admin-create-form" onSubmit={(e: {preventDefault:()=>void})=>{e.preventDefault();createAdminLesson();}}><label>Unidade<select value={adminUnitId || units[0]?.id || ""} onChange={(e:{target:{value:string}})=>setAdminUnitId(e.target.value)} required>{units.map(u=><option key={u.id} value={u.id}>{u.title}</option>)}</select></label><label>Título da aula<input value={adminLessonTitle} onChange={(e:{target:{value:string}})=>setAdminLessonTitle(e.target.value)} placeholder="Ex.: Apresentações pessoais" required/></label><label>Pergunta ou frase do exercício<input value={adminQuestionPrompt} onChange={(e:{target:{value:string}})=>setAdminQuestionPrompt(e.target.value)} placeholder="Ex.: Como dizer bom dia em japonês?" required/></label><label>Opções (separadas por vírgula)<input value={adminQuestionOptions} onChange={(e:{target:{value:string}})=>setAdminQuestionOptions(e.target.value)} required/></label><label>Resposta correta<input value={adminQuestionAnswer} onChange={(e:{target:{value:string}})=>setAdminQuestionAnswer(e.target.value)} placeholder="Precisa corresponder exatamente a uma opção" required/></label><label>Explicação da resposta<textarea value={adminQuestionExplanation} onChange={(e:{target:{value:string}})=>setAdminQuestionExplanation(e.target.value)} placeholder="Explique por que esta resposta está correta."/></label><button className="primary-button" type="submit" disabled={adminSaving || !units.length}>{adminSaving?"Publicando...":"Criar e publicar aula"}</button></form></div><div className="integration-note">O editor grava conteúdo usando a sessão autenticada e políticas de banco exclusivas para administradores. As respostas corretas continuam protegidas contra leitura por alunos.</div></div>}
        </section>

        <aside className="right-panel"><div className="profile-card"><div className="profile-top"><div className="profile-avatar">{session?.user.email?.slice(0,2).toUpperCase() || "🌸"}</div><div><b>{session?.user.user_metadata?.display_name || (session ? session.user.email : "Aprendiz")}</b><small>{session ? "Conta sincronizada" : "Prévia · entre para salvar"}</small></div></div><div className="profile-xp"><span>Progresso até nível {level+1}</span><b>{levelProgress}/200 XP</b></div><div className="tiny-bar"><span style={{width:`${levelProgress/2}%`}}/></div></div><div className="daily-card"><div className="card-heading"><CalendarDaysIcon/> <b>Missões diárias</b></div>{quests.length ? quests.map(q=><div className="quest-line" key={q.id}><p>{q.title}</p><div className="daily-progress"><span style={{width:`${Math.min(100,q.progress_value/q.goal_value*100)}%`}}/></div><small>{q.progress_value}/{q.goal_value} · +{q.reward_xp} XP</small></div>) : <p>Entre e complete lições para ativar suas missões.</p>}</div><div className="quote-card"><span className="quote-spark">✧</span><p>“Não é como se eu estivesse torcendo por você, tá? Mas… continue praticando!”</p><b>— Aiko</b></div><div className="streak-card"><Flame size={20}/><span><b>{stats.current_streak} dias de ofensiva</b><small>Seu recorde: {stats.longest_streak} dias</small></span><ChevronRight size={17}/></div><div className="footer-note">KOTOBA QUEST · APRENDA NO SEU RITMO</div>{session && <button className="logout-button" onClick={signOut}><LogOut size={15}/> Sair da conta</button>}</aside>
      </div> : <LandingHome onStart={() => { setAuthMode("signup"); setAuthOpen(true); }} />}

      {authOpen && <div className="modal-backdrop" onMouseDown={(e: {target:EventTarget|null;currentTarget:EventTarget})=>{if(e.target===e.currentTarget)setAuthOpen(false);}}><div className="lesson-modal auth-modal"><div className="modal-top"><span className="chapter-tag">KOTOBA QUEST · SUA CONTA</span><button className="icon-button" onClick={()=>setAuthOpen(false)}><X/></button></div><div className="modal-aiko"><img src="/assets/aiko/aiko_portrait_transparent.webp" alt="Aiko"/></div><h2>{authMode === "login" ? "Que bom ter você de volta!" : authMode === "signup" ? "Comece sua aventura" : "Recupere sua senha"}</h2><p className="muted">{authMode === "recover" ? "Enviaremos um link seguro para seu e-mail." : "Entre para salvar seu progresso em todos os seus dispositivos."}</p>{authMode === "signup" && <label className="auth-label">Como podemos chamar você?<input value={displayName} onChange={(e: {target:{value:string}})=>setDisplayName(e.target.value)} placeholder="Seu nome" autoComplete="name"/></label>}<label className="auth-label">E-mail<input type="email" value={email} onChange={(e: {target:{value:string}})=>setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email"/></label>{authMode !== "recover" && <label className="auth-label">Senha<input type="password" value={password} onChange={(e: {target:{value:string}})=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={authMode === "login" ? "current-password" : "new-password"}/></label>}{authError && <p className="auth-error">{authError}</p>}{authMessage && <p className="auth-success">{authMessage}</p>}{!isSupabaseConfigured() && <p className="auth-error">Conexão do banco não configurada neste ambiente.</p>}<button className="primary-button full" disabled={authBusy || !email || (authMode !== "recover" && password.length<6) || !isSupabaseConfigured()} onClick={submitAuth}>{authBusy ? "Aguarde…" : authMode === "login" ? "Entrar" : authMode === "signup" ? "Criar minha conta" : "Enviar link de recuperação"}</button>{authMode === "login" && <button className="auth-switch" onClick={()=>{setAuthMode("recover");setAuthError("");setAuthMessage("");}}>Esqueci minha senha</button>}<button className="auth-switch" onClick={()=>{setAuthMode(authMode === "signup" ? "login" : "signup");setAuthError("");setAuthMessage("");}}>{authMode === "signup" ? "Já tem uma conta? Entrar" : "Ainda não tem conta? Criar conta"}</button></div></div>}

      {lesson && <div className="modal-backdrop lesson-backdrop"><div className="lesson-modal lesson-player"><div className="lesson-progress-top"><button className="icon-button" onClick={closeLesson}><X/></button><div className="lesson-progress-bar"><span style={{width:`${lessonResult ? 100 : (questionIndex/lesson.questions.length)*100}%`}}/></div><span>{lessonResult ? lesson.questions.length : questionIndex+1}/{lesson.questions.length}</span></div>{lessonResult ? <div className="lesson-complete"><div className="complete-medal">{lessonResult.passed ? "🏆" : "💪"}</div><div className="eyebrow">{lessonResult.passed ? "LIÇÃO CONCLUÍDA" : "QUASE LÁ"}</div><h2>{lessonResult.passed ? "Você conseguiu!" : "Vamos tentar mais uma vez?"}</h2><p>{lessonResult.correct} de {lessonResult.total} respostas corretas · {lessonResult.score}%</p>{lessonResult.passed ? <div className="xp-earned"><Zap/> +{lessonResult.xp_earned} XP</div> : <p className="muted">Você precisa de pelo menos 70% para concluir a lição.</p>}<button className="primary-button full" onClick={()=>{if(lessonResult.passed){closeLesson();}else{setQuestionIndex(0);setAnswers([]);setAnswer("");setAnswerResult(null);setLessonResult(null);}}}>{lessonResult.passed ? "Voltar à trilha" : "Tentar novamente"}</button></div> : <><div className="lesson-aiko"><img src="/assets/aiko/aiko_portrait_transparent.webp" alt="Aiko"/></div><div className="eyebrow">{lesson.title.toUpperCase()}</div><h2>{lesson.questions[questionIndex].prompt_translation || "Escolha a resposta correta."}</h2><div className="question-box"><span>{selectedLanguage.name.toUpperCase()}</span><strong>{lesson.questions[questionIndex].prompt}</strong><button className="sound-button" onClick={()=>speak(lesson.questions[questionIndex].prompt)}><Volume2 size={17}/> Ouvir pronúncia</button></div>{lesson.questions[questionIndex].question_type === "typing" ? <input className="typing-answer" value={answer} onChange={(e: {target:{value:string}})=>setAnswer(e.target.value)} placeholder="Digite sua resposta…" disabled={!!answerResult}/> : <div className="answer-list">{(lesson.questions[questionIndex].options || []).map(option=><button key={option} disabled={!!answerResult} onClick={()=>setAnswer(option)} className={`answer-option ${answer===option?"chosen":""} ${answerResult && option===answerResult.correct_answer?"correct":""}`}>{option}{answerResult && option===answerResult.correct_answer && <Check size={18}/>}</button>)}</div>}{answerResult && <div className={`feedback ${answerResult.correct?"good":"bad"}`}><b>{answerResult.correct ? "Muito bem!" : `A resposta correta é: ${answerResult.correct_answer}`}</b><span>{answerResult.explanation}</span></div>}{!answerResult ? <button className="primary-button full" disabled={!answer.trim() || checking} onClick={checkAnswer}>{checking ? "Verificando…" : "Verificar resposta"}</button> : <button className="primary-button full" disabled={checking} onClick={nextQuestion}>{checking ? "Salvando…" : questionIndex === lesson.questions.length-1 ? "Finalizar lição" : "Continuar"}<ChevronRight size={16}/></button>}</>}</div></div>}

      {storyIndex !== null && <div className="modal-backdrop"><div className="lesson-modal story-player"><div className="modal-top"><span className="chapter-tag">HISTÓRIA · {storyStep+1}/{storyContent[storyIndex].steps.length}</span><button className="icon-button" onClick={()=>setStoryIndex(null)}><X/></button></div><img className="story-scene" src={storyContent[storyIndex].image} alt=""/><div className="eyebrow">{storyContent[storyIndex].title}</div><p>{storyContent[storyIndex].steps[storyStep].scene}</p><div className="story-dialogue"><b>{storyContent[storyIndex].steps[storyStep].speaker}</b><strong>{storyContent[storyIndex].steps[storyStep].japanese}</strong><span>{storyContent[storyIndex].steps[storyStep].translation}</span><button className="sound-button" onClick={()=>speak(storyContent[storyIndex!].steps[storyStep].japanese)}><Volume2 size={16}/> Ouvir</button></div><h3>{storyContent[storyIndex].steps[storyStep].prompt}</h3><div className="answer-list">{storyContent[storyIndex].steps[storyStep].choices.map(c=><button key={c} disabled={!!storyFeedback} onClick={()=>setStoryChoice(c)} className={`answer-option ${storyChoice===c?"chosen":""}`}>{c}</button>)}</div>{storyFeedback && <div className="feedback">{storyFeedback}</div>}{!storyFeedback ? <button className="primary-button full" disabled={!storyChoice} onClick={chooseStory}>Verificar</button> : <button className="primary-button full" onClick={nextStory}>{storyStep === storyContent[storyIndex].steps.length-1 ? "Concluir história" : "Próxima cena"}<ChevronRight size={16}/></button>}</div></div>}

      {toast && <button className="toast" onClick={()=>setToast("")}>{toast}<X size={14}/></button>}
    </main>
  );
}

function ArrowRightIcon() { return <ChevronRight size={15}/>; }
function UsersIcon() { return <GraduationCap/>; }
function CalendarDaysIcon() { return <Target size={17}/>; }
