(() => {
  'use strict';

  const APP_VERSION = '3.0.0';
  const STORAGE_KEY = 'familia-dieta-v1';

  const profiles = {
    ligia: {
      id: 'ligia',
      name: 'Lígia',
      height: '1,60 m',
      startWeight: 117,
      goal: 'Emagrecimento gradual',
      calories: '1.800–2.000',
      protein: '120–140 g',
      note: 'Usa tirzepatida · refeições menores e proteína primeiro',
      meals: [
        { id:'pre', time:'Antes do treino', name:'Pré-treino leve', kcal:'~100–180 kcal', items:[['Banana','1 un.'],['Café','sem açúcar ou pouco açúcar'],['Se estiver sem fome','pode fazer só a banana ou pular']] },
        { id:'breakfast', time:'Após o treino', name:'Café da manhã', kcal:'~400–450 kcal', items:[['Pão francês','1 un.'],['Ovos','2 un.'],['Whey','30 g'],['Fruta','1 un.']] },
        { id:'lunch', time:'12:00', name:'Almoço', kcal:'~500–550 kcal', items:[['Arroz cozido','120 g'],['Feijão','100 g'],['Frango/carne magra','150 g'],['Salada/legumes','à vontade'],['Azeite','5 g']] },
        { id:'snack', time:'15:30–16:30', name:'Lanche', kcal:'~250–300 kcal', items:[['Iogurte natural/zero','170 g'],['Whey','20 g'],['Fruta','1 un.']] },
        { id:'dinner', time:'19:00–20:00', name:'Jantar', kcal:'~450–500 kcal', items:[['Arroz cozido','100 g'],['Feijão','80–100 g'],['Frango/peixe/carne magra','150 g'],['Salada/legumes','à vontade']] },
        { id:'flex', time:'Ao longo do dia', name:'Margem flexível', kcal:'~100–200 kcal', items:[['Usar se necessário','fruta, iogurte ou alimento preferido'],['Regra','sem compensar com jejum']] }
      ]
    },
    edson: {
      id: 'edson',
      name: 'Edson',
      height: '1,70 m',
      startWeight: 77,
      goal: 'Manutenção / recomposição',
      calories: '2.200–2.400',
      protein: '130–150 g',
      note: 'Treina musculação cedo · preservar força e massa muscular',
      meals: [
        { id:'pre', time:'Antes do treino', name:'Pré-treino', kcal:'~180–250 kcal', items:[['Banana','1 un.'],['Pão francês','1 un. ou 2 fatias de pão'],['Café','a gosto']] },
        { id:'breakfast', time:'Após o treino', name:'Café da manhã', kcal:'~450–500 kcal', items:[['Ovos','2 un.'],['Pão francês','1 un.'],['Whey','30 g'],['Fruta','1 un.']] },
        { id:'lunch', time:'12:00', name:'Almoço', kcal:'~650–700 kcal', items:[['Arroz cozido','200 g'],['Feijão','120 g'],['Frango/carne magra','180 g'],['Salada/legumes','à vontade'],['Azeite','5 g']] },
        { id:'snack', time:'15:30–16:30', name:'Lanche', kcal:'~350–400 kcal', items:[['Iogurte','170 g'],['Whey','30 g'],['Aveia','30 g'],['Fruta','1 un.']] },
        { id:'dinner', time:'19:00–20:00', name:'Jantar', kcal:'~550–600 kcal', items:[['Arroz cozido','160–180 g'],['Feijão','100 g'],['Frango/peixe/carne magra','180 g'],['Salada/legumes','à vontade']] }
      ]
    }
  };

  const defaults = () => ({
    version: 1,
    daily: {},
    measurements: { ligia: [], edson: [] }
  });

  let data = loadData();
  let route = 'today';

  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const installBtn = document.getElementById('installBtn');

  function loadData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...defaults(),
        ...parsed,
        daily: parsed.daily || {},
        measurements: {
          ligia: Array.isArray(parsed.measurements?.ligia) ? parsed.measurements.ligia : [],
          edson: Array.isArray(parsed.measurements?.edson) ? parsed.measurements.edson : []
        }
      };
    } catch {
      return defaults();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function ensureDay(key = dateKey()) {
    data.daily[key] ||= {};
    for (const id of Object.keys(profiles)) {
      data.daily[key][id] ||= { meals:{}, training:false, hydration:false, appetite:null, symptom:'none' };
      data.daily[key][id].meals ||= {};
    }
    return data.daily[key];
  }

  function dayFor(id, key = dateKey()) {
    return ensureDay(key)[id];
  }

  function score(id, key = dateKey()) {
    const p = profiles[id];
    const d = dayFor(id, key);
    const tasks = p.meals.map(m => Boolean(d.meals[m.id]));
    tasks.push(Boolean(d.training), Boolean(d.hydration));
    return Math.round(tasks.filter(Boolean).length / tasks.length * 100);
  }

  function weeklyAdherence(id) {
    let done = 0, total = 0;
    for (let i = 0; i < 7; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const p = profiles[id];
      const d = dayFor(id, dateKey(dt));
      const tasks = p.meals.map(m => Boolean(d.meals[m.id]));
      tasks.push(Boolean(d.training), Boolean(d.hydration));
      done += tasks.filter(Boolean).length;
      total += tasks.length;
    }
    return total ? Math.round(done / total * 100) : 0;
  }

  function latestMeasurement(id) {
    return [...data.measurements[id]].sort((a,b) => b.date.localeCompare(a.date))[0] || null;
  }

  function previousMeasurement(id) {
    return [...data.measurements[id]].sort((a,b) => b.date.localeCompare(a.date))[1] || null;
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function fmt(value, suffix='') {
    if (value === null || value === undefined || value === '') return '—';
    return `${String(value).replace('.',',')}${suffix}`;
  }

  function todayLabel() {
    return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'short'}).format(new Date());
  }

  function taskRow(done, label, meta, action) {
    return `<div class="check-row ${done ? 'done' : ''}" data-action="${esc(action)}">
      <button class="check-circle" type="button" data-action="${esc(action)}">${done ? '✓' : ''}</button>
      <div class="check-copy"><span class="check-label">${esc(label)}</span><span class="check-meta">${esc(meta)}</span></div>
      <span class="chevron">›</span>
    </div>`;
  }

  function profileCard(id) {
    const p = profiles[id];
    const m = latestMeasurement(id);
    const currentWeight = m?.weight || p.startWeight;
    return `<section class="card" data-action="open-profile:${id}" style="cursor:pointer;margin-top:10px">
      <div class="workout-title">
        <div><p class="eyebrow">${esc(p.goal.toUpperCase())}</p><h2 style="margin:4px 0 5px">${esc(p.name)}</h2><p class="hero-sub">${esc(p.height)} · ${fmt(currentWeight,' kg')}</p></div>
        <span class="badge">${score(id)}%</span>
      </div>
      <div class="hero-stats">
        <div class="mini-stat"><b>${esc(p.calories)}</b><span>kcal iniciais</span></div>
        <div class="mini-stat"><b>${esc(p.protein)}</b><span>proteína</span></div>
        <div class="mini-stat"><b>${weeklyAdherence(id)}%</b><span>7 dias</span></div>
      </div>
    </section>`;
  }

  function renderToday() {
    app.innerHTML = `
      <section class="hero-card">
        <p class="eyebrow">${esc(todayLabel().toUpperCase())}</p>
        <h2>Dieta da família</h2>
        <p class="hero-sub">Lígia e Edson · musculação cedo · almoço às 12h.</p>
      </section>
      <section class="section">
        <div class="section-head"><h3>Perfis de hoje</h3><p>toque para abrir</p></div>
        ${profileCard('ligia')}
        ${profileCard('edson')}
      </section>
      <section class="section"><div class="note"><b>Como usar:</b> marcar refeições, treino e hidratação todos os dias. O peso será avaliado pela tendência das semanas, não por um único dia.</div></section>
    `;
  }

  function mealCard(profileId, meal) {
    const d = dayFor(profileId);
    const done = Boolean(d.meals[meal.id]);
    return `<article class="meal-card">
      <div class="meal-head">
        <button type="button" class="check-circle" data-action="toggle-meal:${profileId}:${meal.id}" style="${done ? 'background:var(--accent);border-color:var(--accent);' : ''}">${done ? '✓' : ''}</button>
        <div class="meal-copy"><h3>${esc(meal.name)}</h3><p>${esc(meal.time)} · ${esc(meal.kcal)}</p></div>
      </div>
      <div class="meal-items">${meal.items.map(([n,a]) => `<div><span>${esc(n)}</span><b>${esc(a)}</b></div>`).join('')}</div>
    </article>`;
  }

  function renderProfile(id) {
    const p = profiles[id];
    const d = dayFor(id);
    const m = latestMeasurement(id);
    const cards = p.meals.map(meal => mealCard(id, meal)).join('');
    const ligiaExtras = id === 'ligia' ? `
      <section class="section card">
        <div class="section-head"><h3>Como ela está se sentindo</h3><p>tirzepatida</p></div>
        <label><span class="field-label">Apetite hoje — 1 muito baixo, 5 normal/alto</span>
          <select class="field" id="appetiteSelect" data-profile="ligia">
            <option value="">Não informado</option>
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(d.appetite)===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </label>
        <label style="display:block;margin-top:12px"><span class="field-label">Sintoma principal</span>
          <select class="field" id="symptomSelect" data-profile="ligia">
            <option value="none" ${d.symptom==='none'?'selected':''}>Nenhum</option>
            <option value="nausea" ${d.symptom==='nausea'?'selected':''}>Náusea</option>
            <option value="constipation" ${d.symptom==='constipation'?'selected':''}>Constipação</option>
            <option value="vomiting" ${d.symptom==='vomiting'?'selected':''}>Vômitos</option>
            <option value="pain" ${d.symptom==='pain'?'selected':''}>Dor abdominal</option>
          </select>
        </label>
      </section>
      <section class="section"><div class="note warning-note"><b>Tirzepatida:</b> não aumentar ou reduzir dose por este app. Se houver vômitos repetidos, dificuldade de manter líquidos ou dor abdominal forte/persistente, procure avaliação médica.</div></section>
    ` : '';

    app.innerHTML = `
      <section class="hero-card">
        <div class="hero-row">
          <div><p class="eyebrow">${esc(p.goal.toUpperCase())}</p><h2>${esc(p.name)}</h2><p class="hero-sub">${esc(p.height)} · referência atual ${fmt(m?.weight || p.startWeight,' kg')}</p></div>
          <div class="score-ring" style="--p:${score(id)}"><span class="score-value">${score(id)}%</span></div>
        </div>
        <div class="hero-stats">
          <div class="mini-stat"><b>${esc(p.calories)}</b><span>kcal iniciais</span></div>
          <div class="mini-stat"><b>${esc(p.protein)}</b><span>proteína</span></div>
          <div class="mini-stat"><b>12:00</b><span>almoço</span></div>
        </div>
      </section>
      <section class="section"><div class="note"><b>Rotina:</b> musculação cedo e almoço ao meio-dia. ${esc(p.note)}. As calorias são uma faixa inicial para ajuste pela evolução.</div></section>
      <section class="section">
        <div class="section-head"><h3>Refeições de hoje</h3><p>quantidades cozidas</p></div>
        ${cards}
      </section>
      <section class="section card">
        <div class="section-head"><h3>Rotina diária</h3><p>simples</p></div>
        ${taskRow(d.training,'Musculação feita','Treino da manhã',`toggle-training:${id}`)}
        ${taskRow(d.hydration,'Hidratação ok','Água ao longo do dia',`toggle-hydration:${id}`)}
      </section>
      ${ligiaExtras}
      <section class="section"><button type="button" class="primary-button" data-action="add-measurement:${id}">Registrar peso e cintura</button></section>
    `;
  }

  function delta(current, previous, suffix) {
    if (!current || !previous) return 'sem comparação';
    const d = Number(current) - Number(previous);
    if (!Number.isFinite(d)) return 'sem comparação';
    return `${d > 0 ? '+' : ''}${d.toFixed(1).replace('.',',')} ${suffix}`;
  }

  function progressBlock(id) {
    const p = profiles[id];
    const latest = latestMeasurement(id);
    const prev = previousMeasurement(id);
    const list = [...data.measurements[id]].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
    return `<section class="section card">
      <div class="section-head"><div><h3>${esc(p.name)}</h3><p>${esc(p.goal)}</p></div><button class="text-button" type="button" data-action="add-measurement:${id}">+ medida</button></div>
      <div class="hero-stats">
        <div class="mini-stat"><b>${fmt(latest?.weight || p.startWeight,' kg')}</b><span>peso</span></div>
        <div class="mini-stat"><b>${fmt(latest?.waist,' cm')}</b><span>cintura</span></div>
        <div class="mini-stat"><b>${weeklyAdherence(id)}%</b><span>aderência 7d</span></div>
      </div>
      <div class="note" style="margin-top:12px"><b>Desde o registro anterior:</b> peso ${delta(latest?.weight,prev?.weight,'kg')} · cintura ${delta(latest?.waist,prev?.waist,'cm')}.</div>
      <div class="entries" style="margin-top:12px">${list.length ? list.map(x => `<div class="entry"><div><b>${esc(new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(x.date+'T12:00:00')))}</b></div><div class="entry-values"><strong>${fmt(x.weight,' kg')}</strong><span>${fmt(x.waist,' cm')}</span></div></div>`).join('') : '<div class="empty-state">Nenhuma medida registrada ainda.</div>'}</div>
    </section>`;
  }

  function renderProgress() {
    app.innerHTML = `
      <section class="hero-card"><p class="eyebrow">ACOMPANHAMENTO</p><h2>Progresso</h2><p class="hero-sub">Ajustar alimentação pela tendência de 2–3 semanas e pela aderência real.</p></section>
      ${progressBlock('ligia')}
      ${progressBlock('edson')}
      <section class="section card">
        <div class="section-head"><h3>Backup</h3><p>v${APP_VERSION}</p></div>
        <div class="button-row"><button class="secondary-button" type="button" data-action="export-data">Exportar</button><button class="secondary-button" type="button" data-action="import-data">Importar</button></div>
        <input id="importFile" type="file" accept="application/json,.json" hidden>
      </section>
    `;
  }

  function render() {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
    if (route === 'today') renderToday();
    else if (route === 'ligia' || route === 'edson') renderProfile(route);
    else renderProgress();
  }

  function openMeasurement(id) {
    modalTitle.textContent = `Nova medida · ${profiles[id].name}`;
    modalBody.innerHTML = `
      <div class="form-grid">
        <label><span class="field-label">Data</span><input id="mDate" class="field" type="date" value="${dateKey()}"></label>
        <label><span class="field-label">Peso (kg)</span><input id="mWeight" class="field" type="number" step="0.1"></label>
        <label><span class="field-label">Cintura (cm)</span><input id="mWaist" class="field" type="number" step="0.1"></label>
        <button class="primary-button" type="button" data-action="save-measurement:${id}">Salvar</button>
      </div>`;
    modal.showModal();
  }

  function saveMeasurement(id) {
    const date = document.getElementById('mDate')?.value;
    const weight = parseFloat(document.getElementById('mWeight')?.value);
    const waist = parseFloat(document.getElementById('mWaist')?.value);
    if (!date || (!Number.isFinite(weight) && !Number.isFinite(waist))) return toast('Informe peso ou cintura.');
    data.measurements[id] = data.measurements[id].filter(x => x.date !== date);
    data.measurements[id].push({
      date,
      weight: Number.isFinite(weight) ? +weight.toFixed(1) : null,
      waist: Number.isFinite(waist) ? +waist.toFixed(1) : null
    });
    saveData();
    modal.close();
    toast('Medida salva ✓');
    render();
  }

  function toggle(profileId, field) {
    const d = dayFor(profileId);
    d[field] = !d[field];
    saveData();
    render();
  }

  function toggleMeal(profileId, mealId) {
    const d = dayFor(profileId);
    d.meals[mealId] = !d.meals[mealId];
    saveData();
    render();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({app:'Dieta Família',version:APP_VERSION,data},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dieta-familia-${dateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = parsed.data || parsed;
        if (!incoming.measurements || !incoming.daily) throw new Error();
        data = {
          ...defaults(),
          ...incoming,
          measurements: {
            ligia: Array.isArray(incoming.measurements.ligia) ? incoming.measurements.ligia : [],
            edson: Array.isArray(incoming.measurements.edson) ? incoming.measurements.edson : []
          }
        };
        saveData();
        toast('Backup restaurado ✓');
        render();
      } catch {
        toast('Backup inválido');
      }
    };
    reader.readAsText(file);
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1900);
  }

  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const [action,a,b] = el.dataset.action.split(':');
    if (action === 'open-profile') { route = a; render(); }
    else if (action === 'toggle-meal') toggleMeal(a,b);
    else if (action === 'toggle-training') toggle(a,'training');
    else if (action === 'toggle-hydration') toggle(a,'hydration');
    else if (action === 'add-measurement') openMeasurement(a);
    else if (action === 'save-measurement') saveMeasurement(a);
    else if (action === 'export-data') exportData();
    else if (action === 'import-data') document.getElementById('importFile')?.click();
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'appetiteSelect') {
      const d = dayFor('ligia');
      d.appetite = event.target.value ? Number(event.target.value) : null;
      saveData();
    }
    if (event.target.id === 'symptomSelect') {
      const d = dayFor('ligia');
      d.symptom = event.target.value;
      saveData();
    }
    if (event.target.id === 'importFile' && event.target.files?.[0]) importData(event.target.files[0]);
  });

  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    route = btn.dataset.route;
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }));

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (!standalone) installBtn.hidden = false;
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; installBtn.hidden = false; });
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    } else {
      modalTitle.textContent = 'Instalar aplicativo';
      modalBody.innerHTML = '<div class="note">Android/Chrome: menu ⋮ → Instalar aplicativo. iPhone: Compartilhar → Adicionar à Tela de Início.</div>';
      modal.showModal();
    }
  });

  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }

  ensureDay();
  saveData();
  render();
})();