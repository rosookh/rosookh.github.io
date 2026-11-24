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
const B5 = SPEC.l2c1 ? SPEC.l2c1.filter(s => s.b5) : []; if(SPEC.l2c1) SPEC.l2c1 = SPEC.l2c1.filter(s => !s.b5); // batch-5 items go after the riddles so older ids stay the same
if(window.RIDDLES && SPEC.l2c1){ RIDDLES.forEach(r => [1, 2, 3].forEach(d => SPEC.l2c1.push({ t:'riddle', i:r.i, d, les:1, r }))); }
if(SPEC.l2c1) SPEC.l2c1.push(...B5);
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
const LAQAB = { jawf:'جوفية (هوائية)', aqsa_halq:'حلقية', wasat_halq:'حلقية', adna_halq:'حلقية', qaf:'لهوية', kaf:'لهوية', wasat:'شجرية', lam:'ذلقية', nun:'ذلقية', ra:'ذلقية', nat:'نطعية', lith:'لثوية', safir:'أسلية', fa:'شفوية', shaf:'شفوية' };
const near = (a, b) => a === b || NEAR.some(s => s.includes(a) && s.includes(b));

/* ---------- question building ---------- */
const KIND = { imgpick:'اختر الرسمة', dglow:'ما اسم الجزء المضيء؟', dplace:'انقل الاسم إلى مكانه', fill:'أكمل الفراغ', stmt:'ضع إشارة ✓ أو ✗', open:'أجب ثم اكشف الإجابة', mcq:'اختر إجابة واحدة', tf:'صح أم خطأ؟', match:'صِل كل سؤال بجوابه', order:'رتّب حسب المطلوب', pick:'استخرج من الآية', multi:'اختر كل ما ينطبق', sort:'صنّف الكلمات', vmcq:'اختر إجابة واحدة', hunt:'صيد الأحكام', img:'سؤال على صورة', riddle:'من أنا؟' };
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
  if(s.t === 'pick') return { ...b, type:'pick', d:2, q:s.p, v:s.v, g:s.g, x:s.x || [], ref:s.ref, ans:s.g.map(g => g.map(i => s.v[i]).join(' ')).join('، '), e:s.e };
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
  if(s.t === 'dg' && window.RZ_DIAG){
    const D = RZ_DIAG[s.dg], names = Object.keys(D.parts);
    if(s.m === 'glow'){ const wr = shuffle(names.filter(n => n !== s.part)).slice(0, 3);
      return { ...b, type:'dglow', d:s.d || 2, dg:s.dg, part:s.part, q:'ما اسم الجزء المضيء في رسمة ' + D.title + '؟', opts:shuffle([s.part, ...wr]), ans:s.part, e:s.e || '' }; }
    if(s.m === 'count'){ const n = D.parts[s.part].n, wr = shuffle([2, 4, 6, 8, 12, 16].filter(x => x !== n)).slice(0, 3);
      return { ...b, type:'dglow', d:s.d || 2, dg:s.dg, part:s.part, q:'كم عدد الأسنان المضيئة في الفم كله (العليا والسفلى)؟', opts:shuffle([n, ...wr].map(x => RZ.AR(x))), ans:RZ.AR(n), e:'هذه ' + s.part + '، وعددها ' + RZ.AR(n) + '.' }; }
    return { ...b, type:'dplace', d:s.d || 3, dg:s.dg, parts:s.parts, q:'انقل كل اسم إلى مكانه في رسمة ' + D.title, ans:s.parts.join('، '), e:s.e || '' };
  }
  if(s.t === 'img'){
    const im = IMGS[s.i];
    if(s.m === 'letter'){
      const seen = new Set([im.g]); const wr = [];
      for(const o of shuffle(IMGS)){ if(seen.has(o.g) || near(o.g, im.g)) continue; seen.add(o.g); wr.push(o.lab); if(wr.length === 3) break; }
      return { ...b, type:'img', d:2, f:im.f, q:/ و/.test(im.lab) ? 'من نحن؟' : 'من أنا؟', opts:shuffle([im.lab, ...wr]), ans:im.lab, e:im.lab + ': ' + MAKH[im.g] + '.' };
    }
    if(s.m === 'both' && LAQAB[im.g]){ // makhraj and laqab together, from the drawing
      const pair = g => MAKH[g] + ' · ' + LAQAB[g]; const seen = new Set([LAQAB[im.g]]), wr = [];
      for(const g of shuffle(Object.keys(LAQAB))){ if(near(g, im.g) || seen.has(LAQAB[g])) continue; seen.add(LAQAB[g]); wr.push(pair(g)); if(wr.length === 3) break; }
      return { ...b, type:'img', d:3, f:im.f, q:'ما مخرج الحرف في الصورة، وما لقبه؟', opts:shuffle([pair(im.g), ...wr]), ans:pair(im.g), e:im.lab + ': ' + MAKH[im.g] + '، ولقبه: ' + LAQAB[im.g] + '.' };
    }
    if(s.m === 'rev'){ // which drawing is the letter's? four drawings, never two from one makhraj
      const seen = new Set([im.g]); const wr = [];
      for(const o of shuffle(IMGS)){ if(seen.has(o.g) || near(o.g, im.g)) continue; seen.add(o.g); wr.push(o.f); if(wr.length === 3) break; }
      return { ...b, type:'imgpick', d:2, q:'أيّ رسمة هي رسمة ' + im.lab + '؟', opts:shuffle([im.f, ...wr]), ans:im.f, ansT:im.lab, e:im.lab + ': ' + MAKH[im.g] + '.' };
    }
    const wr = shuffle(Object.keys(MAKH).filter(g => !near(g, im.g))).slice(0, 3).map(g => MAKH[g]);
    return { ...b, type:'img', d:3, f:im.f, q:'ما مخرج الحرف المبيّن في الصورة؟', opts:shuffle([MAKH[im.g], ...wr]), ans:MAKH[im.g], e:'الحرف في الصورة: ' + im.lab + '.' };
  }
}
const NQ = 10, MIX = { 1:3, 2:4, 3:3 };
function akind(a){
  const t = a.replace(/[\u064B-\u0652\u0670]/g, '');
  if(/^(لأن|لأنه|لأنها|ل[اأ]ن|بسبب|لوقوع|لكثرة|لاتحاد|لقرب|لتقارب|لبعد|للتخلص|لمنع)/.test(t)) return 'why';
  if(/[0-9٠-٩]|^(واحد|اثن|ثلاث|أربع|خمس|ست|سبع|ثمان|تسع|عشر|حركتان|حركتين)/.test(t)) return 'num';
  if(/^(صغرى|وسطى|كبرى|عليا|دنيا|الأولى|الثانية|الثالثة|الرابعة|الخامسة|مرتبة|أعلى|أدنى|أقوى|أضعف)/.test(t)) return 'rank';
  if(/^(من |أقصى|وسط|أدنى|طرف|حافة|الشفت|بين الشفت|الخيشوم|الجوف|الحلق|اللسان|باطن)/.test(t)) return 'place';
  if(/^(إظهار|الإظهار|إدغام|الإدغام|إخفاء|الإخفاء|إقلاب|الإقلاب|مد|المد|قلقلة|القلقلة|تفخيم|التفخيم|ترقيق|الترقيق|يجوز|الوجهان|غنة|الغنة|متماثل|متجانس|متقارب|متباعد|همس|جهر|شدة|رخاوة|استعلاء|استفال)/.test(t)) return 'rule';
  if(t.length <= 12) return 'short';
  return 'text';
}
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
  // match items: four questions from the same chapter whose answers are of the same kind, so no answer gives itself away
  const groups = [], buckets = {}, seenA = new Set();
  for(const q of sh){ if(seenA.has(q.a)) continue; const k = q.ch + '|' + akind(q.a); (buckets[k] = buckets[k] || []).push(q); seenA.add(q.a);
    if(buckets[k].length === 4){ groups.push(buckets[k]); buckets[k] = []; } if(groups.length === 2) break; }
  // auto «صِل كل سؤال بجوابه» from unrelated questions removed (batch 5): only the hand-made matching sets (one kind of pair each) remain
  const ord = shuffle(pool.filter(isOrderQ));
  if(ord.length && RAND() < .7 && Q.length > 8) Q[8] = toOrder(ord[0]);
  const rec = shuffle(pool.filter(q => /^(ما تعريف|ما معنى|لماذا)/.test(q.q) && !used.has(q) && q.a.length > 12));
  if(rec[0] && Q.length > 7) Q[7] = { ...base(rec[0]), type:'open', d:rec[0].d, big:rec[0].big, ctx:rec[0].ctx, q:(/^لماذا/.test(rec[0].q) ? 'علّل: ' : '') + rec[0].q, a:rec[0].a + (rec[0].e ? '. ' + rec[0].e : ''), ans:rec[0].a, e:'' };
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
  if(lvl === '1') return spec.filter(s => specD(s) <= 2 && ['fill', 'stmt', 'sort', 'match', 'img', 'riddle', 'dg'].includes(s.t));
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
function masState(les){ const a = MAS[les]; if(!a || !a.length) return { s:'none' }; const p = a.reduce((x, y) => x + y, 0) / a.length; return { s: p >= .8 ? 'good' : p >= .5 ? 'mid' : 'review', p, n:a.length, few:a.length < 4 }; }
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
// notebook entries saved by older versions: drop questions that were removed or hidden, refresh special questions from today's data
(function nbClean(){ const m = nbAll(); let ch = false;
  Object.keys(m).forEach(k => { const src = m[k] && m[k].q && m[k].q.src || '';
    if(/^m:/.test(src) || (/^s:/.test(src) && (!SPEC_BY_ID[src] || HIDDEN_SRC.has(SPEC_BY_ID[src].src))) || /تحفة الأطفال/.test(JSON.stringify(m[k].q))){ delete m[k]; ch = true; } });
  if(ch) nbSave(m);
  try{ const r = localStorage.getItem('rz-resume'); if(r && (/تحفة الأطفال/.test(r) || /"src":"m:/.test(r))) localStorage.removeItem('rz-resume'); }catch(e){} })();
function revive(k, e){ const fresh = /^s:/.test(e.q.src || '') && SPEC_BY_ID[e.q.src] ? toSpecial(SPEC_BY_ID[e.q.src]) : null;
  const q = fresh && fresh.type === e.q.type ? fresh : JSON.parse(JSON.stringify(e.q)); q.nb = k; if(q.opts && q.type !== 'tf') q.opts = shuffle(q.opts); if(q.type === 'match') q.pairs = shuffle(q.pairs); if(q.type === 'sort') q.it = shuffle(q.it); return q; }

/* «اختبر استعدادك للامتحان»: a full level exam out of 100, built like the real level exams.
   Q1 صح أم خطأ (20) · Q2 اختر (20) · Q3 عرّف (10, self-marked) · Q4 أجب (20, self-marked) · Q5 تطبيقي (30).
   Loaded before engine.js; uses its helpers (el, app, shuffle, topBar, BANK, LEVELS…) at call time. */
const EX_KEY = 'rz-exam';
const exAR = n => { const r = Math.round(n * 2) / 2; return RZ.AR(String(r).replace('.', '٫')); };

function examUI(arg){
  if(arg && EXAM.levels[arg]) return examPaper(arg);
  app.innerHTML = '';
  const best = ls.get('rz-exam-best', {});
  app.append(topBar('اختبر استعدادك', '../'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'امتحان كامل من ١٠٠ بأسلوب امتحانات المستويات. أسئلة الاختيار تُصحَّح تلقائيًا، والأسئلة المكتوبة تقارنها بالجواب النموذجي.'));
  const saved = ls.get(EX_KEY, null);
  if(saved && !saved.done) app.append(el('a', { class:'rz-list-btn', style:'border:2px solid var(--ocean)', href:'#/exam/' + saved.lv },
    el('span', { class:'rz-ic', html:icon('resume') }), el('span', { class:'grow' }, el('b', {}, 'أكمل امتحانك'), el('span', { class:'rz-meta' }, EXAM.levels[saved.lv].name))));
  Object.entries(EXAM.levels).forEach(([k, L]) => {
    app.append(el('button', { type:'button', class:'rz-tile c-' + ['green', 'ocean', 'sand'][k - 1], style:'min-height:0;text-align:start;width:100%', on:{ click:() => { ls.set(EX_KEY, null); go('#/exam/' + k); } } },
      el('span', { html:icon('timer') }), el('b', {}, L.name), el('span', { class:'rz-meta' }, L.topics + (k > 1 ? ' · ويشمل مادة ' + (k == 2 ? 'المستوى الأول' : 'المستويين الأول والثاني') : '')),
      el('span', { class:'rz-meta' }, best[k] != null ? 'أفضل علامة: ' + exAR(best[k]) + ' من ١٠٠' : 'نحو ٤٥ دقيقة')));
  });
  app.append(el('div', { class:'rz-note' }, el('span', {}, 'يتغيّر الامتحان في كل مرة. ورقة الحفظ («اكتب من … إلى …») تجدها في مساعد الحفظ، تبويب «التسميع الكتابي».')));
}

/* ---------- build ---------- */
function bankMcq(lv){ // extra 4-option items from the chapters of this level and every level before it (exams are cumulative)
  return LEVELS.filter(x => +x.n <= +lv && +x.n <= 3).flatMap(x => x.ids).flatMap(id => BANK[id].questions).filter(q => q.w && q.w.length >= 3 && !q.big && q.q.length < 140 && q.src !== 'tuhfa')
    .map(q => [q.q, [q.a, ...q.w.slice(0, 3)], 0, q.e || '']);
}
/* cumulative pick: about half from the level itself, the rest from the levels before it */
function cumPick(lv, part, n){
  const own = shuffle((EXAM.levels[lv][part] || []).slice()), prev = shuffle(Object.keys(EXAM.levels).filter(k => +k < +lv).flatMap(k => EXAM.levels[k][part] || []));
  if(!prev.length) return own.slice(0, n);
  const a = Math.min(own.length, Math.ceil(n / 2)); return shuffle(own.slice(0, a).concat(prev.slice(0, n - a))).concat(own.slice(a)).slice(0, n);
}
function examBuild(lv){
  const L = EXAM.levels[lv], pick = (a, n) => shuffle(a).slice(0, n);
  const mcq = cumPick(lv, 'mcq', 7).concat(pick(bankMcq(lv), 3)).slice(0, 10)
    .map(([q, o, a, e]) => { const ord = o.some(t => / \+ /.test(t)) ? o.map((_, i) => i) : shuffle([0, 1, 2, 3].slice(0, o.length)); // keep combo options ("أ + ب", "جميع…") last
      const fixed = o.map((t, i) => /^[أب] \+ |^[بج] \+ |جميع ما|لا شيء مما/.test(t)); const free = ord.filter(i => !fixed[i]), keep = o.map((_, i) => i).filter(i => fixed[i]);
      const order = free.concat(keep); return { q, o: order.map(i => o[i]), a: order.indexOf(a), e }; });
  const P = { lv, at: Date.now(), done:false,
    tf: cumPick(lv, 'tf', 10).map(([s, ok, fix]) => ({ s, ok, fix })),
    mcq,
    defs: cumPick(lv, 'defs', 5).map(([t, m, k]) => ({ t, m, k })),
    open: cumPick(lv, 'open', 4).map(([q, m, k]) => ({ q, m, k })),
    prac: [] };
  if(lv === '1'){ const x = pick(L.ext, 1)[0]; P.prac.push({ k:'ext', x, r: pick(x.r, 10), m:30 }); }
  else if(lv === '2'){ const x = pick(L.ext.concat(EXAM.levels[1].ext), 1)[0]; P.prac.push({ k:'ext', x, r: pick(x.r, 5), m:15 });
    const madd = L.ana.filter(a => a.f[0][0] === 'نوع المد'), ra = L.ana.filter(a => a.f[0][0] !== 'نوع المد');
    P.prac.push({ k:'ana', t:'بيّن نوع المد وحكمه ومقداره', items: pick(madd, 3), m:9 }, { k:'ana', t:'ما حكم الراء؟ مع التعليل', items: pick(ra, 3), m:6 }); }
  else { const x = pick(EXAM.levels[2].ext.concat(EXAM.levels[1].ext), 1)[0];
    P.prac.push({ k:'ana', t:'بيّن نوع اللام وحكمها', items: pick(L.ana, 4), m:16 }, { k:'ext', x, r: pick(x.r, 7), m:14 }); }
  P.ans = { tf:{}, mcq:{}, self:{}, ext:{}, ana:{} };
  return P;
}


/* ---------- lenient keyword check for written answers (offline, on the device) ----------
   Both texts are normalised: no diacritics/tatweel, every hamza form and bare alif the same, ى=ي, ة=ه, no «ال», no punctuation.
   Keywords come from the model answer; a word counts if a light stem of it appears in the learner's answer. */
const KW_STOP = new Set('في من علي عن الي ان او ثم مع ما لا هو هي هذا هذه ذلك التي الذي اذا كان كل بين عند غير دون قد له لها به بها فيه فيها اي وهو وهي ويكون يكون تكون مثل نحو كما بعد قبل حتي لان سواء اما سبب بسبب واحد واحده ليس بل غالبا دايما ايضا'.split(' '));
const kwNorm = t => String(t || '').replace(/﴿[^﴾]*﴾/g, ' ').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱءؤئ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-ي0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
// light stem → consonant skeleton (no ال, no و/ف/ب/ل prefix, no common suffixes, no weak letters ا و ي ه)
const kwStem = w => { w = w.replace(/^(و|ف|ب|ل|ك)(?=ال)/, '').replace(/^ال/, ''); if(w.length > 4) w = w.replace(/^(و|ف|ب|ل)/, '');
  if(w.length > 4) w = w.replace(/(هما|ات|ان|ين|ون|يه|ها|هم)$/, ''); const k = w.replace(/^[يتنا](?=...)/, '').replace(/[اويه]/g, ''); return k.length >= 2 ? k : w; };
const kwWords = t => kwNorm(t).split(' ').filter(w => w.length >= 3 && !KW_STOP.has(w) && !KW_STOP.has(w.replace(/^ال/, '')));
const kwHit = (st, have) => have.some(h => h === st || (Math.min(h.length, st.length) >= 3 && (h.startsWith(st) || st.startsWith(h))));
function kwPoints(model){ // one point per «·» part; examples after «مثل» dropped
  return String(model).split(/\s*·\s*/).map(pt => { const core = pt.replace(/[،,]?\s*(مثل|كـ|نحو)\s.*$/, ''); const seen = new Set(), ks = [];
    core.replace(/﴿[^﴾]*﴾/g, ' ').split(/\s+/).forEach(o => { const n = kwNorm(o); if(n.length < 3 || n.includes(' ') || KW_STOP.has(n) || KW_STOP.has(n.replace(/^ال/, ''))) return; const st = kwStem(n); if(!seen.has(st)){ seen.add(st); ks.push({ w:o.replace(/[^\u0621-\u0652\u0670ـ]/g, ''), st }); } }); return ks.slice(0, 6); }).filter(p => p.length);
}
function kwGrade(answer, model, max){
  const have = kwWords(answer).map(kwStem), pts = kwPoints(model);
  const found = [], miss = []; let got = 0;
  pts.forEach(p => { const f = p.filter(k => kwHit(k.st, have)); f.forEach(k => found.push(k.w)); p.filter(k => !kwHit(k.st, have)).forEach(k => miss.push(k.w));
    got += Math.min(1, f.length / Math.max(1, Math.ceil(p.length * (pts.length > 1 ? .4 : .5)))); });
  const r = pts.length ? got / pts.length : 0, mark = r >= .75 ? max : r >= .4 ? max / 2 : 0;
  return { r, mark, found, miss };
}

/* ---------- paper ---------- */
function examPaper(lv){
  let P = ls.get(EX_KEY, null);
  if(!P || P.lv !== lv){ P = examBuild(lv); ls.set(EX_KEY, P); }
  const save = () => ls.set(EX_KEY, P), A = P.ans, L = EXAM.levels[lv], graded = P.done;
  app.innerHTML = '';
  const total = el('b', { class:'ex-total' });
  app.append(topBar('امتحان ' + L.name, '#/exam'), el('div', { class:'rz-between ex-head' }, el('span', { class:'rz-meta' }, L.topics), total));
  const sec = (n, title, marks) => { const s = el('section', { class:'rz-card ex-sec' }, el('div', { class:'rz-between' }, el('b', {}, `السؤال ${n}: ${title}`), el('span', { class:'rz-badge plain' }, exAR(marks) + ' علامة'))); app.append(s); return s; };
  const selfBtns = (key, max) => { const row = el('div', { class:'ex-self' }, el('span', { class:'rz-meta' }, 'علامتك:'));
    [[max, 'كاملة'], [max / 2, 'نصفها'], [0, 'لم أُصب']].forEach(([v, t]) => row.append(el('button', { type:'button', class:'rz-chip', 'aria-pressed': String(A.self[key] === v), on:{ click:() => { A.self[key] = v; save(); examPaper(lv); } } }, t)));
    return row; };
  const model = m => el('div', { class:'ex-model' }, el('b', {}, 'الجواب النموذجي: '), m);
  const auto = (key, ans, m, max) => { if(!ans || !ans.trim()){ if(A.self[key] == null){ A.self[key] = 0; save(); } return el('div', { class:'ex-kw' }, 'لم تكتب جوابًا.'); }
    const g = kwGrade(ans, m, max); if(A.self[key] == null){ A.self[key] = g.mark; save(); }
    return el('div', { class:'ex-kw' }, el('b', {}, 'التصحيح التلقائي: ' + exAR(g.mark) + ' من ' + exAR(max)),
      g.found.length ? el('span', {}, '✓ وجدنا: ' + [...new Set(g.found)].join('، ')) : '', g.miss.length ? el('span', {}, '✗ لم نجد: ' + [...new Set(g.miss)].join('، ')) : '',
      el('span', { class:'rz-meta' }, 'إن كتبت المعنى بكلمات أخرى فغيّر علامتك من الأزرار.')); };
  let score = 0, pending = 0;

  // Q1 true/false
  const s1 = sec('الأول', 'ضع (✓) أمام العبارة الصحيحة و(✗) أمام الخاطئة، وصحّح الخطأ', 20);
  P.tf.forEach((t, i) => { const v = A.tf[i];
    const row = el('div', { class:'ex-row' }, el('span', { class:'ex-n' }, RZ.AR(i + 1) + '.'), el('span', { class:'grow' }, t.s));
    const b = (val, lab) => el('button', { type:'button', class:'rz-chip ex-tf', 'aria-pressed': String(v === val), disabled: graded, on:{ click:() => { A.tf[i] = val; save(); examPaper(lv); } } }, lab);
    row.append(el('span', { class:'ex-tfb' }, b(1, '✓'), b(0, '✗')));
    s1.append(row);
    if(graded){ const ok = v === t.ok; if(ok) score += 2; row.classList.add(ok ? 'good' : 'bad');
      if(!t.ok || !ok) s1.append(el('div', { class:'ex-fix' }, (t.ok ? 'العبارة صحيحة. ' : 'العبارة خاطئة. ') + (t.fix || ''))); }
  });
  // Q2 mcq
  const s2 = sec('الثاني', 'اختر الإجابة الصحيحة', 20);
  P.mcq.forEach((q, i) => { const v = A.mcq[i];
    const box = el('div', { class:'ex-q' }, el('div', {}, el('span', { class:'ex-n' }, RZ.AR(i + 1) + '. '), q.q));
    const opts = el('div', { class:'ex-opts' });
    q.o.forEach((o, k) => { const b = el('button', { type:'button', class:'opt', 'aria-pressed': String(v === k), disabled: graded, on:{ click:() => { A.mcq[i] = k; save(); examPaper(lv); } } }, el('span', { class:'ex-l' }, 'أبجد'[k] + ')'), ' ', o);
      if(graded){ if(k === q.a) b.classList.add('right'); else if(v === k) b.classList.add('wrong'); }
      opts.append(b); });
    box.append(opts); if(graded){ if(v === q.a) score += 2; if(q.e && v !== q.a) box.append(el('div', { class:'ex-fix' }, q.e)); }
    s2.append(box); });
  // Q3 definitions
  const s3 = sec('الثالث', 'عرّف اصطلاحًا', 10);
  P.defs.forEach((d, i) => { const key = 'd' + i;
    s3.append(el('div', { class:'ex-q' }, el('b', {}, RZ.AR(i + 1) + '. ' + d.t),
      graded ? '' : el('textarea', { class:'ex-txt', rows:2, placeholder:'اكتب التعريف…', on:{ input:e => { A['t' + key] = e.target.value; save(); } } }, A['t' + key] || ''),
      graded && A['t' + key] ? el('div', { class:'ex-mine' }, 'جوابك: ' + A['t' + key]) : '',
      graded ? auto(key, A['t' + key], d.m, 2) : '', graded ? model(d.m) : '', graded ? selfBtns(key, 2) : ''));
    if(graded){ if(A.self[key] != null) score += A.self[key]; else pending++; } });
  // Q4 open
  const s4 = sec('الرابع', 'أجب عما يأتي', 20);
  P.open.forEach((d, i) => { const key = 'o' + i;
    s4.append(el('div', { class:'ex-q' }, el('b', {}, RZ.AR(i + 1) + '. ' + d.q),
      graded ? '' : el('textarea', { class:'ex-txt', rows:3, placeholder:'اكتب جوابك…', on:{ input:e => { A['t' + key] = e.target.value; save(); } } }, A['t' + key] || ''),
      graded && A['t' + key] ? el('div', { class:'ex-mine' }, 'جوابك: ' + A['t' + key]) : '',
      graded ? auto(key, A['t' + key], d.m, 5) : '', graded ? model(d.m) : '', graded ? selfBtns(key, 5) : ''));
    if(graded){ if(A.self[key] != null) score += A.self[key]; else pending++; } });
  // Q5 practical
  const s5 = sec('الخامس', 'سؤال تطبيقي', 30);
  P.prac.forEach((p, pi) => {
    if(p.k === 'ext'){
      const per = p.m / p.r.length, mine = A.ext[pi] || (A.ext[pi] = {}); let act = A['act' + pi] ?? 0;
      s5.append(el('p', { style:'margin:0' }, `استخرج من الآيات الكريمة (${p.x.ref}) مثالًا واحدًا على كل حكم. اضغط الحكم ثم اضغط الكلمة.` + (lv !== '1' ? ' (المد العارض عند الوقف على رؤوس الآيات.)' : ''), P.prac.length > 1 ? el('span', { class:'rz-badge plain', style:'margin-inline-start:6px' }, exAR(p.m)) : ''));
      const pass = el('div', { class:'ex-pass' });
      p.x.w.forEach((w, wi) => { const used = Object.entries(mine).filter(([, x]) => x === wi).map(([r]) => +r);
        pass.append(el('button', { type:'button', class:'ex-w' + (used.length ? ' on' : ''), disabled: graded, on:{ click:() => { mine[act] = wi; A['act' + pi] = Math.min(act + 1, p.r.length - 1); save(); examPaper(lv); } } },
          w, used.length ? el('sup', {}, used.map(r => RZ.AR(r + 1)).join('،')) : ''), ' '); });
      if(!graded) pass.prepend(el('div', { class:'ex-cur' }, 'الحكم الآن: ', el('b', {}, p.r[act][0])));
      s5.append(pass);
      const list = el('div', { class:'ex-rules' });
      p.r.forEach(([rule, ok], ri) => { const wi = mine[ri];
        const row = el('button', { type:'button', class:'ex-rule' + (ri === act && !graded ? ' act' : ''), disabled: graded, on:{ click:() => { if(ri === act && wi != null){ delete mine[ri]; } A['act' + pi] = ri; save(); examPaper(lv); } } },
          el('span', { class:'ex-n' }, RZ.AR(ri + 1) + '.'), el('span', { class:'grow' }, rule), el('b', {}, wi != null ? p.x.w[wi] : '…'));
        if(graded){ const good = wi != null && ok.includes(wi); if(good) score += per; row.classList.add(good ? 'good' : 'bad');
          list.append(row); if(!good) list.append(el('div', { class:'ex-fix' }, 'من أمثلته في المقطع: ' + [...new Set(ok.map(i => p.x.w[i]))].slice(0, 3).join('، '))); }
        else list.append(row); });
      s5.append(list);
    } else {
      const per = p.m / p.items.length, mine = A.ana[pi] || (A.ana[pi] = {});
      s5.append(el('p', { style:'margin:0' }, p.t + ' فيما يأتي:', el('span', { class:'rz-badge plain', style:'margin-inline-start:6px' }, exAR(p.m))));
      p.items.forEach((it, ii) => { const got = mine[ii] || (mine[ii] = {});
        const box = el('div', { class:'ex-ana' }, el('div', { class:'rz-between' }, el('span', { class:'ex-word' }, it.w), el('span', { class:'rz-meta' }, it.ctx || '')));
        let ok = 0; const grid = el('div', { class:'ex-fg' }); box.append(grid);
        it.f.forEach(([lab, opts, ans], fi) => { const s = el('select', { class:'rz-select', disabled: graded, 'aria-label': lab, on:{ change:e => { got[fi] = e.target.value === '' ? null : +e.target.value; save(); } } });
          s.append(el('option', { value:'' }, lab + '…')); opts.forEach((o, k) => { const op = el('option', { value:k }, o); if(got[fi] === k) op.selected = true; s.append(op); });
          const wrap = el('label', { class:'ex-f' }, el('span', { class:'rz-meta' }, lab), s);
          if(graded){ const g = got[fi] === ans; if(g) ok++; wrap.classList.add(g ? 'good' : 'bad'); if(!g) wrap.append(el('span', { class:'ex-fix' }, 'الصواب: ' + opts[ans])); }
          grid.append(wrap); });
        if(graded){ score += per * ok / it.f.length; if(it.e) box.append(el('div', { class:'rz-meta' }, it.e)); }
        s5.append(box); });
    }
  });

  // footer
  if(!graded){
    const n = Object.keys(A.tf).length + Object.keys(A.mcq).length;
    app.append(el('div', { class:'ex-foot' }, el('span', { class:'rz-meta' }, `أجبت ${RZ.AR(n)} من ٢٠ في السؤالين الأول والثاني`),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => { if(n < 20 && !confirm('بقيت أسئلة بلا إجابة. هل تسلّم الورقة؟')) return; P.done = true; save(); examPaper(lv); scrollTo(0, 0); } } }, 'سلّم الورقة وصحّحها')));
    total.textContent = '';
  } else {
    score = Math.round(score * 2) / 2;
    total.textContent = exAR(score) + ' / ١٠٠' + (pending ? ' (+' + RZ.AR(pending) + ' بانتظار علامتك)' : '');
    if(!pending){ const best = ls.get('rz-exam-best', {}); if(best[lv] == null || score > best[lv]){ best[lv] = score; ls.set('rz-exam-best', best); } }
    const msg = pending ? 'ضع علامتك لأسئلة التعريف والأسئلة المكتوبة لتكتمل النتيجة.' : score >= 90 ? 'ممتاز، أنت مستعد للامتحان بإذن الله.' : score >= 75 ? 'جيد جدًّا، راجع الأسئلة التي أخطأت فيها.' : score >= 50 ? 'ناجح، لكن تحتاج إلى مراجعة قبل الامتحان.' : 'تحتاج إلى مراجعة الأبواب قبل الامتحان.';
    app.insertBefore(el('section', { class:'rz-card ex-res' }, el('div', { class:'ex-big' }, exAR(score), el('small', {}, ' / ١٠٠')), el('span', {}, msg)), app.children[2]);
    app.append(el('div', { class:'ex-foot two' },
      el('button', { type:'button', class:'rz-btn', on:{ click:() => print() } }, 'اطبع الورقة (PDF)'),
      el('button', { type:'button', class:'rz-btn pri', on:{ click:() => { ls.set(EX_KEY, null); examPaper(lv); scrollTo(0, 0); } } }, 'امتحان جديد')));
  }
}

/* ---------- «من أنا؟» from letter traits, and the tajweed wheel ---------- */
const TRAIT_MK = { 'ء':'أقصى الحلق','ه':'أقصى الحلق','ع':'وسط الحلق','ح':'وسط الحلق','غ':'أدنى الحلق','خ':'أدنى الحلق','ق':'أقصى اللسان','ك':'أقصى اللسان','ج':'وسط اللسان','ش':'وسط اللسان','ي':'وسط اللسان',
  'ض':'إحدى حافتي اللسان مع الأضراس العليا','ل':'أدنى حافة اللسان إلى منتهى طرفه','ن':'طرف اللسان','ر':'طرف اللسان','ط':'طرف اللسان','د':'طرف اللسان','ت':'طرف اللسان','ظ':'طرف اللسان','ذ':'طرف اللسان','ث':'طرف اللسان','ص':'طرف اللسان','ز':'طرف اللسان','س':'طرف اللسان',
  'ف':'الشفتين','و':'الشفتين','ب':'الشفتين','م':'الشفتين' };
const TRAIT_NAME = { 'ء':'الهمزة','ه':'الهاء','ع':'العين','ح':'الحاء','غ':'الغين','خ':'الخاء','ق':'القاف','ك':'الكاف','ج':'الجيم','ش':'الشين','ي':'الياء','ض':'الضاد','ل':'اللام','ن':'النون','ر':'الراء','ط':'الطاء','د':'الدال','ت':'التاء','ظ':'الظاء','ذ':'الذال','ث':'الثاء','ص':'الصاد','ز':'الزاي','س':'السين','ف':'الفاء','و':'الواو','ب':'الباء','م':'الميم' };
function letterTraits(c){
  const t = [];
  t.push('فحثه شخص سكت'.includes(c) ? 'الهمس' : 'الجهر');
  t.push('ءجدقطبكت'.includes(c) ? 'الشدة' : 'لنعمر'.includes(c) ? 'التوسط' : 'الرخاوة');
  t.push('خصضغطقظ'.includes(c) ? 'الاستعلاء' : 'الاستفال');
  t.push('صضطظ'.includes(c) ? 'الإطباق' : 'الانفتاح');
  t.push('فرمنلب'.includes(c) ? 'الإذلاق' : 'الإصمات');
  if('صزس'.includes(c)) t.push('الصفير'); if('قطبجد'.includes(c)) t.push('القلقلة'); if('لر'.includes(c)) t.push('الانحراف');
  if(c === 'ر') t.push('التكرير'); if(c === 'ش') t.push('التفشي'); if(c === 'ض') t.push('الاستطالة'); if('نم'.includes(c)) t.push('الغنة');
  return t;
}
function traitRiddles(){
  const L = Object.keys(TRAIT_MK), T = {}; L.forEach(c => T[c] = letterTraits(c));
  const dist = (a, b) => T[a].filter(x => !T[b].includes(x)).length + T[b].filter(x => !T[a].includes(x)).length + (TRAIT_MK[a] === TRAIT_MK[b] ? 0 : 1);
  const sup = (a, b) => T[a].every(x => T[b].includes(x)); // b has every trait of a → b also fits the riddle of a
  return L.map(c => { const w = L.filter(x => x !== c && !sup(c, x)).sort((x, y) => dist(c, x) - dist(c, y)).slice(0, 3).map(x => TRAIT_NAME[x]);
    return { ch:'l2c2', les:'l2c2:0', id:'tr:' + c, type:'mcq', q:'من أنا؟ أخرج من ' + TRAIT_MK[c] + '، وصفاتي: ' + T[c].join('، ') + '.', opts:shuffle([TRAIT_NAME[c], ...w]), ans:TRAIT_NAME[c],
      e:TRAIT_NAME[c] + ': ' + T[c].join('، ') + '. وأقرب الحروف إليه في الصفات: ' + w.join('، ') + '.', d:2 }; });
}
/* what the learner has reached: «وصلت مع أستاذي إلى» (settings / tour), else lessons already practised, else level 1 */
const ALL_IDS = LEVELS.flatMap(x => x.ids);
function reachedIds(){
  const sel = (ls.get('tajweed-library-custom-v1', {}).sel || []);
  let have = new Set(sel.map(k => k.split(':')[0]));
  if(!have.size) have = new Set(Object.keys(MAS).map(k => k.split(':')[0]));
  if(!have.size) return LEVELS[0].ids.slice();
  let last = -1; ALL_IDS.forEach((id, i) => { if(have.has(id)) last = i; });
  return ALL_IDS.slice(0, last + 1);
}
const reached = id => reachedIds().includes(id);
const WH_NAME = { l1c1:'مدخل إلى التجويد', l1c2:'النون الساكنة والتنوين', l1c3:'الميم الساكنة والغنة', l1c4:'المد', l2c1:'المخارج', l2c2:'الصفات', l2c3:'التفخيم والترقيق', l2c4:'الإظهار والإدغام', l2c5:'اللامات الساكنة', l3c1:'البدء بالكلمة', l3c2:'الوقف والابتداء', l3c3:'المقطوع والموصول', l3c4:'هاء وتاء التأنيث', l3c5:'الإثبات والحذف' };
function wLines(t){ if(t.length <= 11) return [t]; const w = t.split(' '); let a = '', b = ''; w.forEach(x => { if(!b && (a + ' ' + x).trim().length <= 12) a = (a + ' ' + x).trim(); else b = (b + ' ' + x).trim(); }); return b ? [a, b] : [a]; }
function wheel(){
  app.innerHTML = '';
  const R0 = reachedIds();
  /* built automatically from what the learner has reached; past levels fold into one «مراجعة ما سبق» slot when the wheel gets crowded */
  const curL = LEVELS.find(x => x.ids.includes(R0[R0.length - 1])) || LEVELS[0];
  const extra = [];
  if(R0.includes('l2c1')) extra.push({ id:'g-imara', t:'لعبة: أرجع السكان', go:'../games/sukkan.html' });
  if(R0.includes('l2c2')) extra.push({ id:'who', t:'من أنا؟' }, { id:'g-sifat', t:'لعبة: اوصفني', go:'../games/sifni.html' });
  const past = R0.filter(id => !curL.ids.includes(id));
  const fold = R0.length + extra.length > 10 && past.length > 0;
  const segs = (fold ? R0.filter(id => curL.ids.includes(id)) : R0).map(id => ({ id, t:WH_NAME[id] || short(BANK[id].title) }));
  if(fold) segs.push({ id:'past', t:'مراجعة ما سبق', pool:past });
  segs.push(...extra);
  const N = segs.length, R = 150, cx = 160, cy = 160, cols = ['#2F5D50', '#6E2E3A', '#C9AE8E', '#2D5B73', '#8A9A7B'];
  let turn = ls.get('rz-wheel-rot', 0), busy = false;
  let svg = `<svg viewBox="0 0 320 320" class="wh-svg" role="button" tabindex="0" aria-label="أدِر الدولاب"><g id="whg">`;
  segs.forEach((g, i) => { const a0 = 2 * Math.PI * i / N - Math.PI / 2, a1 = 2 * Math.PI * (i + 1) / N - Math.PI / 2, am = (a0 + a1) / 2;
    const p = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const fill = g.id === 'who' ? '#B8862E' : g.go ? '#7A4E8C' : g.id === 'past' ? '#5B4636' : cols[i % cols.length];
    if(N === 1) svg += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}" stroke="#F4EDE0" stroke-width="2"/>`;
    else svg += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${fill}" stroke="#F4EDE0" stroke-width="2"/>`;
    const rr = N <= 4 ? .58 : .64, tx = cx + R * rr * Math.cos(am), ty = cy + R * rr * Math.sin(am), ln = wLines(g.t), fs = N > 10 ? 9 : N > 7 ? 10.5 : 12;
    const ink = fill === '#C9AE8E' ? '#2E2214' : '#FFF';
    svg += `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})"><g class="wl"><text text-anchor="middle" font-size="${fs}" font-weight="700" fill="${ink}">${ln.map((t, k) => `<tspan x="0" y="${((k - (ln.length - 1) / 2) * fs * 1.15 + fs * .35).toFixed(1)}">${t}</tspan>`).join('')}</text></g></g>`; });
  svg += `</g><circle cx="${cx}" cy="${cy}" r="30" fill="#F4EDE0" stroke="#2F5D50" stroke-width="3"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="17" font-weight="800" fill="#2F5D50">أدِر</text><path d="M${cx - 12},4 L${cx + 12},4 L${cx},28 Z" fill="#B4443A"/></svg>`;
  const box = el('div', { class:'wh', html:svg });
  const res = el('div', { class:'rz-meta', style:'text-align:center;min-height:22px', 'aria-live':'polite' });
  const setRot = (deg, anim) => { const g = box.querySelector('#whg'); g.style.transformOrigin = '160px 160px';
    const tr = anim ? 'transform 3.2s cubic-bezier(.17,.67,.2,1)' : 'none';
    g.style.transition = tr; g.style.transform = `rotate(${deg}deg)`;
    box.querySelectorAll('.wl').forEach(w => { w.style.transition = tr; w.style.transform = `rotate(${-deg}deg)`; }); };
  const go = () => {
    if(busy || !N) return; busy = true; const k = Math.floor(Math.random() * N);
    const target = 360 * 5 + (360 - (k + .5) * 360 / N); turn = turn - (turn % 360) + target; ls.set('rz-wheel-rot', turn % 360);
    setRot(turn, true);
    setTimeout(() => { busy = false; const sg = segs[k]; res.textContent = 'وقف الدولاب على: ' + sg.t;
      setTimeout(() => { if(sg.go) location.href = sg.go;
        else if(sg.id === 'who') start({ id:'who', kind:'wheel', title:'من أنا؟ صفات الحروف', back:'#/wheel', make:() => shuffle(traitRiddles()).slice(0, 5) });
        else if(sg.id === 'past'){ const id = shuffle(sg.pool)[0]; res.textContent = 'مراجعة ما سبق: ' + (WH_NAME[id] || short(BANK[id].title));
          start({ id:'wh:' + id, kind:'wheel', title:'الدولاب · مراجعة · ' + (WH_NAME[id] || short(BANK[id].title)), back:'#/wheel', make:() => { const p = chapterPool(id); return buildN(p.pool, p.spec, 3, 'mix'); } }); }
        else start({ id:'wh:' + sg.id, kind:'wheel', title:'الدولاب · ' + sg.t, back:'#/wheel', make:() => { const p = chapterPool(sg.id); return buildN(p.pool, p.spec, 3, 'mix'); } }); }, 900); }, 3300); };
  box.addEventListener('click', go); box.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  const lastT = WH_NAME[R0[R0.length - 1]] || short(BANK[R0[R0.length - 1]].title);
  const basis = el('p', { class:'rz-meta', style:'margin:0;font-size:.85em' }, 'من الأبواب التي وصلت إليها: حتى ' + lastT + ' · ', el('a', { href:'../settings.html' }, 'غيّر من الإعدادات'));
  app.append(topBar('دولاب التجويد', '../'), el('p', { class:'rz-meta', style:'margin:0' }, 'اضغط على الدولاب ليختار لك بابًا من الأبواب التي وصلت إليها.'), basis, box, res);
  requestAnimationFrame(() => setRot(turn % 360, false));
}

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
     lesson: () => lessonQuiz(decodeURIComponent(arg || '')), exam: () => examUI(arg), wheel, who: () => start({ id:'who', kind:'single', title:'من أنا؟ صفات الحروف', back:'../', make:() => shuffle(traitRiddles()).slice(0, 5) }) }[r] || home)();
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
  S = { T, qs, t0:Date.now(), i:0, score:0, right:0, streak:0, best:0, res:[], nbOut:0, xp:0, weak:[], hearts: T.hearts ? 3 : null };
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
// before a chapter/level test: difficulty + hearts in a small sheet
function startSheet(title, go){
  RZ.sheet((box, close) => {
    box.append(el('b', { style:'font-size:20px' }, title), el('span', { class:'rz-meta' }, 'مستوى الصعوبة'),
      ...lvChips(PREF.lvl, k => { PREF.lvl = k; psave(); }), heartsToggle(true),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => { close(); go(); } } }, 'ابدأ'));
  });
}
function home(){
  app.innerHTML = '';
  app.append(el('header', { class:'rz-between' }, el('h1', { class:'rz-title' }, 'مكتبة الاختبارات'),
    el('a', { class:'rz-link', href:'#/path' }, 'مسار الدروس ←')), resumeCard());
  LEVELS.forEach(L => {
    const sec = el('section', { class:'lvl' });
    const lvTitle = `اختبار شامل: ${L.name}`;
    sec.append(el('div', { class:'rz-between' }, el('h2', { class:'rz-h', style:'margin:0' }, L.name + (L.sub ? ' · ' + L.sub : '')),
      el('button', { type:'button', class:'rz-link', on:{ click:() => startSheet(lvTitle, () => start({ id:'L' + L.n, kind:'chapter', title:lvTitle, lvl:PREF.lvl, hearts:PREF.hearts, make:() => buildN(L.ids.flatMap(id => BANK[id].questions), L.ids.flatMap(id => SPEC[id] || []), 10, PREF.lvl) })) } }, 'اختبار شامل')));
    const grid = el('div', { class:'rz-grid' });
    L.ids.forEach(id => { const b = BANK[id]; const best = save.best[id];
      grid.append(el('button', { type:'button', class:'rz-tile chap c-' + ['green', 'ocean', 'sand', 'wine'][(L.n || 1) - 1] + (save.gold[id] ? ' gold' : ''), on:{ click:() => startSheet(short(b.title), () => start({ id, kind:'chapter', title:short(b.title), lvl:PREF.lvl, hearts:PREF.hearts, make:() => { const p = chapterPool(id); return buildN(p.pool, p.spec, 10, PREF.lvl); } })) } },
        el('span', { class:'rz-meta' }, bab(b.title)), el('b', {}, short(b.title)),
        el('div', { class:'rz-between', style:'margin-top:auto' }, starStr(save.stars[id] || 0), best != null ? el('span', { class:'rz-meta' }, `${AR(best)}/${AR(NQ)}`) : '', save.gold[id] ? el('span', { title:'باب ذهبي' }, '🥇') : '')));
    });
    sec.append(grid); app.append(sec);
  });
  app.append(el('h2', { class:'rz-h' }, 'أدوات أخرى'),
    el('a', { class:'rz-list-btn', href:'#/wheel' }, el('span', { class:'rz-ic', html:icon('puzzle') }), el('span', { class:'grow' }, el('b', {}, 'دولاب التجويد'), el('span', { class:'rz-meta' }, 'أدِره واختبر نفسك في الباب الذي يقف عليه')), el('span', { class:'chev', html:icon('chev') })),
    el('a', { class:'rz-list-btn', href:'#/builder' }, el('span', { class:'rz-ic', html:icon('sliders') }), el('span', { class:'grow' }, el('b', {}, 'صمّم اختبارك'), el('span', { class:'rz-meta' }, CUS.sel.length ? `محفوظ: ${plural(CUS.sel.length, ['درس واحد', 'درسان', 'دروس', 'درسًا'])}` : 'من الدروس التي وصلت إليها')), el('span', { class:'chev', html:icon('chev') })),
    el('a', { class:'rz-list-btn', href:'#/share' }, el('span', { class:'rz-ic', html:icon('share') }), el('span', { class:'grow' }, el('b', {}, 'للمعلّم: شارك اختبارًا'), el('span', { class:'rz-meta' }, 'رابط بالأسئلة نفسها للجميع')), el('span', { class:'chev', html:icon('chev') })),
    el('a', { class:'rz-list-btn', href:'#/mastery' }, el('span', { class:'rz-ic', html:icon('grid') }), el('span', { class:'grow' }, el('b', {}, 'خريطة إتقاني'), el('span', { class:'rz-meta' }, 'أين وصلت في كل درس')), el('span', { class:'chev', html:icon('chev') })));
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
  if(cfg.sc != null){ qp.set('sc', String(cfg.sc)); if(cfg.by) qp.set('by', cfg.by.slice(0, 30)); if(cfg.pt != null){ qp.set('pt', String(cfg.pt)); qp.set('tm', String(cfg.tm)); } }
  if(cfg.cq && cfg.cq.length) qp.set('cq', cqEnc(cfg.cq));
  return location.origin + location.pathname + '#/s/' + qp.toString();
}
/* ---------- teacher's own questions in a share link + paper/Word export ---------- */
function cqEnc(cq){ const b = new TextEncoder().encode(JSON.stringify(cq)); let t = ''; b.forEach(x => t += String.fromCharCode(x)); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function cqDec(str){ if(!str) return []; try{ const t = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const a = JSON.parse(new TextDecoder().decode(Uint8Array.from(t, c => c.charCodeAt(0))));
  return Array.isArray(a) ? a.slice(0, 10).filter(x => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string' && Array.isArray(x[2]) && x[2].length).map(x => [x[0].slice(0, 300), x[1].slice(0, 150), x[2].slice(0, 3).map(w => String(w).slice(0, 150)), String(x[3] || '').slice(0, 300)]) : []; }catch(e){ return []; } }
const cqQ = cq => cq.map((c, i) => toQ({ id:'cq' + i, q:c[0], a:c[1], w:c[2], e:c[3] || '' }));
function sharedQs(keys, n, lvl, cq){ const own = cqQ(cq || []); if(!keys.length) return own; const { pool, spec } = poolFor(keys); return own.concat(buildN(pool, spec, n, lvl)); }
function paperQs(cfg){ // printable version: the teacher's questions, then multiple-choice questions from the same lessons
  return withSeed(cfg.seed, () => { const own = cqQ(cfg.cq || []); const { pool } = poolFor(cfg.sel || []);
    return own.concat(shuffle(pool.filter(q => q.w && q.w.length >= 2)).slice(0, cfg.n).map(toQ)); }); }
function paperHTML(cfg, title){
  const qs = paperQs(cfg), L = 'أبجده';
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = qs.map((q, i) => { const c = ctxText(q);
    return `<div class="pq"><p><b>${AR(i + 1)}.</b> ${esc(q.q)}</p>${c ? `<p class="v">${esc(c)}</p>` : ''}<div class="po">${q.opts.map((o, k) => `<p>${L[k]}) ${esc(o)}</p>`).join('')}</div></div>`; }).join('');
  const key = qs.map((q, i) => `<p>${AR(i + 1)}: ${L[q.opts.indexOf(q.ans)]}) ${esc(q.ans)}${q.e ? ' <small>— ' + esc(q.e) + '</small>' : ''}</p>`).join('');
  return { qs, html:`<h1>${esc(title)}</h1><p class="meta">الاسم: ........................ &nbsp; التاريخ: ............ &nbsp; العلامة: ...... من ${AR(qs.length)}</p>${body}` };
}
const PAPER_CSS = 'body{font-family:"IBM Plex Sans Arabic",Arial,sans-serif;direction:rtl;font-size:13pt;line-height:1.7}h1{font-size:18pt;margin:0 0 4pt}.meta{color:#555;border-bottom:1px solid #999;padding-bottom:6pt}.pq{break-inside:avoid;margin:8pt 0}.pq p{margin:2pt 0}.v{font-family:"Amiri Quran","Amiri",serif;font-size:15pt}.po{margin:2pt 0;padding-right:18pt}.po p{margin:1pt 0}.key p{margin:2pt 0}.brk{break-before:page;page-break-before:always;font-size:15pt}';
function paperPrint(cfg, title){
  const { html } = paperHTML(cfg, title); let area = document.getElementById('paper'); if(!area){ area = el('div', { id:'paper' }); document.body.append(area); }
  area.innerHTML = `<style>${PAPER_CSS.replace(/body\{/, '#paper{')}</style>` + html; document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); print(); setTimeout(done, 60000);
}
function paperWord(cfg, title){
  const { html } = paperHTML(cfg, title);
  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>${PAPER_CSS}</style></head><body dir="rtl">${html}</body></html>`;
  const a = el('a', { href:URL.createObjectURL(new Blob(['﻿' + doc], { type:'application/msword' })), download:(title || 'اختبار').replace(/[\\/:*?"<>|]/g, '') + '.doc' }); document.body.append(a); a.click(); a.remove();
}
function cqSheet(SH, after){
  RZ.sheet((box, close) => {
    let tf = false;
    const q = el('textarea', { class:'ex-txt', rows:3, placeholder:'نص السؤال' });
    const a = el('input', { class:'rz-select', type:'text', placeholder:'الإجابة الصحيحة' });
    const ws = [0, 1, 2].map(i => el('input', { class:'rz-select', type:'text', placeholder:'إجابة خاطئة ' + ['أولى', 'ثانية (اختياري)', 'ثالثة (اختياري)'][i] }));
    const tfSel = el('select', { class:'rz-select', hidden:true }, el('option', { value:'1' }, 'العبارة صحيحة'), el('option', { value:'0' }, 'العبارة خاطئة'));
    const e = el('input', { class:'rz-select', type:'text', placeholder:'شرح يظهر بعد الإجابة (اختياري)' });
    const mcqBox = el('div', { style:'display:flex;flex-direction:column;gap:8px' }, a, ...ws);
    const seg = el('div', { class:'rz-seg', style:'grid-template-columns:1fr 1fr' });
    const setT = v => { tf = v; seg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === (v ? 1 : 0)))); mcqBox.hidden = v; tfSel.hidden = !v; q.placeholder = v ? 'العبارة' : 'نص السؤال'; };
    seg.append(el('button', { type:'button', class:'rz-chip', on:{ click:() => setT(false) } }, 'اختيار من متعدد'), el('button', { type:'button', class:'rz-chip', on:{ click:() => setT(true) } }, 'صح أم خطأ'));
    const err = el('span', { class:'rz-meta', style:'color:var(--bad)' });
    box.append(el('b', { style:'font-size:20px' }, 'أضف سؤالك'), seg, q, mcqBox, tfSel, e, err,
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => {
        const qt = q.value.trim(); if(!qt){ err.textContent = 'اكتب السؤال.'; return; }
        let item;
        if(tf){ const ok = tfSel.value === '1'; item = [qt, ok ? 'صحيحة' : 'خاطئة', [ok ? 'خاطئة' : 'صحيحة'], e.value.trim()]; }
        else { const wr = ws.map(x => x.value.trim()).filter(Boolean); if(!a.value.trim() || !wr.length){ err.textContent = 'اكتب الإجابة الصحيحة وإجابة خاطئة واحدة على الأقل.'; return; } item = [qt, a.value.trim(), wr, e.value.trim()]; }
        SH.cq = (SH.cq || []).concat([item]).slice(0, 10); close(); after(); } } }, 'أضف السؤال'));
    setT(false);
  });
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
  const ownBox = el('div', { style:'display:flex;flex-direction:column;gap:6px' });
  const paintOwn = () => { ownBox.innerHTML = ''; (SH.cq || []).forEach((c, i) => ownBox.append(el('div', { class:'rz-between', style:'gap:8px;border:1px solid var(--line);border-radius:12px;padding:8px 12px' },
      el('span', {}, AR(i + 1) + '. ' + c[0]), el('button', { type:'button', class:'rz-link', style:'color:var(--bad)', on:{ click:() => { SH.cq.splice(i, 1); keep(); paintOwn(); refresh(); } } }, 'حذف'))));
    if((SH.cq || []).length < 10) ownBox.append(el('button', { type:'button', class:'rz-btn block', on:{ click:() => cqSheet(SH, () => { keep(); paintOwn(); refresh(); }) } }, '+ أضف سؤالًا من عندك')); };
  const refresh = () => { keep(); const { pool } = poolFor(SH.sel); const own = (SH.cq || []).length; count.textContent = SH.sel.length || own ? 'كل من يفتح الرابط يحصل على الأسئلة نفسها بالترتيب نفسه.' : 'اختر الدروس أولًا'; make.disabled = pool.length < 4 && !own; out.hidden = true; fitAction(); };
  make.addEventListener('click', () => {
    const cfg = { sel:SH.sel, n:SH.n, lvl:SH.lvl, name:SH.name, cq:SH.cq || [], seed:1 + Math.floor(Math.random() * 1e9) };
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
      el('a', { class:'rz-link', href:url.slice(url.indexOf('#')) }, 'جرّب الاختبار بنفسك'),
      el('span', { class:'rz-meta' }, 'نسخة ورقية للطلاب (بلا إجابات):'),
      el('div', { class:'rz-seg', style:'grid-template-columns:repeat(2,minmax(0,1fr))' },
        el('button', { type:'button', class:'rz-btn', on:{ click:() => paperPrint(cfg, cfg.name || 'اختبار تجويد') } }, 'اطبع / PDF'),
        el('button', { type:'button', class:'rz-btn', on:{ click:() => paperWord(cfg, cfg.name || 'اختبار تجويد') } }, 'ملف Word')));
    function copy(){ field.select(); (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => copied.textContent = 'تم نسخ الرابط.', () => { document.execCommand && document.execCommand('copy'); copied.textContent = 'تم تحديد الرابط، انسخه.'; }); }
    out.hidden = false; out.scrollIntoView({ behavior:'smooth', block:'center' });
  });
  app.append(topBar('شارك اختبارًا'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'للمعلمين والمجموعات: اختر الدروس والمستوى وعدد الأسئلة، فيتكوّن رابط واحد. كل من يفتحه يحلّ الأسئلة نفسها بالترتيب نفسه، ويعمل بلا تسجيل.'),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'اسم الاختبار (اختياري)'), name),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'الدروس'), lessonPicker(sel, refresh)),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'مستوى الصعوبة'), ...lvChips(SH.lvl, k => { SH.lvl = k; keep(); out.hidden = true; })),
    el('section', { class:'rz-card' }, el('span', { class:'rz-meta' }, 'عدد الأسئلة'), countSeg(SH.n, n => { SH.n = n; keep(); out.hidden = true; }, [10, 20, 30])),
    el('section', { class:'rz-card' }, el('b', {}, 'أسئلتك الخاصة (اختياري)'), el('span', { class:'rz-meta' }, 'تظهر في أول الاختبار، قبل أسئلة البنك. حتى ١٠ أسئلة.'), ownBox),
    out, actionBar(count, make));
  document.body.classList.add('rz-quiz');
  paintOwn(); refresh(); fitAction();
}
function sharedIntro(arg){
  const qp = new URLSearchParams(arg || '');
  const keys = decodeSel(qp.get('d')); const n = Math.min(30, Math.max(5, +qp.get('n') || 10)); const lvl = LV.some(x => x.k === qp.get('l')) ? qp.get('l') : 'mix';
  const seed = +qp.get('r') || 1; const name = (qp.get('t') || '').slice(0, 60);
  const vs = qp.get('sc') != null ? +qp.get('sc') : null, by = (qp.get('by') || '').slice(0, 30), vp = qp.get('pt') != null ? +qp.get('pt') : null, vt = +qp.get('tm') || 0, cq = cqDec(qp.get('cq'));
  app.innerHTML = '';
  if(!keys.length && !cq.length){ app.append(topBar('اختبار مشترك'), el('p', { class:'rz-empty' }, 'الرابط غير مكتمل. اطلب الرابط مرة أخرى.')); return; }
  const L = LV.find(x => x.k === lvl);
  const chs = [...new Set(keys.map(k => k.split(':')[0]))].map(id => short(BANK[id].title)); if(cq.length) chs.unshift('أسئلة من المعلّم (' + AR(cq.length) + ')');
  app.append(topBar('اختبار مشترك'),
    el('section', { class:'rz-card' },
      el('span', { class:'rz-meta' }, vs != null ? 'وصلك تحدٍّ' + (by ? ' من ' + by : '') : 'وصلك هذا الاختبار برابط مشترك'),
      vs != null ? el('div', { class:'rz-note', style:'font-weight:600;color:var(--ink)' }, `🏆 ${by || 'صاحب التحدّي'} حصل على ${AR(vs)} من ${AR((keys.length ? n : 0) + cq.length)}` + (vp != null ? ` (${AR(vp)} نقطة في ${AR(vt)} ثانية)` : '') + '. هل تتفوق؟ النقاط للصواب والسرعة معًا.') : '',
      el('b', { style:'font-size:22px' }, name || 'اختبار تجويد'),
      el('div', { class:'rz-wrap' }, el('span', { class:'rz-badge plain' }, plural((keys.length ? n : 0) + cq.length, ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'])), el('span', { class:'rz-badge' }, L.t), el('span', { class:'rz-badge plain' }, plural(keys.length, ['درس واحد', 'درسان', 'دروس', 'درسًا']))),
      el('span', { class:'rz-meta' }, 'الأبواب: ' + chs.join('، ')),
      el('button', { type:'button', class:'rz-btn pri block', on:{ click:() => start({ id:'shared', kind:'shared', title:name || 'اختبار مشترك', lvl, seed, vs, vp, vt, by, cfg:{ sel:keys, n, lvl, seed, name, cq }, make:() => sharedQs(keys, n, lvl, cq) }) } }, 'ابدأ')));
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
    el('div', { class:'legend' }, el('span', {}, el('i', { class:'dot good' }), 'ممتاز (٨٠٪ فأكثر)'), el('span', {}, el('i', { class:'dot mid' }), 'نصف نصف (٥٠–٧٩٪)'), el('span', {}, el('i', { class:'dot review' }), 'يحتاج مراجعة (أقل من ٥٠٪)'), el('span', {}, el('i', { class:'dot none' }), 'لم تبدأه بعد')),
    el('p', { class:'rz-meta', style:'margin:0;font-size:13px' }, 'النسبة من آخر إجاباتك في الدرس. الإطار المتقطّع: أجبت أقل من ٤ أسئلة، فأجب أكثر للتأكيد.'),
    el('p', { class:'rz-meta', style:'margin:0' }, 'اضغط على أي درس لتبدأ اختبارًا فيه.'));
  let g = 0, r = 0, z = 0, md = 0;
  LEVELS.forEach(L => {
    const sec = el('section', { class:'rz-card' }, el('b', {}, L.name + (L.sub ? ' · ' + L.sub : '')));
    L.ids.forEach(id => {
      sec.append(el('span', { class:'rz-meta' }, short(BANK[id].title)));
      const row = el('div', { class:'mas-row' });
      LESSONS[id].ls.forEach((n, li) => { const key = id + ':' + li; const st = masState(key);
        if(st.s === 'good') g++; else if(st.s === 'mid') md++; else if(st.s === 'review') r++; else z++;
        row.append(el('a', { class:'mas ' + st.s + (st.few ? ' few' : ''), href:'#/lesson/' + encodeURIComponent(key) }, el('span', {}, n), st.p != null ? el('small', {}, AR(Math.round(st.p * 100)) + '٪') : '')); });
      sec.append(row);
    });
    app.append(sec);
  });
  app.insertBefore(el('div', { class:'rz-wrap' }, el('span', { class:'rz-badge mb good' }, 'ممتاز: ' + AR(g)), el('span', { class:'rz-badge mb mid' }, 'نصف نصف: ' + AR(md)), el('span', { class:'rz-badge mb review' }, 'للمراجعة: ' + AR(r)), el('span', { class:'rz-badge mb none' }, 'لم يبدأ: ' + AR(z))), app.children[3]);
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
function dgSvg(key, o){ // labelled-diagram figure: optional glowing part, optional numbered pins
  const D = RZ_DIAG[key]; o = o || {}; const [, , W] = D.vb.split(' ').map(Number), k = W / 300;
  let g = '';
  if(o.glow){ g = `<g class="dg-glow"${D.clip ? ` clip-path="url(#${D.clip})"` : ''}>${D.parts[o.glow].s}</g>`; if(D.clip && /tongue|edge/.test(key)) g += ''; }
  const pins = (o.pins || []).map(([x, y], i) => `<g class="pin" role="button" tabindex="0" transform="translate(${x} ${y})"><circle r="${15 * k}"/><text class="pn" y="${5 * k}" font-size="${15 * k}">${RZ.AR(i + 1)}</text><text class="pl" y="${-22 * k}" font-size="${14 * k}"></text></g>`).join('');
  return el('figure', { class:'dgfig', html:`<svg viewBox="${D.vb}" role="img" aria-label="${D.title}">${D.base}${g}${pins}</svg>` });
}
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
  imgpick(q, card){
    card.append(el('div', { class:'q' }, q.q));
    const box = el('div', { class:'imgpick' }); let cur = null;
    const bs = q.opts.map(f => el('button', { type:'button', class:'opt ip', 'aria-pressed':'false', on:{ click:() => { if(S.done) return; cur = f; bs.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.f === f))); S.ui.update(); } } },
      el('img', { src:'img/' + f, alt:'رسمة مخرج', loading:'lazy' }), el('span', { class:'om' })));
    bs.forEach((x, k) => x.dataset.f = q.opts[k]); box.append(...bs); card.append(box);
    return { ready: () => cur != null, check(){ bs.forEach(x => { x.disabled = true; if(x.dataset.f === q.ans){ x.classList.add('right'); x.querySelector('.om').innerHTML = icon('check'); } else if(x.dataset.f === cur){ x.classList.add('wrong'); x.querySelector('.om').innerHTML = icon('x'); } }); return { ok: cur === q.ans, sel: cur }; } };
  },
  dglow(q, card){ card.append(el('div', { class:'q' }, q.q), dgSvg(q.dg, { glow:q.part })); return single(q, card); },
  dplace(q, card){
    card.append(el('div', { class:'q' }, q.q), el('div', { class:'rz-meta' }, 'اضغط الاسم ثم اضغط الدائرة المرقّمة التي في مكانه.'));
    const D = RZ_DIAG[q.dg], pins = shuffle(q.parts.slice()); // pins numbered in a random order
    const put = {}; let cur = null;
    const fig = dgSvg(q.dg, { pins: pins.map(n => D.parts[n].p) }); card.append(fig);
    const chips = el('div', { class:'dg-chips' }); card.append(chips);
    const paint = () => { chips.querySelectorAll('button').forEach(b => { const n = b.dataset.n; const at = Object.keys(put).find(k => put[k] === n);
        b.setAttribute('aria-pressed', String(cur === n)); b.querySelector('small').textContent = at != null ? ' ← ' + RZ.AR(+at + 1) : ''; });
      fig.querySelectorAll('.pin').forEach((g, i) => { g.classList.toggle('on', put[i] != null); g.querySelector('.pl').textContent = put[i] != null ? put[i] : ''; }); S.ui.update(); };
    shuffle(q.parts.slice()).forEach(n => chips.append(el('button', { type:'button', class:'rz-chip', 'data-n':n, on:{ click:() => { if(S.done) return; cur = cur === n ? null : n; paint(); } } }, n, el('small', {}))));
    fig.querySelectorAll('.pin').forEach((g, i) => g.addEventListener('click', () => { if(S.done) return;
      if(cur == null){ if(put[i] != null){ cur = put[i]; delete put[i]; } paint(); return; }
      Object.keys(put).forEach(k => { if(put[k] === cur) delete put[k]; }); put[i] = cur; cur = null; paint(); }));
    return { ready: () => Object.keys(put).length === pins.length, check(){ let ok = true;
      fig.querySelectorAll('.pin').forEach((g, i) => { const good = put[i] === pins[i]; if(!good) ok = false; g.classList.add(good ? 'right' : 'wrong'); if(!good) g.querySelector('.pl').textContent = pins[i]; });
      chips.querySelectorAll('button').forEach(b => b.disabled = true); return { ok, sel: pins.map((n, i) => put[i]).join('، ') }; } };
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
    card.append(el('div', { class:'q' }, q.q)); bigBox(q, card); card.append(el('div', { class:'kind', style:'font-weight:500' }, 'فكّر في الإجابة أو اكتبها على ورقة، ثم اكشفها وقيّم نفسك بصدق.'));
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
      check(){ const all = new Set(q.g.flat()), extra = new Set(q.x || []); const ok = q.g.every(g => g.some(i => sel.has(i))) && [...sel].every(i => all.has(i) || extra.has(i));
        [...box.querySelectorAll('.vw')].forEach((b, i) => { b.disabled = true; if(all.has(i)) b.classList.add(sel.has(i) ? 'right' : 'missed'); else if(sel.has(i) && !extra.has(i)) b.classList.add('wrong'); });
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
    const secs = ['mcq', 'tf', 'vmcq', 'fill', 'stmt', 'img', 'riddle', 'imgpick', 'dglow'].includes(q.type) ? 25 : 55; let left = secs;
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
  const secs = Math.max(1, Math.round((Date.now() - (S.t0 || Date.now())) / 1000)), n0 = S.qs.length, pts = S.right * 10 + (S.right ? Math.max(0, Math.round((n0 * 20 - secs) / 2)) : 0);
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
  if(T.kind === 'wheel') btns.append(el('a', { class:'rz-btn pri', href:'#/wheel' }, 'أدِر الدولاب مرة أخرى'));
  if(T.kind === 'single' && T.les && LES_NAME[T.les]) btns.append(el('button', { type:'button', class:'rz-btn pri', on:{ click:() => lessonQuiz(T.les, true) } }, 'جرّب اختبارًا في الدرس نفسه'));
  // challenge a friend with exactly the same questions
  const shareCfg = T.kind === 'shared' ? T.cfg : (T.kind === 'custom' || T.kind === 'lesson') && T.seed != null ? { sel:T.keys, n, lvl:T.lvl || 'mix', seed:T.seed, name:T.kind === 'lesson' ? T.title : '' } : null;
  if(shareCfg && shareCfg.sel && shareCfg.sel.length) btns.append(el('button', { type:'button', class:'rz-btn', on:{ click:async () => {
    const url = shareUrl(Object.assign({}, shareCfg, { sc:r, pt:pts, tm:secs, by:RZ.settings().name || '' }));
    const text = `حصلت على ${AR(r)} من ${AR(n)} في «${T.title}» (${AR(pts)} نقطة في ${AR(secs)} ثانية) على تطبيق رسوخ. هل تتفوق عليّ؟ الأسئلة نفسها في هذا الرابط:`;
    try{ if(navigator.share){ await navigator.share({ title:'تحدٍّ في رسوخ', text, url }); return; } }catch(e){ return; }
    try{ await navigator.clipboard.writeText(text + '\n' + url); RZ.toast('نُسخ رابط التحدّي'); }catch(e){}
  } } }, 'تحدَّ صديقًا'));
  btns.append(el('a', { class:'rz-btn', href:T.kind === 'daily' || T.kind === 'single' ? '../' : T.kind === 'review' ? '#/mistakes' : '#/' }, T.kind === 'daily' || T.kind === 'single' ? 'الرئيسية' : T.kind === 'review' ? 'دفتر أخطائي' : 'مكتبة الاختبارات'));
  let msg = r === n ? 'ما شاء الله، علامة كاملة!' : f >= .7 ? 'أحسنت! أتقنت معظم الأسئلة.' : 'راجع أخطاءك في الأسفل؛ ستعود إليك في دفتر أخطائك.';
  if(passed === true) msg = T.kind === 'final' ? '🥇 نجحت في اختبار الختام، وصار هذا الباب ذهبيًا!' : 'نجحت في اختبار القفز، وفُتحت الدروس حتى هذا الدرس.';
  if(passed === false) msg = 'تحتاج ' + AR(Math.ceil(n * .8)) + ' إجابات صحيحة على الأقل للنجاح. راجع الدروس ثم حاول مرة أخرى.';
  if(S.heartsOut) msg = 'انتهت القلوب الثلاثة. يمكنك إكمال الأسئلة الباقية للتعلّم بلا قلوب.';
  const vsP = T.vp != null ? el('div', { class:'rz-note', style:'font-weight:600;color:var(--ink)' }, `نقاطك: ${AR(pts)} (${AR(r)} صحيحة في ${AR(secs)} ثانية) · ${T.by || 'صاحب التحدّي'}: ${AR(T.vp)} نقطة. ` + (pts > T.vp ? '🏆 تفوقت!' : pts === T.vp ? 'تعادلتما.' : 'حاول مرة أخرى لتتفوق.')) : null;
  const vs = vsP ? vsP : T.vs != null ? el('div', { class:'rz-note', style:'font-weight:600;color:var(--ink)' }, r > T.vs ? `🏆 تفوقت على ${T.by || 'صاحب التحدّي'} (${AR(T.vs)} من ${AR(n)})` : r === T.vs ? `تعادلت مع ${T.by || 'صاحب التحدّي'}` : `${T.by || 'صاحب التحدّي'} حصل على ${AR(T.vs)} من ${AR(n)}. جرّب مرة أخرى!`) : '';
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
  const R0 = reachedIds(), day = RZ.daySeed(), r = RZ.seeded(day * 31 + 7);
  if(R0.includes('l2c2') && day % 3 === 0) return withSeed(day, () => { const t = traitRiddles(); return t[Math.floor(r() * t.length)]; });
  if(R0.includes('l2c1') && day % 3 !== 2){
    const list = []; Object.values(SPEC).forEach(l => l.forEach(s => { if((s.t === 'riddle' && s.d !== 1) || (s.t === 'img' && s.m === 'makh')) list.push(s); }));
    if(list.length) return withSeed(day, () => toSpecial(list[Math.floor(r() * list.length)]));
  }
  const ids = R0.filter(id => !['l2c1', 'l2c2'].includes(id)); const id = ids.length ? ids[Math.floor(r() * ids.length)] : R0[0];
  return withSeed(day, () => { const p = chapterPool(id); return buildN(p.pool, p.spec, 1, 'mix')[0]; });
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