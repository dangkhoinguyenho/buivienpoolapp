'use strict';
/* ===== Manager app (owner): reports, menu, tables & prices, billing rules, store, sync ===== */
const MS = {
  en: { title: 'Manager', reports: 'Reports', bills: 'Bills', menu: 'Menu', tables: 'Tables & prices', billing: 'Billing rules', store: 'Store', sync: 'Sync & backup',
    yesterday: 'Yesterday', d7: 'Last 7 days', month: 'This month', lastMonth: 'Last month', custom: 'Custom', from: 'From', to: 'To',
    revenue: 'Revenue', tableHours: 'Table hours', payments: 'Payments', mix: 'Revenue mix', loss: 'Loss control', byHour: 'Revenue by hour',
    byDay: 'Revenue by day', topItems: 'Items sold', usage: 'Table usage', sessions: 'Sessions', hours: 'Hours', qty: 'Qty', exportCsv: 'Export CSV',
    live: 'Tables in use now', categories: 'Categories', addCat: 'Add category', addItem: 'Add item', name: 'Name', nameVi: 'Vietnamese name', price: 'Price',
    category: 'Category', active: 'On sale', del: 'Delete', types: 'Table types & hourly rates', rateHr: 'Rate / hour', addType: 'Add type',
    tablesList: 'Tables', type: 'Type', rateOverride: 'Own rate (optional)', addTable: 'Add table', dflt: 'default',
    timeRound: 'Round table time', exact: 'Exact (no rounding)', roundUp: 'Round up', roundNear: 'Round to nearest', extraMin: 'Extra minutes added to every table',
    extraHelp: 'e.g. 5 → a 1h game is billed as 1h05', minMin: 'Minimum billed minutes', moneyRound: 'Round money', none: 'No rounding',
    nearest: 'Nearest (.50 and up rounds up)', up: 'Always up', down: 'Always down', applyTo: 'Apply money rounding to', wholeBill: 'Whole bill', timeOnly: 'Table time only',
    preview: 'Try it', minutes: 'Minutes played', billedAs: 'Billed as', examples: 'Examples', shopName: 'Store name', address: 'Address', phone: 'Phone',
    footer: 'Receipt footer', dayStart: 'Business day starts at', dayHelp: 'Bills after midnight count for the previous day until this hour.',
    pin: 'Manager PIN', pinHelp: 'Optional. Asked when opening the Manager app. Leave empty for none.', setPin: 'Set PIN', clearPin: 'Remove PIN',
    enterPin: 'Enter manager PIN', wrongPin: 'Wrong PIN', saved: 'Saved', status: 'Status', cloud: 'Connected to cloud sync', localOnly: 'This device only (not synced)',
    connectTitle: 'Connect live sync (Firebase)', cfgLabel: 'Paste your Firebase config', newStore: 'Create new store', joinStore: 'Or paste a setup code from another device',
    connect: 'Connect', links: 'Set up other devices', linkHelp: 'Open these links on each iPad / iPhone once. Then tap Share → Add to Home Screen. Keep the Manager link private.',
    regLink: 'Register link', mgrLink: 'Manager link', copy: 'Copy', copied: 'Copied', disconnect: 'Disconnect this device', backup: 'Backup',
    exportJson: 'Download backup', importJson: 'Restore from backup', rules: 'Firestore security rules', rulesHelp: 'Paste these into Firebase → Firestore → Rules → Publish.',
    imported: 'Backup restored', confirmDisc: 'Stop syncing on this device? Data stays in the cloud.', inUseDel: 'This table is in use right now.',
    confirmDel: 'Delete', void: 'Cancel bill', paidOnly: 'Paid', allSt: 'All', voidSt: 'Cancelled', cancelSt: 'Cancelled tables', overrides: 'Price changes at checkout',
    discGiven: 'Discounts given', noData: 'No bills in this range', storeKey: 'Store key', uploadLocal: 'Upload this device\'s menu & settings to the cloud store', hostNote: 'Links only work when the app is hosted online (https).' },
  vi: { title: 'Quản lý', reports: 'Báo cáo', bills: 'Hóa đơn', menu: 'Thực đơn', tables: 'Bàn & giá', billing: 'Cách tính tiền', store: 'Cửa hàng', sync: 'Đồng bộ & sao lưu',
    yesterday: 'Hôm qua', d7: '7 ngày', month: 'Tháng này', lastMonth: 'Tháng trước', custom: 'Tùy chọn', from: 'Từ', to: 'Đến',
    revenue: 'Doanh thu', tableHours: 'Giờ chơi', payments: 'Thanh toán', mix: 'Cơ cấu doanh thu', loss: 'Kiểm soát thất thoát', byHour: 'Doanh thu theo giờ',
    byDay: 'Doanh thu theo ngày', topItems: 'Món đã bán', usage: 'Sử dụng bàn', sessions: 'Lượt', hours: 'Giờ', qty: 'SL', exportCsv: 'Xuất CSV',
    live: 'Bàn đang chơi', categories: 'Nhóm món', addCat: 'Thêm nhóm', addItem: 'Thêm món', name: 'Tên', nameVi: 'Tên tiếng Việt', price: 'Giá',
    category: 'Nhóm', active: 'Đang bán', del: 'Xóa', types: 'Loại bàn & giá theo giờ', rateHr: 'Giá / giờ', addType: 'Thêm loại',
    tablesList: 'Danh sách bàn', type: 'Loại', rateOverride: 'Giá riêng (không bắt buộc)', addTable: 'Thêm bàn', dflt: 'mặc định',
    timeRound: 'Làm tròn thời gian', exact: 'Chính xác (không làm tròn)', roundUp: 'Làm tròn lên', roundNear: 'Làm tròn gần nhất', extraMin: 'Cộng thêm phút cho mỗi bàn',
    extraHelp: 'VD 5 → chơi 1 giờ tính 1 giờ 05', minMin: 'Số phút tính tối thiểu', moneyRound: 'Làm tròn tiền', none: 'Không làm tròn',
    nearest: 'Gần nhất (từ .50 làm tròn lên)', up: 'Luôn lên', down: 'Luôn xuống', applyTo: 'Làm tròn tiền cho', wholeBill: 'Cả hóa đơn', timeOnly: 'Chỉ tiền giờ',
    preview: 'Thử tính', minutes: 'Số phút chơi', billedAs: 'Tính thành', examples: 'Ví dụ', shopName: 'Tên quán', address: 'Địa chỉ', phone: 'Điện thoại',
    footer: 'Chân hóa đơn', dayStart: 'Ngày làm việc bắt đầu lúc', dayHelp: 'Hóa đơn sau nửa đêm tính cho ngày hôm trước đến giờ này.',
    pin: 'Mã PIN quản lý', pinHelp: 'Không bắt buộc. Hỏi khi mở app Quản lý. Để trống nếu không cần.', setPin: 'Đặt PIN', clearPin: 'Bỏ PIN',
    enterPin: 'Nhập mã PIN quản lý', wrongPin: 'Sai PIN', saved: 'Đã lưu', status: 'Trạng thái', cloud: 'Đang đồng bộ đám mây', localOnly: 'Chỉ trên máy này (chưa đồng bộ)',
    connectTitle: 'Kết nối đồng bộ (Firebase)', cfgLabel: 'Dán Firebase config', newStore: 'Tạo cửa hàng mới', joinStore: 'Hoặc dán mã cài đặt từ máy khác',
    connect: 'Kết nối', links: 'Cài cho máy khác', linkHelp: 'Mở các link này trên từng iPad / iPhone một lần, rồi bấm Chia sẻ → Thêm vào MH chính. Giữ kín link Quản lý.',
    regLink: 'Link thu ngân', mgrLink: 'Link quản lý', copy: 'Chép', copied: 'Đã chép', disconnect: 'Ngắt đồng bộ máy này', backup: 'Sao lưu',
    exportJson: 'Tải bản sao lưu', importJson: 'Khôi phục từ bản sao lưu', rules: 'Luật bảo mật Firestore', rulesHelp: 'Dán vào Firebase → Firestore → Rules → Publish.',
    imported: 'Đã khôi phục', confirmDisc: 'Ngừng đồng bộ trên máy này? Dữ liệu vẫn còn trên đám mây.', inUseDel: 'Bàn này đang có khách.',
    confirmDel: 'Xóa', void: 'Hủy hóa đơn', paidOnly: 'Đã trả', allSt: 'Tất cả', voidSt: 'Đã hủy', cancelSt: 'Bàn đã hủy', overrides: 'Sửa giá khi thanh toán',
    discGiven: 'Đã giảm giá', noData: 'Không có hóa đơn trong khoảng này', storeKey: 'Mã cửa hàng', uploadLocal: 'Đưa thực đơn & cài đặt của máy này lên đám mây', hostNote: 'Link chỉ dùng được khi app đã đưa lên mạng (https).' }
};
MS.en.live = 'Live tables'; MS.vi.live = 'Bàn đang chơi';
MS.en.feed = 'Notifications'; MS.vi.feed = 'Thông báo'; MS.en.noEvents = 'No activity yet today'; MS.vi.noEvents = 'Hôm nay chưa có hoạt động';
MS.en.desk = 'Turn on desktop notifications'; MS.vi.desk = 'Bật thông báo trên máy tính';
MS.en.quick = 'Quick'; MS.vi.quick = 'Nhanh'; MS.en.quickHelp = '★ Quick items show as one-tap buttons on every table.'; MS.vi.quickHelp = '★ Món "Nhanh" hiện thành nút bấm 1 lần trên mỗi bàn.';
MS.en.menuHelp = 'Every item on sale shows as a big button on the table screen, grouped by category.'; MS.vi.menuHelp = 'Mỗi món đang bán hiện thành nút lớn trên màn hình bàn, theo nhóm.';
MS.en.newPinTitle = 'Create a manager PIN'; MS.vi.newPinTitle = 'Tạo mã PIN quản lý';
MS.en.newPinHelp = 'At least 4 digits. It is asked whenever the Manager app is opened, so staff with the Register link cannot open it.'; MS.vi.newPinHelp = 'Ít nhất 4 số. App Quản lý sẽ hỏi mã này mỗi khi mở, để nhân viên có link thu ngân không vào được.';
MS.en.pinShort = 'PIN must be at least 4 characters'; MS.vi.pinShort = 'PIN phải có ít nhất 4 ký tự'; MS.en.pinAgain = 'Enter the PIN again'; MS.vi.pinAgain = 'Nhập lại mã PIN'; MS.en.pinMismatch = 'PINs do not match'; MS.vi.pinMismatch = 'Hai mã PIN không khớp';
MS.en.allFree = 'All tables are free'; MS.vi.allFree = 'Tất cả bàn đang trống';
const tm = k => (MS[LANG] && MS[LANG][k]) || MS.en[k] || t(k);

let DB, S = defaultSettings(), SESS = {}, BILLS = [], TAB = 'live', EVENTS = [], UNREAD = 0, SEEN = null, unB = null, BFILTER = 'all', BQ = '';
let LAST_ST = '', SETUP_ONLY = false;
let RANGE = { preset: 'today', from: '', to: '' };
const stable = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const fail = e => { console.error(e); toast('Error: ' + (e.message || e)); };
let saveTimer;
function saveS(now) {
  S.updatedAt = Date.now();
  clearTimeout(saveTimer);
  const go = () => DB.saveSettings(S).then(() => toast('✓ ' + tm('saved'))).catch(fail);
  now ? go() : (saveTimer = setTimeout(go, 250));
}

const app = $('#app');
function shell() {
  app.innerHTML = `<div class="topbar"><h1 class="grow">${esc(S.shopName)} · ${esc(tm('title'))}</h1><span id="st" class="dot"></span><button id="b-bell" class="bell">🔔<span class="n ${UNREAD ? '' : 'hidden'}" id="bell-n">${UNREAD}</span></button><button id="b-lang" class="ghost">${esc(t('lang'))}</button></div>
  <div class="mgr"><div class="chips" id="nav">${(SETUP_ONLY ? ['sync'] : ['live', 'reports', 'bills', 'menu', 'tables', 'billing', 'store', 'sync']).map(k => `<button class="chip ${TAB === k ? 'sel' : ''}" data-tab="${k}">${esc(tm(k))}</button>`).join('')}</div>
  <div id="view" style="max-width:980px;margin:0 auto;padding:0 12px 60px;width:100%"></div></div>`;
  $('#b-bell').onclick = openFeed;
  $('#b-lang').onclick = () => { setLang(LANG === 'en' ? 'vi' : 'en'); shell(); };
  $('#nav').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { TAB = b.dataset.tab; shell(); } };
  if (LAST_ST) statusDot($('#st'), LAST_ST);
  view();
}
function view() {
  const v = $('#view'); if (!v) return;
  ({ live: vLive, reports: vReports, bills: vBills, menu: vMenu, tables: vTables, billing: vBilling, store: vStore, sync: vSync })[TAB](v);
}

/* ---------- Range ---------- */
function rangeDates() {
  const now = Date.now(), today = dayKey(now, S.dayStartHour); const d = new Date(today + 'T12:00:00');
  const add = n => { const x = new Date(d); x.setDate(x.getDate() + n); return ymd(x); };
  switch (RANGE.preset) {
    case 'today': return [today, today];
    case 'yesterday': return [add(-1), add(-1)];
    case 'd7': return [add(-6), today];
    case 'month': return [today.slice(0, 8) + '01', today];
    case 'lastMonth': { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1); const y = new Date(d.getFullYear(), d.getMonth(), 0); return [ymd(x), ymd(y)]; }
    default: return [RANGE.from || today, RANGE.to || today];
  }
}
let subKey = '';
function subBills() {
  const [f, to] = rangeDates(); const k = f + '|' + to;
  if (k === subKey) return; subKey = k;
  if (unB) unB();
  unB = DB.onBills(f, to, b => { BILLS = b; if (TAB === 'reports' || TAB === 'bills') view(); });
}
function rangeBar() {
  const [f, to] = rangeDates();
  return `<div class="chips" style="padding-left:0">${['today', 'yesterday', 'd7', 'month', 'lastMonth', 'custom'].map(p => `<button class="chip ${RANGE.preset === p ? 'sel' : ''}" data-rp="${p}">${esc(p === 'today' ? t('today') : tm(p))}</button>`).join('')}</div>
  ${RANGE.preset === 'custom' ? `<div class="row" style="margin-bottom:8px"><label style="margin:0">${esc(tm('from'))}</label><input type="date" id="rf" value="${f}"><label style="margin:0">${esc(tm('to'))}</label><input type="date" id="rt" value="${to}"></div>` : `<div class="muted small" style="margin-bottom:8px">${f === to ? f : f + ' → ' + to}</div>`}`;
}
function wireRange(v) {
  $$('[data-rp]', v).forEach(b => b.onclick = () => { RANGE.preset = b.dataset.rp; if (b.dataset.rp === 'custom') { const [f, to] = rangeDates(); RANGE.from = RANGE.from || f; RANGE.to = RANGE.to || to; } subBills(); view(); });
  const rf = $('#rf', v), rt = $('#rt', v);
  if (rf) rf.onchange = () => { RANGE.from = rf.value; subBills(); view(); };
  if (rt) rt.onchange = () => { RANGE.to = rt.value; subBills(); view(); };
}

/* ---------- Live tables (read-only view of the floor) ---------- */
function vLive(v) {
  const now = Date.now();
  const busy = S.tables.filter(x => SESS[x.id]).concat(SESS._counter ? [{ id: '_counter', name: t('counter'), type: '' }] : []);
  let tot = 0;
  const cards = busy.map(tb => {
    const s = SESS[tb.id]; const c = computeBill(S, s, now); tot += c.total; const cur = curTimer(s);
    return `<div class="tcard ${sessPaused(s) ? 'paused' : 'busy'}" style="cursor:default"><div><div class="ttype">${esc(tb.type ? typeName(S, tb.type) : '')}</div><div class="tname">${esc(tb.name)}</div>
      ${cur ? `<div class="small">${esc(timerLabel(S, cur))} · ${money(effRate(cur))}${esc(t('perHour'))}</div>` : ''}${s.note ? `<div class="small">${esc(s.note)}</div>` : ''}</div>
      <div><div class="ttime">${clockStr(cur ? timerMs(cur, now) : 0)}</div><div class="tamt">${money(c.total)}${(s.items || []).length ? ' · 🥤' + s.items.reduce((a, i) => a + i.qty, 0) : ''}</div></div></div>`;
  }).join('');
  v.innerHTML = `<div class="kpis" style="margin:10px 0">${[[tm('live'), busy.length + ' / ' + S.tables.length], [t('total'), money(tot)]].map(([l, x]) => `<div class="box" style="margin:0"><div class="muted small">${esc(l)}</div><div style="font-size:26px;font-weight:800">${x}</div></div>`).join('')}</div>
   ${busy.length ? `<div class="live">${cards}</div>` : `<div class="empty">${esc(tm('allFree'))}</div>`}`;
}
setInterval(() => { if (TAB === 'live' && $('#view') && !locked()) vLive($('#view')); }, 1000);

/* ---------- Notifications: every checkout / cancelled table / cancelled bill ---------- */
function evText(b) {
  const m = b.status === 'void' ? `❌ ${t('voided')}: ${b.tableLabel} ${money(b.total)}${b.voidReason ? ' – ' + b.voidReason : ''}`
    : b.status === 'cancelled' ? `⚠️ ${t('tableCancelled')}: ${b.tableLabel} (${hm(b.playedMin || 0)})`
    : `✅ ${b.tableLabel} ${money(b.total)} · ${t(methodOf(b))}`;
  return m;
}
function beep() { try { const A = window.AudioContext || window.webkitAudioContext; const a = new A(); const o = a.createOscillator(); const g = a.createGain(); o.frequency.value = 880; g.gain.value = .08; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .15); } catch (e) { } }
function watchEvents() {
  const d = dayKey(Date.now(), S.dayStartHour);
  DB.onBills(d, d, bills => {
    const first = SEEN === null; SEEN = SEEN || {};
    for (const b of bills.slice().sort((x, y) => (x.voidAt || x.paidAt) - (y.voidAt || y.paidAt))) {
      const key = b.id + ':' + b.status;
      if (SEEN[key]) continue; SEEN[key] = 1;
      const ev = { at: b.status === 'void' ? b.voidAt : b.paidAt, text: evText(b), status: b.status };
      EVENTS.unshift(ev);
      if (!first) {
        UNREAD++; toast(ev.text); beep();
        try { if (window.Notification && Notification.permission === 'granted') new Notification(S.shopName, { body: ev.text }); } catch (e) { }
      }
    }
    EVENTS = EVENTS.slice(0, 200);
    const n = $('#bell-n'); if (n) { n.textContent = UNREAD; n.classList.toggle('hidden', !UNREAD); }
    if ($('#panel') && $('#panel')._key === 'feed') openFeed();
  });
}
function openFeed() {
  UNREAD = 0; const n = $('#bell-n'); if (n) n.classList.add('hidden');
  openPanel(`<div class="panel-h"><h2>🔔 ${esc(tm('feed'))}</h2><button class="xbtn" data-close>✕</button></div>
    <div class="panel-b"><div class="box feed" style="padding:0 12px">${EVENTS.length ? EVENTS.map(e => `<div class="ev"><span class="muted small" style="width:64px">${timeOf(e.at)}</span><span class="grow">${esc(e.text)}</span></div>`).join('') : `<div class="empty">${esc(tm('noEvents'))}</div>`}</div>
    ${window.Notification && Notification.permission !== 'granted' ? `<button id="desk" style="width:100%">${esc(tm('desk'))}</button>` : ''}</div>`, { key: 'feed' });
  const d = $('#desk'); if (d) d.onclick = () => Notification.requestPermission().then(() => openFeed());
}

/* ---------- Reports ---------- */
const bar = (val, max, color = 'var(--felt)') => `<div style="height:10px;background:var(--bg);border-radius:6px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${max ? Math.max(1, val / max * 100) : 0}%;background:${color}"></div></div>`;
function vReports(v) {
  subBills();
  const r = summarize(S, BILLS);
  const live = Object.keys(SESS).filter(k => k !== '_counter').length;
  const kpi = (l, val) => `<div class="box" style="margin:0"><div class="muted small">${esc(l)}</div><div style="font-size:26px;font-weight:800" class="num">${val}</div></div>`;
  let h = rangeBar();
  h += `<div class="kpis">${kpi(tm('revenue'), money(r.total))}${kpi(t('count'), r.count)}${kpi(tm('tableHours'), hm(r.minutes))}${kpi(t('avg'), money(r.count ? r.total / r.count : 0))}${kpi(tm('live'), live + ' / ' + S.tables.length)}</div>`;
  if (!r.count && !r.voidCount && !r.cancelCount) { v.innerHTML = h + `<div class="empty">${esc(tm('noData'))}</div>`; wireRange(v); return; }
  const pm = Math.max(r.cash, r.card, r.zelle);
  h += `<h3>${esc(tm('payments'))}</h3><div class="box">${[['cash', 'var(--felt)'], ['card', 'var(--card)'], ['zelle', 'var(--zelle)']].map(([m, c]) => `<div style="margin:6px 0"><div class="line" style="padding:0"><span>${esc(t(m))}</span><span class="num">${money(r[m])} <span class="muted small">${r.total ? Math.round(r[m] / r.total * 100) : 0}%</span></span></div>${bar(r[m], pm, c)}</div>`).join('')}</div>`;
  const mix = [...Object.entries(r.byType).map(([k, x]) => [typeName(S, k) + ` (${hm(x.minutes)})`, x.time]), [t('itemRevenue'), r.items]];
  const mm = Math.max(...mix.map(x => x[1]), 1);
  h += `<h3>${esc(tm('mix'))}</h3><div class="box">${mix.map(([l, x]) => `<div style="margin:6px 0"><div class="line" style="padding:0"><span>${esc(l)}</span><span class="num">${money(x)}</span></div>${bar(x, mm)}</div>`).join('')}
    ${r.lineAdjust ? `<div class="line"><span>${esc(t('priceChanges'))}</span><span class="num">-${money(r.lineAdjust)}</span></div>` : ''}${r.discount ? `<div class="line"><span>${esc(tm('discGiven'))}</span><span class="num">-${money(r.discount)}</span></div>` : ''}${r.rounding ? `<div class="line"><span>${esc(t('rounding'))}</span><span class="num">${money(r.rounding)}</span></div>` : ''}</div>`;
  h += `<h3>${esc(tm('loss'))}</h3><div class="box"><div class="line"><span>${esc(tm('overrides'))}</span><span>${r.overrides}</span></div><div class="line"><span>${esc(t('voids'))}</span><span>${r.voidCount} · ${money(r.voidTotal)}</span></div><div class="line"><span>${esc(t('cancelledTables'))}</span><span>${r.cancelCount} · ${hm(r.cancelMin)}</span></div></div>`;
  const [f, to] = rangeDates();
  if (f !== to) {
    const byDay = {}; for (const b of BILLS) if (b.status === 'paid') byDay[b.day] = (byDay[b.day] || 0) + b.total;
    const days = Object.keys(byDay).sort(); const dm = Math.max(...Object.values(byDay), 1);
    h += `<h3>${esc(tm('byDay'))}</h3><div class="box">${days.map(d => `<div style="margin:6px 0"><div class="line" style="padding:0"><span>${d} <span class="muted small">${new Date(d + 'T12:00').toLocaleDateString([], { weekday: 'short' })}</span></span><span class="num">${money(byDay[d])}</span></div>${bar(byDay[d], dm)}</div>`).join('')}</div>`;
  }
  const hours = r.byHour.map((x, i) => [i, x]).filter(x => x[1]); const hmx = Math.max(...r.byHour, 1);
  const order = [...Array(24).keys()].map(i => (i + (S.dayStartHour || 0)) % 24);
  h += `<h3>${esc(tm('byHour'))}</h3><div class="box"><div style="display:flex;align-items:flex-end;gap:3px;height:140px">${order.map(i => `<div title="${i}:00 ${money(r.byHour[i])}" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><div style="background:var(--felt);border-radius:3px 3px 0 0;height:${r.byHour[i] / hmx * 100}%"></div></div>`).join('')}</div>
    <div style="display:flex;gap:3px" class="small muted">${order.map(i => `<div style="flex:1;text-align:center;font-size:10px">${i % 3 === 0 ? i : ''}</div>`).join('')}</div>${hours.length ? '' : ''}</div>`;
  const items = Object.entries(r.byItem).sort((a, b) => b[1].revenue - a[1].revenue);
  if (items.length) h += `<h3>${esc(tm('topItems'))}</h3><div class="box" style="padding:4px 8px"><table class="t"><thead><tr><th>${esc(tm('name'))}</th><th class="right">${esc(tm('qty'))}</th><th class="right">${esc(tm('revenue'))}</th></tr></thead><tbody>${items.map(([n, x]) => `<tr><td>${esc(n)}</td><td class="right">${x.qty}</td><td class="right num">${money(x.revenue)}</td></tr>`).join('')}</tbody></table></div>`;
  const tbs = Object.entries(r.byTable).sort((a, b) => b[1].minutes - a[1].minutes);
  if (tbs.length) h += `<h3>${esc(tm('usage'))}</h3><div class="box" style="padding:4px 8px"><table class="t"><thead><tr><th>${esc(t('table'))}</th><th class="right">${esc(tm('sessions'))}</th><th class="right">${esc(tm('hours'))}</th><th class="right">${esc(tm('revenue'))}</th></tr></thead><tbody>${tbs.map(([n, x]) => `<tr><td>${esc(n)}</td><td class="right">${x.count}</td><td class="right">${hm(x.minutes)}</td><td class="right num">${money(x.revenue)}</td></tr>`).join('')}</tbody></table></div>`;
  h += `<button style="margin-top:16px" id="csv">⬇ ${esc(tm('exportCsv'))}</button>`;
  v.innerHTML = h; wireRange(v);
  $('#csv').onclick = exportCSV;
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportCSV() {
  const cols = ['no', 'day', 'paid_at', 'table', 'start', 'end', 'played_min', 'billed_min', 'rate', 'time_charge', 'items', 'items_total', 'discount', 'rounding', 'price_changed', 'total', 'cash', 'card', 'zelle', 'status', 'reason', 'note'];
  const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = BILLS.slice().sort((a, b) => a.paidAt - b.paidAt).map(b => [b.no, b.day, new Date(b.paidAt).toLocaleString(), b.tableLabel, b.startAt ? new Date(b.startAt).toLocaleTimeString() : '', b.endAt ? new Date(b.endAt).toLocaleTimeString() : '',
    Math.round(b.playedMin || 0), Math.round(b.billedMin || 0), b.rate, b.time, (b.items || []).map(i => i.qty + 'x ' + i.name).join('; '), b.itemsTotal, b.discount, b.rounding, b.overridden ? 'yes' : '',
    b.status === 'cancelled' ? 0 : b.total, (b.payments || {}).cash || '', (b.payments || {}).card || '', (b.payments || {}).zelle || '', b.status, b.voidReason || '', b.note || ''].map(q).join(','));
  const [f, to] = rangeDates();
  download(`bills_${f}_${to}.csv`, '﻿' + cols.join(',') + '\n' + rows.join('\n'), 'text/csv');
}

/* ---------- Bills ---------- */
function vBills(v) {
  subBills();
  let list = BILLS.slice().sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0));
  if (BFILTER !== 'all') list = list.filter(b => b.status === BFILTER);
  if (BQ) { const q = BQ.toLowerCase(); list = list.filter(b => (b.tableLabel + ' ' + b.no + ' ' + (b.note || '')).toLowerCase().includes(q)); }
  v.innerHTML = rangeBar() + `<div class="row wrap" style="margin-bottom:8px"><div class="seg">${[['all', tm('allSt')], ['paid', tm('paidOnly')], ['void', tm('voidSt')], ['cancelled', tm('cancelSt')]].map(([k, l]) => `<button data-bf="${k}" class="${BFILTER === k ? 'sel' : ''}" style="min-height:40px;padding:6px 10px">${esc(l)}</button>`).join('')}</div><input id="bq" class="grow" style="min-width:160px" placeholder="🔍 ${esc(t('search'))}" value="${esc(BQ)}"></div>
  ${list.length ? `<div class="box" style="padding:4px 8px;overflow-x:auto"><table class="t"><thead><tr><th>#</th><th>${esc(t('time'))}</th><th>${esc(t('table'))}</th><th>${esc(t('played'))}</th><th>${esc(t('method'))}</th><th class="right">${esc(t('amount'))}</th></tr></thead><tbody>
  ${list.map(b => `<tr class="click ${b.status !== 'paid' ? 'void' : ''}" data-b="${b.id}"><td class="small">${esc(b.no)}</td><td>${dateTimeOf(b.paidAt)}</td><td>${esc(b.tableLabel)}</td><td>${b.tableId === '_counter' ? '' : hm(b.playedMin || 0)}</td><td>${b.status === 'paid' ? `<span class="tag ${methodOf(b)}">${esc(t(methodOf(b)))}</span>` : `<span class="tag void">${esc(b.status === 'void' ? tm('voidSt') : tm('cancelSt'))}</span>`}</td><td class="right num">${money(b.status === 'cancelled' ? b.cancelledTotal || 0 : b.total)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${esc(tm('noData'))}</div>`}`;
  wireRange(v);
  $$('[data-bf]', v).forEach(b => b.onclick = () => { BFILTER = b.dataset.bf; view(); });
  const bq = $('#bq', v); bq.onchange = () => { BQ = bq.value; view(); };
  $$('[data-b]', v).forEach(r => r.onclick = () => billPanel(BILLS.find(b => b.id === r.dataset.b)));
}
function billPanel(b) {
  if (!b) return;
  openPanel(`<div class="panel-h"><h2>${esc(t('bill'))} #${esc(b.no)}</h2><button class="xbtn" data-close>✕</button></div>
   <div class="panel-b"><div class="rcpt">${receiptHTML(S, b)}</div>
   ${b.status === 'cancelled' ? `<p class="muted">${esc(t('cancelledTables'))}: ${hm(b.playedMin || 0)} · ${money(b.cancelledTotal || 0)}</p>` : ''}
   ${b.voidReason ? `<p class="muted">${esc(t('reason'))}: ${esc(b.voidReason)} · ${dateTimeOf(b.voidAt)}</p>` : ''}
   ${b.movedFrom ? `<p class="muted small">⇄ ${b.movedFrom.map(m => esc(tableLabel(S, m.id))).join(', ')}</p>` : ''}</div>
   <div class="panel-f row"><button class="grow" id="bp-print">🖨 ${esc(t('print'))}</button>${b.status === 'paid' ? `<button class="grow danger" id="bp-void">${esc(tm('void'))}</button>` : ''}</div>`);
  $('#bp-print').onclick = () => printHTML(receiptHTML(S, b));
  const vb = $('#bp-void'); if (vb) vb.onclick = async () => {
    const r = await promptBox(t('voidReason'), '', 'text'); if (r == null || !r.trim()) return;
    DB.updateBill(b.id, { status: 'void', voidReason: r.trim(), voidAt: Date.now() }).then(() => { closePanel(); toast(tm('voidSt')); }).catch(fail);
  };
}

/* ---------- Menu ---------- */
function vMenu(v) {
  const catOpts = sel => S.categories.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(catName(S, c.id))}</option>`).join('');
  let h = `<p class="muted small">${esc(tm('menuHelp'))}</p><h3>${esc(tm('categories'))}</h3><div class="box">${S.categories.map((c, i) => `<div class="row" style="margin:6px 0"><input data-cn="${i}" value="${esc(c.name)}" placeholder="${esc(tm('name'))}"><input data-cv="${i}" value="${esc(c.nameVi || '')}" placeholder="${esc(tm('nameVi'))}"><button class="danger" data-cd="${i}" style="min-width:44px">✕</button></div>`).join('')}
    <button id="addcat">＋ ${esc(tm('addCat'))}</button></div>`;
  for (const c of S.categories) {
    const items = S.items.filter(i => i.cat === c.id);
    h += `<h3>${esc(catName(S, c.id))} <span class="muted small">(${items.length})</span></h3><div class="box">
    ${items.map(i => { const ix = S.items.indexOf(i); return `<div class="row wrap" style="margin:6px 0;${i.active === false ? 'opacity:.5' : ''}"><input class="grow" style="min-width:140px" data-in="${ix}" value="${esc(i.name)}"><input style="width:100px" type="number" inputmode="decimal" step="any" data-ip="${ix}" value="${i.price}"><select style="width:130px" data-ic="${ix}">${catOpts(i.cat)}</select><button data-ia="${ix}" class="${i.active === false ? '' : 'sel'}" style="min-width:90px">${i.active === false ? '○' : '●'} ${esc(tm('active'))}</button><button class="danger" data-id="${ix}" style="min-width:44px">✕</button></div>`; }).join('')}
    <button data-addi="${c.id}">＋ ${esc(tm('addItem'))}</button></div>`;
  }
  v.innerHTML = h;
  $$('[data-cn]', v).forEach(i => i.onchange = () => { S.categories[+i.dataset.cn].name = i.value.trim() || '—'; saveS(); });
  $$('[data-cv]', v).forEach(i => i.onchange = () => { S.categories[+i.dataset.cv].nameVi = i.value.trim(); saveS(); });
  $$('[data-cd]', v).forEach(b => b.onclick = async () => {
    const c = S.categories[+b.dataset.cd]; const n = S.items.filter(i => i.cat === c.id).length;
    if (n) return toast(`${n} ${t('items')} – move or delete them first`);
    if (!await confirmBox(`${tm('confirmDel')} "${c.name}"?`, tm('del'), true)) return;
    S.categories.splice(+b.dataset.cd, 1); saveS(true); view();
  });
  $('#addcat', v).onclick = async () => { const n = await promptBox(tm('addCat'), ''); if (n && n.trim()) { S.categories.push({ id: uid(6), name: n.trim(), nameVi: '' }); saveS(true); view(); } };
  $$('[data-in]', v).forEach(i => i.onchange = () => { S.items[+i.dataset.in].name = i.value.trim() || '—'; saveS(); });
  $$('[data-ip]', v).forEach(i => i.onchange = () => { const p = +i.value; if (isNaN(p) || p < 0) return toast('Invalid price'); S.items[+i.dataset.ip].price = Math.round(p * 100) / 100; saveS(); });
  $$('[data-ic]', v).forEach(i => i.onchange = () => { S.items[+i.dataset.ic].cat = i.value; saveS(true); view(); });
  $$('[data-ia]', v).forEach(b => b.onclick = () => { const it = S.items[+b.dataset.ia]; it.active = it.active === false; saveS(true); view(); });
  $$('[data-id]', v).forEach(b => b.onclick = async () => { const it = S.items[+b.dataset.id]; if (!await confirmBox(`${tm('confirmDel')} "${it.name}"?`, tm('del'), true)) return; S.items.splice(+b.dataset.id, 1); saveS(true); view(); });
  $$('[data-addi]', v).forEach(b => b.onclick = async () => {
    const name = await promptBox(tm('addItem') + ' – ' + tm('name'), ''); if (!name || !name.trim()) return;
    const price = await promptBox(tm('price') + ' ($)', '', 'number'); if (price == null || price === '' || isNaN(+price)) return;
    S.items.push({ id: uid(8), name: name.trim(), price: Math.round(+price * 100) / 100, cat: b.dataset.addi, active: true }); saveS(true); view();
  });
}

/* ---------- Tables & prices ---------- */
function vTables(v) {
  const typeOpts = sel => S.tableTypes.map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(typeName(S, x.id))}</option>`).join('');
  let h = `<h3>${esc(tm('types'))}</h3><div class="box">${S.tableTypes.map((x, i) => `<div class="row wrap" style="margin:6px 0"><input class="grow" style="min-width:120px" data-tn="${i}" value="${esc(x.name)}" placeholder="${esc(tm('name'))}"><input class="grow" style="min-width:120px" data-tv="${i}" value="${esc(x.nameVi || '')}" placeholder="${esc(tm('nameVi'))}"><div class="row" style="width:190px"><span>$</span><input type="number" inputmode="decimal" step="any" data-tr="${i}" value="${x.rate}"><span class="muted small">${esc(x.perPerson ? t('perPerson') : t('perHour'))}</span></div><button class="danger" data-td="${i}" style="min-width:44px">✕</button></div>`).join('')}
   <button id="addtype">＋ ${esc(tm('addType'))}</button></div>`;
  h += `<h3>${esc(tm('tablesList'))} <span class="muted small">(${S.tables.length})</span></h3><div class="box">${S.tables.map((x, i) => `<div class="row wrap" style="margin:6px 0">
    <div class="row" style="flex-direction:column;gap:2px"><button data-up="${i}" style="min-height:22px;padding:0 10px;font-size:11px">▲</button><button data-dn="${i}" style="min-height:22px;padding:0 10px;font-size:11px">▼</button></div>
    <input style="width:90px" data-xn="${i}" value="${esc(x.name)}"><select style="width:150px" data-xt="${i}">${typeOpts(x.type)}</select>
    <input style="width:150px" type="number" inputmode="decimal" step="any" data-xr="${i}" value="${x.rate ?? ''}" placeholder="${esc(tm('dflt'))} ${money(typeOf(S, x.type).rate)}">
    ${SESS[x.id] ? `<span class="tag" style="background:#1f4d33">${esc(t('inUse'))}</span>` : ''}<span class="grow"></span><button class="danger" data-xd="${i}" style="min-width:44px">✕</button></div>`).join('')}
    <p class="muted small">${esc(tm('rateOverride'))}</p><button id="addtable">＋ ${esc(tm('addTable'))}</button></div>`;
  v.innerHTML = h;
  $$('[data-tn]', v).forEach(i => i.onchange = () => { S.tableTypes[+i.dataset.tn].name = i.value.trim() || '—'; saveS(); });
  $$('[data-tv]', v).forEach(i => i.onchange = () => { S.tableTypes[+i.dataset.tv].nameVi = i.value.trim(); saveS(); });
  $$('[data-tr]', v).forEach(i => i.onchange = () => { const r = +i.value; if (isNaN(r) || r < 0) return toast('Invalid rate'); S.tableTypes[+i.dataset.tr].rate = r; saveS(); view(); });
  $$('[data-td]', v).forEach(b => b.onclick = async () => {
    const ty = S.tableTypes[+b.dataset.td]; const n = S.tables.filter(x => x.type === ty.id).length;
    if (n) return toast(`${n} ${t('table')} – change or delete them first`);
    if (!await confirmBox(`${tm('confirmDel')} "${ty.name}"?`, tm('del'), true)) return; S.tableTypes.splice(+b.dataset.td, 1); saveS(true); view();
  });
  $('#addtype', v).onclick = async () => { const n = await promptBox(tm('addType'), ''); if (!n || !n.trim()) return; const r = await promptBox(tm('rateHr') + ' ($)', '10', 'number'); if (r == null || isNaN(+r)) return; S.tableTypes.push({ id: uid(6), name: n.trim(), nameVi: '', rate: +r }); saveS(true); view(); };
  $$('[data-xn]', v).forEach(i => i.onchange = () => { S.tables[+i.dataset.xn].name = i.value.trim() || '?'; saveS(); });
  $$('[data-xt]', v).forEach(i => i.onchange = () => { S.tables[+i.dataset.xt].type = i.value; saveS(true); view(); });
  $$('[data-xr]', v).forEach(i => i.onchange = () => { const x = S.tables[+i.dataset.xr]; x.rate = i.value === '' ? null : +i.value; saveS(); });
  const swap = (a, b) => { if (b < 0 || b >= S.tables.length) return; [S.tables[a], S.tables[b]] = [S.tables[b], S.tables[a]]; saveS(true); view(); };
  $$('[data-up]', v).forEach(b => b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1));
  $$('[data-dn]', v).forEach(b => b.onclick = () => swap(+b.dataset.dn, +b.dataset.dn + 1));
  $$('[data-xd]', v).forEach(b => b.onclick = async () => {
    const x = S.tables[+b.dataset.xd]; if (SESS[x.id]) return toast(tm('inUseDel'));
    if (!await confirmBox(`${tm('confirmDel')} ${tableLabel(S, x.id)}?`, tm('del'), true)) return; S.tables.splice(+b.dataset.xd, 1); saveS(true); view();
  });
  $('#addtable', v).onclick = () => {
    const ty = (S.tableTypes[0] || {}).id || 'pool'; const n = S.tables.filter(x => x.type === ty).length + 1;
    S.tables.push({ id: uid(6), name: String(n), type: ty, rate: null }); saveS(true); view();
  };
}

/* ---------- Billing rules ---------- */
let PV = { type: '', min: 37 };
function vBilling(v) {
  const B = S.billing;
  const opt = (val, cur, label) => `<option value="${val}" ${String(val) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
  PV.type = PV.type && S.tableTypes.find(x => x.id === PV.type) ? PV.type : (S.tableTypes[0] || {}).id;
  v.innerHTML = `<div class="box">
   <label>${esc(tm('timeRound'))}</label><div class="row"><select id="b-ts">${[0, 1, 5, 10, 15, 30, 60].map(x => opt(x, B.timeStep, x ? x + ' min' : tm('exact'))).join('')}</select>
   <select id="b-tm" ${+B.timeStep ? '' : 'disabled'}>${opt('up', B.timeMode, tm('roundUp'))}${opt('nearest', B.timeMode, tm('roundNear'))}</select></div>
   <label>${esc(tm('extraMin'))}</label><input id="b-ex" type="number" inputmode="numeric" min="0" value="${B.extraMin}"><div class="small muted">${esc(tm('extraHelp'))}</div>
   <label>${esc(tm('minMin'))}</label><input id="b-mn" type="number" inputmode="numeric" min="0" value="${B.minMin}">
   <label>${esc(tm('moneyRound'))}</label><div class="row"><select id="b-ms">${[[0, tm('none')], [0.05, '$0.05'], [0.25, '$0.25'], [0.5, '$0.50'], [1, '$1'], [5, '$5']].map(([x, l]) => opt(x, B.moneyStep, l)).join('')}</select>
   <select id="b-mm" ${+B.moneyStep ? '' : 'disabled'}>${opt('nearest', B.moneyMode, tm('nearest'))}${opt('up', B.moneyMode, tm('up'))}${opt('down', B.moneyMode, tm('down'))}</select></div>
   <label>${esc(tm('applyTo'))}</label><select id="b-ma" ${+B.moneyStep ? '' : 'disabled'}>${opt('total', B.moneyApply, tm('wholeBill'))}${opt('time', B.moneyApply, tm('timeOnly'))}</select></div>
   <h3>${esc(tm('preview'))}</h3><div class="box"><div class="row"><select id="pv-t">${S.tableTypes.map(x => opt(x.id, PV.type, typeName(S, x.id) + ' ' + money(x.rate) + t('perHour'))).join('')}</select><input id="pv-m" type="number" inputmode="numeric" value="${PV.min}" style="width:110px"><span class="muted">min</span></div><div id="pv-out" style="font-size:20px;margin-top:10px"></div></div>
   <h3>${esc(tm('examples'))}</h3><div class="box" style="padding:4px 8px" id="pv-ex"></div>`;
  const calcFor = (type, min) => computeBill(S, { tableId: '_preview', startAt: 1, pausedMs: 0, items: [], rate: typeOf(S, type).rate }, 1 + min * 60000);
  const paint = () => {
    const c = calcFor(PV.type, +PV.min || 0);
    $('#pv-out').innerHTML = `${esc(tm('billedAs'))} <b>${hm(c.billedMin)}</b> → ${money(c.time)}${c.rounding ? ` <span class="muted">(${t('rounding')} ${money(c.rounding)})</span>` : ''} = <b style="color:var(--felt2)">${money(c.total)}</b>`;
    const mins = [15, 30, 37, 45, 52, 60, 61, 75, 95, 125];
    $('#pv-ex').innerHTML = `<table class="t"><thead><tr><th>${esc(t('played'))}</th>${S.tableTypes.map(x => `<th class="right">${esc(typeName(S, x.id))}</th>`).join('')}</tr></thead><tbody>${mins.map(m => `<tr><td>${hm(m)}</td>${S.tableTypes.map(x => { const c = calcFor(x.id, m); return `<td class="right num">${money(c.total)} <span class="muted small">${c.billedMin !== m ? '(' + hm(c.billedMin) + ')' : ''}</span></td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  };
  const set = (k, val) => { B[k] = val; saveS(); vBilling(v); };
  $('#b-ts').onchange = e => set('timeStep', +e.target.value);
  $('#b-tm').onchange = e => set('timeMode', e.target.value);
  $('#b-ex').onchange = e => set('extraMin', Math.max(0, +e.target.value || 0));
  $('#b-mn').onchange = e => set('minMin', Math.max(0, +e.target.value || 0));
  $('#b-ms').onchange = e => set('moneyStep', +e.target.value);
  $('#b-mm').onchange = e => set('moneyMode', e.target.value);
  $('#b-ma').onchange = e => set('moneyApply', e.target.value);
  $('#pv-t').onchange = e => { PV.type = e.target.value; paint(); };
  $('#pv-m').oninput = e => { PV.min = e.target.value; paint(); };
  paint();
}

/* ---------- Store ---------- */
function vStore(v) {
  v.innerHTML = `<div class="box">
   <label>${esc(tm('shopName'))}</label><input id="s-n" value="${esc(S.shopName)}">
   <label>${esc(tm('address'))}</label><input id="s-a" value="${esc(S.address)}">
   <label>${esc(tm('phone'))}</label><input id="s-p" value="${esc(S.phone)}" inputmode="tel">
   <label>${esc(tm('footer'))}</label><input id="s-f" value="${esc(S.receiptFooter)}">
   <label>${esc(tm('dayStart'))}</label><select id="s-d">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => `<option value="${h}" ${+S.dayStartHour === h ? 'selected' : ''}>${h === 0 ? '12:00 AM' : h + ':00 AM'}</option>`).join('')}</select><div class="small muted">${esc(tm('dayHelp'))}</div></div>
   <h3>${esc(tm('pin'))}</h3><div class="box"><div class="small muted">${esc(tm('pinHelp'))}</div><div class="row" style="margin-top:10px"><button id="s-pin">${esc(tm('setPin'))}</button>${S.managerPin && DB.mode !== 'cloud' ? `<button class="danger" id="s-unpin">${esc(tm('clearPin'))}</button><span class="muted">●●●●</span>` : ''}</div></div>
   <p class="muted small">v${APP_VERSION}</p>`;
  const bind = (id, k) => $(id, v).onchange = e => { S[k] = e.target.value; saveS(); if (k === 'shopName') $('.topbar h1').textContent = S.shopName + ' · ' + tm('title'); };
  bind('#s-n', 'shopName'); bind('#s-a', 'address'); bind('#s-p', 'phone'); bind('#s-f', 'receiptFooter');
  $('#s-d', v).onchange = e => { S.dayStartHour = +e.target.value; saveS(); };
  $('#s-pin', v).onclick = async () => { const p = await askNewPin(); if (p) { S.managerPin = p.trim(); sessionStorage.setItem('ph_unlock', p.trim()); saveS(true); view(); } };
  const up = $('#s-unpin', v); if (up) up.onclick = () => { S.managerPin = ''; saveS(true); view(); };
}

/* ---------- Sync & backup ---------- */
const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stores/{storeKey}/{document=**} {
      allow read, write: if storeKey.size() >= 20;
    }
  }
}`;
function vSync(v) {
  const conn = LS.get('ph_conn', null);
  const base = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/, '');
  const hosted = location.protocol === 'https:' || location.hostname === 'localhost';
  let h = `<div class="box"><div class="line"><span>${esc(tm('status'))}</span><span class="dot ${DB.mode === 'cloud' ? 'ok' : ''}">${esc(DB.mode === 'cloud' ? tm('cloud') : tm('localOnly'))}</span></div>
    ${conn ? `<div class="line small muted"><span>Firebase</span><span>${esc(conn.cfg.projectId)}</span></div><div class="line small muted"><span>${esc(tm('storeKey'))}</span><span>${esc(conn.key.slice(0, 4))}••••${esc(conn.key.slice(-3))}</span></div>` : ''}</div>`;
  if (conn) {
    const code = encodeConn(conn);
    const reg = base + 'register.html?connect=' + code, mgr = base + 'manager.html?connect=' + code;
    h += `<h3>${esc(tm('links'))}</h3><div class="box"><div class="small muted">${esc(tm('linkHelp'))}</div>${hosted ? '' : `<p style="color:var(--amber)" class="small">${esc(tm('hostNote'))}</p>`}
      <label>${esc(tm('regLink'))}</label><div class="row"><input readonly value="${esc(reg)}"><button data-copy="${esc(reg)}">${esc(tm('copy'))}</button></div>
      <label>${esc(tm('mgrLink'))}</label><div class="row"><input readonly value="${esc(mgr)}"><button data-copy="${esc(mgr)}">${esc(tm('copy'))}</button></div>
      <label>Setup code</label><div class="row"><input readonly value="${esc(code)}"><button data-copy="${esc(code)}">${esc(tm('copy'))}</button></div>
      <button class="danger" id="disc" style="margin-top:14px">${esc(tm('disconnect'))}</button></div>`;
  } else {
    h += `<h3>${esc(tm('connectTitle'))}</h3><div class="box">
      <label>${esc(tm('cfgLabel'))}</label><textarea id="cfg" rows="8" placeholder="const firebaseConfig = {&#10;  apiKey: &quot;...&quot;,&#10;  authDomain: &quot;...&quot;,&#10;  projectId: &quot;...&quot;,&#10;  ...&#10;};"></textarea>
      <label class="row" style="gap:8px;color:var(--text);font-size:15px"><input type="checkbox" id="upl" checked style="width:22px;min-height:22px"> ${esc(tm('uploadLocal'))}</label>
      <button class="primary" id="newstore" style="margin-top:10px">${esc(tm('newStore'))}</button>
      <label style="margin-top:18px">${esc(tm('joinStore'))}</label><div class="row"><input id="join" placeholder="eyJjZmc…"><button id="joinb">${esc(tm('connect'))}</button></div></div>`;
  }
  h += `<h3>${esc(tm('rules'))}</h3><div class="box"><div class="small muted">${esc(tm('rulesHelp'))}</div><pre style="white-space:pre-wrap;font-size:12px;background:var(--bg);padding:10px;border-radius:8px">${esc(RULES)}</pre><button data-copy="${esc(RULES)}">${esc(tm('copy'))}</button></div>`;
  h += `<h3>${esc(tm('backup'))}</h3><div class="box row wrap"><button id="exp">⬇ ${esc(tm('exportJson'))}</button><label style="margin:0"><span class="tag" style="padding:12px 14px;font-size:15px;cursor:pointer">⬆ ${esc(tm('importJson'))}</span><input type="file" id="imp" accept=".json,application/json" class="hidden"></label></div>`;
  v.innerHTML = h;
  $$('[data-copy]', v).forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast(tm('copied')); } catch (e) { const i = b.previousElementSibling; if (i && i.select) { i.select(); document.execCommand('copy'); toast(tm('copied')); } } });
  const ds = $('#disc', v); if (ds) ds.onclick = async () => { if (await confirmBox(tm('confirmDisc'), tm('disconnect'), true)) { LS.del('ph_conn'); location.reload(); } };
  const connectWith = async (conn, upload) => {
    try {
      const f = await new FireDB().init(conn.cfg, conn.key);
      const ex = await f.exportAll(); if (!ex.settings) await f.saveSettings(cleanData(upload ? S : Object.assign(defaultSettings(), { managerPin: S.managerPin })));
      LS.set('ph_conn', conn); toast('✓ ' + tm('cloud')); setTimeout(() => location.reload(), 600);
    } catch (e) { fail(e); }
  };
  const ns = $('#newstore', v); if (ns) ns.onclick = async () => {
    let cfg; try { cfg = parseFirebaseConfig($('#cfg').value); } catch (e) { return toast('Config: ' + e.message); }
    const p = await askNewPin(); if (!p) return;
    S.managerPin = p; sessionStorage.setItem('ph_unlock', p);
    connectWith({ cfg, key: uid(24) }, $('#upl').checked);
  };
  const jb = $('#joinb', v); if (jb) jb.onclick = () => { let c; try { c = decodeConn($('#join').value); } catch (e) { return toast('Invalid code'); } connectWith(c, false); };
  $('#exp', v).onclick = async () => { try { const d = await DB.exportAll(); download(`poolhall-backup-${ymd(new Date())}.json`, JSON.stringify(d), 'application/json'); } catch (e) { fail(e); } };
  $('#imp', v).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); await DB.importAll(d); toast(tm('imported')); } catch (er) { fail(er); } };
}

/* ---------- PIN lock ---------- */
async function askNewPin() {
  const p = await promptBox(tm('newPinTitle'), '', 'password', `<p class="small muted" style="margin-top:0">${esc(tm('newPinHelp'))}</p>`);
  if (p == null) return null;
  if (p.trim().length < 4) { toast(tm('pinShort')); return null; }
  const p2 = await promptBox(tm('pinAgain'), '', 'password'); if (p2 == null) return null;
  if (p2.trim() !== p.trim()) { toast(tm('pinMismatch')); return null; }
  return p.trim();
}
function pinSetupScreen() {
  app.innerHTML = `<div style="max-width:380px;margin:16vh auto;text-align:center;padding:20px"><div style="font-size:50px">🔐</div><h2>${esc(tm('newPinTitle'))}</h2><p class="muted">${esc(tm('newPinHelp'))}</p><button class="primary big" style="width:100%" id="mkpin">${esc(tm('setPin'))}</button></div>`;
  $('#mkpin').onclick = async () => { const p = await askNewPin(); if (!p) return; S.managerPin = p; sessionStorage.setItem('ph_unlock', p); saveS(true); shell(); };
}
function locked() { return S.managerPin && sessionStorage.getItem('ph_unlock') !== S.managerPin; }
function lockScreen() {
  app.innerHTML = `<div style="max-width:320px;margin:18vh auto;text-align:center;padding:20px"><h2>🔒 ${esc(tm('enterPin'))}</h2><input id="pin" type="password" inputmode="numeric" style="text-align:center;font-size:28px;letter-spacing:.3em"><button class="primary big" style="width:100%;margin-top:12px" id="pinok">${esc(t('ok'))}</button></div>`;
  const go = () => { if ($('#pin').value === S.managerPin) { sessionStorage.setItem('ph_unlock', S.managerPin); shell(); } else { toast(tm('wrongPin')); $('#pin').value = ''; } };
  $('#pinok').onclick = go; $('#pin').onkeydown = e => { if (e.key === 'Enter') go(); }; $('#pin').focus();
}

/* ---------- Boot ---------- */
(async () => {
  registerSW();
  DB = await openDB();
  if (needsSetup(DB)) { SETUP_ONLY = true; TAB = 'sync'; }
  DB.onStatus(st => { LAST_ST = st; const el = $('#st'); if (el) statusDot(el, st); });
  let first = true;
  DB.onSettings(s => {
    const n = normSettings(s);
    if (!first && stable(n) === stable(S)) return; // our own save echoing back – don't disturb typing
    S = n;
    if (first) { first = false; subBills(); watchEvents(); }
    if (DB.mode === 'cloud' && !S.managerPin) return pinSetupScreen();
    if (locked()) return lockScreen();
    const ae = document.activeElement, vw = $('#view'); if (vw && ae && ae.matches('input,textarea,select') && vw.contains(ae)) return; // editing – skip remote refresh
    shell();
  });
  DB.onSessions(m => { SESS = {}; for (const [k, x] of Object.entries(m || {})) SESS[k] = normSession(x, S); if (!locked() && (TAB === 'reports' || TAB === 'tables' || TAB === 'live') && !(document.activeElement && document.activeElement.matches('input,select,textarea'))) view(); });
})();
