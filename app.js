/* ── Storage helpers ──────────────────────────────── */
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
};

// Prefer chrome.storage if available (when loaded as extension)
const useChrome = typeof chrome !== 'undefined' && chrome.storage;
const cStore = {
  async get(key, fallback = null) {
    if (useChrome) {
      return new Promise(res => {
        chrome.storage.local.get([key], r => res(r[key] !== undefined ? r[key] : fallback));
      });
    }
    return store.get(key, fallback);
  },
  async set(key, val) {
    if (useChrome) {
      return new Promise(res => chrome.storage.local.set({ [key]: val }, res));
    }
    store.set(key, val);
  }
};

/* ── Helpers ──────────────────────────────────────── */
const $ = id => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0, 10);
const pad2 = n => String(n).padStart(2, '0');

/* ── Clock & greeting ─────────────────────────────── */
function initClock() {
  const clockEl = $('clock');
  const dateEl = $('date-str');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function tick() {
    const now = new Date();
    clockEl.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }
  tick();
  setInterval(tick, 10000);
}

async function initGreeting() {
  const name = await cStore.get('greetingName', '');
  renderGreeting(name);
  $('greeting-name').value = name;
  $('greeting-name').addEventListener('input', async e => {
    await cStore.set('greetingName', e.target.value.trim());
    renderGreeting(e.target.value.trim());
  });
}
function renderGreeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  $('greeting').textContent = name ? `Good ${part}, ${name}` : `Good ${part}`;
}

/* ── Theme ────────────────────────────────────────── */
async function initTheme() {
  const theme = await cStore.get('theme', 'dusk');
  applyTheme(theme);
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    if (btn.dataset.theme === theme) btn.classList.add('active');
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await cStore.set('theme', btn.dataset.theme);
      applyTheme(btn.dataset.theme);
    });
  });
}
function applyTheme(t) {
  document.body.className = document.body.className
    .replace(/theme-\w+/g, '').trim() + ` theme-${t}`;
}

/* ── Background image ─────────────────────────────── */
async function initBgImage() {
  const saved = await cStore.get('bgImage', null);
  if (saved) applyBgImage(saved);

  $('bg-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const data = ev.target.result;
      await cStore.set('bgImage', data);
      applyBgImage(data);
    };
    reader.readAsDataURL(file);
  });

  $('bg-clear').addEventListener('click', async () => {
    await cStore.set('bgImage', null);
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-bg-image');
    $('bg-preview-wrap').classList.add('hidden');
  });
}
function applyBgImage(dataUrl) {
  document.body.style.backgroundImage = `url(${dataUrl})`;
  document.body.classList.add('has-bg-image');
  const prev = $('bg-preview');
  prev.src = dataUrl;
  $('bg-preview-wrap').classList.remove('hidden');
}

/* ── Settings panel ───────────────────────────────── */
function initSettings() {
  $('open-settings').addEventListener('click', () => {
    $('settings-panel').classList.remove('hidden');
  });
  $('close-settings').addEventListener('click', () => {
    $('settings-panel').classList.add('hidden');
  });
  // Close on outside click
  document.addEventListener('click', e => {
    const panel = $('settings-panel');
    if (!panel.classList.contains('hidden') &&
        !panel.contains(e.target) &&
        e.target !== $('open-settings')) {
      panel.classList.add('hidden');
    }
  });
}

/* ── Pomodoro ─────────────────────────────────────── */
let pomoState = { running: false, mode: 'focus', remaining: 25 * 60, session: 1 };
let pomoInterval = null;
let pomoSettings = { focus: 25, break: 5, longBreak: 15 };

async function initPomo() {
  const saved = await cStore.get('pomoSettings', null);
  if (saved) pomoSettings = { ...pomoSettings, ...saved };
  $('pomo-focus-len').value = pomoSettings.focus;
  $('pomo-break-len').value = pomoSettings.break;
  $('pomo-long-len').value = pomoSettings.longBreak;

  ['pomo-focus-len','pomo-break-len','pomo-long-len'].forEach(id => {
    $(id).addEventListener('change', async () => {
      pomoSettings.focus = parseInt($('pomo-focus-len').value) || 25;
      pomoSettings.break = parseInt($('pomo-break-len').value) || 5;
      pomoSettings.longBreak = parseInt($('pomo-long-len').value) || 15;
      await cStore.set('pomoSettings', pomoSettings);
      if (!pomoState.running) resetPomo();
    });
  });

  pomoState.remaining = pomoSettings.focus * 60;
  renderPomo();

  $('pomo-toggle').addEventListener('click', togglePomo);
  $('pomo-reset').addEventListener('click', resetPomo);
}

function togglePomo() {
  if (pomoState.running) {
    clearInterval(pomoInterval);
    pomoState.running = false;
    $('pomo-toggle').textContent = 'Resume';
    $('pomo-toggle').classList.remove('running');
  } else {
    pomoState.running = true;
    $('pomo-toggle').textContent = 'Pause';
    $('pomo-toggle').classList.add('running');
    pomoInterval = setInterval(() => {
      pomoState.remaining--;
      if (pomoState.remaining <= 0) nextPomo();
      renderPomo();
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoInterval);
  pomoState.running = false;
  pomoState.mode = 'focus';
  pomoState.remaining = pomoSettings.focus * 60;
  $('pomo-toggle').textContent = 'Start';
  $('pomo-toggle').classList.remove('running');
  renderPomo();
}

function nextPomo() {
  clearInterval(pomoInterval);
  pomoState.running = false;
  if (pomoState.mode === 'focus') {
    pomoState.session++;
    if (pomoState.session > 4) pomoState.session = 1;
    const isLong = pomoState.session === 1;
    pomoState.mode = isLong ? 'longBreak' : 'break';
    pomoState.remaining = (isLong ? pomoSettings.longBreak : pomoSettings.break) * 60;
  } else {
    pomoState.mode = 'focus';
    pomoState.remaining = pomoSettings.focus * 60;
  }
  $('pomo-toggle').textContent = 'Start';
  $('pomo-toggle').classList.remove('running');
  renderPomo();
  // Flash title
  const orig = document.title;
  let flashes = 0;
  const fi = setInterval(() => {
    document.title = flashes % 2 === 0 ? '⏰ Timer done!' : orig;
    if (++flashes > 5) { clearInterval(fi); document.title = orig; }
  }, 700);
}

function renderPomo() {
  const total = (pomoState.mode === 'focus' ? pomoSettings.focus :
                 pomoState.mode === 'break' ? pomoSettings.break : pomoSettings.longBreak) * 60;
  const r = pomoState.remaining;
  $('pomo-display').textContent = `${pad2(Math.floor(r / 60))}:${pad2(r % 60)}`;
  $('pomo-label').textContent = pomoState.mode === 'focus' ? 'Focus' : pomoState.mode === 'break' ? 'Break' : 'Long break';
  $('pomo-session').textContent = pomoState.session;

  // SVG arc
  const arc = $('pomo-arc');
  const circumference = 2 * Math.PI * 42;
  arc.style.strokeDasharray = circumference;
  arc.style.strokeDashoffset = circumference * (1 - r / total);
}

/* ── To-do ────────────────────────────────────────── */
let todos = [];

async function initTodo() {
  todos = await cStore.get('todos', []);
  renderTodos();

  $('todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
  $('todo-add').addEventListener('click', addTodo);
  $('todo-clear-done').addEventListener('click', async () => {
    todos = todos.filter(t => !t.done);
    await saveTodos(); renderTodos();
  });

  // Export
  $('todo-export-btn').addEventListener('click', e => {
    e.stopPropagation();
    $('export-menu').classList.toggle('hidden');
  });
  document.addEventListener('click', () => $('export-menu').classList.add('hidden'));
  document.querySelectorAll('#export-menu button').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); exportTodos(btn.dataset.fmt); $('export-menu').classList.add('hidden'); });
  });

  // Import
  $('todo-import-btn').addEventListener('click', () => $('todo-import-file').click());
  $('todo-import-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const text = ev.target.result;
      const isCsv = file.name.endsWith('.csv');
      let lines;
      if (isCsv) {
        lines = text.split('\n').map(l => l.replace(/^"|"$/g, '').trim()).filter(Boolean);
        // skip header if looks like one
        if (lines[0] && lines[0].toLowerCase().includes('task')) lines.shift();
      } else {
        lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      }
      const newTasks = lines.map(text => ({ id: uid(), text, done: false }));
      todos = [...todos, ...newTasks];
      await saveTodos(); renderTodos();
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

function uid() { return Math.random().toString(36).slice(2, 10); }

async function addTodo() {
  const input = $('todo-input');
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: uid(), text, done: false });
  input.value = '';
  await saveTodos(); renderTodos();
}

async function saveTodos() { await cStore.set('todos', todos); }

function renderTodos() {
  const list = $('todo-list');
  list.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.innerHTML = `
      <button class="todo-check ${todo.done ? 'checked' : ''}" data-id="${todo.id}" aria-label="Toggle done"></button>
      <span class="todo-text ${todo.done ? 'done' : ''}" contenteditable="true" data-id="${todo.id}">${escHtml(todo.text)}</span>
      <button class="todo-del" data-id="${todo.id}" aria-label="Delete">✕</button>`;
    list.appendChild(li);
  });

  list.querySelectorAll('.todo-check').forEach(btn => {
    btn.addEventListener('click', async () => {
      const t = todos.find(t => t.id === btn.dataset.id);
      if (t) { t.done = !t.done; await saveTodos(); renderTodos(); }
    });
  });
  list.querySelectorAll('.todo-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      todos = todos.filter(t => t.id !== btn.dataset.id);
      await saveTodos(); renderTodos();
    });
  });
  list.querySelectorAll('.todo-text').forEach(span => {
    span.addEventListener('blur', async () => {
      const t = todos.find(t => t.id === span.dataset.id);
      if (t) { t.text = span.textContent.trim(); await saveTodos(); }
    });
    span.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); span.blur(); } });
  });

  const done = todos.filter(t => t.done).length;
  $('todo-count').textContent = todos.length ? `${done}/${todos.length} done` : '';
}

function exportTodos(fmt) {
  let content, filename, type;
  if (fmt === 'csv') {
    const rows = ['"Task","Done"', ...todos.map(t => `"${t.text.replace(/"/g,'""')}","${t.done ? 'yes' : 'no'}"`)];
    content = rows.join('\n');
    filename = 'tasks.csv'; type = 'text/csv';
  } else {
    content = todos.map(t => (t.done ? '[x] ' : '[ ] ') + t.text).join('\n');
    filename = 'tasks.txt'; type = 'text/plain';
  }
  downloadText(content, filename, type);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Notepad ──────────────────────────────────────── */
async function initNotepad() {
  const saved = await cStore.get('notepad', '');
  $('notepad-area').value = saved;
  let debounce;
  $('notepad-area').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => cStore.set('notepad', e.target.value), 600);
  });
}

/* ── Habits ───────────────────────────────────────── */
let habits = [];

async function initHabits() {
  habits = await cStore.get('habits', []);
  renderHabits();
  renderHabitSettings();

  $('add-habit-btn').addEventListener('click', addHabit);
  $('new-habit-name').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
}

async function addHabit() {
  const input = $('new-habit-name');
  const name = input.value.trim();
  if (!name) return;
  habits.push({ id: uid(), name, completions: {} });
  input.value = '';
  await cStore.set('habits', habits);
  renderHabits(); renderHabitSettings();
}

function renderHabits() {
  const list = $('habit-list');
  const empty = $('habit-empty');
  list.innerHTML = '';
  if (!habits.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  const today = todayKey();
  // Build 7-day window ending today
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  habits.forEach(habit => {
    const row = document.createElement('div');
    row.className = 'habit-row';
    const nameEl = document.createElement('span');
    nameEl.className = 'habit-name'; nameEl.title = habit.name;
    nameEl.textContent = habit.name;

    const dotsEl = document.createElement('div');
    dotsEl.className = 'habit-dots';
    days.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'habit-dot' + (habit.completions[day] ? ' done' : '') + (day === today ? ' today' : '');
      btn.title = day;
      btn.setAttribute('aria-label', `${habit.name} on ${day}`);
      btn.addEventListener('click', async () => {
        habit.completions[day] = !habit.completions[day];
        await cStore.set('habits', habits);
        renderHabits();
      });
      dotsEl.appendChild(btn);
    });
    row.appendChild(nameEl); row.appendChild(dotsEl);
    list.appendChild(row);
  });
}

function renderHabitSettings() {
  const list = $('habit-settings-list');
  list.innerHTML = '';
  habits.forEach(habit => {
    const row = document.createElement('div');
    row.className = 'habit-setting-row';
    row.innerHTML = `<span>${escHtml(habit.name)}</span>
      <button class="tiny-btn" data-id="${habit.id}">Remove</button>`;
    row.querySelector('button').addEventListener('click', async () => {
      habits = habits.filter(h => h.id !== habit.id);
      await cStore.set('habits', habits);
      renderHabits(); renderHabitSettings();
    });
    list.appendChild(row);
  });
}

/* ── Day planner ──────────────────────────────────── */
let plannerView = 'blocks';
let timeBlocks = [];
let planItems = [];

async function initPlanner() {
  timeBlocks = await cStore.get('timeBlocks_' + todayKey(), []);
  planItems = await cStore.get('planItems_' + todayKey(), []);

  renderBlocks(); renderPlanItems();

  // View toggle
  $('view-blocks-btn').addEventListener('click', () => switchPlannerView('blocks'));
  $('view-list-btn').addEventListener('click', () => switchPlannerView('list'));

  // Add block
  $('block-add-btn').addEventListener('click', addBlock);
  $('block-label').addEventListener('keydown', e => { if (e.key === 'Enter') addBlock(); });

  // Add plan item
  $('plan-item-add').addEventListener('click', addPlanItem);
  $('plan-item-input').addEventListener('keydown', e => { if (e.key === 'Enter') addPlanItem(); });

  // Set default times
  const now = new Date();
  const hh = pad2(now.getHours()); const mm = pad2(now.getMinutes());
  const hh2 = pad2(now.getHours() + 1 > 23 ? 23 : now.getHours() + 1);
  $('block-start').value = `${hh}:${mm}`;
  $('block-end').value = `${hh2}:${mm}`;
  $('plan-time').value = `${hh}:${mm}`;
}

function switchPlannerView(view) {
  plannerView = view;
  $('view-blocks-btn').classList.toggle('active', view === 'blocks');
  $('view-list-btn').classList.toggle('active', view === 'list');
  $('planner-blocks-view').classList.toggle('hidden', view !== 'blocks');
  $('planner-list-view').classList.toggle('hidden', view !== 'list');
}

async function addBlock() {
  const start = $('block-start').value;
  const end = $('block-end').value;
  const label = $('block-label').value.trim();
  if (!label) return;
  timeBlocks.push({ id: uid(), start, end, label });
  timeBlocks.sort((a, b) => a.start.localeCompare(b.start));
  $('block-label').value = '';
  await cStore.set('timeBlocks_' + todayKey(), timeBlocks);
  renderBlocks();
}

function renderBlocks() {
  const list = $('blocks-list');
  list.innerHTML = '';
  timeBlocks.forEach(block => {
    const div = document.createElement('div');
    div.className = 'time-block-item';
    div.innerHTML = `<span class="block-time-range">${block.start}${block.end ? ' → ' + block.end : ''}</span>
      <span class="block-item-label">${escHtml(block.label)}</span>
      <button class="block-del" data-id="${block.id}" aria-label="Delete block">✕</button>`;
    div.querySelector('.block-del').addEventListener('click', async () => {
      timeBlocks = timeBlocks.filter(b => b.id !== block.id);
      await cStore.set('timeBlocks_' + todayKey(), timeBlocks);
      renderBlocks();
    });
    list.appendChild(div);
  });
}

async function addPlanItem() {
  const time = $('plan-time').value;
  const text = $('plan-item-input').value.trim();
  if (!text) return;
  planItems.push({ id: uid(), time, text });
  planItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  $('plan-item-input').value = '';
  await cStore.set('planItems_' + todayKey(), planItems);
  renderPlanItems();
}

function renderPlanItems() {
  const list = $('planner-list');
  list.innerHTML = '';
  planItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'plan-item';
    li.innerHTML = `<span class="plan-item-time">${item.time || ''}</span>
      <span class="plan-item-text">${escHtml(item.text)}</span>
      <button class="plan-del" data-id="${item.id}" aria-label="Delete">✕</button>`;
    li.querySelector('.plan-del').addEventListener('click', async () => {
      planItems = planItems.filter(p => p.id !== item.id);
      await cStore.set('planItems_' + todayKey(), planItems);
      renderPlanItems();
    });
    list.appendChild(li);
  });
}

/* ── File download helper ─────────────────────────── */
function downloadText(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Init all ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  initSettings();
  await Promise.all([
    initTheme(),
    initBgImage(),
    initGreeting(),
    initPomo(),
    initTodo(),
    initNotepad(),
    initHabits(),
    initPlanner()
  ]);
});
