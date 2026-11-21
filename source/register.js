'use strict';
/* ===== Register app (counter / cashier) ===== */
let DB, S = defaultSettings(), SESS = {}, TODAY = [], FILTER = 'all', PANEL = null, curDay = '', unBills = null;

const app = $('#app');
app.innerHTML = `
<div class="topbar">
  <h1 id="shop" class="grow"></h1>
  <span id="st" class="dot"></span>
  <button id="b-switch"></button><button id="b-bills"></button><button id="b-sum"></button><button id="b-lang" class="ghost"></button>
</div>
<div class="chips" id="chips"></div>
<div id="tables"></div>`;

$('#b-switch').onclick = () => switchFlow(null);
$('#b-bills').onclick = openBills;
$('#b-sum').onclick = openSummary;
$('#b-lang').onclick = () => { setLang(LANG === 'en' ? 'vi' : 'en'); render(); rerenderPanel(); };
$('#chips').onclick = e => { const c = e.target.closest('[data-f]'); if (c) { FILTER = c.dataset.f; render(); } };
$('#tables').onclick = e => { const c = e.target.closest('[data-tid]'); if (c) openTable(c.dataset.tid); };

const fail = e => { console.error(e); toast('Error: ' + (e.message || e)); };
const M = 60000;
function saveSess(id, s) { SESS[id] = s; return DB.setSession(id, s).catch(fail); }
function startTimerFor(id, type, pct) {
  const tm = newTimer(S, type, pct);
  const tb = tableOf(S, id);
  if (tb && tb.type === type && tb.rate != null && tb.rate !== '') { tm.rate = +tb.rate; tm.baseRate = +tb.rate; }
  return tm;
}
const choice = (title, buttons, extra = '') => modal(`<h3>${esc(title)}</h3>${extra}<div class="btns" style="max-height:62vh;overflow:auto">${buttons.map(([v, l, cls]) => `<button data-v="${esc(v)}" class="${cls || ''}">${l}</button>`).join('')}</div><button class="ghost" style="width:100%;margin-top:12px" data-a="n">${esc(t('cancel'))}</button>`,
  (bg, close) => { $$('[data-v]', bg).forEach(b => b.onclick = () => close(b.dataset.v)); $('[data-a=n]', bg).onclick = () => close(null); });

/* ---------- Home grid ---------- */
function render() {
  $('#shop').textContent = S.shopName;
  $('#b-switch').textContent = '⇄ ' + t('switchTable'); $('#b-bills').textContent = t('bills'); $('#b-sum').textContent = t('summary'); $('#b-lang').textContent = t('lang');
  const busy = S.tables.filter(x => SESS[x.id]).length;
  const chips = [['all', t('all') + ' ' + S.tables.length], ...S.tableTypes.filter(ty => S.tables.some(x => x.type === ty.id)).map(ty => [ty.id, typeName(S, ty.id)]), ['busy', t('inUse') + ' ' + busy], ['free', t('freeTab') + ' ' + (S.tables.length - busy)]];
  $('#chips').innerHTML = chips.map(([f, l]) => `<button class="chip ${FILTER === f ? 'sel' : ''}" data-f="${f}">${esc(l)}</button>`).join('');
  let h = '';
  { // Counter sale: drinks / snacks for people who are not playing — always visible at the top of the floor
    const cs = SESS._counter; const n = cs ? (cs.items || []).reduce((a, i) => a + i.qty, 0) : 0;
    h += `<div class="grid"><button class="tcard counter ${cs ? 'busy' : ''}" data-tid="_counter"><div><div class="tname" style="font-size:22px">${esc(t('quickSale'))}</div></div>
      <div>${cs ? `<div class="tamt" data-amt="_counter"></div><div class="small">${n} ${esc(t('items'))}</div>` : ''}</div></button></div>`;
  }
  for (const ty of S.tableTypes) {
    if (!['all', 'busy', 'free'].includes(FILTER) && FILTER !== ty.id) continue;
    const list = S.tables.filter(x => x.type === ty.id && (FILTER === 'busy' ? SESS[x.id] : FILTER === 'free' ? !SESS[x.id] : true));
    if (!list.length) continue;
    h += `<div class="section-title">${esc(typeName(S, ty.id))} · ${money(ty.rate)}${esc(t('perHour'))}</div><div class="grid">${list.map(card).join('')}</div>`;
  }
  $('#tables').innerHTML = h || `<div class="empty">—</div>`;
  tick();
}
function card(tb) {
  const s = SESS[tb.id];
  const typeLbl = tb.type ? typeName(S, tb.type) : '';
  if (!s) return `<button class="tcard ${tb.type === 'carom' ? 'carom' : ''}" data-tid="${tb.id}"><div><div class="ttype">${esc(typeLbl)}</div><div class="tname">${esc(tb.name)}</div></div><div class="tfree">${esc(t('free'))}</div></button>`;
  const paused = sessPaused(s);
  const cls = ['tcard', tb.type === 'carom' ? 'carom' : '', paused ? 'paused' : 'busy'].join(' ');
  const n = (s.items || []).reduce((a, i) => a + i.qty, 0);
  const cur = curTimer(s); const nT = (s.timers || []).length;
  const sub = cur && (cur.type !== tb.type || cur.pct) ? timerLabel(S, cur) : '';
  const badges = [paused ? esc(t('paused')) : '', nT > 1 ? `⏱${nT}` : '', n ? `🥤${n}` : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-tid="${tb.id}">${badges ? `<span class="badge">${badges}</span>` : ''}
    <div><div class="ttype">${esc(typeLbl)}</div><div class="tname">${esc(tb.name)}</div>${sub ? `<div class="small" style="opacity:.85">${esc(sub)}</div>` : ''}${s.note ? `<div class="small" style="opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.note)}</div>` : ''}</div>
    <div>${nT ? `<div class="ttime" data-time="${tb.id}"></div>` : ''}<div class="tamt" data-amt="${tb.id}"></div></div></button>`;
}
function tick() {
  const now = Date.now();
  const d = dayKey(now, S.dayStartHour);
  if (d !== curDay) { curDay = d; if (unBills) unBills(); if (DB) unBills = DB.onRecentBills(now - 36 * 3600e3, b => { TODAY = b.filter(x => x.day === curDay); rerenderPanel('bills'); rerenderPanel('summary'); }); }
  for (const el of $$('[data-time]')) {
    const s = SESS[el.dataset.time]; if (!s) continue;
    const cur = curTimer(s); const ms = playedMs(s, now);
    let txt = clockStr(cur ? timerMs(cur, now) : 0);
    const c = el.closest('.tcard');
    el.textContent = txt;
  }
  for (const el of $$('[data-amt]')) { const s = SESS[el.dataset.amt]; if (s) el.textContent = money(computeBill(S, s, now).total); }
  if (PANEL && PANEL.kind === 'table' && SESS[PANEL.id]) {
    const s = SESS[PANEL.id]; const c = computeBill(S, s, now);
    for (const x of c.timers) {
      const a = $(`[data-tmt="${x.id}"]`); if (a) a.textContent = clockStr(x.playedMin * M);
      const b = $(`[data-tma="${x.id}"]`); if (b) b.textContent = money(x.amount);
    }
    const cu = curTimer(s); const ck = $('#pt-clock'); if (ck && cu) ck.textContent = clockStr(timerMs(cu, now));
    const e = $('#pt-total'); if (e) e.textContent = money(c.total);
    const f = $('#pt-co'); if (f) f.textContent = money(c.total);
  }
}

/* ---------- Table screen ---------- */
const CART = {}; // items tapped but not yet added to the table (protects against mis-taps)
function openTable(id) { PANEL = { kind: 'table', id }; renderTablePanel(); }
function rerenderPanel(kind) {
  if (!PANEL || (kind && PANEL.kind !== kind)) return;
  if (PANEL.kind === 'table') renderTablePanel();
  else if (PANEL.kind === 'bills') openBills();
  else if (PANEL.kind === 'summary') openSummary();
}
function panelOpts(extra) { return Object.assign({ onClose: () => { PANEL = null; }, key: PANEL ? PANEL.kind + ':' + (PANEL.id || '') : '' }, extra || {}); }
const ppTypes = id => { const tb = tableOf(S, id); return S.tableTypes.filter(x => x.perPerson && (!x.forType || !tb || x.forType === tb.type)); };
function onePlayer(id, ty, timers) { const n = (timers || []).filter(x => x.type === ty.id).length + 1; return Object.assign(startTimerFor(id, ty.id, 0), { note: `${t('player')} ${n}` }); }
function addPlayer(id, tyId) {
  const s = SESS[id]; if (!s) return; const ty = typeOf(S, tyId || ((s.timers || []).find(x => typeOf(S, x.type).perPerson) || {}).type || ppTypes(id)[0].id);
  saveSess(id, Object.assign({}, s, { timers: (s.timers || []).concat([onePlayer(id, ty, s.timers)]) }));
  toast('＋ ' + t('player')); renderTablePanel();
}
function startPanel(id) {
  const tb = tableOf(S, id); if (!tb) return closePanel(true);
  const title = tableLabel(S, id);
  const own = startTimerFor(id, tb.type, 0);
  const others = S.tableTypes.filter(x => x.id !== tb.type && !x.perPerson);
  const pp = ppTypes(id);
  openPanel(`<div class="panel-h"><h2>${esc(title)}</h2><button class="xbtn" data-close>✕</button></div>
    <div class="panel-b"><p class="muted" style="text-align:center;font-size:18px;margin-top:0">${esc(t('free'))}</p>
    <button class="primary big" style="width:100%;min-height:100px;font-size:26px" data-st="${tb.type}" data-pct="0">▶ ${esc(typeName(S, tb.type))} · ${money(own.rate)}${esc(t('perHour'))}</button>
    <button class="big" style="width:100%;margin-top:10px;min-height:70px" data-st="${tb.type}" data-pct="50">▶ ${esc(typeName(S, tb.type))} · ${esc(t('practice'))} ½ · ${money(own.rate / 2)}${esc(t('perHour'))}</button>
    ${pp.map(x => `<button class="big" style="width:100%;margin-top:10px;min-height:70px;" data-pp="${x.id}">▶ ${esc(typeName(S, x.id))} · ${money(x.rate)}${esc(t('perPerson'))}</button>`).join('')}
</div>`, panelOpts());
  $$('[data-st]').forEach(b => b.onclick = () => {
    const tm = startTimerFor(id, b.dataset.st, +b.dataset.pct);
    saveSess(id, { tableId: id, openedAt: tm.startAt, timers: [tm], items: [], note: '' });
    toast(`▶ ${title} ${timeOf(tm.startAt)}`);
    renderTablePanel(); // stay on the table so drinks/snacks can be added right away
  });
  $$('[data-pp]').forEach(b => b.onclick = async () => {
    const ty = typeOf(S, b.dataset.pp);
    const timers = [onePlayer(id, ty, [])];
    saveSess(id, { tableId: id, openedAt: timers[0].startAt, timers, items: [], note: '' });
    toast(`▶ ${title} · ${typeName(S, ty.id)}`);
    renderTablePanel();
  });
}
function cartCount(id) { return (CART[id] || []).reduce((a, x) => a + x.qty, 0); }
function commitCart(id) {
  const cart = CART[id] || []; if (!cart.length) return;
  const cur = SESS[id] || { tableId: id, timers: [], items: [], note: '' };
  const items = clone(cur.items || []);
  for (const x of cart) { const ex = !x.note && items.find(i => i.id === x.id && i.price === x.price && !i.pct && !i.note); if (ex) ex.qty += x.qty; else items.push(Object.assign({ id: x.id, name: x.name, price: x.price, basePrice: x.price, qty: x.qty }, x.note ? { note: x.note } : {})); }
  delete CART[id];
  saveSess(id, Object.assign({}, cur, { items }));
  toast('✓ ' + cart.map(x => x.qty + '× ' + x.name).join(', '));
}
function askCart(id) {
  return modal(`<p style="font-size:17px;margin-top:0">${esc(t('keepOrDiscard'))}</p><p class="muted">${(CART[id] || []).map(x => esc(x.qty + '× ' + x.name)).join(', ')}</p>
    <div class="row"><button class="grow danger" data-a="d">${esc(t('discard'))}</button><button class="grow primary" data-a="a">${esc(t('addToTable'))}</button></div>`,
    (bg, close) => { $('[data-a=d]', bg).onclick = () => close('d'); $('[data-a=a]', bg).onclick = () => close('a'); });
}
function renderTablePanel() {
  const id = PANEL.id; const isCounter = id === '_counter';
  const s = SESS[id];
  if (!s && !isCounter) return startPanel(id);
  const ss = s || { tableId: '_counter', timers: [], items: [], note: '' };
  const now = Date.now(); const c = computeBill(S, ss, now);
  const title = tableLabel(S, id);
  const timers = ss.timers || [];
  const paused = sessPaused(ss); const hasOpen = timers.some(isOpenTimer); const cur = curTimer(ss);
  const status = timers.length ? `<div class="status tap ${paused ? 'paused' : hasOpen ? '' : 'none'}" id="a-status" style="position:relative"><span style="position:absolute;top:12px;right:14px;opacity:.7">✎</span>
      <div class="lbl">${timers.filter(isOpenTimer).length > 1 ? timers.filter(isOpenTimer).length + ' ' + esc(t('timersRunning')) : cur ? esc(timerLabel(S, cur)) + ' · ' + money(effRate(cur)) + esc(t('perHour')) : ''}${paused ? ' · <b>' + esc(t('resumeHint')) + '</b>' : ''}</div>
      <div class="clock" id="pt-clock">${clockStr(cur ? timerMs(cur, now) : 0)}</div>
      <div class="row"><span class="lbl grow">${esc(t('total'))}</span><b style="font-size:22px" id="pt-total">${money(c.total)}</b></div></div>`
    : `<div class="status none"><div class="row"><span class="grow">${esc(t('total'))}</span><b style="font-size:24px" id="pt-total">${money(c.total)}</b></div></div>`;
  const tl = timers.map(tm => {
    const x = c.timers.find(y => y.id === tm.id);
    const st = tm.stopAt ? t('stopped') : tm.pausedAt ? t('paused') : t('running');
    return `<div class="bl timer ${tm.stopAt ? 's' : tm.pausedAt ? 'p' : ''}" data-tm="${tm.id}"><div class="ic">${tm.stopAt ? '■' : tm.pausedAt ? '⏸' : '⏱'}</div>
      <div class="grow"><div><b>${esc(timerLabel(S, tm))}</b> <span class="small muted">${money(x.effRate)}${esc(t('perHour'))}</span></div>
      <div class="small muted">${esc(st)} · ${timeOf(tm.startAt)}${tm.stopAt ? '–' + timeOf(tm.stopAt) : ''}</div>${tm.note && !typeOf(S, tm.type).perPerson ? `<div class="nt">✎ ${esc(tm.note)}</div>` : ''}</div>
      <div class="right"><div class="num" style="font-weight:700" data-tmt="${tm.id}">${clockStr(x.playedMin * M)}</div><div class="num small" data-tma="${tm.id}">${money(x.amount)}</div></div></div>`;
  }).join('');
  const il = (ss.items || []).map((i, ix) => `<div class="bl" data-ie="${ix}"><div class="ic">${S.items.find(y => y.id === i.id && y.cat === 'snacks') ? '🍿' : '🥤'}</div>
      <div class="grow"><div><b>${i.qty} ×</b> ${esc(i.name)}${i.pct ? ` <span class="small muted">−${i.pct}%</span>` : ''}</div>${i.note ? `<div class="nt">✎ ${esc(i.note)}</div>` : ''}</div>
      <div class="num" style="font-weight:600">${money(toD(itemLineC(i)))}</div><span class="muted" style="opacity:.5">✎</span></div>`).join('');
  const cart = CART[id] || [];
  const secs = S.categories.map((cat, ci) => { const its = S.items.filter(i => i.cat === cat.id && i.active !== false); if (!its.length) return '';
    return `<div class="isec"><h4>${esc(catName(S, cat.id))}</h4><div class="ibig">${its.map(i => `<button class="${ci % 2 ? 'n' : 'd'}" data-add="${i.id}">${money(i.price).replace('.00', '')}<span class="s">${esc(i.name.replace(/\s*\$\d+(\.\d+)?$/, '') || i.name)}</span></button>`).join('')}</div></div>`; }).join('');
  openPanel(`<div class="panel-h"><h2>${esc(title)}${ss.note ? ` <span class="small muted">· ${esc(ss.note)}</span>` : ''}</h2><button id="a-more" style="min-height:40px">⋯ ${esc(t('more'))}</button><button class="xbtn" data-close>✕</button></div>
   <div class="panel-b"><div class="tscreen">
     <div class="a-st">${status}</div>
     <div class="a-it">${secs}<div class="row" style="margin-bottom:12px"><button id="a-other" class="grow" style="min-height:52px">＋ ${esc(t('other'))}</button></div>
       ${cart.length ? `<div class="cart"><div class="small" style="font-weight:700;color:#8a5a00;margin-bottom:4px">${esc(t('pending'))}</div>
         ${cart.map((x, k) => `<div class="cr"><span class="grow" style="font-weight:600">${esc(x.name)}${x.note ? `<br><span class="nt" style="font-weight:400">✎ ${esc(x.note)}</span>` : ''}</span><button data-cn="${k}" style="min-height:40px;padding:0 10px">✎</button><div class="qty"><button data-cq="${k}" data-d="-1">−</button><span>${x.qty}</span><button data-cq="${k}" data-d="1">+</button></div><span class="num" style="width:62px;text-align:right">${money(x.price * x.qty)}</span><button data-cx="${k}" class="danger" style="width:44px;padding:0">✕</button></div>`).join('')}
         <div class="row" style="margin-top:8px"><button class="ghost" id="cart-clear">${esc(t('clear'))}</button><button class="primary grow big" id="cart-add">✓ ${esc(t('addToTable'))} (${cartCount(id)})</button></div></div>` : ''}
       ${isCounter ? '' : `<div class="isec"><h4>${esc(t('timers'))}</h4><button id="a-timer" class="addtimer">＋ ${esc(t('addTimer'))}</button></div>`}
     </div>
     <div class="a-bl"><div class="billl">${tl}${timers.some(x => typeOf(S, x.type).perPerson && !x.stopAt) ? `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><button id="a-player" style="width:100%;min-height:52px;;font-size:17px">＋ ${esc(t('player'))}</button></div>` : ''}${il}${tl || il ? '' : `<div class="muted" style="padding:14px 0">${esc(t('noItems'))}</div>`}</div></div>
   </div></div>
   <div class="panel-f"><div class="bar">
     ${hasOpen ? `<button id="a-pause" class="${paused ? 'primary' : 'warn'}">${paused ? '▶ ' + esc(t('resumeAll')) : '❚❚ ' + esc(t('pauseAll'))}</button>` : ''}
     ${isCounter ? '' : `<button id="a-move">⇄ ${esc(t('switchTable'))}</button>`}
     <button class="primary co" id="a-checkout" ${!s && !cart.length ? 'disabled' : ''}>${esc(t('checkout'))} <span id="pt-co">${money(c.total)}</span></button></div></div>`,
    panelOpts({ wide: true, beforeClose: () => { if (!cartCount(id)) return true; askCart(id).then(v => { if (v === 'a') commitCart(id); if (v) { delete CART[id]; closePanel(true); } }); return false; } }));

  const cur2 = () => SESS[id] || { tableId: id, timers: [], items: [], note: '' };
  const save = patch => saveSess(id, Object.assign({}, cur2(), patch));
  $$('[data-add]').forEach(b => b.onclick = () => {
    const it = S.items.find(x => x.id === b.dataset.add); if (!it) return;
    const cart = CART[id] = CART[id] || []; const ex = cart.find(x => x.id === it.id && !x.note);
    if (ex) ex.qty++; else cart.push({ id: it.id, name: it.name, price: +it.price, qty: 1 });
    renderTablePanel();
  });
  $$('[data-cq]').forEach(b => b.onclick = () => { const x = CART[id][+b.dataset.cq]; x.qty += +b.dataset.d; if (x.qty <= 0) CART[id].splice(+b.dataset.cq, 1); renderTablePanel(); });
  $$('[data-cn]').forEach(b => b.onclick = async () => { const x = CART[id][+b.dataset.cn]; const v = await promptBox(t('lineNote'), x.note || ''); if (v != null) { x.note = v.trim(); renderTablePanel(); } });
  $$('[data-cx]').forEach(b => b.onclick = () => { CART[id].splice(+b.dataset.cx, 1); renderTablePanel(); });
  const cc = $('#cart-clear'); if (cc) cc.onclick = () => { delete CART[id]; renderTablePanel(); };
  const ca = $('#cart-add'); if (ca) ca.onclick = () => { commitCart(id); renderTablePanel(); };
  $('#a-other').onclick = async () => {
    const r = await modal(`<h3>${esc(t('other'))}</h3><label style="margin-top:0">${esc(t('itemName'))}</label><input id="oth-n" value="${esc(t('other').replace(' $', ''))}"><label>${esc(t('otherAmount'))}</label><input id="oth-a" type="number" inputmode="decimal" step="any"><div class="row" style="margin-top:14px"><button class="grow ghost" data-a="n">${esc(t('cancel'))}</button><button class="grow primary" data-a="y">${esc(t('ok'))}</button></div>`,
      (bg, close) => { setTimeout(() => $('#oth-a', bg).focus(), 50); $('[data-a=n]', bg).onclick = () => close(null); $('[data-a=y]', bg).onclick = () => close({ n: $('#oth-n', bg).value.trim(), a: +$('#oth-a', bg).value }); });
    if (!r || !(r.a > 0)) return;
    (CART[id] = CART[id] || []).push({ id: 'misc-' + uid(4), name: r.n || t('other').replace(' $', ''), price: Math.round(r.a * 100) / 100, qty: 1 });
    renderTablePanel();
  };
  $$('[data-ie]').forEach(el => el.onclick = () => editItem(id, +el.dataset.ie));
  const ap = $('#a-player'); if (ap) ap.onclick = () => addPlayer(id);
  $$('[data-tm]').forEach(r => r.onclick = () => editTimer(id, r.dataset.tm));
  const stc = $('#a-status'); if (stc && cur) stc.onclick = () => editTimer(id, cur.id);
  $('#a-checkout').onclick = () => { commitCart(id); openCheckout(id); };
  $('#a-more').onclick = async () => {
    const v = await modal(`<h3>${esc(title)}</h3><label style="margin-top:0">${esc(t('tableNote'))}</label><input id="mn" value="${esc(ss.note || '')}" placeholder="—">
      <div class="row" style="margin-top:12px"><button class="grow ghost" data-a="n">${esc(t('cancel'))}</button><button class="grow primary" data-a="y">${esc(t('save'))}</button></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><button class="danger" style="width:100%" data-a="c">✕ ${esc(t('cancelTable'))}</button>`,
      (bg, close) => { $('[data-a=n]', bg).onclick = () => close(null); $('[data-a=y]', bg).onclick = () => close({ note: $('#mn', bg).value }); $('[data-a=c]', bg).onclick = () => close({ cancel: true }); });
    if (!v) return;
    if (v.note != null && s) save({ note: v.note });
    if (v.cancel) {
      if (isCounter && !s) { delete CART[id]; return closePanel(true); }
      if (!await confirmBox(t('confirmCancelTable'), t('cancelTable'), true)) return;
      const at = Date.now(); const cb = computeBill(S, ss, at);
      const bill = makeBill(id, ss, at, cb, {}, '');
      bill.status = 'cancelled'; bill.cancelledTotal = bill.total; bill.total = 0;
      delete CART[id];
      DB.checkout(bill, id).then(() => { closePanel(true); toast('✕ ' + title); }).catch(fail);
    }
  };
  if (isCounter) return;
  const pb = $('#a-pause'); if (pb) pb.onclick = () => { const n = Date.now(); const p = sessPaused(cur2()); save({ timers: cur2().timers.map(x => p ? resumeTimer(x, n) : pauseTimer(x, n)) }); };
  $('#a-timer').onclick = () => addTimerFlow(id);
  $('#a-move').onclick = () => switchFlow(id);
}

/* ---------- Timer & item editing ---------- */
function editTimer(id, tid) {
  const s = SESS[id]; if (!s) return; const tm0 = s.timers.find(x => x.id === tid); if (!tm0) return;
  const st = { type: tm0.type, rate: tm0.rate, pct: tm0.pct || 0 };
  modal(`<h3>⏱ ${esc(timerLabel(S, tm0))}</h3>
    ${tm0.stopAt ? '' : `<div class="row" style="margin-bottom:6px"><button class="grow big ${tm0.pausedAt ? 'primary' : 'warn'}" data-ac="pause">${tm0.pausedAt ? '▶ ' + esc(t('resume')) : '❚❚ ' + esc(t('pause'))}</button></div>`}
    <label>${esc(typeOf(S, tm0.type).perPerson ? t('playerName') : t('lineNote'))}</label><input id="te-note" value="${esc(tm0.note || '')}" placeholder="—" ${typeOf(S, tm0.type).perPerson ? 'style="font-size:20px"' : ''}>
    <label>${esc(t('ratePerHr'))}</label><div class="row"><div class="seg grow" id="te-type">${S.tableTypes.map(x => `<button data-ty="${x.id}" class="${x.id === st.type ? 'sel' : ''}">${esc(typeName(S, x.id))}</button>`).join('')}</div><input id="te-rate" type="number" inputmode="decimal" step="any" value="${st.rate}" style="width:90px"></div>
    <label>${esc(t('pctOff'))}</label><div class="row wrap">${[0, 50, 100].map(p => `<button class="chip" data-tpc="${p}">${p === 50 ? '50% ' + esc(t('practice')) : p === 100 ? esc(t('free100')) : '0%'}</button>`).join('')}<input id="te-pct" type="number" inputmode="decimal" style="width:80px" value="${st.pct}"></div>
    <div id="te-eff" style="font-size:18px;font-weight:700;margin:10px 0;color:var(--text)"></div>
    <div class="tedit2">
      <div><label>${esc(t('startTime'))}</label>${timePickerHTML('s')}<div class="row" style="margin-top:6px"><button data-sh="s|-5" class="grow">−5m</button><button data-sh="s|5" class="grow">+5m</button></div></div>
      <div><label class="row" style="justify-content:space-between;margin-bottom:4px"><span>${esc(t('endTime'))}</span><span class="row" style="gap:6px;color:var(--text)"><input type="checkbox" id="te-run" ${tm0.stopAt ? '' : 'checked'} style="width:22px;min-height:22px"> ${esc(t('stillRunning'))}</span></label>
        <div id="te-endw">${timePickerHTML('e')}<div class="row" style="margin-top:6px"><button data-sh="e|-5" class="grow">−5m</button><button data-sh="e|5" class="grow">+5m</button></div></div></div>
    </div>
    <div class="small" id="te-played" style="text-align:center;margin-top:8px;font-weight:600"></div>
    <div class="row" style="margin-top:14px"><button class="danger" data-ac="del">✕</button><button class="grow ghost" data-ac="cancel">${esc(t('cancel'))}</button><button class="grow primary" data-ac="save">${esc(t('save'))}</button></div>`,
    (bg, close) => {
      const eff = () => { $('#te-eff', bg).textContent = '= ' + money((+st.rate || 0) * (1 - (+st.pct || 0) / 100)) + t('perHour'); $$('[data-tpc]', bg).forEach(b => b.classList.toggle('sel', +b.dataset.tpc === +st.pct)); };
      $$('[data-ty]', bg).forEach(b => b.onclick = () => { st.type = b.dataset.ty; st.rate = +typeOf(S, st.type).rate; $('#te-rate', bg).value = st.rate; $$('[data-ty]', bg).forEach(x => x.classList.toggle('sel', x === b)); eff(); });
      $('#te-rate', bg).oninput = e => { st.rate = +e.target.value || 0; eff(); };
      $('#te-pct', bg).oninput = e => { st.pct = Math.min(100, Math.max(0, +e.target.value || 0)); eff(); };
      $$('[data-tpc]', bg).forEach(b => b.onclick = () => { st.pct = +b.dataset.tpc; $('#te-pct', bg).value = st.pct; eff(); });
      eff();
      bg.firstChild.style.width = 'min(760px,100%)';
      const n0 = Date.now();
      const runEl = $('#te-run', bg);
      const endTs = () => atTime(tpE.get(), n0);
      const startTs = () => atTime(tpS.get(), runEl.checked ? (tm0.pausedAt || n0) : endTs());
      const played = () => {
        $('#te-endw', bg).style.opacity = runEl.checked ? .35 : 1; $('#te-endw', bg).style.pointerEvents = runEl.checked ? 'none' : '';
        const st0 = startTs(); const en = runEl.checked ? (tm0.pausedAt || n0) : endTs();
        const pz = (tm0.pausedMs || 0) + (!runEl.checked && tm0.pausedAt && en > tm0.pausedAt ? 0 : 0);
        const ms = en - st0 - pz; const el = $('#te-played', bg);
        el.textContent = ms < 0 ? t('endBeforeStart') : t('played') + ': ' + hm(ms / M); el.style.color = ms < 0 ? 'var(--red)' : '';
      };
      const tpS = timePicker(bg, 's', tm0.startAt, played);
      const tpE = timePicker(bg, 'e', tm0.stopAt || n0, played);
      runEl.onchange = played;
      $$('[data-sh]', bg).forEach(b => b.onclick = () => { const [w, d] = b.dataset.sh.split('|'); if (w === 's') tpS.set(startTs() + (+d) * M); else tpE.set(endTs() + (+d) * M); played(); });
      setTimeout(played, 60);
      if (typeOf(S, tm0.type).perPerson) setTimeout(() => { const i = $('#te-note', bg); i.focus(); i.select(); }, 60);
      const apply = fn => { const s2 = SESS[id]; if (!s2) return close(); saveSess(id, Object.assign({}, s2, { timers: fn(s2.timers) })); close(true); };
      $$('[data-ac]', bg).forEach(b => b.onclick = async () => {
        const n = Date.now(); const a = b.dataset.ac;
        if (a === 'cancel') return close(null);
        if (a === 'pause') return apply(ts => ts.map(x => x.id === tid ? (x.pausedAt ? resumeTimer(x, n) : pauseTimer(x, n)) : x));
        if (a === 'stop') return apply(ts => ts.map(x => x.id === tid ? stopTimer(x, n) : x));
        if (a === 'del') { close(null); if (await confirmBox(t('delTimer') + '?', t('remove'), true)) { const s2 = SESS[id]; saveSess(id, Object.assign({}, s2, { timers: s2.timers.filter(x => x.id !== tid) })); } return; }
        const newStart = startTs(); const running = runEl.checked; const newEnd = running ? null : endTs(); const note = $('#te-note', bg).value.trim();
        if (!running && newEnd <= newStart) return toast(t('endBeforeStart'));
        apply(ts => ts.map(x => {
          if (x.id !== tid) return x;
          const y = Object.assign({}, x, { type: st.type, rate: +st.rate || 0, pct: +st.pct || 0, note });
          if (st.type !== x.type) y.baseRate = +typeOf(S, st.type).rate;
          if (hhmm(newStart) !== hhmm(x.startAt)) y.startAt = newStart;
          if (running) { if (x.stopAt) y.stopAt = null; } // reopen a timer stopped by mistake
          else if (!x.stopAt || hhmm(newEnd) !== hhmm(x.stopAt)) {
            if (x.pausedAt) { if (newEnd > x.pausedAt) y.pausedMs = (x.pausedMs || 0) + (newEnd - x.pausedAt); y.pausedAt = null; }
            y.stopAt = newEnd;
          }
          return y;
        }));
      });
    });
}
function editItem(id, ix) {
  const s = SESS[id]; if (!s) return; const it = s.items[ix]; if (!it) return;
  const st = { price: it.price, pct: it.pct || 0, qty: it.qty };
  modal(`<h3>${esc(it.name)}</h3>
    <div class="row" style="justify-content:center;gap:16px"><button class="big" style="width:70px" data-iq="-1">−</button><span id="ie-q" style="font-size:34px;font-weight:800;min-width:50px;text-align:center">${st.qty}</span><button class="big" style="width:70px" data-iq="1">+</button></div>
    <label>${esc(t('lineNote'))}</label><input id="ie-n" value="${esc(it.note || '')}" placeholder="—">
    ${it.qty > 1 ? `<div id="ie-nf" class="row hidden" style="margin-top:8px"><span class="small grow">${esc(t('noteFor'))}</span><div class="qty"><button data-nf="-1">−</button><span id="ie-nfv">1</span><button data-nf="1">+</button></div></div>` : ''}
    <label>${esc(t('unitPrice'))} ($)</label><input id="ie-p" type="number" inputmode="decimal" step="any" value="${st.price}">
    <label>${esc(t('pctOff'))}</label><div class="row wrap">${[0, 50, 100].map(p => `<button class="chip" data-ipc="${p}">${p === 100 ? esc(t('free100')) : p + '%'}</button>`).join('')}</div>
    <div id="ie-tot" style="font-size:20px;font-weight:700;margin:12px 0;color:var(--text)"></div>
    <div class="row"><button class="danger" data-ac="del">✕ ${esc(t('remove'))}</button><button class="grow ghost" data-ac="cancel">${esc(t('cancel'))}</button><button class="grow primary" data-ac="save">${esc(t('save'))}</button></div>`,
    (bg, close) => {
      const paint = () => { $('#ie-q', bg).textContent = st.qty; $('#ie-tot', bg).textContent = '= ' + money(toD(itemLineC(st))); $$('[data-ipc]', bg).forEach(b => b.classList.toggle('sel', +b.dataset.ipc === st.pct)); };
      $('#ie-p', bg).oninput = e => { st.price = Math.max(0, +e.target.value || 0); paint(); };
      $$('[data-ipc]', bg).forEach(b => b.onclick = () => { st.pct = +b.dataset.ipc; paint(); });
      $$('[data-iq]', bg).forEach(b => b.onclick = () => { st.qty = Math.max(1, st.qty + +b.dataset.iq); paint(); });
      let nf = 1; const nfr = $('#ie-nf', bg);
      if (nfr) { $('#ie-n', bg).addEventListener('input', () => nfr.classList.toggle('hidden', $('#ie-n', bg).value.trim() === (it.note || ''))); $$('[data-nf]', bg).forEach(b => b.onclick = () => { nf = Math.min(st.qty, Math.max(1, nf + +b.dataset.nf)); $('#ie-nfv', bg).textContent = nf; }); }
      paint();
      $$('[data-ac]', bg).forEach(b => b.onclick = () => {
        const s2 = SESS[id]; if (!s2) return close(); const items = clone(s2.items);
        if (b.dataset.ac === 'del') items.splice(ix, 1);
        else if (b.dataset.ac === 'save') {
          const note = $('#ie-n', bg).value.trim();
          const upd = { price: Math.round(st.price * 100) / 100, pct: st.pct, basePrice: items[ix].basePrice ?? items[ix].price };
          if (nfr && note !== (it.note || '') && nf < st.qty) { // split: only some of these get the new note
            Object.assign(items[ix], upd, { qty: st.qty - nf });
            items.splice(ix + 1, 0, Object.assign({}, items[ix], { qty: nf, note }));
          } else Object.assign(items[ix], upd, { qty: st.qty, note });
        }
        else return close();
        saveSess(id, Object.assign({}, s2, { items })); close(true);
      });
    });
}
async function addTimerFlow(id) {
  const btns = [];
  const tb = tableOf(S, id); // only timers that fit this table: pool tables → pool, 3 Balls tables → 3 Balls / 4 Balls
  for (const x of S.tableTypes.filter(y => !y.perPerson && (!tb || y.id === tb.type))) { btns.push([x.id + '|0', `${esc(typeName(S, x.id))}<br><span class="small">${money(x.rate)}${esc(t('perHour'))}</span>`, 'primary']); btns.push([x.id + '|50', `${esc(typeName(S, x.id))} ${esc(t('practice'))} ½<br><span class="small">${money(x.rate / 2)}${esc(t('perHour'))}</span>`, '']); }
  let stopCur = true; const hasOpen = (SESS[id].timers || []).some(isOpenTimer);
  const v = await modal(`<h3>＋ ${esc(t('addTimer'))}</h3>${hasOpen ? `<label class="row" style="gap:10px;color:var(--text);font-size:17px;margin:0 0 12px"><input type="checkbox" id="at-stop" checked style="width:26px;min-height:26px"> ${esc(t('stopCurrent'))}</label>` : ''}
    <div class="btns" style="grid-template-columns:1fr 1fr">${btns.map(([v, l, c]) => `<button data-v="${v}" class="${c}" style="min-height:70px">${l}</button>`).join('')}${ppTypes(id).map(x => `<button data-v="pp|${x.id}" style="min-height:70px;grid-column:1/-1;">${esc(typeName(S, x.id))} · ${money(x.rate)}${esc(t('perPerson'))}<br><span class="small">＋ 1 ${esc(t('player'))}</span></button>`).join('')}</div><button class="ghost" style="width:100%;margin-top:12px" data-a="n">${esc(t('cancel'))}</button>`,
    (bg, close) => { $$('[data-v]', bg).forEach(b => b.onclick = () => { const cb = $('#at-stop', bg); stopCur = cb ? cb.checked : false; close(b.dataset.v); }); $('[data-a=n]', bg).onclick = () => close(null); });
  if (!v) return;
  if (v.startsWith('pp|')) { // 4 balls: one more player; other 4-ball players keep running
    if (stopCur) { const n2 = Date.now(); const s2 = SESS[id]; SESS[id] = Object.assign({}, s2, { timers: s2.timers.map(x => typeOf(S, x.type).perPerson ? x : stopTimer(x, n2)) }); }
    return addPlayer(id, v.slice(3));
  }
  const [type, pct] = v.split('|'); const n = Date.now(); const s = SESS[id];
  const timers = (stopCur ? s.timers.map(x => stopTimer(x, n)) : s.timers.slice()).concat([startTimerFor(id, type, +pct)]);
  saveSess(id, Object.assign({}, s, { timers }));
  renderTablePanel();
}

/* ---------- Switch / merge tables (timers move as they are) ---------- */
const mergeItems = (a, b) => { const out = clone(a || []); for (const i of b || []) { const ex = out.find(x => x.id === i.id && x.price === i.price && (x.pct || 0) === (i.pct || 0) && !x.note && !i.note); if (ex) ex.qty += i.qty; else out.push(clone(i)); } return out; };
async function switchFlow(from) {
  if (!from) {
    const busy = S.tables.filter(x => SESS[x.id]);
    if (!busy.length) return toast(t('notNow'));
    from = await choice(t('pickSource'), busy.map(x => [x.id, `${esc(tableLabel(S, x.id))}<br><span class="small">${esc(SESS[x.id].note || '')}</span>`, 'primary']));
    if (!from) return;
  }
  if (cartCount(from)) commitCart(from);
  const to = await choice(`${tableLabel(S, from)} → ${t('pickDest')}`, S.tables.filter(x => x.id !== from).map(x => SESS[x.id] ? [x.id, `${esc(tableLabel(S, x.id))}<br><span class="small">${esc(t('mergeInto'))}</span>`, 'warn'] : [x.id, esc(tableLabel(S, x.id)), '']));
  if (!to) return;
  if (SESS[to] && !await confirmBox(t('confirmMerge'), t('ok'))) return;
  const a = SESS[from]; const now = Date.now(); const hist = { id: from, at: now };
  let moved = Object.assign({}, a, { tableId: to, movedFrom: (a.movedFrom || []).concat([hist]) });
  if (SESS[to]) { const b = SESS[to]; moved = Object.assign({}, b, { timers: (b.timers || []).concat(a.timers || []), items: mergeItems(b.items, a.items), note: [b.note, a.note].filter(Boolean).join(' + '), movedFrom: (b.movedFrom || []).concat([hist]) }); }
  delete SESS[from]; SESS[to] = moved;
  PANEL = { kind: 'table', id: to };
  DB.moveSession(from, to, moved).then(() => toast(`${tableLabel(S, from)} → ${tableLabel(S, to)}`)).catch(fail);
  render(); renderTablePanel();
}

/* ---------- Checkout ---------- */
function makeBill(id, ss, at, c, pay, note) {
  const paidAt = Date.now(); const tb = tableOf(S, id);
  const first = (ss.timers || [])[0];
  return Object.assign({
    id: uid(14), no: dayKey(paidAt, S.dayStartHour).slice(5).replace('-', '') + '-' + uid(4).toUpperCase(),
    tableId: id, tableLabel: tableLabel(S, id), tableType: tb ? tb.type : '', startAt: (first && first.startAt) || ss.openedAt || paidAt, endAt: at, paidAt,
    day: dayKey(paidAt, S.dayStartHour), status: 'paid', note: note || ss.note || '', movedFrom: ss.movedFrom || null
  }, c, pay);
}
const MICON = { cash: '💵', card: '💳', zelle: '⚡' };
function openCheckout(id) {
  const ss = SESS[id]; if (!ss) return;
  const at = Date.now(); // the bill is frozen at the moment checkout opens
  const st = { discType: 'pct', discVal: '', override: null, method: '', split: { cash: '', card: '', zelle: '' } };
  PANEL = { kind: 'checkout', id };
  const title = tableLabel(S, id);
  openPanel(`<div class="panel-h"><button class="xbtn" id="bk">‹</button><h2>${esc(t('checkout'))} · ${esc(title)}</h2></div>
   <div class="panel-b">
    <div class="box" id="co-lines"></div>
    <div class="row wrap"><span class="muted small">${esc(t('discount'))}</span>${[10, 20, 50].map(p => `<button class="chip" data-qp="${p}">${p}%</button>`).join('')}<button class="chip" id="co-disc">$ / %…</button><button class="chip" data-qp="0">✕</button><button class="chip" id="co-ovr">✎ ${esc(t('changeTotal'))}</button></div>
    <div class="box" style="text-align:center"><div id="co-total" style="font-size:48px;font-weight:800" class="num"></div><div id="co-ovr-note" class="small" style="color:#8a5a00"></div></div>
    <div class="muted small" style="margin:4px 0 8px">${esc(t('pickMethod'))}</div>
    <div class="paybtns">${['cash', 'card', 'zelle'].map(m => `<button data-m="${m}">${esc(t(m))}</button>`).join('')}</div>
    <div style="text-align:center;margin-top:10px"><button class="ghost" data-m="split" style="min-height:38px;font-size:14px">${esc(t('split'))}…</button></div>
    <div id="co-pay"></div>
   </div>
   <div class="panel-f"><button class="primary big" style="width:100%" id="co-ok" disabled></button></div>`, panelOpts());
  $('#bk').onclick = () => { PANEL = { kind: 'table', id }; renderTablePanel(); };
  const calc = () => computeBill(S, ss, at, st);
  const paint = () => {
    const c = calc(); let h = '';
    for (const x of c.timers) h += `<div class="line"><span>⏱ ${esc(timerLabel(S, x))} <span class="muted small">${hm(x.billedMin)} × ${money(x.effRate)}</span></span><span class="num">${money(x.amount)}</span></div>`;
    for (const i of c.items) h += `<div class="line"><span>${i.qty} × ${esc(i.name)}${i.pct ? ` −${i.pct}%` : ''}${i.note ? ` <span class="small" style="color:#8a5a00">(${esc(i.note)})</span>` : ''}</span><span class="num">${money(i.line)}</span></div>`;
    if (c.discount) h += `<div class="line"><span>${esc(t('discount'))}${c.discType === 'pct' ? ' ' + c.discVal + '%' : ''}</span><span class="num">-${money(c.discount)}</span></div>`;
    if (c.rounding) h += `<div class="line muted"><span>${esc(t('rounding'))}</span><span class="num">${c.rounding > 0 ? '+' : ''}${money(c.rounding)}</span></div>`;
    $('#co-lines').innerHTML = h;
    $('#co-total').textContent = money(c.total);
    $('#co-ovr-note').innerHTML = c.overridden ? `${esc(t('override'))} (${money(c.calcTotal)}) · <a href="#" id="co-reset" style="color:inherit">${esc(t('resetTotal'))}</a>` : '';
    const r = $('#co-reset'); if (r) r.onclick = e => { e.preventDefault(); st.override = null; paint(); };
    $$('[data-m]').forEach(b => b.classList.toggle('sel', b.dataset.m === st.method));
    const ok = $('#co-ok'); let valid = !!st.method;
    if (st.method === 'split') {
      const sum = ['cash', 'card', 'zelle'].reduce((a, m) => a + toC(st.split[m]), 0);
      const rem = toC(c.total) - sum; const re = $('#co-rem');
      if (re) { re.textContent = `${t('remaining')}: ${money(toD(rem))}`; re.style.color = rem === 0 ? 'var(--green)' : '#a15c00'; }
      valid = rem === 0;
    }
    ok.disabled = !valid;
    ok.style.background = { cash: 'var(--cash)', card: 'var(--card)', zelle: 'var(--zelle)' }[st.method] || '';
    ok.textContent = st.method ? `✓ ${t('paidBy')} ${st.method === 'split' ? t('split') : t(st.method).toUpperCase()} · ${money(c.total)}` : t('pickMethod');
  };
  const payUI = () => {
    const el = $('#co-pay');
    if (st.method === 'split') {
      el.innerHTML = `<div class="box">${['cash', 'card', 'zelle'].map(m => `<div class="row" style="margin-top:6px"><span style="width:90px;font-weight:600;color:var(--${m})">${esc(t(m))}</span><input data-sp="${m}" type="number" inputmode="decimal" step="any" value="${esc(st.split[m])}" placeholder="0.00"><button class="chip" data-fill="${m}">${esc(t('remaining'))}</button></div>`).join('')}<div id="co-rem" style="font-weight:700;margin-top:8px"></div></div>`;
      $$('[data-sp]', el).forEach(i => i.oninput = () => { st.split[i.dataset.sp] = i.value; paint(); });
      $$('[data-fill]', el).forEach(b => b.onclick = () => {
        const m = b.dataset.fill; const others = ['cash', 'card', 'zelle'].filter(x => x !== m).reduce((a, x) => a + toC(st.split[x]), 0);
        st.split[m] = String(Math.max(0, toD(toC(calc().total) - others))); $(`[data-sp=${m}]`).value = st.split[m]; paint();
      });
    } else el.innerHTML = '';
    paint();
  };
  $$('[data-qp]').forEach(b => b.onclick = () => { const p = +b.dataset.qp; st.discType = 'pct'; st.discVal = p ? String(p) : ''; paint(); });
  $('#co-disc').onclick = async () => {
    let type = 'amt';
    const v = await modal(`<h3>${esc(t('discount'))}</h3><div class="seg" style="margin-bottom:10px"><button data-dt="amt" class="sel">$</button><button data-dt="pct">%</button></div><input id="dv" type="number" inputmode="decimal" step="any"><div class="row" style="margin-top:14px"><button class="grow ghost" data-a="n">${esc(t('cancel'))}</button><button class="grow primary" data-a="y">${esc(t('ok'))}</button></div>`,
      (bg, close) => { $$('[data-dt]', bg).forEach(b => b.onclick = () => { type = b.dataset.dt; $$('[data-dt]', bg).forEach(x => x.classList.toggle('sel', x === b)); }); setTimeout(() => $('#dv', bg).focus(), 50); $('[data-a=n]', bg).onclick = () => close(null); $('[data-a=y]', bg).onclick = () => close($('#dv', bg).value); });
    if (v == null || v === '' || isNaN(+v)) return; st.discType = type; st.discVal = v; paint();
  };
  $('#co-ovr').onclick = async () => { const v = await promptBox(t('changeTotal'), calc().total.toFixed(2), 'number'); if (v != null && v !== '' && !isNaN(+v) && +v >= 0) { st.override = +v; paint(); } };
  $$('[data-m]').forEach(b => b.onclick = () => { st.method = b.dataset.m; payUI(); });
  payUI();
  $('#co-ok').onclick = () => {
    const c = calc(); const payments = {};
    if (st.method === 'split') { for (const m of ['cash', 'card', 'zelle']) if (toC(st.split[m])) payments[m] = toD(toC(st.split[m])); }
    else payments[st.method] = c.total;
    const bill = makeBill(id, ss, at, c, { payments, cashReceived: 0 }, ss.note);
    $('#co-ok').disabled = true;
    DB.checkout(bill, id).then(() => showReceipt(bill, true)).catch(e => { $('#co-ok').disabled = false; fail(e); });
  };
}
function showReceipt(b, fresh) {
  PANEL = { kind: 'receipt' };
  const m = methodOf(b);
  openPanel(`<div class="panel-h"><h2>${esc(b.tableLabel)}</h2><button class="xbtn" data-close>✕</button></div>
    <div class="panel-b">${fresh ? `<div class="box" style="text-align:center;padding:22px"><div style="font-size:54px">✓</div><div style="font-size:20px">${esc(t('paidBy'))} <b style="color:var(--${m === 'split' ? 'text' : m})">${esc(t(m))}</b></div><div style="font-size:44px;font-weight:800">${money(b.total)}</div></div>` : ''}
    <details><summary class="muted" style="cursor:pointer;padding:8px 0">${esc(t('bill2'))} #${esc(b.no)}</summary><div class="rcpt">${receiptHTML(S, b)}</div></details></div>
    <div class="panel-f row"><button class="grow" id="r-print">🖨 ${esc(t('print'))}</button><button class="grow primary big" data-close>${esc(t('done'))}</button></div>`, panelOpts());
  $('#r-print').onclick = () => printHTML(receiptHTML(S, b));
}

/* ---------- Today's bills ---------- */
function openBills() {
  PANEL = { kind: 'bills' };
  const list = TODAY.slice().sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0));
  openPanel(`<div class="panel-h"><h2>${esc(t('bills'))} · ${esc(t('today'))}</h2><button class="xbtn" data-close>✕</button></div>
   <div class="panel-b" style="padding:0 6px">${list.length ? `<table class="t"><thead><tr><th>${esc(t('time'))}</th><th>${esc(t('table'))}</th><th>${esc(t('method'))}</th><th class="right">${esc(t('amount'))}</th></tr></thead><tbody>
   ${list.map(b => `<tr class="click ${b.status !== 'paid' ? 'void' : ''}" data-b="${b.id}"><td>${timeOf(b.paidAt)}</td><td>${esc(b.tableLabel)}</td><td>${b.status === 'paid' ? `<span class="tag ${methodOf(b)}">${esc(t(methodOf(b)))}</span>` : `<span class="tag void">${esc(b.status === 'void' ? t('voided') : t('tableCancelled'))}</span>`}</td><td class="right num">${money(b.status === 'cancelled' ? b.cancelledTotal || 0 : b.total)}</td></tr>`).join('')}</tbody></table>` : `<div class="empty">${esc(t('noBills'))}</div>`}</div>`, panelOpts());
  $$('[data-b]').forEach(r => r.onclick = () => billDetail(TODAY.find(b => b.id === r.dataset.b)));
}
function billDetail(b) {
  if (!b) return;
  PANEL = { kind: 'bill' };
  openPanel(`<div class="panel-h"><button class="xbtn" id="bk">‹</button><h2>${esc(t('bill'))} #${esc(b.no)}</h2></div>
    <div class="panel-b"><div class="rcpt">${receiptHTML(S, b)}</div>${b.voidReason ? `<p class="muted">${esc(t('reason'))}: ${esc(b.voidReason)}</p>` : ''}</div>
    <div class="panel-f row wrap"><button class="grow" id="d-print">🖨 ${esc(t('print'))}</button>
    ${b.status === 'paid' ? `<button class="grow" id="d-method">${esc(t('changeMethod'))}</button><button class="grow danger" id="d-void">${esc(t('voidBill'))}</button>` : ''}</div>`, panelOpts());
  $('#bk').onclick = openBills;
  $('#d-print').onclick = () => printHTML(receiptHTML(S, b));
  if (b.status !== 'paid') return;
  $('#d-void').onclick = async () => {
    const r = await promptBox(t('voidReason'), '', 'text');
    if (r == null || !r.trim()) return;
    DB.updateBill(b.id, { status: 'void', voidReason: r.trim(), voidAt: Date.now() }).then(() => { toast(t('voided')); openBills(); }).catch(fail);
  };
  $('#d-method').onclick = async () => {
    const m = await choice(t('changeMethod'), ['cash', 'card', 'zelle'].map(x => [x, esc(t(x))]));
    if (!m) return;
    DB.updateBill(b.id, { payments: { [m]: b.total }, cashReceived: 0, methodChangedAt: Date.now() }).then(() => { toast('✓'); openBills(); }).catch(fail);
  };
}

/* ---------- Summary (end of day) ---------- */
function summaryHTML(r) {
  const L = (a, b, cls = '') => `<div class="line ${cls}"><span>${a}</span><span class="num">${b}</span></div>`;
  let h = `<div class="box">${L(esc(t('count')), r.count)}${L(esc(t('total')), money(r.total), 'total')}</div>`;
  h += `<div class="box">${L('💵 ' + esc(t('cash')), money(r.cash))}${L('💳 ' + esc(t('card')), money(r.card))}${L('⚡ ' + esc(t('zelle')), money(r.zelle))}</div>`;
  h += `<div class="box">${Object.entries(r.byType).map(([k, v]) => L(`${esc(typeName(S, k))} <span class="muted small">(${hm(v.minutes)})</span>`, money(v.time))).join('')}${L(esc(t('itemRevenue')), money(r.items))}${r.discount ? L(esc(t('discounts')), '-' + money(r.discount)) : ''}${r.rounding ? L(esc(t('rounding')), money(r.rounding)) : ''}</div>`;
  if (r.voidCount || r.cancelCount || r.overrides || r.lineAdjust) h += `<div class="box">${r.lineAdjust ? L(esc(t('priceChanges')), '-' + money(r.lineAdjust)) : ''}${r.overrides ? L(esc(t('override')), r.overrides) : ''}${r.voidCount ? L(esc(t('voids')), `${r.voidCount} · ${money(r.voidTotal)}`) : ''}${r.cancelCount ? L(esc(t('cancelledTables')), `${r.cancelCount} · ${hm(r.cancelMin)}`) : ''}</div>`;
  return h;
}
function openSummary() {
  PANEL = { kind: 'summary' };
  const r = summarize(S, TODAY);
  const busy = Object.keys(SESS).filter(k => k !== '_counter').length;
  openPanel(`<div class="panel-h"><h2>${esc(t('summary'))} · ${esc(curDay)}</h2><button class="xbtn" data-close>✕</button></div>
    <div class="panel-b">${busy ? `<p style="color:var(--amber)">⚠ ${busy} ${esc(t('tablesBusy'))}</p>` : ''}${summaryHTML(r)}</div>
    <div class="panel-f row"><button class="grow" id="s-print">🖨 ${esc(t('printSummary'))}</button>${DB.mode === 'cloud' ? `<button class="ghost" id="s-out">${esc(t('signOut'))}</button>` : ''}</div>`, panelOpts());
  const so = $('#s-out'); if (so) so.onclick = async () => { if (await confirmBox(t('signOutConfirm'), t('signOut'), true)) signOutDevice(); };
  $('#s-print').onclick = () => {
    const L = (a, b) => `<div class="l"><span>${a}</span><span>${b}</span></div>`;
    printHTML(`<div class="c b">${esc(S.shopName)}</div><div class="c">${esc(t('summary'))} ${esc(curDay)}</div><hr>${L(esc(t('count')), r.count)}${L(esc(t('total')), money(r.total))}<hr>${L(esc(t('cash')), money(r.cash))}${L(esc(t('card')), money(r.card))}${L(esc(t('zelle')), money(r.zelle))}<hr>${Object.entries(r.byType).map(([k, v]) => L(esc(typeName(S, k)), money(v.time))).join('')}${L(esc(t('itemRevenue')), money(r.items))}${L(esc(t('discounts')), money(r.discount))}<hr>${L(esc(t('voids')), r.voidCount)}${L(esc(t('cancelledTables')), r.cancelCount)}<hr><div class="c">${dateTimeOf(Date.now())}</div>`);
  };
}

/* ---------- Boot ---------- */
(async () => {
  registerSW();
  DB = await openDB('register');
  installHint();
  DB.onStatus(st => statusDot($('#st'), st));
  DB.onSettings(s => { S = normSettings(s); render(); rerenderPanel(); });
  DB.onSessions(m => {
    const out = {}; for (const [k, v] of Object.entries(m || {})) out[k] = normSession(v, S);
    const prev = SESS; SESS = out; render();
    if (PANEL && (PANEL.kind === 'table' || PANEL.kind === 'checkout') && prev[PANEL.id] && !SESS[PANEL.id]) { // closed on another device
      const lbl = tableLabel(S, PANEL.id); delete CART[PANEL.id]; closePanel(true); toast('ℹ️ ' + lbl + ' – ' + t('changedElsewhere')); return;
    }
    if (PANEL && PANEL.kind === 'table') rerenderPanel();
  });
  setInterval(tick, 1000);
})();
