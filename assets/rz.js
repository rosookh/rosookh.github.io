/* Rosookh shared runtime: settings, storage, points and levels, streak, daily goal, tasks, badges,
   bottom navigation, letter pattern, overlays (splash, sheets, toasts), backup, error reports, offline worker. */
(function(){
  const d = document.documentElement;
  const ls = {
    get(k, def){ try{ const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }catch(e){ return def; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const ST_KEY = 'rz-settings';
  const stored = ls.get(ST_KEY, {});
  // light is the default; an old "auto" that was never chosen on purpose becomes light
  if(stored.theme === 'auto' && !stored.themeSet) stored.theme = 'light';
  const st = Object.assign({ theme:'light', fs:'m', name:'', goal:'m', dua:true, notif:false, sound:true }, stored);
  function apply(){ d.setAttribute('data-theme', st.theme); d.setAttribute('data-fs', st.fs); }
  apply();
  const script = document.currentScript;
  const base = script ? script.src.replace(/assets\/rz\.js.*$/, '') : '/';
  const AR = n => String(n).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[x]);
  const dayStr = t => t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
  const today = () => dayStr(new Date());
  const addDays = (s, n) => { const [y, m, dd] = s.split('-').map(Number); const t = new Date(y, m - 1, dd); t.setDate(t.getDate() + n); return dayStr(t); };
  const diffDays = (a, b) => { const p = s => { const [y, m, dd] = s.split('-').map(Number); return Date.UTC(y, m - 1, dd); }; return Math.round((p(b) - p(a)) / 864e5); };
  const dateAR = s => { const [y, m, dd] = s.split('-').map(Number); return AR(dd) + '/' + AR(m); };
  // Arabic counted noun: forms = [one, two, few (3-10), many (11+)]
  const count = (n, f) => n === 1 ? f[0] : n === 2 ? f[1] : (n % 100 >= 3 && n % 100 <= 10) ? AR(n) + ' ' + f[2] : AR(n) + ' ' + f[3];
  const Q_FORMS = ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'];
  const DAY_FORMS = ['يوم واحد', 'يومان', 'أيام', 'يومًا'];
  const PT_FORMS = ['نقطة واحدة', 'نقطتان', 'نقاط', 'نقطة'];
  // tiny seeded random, used for the pattern and for "same for everyone today" picks
  function seeded(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const daySeed = s => Number((s || today()).replace(/-/g, ''));

  /* ---------- mistakes notebook (read side; the library writes it) ---------- */
  function mistakes(){ return ls.get('rz-mistakes', {}); }
  function mistakesDue(){ const now = Date.now(); return Object.values(mistakes()).filter(x => x.due <= now).length; }

  /* ---------- streak: grows on any day the daily goal is reached or the daily challenge is done.
     A "day off" (earned every 7 days, up to 2) or vacation mode covers missed days. ---------- */
  const SK = 'rz-streak';
  const streakRaw = () => Object.assign({ last:null, count:0, freeze:0, vac:null }, ls.get(SK, {}));
  function onVacation(s, day){ return !!(s.vac && s.vac.from <= day && day <= s.vac.to); }
  function coverage(s){ // how the gap since the last active day is covered
    if(!s.last) return { alive:false, need:0 };
    const gap = diffDays(s.last, today());
    if(gap <= 1) return { alive:true, need:0 };
    let missed = 0; for(let k = 1; k < gap; k++){ if(!onVacation(s, addDays(s.last, k))) missed++; }
    // today itself may still be done; while on vacation today counts as covered
    return { alive: missed <= s.freeze, need: missed };
  }
  function streak(){
    const s = streakRaw(); const c = coverage(s);
    return { count: c.alive ? s.count : 0, doneToday: s.last === today(), freeze: s.freeze, vac: s.vac && s.vac.to >= today() ? s.vac : null, usingFreeze: c.alive ? c.need : 0 };
  }
  function markDailyDone(){
    const s = streakRaw(); if(s.last === today()) return s.count;
    const c = coverage(s);
    if(c.alive){ s.freeze -= c.need; s.count = s.count + 1; } else s.count = 1;
    s.last = today();
    if(s.count % 7 === 0 && s.freeze < 2) s.freeze++;
    ls.set(SK, s); syncState(); return s.count;
  }
  function setVacation(days){
    const s = streakRaw();
    s.vac = days ? { from: today(), to: addDays(today(), days - 1) } : null;
    ls.set(SK, s);
  }

  /* ---------- points, levels, daily log ---------- */
  const GK = 'rz-game';
  const G = Object.assign({ xp:0, log:{}, badges:{}, best60:0, quizzes:0, tasks:null, taskMonths:{}, riddles:0, hifzDays:0 }, ls.get(GK, {}));
  const gsave = () => ls.set(GK, G);
  const TIERS = [['wood','خشبي'], ['bronze','برونزي'], ['silver','فضي'], ['gold','ذهبي'], ['diamond','ماسي']];
  const XP_AT = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200];
  function level(xp){
    xp = xp == null ? G.xp : xp;
    let i = 0; while(i + 1 < XP_AT.length && xp >= XP_AT[i + 1]) i++;
    const [cls, tname] = TIERS[Math.floor(i / 3)]; const step = i % 3 + 1;
    const next = XP_AT[i + 1]; const cur = XP_AT[i];
    const nextName = next != null ? TIERS[Math.floor((i + 1) / 3)][1] + ' ' + AR((i + 1) % 3 + 1) : null;
    return { i, cls, tier:tname, step, name: tname + ' ' + AR(step), xp, cur, next, nextName, left: next != null ? next - xp : 0, pct: next != null ? (xp - cur) / (next - cur) : 1 };
  }
  const GOALS = { l:{ t:'خفيف', x:30, s:'سؤالان أو ثلاثة في اليوم' }, m:{ t:'متوسط', x:60, s:'اختبار قصير في اليوم' }, h:{ t:'جاد', x:120, s:'اختباران أو أكثر في اليوم' } };
  const goal = () => GOALS[st.goal] || GOALS.m;
  const dayLog = (k = today()) => G.log[k] || { a:0, c:0, x:0, ch:{} };
  function trimLog(){ const keys = Object.keys(G.log).sort(); while(keys.length > 400) delete G.log[keys.shift()]; }

  /* ---------- daily tasks (3 a day, same templates for everyone, chosen by date) ---------- */
  const TASKS = [
    { id:'c15', t:'أجب ١٥ إجابة صحيحة', n:15, ev:'correct' },
    { id:'c25', t:'أجب ٢٥ إجابة صحيحة', n:25, ev:'correct' },
    { id:'hunt', t:'حلّ ٣ أسئلة «صيد الأحكام» صحيحة', n:3, ev:'hunt' },
    { id:'nb', t:'راجع سؤالين من دفتر أخطائك', n:2, ev:'nb', need:'nb' },
    { id:'perfect', t:'أنهِ اختبارًا بلا أي خطأ', n:1, ev:'perfect' },
    { id:'daily', t:'أتمّ تحدّي اليوم', n:1, ev:'daily' },
    { id:'speed', t:'العب جولة سريعة', n:1, ev:'speed' },
    { id:'riddle', t:'حلّ حزورة اليوم', n:1, ev:'riddle' },
    { id:'img', t:'أجب سؤالين على صور المخارج', n:2, ev:'img' },
    { id:'hard', t:'أجب ٥ أسئلة صعبة صحيحة', n:5, ev:'hard' },
    { id:'hifz', t:'راجع سورة من محفوظك', n:1, ev:'hifz' }
  ];
  function tasks(){
    if(!G.tasks || G.tasks.day !== today()){
      const r = seeded(daySeed() * 7 + 3); const pool = TASKS.filter(t => t.need !== 'nb' || Object.keys(mistakes()).length >= 2);
      const pick = []; const used = new Set();
      // one "answer correctly" task, two others
      const c = pool.filter(t => t.ev === 'correct'); pick.push(c[Math.floor(r() * c.length)]); used.add('correct');
      while(pick.length < 3){ const t = pool[Math.floor(r() * pool.length)]; if(!used.has(t.ev)){ used.add(t.ev); pick.push(t); } }
      G.tasks = { day: today(), list: pick.map(t => ({ id:t.id, p:0 })), done:false }; gsave();
    }
    return G.tasks.list.map(x => { const t = TASKS.find(y => y.id === x.id) || TASKS[0]; return { ...t, p: Math.min(x.p, t.n), done: x.p >= t.n }; });
  }
  function taskEvent(ev, n = 1){
    tasks(); let changed = false;
    G.tasks.list.forEach(x => { const t = TASKS.find(y => y.id === x.id); if(t && t.ev === ev && x.p < t.n){ x.p = Math.min(t.n, x.p + n); changed = true; } });
    if(changed && !G.tasks.done && tasks().every(t => t.done)){
      G.tasks.done = true; const mk = today().slice(0, 7); G.taskMonths[mk] = (G.taskMonths[mk] || 0) + 1;
      gsave(); toast('أتممت مهام اليوم الثلاث! 🎉'); checkBadges();
    } else if(changed) gsave();
  }

  /* ---------- badges ---------- */
  const correctAll = () => Object.values(G.log).reduce((s, x) => s + x.c, 0);
  const BADGES = [
    { id:'first', e:'🌱', t:'البداية', s:'أنهيت أول اختبار', ok: () => G.quizzes >= 1 },
    { id:'s7', e:'🔥', t:'أسبوع كامل', s:'٧ أيام متتالية', ok: () => streakRaw().count >= 7 },
    { id:'s30', e:'🌙', t:'شهر من المثابرة', s:'٣٠ يومًا متتاليًا', ok: () => streakRaw().count >= 30 },
    { id:'s100', e:'💎', t:'مئة يوم', s:'١٠٠ يوم متتالٍ', ok: () => streakRaw().count >= 100 },
    { id:'c100', e:'✅', t:'مئة إجابة', s:'١٠٠ إجابة صحيحة', ok: () => correctAll() >= 100 },
    { id:'c500', e:'🏅', t:'خمسمئة إجابة', s:'٥٠٠ إجابة صحيحة', ok: () => correctAll() >= 500 },
    { id:'c1000', e:'🏆', t:'ألف إجابة', s:'١٠٠٠ إجابة صحيحة', ok: () => correctAll() >= 1000 },
    { id:'hard', e:'⭐', t:'بلا خطأ', s:'اختبار صعب بلا أي خطأ', ok: () => !!G.badges.hard },
    { id:'nbEmpty', e:'📒', t:'دفتر نظيف', s:'أفرغت دفتر أخطائك', ok: () => !!G.badges.nbEmpty },
    { id:'gold', e:'🥇', t:'باب ذهبي', s:'نجحت في اختبار ختام باب', ok: () => !!G.badges.gold },
    { id:'bronze', e:'🥉', t:'المستوى البرونزي', s:'وصلت إلى برونزي ١', ok: () => level().i >= 3 },
    { id:'silver', e:'🥈', t:'المستوى الفضي', s:'وصلت إلى فضي ١', ok: () => level().i >= 6 },
    { id:'goldLv', e:'👑', t:'المستوى الذهبي', s:'وصلت إلى ذهبي ١', ok: () => level().i >= 9 },
    { id:'diamond', e:'💠', t:'المستوى الماسي', s:'وصلت إلى ماسي ١', ok: () => level().i >= 12 },
    { id:'speed', e:'⚡', t:'سريع البديهة', s:'١٥ إجابة صحيحة في جولة سريعة', ok: () => G.best60 >= 15 },
    { id:'riddle', e:'🧩', t:'محبّ الحزورات', s:'حللت ٧ حزورات يومية', ok: () => G.riddles >= 7 },
    { id:'hifz', e:'📖', t:'مراجع المحفوظ', s:'راجعت محفوظك ١٠ أيام', ok: () => G.hifzDays >= 10 },
    { id:'month', e:'🗓️', t:'وسام الشهر', s:'أتممت مهام ٢٠ يومًا في شهر واحد', ok: () => Object.values(G.taskMonths).some(n => n >= 20) }
  ];
  function checkBadges(){
    const fresh = [];
    BADGES.forEach(b => { if(!G.badges['got_' + b.id] && b.ok()){ G.badges['got_' + b.id] = today(); fresh.push(b); } });
    if(fresh.length){ gsave(); fresh.forEach((b, k) => setTimeout(() => toast(b.e + ' وسام جديد: ' + b.t), 600 + k * 2600)); }
    return fresh;
  }
  function flag(k){ if(!G.badges[k]){ G.badges[k] = today(); gsave(); checkBadges(); } }

  /* record one answered question. Returns what changed, so the quiz can celebrate. */
  function answer(o){
    const k = today(); const L = G.log[k] || (G.log[k] = { a:0, c:0, x:0, ch:{} });
    const before = level(); const goalBefore = L.x >= goal().x;
    L.a++; if(o.ok){ L.c++; L.x += o.xp || 0; G.xp += o.xp || 0; }
    if(o.ch){ const c = L.ch[o.ch] || (L.ch[o.ch] = [0, 0]); c[0]++; if(o.ok) c[1]++; }
    trimLog(); gsave();
    if(o.ok){ taskEvent('correct'); if(o.type === 'hunt') taskEvent('hunt'); if(o.type === 'img' || o.type === 'riddle') taskEvent('img'); if(o.d >= 3) taskEvent('hard'); }
    if(o.nb) taskEvent('nb');
    const after = level(); const goalNow = L.x >= goal().x;
    let streakNow = null; if(goalNow && !goalBefore) streakNow = markDailyDone();
    checkBadges(); syncState();
    return { levelUp: after.i > before.i ? after : null, goalReached: goalNow && !goalBefore, streak: streakNow };
  }
  function quizDone(o){ // {kind, n, wrong, lvl}
    G.quizzes++; gsave();
    if(o.n >= 5 && o.wrong === 0){ taskEvent('perfect'); if(o.lvl === '3' || o.lvl === '4') flag('hard'); }
    if(o.kind === 'daily') taskEvent('daily');
    if(o.kind === 'speed') taskEvent('speed');
    checkBadges();
  }

  /* plain points (e.g. a hifz review), counted for the daily goal and the streak */
  function addXP(n){
    const k = today(); const L = G.log[k] || (G.log[k] = { a:0, c:0, x:0, ch:{} });
    const before = level(); const goalBefore = L.x >= goal().x;
    L.x += n; G.xp += n; gsave();
    if(L.x >= goal().x && !goalBefore) markDailyDone();
    checkBadges(); syncState();
    const after = level(); return { levelUp: after.i > before.i ? after : null, goalReached: L.x >= goal().x && !goalBefore };
  }

  /* ---------- hifz review: the user picks memorised surahs; each day 1–2 are suggested ---------- */
  const HK = 'hifz-review';
  const hifzData = () => Object.assign({ sel:[], names:{}, last:{}, miss:{}, today:null }, ls.get(HK, {}));
  function hifzToday(){
    const h = hifzData(); if(!h.sel.length) return { list:[], h };
    if(h.today && h.today.day === today()) return { list: h.today.list, h };
    const score = n => (h.last[n] ? diffDays(h.last[n], today()) : 999) + (h.miss[n] || 0) * 3;
    const list = h.sel.slice().sort((a, b) => score(b) - score(a) || a - b).slice(0, h.sel.length > 3 ? 2 : 1);
    h.today = { day: today(), list, done:[] }; ls.set(HK, h);
    return { list, h };
  }
  function hifzDone(n){
    const { h } = hifzToday(); h.last[n] = today(); h.miss[n] = 0;
    if(h.today && !h.today.done.includes(n)) h.today.done.push(n);
    ls.set(HK, h);
    const r = addXP(20);
    if(h.today && h.today.list.every(x => h.today.done.includes(x)) && G.hifzDay !== today()){ G.hifzDay = today(); G.hifzDays++; gsave(); taskEvent('hifz'); checkBadges(); }
    return r;
  }

  /* ---------- notifications: share a tiny state with the offline worker through the cache ---------- */
  function syncState(){
    try{
      if(!('caches' in window)) return;
      const s = streak(); const L = dayLog();
      const body = JSON.stringify({ day: today(), done: s.doneToday || L.x >= goal().x, streak: s.count, name: st.name, on: !!st.notif });
      caches.open('rz-state').then(c => c.put(base + '__state', new Response(body, { headers:{ 'Content-Type':'application/json' } }))).catch(() => {});
    }catch(e){}
  }

  async function enableNotif(){ // returns a short message for the user
    if(!('Notification' in window) || !('serviceWorker' in navigator)) return 'جوالك أو متصفحك لا يدعم التذكير.';
    const p = await Notification.requestPermission();
    if(p !== 'granted') return 'لم تُمنح الموافقة على الإشعارات. يمكنك تفعيلها لاحقًا من إعدادات الجوال.';
    try{
      const reg = await navigator.serviceWorker.ready;
      if('periodicSync' in reg){
        const ps = await navigator.permissions.query({ name:'periodic-background-sync' }).catch(() => ({ state:'denied' }));
        if(ps.state === 'granted') await reg.periodicSync.register('rz-daily', { minInterval: 12 * 3600 * 1000 });
        else { RZ.setSettings({ notif:true }); return 'فُعّل التذكير. قد لا يصل في كل الأيام، لأن الجوال يحدّد وقته.'; }
      }
    }catch(e){}
    RZ.setSettings({ notif:true });
    return 'فُعّل التذكير اليومي.';
  }
  async function disableNotif(){
    RZ.setSettings({ notif:false });
    try{ const reg = await navigator.serviceWorker.ready; if(reg.periodicSync) await reg.periodicSync.unregister('rz-daily'); }catch(e){}
  }

  /* ---------- error reports ---------- */
  const EMAIL = 'alqaisi.fatima@gmail.com';
  function report(info){
    const lines = ['السلام عليكم،', '', 'وجدت ملاحظة على هذا السؤال في تطبيق «رسوخ»:', ''];
    if(info){ for(const [k, v] of Object.entries(info)) if(v) lines.push(k + ': ' + v); }
    lines.push('', 'الملاحظة:', '');
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('رسوخ: ملاحظة على سؤال') + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* ---------- backup ---------- */
  const BK = k => /^(rz-|tajweed-library|hifz-)/.test(k) && k !== 'rz-resume';
  function backupData(){
    const data = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(BK(k)) data[k] = localStorage.getItem(k); }
    return { app:'rosookh', format:1, date: today(), data };
  }
  function restoreData(obj){
    if(!obj || obj.app !== 'rosookh' || !obj.data) throw new Error('bad');
    Object.keys(localStorage).filter(BK).forEach(k => localStorage.removeItem(k));
    Object.entries(obj.data).forEach(([k, v]) => { if(BK(k)) localStorage.setItem(k, v); });
    ls.set('rz-backup-last', today());
  }

  /* ---------- icons ---------- */
  const P = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const ICONS = {
    home:`<svg viewBox="0 0 24 24" ${P}><path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/></svg>`,
    tests:`<svg viewBox="0 0 24 24" ${P}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 10l2 2 4-4M9 16h6"/></svg>`,
    hifz:`<svg viewBox="0 0 24 24" ${P}><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/></svg>`,
    progress:`<svg viewBox="0 0 24 24" ${P}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
    settings:`<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>`,
    close:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    back:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
    chev:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
    down:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
    flame:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><path d="M12 22c4 0 7-2.8 7-6.8 0-3.5-2.4-5.6-4-8.2-.6 2-1.6 3-3 3.5C12.5 7 11 4 8.5 2 9 6.5 5 9 5 15.2 5 19.2 8 22 12 22z"/></svg>`,
    book:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6M9 11h6"/></svg>`,
    sliders:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>`,
    share:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>`,
    grid:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>`,
    path:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 5.5c6 1 8 3 8.5 4.7M16 13.8C15 16 12 18 8 18.6"/></svg>`,
    bolt:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.8"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>`,
    puzzle:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z"/></svg>`,
    wave:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><path d="M3 12h3l2-5 4 10 2-5h7"/></svg>`,
    mistake:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.8"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M9 9l6 6M15 9l-6 6"/></svg>`,
    timer:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/></svg>`,
    check:`<svg viewBox="0 0 24 24" ${P} stroke-width="2.4"><path d="M5 12l5 5L19 7"/></svg>`,
    x:`<svg viewBox="0 0 24 24" ${P} stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    mail:`<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
    play:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.8"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
    heart:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.2 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.8 0 6.1 4 4.6 7.6C19.5 16.4 12 21 12 21z"/></svg>`,
    lock:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.9"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
    resume:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.8"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"/><path d="M11 9l4 3-4 3z"/></svg>`,
    download:`<svg viewBox="0 0 24 24" ${P}><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>`,
    upload:`<svg viewBox="0 0 24 24" ${P}><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>`,
    bell:`<svg viewBox="0 0 24 24" ${P}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>`
  };
  const icon = k => ICONS[k] || '';

  /* ---------- decorative letter pattern ---------- */
  function pattern(host, opt = {}){
    const w = opt.w || 400, h = opt.h || 300, r = seeded(opt.seed || 11), L = 'رسوخض';
    const n = opt.n || Math.round(w * h / 2700);
    const cells = Math.ceil(Math.sqrt(n)), cw = w / cells, ch = h / cells; let out = '', k = 0;
    for(let i = 0; i < cells; i++) for(let j = 0; j < cells; j++){
      if(k >= n) break;
      const x = cw * (i + .2 + r() * .6), y = ch * (j + .35 + r() * .5), s = 24 + Math.floor(r() * 22), rot = Math.floor(r() * 50) - 25;
      out += `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" font-size="${s}" fill="currentColor" text-anchor="middle" transform="rotate(${rot} ${x.toFixed(0)} ${y.toFixed(0)})">${L[k % 5]}</text>`;
      if(r() < .35) out += `<circle cx="${(x + cw * .45).toFixed(0)}" cy="${(y - ch * .3).toFixed(0)}" r="2.2" fill="currentColor"/>`;
      k++;
    }
    const p = document.createElement('div'); p.className = 'rz-pat'; p.setAttribute('aria-hidden', 'true');
    p.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${out}</svg>`;
    host.prepend(p); return p;
  }

  /* ---------- overlays ---------- */
  function toast(text, ms = 2400){
    const t = document.createElement('div'); t.className = 'rz-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.append(t); setTimeout(() => t.remove(), ms);
  }
  function sheet(build){ // build(box, close) fills the sheet
    const ov = document.createElement('div'); ov.className = 'rz-overlay';
    const box = document.createElement('div'); box.className = 'rz-sheet'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    ov.append(box); const close = () => { ov.remove(); document.removeEventListener('keydown', esc); removeEventListener('hashchange', close); };
    addEventListener('hashchange', close);
    const esc = e => { if(e.key === 'Escape') close(); };
    ov.addEventListener('click', e => { if(e.target === ov) close(); }); document.addEventListener('keydown', esc);
    build(box, close); document.body.append(ov);
    const f = box.querySelector('button,a,input'); if(f) f.focus({ preventScroll:true });
    return close;
  }
  const DUA_OPEN = 'اللهم علّمنا ما ينفعنا، وانفعنا بما علّمتنا، وزدنا علمًا';
  const DUA_CLOSE = 'سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك';
  function splash(){
    try{ if(!st.dua || sessionStorage.getItem('rz-dua')) return; sessionStorage.setItem('rz-dua', '1'); }catch(e){ return; }
    const s = document.createElement('div'); s.className = 'rz-splash'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', 'دعاء البدء');
    s.innerHTML = `<img src="${base}icons/icon-192.png" alt=""><div class="dua">${DUA_OPEN}</div><div class="sub">جدّد نيتك: نتعلّم لنقرأ كتاب الله كما أُنزل</div><div class="sub" style="opacity:.6">اضغط للمتابعة</div>`;
    pattern(s, { w:420, h:900, seed:5 });
    const done = () => { s.style.transition = 'opacity .3s'; s.style.opacity = '0'; setTimeout(() => s.remove(), 300); };
    s.addEventListener('click', done); setTimeout(done, 2600);
    document.body.append(s);
  }

  /* ---------- bottom nav ---------- */
  function nav(cur){
    const items = [['home','', 'الرئيسية'], ['tests','library/', 'اختباراتي'], ['progress','progress.html', 'تقدّمي'], ['hifz','hifz/', 'الحفظ'], ['settings','settings.html', 'الإعدادات']];
    const n = document.createElement('nav');
    n.className = 'rz-nav'; n.setAttribute('aria-label', 'التنقل الرئيسي'); n.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))';
    n.innerHTML = items.map(([k, href, t]) => `<a href="${base}${href}"${k === cur ? ' aria-current="page"' : ''}><span>${ICONS[k]}</span>${t}</a>`).join('');
    document.body.append(n);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const cur = document.body.dataset.nav;
    if(cur) nav(cur);
    document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = icon(e.dataset.icon); });
    document.querySelectorAll('[data-pattern]').forEach(e => pattern(e, { seed: +e.dataset.pattern || 11 }));
    splash(); syncState();
  });
  if('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register(base + 'sw.js').catch(() => {}));
  window.RZ = { ls, AR, count, Q_FORMS, DAY_FORMS, PT_FORMS, today, addDays, diffDays, dateAR, seeded, daySeed, base, icon, report, EMAIL,
    mistakes, mistakesDue, streak, markDailyDone, setVacation,
    game: G, gsave, addXP, hifzData, hifzToday, hifzDone, level, XP_AT, TIERS, goal, GOALS, dayLog, answer, quizDone, tasks, taskEvent, BADGES, checkBadges, flag,
    pattern, toast, sheet, enableNotif, disableNotif, DUA_OPEN, DUA_CLOSE, backupData, restoreData, syncState,
    settings: () => Object.assign({}, st), setSettings(p){ Object.assign(st, p); ls.set(ST_KEY, st); apply(); syncState(); } };
})();
