(() => {
  'use strict';

  const APP_VERSION = '2.0.0';
  const STORAGE_KEY = 'shape-data-v1';
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const meals = [
    { id:'breakfast', name:'Café da manhã', kcal:'~600–650 kcal', protein:'40–45 g proteína', items:[['Pão francês','2 un.'],['Ovos inteiros','2 un.'],['Whey','30 g'],['Banana','1 un.']] },
    { id:'lunch', name:'Almoço', kcal:'~750–800 kcal', protein:'55–65 g proteína', items:[['Arroz cozido','250 g'],['Feijão cozido','150 g'],['Frango/carne magra','180 g'],['Salada/legumes','à vontade'],['Azeite','5 g']] },
    { id:'snack', name:'Lanche', kcal:'~450–500 kcal', protein:'30–35 g proteína', items:[['Iogurte natural/zero','170 g'],['Whey','30 g'],['Aveia','40 g'],['Banana','1 un.'],['Pão de forma','2 fatias']] },
    { id:'dinner', name:'Jantar', kcal:'~700–750 kcal', protein:'55–60 g proteína', items:[['Arroz cozido','250 g'],['Feijão','150 g'],['Frango/carne magra','180 g'],['Salada/legumes','à vontade']] },
    { id:'extra', name:'Ceia / extra', kcal:'~200–300 kcal', protein:'10–20 g proteína', items:[['Pão francês','1 un.'],['Queijo magro ou iogurte','1 porção'],['ou fruta + aveia','1 porção']] }
  ];

  const workouts = {
    upperA: { id:'upperA', short:'Superior A', title:'Superior A — força', subtitle:'Peito + costas + ombros + braços', duration:'55–65 min', exercises:[
      ['bench','Supino reto','4 × 5–8'],['row','Remada curvada/máquina','4 × 6–10'],['incline','Supino inclinado','3 × 6–10'],['pulldown','Puxada alta','3 × 6–10'],['lateral','Elevação lateral','4 × 10–15'],['curl','Rosca bíceps','3 × 8–12'],['triceps','Tríceps na polia','3 × 8–12']
    ]},
    legs: { id:'legs', short:'Perna', title:'Perna — manutenção forte', subtitle:'Pouco volume, carga de verdade + abdômen', duration:'40–50 min', exercises:[
      ['hack','Hack squat ou Leg Press','3 × 6–10'],['rdl','Stiff / RDL','3 × 6–10'],['curl','Mesa flexora','3 × 8–12'],['calf','Panturrilha','3 × 10–15'],['cableabs','Abdominal na polia','3 × 10–15'],['legraise','Elevação de pernas','2 × 10–15']
    ]},
    upperB: { id:'upperB', short:'Superior B', title:'Superior B — hipertrofia', subtitle:'Peito superior + costas + deltoides', duration:'55–65 min', exercises:[
      ['incline','Supino inclinado máquina/halter','4 × 6–10'],['pull','Barra fixa ou puxada','4 × 6–10'],['ohp','Desenvolvimento','3 × 6–10'],['lowrow','Remada baixa','3 × 8–12'],['fly','Crucifixo / crossover','3 × 10–15'],['lateral','Elevação lateral','4 × 12–20'],['curl','Rosca bíceps','3 × 8–12'],['triceps','Tríceps francês/polia','3 × 8–12']
    ]},
    upperC: { id:'upperC', short:'Superior C', title:'Superior C — ombro e braços', subtitle:'Acabamento com volume onde dá mais retorno visual', duration:'50–60 min', exercises:[
      ['press','Supino máquina ou paralelas','3 × 8–12'],['neutralpull','Puxada neutra','3 × 8–12'],['machineRow','Remada máquina','3 × 8–12'],['lateral','Elevação lateral','5 × 12–20'],['rear','Crucifixo inverso / posterior de ombro','3 × 12–20'],['curl','Rosca bíceps','4 × 8–12'],['triceps','Tríceps polia/francês','4 × 8–12']
    ]}
  };

  const weeklyPlan = {
    0:{ type:'rest', label:'Descanso', cardio:null },
    1:{ type:'workout', workout:'upperA', label:'Superior A — força', cardio:'20–25 min leve após o treino (opcional)' },
    2:{ type:'workout', workout:'legs', label:'Perna — manutenção forte', cardio:null },
    3:{ type:'cardio', label:'Recuperação ativa', cardio:'25–30 min leve/moderado — sem musculação' },
    4:{ type:'workout', workout:'upperB', label:'Superior B — hipertrofia', cardio:null },
    5:{ type:'workout', workout:'upperC', label:'Superior C — ombro e braços', cardio:'20–25 min leve após o treino (opcional)' },
    6:{ type:'rest', label:'Livre / caminhada', cardio:null }
  };

  const defaults = () => ({ version:2, phase:'recomp', daily:{}, measurements:[], settings:{ targetWeight:92, calorieTarget:'2800–3000', proteinTarget:'180–200', weeklyGain:'0,1–0,25 kg/sem' } });
  let data = loadData();
  let route = 'today';
  let selectedWorkout = getTodayPlan().workout || 'upperA';
  let deferredInstallPrompt = null;

  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const installBtn = document.getElementById('installBtn');

  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const d = { ...defaults(), ...parsed, daily:parsed.daily||{}, measurements:Array.isArray(parsed.measurements)?parsed.measurements:[] };
      d.settings = { ...defaults().settings, ...(parsed.settings||{}) };
      if (!parsed.phase || parsed.phase === 'cut') {
        d.phase='recomp'; d.version=2;
        d.settings = { ...d.settings, targetWeight:92, calorieTarget:'2800–3000', proteinTarget:'180–200', weeklyGain:'0,1–0,25 kg/sem' };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      return d;
    }catch(e){ console.warn(e); return defaults(); }
  }
  function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function dateKey(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function fromKey(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); }
  function getDay(k=dateKey()){ if(!data.daily[k]) data.daily[k]={meals:{},workoutDone:false,cardioDone:false,exercises:{},hunger:null,binge:null}; return data.daily[k]; }
  function getTodayPlan(){ return weeklyPlan[new Date().getDay()]; }
  function planForKey(k){ return weeklyPlan[fromKey(k).getDay()]; }
  function requiredTasks(k=dateKey()){
    const day=data.daily[k]||{meals:{}}; const p=planForKey(k); const t=meals.map(m=>Boolean(day.meals?.[m.id]));
    if(p.type==='workout') t.push(Boolean(day.workoutDone));
    if(p.cardio && !p.cardio.includes('opcional')) t.push(Boolean(day.cardioDone));
    return t;
  }
  function score(k=dateKey()){ const t=requiredTasks(k); return t.length?Math.round(t.filter(Boolean).length/t.length*100):0; }
  function adherence(){ let a=0,b=0; for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const t=requiredTasks(dateKey(d));a+=t.filter(Boolean).length;b+=t.length;}return b?Math.round(a/b*100):0; }
  function streak(){ let n=0; for(let i=0;i<120;i++){const d=new Date();d.setDate(d.getDate()-i);const s=score(dateKey(d));if(s>=80)n++;else if(i===0)continue;else break;}return n; }
  function latest(){ return [...data.measurements].sort((a,b)=>b.date.localeCompare(a.date))[0]||null; }
  function previous(){ return [...data.measurements].sort((a,b)=>b.date.localeCompare(a.date))[1]||null; }
  function fmt(v,s=''){ return v===null||v===undefined||v===''?'—':`${String(v).replace('.',',')}${s}`; }
  function esc(s){ return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function todayLabel(){ return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'short'}).format(new Date()); }

  function render(){ document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===route)); if(route==='today')renderToday(); if(route==='workout')renderWorkout(); if(route==='diet')renderDiet(); if(route==='progress')renderProgress(); }
  function taskRow({done,label,meta,action,checkAction}){ return `<div class="check-row ${done?'done':''}" data-action="${esc(action)}"><button type="button" class="check-circle" data-action="${esc(checkAction)}">${done?'✓':''}</button><div class="check-copy"><span class="check-label">${esc(label)}</span><span class="check-meta">${esc(meta)}</span></div><span class="chevron">›</span></div>`; }

  function renderToday(){
    const day=getDay(), p=getTodayPlan(), s=score(), m=latest(), tasks=[];
    if(p.type==='workout') tasks.push(taskRow({done:day.workoutDone,label:`Treino — ${workouts[p.workout].title}`,meta:workouts[p.workout].duration,action:`open-workout:${p.workout}`,checkAction:'toggle-workout'}));
    else if(p.type==='cardio') tasks.push(taskRow({done:day.cardioDone,label:'Somente cardio — sem musculação',meta:p.cardio,action:'toggle-cardio',checkAction:'toggle-cardio'}));
    else tasks.push(`<div class="note">Hoje é dia de <b>${esc(p.label)}</b>. Recuperar faz parte do crescimento.</div>`);
    if(p.cardio&&p.type==='workout') tasks.push(taskRow({done:day.cardioDone,label:'Cardio opcional',meta:p.cardio,action:'toggle-cardio',checkAction:'toggle-cardio'}));
    const mealRows=meals.map(x=>taskRow({done:Boolean(day.meals[x.id]),label:x.name,meta:`${x.kcal} · ${x.protein}`,action:`meal:${x.id}`,checkAction:`toggle-meal:${x.id}`})).join('');
    app.innerHTML=`<section class="hero-card"><div class="hero-row"><div><p class="eyebrow">${esc(todayLabel().toUpperCase())}</p><h2>${esc(p.label)}</h2><p class="hero-sub">Fase: ganho limpo / recomposição · crescer mantendo a cintura sob controle.</p></div><div class="score-ring" style="--p:${s}"><span class="score-value">${s}%</span></div></div><div class="hero-stats"><div class="mini-stat"><b>${fmt(m?.weight,' kg')}</b><span>Peso</span></div><div class="mini-stat"><b>${adherence()}%</b><span>7 dias</span></div><div class="mini-stat"><b>${streak()} d</b><span>Sequência</span></div></div></section>
    <section class="section"><div class="section-head"><h3>Plano de hoje</h3><p>progressão primeiro</p></div><div class="card">${tasks.join('')}</div>${p.type==='cardio'?'<div class="note" style="margin-top:10px"><b>Quarta:</b> 25–30 min leves. Caminhada, bicicleta ou elíptico. Sem HIIT e sem musculação — chegar recuperado na quinta é prioridade.</div>':''}</section>
    <section class="section"><div class="section-head"><h3>Refeições</h3><button class="text-button" data-action="go-diet">ver dieta</button></div><div class="card">${mealRows}</div></section>
    <section class="section"><div class="note"><b>Meta da fase:</b> subir muito devagar, cerca de ${esc(data.settings.weeklyGain)}. Se cintura subir rápido e carga não evoluir, não é ganho limpo — ajuste calorias.</div></section>`;
  }

  function renderWorkout(){
    const w=workouts[selectedWorkout], day=getDay(), log=day.exercises[w.id]||{}, done=w.exercises.filter(([id])=>log[id]?.done).length, prog=Math.round(done/w.exercises.length*100);
    const chips=Object.values(workouts).map(x=>`<button class="badge" type="button" data-action="select-workout:${x.id}" style="${x.id===w.id?'background:var(--accent);color:#0a0e08;':''}">${esc(x.short)}</button>`).join(' ');
    const ex=w.exercises.map(([id,name,target])=>{const item=log[id]||{};return `<div class="exercise"><div class="exercise-main"><button class="check-circle" type="button" data-action="toggle-exercise:${w.id}:${id}" style="${item.done?'background:var(--accent);border-color:var(--accent);':''}">${item.done?'✓':''}</button><div class="exercise-name">${esc(name)}<span class="exercise-target">${esc(target)}</span></div></div><div class="exercise-inputs"><label><span class="field-label">Carga usada</span><input class="field exercise-field" placeholder="ex: 80 kg" value="${esc(item.load||'')}" data-workout="${w.id}" data-exercise="${id}" data-field="load"></label><label><span class="field-label">Reps feitas</span><input class="field exercise-field" placeholder="ex: 8/8/7" value="${esc(item.reps||'')}" data-workout="${w.id}" data-exercise="${id}" data-field="reps"></label></div></div>`}).join('');
    app.innerHTML=`<section class="card"><div style="display:flex;gap:6px;overflow:auto">${chips}</div></section><section class="section card"><div class="workout-title"><div><p class="eyebrow">GANHO LIMPO / RECOMPOSIÇÃO</p><h2>${esc(w.title)}</h2><p class="hero-sub">${esc(w.subtitle)} · ${esc(w.duration)}</p></div><span class="badge">${prog}%</span></div><div style="margin-top:18px">${ex}</div><button class="primary-button" type="button" data-action="finish-workout:${w.id}" style="margin-top:12px">Concluir treino</button></section><section class="section"><div class="note"><b>Regra de progressão:</b> use 1–2 repetições em reserva na maior parte das séries. Quando atingir o topo da faixa em todas as séries com execução boa, aumente a carga na próxima sessão. O objetivo agora é ficar mais forte ao longo das semanas.</div></section>`;
  }

  function renderDiet(){
    const day=getDay(); const cards=meals.map(m=>`<article class="meal-card"><div class="meal-head"><button class="check-circle" type="button" data-action="toggle-meal:${m.id}" style="${day.meals[m.id]?'background:var(--accent);border-color:var(--accent);':''}">${day.meals[m.id]?'✓':''}</button><div class="meal-copy"><h3>${esc(m.name)}</h3><p>${esc(m.kcal)} · ${esc(m.protein)}</p></div></div><div class="meal-items">${m.items.map(([n,a])=>`<div><span>${esc(n)}</span><b>${esc(a)}</b></div>`).join('')}</div></article>`).join('');
    app.innerHTML=`<section class="hero-card"><p class="eyebrow">GANHO LIMPO / RECOMPOSIÇÃO</p><h2>${esc(data.settings.calorieTarget)} kcal</h2><p class="hero-sub">Ponto de partida, não número sagrado. Proteína: ${esc(data.settings.proteinTarget)} g/dia.</p><div class="hero-stats"><div class="mini-stat"><b>5</b><span>Refeições</span></div><div class="mini-stat"><b>${esc(data.settings.weeklyGain)}</b><span>Ganho alvo</span></div><div class="mini-stat"><b>2–3x</b><span>Cardio leve</span></div></div></section><section class="section">${cards}</section><section class="section meal-card free-calorie"><div class="meal-head"><div class="check-circle">+</div><div class="meal-copy"><h3>Flexibilidade</h3><p>Você não precisa comer “limpo” 100% do tempo. Mantenha a maior parte da dieta previsível e encaixe algo que gosta dentro das calorias, sem transformar isso em refeição livre sem limite.</p></div></div></section><section class="section card"><div class="section-head"><h3>Check-in de fome</h3><p>para evitar extremos</p></div><label><span class="field-label">Fome/vontade de comer hoje — 1 baixa, 5 muito forte</span><select id="hungerSelect" class="field"><option value="">Não informado</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(day.hunger)===n?'selected':''}>${n}</option>`).join('')}</select></label><div style="margin-top:12px"><span class="field-label">Houve perda de controle/compulsão?</span><div class="button-row"><button class="secondary-button" type="button" data-action="set-binge:no">Não</button><button class="secondary-button" type="button" data-action="set-binge:yes">Sim</button></div></div></section><section class="section"><div class="note warning-note"><b>Importante:</b> ganho limpo não é desculpa para comer até perder o controle. Se um episódio acontecer, não compense com jejum ou cardio; volte à rotina normal na próxima refeição.</div></section>`;
  }

  function deltaText(d,u){ if(d===null||Number.isNaN(d))return 'sem comparação'; if(d===0)return 'sem mudança'; return `${d>0?'+':''}${d.toFixed(1).replace('.',',')} ${u} vs. anterior`; }
  function renderProgress(){
    const l=latest(), p=previous(); const wd=l&&p&&l.weight&&p.weight?Number(l.weight)-Number(p.weight):null; const cd=l&&p&&l.waist&&p.waist?Number(l.waist)-Number(p.waist):null; const sorted=[...data.measurements].sort((a,b)=>b.date.localeCompare(a.date));
    app.innerHTML=`<section class="hero-card"><div class="hero-row"><div><p class="eyebrow">RECOMPOSIÇÃO</p><h2>${fmt(l?.weight,' kg')}</h2><p class="hero-sub">Peso é só um marcador. Prioridade: carga subindo e cintura estável.</p></div><button class="primary-button" type="button" data-action="add-measurement" style="width:auto">+ Medida</button></div></section><section class="section progress-grid"><div class="stat-card"><span class="label">Cintura</span><div class="number">${fmt(l?.waist,' cm')}</div><div class="delta">${deltaText(cd,'cm')}</div></div><div class="stat-card"><span class="label">BF estimado</span><div class="number">${fmt(l?.bf,'%')}</div><div class="delta">opcional</div></div><div class="stat-card"><span class="label">Aderência</span><div class="number">${adherence()}%</div><div class="delta">últimos 7 dias</div></div><div class="stat-card"><span class="label">Peso</span><div class="number">${fmt(l?.weight,' kg')}</div><div class="delta">${deltaText(wd,'kg')}</div></div></section><section class="section card"><div class="section-head"><h3>Evolução do peso</h3><p>tendência, não obsessão</p></div>${weightChart()}</section><section class="section card"><div class="section-head"><h3>Histórico</h3><p>${sorted.length} registros</p></div><div class="entries">${sorted.length?sorted.slice(0,12).map(entry).join(''):'<div class="empty-state">Adicione peso e cintura para acompanhar a recomposição.</div>'}</div></section><section class="section"><div class="note"><b>Como ajustar as calorias:</b> se por 2–3 semanas o peso não subir, a cintura ficar estável e a força também não evoluir, aumente 100–150 kcal. Se estiver ganhando mais de ~0,25 kg/semana por várias semanas e a cintura acelerar, reduza 100–150 kcal.</div></section><section class="section card"><div class="section-head"><h3>Dados do aplicativo</h3><p>v${APP_VERSION}</p></div><div class="button-row"><button class="secondary-button" type="button" data-action="export-data">Exportar backup</button><button class="secondary-button" type="button" data-action="import-data">Importar backup</button></div><input id="importFile" type="file" accept="application/json,.json" hidden></section>`;
  }
  function entry(i){const d=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(fromKey(i.date));return `<div class="entry"><div><b>${esc(d)}</b><span>${i.note?`<br>${esc(i.note)}`:''}</span></div><div class="entry-values"><strong>${fmt(i.weight,' kg')}</strong><span>${fmt(i.waist,' cm')} · ${fmt(i.bf,'% BF')}</span></div></div>`;}
  function weightChart(){const pts=[...data.measurements].filter(x=>Number(x.weight)>0).sort((a,b)=>a.date.localeCompare(b.date)).slice(-8);if(pts.length<2)return '<div class="empty-state">Com dois registros, o gráfico aparece aqui.</div>';const vals=pts.map(x=>Number(x.weight)),min=Math.min(...vals),max=Math.max(...vals),span=Math.max(max-min,1);return `<div class="chart">${pts.map(x=>{const h=25+((Number(x.weight)-min)/span)*70;const d=fromKey(x.date);return `<div class="chart-col"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${h}%"></div></div><span class="chart-label">${d.getDate()}/${d.getMonth()+1}</span></div>`}).join('')}</div>`;}

  function openMeal(id){const m=meals.find(x=>x.id===id);if(!m)return;modalTitle.textContent=m.name;modalBody.innerHTML=`<div class="meal-items" style="padding:0">${m.items.map(([n,a])=>`<div><span>${esc(n)}</span><b>${esc(a)}</b></div>`).join('')}</div><div class="note" style="margin-top:12px">${esc(m.kcal)} · ${esc(m.protein)}.</div>`;modal.showModal();}
  function openMeasurement(){modalTitle.textContent='Nova medida';modalBody.innerHTML=`<div class="form-grid"><label><span class="field-label">Data</span><input id="mDate" class="field" type="date" value="${dateKey()}"></label><label><span class="field-label">Peso (kg)</span><input id="mWeight" class="field" type="number" step="0.1"></label><label><span class="field-label">Cintura (cm)</span><input id="mWaist" class="field" type="number" step="0.1"></label><label><span class="field-label">BF (%) opcional</span><input id="mBf" class="field" type="number" step="0.1"></label><label><span class="field-label">Observação</span><input id="mNote" class="field" maxlength="90"></label><button class="primary-button" type="button" data-action="save-measurement">Salvar</button></div>`;modal.showModal();}
  function saveMeasurement(){const date=document.getElementById('mDate')?.value;const weight=parseFloat(document.getElementById('mWeight')?.value),waist=parseFloat(document.getElementById('mWaist')?.value),bf=parseFloat(document.getElementById('mBf')?.value),note=document.getElementById('mNote')?.value.trim();if(!date||(!weight&&!waist&&!bf)){toast('Informe pelo menos uma medida.');return;}data.measurements=data.measurements.filter(x=>x.date!==date);data.measurements.push({date,weight:Number.isFinite(weight)?+weight.toFixed(1):null,waist:Number.isFinite(waist)?+waist.toFixed(1):null,bf:Number.isFinite(bf)?+bf.toFixed(1):null,note:note||''});saveData();modal.close();toast('Medida salva ✓');renderProgress();}
  function toggleMeal(id){const d=getDay();d.meals[id]=!d.meals[id];saveData();render();}
  function toggleExercise(w,id){const d=getDay();d.exercises[w]||={};d.exercises[w][id]||={};d.exercises[w][id].done=!d.exercises[w][id].done;saveData();renderWorkout();}
  function finishWorkout(id){const d=getDay(),w=workouts[id];d.exercises[id]||={};w.exercises.forEach(([x])=>{d.exercises[id][x]||={};d.exercises[id][x].done=true;});if(getTodayPlan().workout===id)d.workoutDone=true;saveData();toast('Treino concluído ✓');renderWorkout();}
  function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}
  function exportData(){const blob=new Blob([JSON.stringify({app:'Shape',appVersion:APP_VERSION,data},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`shape-backup-${dateKey()}.json`;a.click();URL.revokeObjectURL(u);}
  function importData(file){const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result),i=p.data||p;if(!i.daily)throw 0;data={...defaults(),...i,daily:i.daily||{},measurements:Array.isArray(i.measurements)?i.measurements:[],phase:'recomp',settings:{...defaults().settings,...(i.settings||{})}};saveData();toast('Backup restaurado ✓');render();}catch{toast('Backup inválido');}};r.readAsText(file);}

  document.addEventListener('click',e=>{const t=e.target.closest('[data-action]');if(!t)return;e.preventDefault();e.stopPropagation();const [a,b,c]=t.dataset.action.split(':');if(a==='toggle-meal')toggleMeal(b);else if(a==='meal')openMeal(b);else if(a==='toggle-workout'){const d=getDay();d.workoutDone=!d.workoutDone;saveData();render();}else if(a==='toggle-cardio'){const d=getDay();d.cardioDone=!d.cardioDone;saveData();render();}else if(a==='open-workout'){selectedWorkout=b;route='workout';render();}else if(a==='go-diet'){route='diet';render();}else if(a==='select-workout'){selectedWorkout=b;renderWorkout();}else if(a==='toggle-exercise')toggleExercise(b,c);else if(a==='finish-workout')finishWorkout(b);else if(a==='add-measurement')openMeasurement();else if(a==='save-measurement')saveMeasurement();else if(a==='set-binge'){const d=getDay();d.binge=b==='yes';saveData();renderDiet();}else if(a==='export-data')exportData();else if(a==='import-data')document.getElementById('importFile')?.click();});
  document.addEventListener('input',e=>{if(e.target.classList.contains('exercise-field')){const {workout,exercise,field}=e.target.dataset,d=getDay();d.exercises[workout]||={};d.exercises[workout][exercise]||={};d.exercises[workout][exercise][field]=e.target.value;saveData();}});
  document.addEventListener('change',e=>{if(e.target.id==='hungerSelect'){const d=getDay();d.hunger=e.target.value?Number(e.target.value):null;saveData();}if(e.target.id==='importFile'&&e.target.files?.[0])importData(e.target.files[0]);});
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{route=b.dataset.route;render();window.scrollTo({top:0,behavior:'smooth'});}));

  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;if(!standalone)installBtn.hidden=false;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;installBtn.hidden=false;});
  installBtn.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installBtn.hidden=true;}else{modalTitle.textContent='Instalar no celular';modalBody.innerHTML='<div class="note">Android/Chrome: menu ⋮ → Instalar aplicativo. iPhone: Compartilhar → Adicionar à Tela de Início.</div>';modal.showModal();}});
  if('serviceWorker'in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});navigator.serviceWorker.register('./sw.js?v=2.0.0').then(r=>r.update()).catch(console.warn);}
  render();
})();
