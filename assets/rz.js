/* Rosookh shared runtime: settings (theme, text size), storage helpers, bottom navigation, error reports, offline worker. */
(function(){
  const d = document.documentElement;
  const ls = {
    get(k, def){ try{ const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }catch(e){ return def; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const ST_KEY = 'rz-settings';
  const st = Object.assign({ theme:'auto', fs:'m' }, ls.get(ST_KEY, {}));
  function apply(){
    if(st.theme === 'auto') d.removeAttribute('data-theme'); else d.setAttribute('data-theme', st.theme);
    d.setAttribute('data-fs', st.fs);
  }
  apply();
  const script = document.currentScript;
  const base = script ? script.src.replace(/assets\/rz\.js.*$/, '') : '/';
  const AR = n => String(n).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[x]);
  const dayStr = t => t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
  const today = () => dayStr(new Date());
  // Arabic counted noun: forms = [one, two, few (3-10), many (11+)]
  const count = (n, f) => n === 1 ? f[0] : n === 2 ? f[1] : (n % 100 >= 3 && n % 100 <= 10) ? AR(n) + ' ' + f[2] : AR(n) + ' ' + f[3];
  const yesterday = () => { const t = new Date(); t.setDate(t.getDate()-1); return dayStr(t); };

  function mistakes(){ return ls.get('rz-mistakes', {}); }
  function mistakesDue(){ const now = Date.now(); return Object.values(mistakes()).filter(x => x.due <= now).length; }
  function streak(){
    const s = ls.get('rz-streak', { last:null, count:0 });
    const alive = s.last === today() || s.last === yesterday();
    return { count: alive ? s.count : 0, doneToday: s.last === today() };
  }
  function markDailyDone(){
    const s = ls.get('rz-streak', { last:null, count:0 });
    if(s.last === today()) return s.count;
    s.count = s.last === yesterday() ? s.count + 1 : 1; s.last = today();
    ls.set('rz-streak', s); return s.count;
  }
  const EMAIL = 'alqaisi.fatima@gmail.com';
  function report(info){
    const lines = ['السلام عليكم،', '', 'وجدت ملاحظة على هذا السؤال في تطبيق «رسوخ»:', ''];
    if(info){ for(const [k, v] of Object.entries(info)) if(v) lines.push(k + ': ' + v); }
    lines.push('', 'الملاحظة:', '');
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('رسوخ: ملاحظة على سؤال') + '&body=' + encodeURIComponent(lines.join('\n'));
  }
  const P = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const ICONS = {
    home:`<svg viewBox="0 0 24 24" ${P}><path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/></svg>`,
    tests:`<svg viewBox="0 0 24 24" ${P}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 10l2 2 4-4M9 16h6"/></svg>`,
    hifz:`<svg viewBox="0 0 24 24" ${P}><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/></svg>`,
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
    wave:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.7"><path d="M3 12h3l2-5 4 10 2-5h7"/></svg>`,
    mistake:`<svg viewBox="0 0 24 24" ${P} stroke-width="1.8"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M9 9l6 6M15 9l-6 6"/></svg>`,
    timer:`<svg viewBox="0 0 24 24" ${P} stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/></svg>`,
    check:`<svg viewBox="0 0 24 24" ${P} stroke-width="2.4"><path d="M5 12l5 5L19 7"/></svg>`,
    x:`<svg viewBox="0 0 24 24" ${P} stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    mail:`<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
    logo:`<svg viewBox="0 0 44 44" aria-hidden="true"><rect width="44" height="44" rx="12" fill="currentColor"/><text x="17" y="30" text-anchor="middle" font-size="22" font-weight="700" fill="var(--primary-ink)" font-family="IBM Plex Sans Arabic, sans-serif">ض</text><g fill="none" stroke="var(--primary-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M28 19c1.5 1.6 1.5 4.4 0 6"/><path d="M31.5 16.5c3 3 3 8 0 11"/><path d="M35 14c4.3 4.4 4.3 11.6 0 16"/></g></svg>`
  };
  const icon = k => ICONS[k] || '';
  function nav(cur){
    const items = [['home','', 'الرئيسية'], ['tests','library/', 'اختباراتي'], ['hifz','hifz/', 'الحفظ'], ['settings','settings.html', 'الإعدادات']];
    const n = document.createElement('nav');
    n.className = 'rz-nav'; n.setAttribute('aria-label', 'التنقل الرئيسي');
    n.innerHTML = items.map(([k, href, t]) => `<a href="${base}${href}"${k === cur ? ' aria-current="page"' : ''}><span>${ICONS[k]}</span>${t}</a>`).join('');
    document.body.append(n);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const cur = document.body.dataset.nav;
    if(cur) nav(cur);
    document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = icon(e.dataset.icon); });
  });
  if('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register(base + 'sw.js').catch(() => {}));
  window.RZ = { ls, AR, count, today, base, icon, report, EMAIL, mistakes, mistakesDue, streak, markDailyDone,
    settings: () => Object.assign({}, st), setSettings(p){ Object.assign(st, p); ls.set(ST_KEY, st); apply(); } };
})();
