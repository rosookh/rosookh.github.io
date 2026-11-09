/* Rosookh · مكتبة الاختبارات: chapter quizzes, صمّم اختبارك, levels, mistakes notebook, mastery map, daily challenge, shared quizzes. */
(function(){
'use strict';
const AR = RZ.AR, ls = RZ.ls, icon = RZ.icon, plural = RZ.count;
const app = document.getElementById('app');

/* ---------- randomness (seedable, so a shared quiz gives everyone the same questions) ---------- */
let RAND = Math.random;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = n => Math.floor(RAND() * n);
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function withSeed(seed, fn){ const prev = RAND; RAND = mulberry32(seed); try{ return fn(); } finally{ RAND = prev; } }

/* ---------- DOM helper ---------- */
const el = (t, a = {}, ...kids) => { const n = document.createElement(t);
  for(const [k, v] of Object.entries(a)){
    if(k === 'on') for(const [e, f] of Object.entries(v)) n.addEventListener(e, f);
    else if(k === 'style') n.style.cssText = v;
    else if(k === 'html') n.innerHTML = v;
    else if(v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(k => n.append(k && k.nodeType ? k : document.createTextNode(k ?? ''))); return n; };
const ic = (k, cls) => el('span', { class: 'ic ' + (cls || ''), html: icon(k), 'aria-hidden': 'true' });

/* ---------- bank ---------- */
const BANK = {}; DATA.forEach(b => BANK[b.id] = b);
const short = t => t.replace(/^الباب\s+\S+:\s*/, '');
const bab = t => ((t.match(/^(الباب\s+\S+)/) || ['', ''])[1]).replace(/:$/, '');
const ORDER = []; // every lesson in book order
LEVELS.forEach(L => L.ids.forEach(id => LESSONS[id].ls.forEach((n, li) => ORDER.push({ id, li, key: id + ':' + li, name: n, L }))));
const LES_NAME = {}; ORDER.forEach(o => LES_NAME[o.key] = o.name);
const CH_OF_LEVEL = {}; LEVELS.forEach(L => L.ids.forEach(id => CH_OF_LEVEL[id] = L));
const SPEC_LES = {
  l1c2: { 'إظهار حلقي': 1, 'إدغام بغنة': 2, 'إدغام بغير غنة': 2, 'إقلاب': 3, 'إخفاء حقيقي': 4 },
  l1c3: { 'إخفاء شفوي': 1, 'إدغام شفوي': 2, 'إظهار شفوي': 3 },
  l1c4: { 'مد لازم': 3, 'مد عارض للسكون': 3, 'مد لين عارض للسكون': 3, 'مد متصل': 2, 'مد متصل متطرف': 2, 'مد منفصل': 2, 'صلة كبرى': 2, 'مد بدل': 2, 'صلة صغرى': 1, 'مد عوض': 1 },
};
function specNeeds(id, s){
  if(s.les_all) return s.les_all;
  if(s.les != null) return [s.les];
  const m = SPEC_LES[id];
  if(m){ if(s.t === 'sort') return s.b.map(b => m[b]).filter(x => x != null); return [m[s.lab]].filter(x => x != null); }
  if(id === 'l2c1') return [1];
  if(id === 'l2c2') return (s.t === 'sort' && !s.b[0].includes('القلقلة')) ? [1] : [2];
  if(id === 'l2c3') return [3];
  if(id === 'l2c5') return [1];
  return [];
}
DATA.forEach(b => b.questions.forEach((q, i) => { q.id = 'b:' + b.id + ':' + i; q.ch = b.id; q.les = b.id + ':' + LESSONS[b.id].t[i]; }));
if(window.RIDDLES && SPEC.l2c1){ RIDDLES.forEach(r => [1, 2, 3].forEach(d => SPEC.l2c1.push({ t:'riddle', i:r.i, d, les:1, r }))); }
Object.entries(SPEC).forEach(([ch, list]) => list.forEach((s, i) => { s.id = 's:' + ch + ':' + i; s.ch = ch; s.needs = specNeeds(ch, s); s.les = ch + ':' + (s.needs[0] ?? 0); }));
/* hidden sources stay in the data (ids keep their positions) but are left out of every pool */
const HIDDEN_SRC = new Set(['tuhfa']); const SPEC_BY_ID = {};
Object.keys(SPEC).forEach(ch => { SPEC[ch].forEach(s => SPEC_BY_ID[s.id] = s); SPEC[ch] = SPEC[ch].filter(s => !HIDDEN_SRC.has(s.src)); });
const TOTAL = DATA.reduce((s, b) => s + b.questions.length, 0) + Object.values(SPEC).reduce((s, v) => s + v.length, 0);

/* ---------- book images ---------- */
const MAKH = { jawf:'الجوف', aqsa_halq:'أقصى الحلق', wasat_halq:'وسط الحلق', adna_halq:'أدنى الحلق',
  qaf:'أقصى اللسان مع ما يحاذيه من الحنك الأعلى', kaf:'أقصى اللسان أسفل من مخرج القاف قليلًا', wasat:'وسط اللسان مع ما يحاذيه من الحنك الأعلى',
  dad:'إحدى حافتي اللسان مع الأضراس العليا', lam:'أدنى حافتي اللسان إلى منتهى طرفه', nun:'طرف اللسان تحت مخرج اللام قليلًا',
  ra:'طرف اللسان مع ظهره، قريبًا من مخرج النون', nat:'طرف اللسان مع أصول الثنايا العليا', lith:'طرف اللسان مع أطراف الثنايا العليا',
  safir:'طرف اللسان مع ما فوق الثنايا السفلى', fa:'بطن الشفة السفلى مع أطراف الثنايا العليا', shaf:'الشفتان' };
const NEAR = [['nat','lith','safir'], ['lam','ra','nun'], ['shaf','fa','nun'], ['qaf','kaf']];
const near = (a, b) => a === b || NEAR.some(s => s.includes(a) && s.includes(b));

/* ---------- question building ---------- */
const KIND = { fill:'أكمل الفراغ', stmt:'ضع إشارة ✓ أو ✗', open:'أجب ثم اكشف الإجابة', mcq:'اختر إجابة واحدة', tf:'صح أم خطأ؟', match:'صِل كل سؤال بجوابه', order:'رتّب حسب المطلوب', pick:'استخرج من الآية', multi:'اختر كل ما ينطبق', sort:'صنّف الكلمات', vmcq:'اختر إجابة واحدة', hunt:'صيد الأحكام', img:'سؤال على صورة', riddle:'من أنا؟' };
const DL = { 1:'سهل', 2:'متوسط', 3:'صعب' };
const isOrderQ = q => /الترتيب الصحيح/.test(q.q) && q.a.split('، ').length >= 4;
const shortQ = q => q.a.length <= 34 && q.q.length <= 95 && !isOrderQ(q);
const base = q => ({ ch: q.ch, les: q.les, src: q.id });
function toQ(q){ return { ...base(q), type:'mcq', q:q.q, big:q.big, ctx:q.ctx, d:q.d, opts:shuffle([q.a, ...q.w]), ans:q.a, e:q.e || '' }; }
function toTF(q){ const right = RAND() < .5; const prop = right ? q.a : q.w[rnd(q.w.length)];
  return { ...base(q), type:'tf', q:q.q, big:q.big, ctx:q.ctx, d:q.d, prop, right, ans:q.a, opts:shuffle([q.a, ...q.w]), e:q.e || '' }; }
function toOrder(q){ const items = q.a.split('، ').map(s => s.replace(/^ثم\s+/, '').trim());
  return { ...base(q), type:'order', q:q.q, d:q.d, items, ans:items.join('، '), e:q.e || '' }; }
function toMatch(qs){ return { ch: qs[0].ch, les: qs[0].les, src: 'm:' + qs.map(q => q.id).join('+'), type:'match', d:2, pairs:qs.map(q => ({ q:q.q + (q.big || (q.ctx && q.ctx.hit) ? ' ' + ctxShort(q) : ''), a:q.a })), q:'صِل كل سؤال بجوابه', ans:qs.map(q => q.a).join(' · '), e:'' }; }
function toSpecial(s){
  const b = base(s);
  if(s.t === 'pick') return { ...b, type:'pick', d:2, q:s.p, v:s.v, g:s.g, ref:s.ref, ans:s.g.map(g => g.map(i => s.v[i]).join(' ')).join('، '), e:s.e };
  if(s.t === 'hunt') return { ...b, type:'hunt', d:s.d || 2, q:s.p, v:s.v, g:s.g, x:s.x || [], ref:s.ref, ans:s.g.map(i => s.v[i]).join('، '), e:s.e };
  if(s.t === 'multi') return { ...b, type:'multi', d:3, q:s.p, v:s.v, hl:s.hl, parts:s.parts, ref:s.ref, opts:s.opts, set:s.ans, ans:s.ans.join(' أو ') + ' حركات', e:s.e };
  if(s.t === 'mcq') return s.v ? { ...b, type:'vmcq', d:s.d || 2, q:s.q, v:s.v, hl:s.hl, ref:s.ref, opts:shuffle([s.a, ...s.w]), ans:s.a, e:s.e }
                             : { ...b, type:'mcq', d:s.d || 2, q:s.q, opts:shuffle([s.a, ...s.w]), ans:s.a, e:s.e || '' };
  if(s.t === 'fill') return { ...b, type:'fill', d:s.d || 2, q:s.s, opts:shuffle([s.a, ...s.w]), ans:s.a, e:s.e };
  if(s.t === 'stmt') return { ...b, type:'stmt', d:2, q:s.s, ok:s.ok, fix:s.fix, opts:s.ok ? [] : shuffle([s.fix, ...s.w]), ans:s.ok ? 'العبارة صحيحة ✓' : 'العبارة خاطئة ✗، والصواب: ' + s.fix, e:s.e };
  if(s.t === 'open') return { ...b, type:'open', d:2, q:s.k + ': ' + s.q, a:s.a, ans:s.a, e:'' };
  if(s.t === 'match') return { ...b, type:'match', d:s.d || 2, pairs:shuffle(s.pairs), q:s.p, ans:s.pairs.map(x => x.q + ' ← ' + x.a).join(' · '), e:'' };
  if(s.t === 'sort') return { ...b, type:'sort', d:2, q:s.p, b:s.b, it:shuffle(s.it), ans:s.b.map((bb, i) => bb + ': ' + s.it.filter(x => x.b === i).map(x => x.w).join('، ')).join(' | '), e:'' };
  if(s.t === 'riddle'){
    const im = IMGS[s.i], r = s.r, who = r.two ? 'من نحن؟' : 'من أنا؟';
    const text = s.d === 1 ? r.mk + '. ' + who : s.d === 2 ? r.sf.replace(/^./, c => c) + '. ' + who : r.mk + '، و' + r.sf.replace(/،\s*(وأخرج|وأنا)[^،]*$/, '') + '. ' + who;
    return { ...b, type:'riddle', d:s.d, f:im.f, showImg: s.d !== 3, q:text, opts:shuffle([im.lab, ...r.w]), ans:im.lab, e:im.lab + ': ' + r.mk.replace(/^(أخرج|نخرج|نحن حرفان نخرج)\s*/, 'يخرج ') + '. ' + r.sf.replace(/صفاتي|صفاتنا/, 'صفاته') + '.' };
  }
  if(s.t === 'img'){
    const im = IMGS[s.i];
    if(s.m === 'letter'){
      const seen = new Set([im.g]); const wr = [];
      for(const o of shuffle(IMGS)){ if(seen.has(o.g) || near(o.g, im.g)) continue; seen.add(o.g); wr.push(o.lab); if(wr.length === 3) break; }
      return { ...b, type:'img', d:2, f:im.f, q:'أيّ الحروف يخرج من المخرج المبيّن في الصورة؟', opts:shuffle([im.lab, ...wr]), ans:im.lab, e:im.lab + ': ' + MAKH[im.g] + '.' };
    }
    const wr = shuffle(Object.keys(MAKH).filter(g => !near(g, im.g))).slice(0, 3).map(g => MAKH[g]);
    return { ...b, type:'img', d:3, f:im.f, q:'ما مخرج الحرف المبيّن في الصورة؟', opts:shuffle([MAKH[im.g], ...wr]), ans:MAKH[im.g], e:'الحرف في الصورة: ' + im.lab + '.' };
  }
}
const NQ = 10, MIX = { 1:3, 2:4, 3:3 };
function build(pool, spec){ // easy → hard, mixed types
  const by = { 1:[], 2:[], 3:[] }; const baseQ = pool.filter(q => !isOrderQ(q));
  shuffle(baseQ).forEach(q => by[q.d]?.push(q));
  let out = []; for(const d of [1, 2, 3]) out = out.concat(by[d].slice(0, MIX[d]));
  if(out.length < NQ){ const rest = shuffle(baseQ.filter(q => !out.includes(q))); out = out.concat(rest.slice(0, NQ - out.length)); }
  out = out.slice(0, NQ).sort((a, b) => a.d - b.d);
  const Q = out.map(toQ);
  const used = new Set(out); const hasSp = spec && spec.length;
  const tfAt = hasSp ? [1, 6, 8] : [1, 4, 6, 8];
  tfAt.forEach(i => { if(out[i] && out[i].a.length <= 70) Q[i] = toTF(out[i]); });
  const sh = shuffle(pool.filter(q => shortQ(q) && !used.has(q)));
  const groups = []; let g = []; const seenA = new Set();
  for(const q of sh){ if(!seenA.has(q.a)){ g.push(q); seenA.add(q.a); } if(g.length === 4){ groups.push(g); g = []; } if(groups.length === 2) break; }
  if(groups[0] && Q.length > 3) Q[3] = toMatch(groups[0]);
  if(groups[1] && !hasSp && Q.length > 9) Q[9] = toMatch(groups[1]);
  const ord = shuffle(pool.filter(isOrderQ));
  if(ord.length && RAND() < .7 && Q.length > 8) Q[8] = toOrder(ord[0]);
  const rec = shuffle(pool.filter(q => /^(ما تعريف|ما معنى|لماذا)/.test(q.q) && !used.has(q) && q.a.length > 12));
  if(rec[0] && Q.length > 7) Q[7] = { ...base(rec[0]), type:'open', d:rec[0].d, q:(/^لماذا/.test(rec[0].q) ? 'علّل: ' : '') + rec[0].q, a:rec[0].a + (rec[0].e ? '. ' + rec[0].e : ''), ans:rec[0].a, e:'' };
  if(hasSp){
    const sp = shuffle(spec); const types = new Set(); const chosen = [];
    for(const s of sp){ const k = s.t + (s.lab || '') + (s.src || ''); if(!types.has(k)){ types.add(k); chosen.push(s); } if(chosen.length === 4) break; }
    for(let k = chosen.length - 1; k >= 0; k--){ const s = chosen[k]; if(s.t === 'riddle' && chosen.some((o, j) => j !== k && o.t === 'riddle' && o.i === s.i)) chosen.splice(k, 1); }
    for(const s of sp){ if(chosen.length >= 4) break; if(!chosen.includes(s)) chosen.push(s); }
    const slots = [2, 5, 9, 6].filter(i => i < Q.length);
    slots.forEach((i, k) => { if(chosen[k]) Q[i] = toSpecial(chosen[k]); });
    // small pools (a single lesson): top up with more special questions
    const extra = sp.filter(s => !chosen.slice(0, slots.length).includes(s));
    while(Q.length < NQ && extra.length) Q.push(toSpecial(extra.shift()));
  }
  return Q.filter(Boolean);
}
const LV = [
  { k:'mix', t:'متدرّج', s:'يبدأ بالأسئلة السهلة وينتهي بالصعبة.' },
  { k:'1', t:'سهل', s:'أسئلة مباشرة لتثبيت التعريفات والحروف.' },
  { k:'2', t:'متوسط', s:'أسئلة تطبيقية واستخراج من الآيات.' },
  { k:'3', t:'صعب', s:'أسئلة تحتاج تمييزًا دقيقًا بين الأحكام المتشابهة.' },
  { k:'4', t:'صعب جدًا', s:'أصعب الأسئلة، بمؤقت: ٢٥ ثانية للسؤال، و٥٥ ثانية للأسئلة التفاعلية.' }
];
const specD = s => s.d || ({ pick:2, multi:3, mcq:2, fill:2, stmt:2, open:2, match:2, sort:2, hunt:2, img:2, riddle:2 })[s.t] || 2;
function byLevel(pool, lvl){
  if(!lvl || lvl === 'mix') return pool;
  const want = lvl === '4' ? [3] : [+lvl];
  let p = pool.filter(q => want.includes(q.d));
  if(p.length < 12){ const nearD = lvl === '1' ? [2] : [2, 3]; p = p.concat(shuffle(pool.filter(q => nearD.includes(q.d) && !p.includes(q))).slice(0, 12 - p.length)); }
  return p.length >= Math.min(4, pool.length) ? p : pool;
}
function specByLevel(spec, lvl){
  if(!lvl || lvl === 'mix') return spec;
  if(lvl === '1') return spec.filter(s => specD(s) <= 2 && ['fill', 'stmt', 'sort', 'match', 'img', 'riddle'].includes(s.t));
  if(lvl === '2') return spec.filter(s => specD(s) <= 2);
  return spec.filter(s => specD(s) >= 2);
}
function buildN(pool, spec, n, lvl){
  pool = byLevel(pool, lvl); spec = specByLevel(spec, lvl);
  if(n <= 10) return build(pool, spec).slice(0, n);
  const P = shuffle(pool), Sp = shuffle(spec), k = Math.max(1, Math.round(n / 10)); let qs = [];
  for(let j = 0; j < k; j++){ const part = P.filter((_, i) => i % k === j), sp = Sp.filter((_, i) => i % k === j); qs = qs.concat(build(part, sp)); }
  return qs.slice(0, n);
}
function poolFor(keys){
  const sel = new Set(keys); const pool = [], spec = [];
  DATA.forEach(b => {
    b.questions.forEach(q => { if(sel.has(q.les)) pool.push(q); });
    (SPEC[b.id] || []).forEach(s => { if(s.needs.length && s.needs.every(li => sel.has(b.id + ':' + li))) spec.push(s); });
  });
  return { pool, spec };
}
const chapterPool = id => ({ pool: BANK[id].questions, spec: SPEC[id] || [] });

/* ---------- storage ---------- */
const KEY = 'tajweed-library-v1';
const save = Object.assign({ best:{}, stars:{}, les:{}, gold:{}, jump:-1 }, ls.get(KEY, {}));
const persist = () => ls.set(KEY, save);
const CUS = Object.assign({ sel:[], n:10, lvl:'mix' }, ls.get('tajweed-library-custom-v1', {}));
const csave = () => ls.set('tajweed-library-custom-v1', CUS);
const PREF = Object.assign({ lvl:'mix', hearts:false }, ls.get('rz-lib-pref', {}));
const psave = () => ls.set('rz-lib-pref', PREF);
// mastery: last 10 results per lesson
const MAS = ls.get('rz-mastery', {});
function masRecord(les, ok){ if(!les) return; const a = MAS[les] || (MAS[les] = []); a.push(ok ? 1 : 0); if(a.length > 10) a.shift(); ls.set('rz-mastery', MAS); }
function masState(les){ const a = MAS[les]; if(!a || !a.length) return { s:'none' }; const p = a.reduce((x, y) => x + y, 0) / a.length; return { s: a.length >= 4 && p >= .8 ? 'good' : 'review', p, n:a.length }; }
// mistakes notebook (spaced review)
const DAY = 864e5;
const nbKey = q => (q.src || '') + '|' + q.type + '|' + (q.type === 'tf' ? q.prop : '');
function nbAll(){ return ls.get('rz-mistakes', {}); }
function nbSave(m){ ls.set('rz-mistakes', m); }
function nbWrong(q){
  const m = nbAll(); const k = nbKey(q); const old = m[k];
  const clean = JSON.parse(JSON.stringify(q)); delete clean.nb;
  const keys = Object.keys(m);
  if(!old && keys.length >= 300){ keys.sort((a, b) => m[a].added - m[b].added).slice(0, keys.length - 299).forEach(x => delete m[x]); }
  m[k] = { q: clean, t: (CH_OF_LEVEL[q.ch] ? short(BANK[q.ch].title) : ''), lapses: (old ? old.lapses : 0) + 1, ok: 0, due: Date.now() + DAY, added: old ? old.added : Date.now() };
  nbSave(m);
}
function nbRight(q){ // answered right while reviewing
  const m = nbAll(); const k = q.nb || nbKey(q); const e = m[k]; if(!e) return null;
  e.ok++;
  if(e.ok >= 2){ delete m[k]; nbSave(m); if(!Object.keys(m).length) RZ.flag('nbEmpty'); return 'out'; }
  e.due = Date.now() + [3, 7, 14][Math.min(e.lapses - 1, 2)] * DAY; nbSave(m); return 'later';
}
function nbDue(){ const now = Date.now(); return Object.entries(nbAll()).filter(([, e]) => e.due <= now).sort((a, b) => a[1].due - b[1].due); }
function revive(k, e){ const q = JSON.parse(JSON.stringify(e.q)); q.nb = k; if(q.opts && q.type !== 'tf') q.opts = shuffle(q.opts); if(q.type === 'match') q.pairs = shuffle(q.pairs); if(q.type === 'sort') q.it = shuffle(q.it); return q; }

/* ---------- routing ---------- */
let S = null; // running quiz
function go(h){ if(location.hash === h) route(); else location.hash = h; }
function route(){
  const h = location.hash.replace(/^#\/?/, '');
  document.body.classList.remove('rz-quiz');
  clearInterval(S && S.tm);
  const [r, arg] = h.split('/');
  if(r === 'quiz' && S) return render();
  S = null;
  ({ '': home, builder, share, mistakes, mastery, daily, path, speed, riddle, resume,
     s: () => sharedIntro(arg), q: () => singleQ(decodeURIComponent(arg || '')), strengthen: () => strengthen(arg),
     lesson: () => lessonQuiz(decodeURIComponent(arg || '')) }[r] || home)();
  scrollTo(0, 0);
}
addEventListener('hashchange', route);
function start(T){
  if(T.reseed) T.seed = 1 + Math.floor(Math.random() * 1e9);
  else if((T.kind === 'custom' || T.kind === 'lesson') && T.seed != null && T.used) T.seed = 1 + Math.floor(Math.random() * 1e9);
  T.used = true;
  const make = () => T.make();
  const qs = T.seed != null ? withSeed(T.seed, make) : make();
  if(!qs.length){ app.innerHTML = ''; app.append(topBar(T.title, T.back || '#/'), el('div', { class:'rz-card rz-empty' }, 'لا توجد أسئلة كافية لهذا الاختيار. جرّب مستوى صعوبة آخر أو أضف دروسًا.')); return; }
  S = { T, qs, i:0, score:0, right:0, streak:0, best:0, res:[], nbOut:0, xp:0, weak:[], hearts: T.hearts ? 3 : null };
  saveResume();
  if(T.replace){ history.replaceState(null, '', '#/quiz'); route(); } else go('#/quiz');
}

/* ---------- resume an unfinished quiz ---------- */
const RES_KINDS = ['chapter', 'custom', 'shared', 'lesson', 'review', 'daily', 'final', 'jump', 'strengthen'];
function saveResume(){
  if(!S || !RES_KINDS.includes(S.T.kind)) return;
  const T = Object.assign({}, S.T); delete T.make;
  try{ ls.set('rz-resume', { T, title:T.title, qs:S.qs, i:S.i + (S.done ? 1 : 0), score:S.score, right:S.right, streak:S.streak, best:S.best, nbOut:S.nbOut, xp:S.xp, weak:S.weak, hearts:S.hearts,
    res:S.res.map(x => ({ ok:x.ok, sel:x.sel, q:x.q })), at:Date.now() }); }catch(e){}
}
const clearResume = () => { try{ localStorage.removeItem('rz-resume'); }catch(e){} };
function resume(){
  const R = ls.get('rz-resume', null);
  if(!R || !R.qs || R.i >= R.qs.length){ clearResume(); return home(); }
  S = { T:R.T, qs:R.qs, i:R.i, score:R.score, right:R.right, streak:R.streak, best:R.best, res:R.res || [], nbOut:R.nbOut || 0, xp:R.xp || 0, weak:R.weak || [], hearts:R.hearts };
  history.replaceState(null, '', '#/quiz'); render();
}
function resumeCard(){
  const R = ls.get('rz-resume', null);
  if(!R || !R.qs || R.i >= R.qs.length || Date.now() - R.at > 7 * 864e5) return '';
  const card = el('section', { class:'rz-card', style:'border:2px solid var(--ocean)' },
    el('b', {}, 'لديك اختبار لم يكتمل'), el('span', { class:'rz-meta' }, (R.title || '') + ' · ' + AR(R.i) + ' من ' + AR(R.qs.length)),
    el('div', { class:'rz-seg', style:'grid-template-columns:repeat(2,minmax(0,1fr))' },
      el('a', { class:'rz-btn pri', href:'#/resume' }, 'أكمل'),
      el('button', { type:'button', class:'rz-btn', on:{ click:() => { clearResume(); card.remove(); } } }, 'ابدأ من جديد')));
  return card;
}

/* ---------- listen to the verse (online only) ---------- */
const SURAHS = 'الفاتحة البقرة آل_عمران النساء المائدة الأنعام الأعراف الأنفال التوبة يونس هود يوسف الرعد إبراهيم الحجر النحل الإسراء الكهف مريم طه الأنبياء الحج المؤمنون النور الفرقان الشعراء النمل القصص العنكبوت الروم لقمان السجدة الأحزاب سبأ فاطر يس الصافات ص الزمر غافر فصلت الشورى الزخرف الدخان الجاثية الأحقاف محمد الفتح الحجرات ق الذاريات الطور النجم القمر الرحمن الواقعة الحديد المجادلة الحشر الممتحنة الصف الجمعة المنافقون التغابن الطلاق التحريم الملك القلم الحاقة المعارج نوح الجن المزمل المدثر القيامة الإنسان المرسلات النبأ النازعات عبس التكوير الانفطار المطففين الانشقاق البروج الطارق الأعلى الغاشية الفجر البلد الشمس الليل الضحى الشرح التين العلق القدر البينة الزلزلة العاديات القارعة التكاثر العصر الهمزة الفيل قريش الماعون الكوثر الكافرون النصر المسد الإخلاص الفلق الناس'.split(' ');
const normS = t => t.replace(/_/g, ' ').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ئ|ؤ|ء/g, '').replace(/[ً-ْ]/g, '').trim();
const SN = {}; SURAHS.forEach((n, i) => SN[normS(n)] = i + 1);
function refNum(ref){ const m = (ref || '').match(/^(.+?)[:\s]+(\d+)\s*$/); if(!m) return null; const n = SN[normS(m[1])]; return n ? [n, +m[2]] : null; }
let AUDIO = null;
function audioBtn(ref){
  const r = refNum(ref); if(!r || !navigator.onLine) return '';
  const file = String(r[0]).padStart(3, '0') + String(r[1]).padStart(3, '0') + '.mp3';
  const srcs = ['https://everyayah.com/data/Husary_Muallim_128kbps/' + file, 'https://everyayah.com/data/Husary_128kbps/' + file];
  const b = el('button', { type:'button', class:'listen', 'aria-label':'استمع إلى الآية بصوت الشيخ الحصري', html:icon('play') + '<span>استمع</span>' });
  b.addEventListener('click', e => {
    e.stopPropagation();
    if(AUDIO && !AUDIO.paused && AUDIO.dataset.f === file){ AUDIO.pause(); b.classList.remove('on'); return; }
    if(AUDIO) AUDIO.pause();
    let k = 0; AUDIO = new Audio(srcs[0]); AUDIO.dataset.f = file; b.classList.add('on');
    AUDIO.onerror = () => { if(++k < srcs.length){ AUDIO.src = srcs[k]; AUDIO.play().catch(() => {}); } else { b.classList.remove('on'); RZ.toast('تعذّر تشغيل التلاوة. تأكد من الاتصال بالإنترنت.'); } };
    AUDIO.onended = () => b.classList.remove('on');
    AUDIO.play().catch(() => {});
  });
  return b;
}

/* ---------- share one question: picture card or text with a link ---------- */
const canShareQ = q => q && q.src && /^[bs]:/.test(q.src) && !['match', 'sort', 'open'].includes(q.type);
function qText(q){
  if(q.type === 'riddle') return 'فزورة تجويدية: ' + q.q;
  let t = q.q || ''; if(q.big || q.ctx) t += ' ' + ctxText(q); if(q.v) t += ' ﴿' + q.v.join(' ') + '﴾';
  if(q.type === 'tf') t = (q.q || '') + (q.big || q.ctx ? ' ' + ctxText(q) : '');
  return t;
}
function qOpts(q){ if(q.type === 'tf' || q.type === 'stmt') return (q.type === 'stmt' ? ['صحيحة', 'خاطئة'] : q.opts) || []; return q.opts || []; }
function qLink(q){ return location.origin + location.pathname + '#/q/' + encodeURIComponent(q.src); }
function wrapText(ctx, text, maxW){
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  words.forEach(w => { const t = line ? line + ' ' + w : w; if(ctx.measureText(t).width > maxW && line){ lines.push(line); line = w; } else line = t; });
  if(line) lines.push(line); return lines;
}
async function qCard(q){
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  try{ await Promise.all(['700 48px "IBM Plex Sans Arabic"', '600 40px "IBM Plex Sans Arabic"', '400 56px "Amiri Quran"', '700 60px "Aref Ruqaa"'].map(f => document.fonts.load(f))); }catch(e){}
  x.direction = 'rtl'; x.textAlign = 'right';
  x.fillStyle = '#F2EBE0'; x.fillRect(0, 0, W, H);
  // header band with letter pattern
  x.fillStyle = '#2F5D50'; x.beginPath(); x.roundRect ? x.roundRect(0, 0, W, 300, [0, 0, 56, 56]) : x.rect(0, 0, W, 300); x.fill();
  const rr = RZ.seeded(9); x.save(); x.fillStyle = 'rgba(244,237,224,.10)'; x.textAlign = 'center';
  for(let k = 0; k < 26; k++){ x.save(); x.translate(rr() * W, 40 + rr() * 260); x.rotate((rr() - .5) * .9); x.font = `700 ${50 + Math.floor(rr() * 40)}px "Aref Ruqaa"`; x.fillText('رسوخض'[k % 5], 0, 0); x.restore(); }
  x.restore();
  const logo = new Image(); logo.src = RZ.base + 'icons/icon-192.png';
  await new Promise(r => { logo.onload = r; logo.onerror = r; });
  try{ x.save(); x.beginPath(); x.roundRect ? x.roundRect(W - 80 - 140, 80, 140, 140, 36) : x.rect(W - 220, 80, 140, 140); x.clip(); x.drawImage(logo, W - 220, 80, 140, 140); x.restore(); }catch(e){}
  x.fillStyle = '#F4EDE0'; x.font = '700 72px "IBM Plex Sans Arabic"'; x.fillText(q.type === 'riddle' ? 'فزورة تجويدية' : 'سؤال تجويد', W - 260, 160);
  x.font = '500 38px "IBM Plex Sans Arabic"'; x.globalAlpha = .85; x.fillText(q.type === 'riddle' ? (/نحن/.test(q.q) ? 'من نحن؟' : 'من أنا؟') : (KIND[q.type] || ''), W - 260, 222); x.globalAlpha = 1;
  let y = 380; const pad = 80, maxW = W - pad * 2;
  x.fillStyle = '#2B2A24'; x.font = '700 48px "IBM Plex Sans Arabic"';
  const head = q.type === 'tf' ? (q.q || '') : q.type === 'riddle' ? q.q : (q.q || '').replace(/____/g, '……');
  wrapText(x, head, maxW).slice(0, 5).forEach(l => { x.fillText(l, W - pad, y); y += 70; });
  // verse words with the target ones flagged, drawn word by word so the target shows in burgundy
  let vw = null;
  if(q.v) vw = q.v.map((w, i) => [w, !!(q.hl && q.hl.includes(i))]);
  else if(q.ctx && q.ctx.hit){ const sp = t => (t || '').split(' ').filter(Boolean); vw = [...sp(q.ctx.pre).map(w => [w, false]), ...sp(q.ctx.hit).map(w => [w, true]), ...sp(q.ctx.post).map(w => [w, false])]; }
  else if(q.ctx && q.ctx.mq) vw = [[q.ctx.mq, false]];
  else if(q.big) vw = q.big.replace(/[﴿﴾]/g, '').split(' ').filter(Boolean).map(w => [w, false]);
  if(vw && vw.length){
    vw[0][0] = '﴿' + vw[0][0]; vw[vw.length - 1][0] += '﴾';
    const ref = q.ref || (q.ctx && q.ctx.ref);
    y += 10; x.font = '400 54px "Amiri Quran"'; x.textAlign = 'right';
    const sw = x.measureText(' ').width, lines_ = []; let cur = [], cw = 0;
    vw.forEach(([w, h]) => { const ww = x.measureText(w).width; if(cur.length && cw + sw + ww > maxW - 60){ lines_.push([cur, cw]); cur = []; cw = 0; } cw += (cur.length ? sw : 0) + ww; cur.push([w, h, ww]); });
    if(cur.length) lines_.push([cur, cw]);
    const shown = lines_.slice(0, 4), refH = ref ? 56 : 0;
    x.fillStyle = '#FBF8F3'; x.strokeStyle = '#E2D8C8'; x.lineWidth = 3; x.beginPath(); const bh = shown.length * 92 + 40 + refH; x.roundRect ? x.roundRect(pad, y - 20, maxW, bh, 28) : x.rect(pad, y - 20, maxW, bh); x.fill(); x.stroke();
    shown.forEach(([ws, tw], k) => { let xx = W / 2 + tw / 2; ws.forEach(([w, h, ww]) => { x.fillStyle = h ? '#6B3439' : '#2B2A24'; x.fillText(w, xx, y + 62 + k * 92); xx -= ww + sw; }); });
    if(ref){ x.font = '500 34px "IBM Plex Sans Arabic"'; x.fillStyle = '#625E52'; x.textAlign = 'center'; x.fillText('(' + ref.replace(/:\s*/, ' ').replace(/\d+/g, d => AR(d)) + ')', W / 2, y + 62 + shown.length * 92 - 20); }
    y += bh + 30; x.textAlign = 'right'; }
  if(q.f && (q.type === 'img' || q.type === 'riddle')){
    const im = new Image(); im.src = 'img/' + q.f; await new Promise(r => { im.onload = r; im.onerror = r; });
    if(im.naturalWidth){ const ih = 330, iw = im.naturalWidth * ih / im.naturalHeight; x.fillStyle = '#FFFFFF'; x.fillRect((W - iw) / 2 - 10, y - 10, iw + 20, ih + 20); x.drawImage(im, (W - iw) / 2, y, iw, ih); y += ih + 40; }
  }
  if(q.type === 'tf' && q.prop){ x.font = '600 40px "IBM Plex Sans Arabic"'; x.fillStyle = '#5A4428'; wrapText(x, 'الإجابة المقترحة: ' + q.prop, maxW).slice(0, 2).forEach(l => { x.fillText(l, W - pad, y); y += 58; }); y += 10; }
  const opts = q.type === 'tf' ? ['صح', 'خطأ'] : qOpts(q); const L = 'أبجد';
  x.font = '600 40px "IBM Plex Sans Arabic"';
  const twoCol = opts.length === 4 && opts.every(o => x.measureText(o).width < maxW / 2 - 110);
  opts.slice(0, 4).forEach((o, k) => {
    const colW = twoCol ? (maxW - 24) / 2 : maxW, cx = twoCol ? (k % 2 === 0 ? W - pad : W - pad - colW - 24) : W - pad;
    const lines = wrapText(x, o, colW - 110).slice(0, 2), bh = 40 + lines.length * 54;
    const yy = twoCol ? y + Math.floor(k / 2) * (bh + 18) : y;
    if(yy + bh > H - 150) return;
    x.fillStyle = '#FBF8F3'; x.strokeStyle = '#CDBFA9'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(cx - colW, yy, colW, bh, 24) : x.rect(cx - colW, yy, colW, bh); x.fill(); x.stroke();
    x.fillStyle = '#E6EADC'; x.beginPath(); x.arc(cx - 46, yy + bh / 2, 26, 0, 7); x.fill();
    x.fillStyle = '#2F5D50'; x.textAlign = 'center'; x.fillText(L[k], cx - 46, yy + bh / 2 + 14); x.textAlign = 'right';
    x.fillStyle = '#2B2A24'; lines.forEach((l, j) => x.fillText(l, cx - 90, yy + 62 + j * 54));
    if(!twoCol || k % 2 === 1) y = yy + bh + 18; else if(k === opts.length - 1) y = yy + bh + 18;
  });
  // footer
  x.fillStyle = '#2F5D50'; x.fillRect(0, H - 120, W, 120);
  x.fillStyle = '#F4EDE0'; x.font = '700 42px "IBM Plex Sans Arabic"'; x.fillText('اكتب إجابتك في التعليقات', W - pad, H - 46);
  x.textAlign = 'left'; x.font = '600 34px "IBM Plex Sans Arabic"'; x.fillStyle = '#C9AE8E'; x.fillText('تطبيق رسوخ', pad, H - 48);
  return await new Promise(r => c.toBlob(r, 'image/png'));
}
function shareQ(q){
  if(!canShareQ(q)) return;
  RZ.sheet((box, close) => {
    box.append(el('b', { style:'font-size:18px' }, 'شارك هذا السؤال'), el('span', { class:'rz-meta' }, 'الإجابة لا تظهر في المشاركة، ليحلّه من يصله.'));
    const msg = el('span', { class:'rz-meta', 'aria-live':'polite' });
    const img = el('button', { type:'button', class:'rz-list-btn' }, el('span', { class:'rz-ic', html:icon('download') }), el('span', { class:'grow' }, el('b', {}, 'صورة للنشر'), el('span', { class:'rz-meta' }, 'بطاقة جاهزة لفيسبوك وإنستغرام وواتساب')));
    img.addEventListener('click', async () => {
      msg.textContent = 'جاري تجهيز الصورة…';
      const blob = await qCard(q); const file = new File([blob], 'rosookh-question.png', { type:'image/png' });
      try{ if(navigator.canShare && navigator.canShare({ files:[file] })){ await navigator.share({ files:[file], text:'سؤال تجويد من تطبيق رسوخ. اكتب إجابتك 👇\n' + qLink(q) }); close(); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
      const a = el('a', { href:URL.createObjectURL(blob), download:'rosookh-question.png' }); document.body.append(a); a.click(); a.remove(); msg.textContent = 'نُزّلت الصورة على جهازك.';
    });
    const txt = el('button', { type:'button', class:'rz-list-btn' }, el('span', { class:'rz-ic', html:icon('mail') }), el('span', { class:'grow' }, el('b', {}, 'رسالة'), el('span', { class:'rz-meta' }, 'السؤال والخيارات نصّاً، مع رابط يفتحه في التطبيق')));
    txt.addEventListener('click', async () => {
      const o = q.type === 'tf' ? ['صح', 'خطأ'] : qOpts(q);
      const text = qText(q) + (q.type === 'tf' ? '\nالإجابة المقترحة: ' + q.prop : '') + '\n' + o.map((x, k) => 'أبجد'[k] + ') ' + x).join('\n') + '\n\nحلّه في تطبيق رسوخ:';
      const url = qLink(q);
      try{ if(navigator.share){ await navigator.share({ title:'سؤال تجويد', text, url }); close(); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
      try{ await navigator.clipboard.writeText(text + '\n' + url); msg.textContent = 'نُسخ النص والرابط.'; }catch(e){ msg.textContent = url; }
    });
    box.append(img, txt, msg);
  });
}
function singleQ(id){
  const m = id.match(/^([bs]):([a-z0-9]+):(\d+)$/); let q = null;
  if(m && m[1] === 'b' && BANK[m[2]] && BANK[m[2]].questions[+m[3]]) q = toQ(BANK[m[2]].questions[+m[3]]);
  if(m && m[1] === 's' && SPEC_BY_ID[id] && !HIDDEN_SRC.has(SPEC_BY_ID[id].src)) q = toSpecial(SPEC_BY_ID[id]);
  if(!q){ app.innerHTML = ''; app.append(topBar('سؤال مشترك'), el('p', { class:'rz-empty' }, 'لم نجد هذا السؤال. ربما تغيّر بعد تحديث التطبيق.')); return; }
  start({ id:'single', kind:'single', title:'سؤال وصلك من صديق', les:q.les, replace:true, make:() => [q] });
}
function strengthen(ch){ if(!BANK[ch]) return home(); start({ id:ch, kind:'strengthen', title:'تقوية: ' + short(BANK[ch].title), lvl:'mix', replace:true, make:() => { const p = chapterPool(ch); return buildN(p.pool, p.spec, 10, 'mix'); } }); }

/* ---------- small sounds (can be turned off in Settings) ---------- */
let AC = null;
function beep(kind){
  if(RZ.settings().sound === false) return;
  try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime;
    const notes = kind === 'combo' ? [660, 880, 1100] : kind === 'ok' ? [700, 940] : [260];
    notes.forEach((f, k) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + k * .09); g.gain.exponentialRampToValueAtTime(.12, t + k * .09 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + k * .09 + .18); o.connect(g).connect(AC.destination); o.start(t + k * .09); o.stop(t + k * .09 + .2); });
  }catch(e){}
}

/* ---------- shared bits of UI ---------- */
function topBar(title, back){
  return el('div', { class:'rz-top' },
    el('a', { class:'rz-icon', href: back || '#/', 'aria-label':'رجوع', html: icon('back') }),
    el('h1', { class:'rz-title' }, title));
}
function lvChips(cur, onPick){
  const row = el('div', { class:'rz-wrap', role:'group', 'aria-label':'مستوى الصعوبة' });
  const hint = el('div', { class:'rz-note' });
  const paint = k => { row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    const L = LV.find(x => x.k === k) || LV[0]; hint.innerHTML = ''; if(L.k === '4') hint.append(ic('timer', 'acc')); hint.append(el('span', {}, L.s)); };
  LV.forEach(L => row.append(el('button', { type:'button', class:'rz-chip', 'data-k':L.k, on:{ click:() => { onPick(L.k); paint(L.k); } } }, L.t)));
  paint(cur);
  return [row, hint];
}
function countSeg(cur, onPick, list = [10, 20, 30]){
  const row = el('div', { class:'rz-seg', role:'group', 'aria-label':'عدد الأسئلة' });
  list.forEach(n => row.append(el('button', { type:'button', class:'rz-chip', 'aria-pressed':String(cur === n), on:{ click:e => { onPick(n); row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } } }, AR(n))));
  return row;
}
function lessonPicker(sel, onChange){
  // "reached up to" shortcut + full tree
  const wrap = el('div', { style:'display:flex;flex-direction:column;gap:12px' });
  const upto = el('select', { class:'rz-select', 'aria-label':'وصلت مع أستاذي إلى' }, el('option', { value:'' }, 'اختر آخر درس أخذته…'));
  LEVELS.forEach(L => L.ids.forEach(id => { const g = el('optgroup', { label:`${L.name} · ${short(BANK[id].title)}` }); LESSONS[id].ls.forEach((n, li) => g.append(el('option', { value:id + ':' + li }, n))); upto.append(g); }));
  const last = ORDER.filter(o => sel.has(o.key)).pop(); if(last) upto.value = last.key;
  upto.addEventListener('change', () => { if(!upto.value) return; sel.clear(); for(const o of ORDER){ sel.add(o.key); if(o.key === upto.value) break; } refresh(); onChange(); });
  const boxes = [], chapBoxes = [];
  const tree = el('div', { class:'tree', hidden:true });
  LEVELS.forEach(L => {
    const sec = el('details', { class:'tl' }, el('summary', {}, L.name + (L.sub ? ' · ' + L.sub : '')));
    L.ids.forEach(id => {
      const ccb = el('input', { type:'checkbox' }); chapBoxes.push({ cb:ccb, id });
      ccb.addEventListener('change', () => { LESSONS[id].ls.forEach((_, li) => ccb.checked ? sel.add(id + ':' + li) : sel.delete(id + ':' + li)); refresh(); onChange(); });
      const ch = el('div', { class:'tc' }, el('label', { class:'tch' }, ccb, el('span', {}, short(BANK[id].title))));
      LESSONS[id].ls.forEach((n, li) => { const key = id + ':' + li; const cb = el('input', { type:'checkbox' }); boxes.push({ cb, key });
        cb.addEventListener('change', () => { cb.checked ? sel.add(key) : sel.delete(key); refresh(); onChange(); });
        ch.append(el('label', { class:'tlsn' }, cb, el('span', {}, n))); });
      sec.append(ch);
    });
    tree.append(sec);
  });
  function refresh(){
    boxes.forEach(({ cb, key }) => cb.checked = sel.has(key));
    chapBoxes.forEach(({ cb, id }) => { const ks = LESSONS[id].ls.map((_, li) => id + ':' + li); const c = ks.filter(k => sel.has(k)).length; cb.checked = c === ks.length; cb.indeterminate = c > 0 && c < ks.length; });
  }
  const toggle = el('button', { type:'button', class:'rz-link' }, 'أو اختر الدروس بنفسك');
  toggle.addEventListener('click', () => { tree.hidden = !tree.hidden; toggle.textContent = tree.hidden ? 'أو اختر الدروس بنفسك' : 'إخفاء قائمة الدروس'; });
  const clear = el('button', { type:'button', class:'rz-link', style:'color:var(--muted)' }, 'إلغاء الكل');
  clear.addEventListener('click', () => { sel.clear(); upto.value = ''; refresh(); onChange(); });
  wrap.append(el('b', {}, 'وصلت مع أستاذي إلى:'), upto, el('div', { class:'rz-between' }, toggle, clear), tree);
  refresh();
  return wrap;
}
function actionBar(...kids){ const bar = el('div', { class:'rz-action' }, el('div', {}, ...kids)); return bar; }
function fitAction(){ const a = document.querySelector('.rz-action'); if(a) document.body.style.setProperty('--act-h', a.offsetHeight + 'px'); }
addEventListener('resize', fitAction);
const starStr = n => { const s = el('span', { class:'stars', 'aria-label':`${AR(n)} من ٣ نجوم` }); for(let i = 0; i < 3; i++) s.append(el('span', { class:i < n ? '' : 'off' }, '★')); return s; };

function heartsToggle(inline){
  const cb = el('input', { type:'checkbox', style:'width:22px;height:22px;accent-color:var(--primary)' }); cb.checked = !!PREF.hearts;
  cb.addEventListener('change', () => { PREF.hearts = cb.checked; psave(); });
  const lab = el('label', { class:'rz-between', style:'min-height:44px;cursor:pointer' }, el('span', { style:'display:flex;flex-direction:column' }, el('b', { style:'display:flex;align-items:center;gap:6px' }, el('span', { class:'ic', style:'color:var(--bad);width:18px;height:18px', html:icon('heart') }), 'وضع القلوب (اختياري)'), el('span', { class:'rz-meta' }, '٣ أخطاء وينتهي الاختبار، ثم تكمل الباقي للتعلّم إن شئت.')), cb);
  return inline ? lab : el('section', { class:'rz-card' }, lab);
}

/* ---------- library home ---------- */
function home(){
  app.innerHTML = '';
  app.append(el('header', { style:'display:flex;flex-direction:column;gap:4px' },
    el('h1', { class:'rz-title' }, 'مكتبة الاختبارات'),
    el('p', { class:'rz-meta', style:'margin:0' }, `اختبار لكل باب من المستوى الأول حتى متطلب الإجازة، من بنك يضم ${AR(TOTAL)} سؤالًا تتغيّر في كل مرة.`)));
  const lvCard = el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'مستوى الصعوبة لاختبارات الأبواب'),
    ...lvChips(PREF.lvl, k => { PREF.lvl = k; psave(); }), heartsToggle(true));
  app.append(resumeCard(),
    el('div', { class:'rz-grid' },
      el('a', { class:'rz-tile c-wine', href:'#/path' }, el('span', { html:icon('path') }), el('b', {}, 'مسار الدروس'), el('span', { class:'rz-meta' }, 'درسًا بعد درس، واختبار ختام لكل باب')),
      el('a', { class:'rz-tile c-ocean', href:'#/speed' }, el('span', { html:icon('bolt') }), el('b', {}, 'جولة سريعة'), el('span', { class:'rz-meta' }, 'أكبر عدد في ٦٠ ثانية'))),

    el('a', { class:'rz-list-btn', href:'#/builder' }, el('span', { class:'rz-ic', html:icon('sliders') }), el('span', { class:'grow' }, el('b', {}, 'صمّم اختبارك'), el('span', { class:'rz-meta' }, CUS.sel.length ? `محفوظ: ${plural(CUS.sel.length, ['درس واحد', 'درسان', 'دروس', 'درسًا'])}` : 'اختر الدروس التي وصلت إليها، واختبر نفسك فيها فقط.')), el('span', { class:'chev', html:icon('chev') })),
    lvCard);
  LEVELS.forEach(L => {
    const sec = el('section', { class:'lvl' });
    sec.append(el('div', { class:'rz-between' }, el('h2', { class:'rz-h', style:'margin:0' }, L.name + (L.sub ? ' · ' + L.sub : '')),
      el('button', { type:'button', class:'rz-link', on:{ click:() => start({ id:'L' + L.n, kind:'chapter', title:`اختبار شامل: ${L.name}`, lvl:PREF.lvl, hearts:PREF.hearts, make:() => buildN(L.ids.flatMap(id => BANK[id].questions), L.ids.flatMap(id => SPEC[id] || []), 10, PREF.lvl) }) } }, 'اختبار شامل')));
    const grid = el('div', { class:'rz-grid' });
    L.ids.forEach(id => { const b = BANK[id]; const best = save.best[id];
      grid.append(el('button', { type:'button', class:'rz-tile chap c-' + ['green', 'ocean', 'sand', 'wine'][(L.n || 1) - 1] + (save.gold[id] ? ' gold' : ''), on:{ click:() => start({ id, kind:'chapter', title:short(b.title), lvl:PREF.lvl, hearts:PREF.hearts, make:() => { const p = chapterPool(id); return buildN(p.pool, p.spec, 10, PREF.lvl); } }) } },
        el('span', { class:'rz-meta' }, bab(b.title)), el('b', {}, short(b.title)),
        el('span', { class:'rz-meta' }, best != null ? `أفضل نتيجة: ${AR(best)} من ${AR(NQ)}` : `${plural(b.questions.length + (SPEC[id] || []).length, RZ.Q_FORMS)} في البنك`),
        el('div', { class:'rz-between', style:'margin-top:auto' }, starStr(save.stars[id] || 0), save.gold[id] ? el('span', { title:'باب ذهبي' }, '🥇') : '')));
    });
    sec.append(grid); app.append(sec);
  });
  app.append(el('div', { class:'rz-note' }, el('span', {}, 'كل اختبار عشرة أسئلة متنوعة. اختر إجابتك ثم اضغط «تحقّق» لترى الصواب والشرح. الأسئلة التي تخطئ فيها تُحفظ في «دفتر أخطائي» لتعود إليك.')));
}

/* ---------- صمّم اختبارك ---------- */
function builder(){
  app.innerHTML = '';
  const sel = new Set(CUS.sel);
  const count = el('span', { class:'rz-meta', style:'text-align:center' });
  const goBtn = el('button', { type:'button', class:'rz-btn pri block' }, 'ابدأ الاختبار');
  const refresh = () => { CUS.sel = [...sel]; csave(); const { pool, spec } = poolFor(CUS.sel); const n = pool.length + spec.length; count.textContent = n ? `${plural(n, RZ.Q_FORMS)} في الدروس المختارة` : 'اختر درسًا واحدًا على الأقل'; goBtn.disabled = pool.length < 4; };
  goBtn.addEventListener('click', () => { const L = LV.find(x => x.k === CUS.lvl) || LV[0]; const keys = CUS.sel.slice();
    start({ id:'custom', kind:'custom', title:'اختباري · ' + L.t, lvl:CUS.lvl, keys, hearts:PREF.hearts, seed:1 + Math.floor(Math.random() * 1e9), make:() => { const { pool, spec } = poolFor(keys); return buildN(pool, spec, CUS.n, CUS.lvl); } }); });
  app.append(topBar('صمّم اختبارك'),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, '١ · الدروس'), lessonPicker(sel, refresh)),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, '٢ · مستوى الصعوبة'), ...lvChips(CUS.lvl, k => { CUS.lvl = k; csave(); })),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, '٣ · عدد الأسئلة'), countSeg(CUS.n, n => { CUS.n = n; csave(); })),
    heartsToggle(),
    actionBar(count, goBtn));
  document.body.classList.add('rz-quiz');
  refresh(); fitAction();
}

/* ---------- شارك اختبارًا ---------- */
function encodeSel(keys){ // bitmap over ORDER, base36 chunks
  const set = new Set(keys); let bits = ''; ORDER.forEach(o => bits += set.has(o.key) ? '1' : '0');
  const out = []; for(let i = 0; i < bits.length; i += 30) out.push(parseInt(bits.slice(i, i + 30).padEnd(30, '0').split('').reverse().join(''), 2).toString(36));
  return out.join('-');
}
function decodeSel(str){
  const keys = []; (str || '').split('-').forEach((c, k) => { const v = parseInt(c, 36); if(isNaN(v)) return; const bits = v.toString(2).padStart(30, '0').split('').reverse().join('');
    for(let i = 0; i < 30; i++) if(bits[i] === '1' && ORDER[k * 30 + i]) keys.push(ORDER[k * 30 + i].key); });
  return keys;
}
function shareUrl(cfg){
  const qp = new URLSearchParams({ l:cfg.lvl, n:String(cfg.n), r:String(cfg.seed), d:encodeSel(cfg.sel) }); if(cfg.name) qp.set('t', cfg.name);
  if(cfg.sc != null){ qp.set('sc', String(cfg.sc)); if(cfg.by) qp.set('by', cfg.by.slice(0, 30)); }
  return location.origin + location.pathname + '#/s/' + qp.toString();
}
function share(){
  app.innerHTML = '';
  const SH = Object.assign({ sel:CUS.sel.slice(), n:10, lvl:'mix', name:'' }, ls.get('rz-share', {}));
  const sel = new Set(SH.sel);
  const keep = () => { SH.sel = [...sel]; ls.set('rz-share', SH); };
  const name = el('input', { class:'rz-select', type:'text', maxlength:'60', placeholder:'مثلًا: مراجعة أحكام النون', value:SH.name, 'aria-label':'اسم الاختبار' });
  name.addEventListener('input', () => { SH.name = name.value.trim(); keep(); });
  const out = el('section', { class:'rz-card', hidden:true });
  const count = el('span', { class:'rz-meta', style:'text-align:center' });
  const make = el('button', { type:'button', class:'rz-btn pri block' }, 'أنشئ رابط الاختبار');
  const refresh = () => { keep(); const { pool } = poolFor(SH.sel); count.textContent = SH.sel.length ? 'كل من يفتح الرابط يحصل على الأسئلة نفسها بالترتيب نفسه.' : 'اختر الدروس أولًا'; make.disabled = pool.length < 4; out.hidden = true; fitAction(); };
  make.addEventListener('click', () => {
    const cfg = { sel:SH.sel, n:SH.n, lvl:SH.lvl, name:SH.name, seed:1 + Math.floor(Math.random() * 1e9) };
    const url = shareUrl(cfg);
    const text = (cfg.name ? '«' + cfg.name + '»: ' : '') + 'اختبار تجويد في تطبيق رسوخ، ' + plural(cfg.n, RZ.Q_FORMS) + '.';
    out.innerHTML = '';
    const field = el('input', { class:'rz-select', readonly:true, value:url, dir:'ltr', 'aria-label':'رابط الاختبار' });
    const copied = el('span', { class:'rz-meta', 'aria-live':'polite' });
    out.append(el('b', {}, 'الرابط جاهز'), field,
      el('div', { class:'rz-seg', style:'grid-template-columns:repeat(2,minmax(0,1fr))' },
        el('button', { type:'button', class:'rz-btn pri', on:{ click:async () => { try{ if(navigator.share){ await navigator.share({ title:'رسوخ', text, url }); return; } }catch(e){ return; } copy(); } } }, 'مشاركة'),
        el('button', { type:'button', class:'rz-btn', on:{ click:copy } }, 'نسخ الرابط')),
      copied,
      el('a', { class:'rz-link', href:url.slice(url.indexOf('#')) }, 'جرّب الاختبار بنفسك'));
    function copy(){ field.select(); (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => copied.textContent = 'تم نسخ الرابط.', () => { document.execCommand && document.execCommand('copy'); copied.textContent = 'تم تحديد الرابط، انسخه.'; }); }
    out.hidden = false; out.scrollIntoView({ behavior:'smooth', block:'center' });
  });
  app.append(topBar('شارك اختبارًا'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'للمعلمات والمجموعات: اختر الدروس والمستوى وعدد الأسئلة، فيتكوّن رابط واحد. كل من يفتحه يحلّ الأسئلة نفسها بالترتيب نفسه، ويعمل بلا تسجيل.'),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'اسم الاختبار (اختياري)'), name),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'الدروس'), lessonPicker(sel, refresh)),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'مستوى الصعوبة'), ...lvChips(SH.lvl, k => { SH.lvl = k; keep(); out.hidden = true; })),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'عدد الأسئلة'), countSeg(SH.n, n => { SH.n = n; keep(); out.hidden = true; }, [10, 20, 30])),
    out, actionBar(count, make));
  document.body.classList.add('rz-quiz');
  refresh(); fitAction();
}
function sharedIntro(arg){
  const qp = new URLSearchParams(arg || '');
  const keys = decodeSel(qp.get('d')); const n = Math.min(30, Math.max(5, +qp.get('n') || 10)); const lvl = LV.some(x => x.k === qp.get('l')) ? qp.get('l') : 'mix';
  const seed = +qp.get('r') || 1; const name = (qp.get('t') || '').slice(0, 60);
  const vs = qp.get('sc') != null ? +qp.get('sc') : null, by = (qp.get('by') || '').slice(0, 30);
  app.innerHTML = '';
  if(!keys.length){ app.append(topBar('اختبار مشترك'), el('p', { class:'rz-empty' }, 'الرابط غير مكتمل. اطلب الرابط مرة أخرى.')); return; }
  const L = LV.find(x => x.k === lvl);
  const chs = [...new Set(keys.map(k => k.split(':')[0]))].map(id => short(BANK[id].title));
  app.append(topBar('اختبار مشترك'),
    el('section', { class:'rz-card' },
      el('span', { class:'rz-meta' }, vs != null ? 'وصلك تحدٍّ' + (by ? ' من ' + by : '') : 'وصلك هذا الاختبار برابط مشترك'),
      vs != null ? el('div', { class:'rz-note', style:'font-weight:600;color:var(--ink)' }, `🏆 ${by || 'صاحب التحدّي'} حصل على ${AR(vs)} من ${AR(n)}. هل تتفوق؟`) : '',
      el('b', { style:'font-size:22px' }, name || 'اختبار تجويد'),
      el('div', { class:'rz-wrap' }, el('span', { class:'rz-badge plain' }, plural(n, ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'])), el('span', { class:'rz-badge' }, L.t), el('span', { class:'rz-badge plain' }, plural(keys.length, ['درس واحد', 'درسان', 'دروس', 'درسًا']))),
      el('span', { class:'rz-meta' }, 'الأبواب: ' + chs.join('، ')),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => start({ id:'shared', kind:'shared', title:name || 'اختبار مشترك', lvl, seed, vs, by, cfg:{ sel:keys, n, lvl, seed, name }, make:() => { const { pool, spec } = poolFor(keys); return buildN(pool, spec, n, lvl); } }) } }, 'ابدأ')));
}

/* ---------- دفتر أخطائي ---------- */
function mistakes(){
  app.innerHTML = '';
  const all = Object.entries(nbAll()).sort((a, b) => a[1].due - b[1].due); const due = nbDue();
  app.append(topBar('دفتر أخطائي', '../'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'كل سؤال تخطئ فيه يُحفظ هنا ويعود إليك: بعد يوم، ثم بعد ٣ أيام، ثم أسبوع، ثم أسبوعين إن تكرر خطؤك فيه. ويخرج من الدفتر عندما تجيبه صحيحًا مرتين متتاليتين.'));
  if(!all.length){ app.append(el('div', { class:'rz-card rz-empty' }, el('b', {}, 'الدفتر فارغ'), el('span', {}, 'لم تخطئ في أي سؤال بعد، أو أتقنت كل أخطائك.'), el('a', { class:'rz-btn pri', href:'#/' }, 'إلى مكتبة الاختبارات'))); return; }
  app.append(el('section', { class:'rz-card' },
    el('b', { style:'font-size:22px' }, due.length ? plural(due.length, ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا']) + ' للمراجعة اليوم' : 'لا مراجعة اليوم'),
    el('span', { class:'rz-meta' }, 'في الدفتر ' + plural(all.length, ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'])),
    due.length ? el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => start({ id:'review', kind:'review', title:'مراجعة دفتر الأخطاء', make:() => nbDue().slice(0, 20).map(([k, e]) => revive(k, e)) }) } }, 'راجع الآن') : ''));
  const list = el('div', { style:'display:flex;flex-direction:column;gap:8px' });
  const when = t => { const d = Math.ceil((t - Date.now()) / DAY); return d <= 0 ? 'اليوم' : d === 1 ? 'غدًا' : 'بعد ' + plural(d, ['يوم', 'يومين', 'أيام', 'يومًا']); };
  all.forEach(([k, e]) => {
    const txt = e.q.type === 'match' ? (e.q.q || 'توصيل') : e.q.type === 'sort' ? e.q.q : (e.q.q || '') + (e.q.big ? ' ' + e.q.big : '');
    list.append(el('div', { class:'rz-card nb-item' },
      el('div', { class:'rz-between' }, el('span', { class:'rz-meta' }, (e.t ? e.t + ' · ' : '') + (KIND[e.q.type] || '')), el('span', { class:'rz-badge' + (e.due <= Date.now() ? ' bad' : '') }, when(e.due))),
      el('div', {}, txt.length > 140 ? txt.slice(0, 140) + '…' : txt),
      el('div', { class:'rz-between' },
        el('button', { type:'button', class:'rz-link small', on:{ click:() => { const m = nbAll(); delete m[k]; nbSave(m); mistakes(); } } }, 'إزالة من الدفتر'),
        canShareQ(e.q) ? el('button', { type:'button', class:'rz-link small', on:{ click:() => shareQ(e.q) } }, 'شارك السؤال') : '')));
  });
  app.append(el('h2', { class:'rz-h' }, 'كل الأسئلة في الدفتر'), list);
}

/* ---------- خريطة إتقاني ---------- */
function mastery(){
  app.innerHTML = '';
  app.append(topBar('خريطة إتقاني', '../'),
    el('div', { class:'legend' }, el('span', {}, el('i', { class:'dot good' }), 'متقن (٨٠٪ فأكثر في آخر محاولاتك)'), el('span', {}, el('i', { class:'dot review' }), 'يحتاج مراجعة'), el('span', {}, el('i', { class:'dot none' }), 'لم تبدأه بعد')),
    el('p', { class:'rz-meta', style:'margin:0' }, 'اضغط على أي درس لتبدأ اختبارًا فيه.'));
  let g = 0, r = 0, z = 0;
  LEVELS.forEach(L => {
    const sec = el('section', { class:'rz-card' }, el('b', {}, L.name + (L.sub ? ' · ' + L.sub : '')));
    L.ids.forEach(id => {
      sec.append(el('span', { class:'rz-meta' }, short(BANK[id].title)));
      const row = el('div', { class:'mas-row' });
      LESSONS[id].ls.forEach((n, li) => { const key = id + ':' + li; const st = masState(key);
        if(st.s === 'good') g++; else if(st.s === 'review') r++; else z++;
        row.append(el('a', { class:'mas ' + st.s, href:'#/lesson/' + encodeURIComponent(key) }, el('span', {}, n), st.p != null ? el('small', {}, AR(Math.round(st.p * 100)) + '٪') : '')); });
      sec.append(row);
    });
    app.append(sec);
  });
  app.insertBefore(el('div', { class:'rz-wrap' }, el('span', { class:'rz-badge plain' }, 'متقن: ' + AR(g)), el('span', { class:'rz-badge' }, 'للمراجعة: ' + AR(r)), el('span', { class:'rz-badge plain', style:'background:var(--line);color:var(--muted)' }, 'لم يبدأ: ' + AR(z))), app.children[2]);
}
function lessonQuiz(key, push){
  if(!LES_NAME[key]) return home();
  const lvl = PREF.lvl;
  start({ id:'les:' + key, key, keys:[key], kind:'lesson', title:LES_NAME[key], lvl, hearts:PREF.hearts, seed:1 + Math.floor(Math.random() * 1e9), back:'#/path', replace:!push, make:() => { const { pool, spec } = poolFor([key]); return buildN(pool, spec, 10, lvl); } });
}

/* ---------- تحدّي اليوم ---------- */
function daily(){
  const keys = CUS.sel.length ? CUS.sel : (Object.keys(MAS).length ? Object.keys(MAS) : LEVELS[0].ids.flatMap(id => LESSONS[id].ls.map((_, li) => id + ':' + li)));
  start({ id:'daily', kind:'daily', title:'تحدّي اليوم', back:'../', replace:!ls.get('rz-resume', null), make:() => {
    const due = nbDue().slice(0, 2).map(([k, e]) => revive(k, e));
    const { pool, spec } = poolFor(keys);
    const fresh = build(byLevel(pool, 'mix'), spec).filter(q => q.type !== 'match' && q.type !== 'open');
    return due.concat(shuffle(fresh)).slice(0, 5);
  } });
}

/* ---------- question screen ---------- */
/* short quotes keep their context: the verse (or a few words around the quote), its ref, the quote highlighted */
const ctxRef = r => '(' + r.replace(/\d+/g, d => AR(d)) + ')';
function ctxText(q){
  const c = q.ctx; if(!c) return q.big || '';
  if(c.mq) return '﴿' + c.mq + '﴾ ' + ctxRef(c.ref);
  if(c.hit) return '﴿' + [c.pre, c.hit, c.post].filter(Boolean).join(' ') + '﴾ ' + ctxRef(c.ref);
  return (q.big || '') + ' ' + ctxRef(c.ref);
}
function ctxShort(q){
  const c = q.ctx; if(!c || !c.hit) return q.big || '';
  const pre = (c.pre || '').replace('… ', '').split(' ').filter(Boolean), post = (c.post || '').replace(' …', '').split(' ').filter(Boolean);
  return '﴿' + [pre.slice(-1)[0], c.hit, post[0]].filter(Boolean).join(' ') + '﴾';
}
function bigBox(q, card){
  const c = q.ctx;
  if(!c){ if(q.big) card.append(el('div', { class:'big' }, q.big)); return; }
  if(c.mq){
    card.append(el('div', { class:'verse mq' }, el('div', { class:'mqf' }, c.mq),
      el('div', { class:'pron' }, el('small', {}, 'تُقرأ: '), ...c.pron.map(([t, h]) => h ? el('span', { class:'mhl' }, t) : t)),
      el('div', { class:'mqr' }, el('span', { class:'vref' }, ctxRef(c.ref)), audioBtn(c.ref))));
    return;
  }
  if(c.hit){
    const ref = c.ref.replace(/–\d+$/, '');
    card.append(el('div', { class:'verse' }, c.pre ? c.pre + ' ' : '', ...c.hit.split(' ').flatMap((w, k) => k ? [' ', el('span', { class:'mhl' }, w)] : [el('span', { class:'mhl' }, w)]), c.post ? ' ' + c.post : '', ' ', el('span', { class:'vref' }, ctxRef(c.ref)), ' ', audioBtn(ref)));
    return;
  }
  if(q.big) card.append(el('div', { class:'big' }, q.big, ' ', el('span', { class:'vref' }, ctxRef(c.ref))));
  else card.append(el('div', { class:'vref', style:'text-align:center' }, 'الموضع: ' + ctxRef(c.ref)));
}
function verseBox(q, onTap){
  const box = el('div', { class:'verse' });
  q.v.forEach((w, i) => {
    const sp = el(onTap ? 'button' : 'span', { type:onTap ? 'button' : null, class:'vw' + (q.hl && q.hl.includes(i) && !q.parts ? ' hl' : '') },
      q.parts && q.hl && q.hl[0] === i ? q.parts.map(([t, h]) => h ? el('span', { class:'mhl' }, t) : t) : w);
    if(onTap) sp.addEventListener('click', () => onTap(i, sp));
    box.append(sp, ' ');
  });
  if(q.ref) box.append(el('span', { class:'vref' }, '(' + q.ref.replace(/\d+/g, d => AR(d)) + ')'), ' ', audioBtn(q.ref));
  return box;
}
// Each renderer draws the question and returns { ready(), check() -> {ok, sel, more?} }.
function choiceList(opts, cls){ // single choice, selected until checked
  const box = el('div', { class:'opts' + (cls ? ' ' + cls : '') }); let cur = null;
  const bs = opts.map(o => el('button', { type:'button', class:'opt', 'aria-pressed':'false', on:{ click:() => { if(S.done) return; cur = o; bs.forEach(b => b.setAttribute('aria-pressed', String(b === bt(o)))); S.ui.update(); } } }, el('span', { class:'ot' }, o), el('span', { class:'om' })));
  const bt = o => bs[opts.indexOf(o)];
  box.append(...bs);
  return { box, get: () => cur, mark(ans){ bs.forEach((b, k) => { b.disabled = true; const o = opts[k]; if(o === ans){ b.classList.add('right'); b.querySelector('.om').innerHTML = icon('check'); } else if(o === cur){ b.classList.add('wrong'); b.querySelector('.om').innerHTML = icon('x'); } }); } };
}
const R = {
  mcq(q, card){ card.append(el('div', { class:'q' }, q.q)); bigBox(q, card); return single(q, card); },
  vmcq(q, card){ card.append(el('div', { class:'q' }, q.q), verseBox(q)); return single(q, card); },
  fill(q, card){ card.append(el('div', { class:'q fillq' }, ...q.q.split('____').flatMap((t, i, a) => i < a.length - 1 ? [t, el('span', { class:'blank' }, '      ')] : [t]))); return single(q, card); },
  img(q, card){
    card.append(el('div', { class:'q' }, q.q), el('figure', { class:'bookimg' }, el('img', { src:'img/' + q.f, alt:'رسم لمقطع الفم والحلق يبيّن موضع خروج حرف', loading:'lazy' })));
    return single(q, card);
  },
  riddle(q, card){
    card.append(el('div', { class:'riddle-h' }, el('span', { class:'ic', html:icon('puzzle') }), 'فزورة تجويدية'), el('div', { class:'q' }, q.q));
    if(q.showImg) card.append(el('figure', { class:'bookimg' }, el('img', { src:'img/' + q.f, alt:'رسم لمقطع الفم والحلق يبيّن موضع خروج الحرف', loading:'lazy' })));
    const r = single(q, card); const chk = r.check;
    r.check = () => { const res = chk(); if(!q.showImg) card.append(el('figure', { class:'bookimg pop' }, el('img', { src:'img/' + q.f, alt:'موضع خروج الحرف', loading:'lazy' }))); return res; };
    return r;
  },
  tf(q, card){
    card.append(el('div', { class:'q' }, q.q)); bigBox(q, card);
    card.append(el('div', { class:'prop' }, el('small', {}, 'الإجابة المقترحة'), el('b', {}, q.prop)));
    return twoStage(card, q.right, q.opts.filter(x => x !== q.prop), q.ans, ['✓ صح', '✗ خطأ'], 'أحسنت، الإجابة المقترحة خاطئة. فما الإجابة الصحيحة؟');
  },
  stmt(q, card){ card.append(el('div', { class:'q' }, q.q)); return twoStage(card, q.ok, q.opts, q.fix, ['✓ صحيحة', '✗ خاطئة'], 'أحسنت، العبارة خاطئة. فما الصواب؟'); },
  open(q, card){
    card.append(el('div', { class:'q' }, q.q), el('div', { class:'kind', style:'font-weight:500' }, 'فكّر في الإجابة أو اكتبها على ورقة، ثم اكشفها وقيّم نفسك بصدق.'));
    const ans = el('div', { class:'prop', hidden:true }, el('small', {}, 'الإجابة النموذجية'), el('b', {}, q.a));
    card.append(ans); let shown = false, self = null;
    const row = el('div', { class:'opts tf', hidden:true });
    const good = el('button', { type:'button', class:'opt', 'aria-pressed':'false' }, '✓ أجبتها صحيحة'), bad = el('button', { type:'button', class:'opt', 'aria-pressed':'false' }, '✗ لم أعرفها كاملة');
    [good, bad].forEach(b => b.addEventListener('click', () => { if(S.done) return; self = b === good; good.setAttribute('aria-pressed', String(self)); bad.setAttribute('aria-pressed', String(!self)); S.ui.update(); }));
    row.append(good, bad); card.append(row);
    return { label: () => shown ? 'تحقّق' : 'اكشف الإجابة', ready: () => !shown || self != null,
      check(){ if(!shown){ shown = true; ans.hidden = false; row.hidden = false; return { more:true }; } good.disabled = bad.disabled = true; (self ? good : bad).classList.add(self ? 'right' : 'wrong'); return { ok:self, sel:'' }; } };
  },
  match(q, card){
    card.append(el('div', { class:'q' }, q.q && q.q !== 'صِل كل سؤال بجوابه' ? q.q : 'صِل كل سؤال بجوابه'), el('div', { class:'kind', style:'font-weight:500' }, 'اضغط على العنصر، ثم على ما يناسبه.'));
    const nums = '١٢٣٤٥٦'; let cur = 0; const asg = {};
    const ql = el('div', { class:'mq' }), al = el('div', { class:'ma' });
    const qb = q.pairs.map((p, i) => el('button', { type:'button', class:'mqi', on:{ click:() => { if(S.done) return; cur = i; paint(); } } }, el('span', { class:'num' }, nums[i]), el('span', {}, p.q)));
    const answers = shuffle(q.pairs.map(p => p.a));
    const ab = answers.map(a => el('button', { type:'button', class:'mai', on:{ click:() => { if(S.done) return; for(const k in asg) if(asg[k] === cur) delete asg[k]; asg[a] = cur; const nxt = q.pairs.findIndex((p, i) => !Object.values(asg).includes(i)); if(nxt >= 0) cur = nxt; paint(); } } }, el('span', { class:'num' }, ''), el('span', {}, a)));
    function paint(){ qb.forEach((b, i) => b.classList.toggle('sel', i === cur && !S.done)); ab.forEach((b, k) => { const v = asg[answers[k]]; b.querySelector('.num').textContent = v != null ? nums[v] : ''; b.classList.toggle('set', v != null); }); S.ui && S.ui.update(); }
    ql.append(...qb); al.append(...ab); card.append(ql, el('div', { class:'kind' }, 'الأجوبة'), al);
    paint();
    return { ready: () => Object.keys(asg).length >= q.pairs.length,
      check(){ let ok = true; ab.forEach((b, k) => { const a = answers[k]; const good = q.pairs[asg[a]]?.a === a; b.classList.add(good ? 'right' : 'wrong'); if(!good) ok = false; b.disabled = true; }); qb.forEach(b => b.disabled = true);
        if(!ok) card.append(el('div', { class:'review' }, el('b', {}, 'التوصيل الصحيح'), ...q.pairs.map((p, i) => el('div', { class:'it' }, nums[i] + '. ' + p.q + ' ← ', el('b', {}, p.a)))));
        return { ok, sel: ok ? '' : 'توصيل غير مكتمل' }; } };
  },
  order(q, card){
    card.append(el('div', { class:'q' }, q.q.replace(/^ما\s+/, '').replace(/؟$/, '') + ':'), el('div', { class:'kind' }, 'اضغط على العناصر بالترتيب'));
    const seq = []; const pool = shuffle(q.items.map((t, i) => ({ t, i })));
    const out = el('ol', { class:'seq' }), src = el('div', { class:'chips' });
    const btns = pool.map(o => el('button', { type:'button', class:'tok', on:{ click:() => { if(S.done) return; seq.push(o); paint(); } } }, o.t));
    const reset = el('button', { type:'button', class:'rz-link' }, 'إعادة الترتيب');
    reset.addEventListener('click', () => { if(S.done) return; seq.length = 0; paint(); });
    function paint(){ out.innerHTML = ''; seq.forEach(o => out.append(el('li', {}, o.t))); btns.forEach((b, k) => b.hidden = seq.includes(pool[k])); S.ui && S.ui.update(); }
    src.append(...btns); card.append(src, out, reset);
    return { ready: () => seq.length === q.items.length,
      check(){ const ok = seq.every((o, k) => o.t === q.items[k]); [...out.children].forEach((li, k) => li.classList.add(seq[k].t === q.items[k] ? 'right' : 'wrong')); reset.disabled = true; return { ok, sel:seq.map(o => o.t).join('، ') }; } };
  },
  pick(q, card){
    card.append(el('div', { class:'q' }, q.q));
    const sel = new Set();
    const box = verseBox(q, (i, b) => { if(S.done) return; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('on'); S.ui.update(); });
    card.append(box, el('div', { class:'kind', style:'font-weight:500' }, 'اضغط مرة أخرى لإلغاء الاختيار. الحكم الواحد بين كلمتين يكفي فيه اختيار إحداهما.'));
    return { ready: () => sel.size > 0,
      check(){ const all = new Set(q.g.flat()); const ok = q.g.every(g => g.some(i => sel.has(i))) && [...sel].every(i => all.has(i));
        [...box.querySelectorAll('.vw')].forEach((b, i) => { b.disabled = true; if(all.has(i)) b.classList.add(sel.has(i) ? 'right' : 'missed'); else if(sel.has(i)) b.classList.add('wrong'); });
        return { ok, sel:[...sel].map(i => q.v[i]).join('، ') }; } };
  },
  hunt(q, card){
    card.append(el('div', { class:'q' }, q.q));
    const sel = new Set();
    const box = verseBox(q, (i, b) => { if(S.done) return; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('on'); S.ui.update(); });
    card.append(box, el('div', { class:'kind', style:'font-weight:500' }, 'اختر الكلمة التي فيها النون أو الميم أو الحرف الذي عليه الحكم. اضغط مرة أخرى لإلغاء الاختيار.'));
    return { ready: () => sel.size > 0,
      check(){ const want = new Set(q.g), extra = new Set(q.x || []);
        const ok = q.g.every(i => sel.has(i)) && [...sel].every(i => want.has(i) || extra.has(i));
        [...box.querySelectorAll('.vw')].forEach((b, i) => { b.disabled = true; if(want.has(i)) b.classList.add(sel.has(i) ? 'right' : 'missed'); else if(sel.has(i) && !extra.has(i)) b.classList.add('wrong'); });
        return { ok, sel:[...sel].map(i => q.v[i]).join('، ') }; } };
  },
  multi(q, card){
    card.append(el('div', { class:'q' }, q.q), verseBox(q));
    const sel = new Set(); const o = el('div', { class:'opts four' });
    const bs = q.opts.map(x => el('button', { type:'button', class:'opt ar', 'aria-pressed':'false', on:{ click:e => { if(S.done) return; sel.has(x) ? sel.delete(x) : sel.add(x); e.currentTarget.setAttribute('aria-pressed', String(sel.has(x))); S.ui.update(); } } }, x));
    o.append(...bs); card.append(o, el('div', { class:'kind', style:'font-weight:500' }, 'قد يكون أكثر من خيار صحيح.'));
    return { ready: () => sel.size > 0,
      check(){ const ok = q.set.length === sel.size && q.set.every(x => sel.has(x));
        bs.forEach((b, k) => { const x = q.opts[k]; b.disabled = true; if(q.set.includes(x)) b.classList.add(sel.has(x) ? 'right' : 'missed'); else if(sel.has(x)) b.classList.add('wrong'); });
        return { ok, sel:[...sel].join('، ') }; } };
  },
  sort(q, card){
    card.append(el('div', { class:'q' }, q.q));
    let cur = 0; const asg = new Map();
    const words = q.it.map((it, k) => el('button', { type:'button', class:'tok ar', on:{ click:() => { if(S.done) return; cur = k; paint(); } } }, it.w));
    const bins = q.b.map((b, bi) => { const box = el('div', { class:'bin' }); const head = el('button', { type:'button', class:'binh', on:{ click:() => { if(S.done || cur == null) return; asg.set(cur, bi); const nx = q.it.findIndex((_, k) => !asg.has(k)); cur = nx >= 0 ? nx : null; paint(); } } }, b); box.append(head, el('div', { class:'binw' })); return box; });
    const wrap = el('div', { class:'chips' }), binsW = el('div', { class:'bins' }, ...bins);
    function paint(){ wrap.innerHTML = ''; bins.forEach(b => b.querySelector('.binw').innerHTML = '');
      words.forEach((w, k) => { w.classList.toggle('sel', k === cur); if(asg.has(k)) bins[asg.get(k)].querySelector('.binw').append(w); else wrap.append(w); });
      S.ui && S.ui.update(); }
    card.append(el('div', { class:'kind' }, 'اختر الكلمة ثم اضغط على الحكم المناسب'), wrap, binsW);
    paint();
    return { ready: () => asg.size >= q.it.length,
      check(){ let ok = true; words.forEach((w, k) => { w.disabled = true; const good = asg.get(k) === q.it[k].b; w.classList.add(good ? 'right' : 'wrong'); if(!good) ok = false; });
        bins.forEach(b => b.querySelector('.binh').disabled = true);
        if(!ok) card.append(el('div', { class:'review' }, el('b', {}, 'التصنيف الصحيح لما أخطأت فيه'), ...q.it.filter((it, k) => asg.get(k) !== it.b).map(it => el('div', { class:'it' }, el('span', { class:'arw' }, it.w), ' ← ', el('b', {}, q.b[it.b]), it.e ? el('div', { class:'rz-meta' }, it.e) : ''))));
        return { ok, sel:'' }; } };
  }
};
function single(q, card){
  const c = choiceList(q.opts); card.append(c.box);
  return { ready: () => c.get() != null, check(){ c.mark(q.ans); return { ok: c.get() === q.ans, sel: c.get() }; } };
}
function twoStage(card, isTrue, fixOpts, fix, labels, followText){
  const c = choiceList(labels, 'tf'); card.append(c.box); let stage = 1, c2 = null;
  return { ready: () => stage === 1 ? c.get() != null : c2.get() != null,
    check(){
      if(stage === 1){
        const saidTrue = c.get() === labels[0];
        if(saidTrue !== isTrue){ c.mark(isTrue ? labels[0] : labels[1]); return { ok:false, sel:c.get() }; }
        if(isTrue || !fixOpts.length){ c.mark(isTrue ? labels[0] : labels[1]); return { ok:true, sel:c.get() }; }
        c.mark(labels[1]); stage = 2;
        c2 = choiceList(fixOpts); card.append(el('div', { class:'follow' }, el('div', { class:'kind' }, followText), c2.box));
        return { more:true };
      }
      c2.mark(fix); return { ok: c2.get() === fix, sel: c2.get() };
    } };
}
function render(){
  const q = S.qs[S.i]; S.done = false; app.innerHTML = '';
  document.body.classList.add('rz-quiz');
  if(S.T.seed != null) RAND = mulberry32(S.T.seed * 977 + S.i); else RAND = Math.random;
  const back = S.T.back || (S.T.kind === 'custom' ? '#/builder' : S.T.kind === 'review' ? '#/mistakes' : ['lesson', 'jump'].includes(S.T.kind) ? '#/path' : '#/');
  const top = el('div', { class:'rz-qtop' },
    el('button', { type:'button', class:'rz-icon', 'aria-label':'إنهاء الاختبار', html:icon('close'), on:{ click:() => { clearInterval(S.tm); S = null; clearResume(); if(back[0] === '#') location.hash = back; else location.href = back; } } }),
    el('div', { class:'rz-prog', role:'progressbar', 'aria-valuemin':'0', 'aria-valuemax':String(S.qs.length), 'aria-valuenow':String(S.i), 'aria-label':'التقدّم' }, el('i', { style:`width:${100 * S.i / S.qs.length}%` })));
  if(S.hearts != null) top.append(el('span', { class:'hearts', 'aria-label':'القلوب: ' + AR(S.hearts) }, ...[0, 1, 2].map(k => el('span', { class:'ic' + (k < S.hearts ? '' : ' off'), html:icon('heart') }))));
  top.append(el('span', { class:'rz-meta', style:'font-weight:600' }, AR(S.i + 1) + ' / ' + AR(S.qs.length)));
  app.append(top);
  const meta = el('div', { class:'qmeta' }, el('span', {}, KIND[q.type] || ''));
  const chT = q.ch && BANK[q.ch] ? short(BANK[q.ch].title) : '';
  if(chT && S.T.kind !== 'chapter') meta.append(el('span', {}, '·'), el('span', {}, chT));
  if(q.nb) meta.append(el('span', { class:'rz-badge bad' }, 'من دفتر أخطائك'));
  if(S.streak >= 3) meta.append(el('span', { class:'combo pop', title:'النقاط مضاعفة' }, el('span', { class:'ic', html:icon('flame') }), AR(S.streak) + ' متتالية · النقاط ×٢'));
  meta.append(el('span', { class:'rz-badge', style:'margin-inline-start:auto' }, DL[q.d] || 'متوسط'));
  if(canShareQ(q)) meta.append(el('button', { type:'button', class:'qshare', 'aria-label':'شارك هذا السؤال', html:icon('share'), on:{ click:() => shareQ(q) } }));
  app.append(meta);
  const card = el('section', { class:'qcard pop' });
  app.append(card);
  const checkBtn = el('button', { type:'button', class:'rz-btn pri block' }, 'تحقّق');
  const hint = !ls.get('rz-hint', 0) ? el('div', { class:'rz-note', style:'justify-content:center' }, 'اختر إجابتك، ثم اضغط «تحقّق» لترى الصواب والشرح.') : '';
  const bar = actionBar(hint, checkBtn); app.append(bar);
  S.ui = { card, bar, checkBtn, update(){ if(!S || S.done || !S.ui.r) return; checkBtn.disabled = !S.ui.r.ready(); if(S.ui.r.label) checkBtn.textContent = S.ui.r.label(); } };
  S.ui.r = (R[q.type] || R.mcq)(q, card);
  checkBtn.addEventListener('click', () => { if(S.done || !S.ui.r.ready()) return; ls.set('rz-hint', 1); const res = S.ui.r.check(); if(res.more){ S.ui.update(); fitAction(); return; } finish(res.ok, res.sel); });
  S.ui.update(); fitAction();
  clearInterval(S.tm);
  if(S.T.lvl === '4' && S.T.kind !== 'review'){
    const secs = ['mcq', 'tf', 'vmcq', 'fill', 'stmt', 'img', 'riddle'].includes(q.type) ? 25 : 55; let left = secs;
    const tbar = el('div', { class:'timer', role:'timer', 'aria-label':'الوقت المتبقي' }, el('i', {}), el('span', {}, AR(secs)));
    card.insertBefore(tbar, card.firstChild); const fill = tbar.firstChild, num = tbar.lastChild;
    S.tm = setInterval(() => { if(!S || S.done){ clearInterval(S && S.tm); return; } left -= .25; fill.style.width = (100 * left / secs) + '%'; num.textContent = AR(Math.ceil(left));
      if(left <= 0){ clearInterval(S.tm); card.querySelectorAll('button').forEach(b => b.disabled = true); finish(false, 'انتهى الوقت', true); } }, 250);
  }
}
function finish(ok, sel, timeout){
  if(S.done) return; S.done = true; clearInterval(S.tm);
  const q = S.qs[S.i];
  let gain = 0;
  if(ok){ S.right++; S.streak++; S.best = Math.max(S.best, S.streak); gain = (q.d || 2) * 10 * (S.streak >= 3 ? 2 : 1); S.score += gain; S.xp += gain;
    beep(S.streak === 3 ? 'combo' : 'ok'); if(S.streak === 3) RZ.toast('🔥 ثلاث صحيحة متتالية! النقاط مضاعفة'); }
  else { S.streak = 0; beep('no'); S.ui.card.classList.remove('pop'); void S.ui.card.offsetWidth; S.ui.card.classList.add('shake');
    if(S.hearts != null) S.hearts = Math.max(0, S.hearts - 1);
    if(q.les && LES_NAME[q.les] && !S.weak.includes(q.les)) S.weak.push(q.les); }
  S.res.push({ ok, q, sel });
  masRecord(q.les, ok);
  if(ok && q.nb){ if(nbRight(q) === 'out') S.nbOut++; }
  else if(!ok) nbWrong(q);
  const got = RZ.answer({ ok, xp:gain, ch:q.ch, type:q.type, d:q.d, nb:!!q.nb });
  if(got.goalReached) setTimeout(() => RZ.toast('🎯 حقّقت هدفك اليومي!' + (got.streak ? ' سلسلتك: ' + plural(got.streak, RZ.DAY_FORMS) : '')), ok && S.streak === 3 ? 2500 : 300);
  if(got.levelUp) setTimeout(() => RZ.toast('🎉 صعدت إلى مستوى ' + got.levelUp.name), 900);
  const heartsOut = S.hearts === 0 && S.i < S.qs.length - 1;
  const last = S.i === S.qs.length - 1 || heartsOut;
  if(heartsOut) S.heartsOut = true;
  saveResume();
  const showAns = !ok && !['match', 'sort', 'open'].includes(q.type);
  const next = el('button', { type:'button', class:'rz-btn pri block' }, last ? 'النتيجة' : 'السؤال التالي');
  next.addEventListener('click', () => { if(last) end(); else { S.i++; render(); scrollTo(0, 0); } });
  const reportBtn = el('button', { type:'button', class:'rz-link small' }, 'أبلغ عن خطأ في هذا السؤال');
  reportBtn.addEventListener('click', () => RZ.report({ 'رقم السؤال': q.src || '', 'نوع السؤال': KIND[q.type], 'الباب': q.ch && BANK[q.ch] ? BANK[q.ch].title : '', 'السؤال': (q.q || '') + (q.big ? ' ' + q.big : '') + (q.v ? ' ﴿' + q.v.join(' ') + '﴾' : ''), 'الإجابة في التطبيق': q.ans }));
  const inner = S.ui.bar.firstChild; inner.innerHTML = '';
  S.ui.bar.classList.add(ok ? 'ok' : 'no');
  const links = el('div', { class:'rz-between' }, reportBtn);
  if(canShareQ(q)) links.prepend(el('button', { type:'button', class:'rz-link small', on:{ click:() => shareQ(q) } }, 'شارك السؤال'));
  inner.append(el('div', { class:'t' }, ok ? 'أحسنت، إجابة صحيحة' + (gain ? ' · +' + AR(gain) : '') : timeout ? 'انتهى الوقت' : showAns ? 'الإجابة الصحيحة: ' + q.ans : 'إجابة غير صحيحة'),
    q.e ? el('div', { class:'fbe' }, q.e) : '',
    !ok && q.les && LES_NAME[q.les] ? el('div', { class:'rz-meta' }, 'الدرس: ' + LES_NAME[q.les] + ' · ستجده في آخر الاختبار لتتدرّب عليه') : '',
    heartsOut ? el('div', { class:'t' }, 'انتهت القلوب الثلاثة') : '',
    next, links);
  fitAction();
  next.focus({ preventScroll:true });
}
function end(){
  clearResume();
  if(S.T.kind === 'riddle'){
    const ok = S.right === 1, q = S.qs[0], st = { day:RZ.today(), ok, ans:q.ans };
    ls.set('rz-riddle', st); if(ok){ RZ.game.riddles = (RZ.game.riddles || 0) + 1; RZ.gsave(); } RZ.taskEvent('riddle'); RZ.quizDone({ kind:'riddle', n:1, wrong:ok ? 0 : 1 });
    S = null; history.replaceState(null, '', '#/riddle'); return riddleDone(st);
  }
  const n = S.qs.length, done = S.res.length, r = S.right, f = r / n, stars = f >= 1 ? 3 : f >= .9 ? 2 : f >= .7 ? 1 : 0, id = S.T.id, T = S.T;
  const wrong = S.res.filter(x => !x.ok);
  if(T.kind === 'chapter' && n >= 10){ save.best[id] = Math.max(save.best[id] || 0, r); save.stars[id] = Math.max(save.stars[id] || 0, stars); persist(); }
  if(T.kind === 'lesson' && T.key){ save.les[T.key] = Math.max(save.les[T.key] || 0, stars); persist(); }
  let passed = null;
  if(T.kind === 'final'){ passed = r >= Math.ceil(n * .8); if(passed){ save.gold[T.ch] = 1; persist(); RZ.flag('gold'); } }
  if(T.kind === 'jump'){ passed = r >= Math.ceil(n * .8); if(passed){ save.jump = Math.max(save.jump, T.idx); persist(); } }
  let streakNow = 0; if(T.kind === 'daily'){ streakNow = RZ.markDailyDone(); ls.set('rz-daily-done', RZ.today()); }
  RZ.quizDone({ kind:T.kind, n:done, wrong:wrong.length, lvl:T.lvl });
  document.body.classList.remove('rz-quiz');
  app.innerHTML = '';
  const again = () => start(T);
  const btns = el('div', { class:'rz-wrap' });
  const canAgain = T.make && !['review', 'daily', 'single'].includes(T.kind);
  if(S.heartsOut && done < n){
    const keep = S; btns.append(el('button', { type:'button', class:'rz-btn pri', on:{ click:() => { S = keep; S.hearts = null; S.heartsOut = false; S.i++; history.replaceState(null, '', '#/quiz'); render(); } } }, 'أكمل الأسئلة الباقية للتعلّم'));
  }
  if(canAgain) btns.append(el('button', { type:'button', class:'rz-btn' + (S.heartsOut ? '' : ' pri'), on:{ click:again } }, T.kind === 'shared' ? 'أعد الاختبار نفسه' : T.kind === 'final' || T.kind === 'jump' ? 'حاول مرة أخرى' : 'اختبار جديد'));
  if(T.kind === 'custom') btns.append(el('a', { class:'rz-btn', href:'#/builder' }, 'تعديل الدروس'));
  if(['lesson', 'jump', 'final'].includes(T.kind)) btns.append(el('a', { class:'rz-btn', href:'#/path' }, 'مسار الدروس'));
  if(T.kind === 'single' && T.les && LES_NAME[T.les]) btns.append(el('button', { type:'button', class:'rz-btn pri', on:{ click:() => lessonQuiz(T.les, true) } }, 'جرّب اختبارًا في الدرس نفسه'));
  // challenge a friend with exactly the same questions
  const shareCfg = T.kind === 'shared' ? T.cfg : (T.kind === 'custom' || T.kind === 'lesson') && T.seed != null ? { sel:T.keys, n, lvl:T.lvl || 'mix', seed:T.seed, name:T.kind === 'lesson' ? T.title : '' } : null;
  if(shareCfg && shareCfg.sel && shareCfg.sel.length) btns.append(el('button', { type:'button', class:'rz-btn', on:{ click:async () => {
    const url = shareUrl(Object.assign({}, shareCfg, { sc:r, by:RZ.settings().name || '' }));
    const text = `حصلت على ${AR(r)} من ${AR(n)} في «${T.title}» على تطبيق رسوخ. هل تتفوق عليّ؟ الأسئلة نفسها في هذا الرابط:`;
    try{ if(navigator.share){ await navigator.share({ title:'تحدٍّ في رسوخ', text, url }); return; } }catch(e){ return; }
    try{ await navigator.clipboard.writeText(text + '\n' + url); RZ.toast('نُسخ رابط التحدّي'); }catch(e){}
  } } }, 'تحدَّ صديقًا'));
  btns.append(el('a', { class:'rz-btn', href:T.kind === 'daily' || T.kind === 'single' ? '../' : T.kind === 'review' ? '#/mistakes' : '#/' }, T.kind === 'daily' || T.kind === 'single' ? 'الرئيسية' : T.kind === 'review' ? 'دفتر أخطائي' : 'مكتبة الاختبارات'));
  let msg = r === n ? 'ما شاء الله، علامة كاملة!' : f >= .7 ? 'أحسنت! أتقنت معظم الأسئلة.' : 'راجع أخطاءك في الأسفل؛ ستعود إليك في دفتر أخطائك.';
  if(passed === true) msg = T.kind === 'final' ? '🥇 نجحت في اختبار الختام، وصار هذا الباب ذهبيًا!' : 'نجحت في اختبار القفز، وفُتحت الدروس حتى هذا الدرس.';
  if(passed === false) msg = 'تحتاج ' + AR(Math.ceil(n * .8)) + ' إجابات صحيحة على الأقل للنجاح. راجع الدروس ثم حاول مرة أخرى.';
  if(S.heartsOut) msg = 'انتهت القلوب الثلاثة. يمكنك إكمال الأسئلة الباقية للتعلّم بلا قلوب.';
  const vs = T.vs != null ? el('div', { class:'rz-note', style:'font-weight:600;color:var(--ink)' }, r > T.vs ? `🏆 تفوقت على ${T.by || 'صاحب التحدّي'} (${AR(T.vs)} من ${AR(n)})` : r === T.vs ? `تعادلت مع ${T.by || 'صاحب التحدّي'}` : `${T.by || 'صاحب التحدّي'} حصل على ${AR(T.vs)} من ${AR(n)}. جرّب مرة أخرى!`) : '';
  app.append(el('section', { class:'rz-card pop end' },
    el('span', { class:'rz-meta' }, T.title),
    el('div', { class:'score' }, `${AR(r)} من ${AR(S.heartsOut ? done : n)}`),
    T.kind === 'chapter' || T.kind === 'lesson' ? starStr(stars) : '',
    el('p', { style:'margin:0' }, msg), vs,
    el('div', { class:'rz-wrap' },
      S.xp ? el('span', { class:'rz-badge plain' }, '+' + AR(S.xp) + ' نقطة') : '',
      T.kind === 'daily' ? el('span', { class:'rz-badge' }, el('span', { class:'ic', html:icon('flame') }), 'سلسلتك: ' + plural(streakNow, RZ.DAY_FORMS)) : '',
      S.nbOut ? el('span', { class:'rz-badge plain' }, 'خرج من دفتر أخطائك: ' + plural(S.nbOut, RZ.Q_FORMS)) : ''),
    el('p', { class:'rz-meta', style:'margin:0' }, `مستواك: ${RZ.level().name} · أطول سلسلة صحيحة: ${AR(S.best)}`),
    btns,
    T.kind === 'chapter' && stars === 3 && !save.gold[id] ? el('button', { type:'button', class:'rz-link', on:{ click:() => finalExam(id) } }, '🏆 جرّب اختبار ختام هذا الباب') : '',
    RZ.settings().dua !== false ? el('p', { class:'rz-meta', style:'margin:6px 0 0;text-align:center;font-family:var(--f-q);font-size:17px' }, RZ.DUA_CLOSE) : ''));
  if(S.weak.length){
    app.append(el('section', { class:'rz-card' }, el('b', {}, 'تدرّب على الدروس التي أخطأت فيها'),
      ...S.weak.slice(0, 4).map(k => el('button', { type:'button', class:'rz-list-btn', on:{ click:() => lessonQuiz(k, true) } }, el('span', { class:'rz-ic', html:icon('path') }), el('span', { class:'grow' }, el('b', {}, LES_NAME[k]), el('span', { class:'rz-meta' }, 'اختبار من ١٠ أسئلة في هذا الدرس')), el('span', { class:'chev', html:icon('chev') })))));
  }
  if(wrong.length){ const rv = el('div', { class:'review' }, el('h2', { class:'rz-h' }, 'راجع أخطاءك'));
    wrong.forEach(x => { const q = x.q;
      const title = q.type === 'match' ? 'توصيل' : q.type === 'sort' ? q.q : (q.q + (q.big ? ` ${q.big}` : '') + (q.v ? ` ﴿${q.v.join(' ')}﴾` : ''));
      rv.append(el('div', { class:'it' }, el('div', { style:'font-weight:600' }, el('span', { class:'rz-badge plain', style:'margin-inline-end:6px' }, KIND[q.type]), title),
        el('div', {}, x.sel ? el('s', {}, x.sel) : '', x.sel ? ' ' : '', el('b', {}, '← ' + q.ans)), q.e ? el('div', { class:'rz-meta' }, q.e) : '')); });
    app.append(rv); }
  S = null;
  history.replaceState(null, '', location.pathname + location.search + (['shared', 'single'].includes(T.kind) ? '#/' : location.hash.replace('#/quiz', '#/done')));
  scrollTo(0, 0);
}

/* ---------- مسار الدروس: lessons as a winding path ---------- */
function unlockedIdx(){
  const sel = new Set(CUS.sel); let u = 0;
  ORDER.forEach((o, i) => { if(sel.has(o.key)) u = Math.max(u, i); if((save.les[o.key] || 0) >= 1) u = Math.max(u, i + 1); });
  return Math.max(u, save.jump);
}
function path(){
  app.innerHTML = '';
  const U = unlockedIdx();
  app.append(topBar('مسار الدروس', '../'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'كل دائرة درس. اختبار الدرس ١٠ أسئلة: ٧ صحيحة تعطيك نجمة وتفتح الدرس التالي، و١٠ تعطيك ٣ نجوم. الدروس حتى ما وصلت إليه مع أستاذك مفتوحة من البداية.'));
  let idx = 0;
  LEVELS.forEach(L => {
    app.append(el('h2', { class:'rz-h' }, L.name + (L.sub ? ' · ' + L.sub : '')));
    L.ids.forEach(id => {
      const sec = el('section', { class:'pathsec' + (save.gold[id] ? ' gold' : '') });
      sec.append(el('div', { class:'rz-between' }, el('b', {}, short(BANK[id].title)), save.gold[id] ? el('span', { class:'rz-badge' }, '🥇 ذهبي') : ''));
      const wrap = el('div', { class:'path' });
      LESSONS[id].ls.forEach((n, li) => {
        const key = id + ':' + li, i = idx++, open = i <= U, st = save.les[key] || 0;
        const node = el('button', { type:'button', class:'pnode' + (open ? '' : ' locked') + (st === 3 ? ' crown' : '') + (i === U ? ' cur' : ''), style:`--x:${[0, 1, 2, 1][i % 4]}`,
          'aria-label':n + (open ? (st ? ' · ' + AR(st) + ' نجوم' : '') : ' · مغلق'),
          on:{ click:() => open ? lessonQuiz(key) : jumpOffer(i, key, n) } },
          el('span', { class:'disc', html: open ? (st === 3 ? '👑' : AR(i + 1)) : icon('lock') }),
          el('span', { class:'pl' }, n), open ? starStr(st) : '');
        wrap.append(node);
      });
      wrap.append(el('button', { type:'button', class:'pnode final' + (save.gold[id] ? ' crown' : ''), style:'--x:1', on:{ click:() => finalExam(id) } },
        el('span', { class:'disc' }, save.gold[id] ? '🥇' : '🏆'), el('span', { class:'pl' }, 'اختبار ختام الباب'), el('span', { class:'rz-meta' }, save.gold[id] ? 'نجحت فيه' : '١٥ سؤالًا صعبًا · ١٢ للنجاح')));
      sec.append(wrap); app.append(sec);
    });
  });
  setTimeout(() => { const c = app.querySelector('.pnode.cur'); if(c) c.scrollIntoView({ block:'center' }); }, 50);
}
function jumpOffer(i, key, name){
  RZ.sheet((box, close) => {
    box.append(el('b', { style:'font-size:18px' }, 'هذا الدرس مغلق'), el('span', {}, '«' + name + '»'),
      el('span', { class:'rz-meta' }, 'إن كنت تعرف هذه الدروس، اجتز اختبار القفز: ١٠ أسئلة صعبة من الدروس حتى هذا الدرس في الباب نفسه. ٨ صحيحة تفتحها كلها.'),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => { close(); const id = key.split(':')[0]; const keys = ORDER.filter((o, k) => o.id === id && k <= i).map(o => o.key);
        start({ id:'jump', kind:'jump', idx:i, title:'اختبار القفز: ' + name, lvl:'3', back:'#/path', make:() => { const { pool, spec } = poolFor(keys); return buildN(pool, spec, 10, '3'); } }); } } }, 'ابدأ اختبار القفز'),
      el('a', { class:'rz-btn block', href:'../settings.html' }, 'أو غيّر «وصلت مع أستاذي إلى» من الإعدادات'));
  });
}
function finalExam(id){
  start({ id, ch:id, kind:'final', title:'اختبار ختام: ' + short(BANK[id].title), lvl:'3', back:'#/path', make:() => { const p = chapterPool(id); return buildN(p.pool, p.spec, 15, '3'); } });
}

/* ---------- جولة سريعة: as many as you can in 60 seconds ---------- */
function myKeys(){ return CUS.sel.length ? CUS.sel : LEVELS[0].ids.flatMap(id => LESSONS[id].ls.map((_, li) => id + ':' + li)); }
function speedPool(){
  const { pool, spec } = poolFor(myKeys());
  const qs = shuffle(pool.filter(q => q.a.length <= 60)).slice(0, 60).map(q => toQ(q));
  const sp = shuffle(spec.filter(s => ['mcq', 'fill', 'img', 'riddle'].includes(s.t))).slice(0, 30).map(toSpecial).filter(q => q.opts && q.opts.length);
  return shuffle(qs.concat(sp));
}
function speed(){
  app.innerHTML = ''; document.body.classList.remove('rz-quiz');
  app.append(topBar('جولة سريعة', '../'),
    el('section', { class:'rz-card' }, el('b', { style:'font-size:22px' }, '٦٠ ثانية'), el('span', {}, 'أجب عن أكبر عدد من الأسئلة. اضغط على الإجابة مباشرة، والسؤال التالي يظهر فورًا.'),
      el('span', { class:'rz-meta' }, 'الأسئلة من دروسك' + (CUS.sel.length ? '' : ' (المستوى الأول)') + '. رقمك القياسي: ' + AR(RZ.game.best60 || 0)),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:runSpeed } }, 'ابدأ')));
}
function runSpeed(){
  const qs = speedPool(); if(!qs.length){ RZ.toast('لا توجد أسئلة كافية'); return; }
  let i = 0, ok = 0, wrongN = 0, left = 60, lock = false; const t0 = Date.now();
  document.body.classList.add('rz-quiz');
  const timer = el('div', { class:'timer' }, el('i', {}), el('span', {}, '٦٠')); const cnt = el('b', { style:'font-size:22px;color:var(--good-ink)' }, '٠');
  const card = el('section', { class:'qcard' });
  app.innerHTML = ''; app.append(el('div', { class:'rz-between' }, el('span', { class:'rz-meta' }, 'صحيحة:'), cnt), timer, card);
  const tm = setInterval(() => { left = 60 - (Date.now() - t0) / 1000; timer.firstChild.style.width = Math.max(0, 100 * left / 60) + '%'; timer.lastChild.textContent = AR(Math.max(0, Math.ceil(left))); if(left <= 0){ clearInterval(tm); done(); } }, 200);
  function show(){
    const q = qs[i % qs.length]; card.innerHTML = '';
    card.append(el('div', { class:'q', style:'font-size:20px' }, q.type === 'fill' ? q.q.replace(/____/g, '……') : q.q));
    bigBox(q, card);
    if(q.type === 'img' || (q.type === 'riddle' && q.showImg)) card.append(el('figure', { class:'bookimg' }, el('img', { src:'img/' + q.f, alt:'موضع خروج الحرف', style:'max-width:240px' })));
    if(q.v) card.append(verseBox(q));
    const box = el('div', { class:'opts' });
    q.opts.forEach(o => box.append(el('button', { type:'button', class:'opt', on:{ click:e => {
      if(lock || left <= 0) return; lock = true; const good = o === q.ans;
      e.currentTarget.classList.add(good ? 'right' : 'wrong');
      if(good){ ok++; cnt.textContent = AR(ok); beep('ok'); } else { wrongN++; beep('no'); [...box.children].forEach(b => { if(b.textContent === q.ans) b.classList.add('right'); }); }
      RZ.answer({ ok:good, xp:good ? 5 : 0, ch:q.ch, type:q.type, d:q.d });
      setTimeout(() => { lock = false; i++; if(left > 0) show(); }, good ? 250 : 700);
    } } }, el('span', { class:'ot' }, o))));
    card.append(box);
  }
  function done(){
    document.body.classList.remove('rz-quiz');
    const best = RZ.game.best60 || 0, rec = ok > best; if(rec){ RZ.game.best60 = ok; RZ.gsave(); }
    RZ.quizDone({ kind:'speed', n:ok + wrongN, wrong:wrongN });
    app.innerHTML = '';
    app.append(el('section', { class:'rz-card pop end' }, el('span', { class:'rz-meta' }, 'جولة سريعة'), el('div', { class:'score' }, plural(ok, ['إجابة صحيحة واحدة', 'إجابتان صحيحتان', 'إجابات صحيحة', 'إجابة صحيحة'])),
      el('p', { style:'margin:0' }, rec ? '🎉 رقم قياسي جديد!' : 'رقمك القياسي: ' + AR(best)),
      el('div', { class:'rz-wrap' }, el('button', { type:'button', class:'rz-btn pri', on:{ click:runSpeed } }, 'جولة أخرى'), el('a', { class:'rz-btn', href:'../' }, 'الرئيسية'))));
  }
  show();
}

/* ---------- حزورة اليوم: one riddle a day, the same for everyone ---------- */
function riddleOfDay(){
  const list = []; Object.values(SPEC).forEach(l => l.forEach(s => { if((s.t === 'riddle' && s.d !== 1) || (s.t === 'img' && s.m === 'makh')) list.push(s); }));
  const r = RZ.seeded(RZ.daySeed() * 31 + 7); return withSeed(RZ.daySeed(), () => toSpecial(list[Math.floor(r() * list.length)]));
}
function riddle(){
  const st = ls.get('rz-riddle', {});
  if(st.day === RZ.today()) return riddleDone(st);
  const q = riddleOfDay();
  start({ id:'riddle', kind:'riddle', title:'حزورة اليوم · ' + RZ.dateAR(RZ.today()), back:'../', replace:true, make:() => [q] });
}
function riddleDone(st){
  app.innerHTML = ''; document.body.classList.remove('rz-quiz');
  const text = `رسوخ · حزورة ${RZ.dateAR(RZ.today())} 🧩\n${st.ok ? '✅ حللتها من المحاولة الأولى' : '❌ لم أحلّها اليوم'}\nجرّب حزورة اليوم في تطبيق رسوخ:`;
  app.append(topBar('حزورة اليوم', '../'), el('section', { class:'rz-card pop end' },
    el('div', { class:'score' }, st.ok ? '✅' : '❌'), el('b', {}, st.ok ? 'أحسنت، حللت حزورة اليوم!' : 'لم تُصب هذه المرة'), el('span', { class:'rz-meta' }, 'حزورة جديدة غدًا. لكل يوم محاولة واحدة.' + (st.ans ? ' الجواب: ' + st.ans : '')),
    el('div', { class:'rz-wrap' }, el('button', { type:'button', class:'rz-btn pri', on:{ click:async () => { const url = location.origin + location.pathname.replace(/library\/.*$/, ''); try{ if(navigator.share){ await navigator.share({ text, url }); return; } }catch(e){ return; } try{ await navigator.clipboard.writeText(text + '\n' + url); RZ.toast('نُسخت النتيجة'); }catch(e){} } } }, 'شارك نتيجتك'), el('a', { class:'rz-btn', href:'../' }, 'الرئيسية'))));
}

route();
})();