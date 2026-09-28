(() => {
  'use strict';

  const VERSION = '2.4.0';
  const STORAGE_KEY = 'shape-data-v1';
  const START = new Date(2026, 8, 28);
  const END = new Date(2026, 9, 11, 23, 59, 59, 999);
  const RETURN_DATE = '12/10';
  const app = document.getElementById('app');

  const cardioPlan = [
    { title:'Esteira inclinada', detail:'40–50 min · 5–6,5 km/h · inclinação 5–10%', note:'Ritmo moderado: suando e respirando mais forte, mas ainda conseguindo conversar.' },
    { title:'Bike ou elíptico', detail:'35–45 min · leve/moderado', note:'Sem sprint. A meta é gastar calorias sem aumentar a fadiga muscular.' },
    { title:'Caminhada leve', detail:'45–60 min', note:'Pode ser na rua ou esteira. Dia para soltar a musculatura.' },
    { title:'Esteira inclinada', detail:'40–50 min · 5–6,5 km/h · inclinação 5–10%', note:'Se panturrilha, joelho ou lombar incomodarem, reduza a inclinação.' },
    { title:'Bike ou elíptico', detail:'35–45 min · leve/moderado', note:'Cardio contínuo. Nada de HIIT nessas duas semanas.' },
    { title:'Caminhada', detail:'40–60 min · confortável', note:'Pode dividir em duas caminhadas se preferir.' },
    { title:'Recuperação', detail:'Descanso total ou caminhada bem leve 20–30 min', note:'Dormir e recuperar também fazem parte do plano.' }
  ];

  const miniPlan = [
    { focus:'Peito + bíceps', exercises:[['bench','Supino reto','2 × 5–8'],['curlbar','Rosca direta barra W','2 × 6–10']] },
    { focus:'Costas + tríceps', exercises:[['pulldown','Puxada alta','2 × 6–10'],['overtri','Tríceps francês / acima da cabeça','2 × 8–12']] },
    { focus:'Ombros', exercises:[['ohp','Desenvolvimento máquina/halter','2 × 6–10'],['lateral','Elevação lateral','2 × 10–15']] },
    { focus:'Peito + costas', exercises:[['incline','Supino inclinado','2 × 6–10'],['row','Remada máquina/baixa','2 × 6–10']] },
    { focus:'Braços', exercises:[['scott','Rosca Scott','2 × 8–12'],['pushdown','Tríceps na polia','2 × 8–12']] },
    { focus:'Pernas', exercises:[['legpress','Leg Press','2 × 6–10'],['legcurl','Mesa flexora','2 × 8–12']] },
    { focus:'Recuperação ativa', exercises:[['calf','Panturrilha','2 × 10–15'],['abs','Abdominal na polia','2 × 10–15']] }
  ];

  const cutMeals = [
    { id:'breakfast', name:'Café da manhã', kcal:'~500 kcal', protein:'40–45 g', items:[['Pão francês','1 un.'],['Ovos','2 un.'],['Whey','30 g'],['Banana','1 un.']] },
    { id:'lunch', name:'Almoço', kcal:'~700–750 kcal', protein:'55–60 g', items:[['Arroz cozido','200 g'],['Feijão','150 g'],['Frango/carne magra','180 g'],['Salada/legumes','à vontade'],['Azeite','5 g']] },
    { id:'snack', name:'Lanche', kcal:'~350–400 kcal', protein:'30–35 g', items:[['Iogurte natural/zero','170 g'],['Whey','30 g'],['Aveia','30 g'],['Banana ou maçã','1 un.']] },
    { id:'dinner', name:'Jantar', kcal:'~650–700 kcal', protein:'55–60 g', items:[['Arroz cozido','180 g'],['Feijão','150 g'],['Frango/carne magra','180 g'],['Salada/legumes','à vontade']] },
    { id:'extra', name:'Ceia', kcal:'~100–150 kcal', protein:'5–15 g', items:[['Fruta ou iogurte','1 porção']] }
  ];

  function midnight(date = new Date()) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function isActive() { const now = new Date(); return now >= START && now <= END; }
  function dayNumber() { return Math.max(1, Math.min(14, Math.floor((midnight() - midnight(START)) / 86400000) + 1)); }
  function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function phaseDate(index) { const d = new Date(START); d.setDate(d.getDate() + index); return d; }
  function formatDate(d) { return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(d); }
  function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function getData(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function ensureDay(data, key = dateKey()) {
    data.daily ||= {};
    data.daily[key] ||= { meals:{}, workoutDone:false, cardioDone:false, exercises:{}, hunger:null, binge:null };
    data.daily[key].miniActivation ||= {};
    return data.daily[key];
  }
  function todayDone(){ return Boolean(getData().daily?.[dateKey()]?.cardioDone); }
  function miniDone(id, key = dateKey()){ return Boolean(getData().daily?.[key]?.miniActivation?.[id]); }
  function mealDone(id){ return Boolean(getData().daily?.[dateKey()]?.meals?.[id]); }
  function currentPlan(){ return cardioPlan[(dayNumber()-1) % 7]; }
  function currentMiniPlan(){ return miniPlan[(dayNumber()-1) % 7]; }
  function currentRoute(){ return document.querySelector('.nav-item.active')?.dataset.route || 'today'; }

  function header(){
    const eyebrow = document.querySelector('.topbar .eyebrow');
    if (eyebrow) eyebrow.textContent = '14 DIAS · CARDIO + ATIVAÇÃO';
    document.title = 'Shape — Cardio & Ativação';
  }

  function miniRows(plan, key = dateKey(), interactive = true){
    return plan.exercises.map(([id,name,target]) => {
      const done = miniDone(id, key);
      return `<div class="check-row ${done ? 'done' : ''}" ${interactive ? `data-mini-toggle="${esc(id)}"` : ''}>
        <button type="button" class="check-circle" ${interactive ? `data-mini-toggle="${esc(id)}"` : ''} style="${done ? 'background:var(--accent);border-color:var(--accent);' : ''}">${done ? '✓' : ''}</button>
        <div class="check-copy"><span class="check-label">${esc(name)}</span><span class="check-meta">${esc(target)} · 1–2 reps em reserva</span></div>
      </div>`;
    }).join('');
  }

  function renderToday(){
    const n = dayNumber(), p = currentPlan(), mini = currentMiniPlan(), done = todayDone(), remaining = 14 - n;
    const miniCompleted = mini.exercises.filter(([id]) => miniDone(id)).length;
    const score = Math.round(((done ? 1 : 0) + miniCompleted) / 3 * 100);
    app.innerHTML = `
      <section class="hero-card" data-cardio-phase="today">
        <div class="hero-row">
          <div><p class="eyebrow">FASE TEMPORÁRIA</p><h2>Dia ${n}/14</h2><p class="hero-sub">Cardio em foco + estímulo curto e pesado para manter os músculos ativos.</p></div>
          <div class="score-ring" style="--p:${score}"><span class="score-value">${score}%</span></div>
        </div>
        <div class="hero-stats">
          <div class="mini-stat"><b>${remaining}</b><span>dias restantes</span></div>
          <div class="mini-stat"><b>2</b><span>exercícios hoje</span></div>
          <div class="mini-stat"><b>${RETURN_DATE}</b><span>volta ao treino</span></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><h3>Ativação de hoje</h3><p>${esc(mini.focus)}</p></div>
        <div class="card">${miniRows(mini)}</div>
        <div class="note" style="margin-top:10px"><b>Como treinar:</b> faça primeiro os pesos e depois o cardio. São só <b>2 séries de trabalho por exercício</b>, com carga boa e técnica limpa. Pare com <b>1–2 repetições sobrando</b>; nada de falha, dropset ou série extra.</div>
      </section>
      <section class="section">
        <div class="section-head"><h3>Cardio de hoje</h3><p>${formatDate(new Date())}</p></div>
        <div class="card">
          <div class="check-row ${done ? 'done' : ''}" data-action="toggle-cardio">
            <button type="button" class="check-circle" data-action="toggle-cardio">${done ? '✓' : ''}</button>
            <div class="check-copy"><span class="check-label">${esc(p.title)}</span><span class="check-meta">${esc(p.detail)}</span></div><span class="chevron">›</span>
          </div>
        </div>
        <div class="note" style="margin-top:10px"><b>Como fazer:</b> ${esc(p.note)}</div>
      </section>
      <section class="section"><div class="note"><b>Objetivo dessas duas semanas:</b> manter o sinal de força com baixíssimo volume, enquanto o cardio e a redução da fadiga continuam sendo prioridade. O bloco completo de braços + ombros volta em <b>${RETURN_DATE}</b>.</div></section>
      <section class="section"><div class="note warning-note"><b>Dieta temporária:</b> aproximadamente <b>2.400–2.600 kcal</b> e <b>180–200 g de proteína</b>. Déficit moderado, sem dieta de fome.</div></section>`;
  }

  function renderPlan(){
    const current = dayNumber();
    const rows = Array.from({length:14}, (_, i) => {
      const d = phaseDate(i), key = dateKey(d), p = cardioPlan[i % 7], mini = miniPlan[i % 7], data = getData();
      const cardioDone = Boolean(data.daily?.[key]?.cardioDone), miniCount = mini.exercises.filter(([id]) => Boolean(data.daily?.[key]?.miniActivation?.[id])).length, active = i+1 === current;
      return `<div class="check-row ${cardioDone && miniCount === 2 ? 'done' : ''}" style="${active ? 'border-left:3px solid var(--accent);' : ''}">
        <div class="check-circle" style="${cardioDone && miniCount === 2 ? 'background:var(--accent);border-color:var(--accent);' : ''}">${cardioDone && miniCount === 2 ? '✓' : i+1}</div>
        <div class="check-copy"><span class="check-label">Dia ${i+1} · ${formatDate(d)} — ${esc(mini.focus)}</span><span class="check-meta">${esc(mini.exercises[0][1])} + ${esc(mini.exercises[1][1])} · cardio: ${esc(p.title)} · ativação ${miniCount}/2</span></div>
      </div>`;
    }).join('');
    app.innerHTML = `<section class="hero-card" data-cardio-phase="plan"><p class="eyebrow">CARDIO + ATIVAÇÃO</p><h2>Plano completo · 14 dias</h2><p class="hero-sub">Dois exercícios curtos por dia para manter o estímulo muscular, sem roubar a recuperação.</p></section><section class="section card">${rows}</section><section class="section"><div class="note"><b>Regra:</b> 2 séries de trabalho por exercício, 1–2 repetições em reserva. A sessão de pesos deve caber em cerca de 15–20 min. Depois faça o cardio planejado.</div></section>`;
  }

  function renderDiet(){
    const cards = cutMeals.map(m => `<article class="meal-card"><div class="meal-head"><button type="button" class="check-circle" data-action="toggle-meal:${m.id}" style="${mealDone(m.id) ? 'background:var(--accent);border-color:var(--accent);' : ''}">${mealDone(m.id) ? '✓' : ''}</button><div class="meal-copy"><h3>${esc(m.name)}</h3><p>${esc(m.kcal)} · ${esc(m.protein)} proteína</p></div></div><div class="meal-items">${m.items.map(([n,a])=>`<div><span>${esc(n)}</span><b>${esc(a)}</b></div>`).join('')}</div></article>`).join('');
    app.innerHTML = `<section class="hero-card" data-cardio-phase="diet"><p class="eyebrow">14 DIAS · DÉFICIT MODERADO</p><h2>2.400–2.600 kcal</h2><p class="hero-sub">Proteína: 180–200 g/dia · simples, previsível e sem cortar tudo que você gosta.</p><div class="hero-stats"><div class="mini-stat"><b>5</b><span>refeições</span></div><div class="mini-stat"><b>180–200 g</b><span>proteína</span></div><div class="mini-stat"><b>14 dias</b><span>temporário</span></div></div></section><section class="section">${cards}</section><section class="section"><div class="note warning-note"><b>Se acontecer compulsão:</b> não tente compensar com jejum nem dobrando o cardio. Volte à refeição normal seguinte.</div></section>`;
  }

  function renderProgress(){
    const data = getData(), list = Array.isArray(data.measurements) ? [...data.measurements].sort((a,b)=>b.date.localeCompare(a.date)) : [], latest = list[0];
    const completedCardio = Array.from({length:14}, (_,i)=>Boolean(data.daily?.[dateKey(phaseDate(i))]?.cardioDone)).filter(Boolean).length;
    const miniCompleted = Array.from({length:14}, (_,i)=>miniPlan[i%7].exercises.every(([id])=>Boolean(data.daily?.[dateKey(phaseDate(i))]?.miniActivation?.[id]))).filter(Boolean).length;
    app.innerHTML = `<section class="hero-card" data-cardio-phase="progress"><div class="hero-row"><div><p class="eyebrow">RECUPERAÇÃO · DIA ${dayNumber()}/14</p><h2>${latest?.weight ? String(latest.weight).replace('.',',')+' kg' : 'Sem peso'}</h2><p class="hero-sub">Compare peso, cintura, aparência e disposição no início e no fim.</p></div><button type="button" class="primary-button" data-action="add-measurement" style="width:auto">+ Medida</button></div><div class="hero-stats"><div class="mini-stat"><b>${completedCardio}/14</b><span>cardios</span></div><div class="mini-stat"><b>${miniCompleted}/14</b><span>ativações</span></div><div class="mini-stat"><b>${RETURN_DATE}</b><span>retorno</span></div></div></section><section class="section"><div class="note"><b>O que observar:</b> aparência, cintura, disposição e recuperação. Parte da mudança visual pode vir de menos retenção/glicogênio e menos fadiga do treino pesado, não apenas de gordura perdida.</div></section><section class="section card"><div class="section-head"><h3>Últimas medidas</h3><p>v${VERSION}</p></div>${list.length ? list.slice(0,6).map(x=>`<div class="entry"><div><b>${esc(x.date)}</b></div><div class="entry-values"><strong>${x.weight ? esc(String(x.weight).replace('.',','))+' kg' : '—'}</strong><span>${x.waist ? esc(String(x.waist).replace('.',','))+' cm' : '—'}</span></div></div>`).join('') : '<div class="empty-state">Adicione peso e cintura para comparar o dia 1 com o dia 14.</div>'}</section>`;
  }

  let applying = false;
  function apply(){
    if (!isActive() || !app || applying) return;
    applying = true;
    header();
    const route = currentRoute();
    const marker = app.querySelector('[data-cardio-phase]')?.dataset.cardioPhase;
    const wanted = route === 'workout' ? 'plan' : route;
    if (marker !== wanted) {
      if (route === 'today') renderToday();
      else if (route === 'workout') renderPlan();
      else if (route === 'diet') renderDiet();
      else if (route === 'progress') renderProgress();
    }
    applying = false;
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-mini-toggle]');
    if (!target || !isActive()) return;
    event.preventDefault();
    event.stopPropagation();
    const id = target.dataset.miniToggle;
    const data = getData();
    const day = ensureDay(data);
    day.miniActivation[id] = !day.miniActivation[id];
    saveData(data);
    if (currentRoute() === 'today') renderToday();
    else apply();
  });

  if (!isActive()) return;
  const observer = new MutationObserver(() => setTimeout(apply, 0));
  observer.observe(app, { childList:true, subtree:false });
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => setTimeout(apply, 0)));
  window.addEventListener('focus', apply);
  apply();
})();
