"use client";

import { BookOpen, CheckCircle2, ChevronRight, Coins, Flame, LockKeyhole, MapPinned, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";

type Lesson = { id:string; unit_id:string; title:string; description:string; lesson_type:string; xp_reward:number; sort_order:number; questions:{id:string; lesson_id:string; prompt:string; prompt_translation:string|null; question_type:string; options:string[]; sort_order:number}[] };
type Unit = { id:string; title:string; description:string; lessons:Lesson[] };
type Progress = { status:"locked"|"in_progress"|"completed"; best_score:number; attempts_count:number };
type Stats = { total_xp:number; coins:number; hearts:number; current_streak:number; longest_streak:number };
type Quest = { id:string; title:string; description:string; goal_value:number; reward_xp:number; progress_value:number; completed_at:string|null };
type Achievement = { id:string; title:string; description:string; icon:string; xp_reward:number; unlocked_at:string|null };

export default function RpgJourney({ languageName, languageFlag, tutorName, stats, units, progress, quests, achievements, onStartLesson }: {
  languageName:string; languageFlag:string; tutorName:string; stats:Stats; units:Unit[];
  progress:Record<string,Progress>; quests:Quest[]; achievements:Achievement[];
  onStartLesson:(lesson:Lesson, locked:boolean)=>void;
}) {
  const lessons=units.flatMap(unit=>unit.lessons);
  const completed=lessons.filter(lesson=>progress[lesson.id]?.status==="completed").length;
  const percent=lessons.length?Math.round(completed/lessons.length*100):0;
  const level=Math.floor(stats.total_xp/200)+1;
  const levelXp=stats.total_xp%200;
  const next=lessons.find(lesson=>progress[lesson.id]?.status!=="completed");
  let previousUnitDone=true;

  return <div className="rpg-journey page-view">
    <section className="rpg-world-hero">
      <div className="rpg-world-copy">
        <span className="rpg-kicker"><Sparkles size={14}/> SUA AVENTURA DE APRENDIZAGEM</span>
        <h1>Uma jornada por {languageName}.</h1>
        <p>Complete missões, conquiste regiões e transforme cada sessão de estudo em experiência.</p>
        <div className="rpg-hero-actions">
          {next ? <button className="rpg-primary" onClick={()=>onStartLesson(next,false)}>Continuar jornada <ChevronRight size={17}/></button> : <span className="rpg-complete"><Trophy size={16}/> Trilha concluída</span>}
          <span className="rpg-tutor-chip">{languageFlag} Guiado por {tutorName}</span>
        </div>
      </div>
      <div className="rpg-world-art"><img src="/assets/world/japan_learning_world_map.webp" alt="Mapa ilustrado da jornada Kotoba Quest"/><div className="rpg-world-level"><span>NÍVEL</span><b>{level}</b></div></div>
    </section>

    <section className="rpg-stat-grid">
      <article><span className="rpg-stat-icon xp"><Zap size={18}/></span><b>{stats.total_xp.toLocaleString("pt-BR")}</b><small>Experiência total</small><div className="rpg-xp-track"><i style={{width:(levelXp/200*100)+"%"}}/></div><small>{levelXp}/200 XP para o próximo nível</small></article>
      <article><span className="rpg-stat-icon coins"><Coins size={18}/></span><b>{stats.coins.toLocaleString("pt-BR")}</b><small>Kotoba Coins</small><em>Recompensas das lições</em></article>
      <article><span className="rpg-stat-icon streak"><Flame size={18}/></span><b>{stats.current_streak}</b><small>Dias de sequência</small><em>Recorde: {stats.longest_streak} dias</em></article>
      <article><span className="rpg-stat-icon progress"><Target size={18}/></span><b>{percent}%</b><small>Trilha concluída</small><em>{completed} de {lessons.length} lições</em></article>
    </section>

    <section className="rpg-map-section">
      <div className="rpg-section-heading"><div><span>MAPA DE PROGRESSÃO</span><h2>Seu mundo, suas conquistas</h2><p>As próximas etapas são liberadas conforme você conclui as anteriores.</p></div><span className="rpg-map-badge"><MapPinned size={15}/> {units.length} regiões</span></div>
      <div className="rpg-region-list">
        {units.map((unit,index)=>{
          const unitDone=unit.lessons.filter(l=>progress[l.id]?.status==="completed").length;
          const allDone=unit.lessons.length>0&&unitDone===unit.lessons.length;
          const unlocked=previousUnitDone;
          const firstOpen=unit.lessons.findIndex(l=>progress[l.id]?.status!=="completed");
          previousUnitDone=allDone;
          return <article className={`rpg-region ${allDone?"is-complete":unlocked?"is-open":"is-locked"}`} key={unit.id}>
            <div className="rpg-region-marker">{allDone?<CheckCircle2 size={21}/>:unlocked?<MapPinned size={21}/>:<LockKeyhole size={19}/>}</div>
            <div className="rpg-region-main"><div className="rpg-region-title"><span>REGIÃO {String(index+1).padStart(2,"0")}</span><b>{unit.title}</b><small>{unit.description}</small></div><div className="rpg-region-progress"><i style={{width:(unit.lessons.length?unitDone/unit.lessons.length*100:0)+"%"}}/></div><small className="rpg-region-count">{unitDone}/{unit.lessons.length} etapas concluídas</small>
              <div className="rpg-node-row">{unit.lessons.map((lesson,lessonIndex)=>{
                const done=progress[lesson.id]?.status==="completed";
                const open=unlocked&&(lessonIndex===0||unit.lessons.slice(0,lessonIndex).every(l=>progress[l.id]?.status==="completed"));
                return <button key={lesson.id} className={`rpg-node ${done?"done":open?"available":"locked"}`} disabled={!done&&!open} onClick={()=>onStartLesson(lesson,!open)} title={lesson.title}>{done?<CheckCircle2 size={17}/>:open?<BookOpen size={17}/>:<LockKeyhole size={15}/>}<span>{lessonIndex+1}</span></button>;
              })}</div>
            </div>
            <div className="rpg-region-reward"><Star size={14}/> {unit.lessons.reduce((sum,l)=>sum+l.xp_reward,0)} XP</div>
          </article>;
        })}
      </div>
    </section>

    <section className="rpg-lower-grid">
      <article className="rpg-quest-panel"><div className="rpg-section-heading compact"><div><span>OBJETIVOS DO DIA</span><h2>Missões ativas</h2></div><Target size={20}/></div>
        {quests.length?quests.map(quest=><div className="rpg-quest" key={quest.id}><div className={quest.completed_at?"quest-done":"quest-icon"}>{quest.completed_at?<CheckCircle2 size={17}/>:<Target size={17}/>}</div><div className="rpg-quest-copy"><b>{quest.title}</b><small>{quest.description}</small><div className="rpg-quest-track"><i style={{width:Math.min(100,quest.goal_value?quest.progress_value/quest.goal_value*100:0)+"%"}}/></div><small>{Math.min(quest.progress_value,quest.goal_value)}/{quest.goal_value} · +{quest.reward_xp} XP</small></div></div>):<p className="rpg-empty">Entre e conclua uma lição para começar a receber missões diárias.</p>}
      </article>
      <article className="rpg-achievement-panel"><div className="rpg-section-heading compact"><div><span>PROGRESSO PESSOAL</span><h2>Conquistas</h2></div><Trophy size={20}/></div>
        {achievements.length?achievements.slice(0,5).map(item=><div className={`rpg-achievement ${item.unlocked_at?"unlocked":""}`} key={item.id}><span>{item.icon||"🏅"}</span><div><b>{item.title}</b><small>{item.description}</small></div><strong>{item.unlocked_at?"Desbloqueada":`+${item.xp_reward} XP`}</strong></div>):<p className="rpg-empty">Suas primeiras conquistas aparecerão aqui.</p>}
      </article>
    </section>
  </div>;
}
