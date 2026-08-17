(() => {
  'use strict';

  const APP_VERSION = '1.0.0';
  const STORAGE_KEY = 'shape-data-v1';
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const meals = [
    {
      id: 'breakfast',
      name: 'Café da manhã',
      kcal: '~500 kcal',
      protein: '40–45 g proteína',
      items: [
        ['Pão francês', '50 g'],
        ['Ovos inteiros', '2 un.'],
        ['Whey', '30 g'],
        ['Banana', '1 un.']
      ]
    },
    {
      id: 'lunch',
      name: 'Almoço',
      kcal: '~700–750 kcal',
      protein: '~60 g proteína',
      items: [
        ['Arroz cozido', '200 g'],
        ['Feijão cozido', '150 g'],
        ['Frango/carne magra', '180 g'],
        ['Salada/legumes', 'à vontade'],
        ['Azeite', '5 g']
      ]
    },
    {
      id: 'snack',
      name: 'Lanche',
      kcal: '~350–400 kcal',
      protein: '30–35 g proteína',
      items: [
        ['Iogurte natural/zero', '170 g'],
        ['Whey', '30 g'],
        ['Aveia', '30 g'],
        ['Banana ou maçã', '1 un.']
      ]
    },
    {
      id: 'dinner',
      name: 'Jantar',
      kcal: '~650–700 kcal',
      protein: '55–60 g proteína',
      items: [
        ['Arroz cozido', '180 g'],
        ['Feijão', '150 g'],
        ['Frango/carne magra', '180 g'],
        ['Salada/legumes', 'à vontade']
      ]
    }
  ];

  const workouts = {
    upperA: {
      id: 'upperA',
      short: 'Superior A',
      title: 'Superior A',
      subtitle: 'Peito + costas + braços',
      duration: '45–55 min',
      exercises: [
        ['bench', 'Supino reto', '3 × 5–8'],
        ['row', 'Remada', '3 × 6–10'],
        ['incline', 'Supino inclinado', '2 × 8–12'],
        ['pulldown', 'Puxada alta', '2 × 8–12'],
        ['lateral', 'Elevação lateral', '3 × 10–15'],
        ['curl', 'Rosca bíceps', '2 × 8–12'],
        ['triceps', 'Tríceps na polia', '2 × 8–12']
      ]
    },
    legs: {
      id: 'legs',
      short: 'Perna',
      title: 'Perna compacta',
      subtitle: 'Manutenção + abdômen',
      duration: '35–45 min',
      exercises: [
        ['hack', 'Hack ou Leg Press', '3 × 6–10'],
        ['rdl', 'Stiff / RDL', '3 × 6–10'],
        ['curl', 'Mesa flexora', '2 × 8–12'],
        ['calf', 'Panturrilha', '2 × 10–15'],
        ['cableabs', 'Abdominal na polia', '3 × 10–15'],
        ['legraise', 'Elevação de pernas', '2 × 10–15']
      ]
    },
    upperB: {
      id: 'upperB',
      short: 'Superior B',
      title: 'Superior B',
      subtitle: 'Volume eficiente',
      duration: '45–55 min',
      exercises: [
        ['incline', 'Supino inclinado máquina/halter', '3 × 6–10'],
        ['pull', 'Barra fixa ou puxada', '3 × 6–10'],
        ['ohp', 'Desenvolvimento', '2 × 6–10'],
        ['lowrow', 'Remada baixa', '2 × 8–12'],
        ['fly', 'Crucifixo / crossover', '2 × 10–15'],
        ['lateral', 'Elevação lateral', '2 × 12–20'],
        ['curl', 'Rosca bíceps', '2 × 10–15'],
        ['triceps', 'Tríceps', '2 × 10–15']
      ]
    },
    upperC: {
      id: 'upperC',
      short: 'Superior C',
      title: 'Superior C',
      subtitle: 'Acabamento + braços',
      duration: '40–50 min',
      exercises: [
        ['press', 'Paralelas ou supino máquina', '2 × 8–12'],
        ['neutralpull', 'Puxada neutra', '2 × 8–12'],
        ['machineRow', 'Remada máquina', '2 × 8–12'],
        ['lateral', 'Elevação lateral', '3 × 12–20'],
        ['curl', 'Rosca bíceps', '3 × 8–12'],
        ['triceps', 'Tríceps polia/francês', '3 × 8–12'],
        ['abs', 'Abdômen', '3 séries']
      ]
    }
  };

  const weeklyPlan = {
    0: { type: 'rest', label: 'Descanso', cardio: null },
    1: { type: 'workout', workout: 'upperA', label: 'Superior A', cardio: '25–35 min caminhada inclinada' },
    2: { type: 'workout', workout: 'legs', label: 'Perna compacta', cardio: null },
    3: { type: 'cardio', label: 'Cardio / recuperação', cardio: '30–40 min leve/moderado' },
    4: { type: 'workout', workout: 'upperB', label: 'Superior B', cardio: '25–35 min caminhada inclinada' },
    5: { type: 'workout', workout: 'upperC', label: 'Superior C', cardio: '25–35 min caminhada inclinada' },
    6: { type: 'rest', label: 'Livre / caminhada', cardio: null }
  };

  const defaultData = () => ({
    version: 1,
    daily: {},
    measurements: [],
    settings: {
      targetWeight: 87,
      calorieTarget: '2400–2500',
      proteinTarget: '180–195'
    }
  });

  let data = loadData();
  let route = 'today';
  let selectedWorkout = getTodayPlan().workout || 'upperA';
  let deferredInstallPrompt = null;

  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const installBtn = document.getElementById('installBtn');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (!isStandalone) installBtn.hidden = false;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return {
        ...defaultData(),
        ...parsed,
        daily: parsed.daily || {},
        measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
        settings: { ...defaultData().settings, ...(parsed.settings || {}) }
      };
    } catch (error) {
      console.warn('Falha ao carregar dados locais:', error);
      return defaultData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function fromDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function getDay(key = dateKey()) {
    if (!data.daily[key]) {
      data.daily[key] = { meals: {}, workoutDone: false, cardioDone: false, exercises: {}, hunger: null, binge: null };
    }
    return data.daily[key];
  }

  function getTodayPlan() {
    return weeklyPlan[new Date().getDay()];
  }

  function planForDateKey(key) {
    return weeklyPlan[fromDateKey(key).getDay()];
  }

  function getRequiredTasks(key = dateKey()) {
    const day = data.daily[key] || { meals: {} };
    const plan = planForDateKey(key);
    const tasks = meals.map(meal => Boolean(day.meals?.[meal.id]));
    if (plan.type === 'workout') tasks.push(Boolean(day.workoutDone));
    if (plan.cardio) tasks.push(Boolean(day.cardioDone));
    return tasks;
  }

  function dayScore(key = dateKey()) {
    const tasks = getRequiredTasks(key);
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
  }

  function weeklyAdherence() {
    let completed = 0;
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const tasks = getRequiredTasks(dateKey(d));
      completed += tasks.filter(Boolean).length;
      total += tasks.length;
    }
    return total ? Math.round((completed / total) * 100) : 0;
  }

  function streak() {
    let count = 0;
    for (let i = 0; i < 120; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      if (dayScore(key) >= 80) count += 1;
      else if (i === 0) continue;
      else break;
    }
    return count;
  }

  function todayLabel() {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date());
  }

  function latestMeasurement() {
    return [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function previousMeasurement() {
    return [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[1] || null;
  }

  function fmt(value, suffix = '') {
    if (value === null || value === undefined || value === '') return '—';
    return `${String(value).replace('.', ',')}${suffix}`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function render() {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
    if (route === 'today') renderToday();
    if (route === 'workout') renderWorkout();
    if (route === 'diet') renderDiet();
    if (route === 'progress') renderProgress();
  }

  function renderToday() {
    const key = dateKey();
    const day = getDay(key);
    const plan = getTodayPlan();
    const score = dayScore(key);
    const measure = latestMeasurement();
    const planTasks = [];

    if (plan.type === 'workout') {
      planTasks.push(taskRow({
        done: day.workoutDone,
        label: `Treino — ${workouts[plan.workout].title}`,
        meta: workouts[plan.workout].duration,
        action: `open-workout:${plan.workout}`,
        checkAction: 'toggle-workout'
      }));
    } else if (plan.type === 'cardio') {
      planTasks.push(taskRow({
        done: day.cardioDone,
        label: 'Cardio / recuperação',
        meta: plan.cardio,
        action: 'toggle-cardio',
        checkAction: 'toggle-cardio'
      }));
    } else {
      planTasks.push(`<div class="note">Hoje é dia de <b>${escapeHtml(plan.label)}</b>. Sem necessidade de inventar volume: recuperar também faz parte do plano.</div>`);
    }

    if (plan.cardio && plan.type === 'workout') {
      planTasks.push(taskRow({
        done: day.cardioDone,
        label: 'Cardio',
        meta: plan.cardio,
        action: 'toggle-cardio',
        checkAction: 'toggle-cardio'
      }));
    }

    const mealRows = meals.map(meal => taskRow({
      done: Boolean(day.meals[meal.id]),
      label: meal.name,
      meta: `${meal.kcal} · ${meal.protein}`,
      action: `meal:${meal.id}`,
      checkAction: `toggle-meal:${meal.id}`
    })).join('');

    app.innerHTML = `
      <section class="hero-card">
        <div class="hero-row">
          <div>
            <p class="eyebrow">${escapeHtml(todayLabel().toUpperCase())}</p>
            <h2>${escapeHtml(plan.label)}</h2>
            <p class="hero-sub">Meta: definição com força e rotina sustentável.</p>
          </div>
          <div class="score-ring" style="--p:${score}">
            <span class="score-value">${score}%</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="mini-stat"><b>${fmt(measure?.weight, ' kg')}</b><span>Peso</span></div>
          <div class="mini-stat"><b>${weeklyAdherence()}%</b><span>7 dias</span></div>
          <div class="mini-stat"><b>${streak()} d</b><span>Sequência</span></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h3>Plano de hoje</h3><p>${score === 100 ? 'Fechado ✓' : 'Foco no básico'}</p></div>
        <div class="card">${planTasks.join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><h3>Refeições</h3><button class="text-button" data-action="go-diet">ver dieta</button></div>
        <div class="card">${mealRows}</div>
      </section>

      <section class="section">
        <div class="section-head"><h3>Últimos 7 dias</h3><p>Aderência</p></div>
        <div class="day-strip">${renderWeekStrip()}</div>
      </section>

      <section class="section">
        <div class="note warning-note"><b>Regra do processo:</b> se sair da dieta em uma refeição, não compense pulando a próxima nem com cardio punitivo. Volte ao plano na refeição seguinte.</div>
      </section>
    `;
  }

  function taskRow({ done, label, meta, action, checkAction }) {
    return `
      <div class="check-row ${done ? 'done' : ''}" data-action="${escapeHtml(action)}">
        <button type="button" class="check-circle" data-action="${escapeHtml(checkAction)}" aria-label="${done ? 'Desmarcar' : 'Marcar'} ${escapeHtml(label)}">${done ? '✓' : ''}</button>
        <div class="check-copy">
          <span class="check-label">${escapeHtml(label)}</span>
          <span class="check-meta">${escapeHtml(meta)}</span>
        </div>
        <span class="chevron">›</span>
      </div>`;
  }

  function renderWeekStrip() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const score = dayScore(key);
      out.push(`
        <div class="day-pill ${i === 0 ? 'today' : ''} ${score === 100 ? 'perfect' : ''}">
          <span>${DAY_NAMES[d.getDay()]}</span>
          <b>${score}%</b>
        </div>`);
    }
    return out.join('');
  }

  function renderWorkout() {
    const workout = workouts[selectedWorkout];
    const key = dateKey();
    const day = getDay(key);
    const log = day.exercises[workout.id] || {};
    const doneCount = workout.exercises.filter(([id]) => log[id]?.done).length;
    const progress = Math.round(doneCount / workout.exercises.length * 100);

    const chips = Object.values(workouts).map(w => `
      <button type="button" class="badge" data-action="select-workout:${w.id}" style="${w.id === selectedWorkout ? 'background:var(--accent);color:#0a0e08;' : ''}">${escapeHtml(w.short)}</button>
    `).join(' ');

    const exercisesHtml = workout.exercises.map(([id, name, target]) => {
      const item = log[id] || {};
      return `
        <div class="exercise">
          <div class="exercise-main">
            <button type="button" class="check-circle ${item.done ? 'is-done' : ''}" data-action="toggle-exercise:${workout.id}:${id}" style="${item.done ? 'background:var(--accent);border-color:var(--accent);' : ''}">${item.done ? '✓' : ''}</button>
            <div class="exercise-name">${escapeHtml(name)}<span class="exercise-target">${escapeHtml(target)}</span></div>
          </div>
          <div class="exercise-inputs">
            <label><span class="field-label">Carga usada</span><input class="field exercise-field" inputmode="decimal" placeholder="ex: 80 kg" value="${escapeHtml(item.load || '')}" data-workout="${workout.id}" data-exercise="${id}" data-field="load"></label>
            <label><span class="field-label">Reps feitas</span><input class="field exercise-field" inputmode="text" placeholder="ex: 8/8/7" value="${escapeHtml(item.reps || '')}" data-workout="${workout.id}" data-exercise="${id}" data-field="reps"></label>
          </div>
        </div>`;
    }).join('');

    app.innerHTML = `
      <section class="card">
        <div style="display:flex;gap:6px;overflow:auto;padding-bottom:4px">${chips}</div>
      </section>

      <section class="section card">
        <div class="workout-title">
          <div><p class="eyebrow">TREINO COMPACTO</p><h2>${escapeHtml(workout.title)}</h2><p class="hero-sub">${escapeHtml(workout.subtitle)} · ${escapeHtml(workout.duration)}</p></div>
          <span class="badge">${progress}%</span>
        </div>
        <div style="margin-top:18px">${exercisesHtml}</div>
        <button type="button" class="primary-button" data-action="finish-workout:${workout.id}" style="margin-top:12px">${day.workoutDone && getTodayPlan().workout === workout.id ? 'Treino concluído ✓' : 'Concluir treino'}</button>
      </section>

      <section class="section">
        <div class="note"><b>Intensidade:</b> trabalhe principalmente com cerca de 1–2 repetições em reserva. O objetivo desta fase é manter força e massa muscular sem transformar o treino em uma maratona.</div>
      </section>
    `;
  }

  function renderDiet() {
    const day = getDay();
    const mealCards = meals.map(meal => `
      <article class="meal-card">
        <div class="meal-head">
          <button type="button" class="check-circle" data-action="toggle-meal:${meal.id}" style="${day.meals[meal.id] ? 'background:var(--accent);border-color:var(--accent);' : ''}">${day.meals[meal.id] ? '✓' : ''}</button>
          <div class="meal-copy"><h3>${escapeHtml(meal.name)}</h3><p>${escapeHtml(meal.kcal)} · ${escapeHtml(meal.protein)}</p></div>
        </div>
        <div class="meal-items">${meal.items.map(([name, amount]) => `<div><span>${escapeHtml(name)}</span><b>${escapeHtml(amount)}</b></div>`).join('')}</div>
      </article>
    `).join('');

    app.innerHTML = `
      <section class="hero-card">
        <p class="eyebrow">PLANO ALIMENTAR</p>
        <h2>${escapeHtml(data.settings.calorieTarget)} kcal</h2>
        <p class="hero-sub">Proteína: ${escapeHtml(data.settings.proteinTarget)} g/dia · alimentos simples · quantidades cozidas/prontas.</p>
        <div class="hero-stats">
          <div class="mini-stat"><b>4</b><span>Refeições</span></div>
          <div class="mini-stat"><b>150–250</b><span>kcal livres</span></div>
          <div class="mini-stat"><b>2,4–2,5k</b><span>kcal/dia</span></div>
        </div>
      </section>

      <section class="section">${mealCards}</section>

      <section class="section meal-card free-calorie">
        <div class="meal-head">
          <div class="check-circle" style="border-color:rgba(255,209,102,.35);color:var(--warning)">+</div>
          <div class="meal-copy"><h3>Calorias flexíveis</h3><p>150–250 kcal · pode ser chocolate, sorvete, pão ou outra coisa que você goste.</p></div>
        </div>
      </section>

      <section class="section card">
        <div class="section-head"><h3>Check-in de fome</h3><p>sem julgamento</p></div>
        <label><span class="field-label">Fome/vontade de comer hoje — 1 baixa, 5 muito forte</span>
          <select id="hungerSelect" class="field">
            <option value="">Não informado</option>
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(day.hunger) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        <div style="margin-top:12px"><span class="field-label">Houve episódio de perda de controle/compulsão?</span>
          <div class="button-row">
            <button type="button" class="secondary-button" data-action="set-binge:no" style="${day.binge === false ? 'border-color:rgba(185,255,74,.45);color:var(--accent);' : ''}">Não</button>
            <button type="button" class="secondary-button" data-action="set-binge:yes" style="${day.binge === true ? 'border-color:rgba(255,209,102,.4);color:var(--warning);' : ''}">Sim</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="note warning-note"><b>Importante:</b> este registro serve para enxergar padrões, não para punir você. Um episódio não pede jejum nem treino extra no dia seguinte; retome as refeições normais.</div>
      </section>
    `;
  }

  function renderProgress() {
    const latest = latestMeasurement();
    const prev = previousMeasurement();
    const weightDelta = latest && prev && latest.weight && prev.weight ? Number(latest.weight) - Number(prev.weight) : null;
    const waistDelta = latest && prev && latest.waist && prev.waist ? Number(latest.waist) - Number(prev.waist) : null;
    const sorted = [...data.measurements].sort((a, b) => b.date.localeCompare(a.date));

    app.innerHTML = `
      <section class="hero-card">
        <div class="hero-row">
          <div><p class="eyebrow">PROGRESSO</p><h2>${fmt(latest?.weight, ' kg')}</h2><p class="hero-sub">Meta inicial configurada: ${fmt(data.settings.targetWeight, ' kg')}</p></div>
          <button type="button" class="primary-button" data-action="add-measurement" style="width:auto;min-width:105px">+ Medida</button>
        </div>
      </section>

      <section class="section progress-grid">
        <div class="stat-card"><span class="label">Cintura</span><div class="number">${fmt(latest?.waist, ' cm')}</div><div class="delta">${deltaText(waistDelta, 'cm')}</div></div>
        <div class="stat-card"><span class="label">BF estimado</span><div class="number">${fmt(latest?.bf, '%')}</div><div class="delta">registro manual</div></div>
        <div class="stat-card"><span class="label">Aderência</span><div class="number">${weeklyAdherence()}%</div><div class="delta">últimos 7 dias</div></div>
        <div class="stat-card"><span class="label">Peso</span><div class="number">${fmt(latest?.weight, ' kg')}</div><div class="delta">${deltaText(weightDelta, 'kg')}</div></div>
      </section>

      <section class="section card">
        <div class="section-head"><h3>Evolução do peso</h3><p>últimos registros</p></div>
        ${renderWeightChart()}
      </section>

      <section class="section card">
        <div class="section-head"><h3>Histórico</h3><p>${sorted.length} registro${sorted.length === 1 ? '' : 's'}</p></div>
        <div class="entries">${sorted.length ? sorted.slice(0, 12).map(renderMeasurementEntry).join('') : '<div class="empty-state">Adicione seu primeiro peso/cintura para começar o histórico.</div>'}</div>
      </section>

      <section class="section card">
        <div class="section-head"><h3>Dados do aplicativo</h3><p>v${APP_VERSION}</p></div>
        <div class="button-row">
          <button type="button" class="secondary-button" data-action="export-data">Exportar backup</button>
          <button type="button" class="secondary-button" data-action="import-data">Importar backup</button>
        </div>
        <button type="button" class="danger-button" data-action="reset-data" style="margin-top:9px">Apagar dados locais</button>
        <input id="importFile" type="file" accept="application/json,.json" hidden>
      </section>
    `;
  }

  function deltaText(delta, unit) {
    if (delta === null || Number.isNaN(delta)) return 'sem comparação';
    if (delta === 0) return 'sem mudança';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1).replace('.', ',')} ${unit} vs. anterior`;
  }

  function renderMeasurementEntry(item) {
    const dt = fromDateKey(item.date);
    const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }).format(dt);
    return `<div class="entry">
      <div><b>${escapeHtml(date)}</b><span>${item.note ? `<br>${escapeHtml(item.note)}` : ''}</span></div>
      <div class="entry-values"><strong>${fmt(item.weight, ' kg')}</strong><span>${fmt(item.waist, ' cm')} · ${fmt(item.bf, '% BF')}</span></div>
    </div>`;
  }

  function renderWeightChart() {
    const points = [...data.measurements]
      .filter(x => Number(x.weight) > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
    if (points.length < 2) return '<div class="empty-state">Com dois ou mais registros, o gráfico aparece aqui.</div>';
    const values = points.map(x => Number(x.weight));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    return `<div class="chart">${points.map(p => {
      const weight = Number(p.weight);
      const height = 25 + ((weight - min) / span) * 70;
      return `<div class="chart-col" title="${weight} kg"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${height}%"></div></div><span class="chart-label">${fromDateKey(p.date).getDate()}/${fromDateKey(p.date).getMonth()+1}</span></div>`;
    }).join('')}</div>`;
  }

  function openMeal(mealId) {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;
    modalTitle.textContent = meal.name;
    modalBody.innerHTML = `
      <div class="meal-items" style="padding:0">${meal.items.map(([name, amount]) => `<div><span>${escapeHtml(name)}</span><b>${escapeHtml(amount)}</b></div>`).join('')}</div>
      <div class="note" style="margin-top:13px">${escapeHtml(meal.kcal)} · ${escapeHtml(meal.protein)}. As quantidades de arroz, feijão e carnes são consideradas já prontas/cozidas.</div>`;
    modal.showModal();
  }

  function openMeasurementModal() {
    modalTitle.textContent = 'Nova medida';
    modalBody.innerHTML = `
      <div class="form-grid">
        <label><span class="field-label">Data</span><input id="mDate" class="field" type="date" value="${dateKey()}"></label>
        <label><span class="field-label">Peso (kg)</span><input id="mWeight" class="field" inputmode="decimal" type="number" min="30" max="250" step="0.1" placeholder="91.0"></label>
        <label><span class="field-label">Cintura (cm)</span><input id="mWaist" class="field" inputmode="decimal" type="number" min="40" max="200" step="0.1" placeholder="ex: 84"></label>
        <label><span class="field-label">BF estimado (%) — opcional</span><input id="mBf" class="field" inputmode="decimal" type="number" min="3" max="60" step="0.1" placeholder="14"></label>
        <label><span class="field-label">Observação — opcional</span><input id="mNote" class="field" maxlength="90" placeholder="ex: em jejum"></label>
        <button type="button" class="primary-button" data-action="save-measurement">Salvar medida</button>
      </div>`;
    modal.showModal();
  }

  function toggleMeal(id) {
    const day = getDay();
    day.meals[id] = !day.meals[id];
    saveData();
    toast(day.meals[id] ? 'Refeição marcada ✓' : 'Refeição desmarcada');
    render();
  }

  function toggleExercise(workoutId, exerciseId) {
    const day = getDay();
    day.exercises[workoutId] ||= {};
    day.exercises[workoutId][exerciseId] ||= {};
    day.exercises[workoutId][exerciseId].done = !day.exercises[workoutId][exerciseId].done;
    saveData();
    renderWorkout();
  }

  function finishWorkout(workoutId) {
    const day = getDay();
    const workout = workouts[workoutId];
    day.exercises[workoutId] ||= {};
    workout.exercises.forEach(([id]) => {
      day.exercises[workoutId][id] ||= {};
      day.exercises[workoutId][id].done = true;
    });
    if (getTodayPlan().workout === workoutId) day.workoutDone = true;
    saveData();
    toast('Treino concluído. Boa! ✓');
    renderWorkout();
  }

  function saveMeasurement() {
    const date = document.getElementById('mDate')?.value;
    const weight = parseFloat(document.getElementById('mWeight')?.value);
    const waist = parseFloat(document.getElementById('mWaist')?.value);
    const bf = parseFloat(document.getElementById('mBf')?.value);
    const note = document.getElementById('mNote')?.value.trim();
    if (!date || (!weight && !waist && !bf)) {
      toast('Informe pelo menos uma medida.');
      return;
    }
    const item = {
      date,
      weight: Number.isFinite(weight) ? Number(weight.toFixed(1)) : null,
      waist: Number.isFinite(waist) ? Number(waist.toFixed(1)) : null,
      bf: Number.isFinite(bf) ? Number(bf.toFixed(1)) : null,
      note: note || ''
    };
    data.measurements = data.measurements.filter(x => x.date !== date);
    data.measurements.push(item);
    saveData();
    modal.close();
    toast('Medida salva ✓');
    renderProgress();
  }

  function exportData() {
    const payload = JSON.stringify({ app: 'Shape', appVersion: APP_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shape-backup-${dateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup exportado ✓');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = parsed.data || parsed;
        if (!imported || typeof imported !== 'object' || !imported.daily) throw new Error('Formato inválido');
        data = {
          ...defaultData(),
          ...imported,
          daily: imported.daily || {},
          measurements: Array.isArray(imported.measurements) ? imported.measurements : [],
          settings: { ...defaultData().settings, ...(imported.settings || {}) }
        };
        saveData();
        toast('Backup restaurado ✓');
        render();
      } catch (error) {
        toast('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  }

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const [action, a, b] = target.dataset.action.split(':');

    if (action === 'toggle-meal') toggleMeal(a);
    else if (action === 'meal') openMeal(a);
    else if (action === 'toggle-workout') {
      const day = getDay(); day.workoutDone = !day.workoutDone; saveData(); render();
    }
    else if (action === 'toggle-cardio') {
      const day = getDay(); day.cardioDone = !day.cardioDone; saveData(); toast(day.cardioDone ? 'Cardio marcado ✓' : 'Cardio desmarcado'); render();
    }
    else if (action === 'open-workout') { selectedWorkout = a; route = 'workout'; render(); }
    else if (action === 'go-diet') { route = 'diet'; render(); }
    else if (action === 'select-workout') { selectedWorkout = a; renderWorkout(); }
    else if (action === 'toggle-exercise') toggleExercise(a, b);
    else if (action === 'finish-workout') finishWorkout(a);
    else if (action === 'add-measurement') openMeasurementModal();
    else if (action === 'save-measurement') saveMeasurement();
    else if (action === 'set-binge') { const day = getDay(); day.binge = a === 'yes'; saveData(); renderDiet(); }
    else if (action === 'export-data') exportData();
    else if (action === 'import-data') document.getElementById('importFile')?.click();
    else if (action === 'reset-data') {
      if (confirm('Apagar todos os check-ins, treinos e medidas salvos neste aparelho?')) {
        data = defaultData(); saveData(); toast('Dados apagados.'); render();
      }
    }
  });

  document.addEventListener('input', event => {
    if (event.target.classList.contains('exercise-field')) {
      const { workout, exercise, field } = event.target.dataset;
      const day = getDay();
      day.exercises[workout] ||= {};
      day.exercises[workout][exercise] ||= {};
      day.exercises[workout][exercise][field] = event.target.value;
      saveData();
    }
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'hungerSelect') {
      const day = getDay();
      day.hunger = event.target.value ? Number(event.target.value) : null;
      saveData();
      toast('Check-in salvo');
    }
    if (event.target.id === 'importFile' && event.target.files?.[0]) importData(event.target.files[0]);
  });

  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    route = btn.dataset.route;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.hidden = true;
      return;
    }
    modalTitle.textContent = 'Instalar no celular';
    modalBody.innerHTML = `<div class="note">No <b>iPhone</b>: Compartilhar → Adicionar à Tela de Início.<br><br>No <b>Android/Chrome</b>: menu ⋮ → Instalar aplicativo ou Adicionar à tela inicial.</div>`;
    modal.showModal();
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    toast('Shape instalado ✓');
  });

  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('./sw.js?v=1.0.0').then(reg => reg.update()).catch(console.warn);
  }

  render();
})();
