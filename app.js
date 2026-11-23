import {
  MILESTONES, BADGES, BADGE_GROUPS, TRIGGERS, TIPS,
  LIFE_PER_CIGARETTE, BREATH, BREATH_TOTAL_MS,
} from './data.js';

const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'quit:v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const icon = (name, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;

const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('tr-TR');
const dateTime = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
const timeOnly = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

// ===== Durum =====

function emptyState() {
  return { profile: null, cravings: [], announced: {}, notifications: false };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('info', 'Veriler kaydedilemedi', 'Tarayıcı depolamaya izin vermiyor olabilir.');
  }
}

let state = load();

// ===== Hesaplamalar =====

function progress(now = Date.now()) {
  const { quitAt, perDay, packPrice, perPack } = state.profile;
  const elapsed = now - quitAt;
  const cigs = elapsed > 0 ? Math.floor((elapsed / DAY) * perDay) : 0;
  return {
    elapsed,
    cigs,
    saved: cigs * (packPrice / perPack),
    life: cigs * LIFE_PER_CIGARETTE,
    // Bir kayma her şeyi sıfırlar: sadece son bırakma tarihinden sonraki krizler sayılır.
    resisted: state.cravings.filter((c) => c.outcome === 'resisted' && c.at >= quitAt).length,
  };
}

function badgeValue(badge, p) {
  if (badge.type === 'time') return Math.max(0, p.elapsed);
  if (badge.type === 'money') return p.saved;
  return p.resisted;
}

function splitDuration(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

function formatDuration(ms) {
  const { d, h, m } = splitDuration(ms);
  if (d >= 365) return `${Math.floor(d / 365)} yıl ${Math.floor((d % 365) / 30)} ay`;
  if (d > 0) return `${d} gün ${h} sa`;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
}

function goalLabel(badge) {
  if (badge.type === 'money') return money.format(badge.goal);
  if (badge.type === 'cravings') return `${badge.goal} kriz`;
  return formatDuration(badge.goal);
}

function relativeDay(ms) {
  const day = (t) => new Date(t).setHours(0, 0, 0, 0);
  const diff = Math.round((day(Date.now()) - day(ms)) / DAY);
  if (diff === 0) return `Bugün, ${timeOnly.format(ms)}`;
  if (diff === 1) return `Dün, ${timeOnly.format(ms)}`;
  return `${shortDate.format(ms)}, ${timeOnly.format(ms)}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Ana sayfa =====

function renderHome() {
  const p = progress();
  const future = p.elapsed < 0;
  const { d, h, m, s } = splitDuration(p.elapsed);

  $('#timer-label').textContent = future ? 'Bırakmana kalan süre' : 'Sigarasız geçen süre';
  $('#timer-1').textContent = `${d} gün ${h} sa`;
  $('#timer-2').textContent = `${m} dk ${String(s).padStart(2, '0')} sn`;

  $('#stat-cigs').textContent = integer.format(p.cigs);
  $('#stat-money').textContent = money.format(p.saved);
  $('#stat-life').textContent = formatDuration(p.life);

  const card = $('#next-ms');
  const next = MILESTONES.find((ms) => ms.after > p.elapsed);
  const iconBox = `<span class="ms-icon">${icon('lungs')}</span>`;
  if (future) {
    card.innerHTML = `${iconBox}<h3>Bırakma günün yaklaşıyor</h3><span></span>
      <p class="muted small">${dateTime.format(state.profile.quitAt)} itibarıyla sayaç başlayacak.</p>`;
  } else if (!next) {
    card.innerHTML = `${iconBox}<h3>Tüm kilometre taşlarını geçtin 🎉</h3><span></span>
      <p class="muted small">Vücudun hiç içmemiş biri kadar sağlıklı olma yolunda.</p>`;
  } else {
    const pct = Math.min(100, (p.elapsed / next.after) * 100);
    card.innerHTML = `${iconBox}<h3>${next.title}</h3><span class="pct">%${Math.floor(pct)}</span>
      <p class="muted small">${next.text}</p>
      <div class="progress"><div class="progress-bar" style="width:${pct.toFixed(1)}%"></div></div>`;
  }
}

// ===== Sağlık =====

function renderHealth() {
  const { elapsed } = progress();
  const activeIdx = MILESTONES.findIndex((ms) => ms.after > elapsed);
  $('#timeline').innerHTML = MILESTONES.map((ms, i) => {
    const pct = Math.max(0, Math.min(100, (elapsed / ms.after) * 100));
    const status = pct >= 100 ? 'done' : i === activeIdx && elapsed > 0 ? 'active' : 'locked';
    return `<li class="ms ${status}">
      <span class="ms-dot" aria-hidden="true">${status === 'done' ? icon('check') : ''}</span>
      <div class="card ms-card">
        <h3>${ms.title}</h3><span class="pct">%${Math.floor(pct)}</span>
        <p class="muted">${ms.text}</p>
        ${status === 'active' ? `<div class="progress"><div class="progress-bar" style="width:${pct.toFixed(1)}%"></div></div>` : ''}
      </div>
    </li>`;
  }).join('');
}

// ===== Rozetler =====

let badgeFilter = 'all';

function renderBadges() {
  const p = progress();
  const earned = BADGES.filter((b) => badgeValue(b, p) >= b.goal).length;
  $('#badge-summary').textContent = `${BADGES.length} rozetten ${earned} tanesini kazandın.`;

  $('#badge-filter').innerHTML = [{ type: 'all', filter: 'Tümü' }, ...BADGE_GROUPS]
    .map((g) => `<button type="button" class="chip" role="tab" data-filter="${g.type}" aria-selected="${g.type === badgeFilter}">${g.filter}</button>`)
    .join('');

  $('#badge-groups').innerHTML = BADGE_GROUPS
    .filter((g) => badgeFilter === 'all' || g.type === badgeFilter)
    .map((group) => {
      const items = BADGES.filter((b) => b.type === group.type).map((b) => {
        const ok = badgeValue(b, p) >= b.goal;
        return `<div class="card badge ${ok ? '' : 'locked'}" title="${b.title}">
          <span class="badge-icon">${icon(ok ? b.icon : 'lock')}</span>
          <span class="badge-label">${b.label}</span>
        </div>`;
      }).join('');
      return `<section class="badge-group"><h2 class="section-title">${group.title}</h2><div class="badge-grid">${items}</div></section>`;
    }).join('');
}

$('#badge-filter').addEventListener('click', (e) => {
  const type = e.target.closest('[data-filter]')?.dataset.filter;
  if (!type) return;
  badgeFilter = type;
  renderBadges();
});

// ===== Günlük =====

function triggersOf(c) {
  return c.triggers ?? (c.trigger ? [c.trigger] : []);
}

function renderLog() {
  const list = [...state.cravings].sort((a, b) => b.at - a.at);
  const resisted = list.filter((c) => c.outcome === 'resisted').length;
  const counts = {};
  for (const c of list) for (const t of triggersOf(c)) counts[t] = (counts[t] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  $('#log-summary').innerHTML = `<span class="ms-icon">${icon('chart')}</span>
    <div><strong>${resisted} kriz atlatıldı</strong>
    <span class="muted small">${top ? `En sık tetikleyici: ${top[0]}` : 'Kayıt ekledikçe örüntülerin burada görünecek.'}</span></div>`;

  $('#log-list').innerHTML = list.length
    ? list.map((c) => {
        const tr = triggersOf(c);
        return `<li class="card log-item">
          <div>
            <strong>${relativeDay(c.at)}</strong>
            <div class="log-meta">${icon('zap')}Şiddet: ${c.intensity}${tr.length ? ` · ${tr.join(', ')}` : ''}</div>
          </div>
          <span class="pill ${c.outcome}">${c.outcome === 'resisted' ? 'Atlattım' : 'İçtim'}</span>
          <button class="icon-btn" data-delete="${c.id}" type="button" aria-label="Kaydı sil">${icon('trash')}</button>
          ${c.note ? `<p class="log-note">“${escapeHtml(c.note)}”</p>` : ''}
        </li>`;
      }).join('')
    : `<li class="empty">Henüz kayıt yok.<br>Canın çektiğinde ana sayfadaki butona bas; burada birikecek.</li>`;
}

$('#log-list').addEventListener('click', (e) => {
  const id = e.target.closest('[data-delete]')?.dataset.delete;
  if (!id || !confirm('Bu kayıt silinsin mi?')) return;
  state.cravings = state.cravings.filter((c) => c.id !== id);
  save();
  renderLog();
});

// ===== Başarılar ve bildirimler =====

// Yeni kazanılan rozet ve kilometre taşlarını duyurur. silent: sadece işaretle.
function checkAchievements({ silent = false } = {}) {
  const p = progress();
  const badges = BADGES.filter((b) => !state.announced[b.id] && badgeValue(b, p) >= b.goal);
  const milestones = MILESTONES.filter((ms) => !state.announced[ms.id] && p.elapsed >= ms.after);
  if (!badges.length && !milestones.length) return;

  for (const x of [...badges, ...milestones]) state.announced[x.id] = Date.now();
  save();
  if (silent) return;

  // Uzun aradan sonra açıldığında ekranı doldurmamak için: en büyük rozet kutlanır, kalanlar kısa kart olur.
  const [best, ...rest] = badges.reverse();
  if (best) {
    celebrate(best, p);
    notify('Yeni rozet: ' + best.title, celebrateText(best, p));
  }
  for (const b of rest.slice(0, 2)) toast(b.icon, 'Yeni rozet', b.title);
  for (const ms of milestones.slice(-2)) {
    toast('lungs', `${ms.title} tamamlandı`, ms.text);
    notify(`${ms.title} tamamlandı`, ms.text);
  }
  if (currentView !== 'home') renderCurrent();
}

function celebrateText(badge, p) {
  if (badge.type === 'time') return `${formatDuration(p.elapsed)}dir sigarasızsın. Harika ilerleme! Böyle devam et.`;
  if (badge.type === 'money') return `Sigaraya harcamadığın ${money.format(p.saved)} artık cebinde.`;
  return `${p.resisted} krizi atlattın. İrade kasın her seferinde güçleniyor.`;
}

function celebrate(badge, p) {
  $('#celebrate-title').textContent = `${badge.title} rozetini kazandın!`;
  $('#celebrate-text').textContent = celebrateText(badge, p);
  const dlg = $('#celebrate');
  if (dlg.open) dlg.close();
  // Kriz sayfası açıksa kutlamayı onun üstünde göster.
  dlg.showModal();
}

function toast(iconName, title, body) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="ms-icon">${icon(iconName)}</span><div><strong></strong><p class="muted small"></p></div>`;
  el.querySelector('strong').textContent = title;
  el.querySelector('p').textContent = body;
  $('#toasts').append(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 4500);
}

async function notify(title, body) {
  if (!state.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
    else new Notification(title, { body, icon: 'icons/icon-192.png' });
  } catch {
    // Bildirim gösterilemezse uygulama içi kart zaten gösterildi.
  }
}

// ===== Ayarlar =====

function renderSettings() {
  const p = state.profile;
  const rows = [
    ['calendar', 'Bırakma tarihi ve saati', dateTime.format(p.quitAt), 'quitDate'],
    ['cigarette', 'Günde içilen sigara', p.perDay, 'perDay'],
    ['banknote', 'Paket fiyatı', money.format(p.packPrice), 'packPrice'],
    ['package', 'Paketteki sigara sayısı', p.perPack, 'perPack'],
  ];
  $('#plan-list').innerHTML = rows.map(([ic, label, value, field]) => `
    <button class="row" type="button" data-edit="${field}">
      ${icon(ic)}
      <span class="row-body"><span>${label}</span><span class="row-sub">${value}</span></span>
      ${icon('chevron-right', 'chev')}
    </button>`).join('');
  renderNotifications();
}

function renderNotifications() {
  const toggle = $('#notif-toggle');
  const status = $('#notif-status');
  if (!('Notification' in window)) {
    status.textContent = 'Bu tarayıcı desteklemiyor. iPhone’da önce “Ana Ekrana Ekle” ile yükle.';
    toggle.disabled = true;
    toggle.checked = false;
    return;
  }
  if (Notification.permission === 'denied') {
    status.textContent = 'İzin reddedildi. Tarayıcı ayarlarından bu siteye izin ver.';
    toggle.disabled = true;
    toggle.checked = false;
    return;
  }
  toggle.disabled = false;
  toggle.checked = state.notifications && Notification.permission === 'granted';
  status.textContent = toggle.checked
    ? 'Yeni rozet ve sağlık kazanımlarında haber vereceğiz.'
    : 'Kazanımlarını kaçırmamak için aç.';
}

$('#notif-toggle').addEventListener('change', async (e) => {
  if (e.target.checked) {
    const result = await Notification.requestPermission();
    state.notifications = result === 'granted';
    if (state.notifications) notify('Bildirimler açık', 'Yeni bir kazanım olduğunda sana haber vereceğiz.');
  } else {
    state.notifications = false;
  }
  save();
  renderNotifications();
});

$('#plan-list').addEventListener('click', (e) => {
  const field = e.target.closest('[data-edit]')?.dataset.edit;
  if (!field) return;
  const form = $('#edit-form');
  fillProfile(form, state.profile);
  $('#edit-warning').hidden = true;
  $('#edit').showModal();
  form.elements[field].focus();
});

$('#edit-form').addEventListener('input', (e) => {
  if (e.target.name === 'quitDate' || e.target.name === 'quitTime') $('#edit-warning').hidden = false;
});

$('#edit-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  const next = readProfile(e.target);
  if (next.quitAt !== state.profile.quitAt) state.announced = {};
  state.profile = next;
  checkAchievements({ silent: true });
  save();
  $('#edit').close();
  renderSettings();
  toast('check', 'Kaydedildi', 'Bırakma planın güncellendi.');
});

// ===== Profil alanları =====

// Şablonları yerleştirir; aynı şablon iki formda kullanıldığı için id'leri önekler.
for (const [n, host] of $$('[data-tpl]').entries()) {
  const frag = $('#' + host.dataset.tpl).content.cloneNode(true);
  for (const el of frag.querySelectorAll('[id]')) el.id = `${el.id}-${n}`;
  for (const el of frag.querySelectorAll('[for]')) el.htmlFor = `${el.htmlFor}-${n}`;
  host.append(frag);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function fillProfile(form, profile) {
  const d = new Date(profile?.quitAt ?? Date.now());
  form.elements.quitDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  form.elements.quitTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  form.elements.perDay.value = profile?.perDay ?? 20;
  form.elements.perPack.value = profile?.perPack ?? 20;
  form.elements.packPrice.value = profile?.packPrice ?? '';
}

function readProfile(form) {
  const f = form.elements;
  return {
    quitAt: new Date(`${f.quitDate.value}T${f.quitTime.value}`).getTime(),
    perDay: Number(f.perDay.value),
    packPrice: Number(f.packPrice.value),
    perPack: Number(f.perPack.value),
  };
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-step-by]');
  if (!btn) return;
  const input = btn.closest('.stepper').querySelector('input');
  const min = Number(input.min) || 0;
  const max = Number(input.max) || Infinity;
  const value = Math.round(((Number(input.value) || 0) + Number(btn.dataset.stepBy)) * 100) / 100;
  input.value = Math.min(max, Math.max(min, value));
});

// ===== Kurulum =====

const onboarding = $('#onboarding');
let obStep = 0;

function showObStep(n) {
  obStep = n;
  for (const s of $$('[data-ob]', onboarding)) s.hidden = Number(s.dataset.ob) !== n;
  window.scrollTo(0, 0);
}

function obStepValid() {
  const fields = $$('input', $(`[data-ob="${obStep}"]`, onboarding));
  return fields.every((f) => f.reportValidity());
}

onboarding.addEventListener('click', (e) => {
  if (e.target.closest('[data-ob-next]') && obStepValid()) showObStep(obStep + 1);
  if (e.target.closest('[data-ob-back]')) showObStep(obStep - 1);
});

onboarding.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!obStepValid()) return;
  state.profile = readProfile(onboarding);
  checkAchievements({ silent: true });
  save();
  showApp();
});

// ===== Veri =====

$('#export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quit-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#import-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const p = data?.profile;
    if (!p || !Number.isFinite(p.quitAt) || !(p.perDay > 0) || !(p.perPack > 0) || !Array.isArray(data.cravings)) {
      throw new Error('invalid');
    }
    if (!confirm('Mevcut verilerin yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return;
    state = { ...emptyState(), ...data };
    save();
    location.reload();
  } catch {
    toast('info', 'İçe aktarılamadı', 'Dosya geçerli bir Quit yedeği değil.');
  }
});

$('#reset-btn').addEventListener('click', () => {
  if (!confirm('Tüm ilerlemen, kayıtların ve ayarların bu cihazdan kalıcı olarak silinecek. Emin misin?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.hash = '';
  location.reload();
});

// ===== Gezinme =====

const VIEWS = ['home', 'health', 'badges', 'log', 'settings'];
let currentView = 'home';

function showView(name) {
  currentView = VIEWS.includes(name) ? name : 'home';
  for (const v of $$('[data-view]')) v.hidden = v.dataset.view !== currentView;
  for (const a of $$('[data-tab]')) {
    if (a.dataset.tab === currentView) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  renderCurrent();
  window.scrollTo(0, 0);
}

function renderCurrent() {
  if (currentView === 'home') renderHome();
  if (currentView === 'health') renderHealth();
  if (currentView === 'badges') renderBadges();
  if (currentView === 'log') renderLog();
  if (currentView === 'settings') renderSettings();
}

window.addEventListener('hashchange', () => showView(location.hash.slice(1)));

// Tüm sayfalarda [data-close] kapatır.
for (const dlg of $$('dialog')) {
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target === dlg) dlg.close();
  });
}

// ===== Kriz anı =====

const craving = $('#craving');
const cravingForm = $('#craving-form');
let breathTimer = null;
let clockTimer = null;
let tipIdx = 0;
let slipUndo = null;

function showCravingStep(step) {
  for (const el of $$('[data-step]', craving)) el.hidden = el.dataset.step !== step;
  craving.scrollTop = 0;
}

function nextTip() {
  tipIdx = (tipIdx + 1 + Math.floor(Math.random() * (TIPS.length - 1))) % TIPS.length;
  $('#tip-text').textContent = TIPS[tipIdx];
}

function fmtClock(ms) {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

function startBreathing() {
  const glow = $('#breath-glow');
  const ring = $('#breath-ring');
  const label = $('#breath-label');
  const count = $('#breath-count');
  const bar = $('#breath-progress');
  const time = $('#breath-time');
  const started = Date.now();
  let phase = 0;
  let phaseEnd = 0;

  bar.style.transition = 'none';
  bar.style.width = '0';
  requestAnimationFrame(() => {
    bar.style.transition = `width ${BREATH_TOTAL_MS}ms linear`;
    bar.style.width = '100%';
  });

  clockTimer = setInterval(() => {
    const spent = Math.min(BREATH_TOTAL_MS, Date.now() - started);
    time.textContent = `${fmtClock(spent)} / ${fmtClock(BREATH_TOTAL_MS)}`;
    const left = Math.ceil((phaseEnd - Date.now()) / 1000);
    if (spent < BREATH_TOTAL_MS) count.textContent = `(${Math.max(1, left)} sn)`;
  }, 250);

  const step = () => {
    if (Date.now() - started >= BREATH_TOTAL_MS) {
      clearInterval(clockTimer);
      label.textContent = 'Harika 🌿';
      count.textContent = 'İstek dalgası geçiyor';
      glow.style.transitionDuration = '1500ms';
      glow.style.transform = 'scale(0.8)';
      return;
    }
    const b = BREATH[phase % BREATH.length];
    phaseEnd = Date.now() + b.ms;
    label.textContent = b.label;
    glow.style.transitionDuration = `${b.ms}ms`;
    glow.style.transform = `scale(${b.scale})`;
    // Halka her aşamada baştan dolar.
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = '100';
    ring.getBoundingClientRect();
    ring.style.transition = `stroke-dashoffset ${b.ms}ms linear`;
    ring.style.strokeDashoffset = '0';
    phase++;
    breathTimer = setTimeout(step, b.ms);
  };
  step();
}

function stopBreathing() {
  clearTimeout(breathTimer);
  clearInterval(clockTimer);
  const glow = $('#breath-glow');
  glow.style.transitionDuration = '0ms';
  glow.style.transform = 'scale(0.6)';
  const ring = $('#breath-ring');
  ring.style.transition = 'none';
  ring.style.strokeDashoffset = '100';
}

$('#triggers').innerHTML = TRIGGERS
  .map((t) => `<label><input type="checkbox" name="triggers" value="${t}"><span>${t}</span></label>`)
  .join('');

cravingForm.note.addEventListener('input', (e) => {
  $('#note-count').textContent = `${e.target.value.length} / 200`;
});

$('#craving-btn').addEventListener('click', () => {
  cravingForm.reset();
  $('#note-count').textContent = '0 / 200';
  $('details', cravingForm).open = false;
  showCravingStep('breathe');
  nextTip();
  craving.showModal();
  startBreathing();
});

$('#tip-next').addEventListener('click', nextTip);
craving.addEventListener('close', stopBreathing);

cravingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const outcome = e.submitter?.value === 'slipped' ? 'slipped' : 'resisted';
  const entry = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    at: Date.now(),
    intensity: Number(cravingForm.intensity.value) || 3,
    triggers: $$('input[name="triggers"]:checked', cravingForm).map((i) => i.value),
    note: cravingForm.note.value.trim(),
    outcome,
  };
  state.cravings.push(entry);

  if (outcome === 'resisted') {
    save();
    craving.close();
    toast('zap', 'Bir krizi daha atlattın', 'İstek geçti, sen kaldın. Harika iş!');
    checkAchievements();
  } else {
    // Bir kez içmek başa döndürür: sayaç, tasarruf ve tüm rozetler sıfırlanır.
    slipUndo = { quitAt: state.profile.quitAt, announced: state.announced, id: entry.id };
    state.profile.quitAt = entry.at;
    state.announced = {};
    checkAchievements({ silent: true });
    save();
    stopBreathing();
    showCravingStep('slip');
  }
  renderCurrent();
});

$('#undo-slip').addEventListener('click', () => {
  if (!slipUndo) return;
  state.profile.quitAt = slipUndo.quitAt;
  state.announced = slipUndo.announced;
  state.cravings = state.cravings.filter((c) => c.id !== slipUndo.id);
  slipUndo = null;
  save();
  craving.close();
  renderCurrent();
  toast('check', 'Geri alındı', 'Sayacın ve rozetlerin eski haline döndü.');
});

// ===== Başlangıç =====

function showApp() {
  onboarding.hidden = true;
  $('#app').hidden = false;
  showView(location.hash.slice(1));
}

function tick() {
  if (!state.profile) return;
  if (currentView === 'home') renderHome();
  checkAchievements();
}

if (state.profile) {
  showApp();
  checkAchievements();
} else {
  fillProfile(onboarding, null);
  onboarding.hidden = false;
  showObStep(0);
}

setInterval(tick, 1000);
// Sağlık sekmesindeki ilerlemeler dakikada bir güncellenir.
setInterval(() => currentView === 'health' && renderHealth(), 60 * 1000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
