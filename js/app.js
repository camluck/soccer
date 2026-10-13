/* App: tactics board engine, page views, and the hash router.
   Links look like #practice, #week4, #match, #match3, #match3.lia, #set, #playbook,
   or a play key with an optional step: #striker.4, #corner2-left.1 */

const $ = id => document.getElementById(id);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const POSITIONS = ROLES.filter(r => r.group !== 'Set pieces');
const SETS = ROLES.filter(r => r.group === 'Set pieces');
const isSet = k => SETS.some(r => r.key === k);
const isPos = k => POSITIONS.some(r => r.key === k);
const FULL_VIEW = '-24 -30 728 1060';

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function make(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function setPos(node, p) { node.style.transform = `translate(${p[0]}px, ${p[1]}px)`; }
function ease(k) { return k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2; }

/* ---------- board engine: one instance per pitch on the page ---------- */
const PITCH = `
  <rect class="pitch-line" x="0" y="0" width="680" height="1000"/>
  <line class="pitch-line" x1="0" y1="500" x2="680" y2="500"/>
  <circle class="pitch-line" cx="340" cy="500" r="88"/>
  <rect class="pitch-line" x="140" y="0" width="400" height="160"/>
  <rect class="pitch-line" x="250" y="0" width="180" height="55"/>
  <path class="pitch-line" d="M265.2 160 A90 90 0 0 0 414.8 160"/>
  <rect class="pitch-line" x="303" y="-14" width="74" height="14"/>
  <rect class="pitch-line" x="140" y="840" width="400" height="160"/>
  <rect class="pitch-line" x="250" y="945" width="180" height="55"/>
  <path class="pitch-line" d="M265.2 840 A90 90 0 0 1 414.8 840"/>
  <rect class="pitch-line" x="303" y="1000" width="74" height="14"/>`;
let boardCount = 0;

/* A "deck" is a list of { s: step, hl: highlighted ids, view: viewBox } the board walks through. */
/* Frame the action: a viewBox around the players in focus, their runs, the ball, and the labels. */
function autoView(s, hl) {
  const ids = s.focus || (hl && hl.length ? hl : null);
  if (!ids) return null;
  const xs = [], ys = [];
  const add = (x, y) => { xs.push(x); ys.push(y); };
  ids.forEach(p => { const q = (s.pos && s.pos[p]) || BASE[p]; if (q) add(q[0], q[1]); });
  if (s.ball) add(s.ball[0], s.ball[1]);
  const fromPath = d => { const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number); for (let i = 0; i + 1 < n.length; i += 2) add(n[i], n[i + 1]); };
  (s.arrows || []).forEach(a => fromPath(a.d));
  (s.play || []).filter(t => t.who === 'ball' || ids.includes(t.who)).forEach(t => fromPath(t.d));
  const label = (x, y, text, anchor, cw) => {
    const w = text.length * cw;
    if (anchor === 'start') { add(x - 10, y); add(x + w, y); }
    else if (anchor === 'end') { add(x - w, y); add(x + 10, y); }
    else { add(x - w / 2, y); add(x + w / 2, y); }
    add(x, y - 24);
  };
  (s.notes || []).forEach(n => label(n.x, n.y, n.text, n.anchor, n.big ? 15 : 11));
  (s.lines || []).filter(l => l.label).forEach(l => label(l.lx, l.ly, l.label, l.anchor, 11));
  (s.zones || []).forEach(z => { add(z.rect[0], z.rect[1]); add(z.rect[0] + z.rect[2], z.rect[1] + z.rect[3]); });
  if (!xs.length) return null;
  let x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 50, y1 = Math.max(...ys) + 50;
  let w = Math.max(x1 - x0, 360), h = Math.max(y1 - y0, 440);
  if (w / h < .62) w = h * .62; if (w / h > .9) h = w / .9;
  w = Math.min(w, 748); h = Math.min(h, 1080);
  let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let vx = Math.max(-34, Math.min(714 - w, cx - w / 2)), vy = Math.max(-40, Math.min(1040 - h, cy - h / 2));
  return `${vx.toFixed(0)} ${vy.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`;
}

function createBoard(svg, onStep, opts = {}) {
  const id = 'b' + (++boardCount);
  const MK = { run:'us', drib:'us', pass:'ink', shot:'acc', opp:'them', bad:'them' };
  const marker = c => `<marker id="${id}-${c}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="${c === 'acc' ? 3.6 : 4}" markerHeight="${c === 'acc' ? 3.6 : 4}" orient="auto"><path class="mk-${c}" d="M0 0 L10 5 L0 10 z"/></marker>`;
  svg.innerHTML = `<defs>${['us','ink','them','acc'].map(marker).join('')}</defs><g>${PITCH}</g>
    <g data-l="zones"></g><g data-l="arrows"></g><g data-l="players"></g><g data-l="notes"></g><g data-l="sampler" visibility="hidden"></g>`;
  const L = {}; svg.querySelectorAll('[data-l]').forEach(g => { L[g.dataset.l] = g; });

  const nodes = {};
  for (const o of OPP) {
    const g = el('g', { class:'pl them off' }, L.players);
    el('circle', { r:18 }, g);
    el('line', { x1:-7, y1:-7, x2:7, y2:7 }, g); el('line', { x1:7, y1:-7, x2:-7, y2:7 }, g);
    nodes[o] = g; setPos(g, [340, 120]);
  }
  for (const p in BASE) {
    const g = el('g', { class:'pl us' }, L.players);
    el('circle', { r:22 }, g);
    el('text', { y:6 }, g).textContent = p;
    nodes[p] = g; setPos(g, BASE[p]);
  }
  const ball = el('g', { class:'pl ball off' }, L.players);
  el('circle', { r:9 }, ball);
  setPos(ball, [340, 500]);
  for (const k in nodes) nodes[k].style.transition = 'none';
  ball.style.transition = 'none';

  let deck = [], cur = 0, raf = 0, timer = 0;
  const note = (n, parent) => { el('text', { x:n.x, y:n.y, class:'note' + (n.big ? ' big' : ''), 'text-anchor': n.anchor || 'middle' }, parent).textContent = n.text; };
  const xmark = (x, y, parent) => {
    el('line', { x1:x-12, y1:y-12, x2:x+12, y2:y+12, class:'xmark' }, parent);
    el('line', { x1:x+12, y1:y-12, x2:x-12, y2:y+12, class:'xmark' }, parent);
  };
  const stop = () => { cancelAnimationFrame(raf); clearTimeout(timer); L.sampler.textContent = ''; };

  function go(i, autoplay = true) {
    stop();
    cur = Math.max(0, Math.min(deck.length - 1, i));
    const { s, hl, view } = deck[cur];
    svg.setAttribute('viewBox', (opts.zoom && autoView(s, hl)) || view || FULL_VIEW);
    for (const p in BASE) {
      const n = nodes[p];
      n.style.transition = '';
      setPos(n, (s.pos && s.pos[p]) || BASE[p]);
      n.classList.toggle('hl', hl.includes(p));
      n.classList.toggle('dim', !!s.focus && !s.focus.includes(p));
    }
    for (const o of OPP) {
      const n = nodes[o], p = s.opp && s.opp[o];
      n.style.transition = '';
      n.classList.toggle('off', !p);
      if (p) setPos(n, p);
    }
    ball.style.transition = '';
    ball.classList.toggle('off', !s.ball);
    if (s.ball) setPos(ball, s.ball);

    for (const k of ['zones','arrows','notes']) L[k].textContent = '';
    const fresh = reduced ? '' : ' fresh';
    (s.zones || []).forEach(z => {
      el('rect', { x:z.rect[0], y:z.rect[1], width:z.rect[2], height:z.rect[3], rx:18, class:'zone' + (z.bad ? ' bad' : '') + fresh }, L.zones);
      if (z.label) note({ x:z.lx, y:z.ly, text:z.label, big:true }, L.notes);
    });
    (s.lines || []).forEach(l => {
      el('path', { d:l.d, class:'offline' + fresh }, L.zones);
      if (l.label) note({ x:l.lx, y:l.ly, text:l.label, anchor:l.anchor }, L.notes);
    });
    (s.ghosts || []).forEach(g => el('circle', { cx:g[0], cy:g[1], r:22, class:'ghost' + fresh }, L.arrows));
    (s.arrows || []).forEach(a => {
      const attrs = { d:a.d, class:'ar ' + a.t + fresh };
      if (MK[a.t]) attrs['marker-end'] = `url(#${id}-${MK[a.t]})`;
      el('path', attrs, L.arrows);
    });
    (s.crosses || []).forEach(c => {
      el('path', { d:c.line, class:'ar opp' + fresh, opacity:.55 }, L.arrows);
      xmark(c.x, c.y, el('g', { class:fresh.trim() }, L.notes));
    });
    (s.xs || []).forEach(p => xmark(p[0], p[1], el('g', { class:fresh.trim() }, L.notes)));
    (s.notes || []).forEach(n => note(n, L.notes));

    if (onStep) onStep(cur, deck);
    if (autoplay && s.play && !reduced) timer = setTimeout(play, 750);
  }

  /* Each mover follows its own track. A mover with several tracks (like the ball being kicked, then thrown)
     follows whichever of its tracks started most recently. */
  function play() {
    stop();
    const s = deck[cur].s;
    if (!s.play) return;
    const byNode = new Map();
    s.play.forEach(p => {
      const node = p.who === 'ball' ? ball : nodes[p.who];
      if (!node) return;
      const path = el('path', { d:p.d }, L.sampler);
      const t = { ...p, delay: p.delay || 0, path, len: path.getTotalLength() };
      if (!byNode.has(node)) byNode.set(node, []);
      byNode.get(node).push(t);
    });
    byNode.forEach((ts, node) => {
      ts.sort((a, b) => a.delay - b.delay);
      node.style.transition = 'none';
      const pt = ts[0].path.getPointAtLength(0); setPos(node, [pt.x, pt.y]);
    });
    const start = performance.now();
    const frame = now => {
      const t0 = now - start; let done = true;
      byNode.forEach((ts, node) => {
        let t = ts[0];
        for (const x of ts) if (t0 >= x.delay) t = x;
        const k = Math.max(0, Math.min(1, (t0 - t.delay) / t.dur));
        if (ts.some(x => t0 < x.delay + x.dur)) done = false;
        const pt = t.path.getPointAtLength(ease(k) * t.len);
        setPos(node, [pt.x, pt.y]);
      });
      if (!done) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  return {
    load(d, step = 0) { deck = d; go(step); },
    go, play, stop,
    replay() { go(cur, false); clearTimeout(timer); timer = setTimeout(play, 650); },
    get cur() { return cur; }, get size() { return deck.length; }, get step() { return deck[cur] && deck[cur].s; }
  };
}

const deckFor = r => r.steps.map(s => ({ s, hl: s.hl || r.hl, view: r.view, label: s.nav }));

/* ---------- main board (Positions + Set pieces) ---------- */
let role = null;
const main = createBoard($('board'), (cur, deck) => {
  const s = deck[cur].s;
  $('count').textContent = `Step ${cur + 1} of ${deck.length}`;
  $('title').textContent = s.title;
  const body = $('body'); body.textContent = '';
  if (s.goals) {
    const ul = make('ul', 'goals');
    s.goals.forEach(([h, d]) => { const li = make('li'); li.append(make('b', null, h), make('span', null, d)); ul.appendChild(li); });
    body.appendChild(ul);
  } else s.body.forEach(t => body.appendChild(make('p', null, t)));
  $('cue').textContent = s.cue;
  $('prev').disabled = cur === 0;
  $('next').disabled = cur === deck.length - 1;
  $('replay').hidden = !s.play;
  $('toast').textContent = '';
  document.querySelectorAll('#steps button').forEach((b, j) => { if (j === cur) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
  replaceHash(role.key + (cur ? '.' + (cur + 1) : ''));
});

function loadPlay(r, step) {
  role = r;
  $('lg-role').textContent = r.group === 'Set pieces' ? 'In the play' : r.name;
  const list = $('steps'); list.textContent = '';
  r.steps.forEach((s, i) => {
    const li = make('li'); const b = make('button', null, s.nav);
    b.type = 'button'; b.addEventListener('click', () => main.go(i));
    li.appendChild(b); list.appendChild(li);
  });
  main.load(deckFor(r), step);
}

$('prev').addEventListener('click', () => main.go(main.cur - 1));
$('next').addEventListener('click', () => main.go(main.cur + 1));
$('replay').addEventListener('click', () => main.replay());
$('share').addEventListener('click', () => {
  const url = location.href;
  try { navigator.clipboard.writeText(url).then(() => { $('toast').textContent = 'Link copied'; }, () => { $('toast').textContent = url; }); }
  catch (e) { $('toast').textContent = url; }
});
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (!$('v-match').hidden) {
    if (e.target.id === 'track') return;
    if (e.key === 'ArrowRight') showPlayer(matchIdx + 1);
    if (e.key === 'ArrowLeft') showPlayer(matchIdx - 1);
    return;
  }
  if ($('v-board').hidden) return;
  if (e.key === 'ArrowRight') main.go(main.cur + 1);
  if (e.key === 'ArrowLeft') main.go(main.cur - 1);
});

/* ---------- remembered choices ---------- */
const store = {
  get(k, d) { try { return localStorage.getItem('pb-' + k) || d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pb-' + k, v); } catch (e) {} }
};
let lastPos = isPos(store.get('pos')) ? store.get('pos') : POSITIONS[0].key;
let lastSet = isSet(store.get('set')) ? store.get('set') : SETS[0].key;

/* defenders on/off, shared by every board on the page */
let showOpp = store.get('opp', 'on') !== 'off';
function applyOpp() {
  document.body.classList.toggle('hide-opp', !showOpp);
  document.querySelectorAll('.opp-toggle').forEach(b => {
    b.setAttribute('aria-pressed', String(showOpp));
    b.textContent = showOpp ? 'Defenders: on' : 'Defenders: off';
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('.opp-toggle'); if (!b) return;
  showOpp = !showOpp; store.set('opp', showOpp ? 'on' : 'off'); applyOpp();
});
applyOpp();

/* ---------- page header + chooser ---------- */
function header(eyebrow, title, num, tag) {
  $('eyebrow').textContent = eyebrow; $('page-title').textContent = title;
  $('page-num').textContent = num || ''; $('page-tag').textContent = tag || '';
}
function chipButton(label, pressed, onClick) {
  const b = make('button', 'chip-btn', label); b.type = 'button';
  b.setAttribute('aria-pressed', String(pressed)); b.addEventListener('click', onClick); return b;
}
function chooser(...parts) { const c = $('chooser'); c.textContent = ''; c.hidden = !parts.length; parts.forEach(p => c.appendChild(p)); }

/* ---------- views ---------- */
let openDemo = null;
function showSection(view) {
  $('v-home').hidden = view !== 'home';
  $('pagehead').hidden = view === 'home';
  if (view === 'home') chooser();
  $('v-practice').hidden = view !== 'practice';
  $('v-match').hidden = view !== 'match';
  $('v-board').hidden = !(view === 'play' || view === 'set');
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (view !== 'play' && view !== 'set') main.stop();
  if (view !== 'match') cardDemos.forEach(d => d.board.stop());
  if (view !== 'practice' && openDemo) openDemo.close();
}

function viewPosition(key, step) {
  const r = POSITIONS.find(x => x.key === key) || POSITIONS[0];
  lastPos = r.key; store.set('pos', r.key);
  showSection('play');
  header('Positions', r.name, r.num, r.tag);
  const chips = make('div', 'chips');
  POSITIONS.forEach(p => chips.appendChild(chipButton(p.name, p === r, () => navigate(p.key))));
  chooser(chips);
  loadPlay(r, step);
}

function viewSetPiece(key, step) {
  const r = SETS.find(x => x.key === key) || SETS[0];
  lastSet = r.key; store.set('set', r.key);
  const [, n, side] = r.key.match(/^corner(\d)-(right|left)$/);
  showSection('set');
  header('Set pieces', r.name, r.num + ' side', r.tag);
  const chips = make('div', 'chips');
  [...new Set(SETS.map(s => s.key.match(/^corner(\d)/)[1]))].forEach(m =>
    chips.appendChild(chipButton(`Corner ${m}`, m === n, () => navigate(`corner${m}-${side}`))));
  const seg = make('div', 'seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Corner side');
  ['right', 'left'].forEach(sd => {
    const b = make('button', null, sd === 'right' ? 'Right side' : 'Left side'); b.type = 'button';
    b.setAttribute('aria-pressed', String(sd === side));
    b.addEventListener('click', () => navigate(`corner${n}-${sd}${main.cur ? '.' + (main.cur + 1) : ''}`));
    seg.appendChild(b);
  });
  chooser(chips, seg);
  loadPlay(r, step);
}

/* ---------- practice: concept cards that open their own animation in place ---------- */
function demoDeck(show) {
  return show.flatMap(entry => {
    if (typeof entry === 'string') {
      const sc = SCENES[entry];
      return sc ? sc.steps.map(s => ({ s, hl: s.hl || [], view: s.view || sc.view, label: s.nav })) : [];
    }
    const [key, nav, label] = entry;
    const r = ROLES.find(x => x.key === key);
    const s = r && r.steps.find(x => x.nav === nav);
    return s ? [{ s, hl: s.hl || r.hl, view: r.view, label: label || s.nav }] : [];
  });
}

/* A small board with its own step tabs and controls. compact = just the step title (used inside match cards). */
function buildDemo(show, label, compact) {
  const deck = demoDeck(show);
  const box = make('div', compact ? 'demo compact' : 'demo');
  const svg = el('svg', { class:'mini', role:'img', 'aria-label': `Animation: ${label}` });
  const side = make('div', 'demo-side');
  const tabs = make('div', 'chips demo-tabs');
  const h = make('div', 'demo-title'); const p = make('div', 'demo-body');
  const cue = make('div', 'cuebox'); const cueTxt = make('strong'); cue.append(make('small', null, 'Coach’s cue'), cueTxt);
  const ctr = make('div', 'demo-ctrls');
  const rp = make('button', 'btn small accent', '▶ Play again'); rp.type = 'button';
  const ot = make('button', 'btn small opp-toggle'); ot.type = 'button';
  ctr.append(rp, ot);
  if (deck.length > 1) side.appendChild(tabs);
  side.append(h);
  if (!compact) side.append(p, cue);
  side.append(ctr);
  box.append(svg, side);
  const tabBtns = deck.map((d, i) => { const b = chipButton(d.label, false, () => board.go(i)); tabs.appendChild(b); return b; });
  const board = createBoard(svg, (cur, d) => {
    const s = d[cur].s;
    h.textContent = s.title; p.textContent = '';
    (s.body || s.goals.map(([a, b]) => `${a}: ${b}`)).forEach(t => p.appendChild(make('p', null, t)));
    cueTxt.textContent = s.cue;
    tabBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === cur)));
    rp.hidden = !s.play;
  }, { zoom: compact });
  rp.addEventListener('click', () => board.replay());
  return { box, board, deck };
}

/* ---------- practice: one simple list. Tap a concept to open it right there. ---------- */
const titleSlug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function viewPractice(week, openSlug) {
  const w = PRACTICE.find(x => x.week === week) || PRACTICE[0];
  const current = w === PRACTICE[0];
  showSection('practice');
  header(current ? 'Practice · This week' : 'Practice', w.label, '', w.headline);
  if (PRACTICE.length > 1) {
    const chips = make('div', 'chips');
    PRACTICE.forEach(x => chips.appendChild(chipButton(x.label, x === w, () => navigate('week' + x.week))));
    chooser(chips);
  } else chooser();
  const wrap = $('practice-groups'); wrap.textContent = '';
  if (w.note) {
    const n = make('aside', 'callout');
    n.append(make('strong', null, w.note.title), make('span', null, w.note.body));
    wrap.appendChild(n);
  }
  w.groups.forEach(g => {
    const sec = make('section', 'plist-group'); sec.appendChild(make('h3', null, g.name));
    const ul = make('ul', 'plist');
    g.items.forEach((it, k) => {
      const li = make('li');
      const pid = `pp-${g.name}-${k}`.toLowerCase().replace(/[^a-z0-9-]+/g, '');
      const row = make('button', 'prow'); row.type = 'button';
      row.setAttribute('aria-expanded', 'false'); row.setAttribute('aria-controls', pid);
      row.append(make('span', 'prow-title', it.title), make('span', 'prow-cue', it.cue), make('span', 'prow-chev', '›'));
      const panel = make('div', 'ppanel'); panel.id = pid; panel.hidden = true;
      let demo = null;
      const ctl = {
        close() {
          if (demo) { demo.board.stop(); demo.box.remove(); demo = null; }
          panel.hidden = true; panel.textContent = ''; row.setAttribute('aria-expanded', 'false');
          if (openDemo === ctl) openDemo = null;
        },
        open() {
          if (openDemo && openDemo !== ctl) openDemo.close();
          panel.textContent = ''; panel.appendChild(make('p', null, it.body));
          if (it.show && demoDeck(it.show).length) {
            demo = buildDemo(it.show, it.title, false);
            panel.appendChild(demo.box); demo.board.load(demo.deck, 0); applyOpp();
          }
          panel.hidden = false; row.setAttribute('aria-expanded', 'true'); openDemo = ctl;
          requestAnimationFrame(() => row.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
        }
      };
      row.addEventListener('click', () => (panel.hidden ? ctl.open() : ctl.close()));
      if (openSlug && titleSlug(it.title) === openSlug) requestAnimationFrame(() => ctl.open());
      li.append(row, panel); ul.appendChild(li);
    });
    sec.appendChild(ul); wrap.appendChild(sec);
  });
}

/* ---------- match day: swipeable player cards with their own animation + quick finder ---------- */
const slug = p => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
let curMatch = MATCHES[0], PLAYERS = [], matchIdx = 0, deckScrollTimer = 0;
const cardDemos = new Map();

function buildDeck(m) {
  curMatch = m;
  cardDemos.forEach(d => d.board.stop()); cardDemos.clear();
  PLAYERS = m.groups.flatMap(g => g.players.map(p => ({ ...p, group: g.group })));
  $('team-goal').textContent = m.teamGoal;
  const track = $('track'); track.textContent = '';
  PLAYERS.forEach((p, i) => {
    const c = make('article', 'pcard'); c.id = 'p-' + slug(p);
    c.setAttribute('aria-roledescription', 'slide'); c.setAttribute('aria-label', `${p.name}, ${i + 1} of ${PLAYERS.length}`);
    const who = make('div', 'who'); const info = make('div'); const pos = make('div', 'pos');
    p.pos.forEach((x, j) => pos.appendChild(make('span', j === 0 ? 'main' : null, x)));
    info.append(make('div', 'name', p.name), pos);
    who.append(make('span', 'no', p.no || '–'), info);
    const today = make('div', 'today'); today.append(make('small', null, 'This match'), make('span', null, p.today));
    const slot = make('div', 'pdemo');
    c.append(make('div', 'grp', p.group), who, make('div', 'goal', p.goal), today, slot);
    c.addEventListener('click', e => { if (i !== matchIdx && !e.target.closest('button')) { e.preventDefault(); showPlayer(i); } });
    track.appendChild(c);
  });
}
/* Boards are built for the current card and its neighbors only; only the current one plays. */
function syncCardDemos(i) {
  const track = $('track');
  [i - 1, i, i + 1].forEach(j => {
    const p = PLAYERS[j]; if (!p || !p.show || cardDemos.has(j)) return;
    const d = buildDemo(p.show, p.goal, true);
    track.children[j].querySelector('.pdemo').appendChild(d.box);
    d.board.load(d.deck, 0); d.board.stop();
    cardDemos.set(j, d);
  });
  cardDemos.forEach((d, j) => { if (j === i) d.board.go(0); else d.board.stop(); });
  applyOpp();
}
(function wireDeck() {
  const track = $('track');
  track.addEventListener('scroll', () => {
    clearTimeout(deckScrollTimer);
    deckScrollTimer = setTimeout(() => {
      const cards = track.children, mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      for (let i = 0; i < cards.length; i++) { const c = cards[i]; const d = Math.abs(c.offsetLeft - track.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }
      if (best !== matchIdx) markPlayer(best);
    }, 90);
  });
  $('deck-prev').addEventListener('click', () => showPlayer(matchIdx - 1));
  $('deck-next').addEventListener('click', () => showPlayer(matchIdx + 1));
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); showPlayer(matchIdx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPlayer(matchIdx - 1); }
  });
})();

function markPlayer(i) {
  matchIdx = i;
  [...$('track').children].forEach((c, j) => c.classList.toggle('on', j === i));
  $('deck-count').textContent = `${i + 1} of ${PLAYERS.length}`;
  $('deck-prev').disabled = i === 0; $('deck-next').disabled = i === PLAYERS.length - 1;
  const inp = $('player-search'); if (inp && document.activeElement !== inp) inp.value = PLAYERS[i].name;
  replaceHash(`match${curMatch.match}.${slug(PLAYERS[i])}`);
  syncCardDemos(i);
}
function showPlayer(i, instant) {
  i = Math.max(0, Math.min(PLAYERS.length - 1, i));
  const track = $('track'), c = track.children[i];
  const left = c.offsetLeft - track.offsetLeft - (track.clientWidth - c.offsetWidth) / 2;
  if (instant) { track.style.scrollBehavior = 'auto'; track.scrollLeft = left; track.style.scrollBehavior = ''; }
  else track.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  markPlayer(i);
}

function playerFinder() {
  const wrap = make('div', 'combo');
  const inp = make('input'); inp.id = 'player-search'; inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
  inp.placeholder = 'Find a player…'; inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-label', 'Find a player');
  inp.setAttribute('aria-controls', 'player-list'); inp.setAttribute('aria-expanded', 'false'); inp.setAttribute('aria-autocomplete', 'list');
  const ul = make('ul'); ul.id = 'player-list'; ul.setAttribute('role', 'listbox'); ul.hidden = true;
  let hits = [], hi = 0;
  const paint = () => [...ul.children].forEach((li, k) => {
    li.setAttribute('aria-selected', String(k === hi));
    if (k === hi && hits[k]) { inp.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
  });
  const close = () => { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); };
  const pick = k => { if (!hits[k]) return; close(); inp.value = hits[k].p.name; inp.blur(); showPlayer(hits[k].i); };
  const open = q => {
    q = (q || '').trim().toLowerCase();
    hits = PLAYERS.map((p, i) => ({ p, i })).filter(({ p }) => !q || p.name.toLowerCase().includes(q) || p.pos.some(x => x.toLowerCase() === q) || p.no === q);
    hi = 0; ul.textContent = '';
    if (!hits.length) ul.appendChild(make('li', 'none', 'No player by that name'));
    hits.forEach(({ p, i }, k) => {
      const li = make('li'); li.setAttribute('role', 'option'); li.id = 'opt-' + i;
      li.append(make('span', 'n', p.no || '–'), make('span', 'nm', p.name), make('span', 'ps', p.pos.join(' · ')));
      li.addEventListener('mousedown', e => { e.preventDefault(); pick(k); });
      ul.appendChild(li);
    });
    paint(); ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
  };
  inp.addEventListener('focus', () => { inp.select(); open(''); });
  inp.addEventListener('input', () => open(inp.value));
  inp.addEventListener('blur', () => { close(); if (PLAYERS[matchIdx]) inp.value = PLAYERS[matchIdx].name; });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (ul.hidden) open(inp.value); else { hi = Math.min(hits.length - 1, hi + 1); paint(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(hi); }
    else if (e.key === 'Escape') { inp.blur(); }
  });
  wrap.append(inp, ul);
  return wrap;
}

function viewMatch(num, who) {
  const m = MATCHES.find(x => x.match === num) || MATCHES[0];
  if (m !== curMatch || !PLAYERS.length) { buildDeck(m); matchIdx = 0; }
  showSection('match');
  header('Match day', 'Match goals', m.label, 'Swipe through the players, or find one by name.');
  const parts = [playerFinder()];
  if (MATCHES.length > 1) {
    const chips = make('div', 'chips');
    MATCHES.forEach(x => chips.appendChild(chipButton(x.label, x === m, () => navigate('match' + x.match))));
    parts.push(chips);
  }
  chooser(...parts);
  const i = PLAYERS.findIndex(p => slug(p) === who);
  requestAnimationFrame(() => showPlayer(i >= 0 ? i : matchIdx, true));
}


/* ---------- home ---------- */
let homeBoard = null;
function viewHome() {
  showSection('home');
  const root = $('v-home');
  if (!root.childElementCount) {
    const w = PRACTICE[0], m = MATCHES[0];
    const link = (cls, href, text) => { const a = make('a', cls, text); a.href = href; return a; };

    const hero = make('section', 'hero');
    const left = make('div');
    const mark = make('div', 'hero-mark');
    mark.innerHTML = `<svg width="64" height="64" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#FFFFFF"/><path d="M17 6.5 L19.6 13.6 L27 14.1 L21.2 18.7 L23.1 26 L17 21.9 L10.9 26 L12.8 18.7 L7 14.1 L14.4 13.6 Z" fill="var(--us)"/></svg>`;
    mark.appendChild(make('h1', null, 'Magic'));
    const cta = make('div', 'hero-cta');
    cta.append(link('btn primary', '#practice', `${w.label} practice →`), link('btn', '#match', `${m.label} goals →`));
    left.append(mark, make('div', 'sub', '3-4-3 Diamond · Blue & White'),
      make('p', null, 'Our playbook: what we’re working on this week, where everyone plays, our corner plays, and each player’s goal for the next match.'), cta);
    const svg = el('svg', { class:'mini', role:'img', 'aria-label':'Our 3-4-3 diamond formation' });
    hero.append(left, svg);

    const grid = make('div', 'home-grid');
    const wk = make('section', 'panelcard');
    const concepts = make('div', 'linkchips');
    w.groups.forEach(g => g.items.forEach(it => concepts.appendChild(link('', '#practice.' + titleSlug(it.title), it.title))));
    wk.append(make('div', 'kicker', 'This week'), make('h2', null, w.label), make('p', null, w.headline));
    if (w.note) wk.appendChild(make('p', null, w.note.title));
    wk.append(concepts, link('btn small more', '#practice', 'Open practice plan →'));

    const md = make('section', 'panelcard');
    const names = make('div', 'linkchips');
    m.groups.forEach(g => g.players.forEach(p => {
      const a = link('', `#match${m.match}.${slug(p)}`, '');
      if (p.no) a.appendChild(make('span', 'n', p.no));
      a.appendChild(document.createTextNode(p.name)); names.appendChild(a);
    }));
    md.append(make('div', 'kicker', 'Match day'), make('h2', null, `${m.label} goals`), make('p', null, 'Tap your name to see your goal for the match.'), names,
      link('btn small more', '#match', 'See all match goals →'));
    grid.append(wk, md);

    const pos = make('section', 'home-section'); pos.appendChild(make('h3', null, 'Positions'));
    const pt = make('div', 'tiles');
    POSITIONS.forEach(r => { const a = link('tile', '#' + r.key, ''); a.append(make('span', null, r.num), make('b', null, r.name), make('small', null, r.tag.split('. ')[0].replace(/\.$/, '') + '.')); pt.appendChild(a); });
    pos.appendChild(pt);

    const sp = make('section', 'home-section'); sp.appendChild(make('h3', null, 'Set pieces'));
    const st = make('div', 'tiles');
    [['corner1-right', 'Corner 1', 'Taker calls “1!”. Two short options and loop runs to both posts.'],
     ['corner2-right', 'Corner 2', 'Taker calls “2!”. Same lineup, the short player goes front post.']].forEach(([k, n, d]) => {
      const a = link('tile', '#' + k, ''); a.append(make('span', null, 'Corner kick'), make('b', null, n), make('small', null, d)); st.appendChild(a);
    });
    sp.appendChild(st);

    root.append(hero, grid, pos, sp);
    homeBoard = createBoard(svg);
    homeBoard.load(demoDeck(['formation']).slice(0, 1), 0);
  }
  homeBoard.go(0, false);
}

/* ---------- router ---------- */
let lastHash = null;
function replaceHash(h) {
  lastHash = '#' + h;
  try { if (location.hash !== lastHash) history.replaceState(null, '', lastHash); } catch (e) {}
}
function navigate(h) {
  if (location.hash === '#' + h) route(); else location.hash = h;
}
function route() {
  const h = location.hash.slice(1);
  const [key, sub] = h.split('.');
  const onBoard = role && !$('v-board').hidden, onMatch = !$('v-match').hidden;
  if (('#' + h) === lastHash && (onBoard || (onMatch && /^match/.test(key)))) return; // our own replaceState echo
  const step = Math.max(0, (parseInt(sub, 10) || 1) - 1);
  window.scrollTo(0, 0);
  if (h === '' || h === 'home') return viewHome();
  if (key === 'practice') return viewPractice(undefined, sub);
  const wk = key.match(/^week(\d+)$/); if (wk) return viewPractice(+wk[1], sub);
  const mt = key.match(/^match(\d*)$/); if (mt) return viewMatch(mt[1] ? +mt[1] : MATCHES[0].match, sub);
  if (h === 'set') return viewSetPiece(lastSet);
  if (h === 'playbook') return viewPosition(lastPos);
  if (isSet(key)) return viewSetPiece(key, step);
  if (isPos(key)) return viewPosition(key, step);
  viewHome();
}
window.addEventListener('hashchange', route);
route();
