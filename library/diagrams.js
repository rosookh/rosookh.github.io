/* Rosookh: labelled diagrams for «انقل الاسم إلى مكانه» and «ما اسم الجزء المضيء؟» (batch 5).
   Each diagram: base SVG (no names on it) + parts {name: {s: highlight shape, p: [x, y] pin}}. Drawn by hand, schematic. */
(function(){
  const ivory = '#F6EFDD', gumC = '#E59AA0', tongueC = '#C9474F';
  // ---------- tongue, seen from above (root at the top, tip at the bottom) ----------
  const TO = 'M70,22 C70,8 230,8 230,22 L232,232 C232,296 182,318 150,318 C118,318 68,296 68,232 Z';
  const tongue = {
    vb:'0 0 300 330', title:'أجزاء اللسان',
    base:`<defs><clipPath id="dgTo"><path d="${TO}"/></clipPath><linearGradient id="dgTg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B83A44"/><stop offset="1" stop-color="#D9575E"/></linearGradient></defs>
      <path d="${TO}" fill="url(#dgTg)" stroke="#7A2433" stroke-width="3"/>
      <path d="M150,30 L150,300" stroke="#9E2F3A" stroke-width="2" opacity=".5"/>
      ${[86, 150, 214, 268].map(y => `<line x1="66" y1="${y}" x2="234" y2="${y}" stroke="#F2D36B" stroke-width="2.5" stroke-dasharray="6 4" clip-path="url(#dgTo)"/>`).join('')}
      ${Array.from({ length:26 }, (_, i) => `<circle cx="${90 + (i * 37) % 120}" cy="${26 + (i * 23) % 54}" r="3" fill="#E77A80" opacity=".55"/>`).join('')}`,
    parts:{
      'جذر اللسان':{ s:'<rect x="68" y="8" width="164" height="78"/>', p:[150, 50] },
      'أقصى اللسان':{ s:'<rect x="92" y="86" width="116" height="64"/>', p:[150, 118] },
      'وسط اللسان':{ s:'<rect x="92" y="150" width="116" height="64"/>', p:[150, 182] },
      'طرف اللسان':{ s:'<rect x="92" y="214" width="116" height="54"/>', p:[150, 241] },
      'رأس اللسان':{ s:'<ellipse cx="150" cy="300" rx="38" ry="20"/>', p:[150, 298] },
      'أقصى الحافة':{ s:'<rect x="62" y="86" width="30" height="64"/><rect x="208" y="86" width="30" height="64"/>', p:[80, 118] },
      'أدنى الحافة':{ s:'<rect x="62" y="214" width="30" height="54"/><rect x="208" y="214" width="30" height="54"/>', p:[80, 241] },
      'منتهى الحافة':{ s:'<path d="M70,268 L104,268 L118,318 L84,312 Z"/><path d="M230,268 L196,268 L182,318 L216,312 Z"/>', p:[96, 290] }
    }, clip:'dgTo'
  };
  // ---------- teeth and roof of the mouth (upper arch from below, lower arch from above; front teeth outward) ----------
  const tooth = (x, y, r, k) => `<g class="th th${k}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${ivory}" stroke="#8C7B5A" stroke-width="1.6"/></g>`;
  const T = [{ a:6, r:9 }, { a:17, r:8.5 }, { a:28, r:9 }, { a:39, r:9.5 }, { a:51, r:11 }, { a:63, r:11 }, { a:75, r:11 }, { a:87, r:10.5 }];
  const grp = ['ثنايا', 'رباعيات', 'أنياب', 'ضواحك', 'طواحن', 'طواحن', 'طواحن', 'نواجذ'];
  const pos = (upper, i, side) => { const t = T[i].a * Math.PI / 180, cx = 150, rx = 104, ry = 150;
    return upper ? [cx + side * rx * Math.sin(t), 200 - ry * Math.cos(t)] : [cx + side * rx * Math.sin(t), 230 + ry * Math.cos(t)]; };
  let teethSvg = '';
  const toothPos = {}; grp.forEach(g => toothPos[g] = []);
  [true, false].forEach(up => [-1, 1].forEach(sd => T.forEach((t, i) => { const [x, y] = pos(up, i, sd); teethSvg += tooth(x, y, t.r, i); toothPos[grp[i]].push([x, y, t.r]); })));
  const ring = g => toothPos[g].map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 4}"/>`).join('');
  const teeth = {
    vb:'0 0 300 392', title:'الأسنان وسقف الفم',
    base:`<path d="M44,200 C44,60 90,40 150,40 C210,40 256,60 256,200 Z" fill="${gumC}" stroke="#A4535B" stroke-width="2"/>
      <path d="M70,196 C70,86 106,70 150,70 C194,70 230,86 230,196 Z" fill="#B9464F"/>
      <path d="M100,104 C120,92 180,92 200,104 M96,118 C122,106 178,106 204,118 M98,132 C124,122 176,122 202,132 M150,80 L150,140" stroke="#E7A0A6" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M80,170 C110,160 190,160 220,170 L222,196 L78,196 Z" fill="#A83A43"/>
      <path d="M142,186 C142,206 158,206 158,186 Z" fill="#8E2C36" stroke="#6E2029" stroke-width="1.5"/>
      <path d="M44,230 C44,370 90,390 150,390 C210,390 256,370 256,230 Z" fill="${gumC}" stroke="#A4535B" stroke-width="2"/>
      <path d="M76,234 C76,344 110,360 150,360 C190,360 224,344 224,234 Z" fill="#C35A61"/>
      ${teethSvg}`,
    parts:{
      'الثنايا':{ s:ring('ثنايا'), p:[150, 34], n:4 },
      'الرباعيات':{ s:ring('رباعيات'), p:[112, 54], n:4 },
      'الأنياب':{ s:ring('أنياب'), p:[96, 72], n:4 },
      'الضواحك':{ s:ring('ضواحك'), p:[80, 96], n:4 },
      'الطواحن':{ s:ring('طواحن'), p:[62, 140], n:12 },
      'النواجذ':{ s:ring('نواجذ'), p:[48, 196], n:4 },
      'اللثة':{ s:'<path d="M118,66 C128,58 172,58 182,66 C176,80 124,80 118,66 Z"/>', p:[150, 66] },
      'النطع (مقدّمة الحنك)':{ s:'<path d="M96,90 C120,80 180,80 204,90 L206,138 C180,128 120,128 94,138 Z"/>', p:[150, 106] },
      'الحنك العظمي':{ s:'<path d="M92,140 C120,130 180,130 208,140 L218,168 C190,158 110,158 82,168 Z"/>', p:[150, 146] },
      'الحنك اللحمي':{ s:'<path d="M80,170 C110,160 190,160 220,170 L222,196 L78,196 Z"/>', p:[196, 182] },
      'اللهاة':{ s:'<ellipse cx="150" cy="196" rx="12" ry="14"/>', p:[150, 212] }
    }
  };
  // ---------- general makharij on the side view ----------
  const general = {
    vb:'0 0 720 560', title:'المخارج العامة',
    base:`<image href="../makharij/img/rest.webp" x="0" y="0" width="720" height="560"/>`,
    parts:{
      'الخيشوم':{ s:'<ellipse cx="160" cy="175" rx="52" ry="34"/>', p:[160, 175] },
      'الجوف':{ s:'<ellipse cx="420" cy="282" rx="150" ry="36"/><ellipse cx="610" cy="330" rx="28" ry="70"/>', p:[430, 282] },
      'الشفتان':{ s:'<ellipse cx="175" cy="345" rx="32" ry="52"/>', p:[160, 345] },
      'اللسان':{ s:'<ellipse cx="400" cy="415" rx="150" ry="62"/>', p:[400, 420] },
      'الحلق':{ s:'<ellipse cx="640" cy="480" rx="44" ry="80"/>', p:[640, 480] }
    }
  };
  // ---------- the three parts of the throat ----------
  const halq = {
    vb:'0 0 260 330', title:'أقسام الحلق',
    base:`<path d="M20,40 C60,20 120,20 150,40 L150,300 L210,300" fill="none" stroke="#8C5A3C" stroke-width="3"/>
      <path d="M20,60 C60,44 100,46 112,60 L112,300" fill="none" stroke="#8C5A3C" stroke-width="3"/>
      <rect x="112" y="40" width="38" height="262" fill="#C24D55"/>
      <path d="M20,40 C60,20 120,20 150,40 L112,60 C100,46 60,44 20,60 Z" fill="#7E2A33"/>
      <text x="70" y="16" font-size="15" text-anchor="middle" fill="#5A4636">← نحو الفم</text><text x="200" y="322" font-size="15" text-anchor="middle" fill="#5A4636">نحو الصدر ↓</text>`,
    parts:{
      'أدنى الحلق':{ s:'<circle cx="131" cy="96" r="34"/>', p:[131, 96] },
      'وسط الحلق':{ s:'<circle cx="131" cy="172" r="34"/>', p:[131, 172] },
      'أقصى الحلق':{ s:'<circle cx="131" cy="250" r="34"/>', p:[131, 250] }
    }
  };
  window.RZ_DIAG = { tongue, teeth, general, halq };
})();
