"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, CircleAlert, Database, Languages, LoaderCircle, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";

type Field = { key: string; label: string; type?: "text" | "number" | "boolean" | "json"; relation?: string; required?: boolean; placeholder?: string; help?: string };
type Resource = { key: string; label: string; singular: string; description: string; fields: Field[]; order: string };
type Row = Record<string, unknown> & { id?: string; code?: string };

const resources: Resource[] = [
 { key:"languages", label:"Idiomas", singular:"idioma", description:"Cadastre os idiomas disponíveis na plataforma.", order:"name", fields:[{key:"code",label:"Código (ISO)",required:true,placeholder:"ja"},{key:"name",label:"Nome",required:true},{key:"native_name",label:"Nome nativo",required:true},{key:"flag_emoji",label:"Bandeira / símbolo",placeholder:"🇯🇵"},{key:"is_published",label:"Publicado",type:"boolean"}] },
 { key:"characters", label:"Tutores", singular:"tutor", description:"Gerencie os personagens e os metadados de cada tutor.", order:"name", fields:[{key:"slug",label:"Identificador",required:true,placeholder:"aiko"},{key:"name",label:"Nome",required:true},{key:"language_code",label:"Idioma",required:true,relation:"languages"},{key:"archetype",label:"Personalidade",required:true},{key:"bio",label:"Biografia"},{key:"avatar_url",label:"URL da arte"},{key:"voice_id",label:"ID de voz"},{key:"is_published",label:"Publicado",type:"boolean"}] },
 { key:"courses", label:"Cursos", singular:"curso", description:"Organize cursos por idioma, tutor e nível.", order:"sort_order", fields:[{key:"language_code",label:"Idioma",required:true,relation:"languages"},{key:"character_id",label:"Tutor (opcional)",relation:"characters"},{key:"title",label:"Título",required:true},{key:"description",label:"Descrição"},{key:"level",label:"Nível",required:true,placeholder:"beginner"},{key:"sort_order",label:"Ordem",type:"number"},{key:"is_published",label:"Publicado",type:"boolean"}] },
 { key:"units", label:"Unidades", singular:"unidade", description:"Agrupe lições em unidades de aprendizagem.", order:"sort_order", fields:[{key:"course_id",label:"Curso",required:true,relation:"courses"},{key:"title",label:"Título",required:true},{key:"description",label:"Descrição"},{key:"sort_order",label:"Ordem",type:"number"}] },
 { key:"lessons", label:"Lições", singular:"lição", description:"Crie, edite, ordene e publique lições.", order:"sort_order", fields:[{key:"unit_id",label:"Unidade",required:true,relation:"units"},{key:"title",label:"Título",required:true},{key:"description",label:"Descrição"},{key:"lesson_type",label:"Tipo",required:true,placeholder:"vocabulary"},{key:"xp_reward",label:"Recompensa XP",type:"number"},{key:"sort_order",label:"Ordem",type:"number"},{key:"is_published",label:"Publicado",type:"boolean"}] },
 { key:"lesson_questions", label:"Questões", singular:"questão", description:"Edite enunciados, alternativas, gabarito e explicações. O gabarito só aparece neste painel protegido.", order:"sort_order", fields:[{key:"lesson_id",label:"Lição",required:true,relation:"lessons"},{key:"prompt",label:"Enunciado",required:true},{key:"prompt_translation",label:"Tradução / instrução"},{key:"question_type",label:"Formato",required:true,placeholder:"multiple_choice"},{key:"options",label:"Alternativas (JSON)",type:"json",help:"Para múltipla escolha, use um array JSON, por exemplo [\"A\",\"B\",\"C\"]."},{key:"answer_key",label:"Resposta correta",required:true},{key:"explanation",label:"Explicação"},{key:"audio_url",label:"URL de áudio"},{key:"sort_order",label:"Ordem",type:"number"}] },
 { key:"achievements", label:"Conquistas", singular:"conquista", description:"Configure medalhas e recompensas por objetivos.", order:"title", fields:[{key:"slug",label:"Identificador",required:true},{key:"title",label:"Título",required:true},{key:"description",label:"Descrição"},{key:"icon",label:"Ícone",placeholder:"⭐"},{key:"xp_reward",label:"Recompensa XP",type:"number"},{key:"is_published",label:"Publicado",type:"boolean"}] },
 { key:"daily_quests", label:"Missões diárias", singular:"missão", description:"Configure objetivos diários e suas recompensas.", order:"title", fields:[{key:"title",label:"Título",required:true},{key:"description",label:"Descrição"},{key:"goal_type",label:"Tipo do objetivo",required:true,placeholder:"complete_lessons"},{key:"goal_value",label:"Meta",type:"number",required:true},{key:"reward_xp",label:"Recompensa XP",type:"number"},{key:"is_published",label:"Publicado",type:"boolean"}] }
];

const defaults: Record<string, Row> = {
 languages:{code:"ja",name:"Japonês",native_name:"日本語",flag_emoji:"🇯🇵",is_published:false},
 characters:{slug:"aiko",name:"Aiko",language_code:"ja",archetype:"Gentil e levemente tsundere",bio:"Tutora de japonês do Kotoba Quest.",avatar_url:"",voice_id:"",is_published:false},
 courses:{language_code:"ja",character_id:"",title:"Japonês para iniciantes",description:"Sua primeira jornada pelo japonês.",level:"beginner",sort_order:1,is_published:false},
 units:{course_id:"",title:"Primeiros passos",description:"Fundamentos do idioma.",sort_order:1},
 lessons:{unit_id:"",title:"Nova lição",description:"",lesson_type:"vocabulary",xp_reward:15,sort_order:1,is_published:false},
 lesson_questions:{lesson_id:"",prompt:"",prompt_translation:"",question_type:"multiple_choice",options:["Opção A","Opção B","Opção C"],answer_key:"Opção A",explanation:"",audio_url:"",sort_order:1},
 achievements:{slug:"primeira-vitoria",title:"Primeira vitória",description:"Conclua sua primeira lição.",icon:"🏆",xp_reward:20,is_published:true},
 daily_quests:{title:"Pratique hoje",description:"Conclua uma lição.",goal_type:"complete_lessons",goal_value:1,reward_xp:10,is_published:true}
};

const env = { url: process.env.NEXT_PUBLIC_SUPABASE_URL || "", key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" };
const asText = (value: unknown) => value == null ? "" : typeof value === "object" ? JSON.stringify(value,null,2) : String(value);
const rowLabel = (row: Row) => String(row.title || row.name || row.prompt || row.slug || row.code || row.id || "Registro");

export default function AdminPage() {
 const [token,setToken] = useState("");
 const [adminName,setAdminName] = useState("");
 const [authorized,setAuthorized] = useState(false);
 const [checking,setChecking] = useState(true);
 const [error,setError] = useState("");
 const [notice,setNotice] = useState("");
 const [active,setActive] = useState("courses");
 const [rows,setRows] = useState<Record<string,Row[]>>({});
 const [loading,setLoading] = useState(false);
 const [saving,setSaving] = useState(false);
 const [editing,setEditing] = useState<Row|null>(null);
 const [values,setValues] = useState<Row>({});
 const [query,setQuery] = useState("");
 const [showForm,setShowForm] = useState(false);

 const api = useCallback(async (path:string, init:RequestInit={}) => {
  const response = await fetch(`${env.url}/rest/v1/${path}`,{...init,headers:{apikey:env.key,Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(init.headers||{})}});
  const data = response.status===204 ? null : await response.json().catch(()=>null);
  if(!response.ok) throw new Error(data?.message || data?.details || data?.hint || data?.error || `Falha na API (${response.status}).`);
  return data;
 },[token]);

 const loadRows = useCallback(async (key=active) => {
  if(!token) return;
  const resource=resources.find(r=>r.key===key); if(!resource) return;
  setLoading(true);setError("");
  try { const data=await api(`${resource.key}?select=*&order=${resource.order}.asc&limit=250`);setRows(current=>({...current,[key]:data||[]})); }
  catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar os registros.");}
  finally{setLoading(false);}
 },[active,api,token]);

 useEffect(()=>{
  let alive=true;
  (async()=>{
   try{
    if(!env.url||!env.key) throw new Error("As variáveis públicas do Supabase não estão configuradas.");
    const saved=localStorage.getItem("kotoba-session");if(!saved) throw new Error("Entre na plataforma com sua conta de administrador e depois abra /admin.");
    const session=JSON.parse(saved);if(!session.access_token) throw new Error("Sessão inválida. Entre novamente.");
    const response=await fetch(`${env.url}/auth/v1/user`,{headers:{apikey:env.key,Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
    const user=await response.json().catch(()=>null);if(!response.ok) throw new Error("Sua sessão expirou. Entre novamente.");
    if(user?.app_metadata?.role!=="admin") throw new Error("Sua conta não possui app_metadata.role = admin. Peça a atribuição do papel no Supabase Auth.");
    if(alive){setToken(session.access_token);setAdminName(user.email||"Administrador");setAuthorized(true);}
   }catch(e){if(alive)setError(e instanceof Error?e.message:"Não foi possível validar o acesso.");}
   finally{if(alive)setChecking(false);}
  })();
  return()=>{alive=false;};
 },[]);

 useEffect(()=>{if(authorized)loadRows(active);},[authorized,active,loadRows]);

 useEffect(()=>{
  if(!authorized)return;
  const keys=["languages","characters","courses","units","lessons"];
  let alive=true;
  Promise.all(keys.map(async key=>{
   const item=resources.find(r=>r.key===key)!;
   const data=await api(`${key}?select=*&order=${item.order}.asc&limit=250`);
   return [key,(data||[])] as const;
  })).then(entries=>{if(alive)setRows(current=>({...current,...Object.fromEntries(entries)}));})
    .catch(e=>{if(alive)setError(e instanceof Error?e.message:"Não foi possível carregar as opções de relacionamento.");});
  return()=>{alive=false;};
 },[authorized,api]);

 const resource=resources.find(r=>r.key===active)!;
 const currentRows=rows[active]||[];
 const filtered=currentRows.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

 function startCreate(){
  const base={...(defaults[active]||{})};
  if(active==="units" && rows.courses?.[0])base.course_id=rows.courses[0].id||"";
  if(active==="lessons" && rows.units?.[0])base.unit_id=rows.units[0].id||"";
  if(active==="lesson_questions" && rows.lessons?.[0])base.lesson_id=rows.lessons[0].id||"";
  setEditing(null);setValues(base);setShowForm(true);setNotice("");
 }
 function startEdit(row:Row){setEditing(row);setValues({...row});setShowForm(true);setNotice("");}
 function changeField(field:Field,value:unknown){setValues(current=>({...current,[field.key]:value}));}

 async function saveRecord(){
  setSaving(true);setError("");setNotice("");
  try{
   const payload:Row={};
   for(const field of resource.fields){
    let value=values[field.key];
    if(field.type==="number"){value=value===""||value==null?0:Number(value);if(!Number.isFinite(value))throw new Error(`Valor inválido em ${field.label}.`);}
    else if(field.type==="json" && typeof value==="string"){try{value=JSON.parse(value);}catch{throw new Error(`${field.label} precisa ser um JSON válido.`);}}
    else if(field.type==="boolean")value=Boolean(value);
    else if(typeof value==="string" && value.trim()==="" && !field.required)value=null;
    if(field.required && (value==null || value===""))throw new Error(`Preencha o campo ${field.label}.`);
    if(value!==undefined)payload[field.key]=value;
   }
   if(editing){
    const id=editing.id??editing.code;
    if(!id)throw new Error("Não foi possível identificar o registro para edição.");
    const pk=active==="languages"?"code":"id";
    await api(`${active}?${pk}=eq.${encodeURIComponent(String(id))}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
    setNotice("Alterações salvas.");
   }else{
    await api(active,{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
    setNotice(`${resource.singular.charAt(0).toUpperCase()+resource.singular.slice(1)} criado(a) com sucesso.`);
   }
   setShowForm(false);setEditing(null);await loadRows(active);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar.");}
  finally{setSaving(false);}
 }

 async function deleteRecord(row:Row){
  const id=row.id??row.code;if(!id)return;
  if(!window.confirm(`Excluir "${rowLabel(row)}"? Esta ação pode ser bloqueada se houver conteúdo dependente.`))return;
  const pk=active==="languages"?"code":"id";
  setSaving(true);setError("");setNotice("");
  try{await api(`${active}?${pk}=eq.${encodeURIComponent(String(id))}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});setNotice("Registro excluído.");await loadRows(active);}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível excluir. Verifique dependências.");}
  finally{setSaving(false);}
 }

 if(checking)return <main className="kq-admin-shell"><div className="kq-admin-center"><LoaderCircle className="spin"/><p>Verificando credenciais administrativas…</p></div></main>;
 if(!authorized)return <main className="kq-admin-shell"><div className="kq-admin-gate"><ShieldCheck size={38}/><h1>Área restrita</h1><p>{error}</p><Link href="/">Voltar ao Kotoba Quest</Link></div></main>;

 return <main className="kq-admin-shell">
  <header className="kq-admin-header"><Link className="kq-admin-back" href="/"><ArrowLeft size={17}/> Voltar à plataforma</Link><div className="kq-admin-brand"><span className="kq-admin-mark">KQ</span><div><b>KOTOBA QUEST</b><small>ADMIN STUDIO</small></div></div><div className="kq-admin-user"><ShieldCheck size={16}/> {adminName}</div></header>
  <section className="kq-admin-hero"><div><span className="kq-admin-eyebrow">CENTRAL DE CONTROLE</span><h1>Admin Studio</h1><p>Gerencie cursos, unidades, lições, questões, tutores e a gamificação em um só lugar.</p></div><div className="kq-admin-secure"><ShieldCheck size={18}/><span>Acesso validado pelo Supabase Auth<br/><small>app_metadata.role = admin</small></span></div></section>
  <div className="kq-admin-layout">
   <aside className="kq-admin-sidebar"><span className="kq-admin-side-label">GERENCIAMENTO</span>{resources.map(item=><button key={item.key} className={active===item.key?"active":""} onClick={()=>{setActive(item.key);setShowForm(false);setQuery("");setError("");}}><span>{item.label}</span><small>{rows[item.key]?.length??"—"}</small></button>)}<div className="kq-admin-side-foot"><Database size={16}/> Dados protegidos por RLS</div></aside>
   <section className="kq-admin-content">
    <div className="kq-admin-content-head"><div><span className="kq-admin-eyebrow">BIBLIOTECA DE CONTEÚDO</span><h2>{resource.label}</h2><p>{resource.description}</p></div><button className="kq-admin-primary" onClick={startCreate}><Plus size={17}/> Novo {resource.singular}</button></div>
    <div className="kq-admin-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar em ${resource.label.toLowerCase()}…`}/></label><button onClick={()=>loadRows(active)} disabled={loading}><RefreshCw size={16} className={loading?"spin":""}/> Atualizar</button><span>{filtered.length} registro(s)</span></div>
    {notice&&<div className="kq-admin-notice"><Check size={16}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}
    {error&&<div className="kq-admin-error"><CircleAlert size={17}/>{error}</div>}
    {showForm&&<div className="kq-admin-editor"><div className="kq-admin-editor-head"><div><span className="kq-admin-eyebrow">{editing?"EDIÇÃO":"NOVO REGISTRO"}</span><h3>{editing?"Editar":"Criar"} {resource.singular}</h3></div><button className="kq-admin-icon-button" onClick={()=>setShowForm(false)}><X size={18}/></button></div><div className="kq-admin-fields">{resource.fields.map(field=><label key={field.key} className={field.type==="json"?"wide":""}><span>{field.label}{field.required?" *":""}</span>{field.relation?<select value={asText(values[field.key])} onChange={e=>changeField(field,e.target.value)}><option value="">{field.required?"Selecione…":"Não vinculado"}</option>{(rows[field.relation]||[]).map(option=>{const optionId=String(option.id??option.code??"");return <option key={optionId} value={optionId}>{rowLabel(option)}{option.native_name?` · ${String(option.native_name)}`:""}</option>;})}</select>:field.type==="boolean"?<span className="kq-admin-toggle"><input type="checkbox" checked={Boolean(values[field.key])} onChange={e=>changeField(field,e.target.checked)}/> {values[field.key]?"Ativo":"Inativo"}</span>:field.type==="json"?<textarea rows={4} value={asText(values[field.key])} onChange={e=>changeField(field,e.target.value)} placeholder={field.placeholder||"[]"} />:<input type={field.type==="number"?"number":"text"} value={asText(values[field.key])} onChange={e=>changeField(field,field.type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)} placeholder={field.placeholder||""}/>}{field.help&&<small>{field.help}</small>}</label>)}</div><div className="kq-admin-editor-actions"><button className="kq-admin-secondary" onClick={()=>setShowForm(false)}>Cancelar</button><button className="kq-admin-primary" onClick={saveRecord} disabled={saving}><Save size={16}/>{saving?"Salvando…":"Salvar registro"}</button></div></div>}
    {loading?<div className="kq-admin-empty"><LoaderCircle className="spin"/> Carregando registros…</div>:filtered.length===0?<div className="kq-admin-empty"><BookOpen size={30}/><b>Nenhum registro encontrado</b><span>Crie o primeiro item ou ajuste sua busca.</span></div>:<div className="kq-admin-table-wrap"><table className="kq-admin-table"><thead><tr><th>Registro</th><th>Identificador</th><th>Detalhes</th><th>Ações</th></tr></thead><tbody>{filtered.map((row,index)=><tr key={String(row.id??row.code??index)}><td><b>{rowLabel(row)}</b><small>{String(row.description||row.bio||row.prompt_translation||"")}</small></td><td><code>{String(row.id??row.code??"—").slice(0,14)}</code></td><td><span className="kq-admin-pill">{row.is_published===true?"Publicado":row.is_published===false?"Rascunho":resource.singular}</span>{row.sort_order!=null&&<small>Ordem {String(row.sort_order)}</small>}</td><td><div className="kq-admin-row-actions"><button onClick={()=>startEdit(row)} aria-label="Editar"><Save size={15}/> Editar</button><button className="danger" onClick={()=>deleteRecord(row)} aria-label="Excluir" disabled={saving}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
   </section>
  </div>
  <footer className="kq-admin-footer"><Languages size={15}/> Kotoba Quest Admin Studio · Nenhuma operação usa chave service_role no navegador.</footer>
 </main>;
}
