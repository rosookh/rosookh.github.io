/* First-run tour (5 short screens, skippable). Also opened from Settings → «عرض الجولة التعريفية». */
(function(){
  const CK = 'tajweed-library-custom-v1';
  function lessonSelect(cur){
    const s = document.createElement('select'); s.className = 'rz-select'; s.setAttribute('aria-label', 'آخر درس أخذته');
    s.innerHTML = '<option value="">لم أبدأ بعد</option>' + RZ_LESSONS.map(L => L.ch.map(c => `<optgroup label="${L.name} · ${c.t}">` + c.ls.map((n, i) => `<option value="${c.id}:${i}">${n}</option>`).join('') + '</optgroup>').join('')).join('');
    s.value = cur || ''; return s;
  }
  function keysUpTo(key){
    const out = []; if(!key) return out;
    for(const L of RZ_LESSONS) for(const c of L.ch) for(let i = 0; i < c.ls.length; i++){ out.push(c.id + ':' + i); if(c.id + ':' + i === key) return out; }
    return out;
  }
  function lastKey(){ const sel = (RZ.ls.get(CK, {}).sel || []); let last = ''; for(const L of RZ_LESSONS) for(const c of L.ch) c.ls.forEach((_, i) => { if(sel.includes(c.id + ':' + i)) last = c.id + ':' + i; }); return last; }
  function setUpTo(key){ const cus = Object.assign({ sel:[], n:10, lvl:'mix' }, RZ.ls.get(CK, {})); cus.sel = keysUpTo(key); RZ.ls.set(CK, cus); }
  window.RZ_TOUR = { keysUpTo, lastKey, setUpTo, lessonSelect,
    lessonName(key){ if(!key) return ''; const [id, i] = key.split(':'); for(const L of RZ_LESSONS) for(const c of L.ch) if(c.id === id) return c.ls[+i] || ''; return ''; } };

  window.RZ_TOUR.open = function(onDone){
    const st = RZ.settings(); let step = 0; const N = 5;
    const root = document.createElement('div'); root.className = 'rz-tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    const hd = document.createElement('div'); hd.className = 'hd';
    const bd = document.createElement('div'); bd.className = 'bd';
    const ft = document.createElement('div'); ft.className = 'ft';
    root.append(hd, bd, ft); document.body.append(root); document.body.style.overflow = 'hidden';
    const name = document.createElement('input'); name.className = 'rz-input'; name.type = 'text'; name.maxLength = 30; name.placeholder = 'اكتب اسمك أو اتركه فارغًا'; name.value = st.name || ''; name.setAttribute('aria-label', 'بماذا نناديك؟');
    const les = lessonSelect(lastKey());
    let g = st.goal || 'm';
    const finish = () => {
      RZ.setSettings({ name: name.value.trim(), goal: g });
      setUpTo(les.value);
      RZ.ls.set('rz-onboarded', 1); RZ.ls.set('rz-seen-ver', (window.RZ_CHANGES && RZ_CHANGES[0].v) || '');
      root.remove(); document.body.style.overflow = ''; if(onDone) onDone();
    };
    function head(t, s){
      hd.innerHTML = ''; RZ.pattern(hd, { w:420, h:220, seed: 3 + step });
      const dots = document.createElement('div'); dots.className = 'rz-dots'; for(let i = 0; i < N; i++){ const d = document.createElement('i'); if(i === step) d.className = 'on'; dots.append(d); }
      const h = document.createElement('b'); h.style.cssText = 'font-size:22px;line-height:1.5'; h.textContent = t;
      const p = document.createElement('span'); p.style.cssText = 'font-size:15px;opacity:.9'; p.textContent = s;
      hd.append(dots, h, p);
    }
    function btn(t, cls, fn){ const b = document.createElement('button'); b.type = 'button'; b.className = 'rz-btn ' + (cls || ''); b.textContent = t; b.addEventListener('click', fn); return b; }
    function paint(){
      bd.innerHTML = ''; ft.innerHTML = '';
      if(step === 0){
        head('أهلًا بك في رسوخ', 'تعلّم التجويد واستعد لامتحانات المستويات');
        const img = document.createElement('img'); img.src = RZ.base + 'icons/icon-192.png'; img.alt = 'شعار رسوخ'; img.style.cssText = 'width:72px;height:72px;border-radius:20px;align-self:center';
        const lab = document.createElement('b'); lab.textContent = 'بماذا نناديك؟ (اختياري)';
        const note = document.createElement('span'); note.className = 'rz-meta'; note.textContent = 'يظهر الاسم في التحية فقط، ويبقى على جوالك.';
        bd.append(img, lab, name, note);
      } else if(step === 1){
        head('وصلت مع أستاذك إلى أي درس؟', 'منه تأتي أسئلة تحدّي اليوم و«صمّم اختبارك»');
        const note = document.createElement('span'); note.className = 'rz-meta'; note.textContent = 'تُختار الأسئلة من هذا الدرس وكل ما قبله. يمكنك تغييره متى شئت من الإعدادات.';
        bd.append(les, note);
      } else if(step === 2){
        head('ما هدفك اليومي؟', 'كل إجابة صحيحة تعطيك نقاطًا');
        Object.entries(RZ.GOALS).forEach(([k, G]) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'rz-opt'; b.setAttribute('aria-pressed', String(k === g));
          b.innerHTML = `<b>${G.t} · ${RZ.AR(G.x)} نقطة</b><small>${G.s}</small>`;
          b.addEventListener('click', () => { g = k; bd.querySelectorAll('.rz-opt').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
          bd.append(b);
        });
      } else if(step === 3){
        head('ماذا في التطبيق؟', 'جولة سريعة على الأبواب');
        [['book', 'مكتبة الاختبارات', 'اختبار لكل باب، ومسار للدروس، واختبار ختام لكل باب.'],
         ['mistakes', 'دفتر أخطائي', 'كل سؤال تخطئ فيه يعود إليك للمراجعة حتى تتقنه.'],
         ['flame', 'تحدّي اليوم', 'خمسة أسئلة من دروسك كل يوم، تحافظ بها على سلسلتك.'],
         ['hifz', 'مساعد الحفظ', 'المتشابهات، وما قبل الآية وما بعدها، ومراجعة محفوظك.']].forEach(([ic, t, s]) => {
          const r = document.createElement('div'); r.className = 'rz-list-btn';
          r.innerHTML = `<span class="rz-ic${ic === 'mistakes' ? ' bad' : ''}">${RZ.icon(ic === 'mistakes' ? 'mistake' : ic)}</span><span class="grow"><b>${t}</b><span class="rz-meta">${s}</span></span>`;
          bd.append(r);
        });
      } else {
        head('قبل أن تبدأ', 'التطبيق وسيلة مساعدة');
        const p = document.createElement('div'); p.className = 'rz-card';
        p.innerHTML = '<span>المرجع في الأداء هو التلقّي من المعلم المتقن، والتطبيق يساعدك على المراجعة والتثبيت.</span><span class="rz-meta">يعمل التطبيق بلا إنترنت، وكل تقدّمك محفوظ على جوالك فقط.</span>';
        const nb = btn('فعّل تذكيرًا يوميًا بتحدّي اليوم', '', async () => { nb.disabled = true; const m = await RZ.enableNotif(); nb.textContent = m; });
        nb.style.minHeight = '52px'; if(RZ.settings().notif){ nb.disabled = true; nb.textContent = 'التذكير مفعّل'; }
        bd.append(p, nb);
      }
      if(step > 0) ft.append(btn('السابق', '', () => { step--; paint(); }));
      else ft.append(btn('تخطَّ', '', finish));
      ft.append(btn(step === N - 1 ? 'ابدأ' : 'التالي', 'pri', () => { if(step === N - 1) finish(); else { step++; paint(); } }));
      const f = bd.querySelector('input,select,button'); if(f && step !== 3) setTimeout(() => f.focus({ preventScroll:true }), 50);
    }
    paint();
  };
})();
