"use client";

import { ArrowRight, BookOpen, Check, ChevronDown, CirclePlay, Compass, Flame, Headphones, MessageCircle, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";

export default function LandingHome({ onStart }: { onStart: () => void }) {
  return <main className="landing-page">
    <section className="landing-hero" id="inicio">
      <div className="landing-hero-photo" />
      <div className="landing-nav-wrap">
        <a className="landing-brand" href="#inicio"><span className="landing-brand-mark">言</span><span>KOTOBA<span> QUEST</span></span></a>
        <nav className="landing-nav"><a href="#metodo">Método</a><a href="#idiomas">Idiomas</a><a href="#tutores">Tutores</a><a href="#jornada">A experiência</a></nav>
        <button className="landing-login" onClick={onStart}>Entrar <ArrowRight size={15}/></button>
      </div>
      <div className="landing-hero-inner">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span/> APRENDER UM IDIOMA PODE SER UMA AVENTURA</div>
          <h1>O mundo fica<br/>maior quando<br/><em>você entende.</em></h1>
          <p>Mais do que memorizar palavras. Viva histórias, pratique conversas e descubra uma nova cultura — uma pequena conquista de cada vez.</p>
          <div className="landing-hero-actions"><button className="landing-cta" onClick={onStart}>Começar gratuitamente <ArrowRight size={17}/></button><a className="landing-watch" href="#jornada"><span><CirclePlay size={19}/></span> Conheça a experiência</a></div>
          <div className="landing-proof"><div className="landing-proof-avatars"><i>あ</i><i>文</i><i>語</i></div><span>Seu ritmo. Sua jornada. Seu próximo idioma.</span></div>
        </div>
        <div className="landing-hero-art">
          <div className="landing-art-orbit orbit-one"/><div className="landing-art-orbit orbit-two"/>
          <div className="landing-art-card"><img src="/assets/aiko/aiko_full_body_transparent.webp" alt="Aiko, tutora de japonês"/><div className="landing-art-caption"><span className="landing-online-dot"/> SUA COMPANHEIRA DE JORNADA<strong>Aiko</strong><small>Vamos aprender japonês?</small></div></div>
          <div className="landing-float-card float-xp"><span className="float-icon"><Zap size={17}/></span><div><b>+20 XP</b><small>Nova conquista</small></div></div>
          <div className="landing-float-card float-streak"><span className="float-icon flame"><Flame size={18}/></span><div><b>7 dias</b><small>Constância cria fluência</small></div></div>
          <span className="landing-sparkle sparkle-a">✳</span><span className="landing-sparkle sparkle-b">✧</span>
        </div>
      </div>
      <div className="landing-hero-bottom"><span>01 — UMA NOVA FORMA DE APRENDER</span><span>ROLE PARA DESCOBRIR <ChevronDown size={14}/></span></div>
    </section>

    <section className="landing-manifesto" id="metodo">
      <div className="landing-section-label"><span>01</span> O MÉTODO KOTOBA</div>
      <div className="landing-manifesto-grid"><h2>Não estude apenas<br/>um idioma. <em>Habite-o.</em></h2><div><p>Na vida real, a gente aprende porque precisa se comunicar, resolver situações e criar conexões. O Kotoba Quest transforma esse princípio em uma jornada interativa.</p><p>Você aprende o essencial, coloca em prática e percebe sua evolução sem precisar decorar listas intermináveis.</p><button className="landing-text-link" onClick={onStart}>Descubra sua primeira missão <ArrowRight size={15}/></button></div></div>
      <div className="landing-method-cards">
        <article><span className="method-index">A / 01</span><div className="method-icon"><BookOpen/></div><h3>Aprenda no contexto</h3><p>Vocabulário e estruturas aparecem em situações que fazem sentido.</p></article>
        <article><span className="method-index">A / 02</span><div className="method-icon"><MessageCircle/></div><h3>Pratique sem medo</h3><p>Converse, teste respostas e aprenda com cada tentativa.</p></article>
        <article><span className="method-index">A / 03</span><div className="method-icon"><Trophy/></div><h3>Veja sua evolução</h3><p>XP, conquistas e metas ajudam você a manter o ritmo.</p></article>
      </div>
    </section>

    <section className="landing-languages" id="idiomas">
      <div className="landing-section-label light"><span>02</span> ESCOLHA SEU PRÓXIMO DESTINO</div>
      <div className="landing-language-heading"><h2>Uma língua abre<br/><em>um novo universo.</em></h2><p>Comece por onde sua curiosidade levar. Novos caminhos estão sendo preparados.</p></div>
      <div className="landing-language-grid">
        <article className="language-feature"><div className="language-photo japan-photo"/><div className="language-meta"><span>🇯🇵 JAPÃO</span><b>日本語</b><small>Disponível para começar</small><button onClick={onStart}>Explorar japonês <ArrowRight size={14}/></button></div><div className="language-number">01</div></article>
        <article><div className="language-flag">🇺🇸</div><div className="language-meta"><span>ESTADOS UNIDOS</span><b>English</b><small>Em expansão</small></div><div className="language-number">02</div></article>
        <article><div className="language-flag">🇰🇷</div><div className="language-meta"><span>COREIA DO SUL</span><b>한국어</b><small>Em expansão</small></div><div className="language-number">03</div></article>
        <article><div className="language-flag">🇪🇸</div><div className="language-meta"><span>ESPANHA</span><b>Español</b><small>Em expansão</small></div><div className="language-number">04</div></article>
        <article><div className="language-flag">🇫🇷</div><div className="language-meta"><span>FRANÇA</span><b>Français</b><small>Em expansão</small></div><div className="language-number">05</div></article>
      </div>
    </section>

    <section className="landing-tutors" id="tutores">
      <div className="landing-section-label"><span>03</span> APRENDER COM ALGUÉM FAZ DIFERENÇA</div>
      <div className="landing-tutor-grid"><div><h2>Conheça quem<br/>vai caminhar<br/><em>com você.</em></h2><p>Tutores com personalidades e estilos próprios tornam cada etapa mais humana. Aiko é a primeira guia da jornada; novas personagens estão chegando.</p><button className="landing-cta dark" onClick={onStart}>Conhecer o Kotoba <ArrowRight size={16}/></button></div>
        <div className="landing-aiko-card"><div className="aiko-card-bg"/><img src="/assets/aiko/aiko_portrait_transparent.webp" alt="Aiko, tutora de japonês"/><div className="aiko-card-info"><span>01 / TUTORA DE JAPONÊS</span><b>Aiko</b><small>Curiosa, gentil e sempre pronta para uma nova aventura.</small></div><div className="aiko-card-stamp">はじめ<br/>よう!</div></div>
      </div>
      <div className="landing-tutor-note"><Sparkles size={16}/> Cada tutora terá uma abordagem própria, construída para aproximar idioma, cultura e conversação.</div>
    </section>

    <section className="landing-experience" id="jornada">
      <div className="landing-section-label light"><span>04</span> SUA JORNADA, PASSO A PASSO</div>
      <div className="landing-experience-head"><h2>Pequenos passos.<br/><em>Grandes descobertas.</em></h2><p>Uma experiência feita para transformar alguns minutos por dia em progresso que você consegue sentir.</p></div>
      <div className="landing-experience-grid">
        <div className="experience-main"><div className="experience-image"/><div className="experience-overlay"><span>MISSÃO 001 · KYOTO</span><b>Uma conversa<br/>pode abrir portas.</b><small>Aprenda expressões para se orientar e descobrir a cidade.</small></div></div>
        <div className="experience-side"><article><div className="experience-icon"><Target/></div><span>01 / FOCO</span><b>Missões curtas</b><p>Objetivos claros para estudar mesmo nos dias corridos.</p></article><article><div className="experience-icon"><Headphones/></div><span>02 / IMERSÃO</span><b>Ouça e pratique</b><p>Treine a leitura, a escuta e a pronúncia durante as atividades.</p></article><article><div className="experience-icon"><Star/></div><span>03 / CONQUISTAS</span><b>Progresso visível</b><p>Ganhe XP, acompanhe sua sequência e celebre cada avanço.</p></article></div>
      </div>
    </section>

    <section className="landing-final"><div className="landing-final-mark">言</div><span>SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span><h2>Qual será sua<br/><em>primeira palavra?</em></h2><p>Entre no Kotoba Quest e comece a construir uma nova forma de ver o mundo.</p><button className="landing-cta" onClick={onStart}>Começar minha jornada <ArrowRight size={17}/></button><div className="landing-final-jp">言葉は、世界への扉。</div></section>
    <footer className="landing-footer"><a className="landing-brand" href="#inicio"><span className="landing-brand-mark">言</span><span>KOTOBA<span> QUEST</span></span></a><small>Aprenda no seu ritmo. Descubra o mundo.</small><span>© 2026 KOTOBA QUEST</span></footer>
  </main>;
}