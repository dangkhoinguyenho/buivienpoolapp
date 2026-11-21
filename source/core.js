'use strict';
/* ===== Shared core: utils, i18n, settings, billing engine, data layer (local + Firebase) ===== */
const APP_VERSION = '1.0.0';
const FIREBASE_VER = '10.12.2';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (n = 10) => { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (const x of crypto.getRandomValues(new Uint8Array(n))) s += a[x % a.length]; return s; };
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const toC = d => Math.round((+d || 0) * 100);           // dollars -> cents
const toD = c => Math.round(c) / 100;                    // cents -> dollars
const money = d => (d < 0 ? '-' : '') + '$' + Math.abs(+d || 0).toFixed(2);
const pad = n => String(n).padStart(2, '0');
const hhmm = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const clockStr = ms => { if (ms < 0) ms = 0; const s = Math.floor(ms / 1000); return Math.floor(s / 3600) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };
const hm = min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h ${pad(m)}m` : `${m}m`; };
const timeOf = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dateTimeOf = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
/* Business day: a bill at 1:30 AM belongs to the previous day if the day starts at 4 AM */
const dayKey = (ts, startHour = 4) => ymd(new Date(ts - (startHour || 0) * 3600e3));

/* ---------- i18n ---------- */
const STR = {
  en: {
    pool: 'Pool', carom: '3 Balls', all: 'All', inUse: 'In use', free: 'Free', paused: 'Paused', start: 'Start timer',
    pause: 'Pause', resume: 'Resume', move: 'Move table', editTime: 'Edit time', limit: 'Time limit', cancelTable: 'Cancel table',
    addItems: 'Add items', checkout: 'Checkout', items: 'Items', tableTime: 'Table time', started: 'Started', rate: 'Rate',
    subtotal: 'Subtotal', discount: 'Discount', rounding: 'Rounding', total: 'Total', changeTotal: 'Change total', resetTotal: 'Use calculated total',
    cash: 'Cash', card: 'Card', zelle: 'Zelle', split: 'Split', received: 'Cash received', change: 'Change due', exact: 'Exact',
    confirmPay: 'Confirm payment', done: 'Done', print: 'Print', bills: 'Bills', summary: 'Summary', quickSale: 'Take-away', counterHelp: 'Drinks & snacks – no table',
    noItems: 'No items yet', search: 'Search', close: 'Close', cancel: 'Cancel', ok: 'OK', save: 'Save', remaining: 'Remaining',
    note: 'Customer / note', billed: 'billed', perHour: '/hr', timeUp: 'TIME UP', left: 'left', off: 'Off',
    voidBill: 'Cancel bill', voidReason: 'Reason for cancelling this bill?', voided: 'Cancelled', changeMethod: 'Change payment',
    today: 'Today', count: 'Bills', avg: 'Avg bill', tableRevenue: 'Table time', itemRevenue: 'Items', discounts: 'Discounts',
    confirmCancelTable: 'Cancel this table with no charge? This is recorded for the owner.', confirmStart: 'Start the timer for',
    moveTo: 'Move to which free table?', noFree: 'No free tables', startTime: 'Start time', minutesPlayed: 'Minutes played',
    synced: 'Synced', offline: 'Offline – will sync', local: 'This device only', paid: 'Paid', bill: 'Bill', table: 'Table',
    played: 'Played', time: 'Time', method: 'Method', status: 'Status', amount: 'Amount', thanks: 'Thank you!',
    override: 'Price changed', splitMismatch: 'Split amounts must add up to the total', counter: 'Take-away',
    noBills: 'No bills yet today', cancelledTables: 'Cancelled tables', voids: 'Cancelled bills', lang: 'Tiếng Việt',
    business: 'Business day', printSummary: 'Print summary', limitSet: 'Set a time limit', manager: 'Manager',
    tablesBusy: 'tables in use', reason: 'Reason', tableCancelled: 'Table cancelled', pending: 'Selected – not added yet', fourBall: '4 Balls', perPerson: '/hr/person', players: 'Players', freeTab: 'Open Tables', registerApp: 'Register', signIn: 'Sign in', username: 'Username', password: 'Password', wrongLogin: 'Wrong username or password', notManagerLogin: 'This login can only open the Register, not the Manager', needInternet: 'Connect to the internet to sign in', needInternetHelp: 'The first sign-in on a device needs Wi-Fi. After that it keeps working offline.', retry: 'Try again', tooMany: 'Too many tries. Wait a minute and try again.', signInHelpReg: 'The owner signs in once on each iPad. It stays signed in after that.', signInHelpMgr: 'Owner only.', signOut: 'Sign out this device', signOutConfirm: 'Sign out? Someone will need the Register password to sign in again.', startTime: 'Started at', endTime: 'Ended at', stillRunning: 'Still running', endBeforeStart: 'End time must be after the start time', tapToEdit: 'tap to edit', installHint: 'Install as an app: tap Share ⬆ then "Add to Home Screen".', offlineUse: 'Use on this device only (no sync yet)', offlineHelp: 'Works fully on this device. Nothing from your store is shown here unless the device is connected.', notConnected: 'This device is not connected to a store', notConnectedHelp: 'Open the setup link from the owner\'s Manager app (Manager → Sync & backup) on this device, or paste the setup code below.', setupCode: 'Setup code', connect: 'Connect', changedElsewhere: 'checked out or moved on another device', player: 'Player', playerName: 'Player name', addPlayers: 'Start timers', timersRunning: 'timers running', noteFor: 'Note is for how many of these?', addNote: 'note', addToTable: 'Add to table', clear: 'Clear', more: 'More', tableNote: 'Table note', lineNote: 'Note (who pays, etc.)', keepOrDiscard: 'You picked items but did not add them.', discard: 'Discard', payWith: 'Paid with', paidBy: 'Paid by', bill2: 'Bill', resumeHint: 'Paused – time is not counting', pickMethod: 'Choose how the customer paid', practice: 'Practice', addTimer: 'Add timer', stopTimer: 'Stop timer', delTimer: 'Delete timer', stopCurrent: 'Stop the current timer', switchTable: 'Switch table', pickSource: 'Which table is switching?', pickDest: 'Switch to which table?', mergeInto: 'busy – merge', confirmMerge: 'Merge into a table that is already playing?', running: 'Running', stopped: 'Stopped', other: 'Other $', quick: 'Quick add', editLine: 'Change price', unitPrice: 'Price', pctOff: 'Discount %', free100: 'Free', ratePerHr: 'Rate per hour', pauseAll: 'Pause', resumeAll: 'Resume', startAs: 'Start as', timers: 'Timers', qty: 'Qty', remove: 'Remove', priceChanges: 'Line price changes / practice', notNow: 'Nothing to switch', otherAmount: 'Amount ($)', itemName: 'Name'
  },
  vi: {
    pool: 'Bida lỗ', carom: '3 bi', all: 'Tất cả', inUse: 'Đang chơi', free: 'Trống', paused: 'Tạm dừng', start: 'Bắt đầu tính giờ',
    pause: 'Tạm dừng', resume: 'Tiếp tục', move: 'Chuyển bàn', editTime: 'Sửa giờ', limit: 'Giới hạn giờ', cancelTable: 'Hủy bàn',
    addItems: 'Thêm món', checkout: 'Thanh toán', items: 'Món', tableTime: 'Tiền giờ', started: 'Bắt đầu', rate: 'Giá',
    subtotal: 'Tạm tính', discount: 'Giảm giá', rounding: 'Làm tròn', total: 'Tổng cộng', changeTotal: 'Sửa tổng tiền', resetTotal: 'Dùng tổng tự tính',
    cash: 'Tiền mặt', card: 'Thẻ', zelle: 'Zelle', split: 'Chia', received: 'Khách đưa', change: 'Tiền thối', exact: 'Vừa đủ',
    confirmPay: 'Xác nhận thanh toán', done: 'Xong', print: 'In', bills: 'Hóa đơn', summary: 'Tổng kết', quickSale: 'Mang đi', counterHelp: 'Nước & đồ ăn – không chơi bàn',
    noItems: 'Chưa có món', search: 'Tìm', close: 'Đóng', cancel: 'Hủy', ok: 'OK', save: 'Lưu', remaining: 'Còn lại',
    note: 'Tên khách / ghi chú', billed: 'tính', perHour: '/giờ', timeUp: 'HẾT GIỜ', left: 'còn', off: 'Tắt',
    voidBill: 'Hủy hóa đơn', voidReason: 'Lý do hủy hóa đơn?', voided: 'Đã hủy', changeMethod: 'Đổi cách trả',
    today: 'Hôm nay', count: 'Số HĐ', avg: 'TB / HĐ', tableRevenue: 'Tiền giờ', itemRevenue: 'Tiền món', discounts: 'Giảm giá',
    confirmCancelTable: 'Hủy bàn này không tính tiền? Chủ quán sẽ thấy ghi nhận này.', confirmStart: 'Bắt đầu tính giờ cho',
    moveTo: 'Chuyển sang bàn trống nào?', noFree: 'Không còn bàn trống', startTime: 'Giờ bắt đầu', minutesPlayed: 'Số phút đã chơi',
    synced: 'Đã đồng bộ', offline: 'Mất mạng – sẽ đồng bộ sau', local: 'Chỉ trên máy này', paid: 'Đã trả', bill: 'Hóa đơn', table: 'Bàn',
    played: 'Đã chơi', time: 'Giờ', method: 'Cách trả', status: 'Trạng thái', amount: 'Số tiền', thanks: 'Cảm ơn quý khách!',
    override: 'Đã sửa giá', splitMismatch: 'Tổng các phần phải bằng tổng tiền', counter: 'Mang đi',
    noBills: 'Hôm nay chưa có hóa đơn', cancelledTables: 'Bàn đã hủy', voids: 'Hóa đơn đã hủy', lang: 'English',
    business: 'Ngày làm việc', printSummary: 'In tổng kết', limitSet: 'Đặt giới hạn giờ', manager: 'Quản lý',
    tablesBusy: 'bàn đang chơi', reason: 'Lý do', tableCancelled: 'Bàn đã hủy', pending: 'Đang chọn – chưa thêm', fourBall: '4 bi', perPerson: '/giờ/người', players: 'Người chơi', freeTab: 'Bàn trống', registerApp: 'Thu ngân', signIn: 'Đăng nhập', username: 'Tên đăng nhập', password: 'Mật khẩu', wrongLogin: 'Sai tên đăng nhập hoặc mật khẩu', notManagerLogin: 'Tài khoản này chỉ mở được app Thu ngân, không mở được Quản lý', needInternet: 'Cần kết nối mạng để đăng nhập', needInternetHelp: 'Lần đăng nhập đầu tiên trên máy cần Wi-Fi. Sau đó vẫn dùng được khi mất mạng.', retry: 'Thử lại', tooMany: 'Thử quá nhiều lần. Đợi một phút rồi thử lại.', signInHelpReg: 'Chủ quán đăng nhập một lần trên mỗi iPad. Sau đó app tự giữ đăng nhập.', signInHelpMgr: 'Chỉ dành cho chủ quán.', signOut: 'Đăng xuất máy này', signOutConfirm: 'Đăng xuất? Cần mật khẩu Thu ngân để đăng nhập lại.', startTime: 'Bắt đầu lúc', endTime: 'Kết thúc lúc', stillRunning: 'Vẫn đang chạy', endBeforeStart: 'Giờ kết thúc phải sau giờ bắt đầu', tapToEdit: 'bấm để sửa', installHint: 'Cài như app: bấm Chia sẻ ⬆ rồi "Thêm vào MH chính".', offlineUse: 'Dùng trên máy này (chưa đồng bộ)', offlineHelp: 'Dùng đầy đủ trên máy này. Dữ liệu cửa hàng chỉ hiện khi máy đã kết nối.', notConnected: 'Máy này chưa kết nối với cửa hàng', notConnectedHelp: 'Mở link cài đặt từ app Quản lý của chủ quán (Quản lý → Đồng bộ & sao lưu) trên máy này, hoặc dán mã cài đặt bên dưới.', setupCode: 'Mã cài đặt', connect: 'Kết nối', changedElsewhere: 'đã thanh toán hoặc chuyển ở máy khác', player: 'Người', playerName: 'Tên người chơi', addPlayers: 'Bắt đầu tính giờ', timersRunning: 'giờ đang chạy', noteFor: 'Ghi chú cho mấy cái?', addNote: 'ghi chú', addToTable: 'Thêm vào bàn', clear: 'Xóa chọn', more: 'Thêm', tableNote: 'Ghi chú bàn', lineNote: 'Ghi chú (ai trả, v.v.)', keepOrDiscard: 'Bạn đã chọn món nhưng chưa thêm vào bàn.', discard: 'Bỏ', payWith: 'Trả bằng', paidBy: 'Đã trả bằng', bill2: 'Hóa đơn', resumeHint: 'Đang tạm dừng – không tính giờ', pickMethod: 'Chọn cách khách trả', practice: 'Tập', addTimer: 'Thêm giờ', stopTimer: 'Dừng giờ', delTimer: 'Xóa giờ', stopCurrent: 'Dừng giờ đang chạy', switchTable: 'Chuyển bàn', pickSource: 'Bàn nào muốn chuyển?', pickDest: 'Chuyển sang bàn nào?', mergeInto: 'đang chơi – gộp', confirmMerge: 'Gộp vào bàn đang có khách?', running: 'Đang chạy', stopped: 'Đã dừng', other: 'Khác $', quick: 'Thêm nhanh', editLine: 'Sửa giá', unitPrice: 'Giá', pctOff: 'Giảm %', free100: 'Miễn phí', ratePerHr: 'Giá mỗi giờ', pauseAll: 'Tạm dừng', resumeAll: 'Tiếp tục', startAs: 'Bắt đầu', timers: 'Tính giờ', qty: 'SL', remove: 'Xóa', priceChanges: 'Sửa giá món / giờ tập', notNow: 'Không có bàn để chuyển', otherAmount: 'Số tiền ($)', itemName: 'Tên'
  }
};
let LANG = LS.get('ph_lang', 'en');
const t = k => (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
function setLang(l) { LANG = l; LS.set('ph_lang', l); }

/* ---------- Settings ---------- */
function defaultSettings() {
  const tables = [];
  for (let i = 1; i <= 11; i++) tables.push({ id: 'p' + i, name: String(i), type: 'pool', rate: null });
  for (let i = 1; i <= 5; i++) tables.push({ id: 'c' + i, name: String(i), type: 'carom', rate: null });
  return {
    shopName: 'Pool Hall', address: '', phone: '', receiptFooter: 'Thank you! / Cảm ơn quý khách!',
    dayStartHour: 4, managerPin: '',
    tableTypes: [{ id: 'pool', name: 'Pool', nameVi: 'Bida lỗ', rate: 15 }, { id: 'carom', name: '3 Balls', nameVi: '3 bi', rate: 10 }, { id: '4ball', name: '4 Balls', nameVi: '4 bi', rate: 4, perPerson: true, forType: 'carom' }], added4ball: true, renamed3ball: true,
    tables,
    categories: [{ id: 'drinks', name: 'Drinks', nameVi: 'Nước' }, { id: 'snacks', name: 'Snacks', nameVi: 'Đồ ăn vặt' }],
    items: [1, 2, 3, 4, 5].map(p => ({ id: 'd' + p, name: 'Drink $' + p, price: p, cat: 'drinks', active: true, quick: true }))
      .concat([1, 2, 3, 4, 5].map(p => ({ id: 's' + p, name: 'Snack $' + p, price: p, cat: 'snacks', active: true, quick: true }))),
    billing: {
      timeStep: 0,        // 0 = exact; otherwise round minutes to this step
      timeMode: 'up',     // up | nearest
      extraMin: 0,        // minutes added to every table (e.g. 5 → 1h billed as 1h05)
      minMin: 0,          // minimum billed minutes
      moneyStep: 1,       // 0 = none; 1 = whole dollar; 0.5; 0.25
      moneyMode: 'nearest', // nearest | up | down
      moneyApply: 'total' // total | time
    },
    updatedAt: 0
  };
}
function normSettings(s) {
  const d = defaultSettings();
  if (!s) return d;
  const o = Object.assign({}, d, s);
  o.billing = Object.assign({}, d.billing, s.billing || {});
  for (const k of ['tableTypes', 'tables', 'categories', 'items']) if (!Array.isArray(o[k])) o[k] = d[k];
  if (!s.renamed3ball) { o.tableTypes = o.tableTypes.map(x => x.id === 'carom' && /^carom$/i.test(x.name) ? Object.assign({}, x, { name: '3 Balls', nameVi: '3 bi' }) : x); o.renamed3ball = true; }
  if (!s.added4ball) { o.tableTypes = o.tableTypes.concat(o.tableTypes.some(x => x.perPerson) ? [] : [d.tableTypes.find(x => x.perPerson)]); o.added4ball = true; }
  return o;
}
const typeOf = (S, id) => S.tableTypes.find(x => x.id === id) || { id, name: id, nameVi: id, rate: 0 };
const typeName = (S, id) => { const ty = typeOf(S, id); return LANG === 'vi' ? (ty.nameVi || ty.name) : ty.name; };
const tableOf = (S, id) => S.tables.find(x => x.id === id);
const tableLabel = (S, id) => { if (id === '_counter') return t('counter'); const tb = tableOf(S, id); return tb ? typeName(S, tb.type) + ' ' + tb.name : id; };
const catName = (S, id) => { const c = S.categories.find(x => x.id === id); return c ? (LANG === 'vi' ? (c.nameVi || c.name) : c.name) : id; };
const rateFor = (S, session) => {
  if (session && session.rate != null) return +session.rate;
  const tb = tableOf(S, session && session.tableId);
  if (tb && tb.rate != null && tb.rate !== '') return +tb.rate;
  return tb ? +typeOf(S, tb.type).rate : 0;
};

/* ---------- Billing engine ----------
   A table session holds one or more timers (e.g. pool, then the group moves to carom).
   timer: { id, type, rate ($/hr as charged), baseRate (type rate when started), pct (discount %), startAt, pausedAt, pausedMs, stopAt } */
function normSession(s, S) {
  if (!s || Array.isArray(s.timers)) return s;
  const o = Object.assign({}, s); o.timers = [];
  if (s.startAt && s.tableId !== '_counter') {
    const tb = S && tableOf(S, s.tableId); const r = s.rate != null ? +s.rate : (S ? rateFor(S, s) : 0);
    o.timers.push({ id: 't1', type: tb ? tb.type : 'pool', rate: r, baseRate: r, pct: 0, startAt: s.startAt, pausedAt: s.pausedAt || null, pausedMs: s.pausedMs || 0, stopAt: null });
  }
  return o;
}
function newTimer(S, type, pct = 0, at = Date.now()) { const r = +typeOf(S, type).rate || 0; return { id: uid(6), type, rate: r, baseRate: r, pct: +pct || 0, startAt: at, pausedAt: null, pausedMs: 0, stopAt: null }; }
function timerMs(tm, at) {
  if (!tm || !tm.startAt) return 0;
  let end = at; if (tm.stopAt) end = Math.min(end, tm.stopAt); if (tm.pausedAt) end = Math.min(end, tm.pausedAt);
  return Math.max(0, end - tm.startAt - (tm.pausedMs || 0));
}
const effRate = tm => (+tm.rate || 0) * (1 - (+tm.pct || 0) / 100);
const isOpenTimer = tm => !tm.stopAt;
const isRunning = tm => !tm.stopAt && !tm.pausedAt;
function playedMs(sess, at) { return ((sess && sess.timers) || []).reduce((a, tm) => a + timerMs(tm, at), 0); }
function sessPaused(sess) { const o = ((sess && sess.timers) || []).filter(isOpenTimer); return o.length > 0 && o.every(x => x.pausedAt); }
function curTimer(sess) { const ts = (sess && sess.timers) || []; return ts.filter(isOpenTimer).slice(-1)[0] || ts.slice(-1)[0]; }
function pauseTimer(tm, at) { if (tm.stopAt || tm.pausedAt) return tm; return Object.assign({}, tm, { pausedAt: at }); }
function resumeTimer(tm, at) { if (!tm.pausedAt || tm.stopAt) return tm; return Object.assign({}, tm, { pausedMs: (tm.pausedMs || 0) + (at - tm.pausedAt), pausedAt: null }); }
function stopTimer(tm, at) { if (tm.stopAt) return tm; const t2 = tm.pausedAt ? resumeTimer(tm, tm.pausedAt) : tm; return Object.assign({}, t2, { stopAt: tm.pausedAt || at, pausedAt: null }); }
function billedMinutes(ms, B) {
  let m = Math.max(0, ms / 60000);
  if (m <= 0) return 0;
  m += +B.extraMin || 0;
  const st = +B.timeStep || 0;
  if (st > 0) { const q = m / st; m = (B.timeMode === 'nearest' ? Math.round(q) : Math.ceil(q - 1e-9)) * st; }
  else m = Math.floor(m + 1e-9); // exact: whole minutes, seconds ignored
  if (+B.minMin && m < +B.minMin) m = +B.minMin;
  return m;
}
function roundMoneyC(c, B) {
  const st = Math.round((+B.moneyStep || 0) * 100);
  if (!st) return c;
  const q = c / st;
  const r = B.moneyMode === 'up' ? Math.ceil(q - 1e-9) : B.moneyMode === 'down' ? Math.floor(q + 1e-9) : Math.floor(q + 0.5 + 1e-9);
  return r * st;
}
const itemLineC = i => Math.round(toC(i.price) * i.qty * (1 - (+i.pct || 0) / 100));
/* adj: { discType:'amt'|'pct', discVal, override } */
function computeBill(S, sess, at, adj = {}) {
  const B = S.billing; sess = normSession(sess, S) || { timers: [], items: [] };
  let adjC = 0;
  const timers = (sess.timers || []).map(tm => {
    const ms = timerMs(tm, at); const bMin = billedMinutes(ms, B); const er = effRate(tm);
    const c = Math.round(er * bMin / 60 * 100); const base = Math.round((+tm.baseRate || +tm.rate || 0) * bMin / 60 * 100); adjC += base - c;
    return { id: tm.id, type: tm.type, rate: +tm.rate || 0, baseRate: +tm.baseRate || +tm.rate || 0, pct: +tm.pct || 0, effRate: er, playedMin: ms / 60000, billedMin: bMin, amount: toD(c), startAt: tm.startAt, stopAt: tm.stopAt || null, note: tm.note || '' };
  });
  let timeC = timers.reduce((a, x) => a + toC(x.amount), 0);
  let timeRoundC = 0;
  if (B.moneyApply === 'time' && timeC) { const r = roundMoneyC(timeC, B); timeRoundC = r - timeC; timeC = r; }
  const items = (sess.items || []).filter(i => i.qty > 0).map(i => { const lc = itemLineC(i); adjC += Math.round(toC(i.basePrice ?? i.price) * i.qty) - lc; return Object.assign({}, i, { line: toD(lc) }); });
  const itemsC = items.reduce((a, i) => a + toC(i.line), 0);
  const subC = timeC + itemsC;
  let discC = 0; const dv = +adj.discVal || 0;
  if (dv > 0) discC = adj.discType === 'pct' ? Math.round(subC * Math.min(dv, 100) / 100) : Math.min(toC(dv), subC);
  const afterC = subC - discC;
  let roundC = 0, totC = afterC;
  if (B.moneyApply !== 'time') { totC = roundMoneyC(afterC, B); roundC = totC - afterC; }
  roundC += timeRoundC;
  const overridden = adj.override != null && adj.override !== '' && !isNaN(+adj.override);
  if (overridden) totC = Math.max(0, toC(adj.override));
  const pm = timers.reduce((a, x) => a + x.playedMin, 0);
  return {
    playedMs: pm * 60000, playedMin: pm, billedMin: timers.reduce((a, x) => a + x.billedMin, 0), rate: timers.length ? timers[timers.length - 1].effRate : 0,
    timers, time: toD(timeC), items: clone(items), itemsTotal: toD(itemsC), subtotal: toD(subC), lineAdjust: toD(adjC),
    discType: adj.discType || 'amt', discVal: dv, discount: toD(discC), rounding: toD(roundC),
    calcTotal: toD(B.moneyApply !== 'time' ? roundMoneyC(afterC, B) : afterC), overridden, total: toD(totC)
  };
}
const timerLabel = (S, x) => typeName(S, x.type) + (typeOf(S, x.type).perPerson && x.note ? ' · ' + x.note : '') + (+x.pct === 50 ? ' · ' + t('practice') + ' ½' : x.pct ? ` −${x.pct}%` : '');

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(msg) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}
function modal(html, onMount) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal">${html}</div>`;
    document.body.appendChild(bg);
    const close = v => { bg.remove(); res(v); };
    bg.addEventListener('click', e => { if (e.target === bg) close(null); });
    onMount && onMount(bg, close);
  });
}
function confirmBox(msg, okLabel = t('ok'), danger = false) {
  return modal(`<p style="margin:0 0 16px;font-size:17px">${esc(msg)}</p><div class="row"><button class="grow ghost" data-a="n">${esc(t('cancel'))}</button><button class="grow ${danger ? 'danger' : 'primary'}" data-a="y">${esc(okLabel)}</button></div>`,
    (bg, close) => { $('[data-a=n]', bg).onclick = () => close(false); $('[data-a=y]', bg).onclick = () => close(true); });
}
function promptBox(title, value = '', type = 'text', extra = '') {
  return modal(`<h3>${esc(title)}</h3>${extra}<input id="pb-in" type="${type}" ${type === 'number' ? 'inputmode="decimal" step="any"' : ''} value="${esc(value)}"><div class="row" style="margin-top:14px"><button class="grow ghost" data-a="n">${esc(t('cancel'))}</button><button class="grow primary" data-a="y">${esc(t('ok'))}</button></div>`,
    (bg, close) => { const i = $('#pb-in', bg); setTimeout(() => i.focus(), 50); $('[data-a=n]', bg).onclick = () => close(null); $('[data-a=y]', bg).onclick = () => close(i.value); i.onkeydown = e => { if (e.key === 'Enter') close(i.value); }; });
}
function openPanel(html, { onClose, key, wide, beforeClose } = {}) {
  let ov = $('#panel');
  if (ov) { // re-render in place (no flicker); keep scroll when it is the same screen
    const b = $('.panel-b', ov); const top = b ? b.scrollTop : 0; const same = key && ov._key === key;
    ov.firstChild.innerHTML = html;
    if (same) { const nb = $('.panel-b', ov); if (nb) nb.scrollTop = top; }
  } else {
    ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'panel';
    ov.innerHTML = `<div class="panel">${html}</div>`;
    ov.addEventListener('click', e => { if (e.target === ov) closePanel(); });
    document.body.appendChild(ov);
  }
  ov.firstChild.className = 'panel' + (wide ? ' wide' : '');
  ov._onClose = onClose; ov._key = key; ov._beforeClose = beforeClose;
  $$('[data-close]', ov).forEach(b => b.onclick = () => closePanel());
  return ov;
}
function closePanel(force) { const p = $('#panel'); if (!p) return; if (!force && p._beforeClose && p._beforeClose() === false) return; p.remove(); p._onClose && p._onClose(); }

/* ---------- Receipt ---------- */
function receiptHTML(S, b) {
  const L = (a, c) => `<div class="l"><span>${a}</span><span>${c}</span></div>`;
  let h = `<div class="c b" style="font-size:15px">${esc(S.shopName)}</div>`;
  if (S.address) h += `<div class="c">${esc(S.address)}</div>`;
  if (S.phone) h += `<div class="c">${esc(S.phone)}</div>`;
  h += `<hr>${L(esc(t('bill')) + ' #' + esc(b.no), '')}${L(esc(b.tableLabel), dateTimeOf(b.paidAt || b.endAt))}`;
  const tl = b.timers || (b.time ? [{ type: b.tableType, effRate: b.rate, billedMin: b.billedMin, amount: b.time, pct: 0 }] : []);
  if (tl.length) {
    h += `<hr>${L(esc(t('started')), timeOf(b.startAt))}${L(esc(t('played')), hm(b.playedMin))}`;
    for (const x of tl) h += L(`${esc(timerLabel(S, x))}<br>&nbsp;${hm(x.billedMin)} × ${money(x.effRate)}${esc(t('perHour'))}`, money(x.amount));
  }
  if (b.items && b.items.length) { h += '<hr>'; for (const i of b.items) h += L(`${i.qty} × ${esc(i.name)}${i.pct ? ` −${i.pct}%` : ''}`, money(i.line ?? i.price * i.qty)); }
  h += `<hr>${L(esc(t('subtotal')), money(b.subtotal))}`;
  if (b.discount) h += L(esc(t('discount')) + (b.discType === 'pct' ? ` ${b.discVal}%` : ''), '-' + money(b.discount));
  if (b.rounding && !b.overridden) h += L(esc(t('rounding')), money(b.rounding));
  if (b.overridden) h += L(esc(t('override')), '');
  h += `<div class="l b" style="font-size:16px;margin-top:4px"><span>${esc(t('total'))}</span><span>${money(b.total)}</span></div>`;
  const p = b.payments || {};
  for (const m of ['cash', 'card', 'zelle']) if (p[m]) h += L(esc(t(m)), money(p[m]));
  if (b.cashReceived) { h += L(esc(t('received')), money(b.cashReceived)); h += L(esc(t('change')), money(b.cashReceived - (p.cash || 0))); }
  if (b.status === 'void') h += `<hr><div class="c b">*** ${esc(t('voided'))} ***</div>`;
  if (b.note) h += `<hr><div>${esc(b.note)}</div>`;
  h += `<hr><div class="c">${esc(S.receiptFooter || '')}</div>`;
  return h;
}
function printHTML(html) {
  let el = $('#print'); if (!el) { el = document.createElement('div'); el.id = 'print'; document.body.appendChild(el); }
  el.innerHTML = `<div class="rcpt" style="max-width:none;padding:0">${html}</div>`;
  setTimeout(() => window.print(), 60);
}
const methodOf = b => { const p = b.payments || {}; const ms = ['cash', 'card', 'zelle'].filter(m => p[m]); return ms.length > 1 ? 'split' : (ms[0] || 'cash'); };

/* ---------- Summary math (used by both apps) ---------- */
function summarize(S, bills) {
  const r = { count: 0, total: 0, cash: 0, card: 0, zelle: 0, time: 0, items: 0, discount: 0, rounding: 0, overrides: 0, minutes: 0, lineAdjust: 0,
    voidCount: 0, voidTotal: 0, cancelCount: 0, cancelMin: 0, byType: {}, byItem: {}, byTable: {}, byHour: Array(24).fill(0) };
  for (const b of bills) {
    if (b.status === 'void') { r.voidCount++; r.voidTotal += b.total || 0; continue; }
    if (b.status === 'cancelled') { r.cancelCount++; r.cancelMin += b.playedMin || 0; continue; }
    r.count++; r.total += b.total;
    const p = b.payments || {}; r.cash += p.cash || 0; r.card += p.card || 0; r.zelle += p.zelle || 0;
    r.time += b.time || 0; r.items += b.itemsTotal || 0; r.discount += b.discount || 0; r.rounding += b.rounding || 0; r.lineAdjust += b.lineAdjust || 0;
    if (b.overridden) r.overrides++;
    r.minutes += b.playedMin || 0;
    const tl = b.timers || (b.time ? [{ type: b.tableType, playedMin: b.playedMin, amount: b.time }] : []);
    for (const x of tl) { const ty = x.type || 'other'; r.byType[ty] = r.byType[ty] || { time: 0, minutes: 0, count: 0 }; r.byType[ty].time += x.amount || 0; r.byType[ty].minutes += x.playedMin || 0; r.byType[ty].count++; }
    if (b.tableId && b.tableId !== '_counter') {
      const tk = b.tableLabel || b.tableId;
      r.byTable[tk] = r.byTable[tk] || { minutes: 0, revenue: 0, count: 0 }; r.byTable[tk].minutes += b.playedMin || 0; r.byTable[tk].revenue += b.total; r.byTable[tk].count++;
    }
    for (const i of b.items || []) { const k = i.name; r.byItem[k] = r.byItem[k] || { qty: 0, revenue: 0 }; r.byItem[k].qty += i.qty; r.byItem[k].revenue += i.line ?? i.qty * i.price; }
    r.byHour[new Date(b.paidAt || b.endAt).getHours()] += b.total;
  }
  for (const k of ['total', 'cash', 'card', 'zelle', 'time', 'items', 'discount', 'rounding', 'voidTotal', 'lineAdjust']) r[k] = Math.round(r[k] * 100) / 100;
  return r;
}

/* ---------- Data layer ---------- */
const cleanData = o => JSON.parse(JSON.stringify(o)); // strips undefined (Firestore rejects it)

class LocalDB {
  constructor() {
    this.mode = 'local'; this.subs = { settings: new Set(), sessions: new Set(), bills: new Set() };
    addEventListener('storage', e => { if (e.key && e.key.startsWith('ph_l_')) this._emit(e.key.slice(5)); });
  }
  _r(n, d) { return LS.get('ph_l_' + n, d); }
  _w(n, v) { LS.set('ph_l_' + n, v); this._emit(n); }
  _emit(n) { for (const f of this.subs[n] || []) f(); }
  _sub(n, f) { f(); this.subs[n].add(f); return () => this.subs[n].delete(f); }
  onSettings(cb) { return this._sub('settings', () => cb(this._r('settings', null))); }
  onSessions(cb) { return this._sub('sessions', () => cb(this._r('sessions', {}))); }
  onBills(from, to, cb) { return this._sub('bills', () => cb(this._r('bills', []).filter(b => b.day >= from && b.day <= to))); }
  onStatus(cb) { cb('local'); return () => { }; }
  async saveSettings(s) { this._w('settings', cleanData(s)); }
  async setSession(id, s) { const m = this._r('sessions', {}); m[id] = cleanData(s); this._w('sessions', m); }
  async delSession(id) { const m = this._r('sessions', {}); delete m[id]; this._w('sessions', m); }
  async moveSession(from, to, s) { const m = this._r('sessions', {}); delete m[from]; m[to] = cleanData(s); this._w('sessions', m); }
  async checkout(bill, tableId) {
    const b = this._r('bills', []); b.push(cleanData(bill)); LS.set('ph_l_bills', b);
    if (tableId) { const m = this._r('sessions', {}); delete m[tableId]; LS.set('ph_l_sessions', m); }
    this._emit('bills'); this._emit('sessions');
  }
  async updateBill(id, patch) { const b = this._r('bills', []); const x = b.find(y => y.id === id); if (x) Object.assign(x, cleanData(patch)); this._w('bills', b); }
  async exportAll() { return { settings: this._r('settings', null), bills: this._r('bills', []) }; }
  async importAll(d) { if (d.settings) this._w('settings', d.settings); if (Array.isArray(d.bills)) { const b = this._r('bills', []); const ids = new Set(b.map(x => x.id)); for (const x of d.bills) if (!ids.has(x.id)) b.push(x); this._w('bills', b); } }
}

class FireDB {
  async init(cfg, key, app) {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VER}/`;
    const A = await import(base + 'firebase-app.js');
    const F = await import(base + 'firebase-firestore.js');
    this.F = F; this.mode = 'cloud'; this.key = key;
    const name = 'ph-' + key.slice(0, 6);
    this.app = app || A.getApps().find(a => a.name === name) || A.initializeApp(cfg, name);
    try { this.db = F.initializeFirestore(this.app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
    catch (e) { this.db = F.getFirestore(this.app); }
    // quick reachability/permission check (resolves from cache if offline)
    await Promise.race([F.getDoc(this._settingsRef()).catch(e => { if (String(e.code).includes('permission')) throw e; }), new Promise(r => setTimeout(r, 6000))]);
    return this;
  }
  _col(n) { return this.F.collection(this.db, 'stores', this.key, n); }
  _settingsRef() { return this.F.doc(this.db, 'stores', this.key, 'meta', 'settings'); }
  onSettings(cb) { return this.F.onSnapshot(this._settingsRef(), s => cb(s.exists() ? s.data() : null), e => console.error(e)); }
  onSessions(cb) { return this.F.onSnapshot(this._col('sessions'), qs => { const m = {}; qs.forEach(d => m[d.id] = d.data()); cb(m); }, e => console.error(e)); }
  onBills(from, to, cb) {
    const F = this.F; const q = F.query(this._col('bills'), F.where('day', '>=', from), F.where('day', '<=', to));
    return F.onSnapshot(q, qs => { const a = []; qs.forEach(d => a.push(d.data())); cb(a); }, e => console.error(e));
  }
  onStatus(cb) {
    const F = this.F;
    const upd = () => cb(navigator.onLine ? (this._fromCache ? 'off' : 'ok') : 'off');
    const un = F.onSnapshot(this._settingsRef(), { includeMetadataChanges: true }, s => { this._fromCache = s.metadata.fromCache; upd(); }, () => { });
    addEventListener('online', upd); addEventListener('offline', upd); upd();
    return un;
  }
  saveSettings(s) { return this.F.setDoc(this._settingsRef(), cleanData(s)); }
  setSession(id, s) { return this.F.setDoc(this.F.doc(this._col('sessions'), id), cleanData(s)); }
  delSession(id) { return this.F.deleteDoc(this.F.doc(this._col('sessions'), id)); }
  moveSession(from, to, s) { const b = this.F.writeBatch(this.db); b.delete(this.F.doc(this._col('sessions'), from)); b.set(this.F.doc(this._col('sessions'), to), cleanData(s)); return b.commit(); }
  checkout(bill, tableId) { const b = this.F.writeBatch(this.db); b.set(this.F.doc(this._col('bills'), bill.id), cleanData(bill)); if (tableId) b.delete(this.F.doc(this._col('sessions'), tableId)); return b.commit(); }
  updateBill(id, patch) { return this.F.updateDoc(this.F.doc(this._col('bills'), id), cleanData(patch)); }
  async exportAll() {
    const s = await this.F.getDoc(this._settingsRef()); const qs = await this.F.getDocs(this._col('bills'));
    const bills = []; qs.forEach(d => bills.push(d.data())); return { settings: s.exists() ? s.data() : null, bills };
  }
  async importAll(d) {
    if (d.settings) await this.saveSettings(d.settings);
    const bills = d.bills || [];
    for (let i = 0; i < bills.length; i += 400) { const b = this.F.writeBatch(this.db); for (const x of bills.slice(i, i + 400)) b.set(this.F.doc(this._col('bills'), x.id), cleanData(x)); await b.commit(); }
  }
}

/* Connection config: { cfg: firebaseConfig, key: storeKey } kept on each device */
function encodeConn(c) { return btoa(unescape(encodeURIComponent(JSON.stringify(c)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decodeConn(s) { s = s.trim().replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
function parseFirebaseConfig(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('No { … } found');
  let j = text.slice(a, b + 1).replace(/\/\/.*$/gm, '').replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*}/g, '}');
  const o = JSON.parse(j);
  if (!o.apiKey || !o.projectId) throw new Error('apiKey / projectId missing');
  return o;
}
function takeConnectParam() {
  const u = new URL(location.href); const c = u.searchParams.get('connect');
  if (!c) return false;
  try { const conn = decodeConn(c); if (conn.cfg && conn.key) LS.set('ph_conn', conn); } catch (e) { alert('Invalid setup link'); }
  u.searchParams.delete('connect'); history.replaceState(null, '', u.pathname + u.search + u.hash);
  return true;
}
/* ---------- Cloud (Firebase) + sign-in ---------- */
const CLOUD = {
  cfg: { apiKey: 'AIzaSyCb5s00twwPvjMquF-P0EklOBd-y6qNC7Q', authDomain: 'buivienpool.firebaseapp.com', projectId: 'buivienpool',
    storageBucket: 'buivienpool.firebasestorage.app', messagingSenderId: '445448335385', appId: '1:445448335385:web:74335f8de5b63bdcd2ba88' },
  store: 'main', domain: 'buivienpool.firebaseapp.com'
};
const loginEmail = u => { u = String(u || '').trim().toLowerCase(); return u.includes('@') ? u : u + '@' + CLOUD.domain; };
const roleOf = u => !u ? null : u.email === loginEmail('manager') ? 'manager' : u.email === loginEmail('register') ? 'register' : 'other';
let AUTH = null;
async function loadAuth() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VER}/`;
  const A = await import(base + 'firebase-app.js'); const Au = await import(base + 'firebase-auth.js');
  const app = A.getApps().find(x => x.name === '[DEFAULT]') || A.initializeApp(CLOUD.cfg);
  const auth = Au.getAuth(app);
  const user = await new Promise(res => { const un = Au.onAuthStateChanged(auth, u => { un(); res(u); }); });
  return (AUTH = { A, Au, app, auth, user });
}
function loginScreen(page, a) {
  const need = page === 'manager' ? ['manager'] : ['register', 'manager'];
  return new Promise(res => {
    const el = document.createElement('div'); el.className = 'login';
    const draw = () => {
      el.innerHTML = `<form class="login-box" autocomplete="on"><div class="small muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">${esc(page === 'manager' ? t('manager') : t('registerApp'))}</div><h1>${esc(t('signIn'))}</h1>
        <label>${esc(t('username'))}</label><input name="username" autocomplete="username" autocapitalize="off" value="${page === 'manager' ? 'manager' : 'register'}">
        <label>${esc(t('password'))}</label><input name="password" type="password" autocomplete="current-password">
        <p class="small" id="lg-err" style="color:var(--red);min-height:18px;margin:8px 0"></p>
        <button class="primary big" style="width:100%" type="submit">${esc(t('signIn'))}</button>
        <p class="small muted" style="margin-top:14px">${esc(page === 'manager' ? t('signInHelpMgr') : t('signInHelpReg'))}</p>
        <button type="button" class="ghost" id="lg-lang">${esc(t('lang'))}</button></form>`;
      $('#lg-lang', el).onclick = () => { setLang(LANG === 'en' ? 'vi' : 'en'); draw(); };
      $('form', el).onsubmit = async e => {
        e.preventDefault(); const f = e.target; const btn = $('button[type=submit]', el); btn.disabled = true; $('#lg-err', el).textContent = '';
        try {
          await a.Au.signInWithEmailAndPassword(a.auth, loginEmail(f.username.value), f.password.value);
          if (!need.includes(roleOf(a.auth.currentUser))) { await a.Au.signOut(a.auth); throw { code: 'role' }; }
          el.remove(); res();
        } catch (er) {
          const c = String(er && er.code || '');
          $('#lg-err', el).textContent = c === 'role' ? t('notManagerLogin') : c.includes('network') ? t('needInternet') : c.includes('too-many') ? t('tooMany') : t('wrongLogin');
          btn.disabled = false; f.password.select();
        }
      };
      setTimeout(() => { const pw = $('[name=password]', el); pw && pw.focus(); }, 50);
    };
    draw(); document.body.appendChild(el);
  });
}
async function openDB(page) {
  if (window.PH_DEMO) return new LocalDB();
  let a;
  try { a = await loadAuth(); }
  catch (e) { console.error(e); document.body.innerHTML = `<div class="login"><div class="login-box"><h1>${esc(t('needInternet'))}</h1><p class="muted">${esc(t('needInternetHelp'))}</p><button class="primary big" style="width:100%" onclick="location.reload()">${esc(t('retry'))}</button></div></div>`; throw e; }
  const need = page === 'manager' ? ['manager'] : ['register', 'manager'];
  if (!a.user || !need.includes(roleOf(a.user))) { if (a.user) await a.Au.signOut(a.auth); await loginScreen(page, a); }
  const db = await new FireDB().init(CLOUD.cfg, CLOUD.store, a.app);
  db.role = roleOf(a.auth.currentUser); db.email = a.auth.currentUser.email;
  return db;
}
async function signOutDevice() { try { if (AUTH) await AUTH.Au.signOut(AUTH.auth); } catch (e) { } location.reload(); }
async function changeRegisterPassword(oldP, newP) { // owner changes the shared Register login; every iPad then has to sign in again
  const { A, Au } = AUTH; const app2 = A.getApps().find(x => x.name === 'pw') || A.initializeApp(CLOUD.cfg, 'pw');
  const auth2 = Au.getAuth(app2);
  const cred = await Au.signInWithEmailAndPassword(auth2, loginEmail('register'), oldP);
  await Au.updatePassword(cred.user, newP); await Au.signOut(auth2);
}
async function changeOwnPassword(oldP, newP) {
  const { Au, auth } = AUTH; const u = auth.currentUser;
  await Au.reauthenticateWithCredential(u, Au.EmailAuthProvider.credential(u.email, oldP)); await Au.updatePassword(u, newP);
}
function statusDot(el, st) { el.className = 'dot ' + (st === 'ok' ? 'ok' : st === 'off' ? 'off' : ''); el.textContent = st === 'ok' ? t('synced') : st === 'off' ? t('offline') : t('local'); }
function registerSW() { if (window.PH_DEMO) return; if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { }); }

/* ---------- Demo data (used only by the in-Claude demo) ---------- */
function seedDemo() {
  const S = defaultSettings(); const now = Date.now(); const M = 60000;
  const sess = {};
  const T = (type, ago, pct = 0) => newTimer(S, type, pct, now - ago * M);
  const mk = (tid, timers, items, note = '') => sess[tid] = { tableId: tid, openedAt: timers[0].startAt, timers, items, note, limitMin: 0 };
  const it = (id, qty) => { const x = S.items.find(i => i.id === id); return { id, name: x.name, price: x.price, basePrice: x.price, qty }; };
  mk('p2', [T('pool', 52)], [it('d3', 2)]);
  mk('p5', [T('pool', 80, 50)], [], 'Anh Tuấn');
  mk('p9', [T('pool', 18)], []);
  const old = T('pool', 95); old.stopAt = now - 35 * M; mk('c1', [old, T('carom', 35)], [it('d4', 1), it('s2', 1)], 'From Pool 4');
  const fb = ['Nam', 'Hùng', 'Tí'].map((nm, k) => Object.assign(T('4ball', 64 - (k === 2 ? 20 : 0)), { note: nm })); mk('c4', fb, [it('d2', 2)]);
  const pz = T('carom', 41); pz.pausedAt = now - 6 * M; mk('c3', [pz], [it('d1', 3)]);
  const bills = []; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let d = 6; d >= 0; d--) {
    const n = 10 + Math.floor(rnd() * 10);
    for (let k = 0; k < n; k++) {
      const tb = S.tables[Math.floor(rnd() * S.tables.length)];
      const base = new Date(); base.setDate(base.getDate() - d); base.setHours(13, 0, 0, 0);
      const dur = (15 + rnd() * 140) * M; const start = d === 0 ? now - dur - rnd() * 6 * 3600e3 : base.getTime() + rnd() * 11 * 3600e3, end = start + dur;
      if (end > now - 5 * M) continue;
      const tm = newTimer(S, tb.type, rnd() < 0.12 ? 50 : 0, start); tm.stopAt = end;
      const s1 = { tableId: tb.id, timers: [tm], items: [] };
      for (let j = Math.floor(rnd() * 4); j > 0; j--) { const x = S.items[Math.floor(rnd() * S.items.length)]; const ex = s1.items.find(y => y.id === x.id); if (ex) ex.qty++; else s1.items.push(it(x.id, 1)); }
      const c = computeBill(S, s1, end, rnd() < 0.08 ? { discType: 'pct', discVal: 10 } : {});
      const r = rnd(), m = r < 0.5 ? 'cash' : r < 0.85 ? 'card' : 'zelle';
      const b = Object.assign({ id: uid(14), no: dayKey(end, 4).slice(5).replace('-', '') + '-' + uid(4).toUpperCase(), tableId: tb.id, tableLabel: tableLabel(S, tb.id), tableType: tb.type,
        startAt: start, endAt: end, paidAt: end + M, day: dayKey(end, S.dayStartHour), status: 'paid', note: '' }, c, { payments: { [m]: c.total }, cashReceived: 0 });
      const q = rnd(); if (q < 0.04) { b.status = 'cancelled'; b.cancelledTotal = b.total; b.total = 0; } else if (q < 0.06) { b.status = 'void'; b.voidReason = 'Wrong table'; b.voidAt = end + 5 * M; }
      bills.push(b);
    }
  }
  LS.set('ph_l_settings', S); LS.set('ph_l_sessions', sess); LS.set('ph_l_bills', bills);
}

const DEMO_VER = '3';

/* ---------- Security gate: a hosted copy that is not connected to a store shows nothing ---------- */
function needsSetup(db) { return db.mode === 'local' && !window.PH_DEMO && location.protocol === 'https:' && !LS.get('ph_local_ok', false); }
function setupGate(which) {
  document.body.innerHTML = `<div style="max-width:440px;margin:12vh auto;padding:24px;text-align:center">
    <div style="font-size:54px">🔒</div><h2>${esc(t('notConnected'))}</h2><p class="muted">${esc(t('notConnectedHelp'))}</p>
    <input id="g-code" placeholder="${esc(t('setupCode'))}" style="margin-top:10px"><button class="primary big" id="g-go" style="width:100%;margin-top:10px">${esc(t('connect'))}</button>
    <div style="margin:22px 0 8px;color:var(--muted)">— or —</div><button class="big" id="g-local" style="width:100%">${esc(t('offlineUse'))}</button><p class="small muted">${esc(t('offlineHelp'))}</p>
    <p><button class="ghost" id="g-lang" style="margin-top:14px">${esc(t('lang'))}</button></p></div>`;
  $('#g-local').onclick = () => { LS.set('ph_local_ok', true); location.reload(); };
  $('#g-lang').onclick = () => { setLang(LANG === 'en' ? 'vi' : 'en'); setupGate(which); };
  $('#g-go').onclick = () => { try { const c = decodeConn($('#g-code').value); if (!c.cfg || !c.key) throw 0; LS.set('ph_conn', c); location.reload(); } catch (e) { toast('Invalid code'); } };
}

/* ---------- iOS-style time wheel (hours & minutes loop around: …11, 12, 1, 2… / …58, 59, 00, 01…) ---------- */
const WH = 40;
const WCOLS = { h: { n: 12, k: 9, lbl: i => i + 1 }, m: { n: 60, k: 7, lbl: i => pad(i) }, p: { n: 2, k: 1, lbl: i => ['AM', 'PM'][i] } };
function wheelHTML() {
  const pads = '<div class="wi"></div><div class="wi"></div>';
  const col = c => { const { n, k, lbl } = WCOLS[c]; let h = ''; for (let j = 0; j < n * k; j++) h += `<div class="wi">${lbl(j % n)}</div>`; return `<div class="wcol" data-c="${c}">${pads}${h}${pads}</div>`; };
  return `<div class="wheel"><div class="whl"></div>${col('h')}${col('m')}${col('p')}</div>`;
}
const wIdx = c => Math.round(c.scrollTop / WH);
function wheelPut(c, v) { const { n, k } = WCOLS[c.dataset.c]; c.scrollTop = (Math.floor(k / 2) * n + v) * WH; wheelMark(c); }
function wheelSet(root, ts) {
  const d = new Date(ts); const h = d.getHours();
  const val = { h: (h % 12 || 12) - 1, m: d.getMinutes(), p: h >= 12 ? 1 : 0 };
  for (const c of $$('.wcol', root)) wheelPut(c, val[c.dataset.c]);
}
function wheelMark(c) {
  const items = c.children; const pos = c.scrollTop / WH; const i = Math.round(pos);
  if (c._lo != null) for (let k = c._lo; k <= c._hi; k++) if (items[k]) { items[k].style.transform = ''; items[k].style.opacity = ''; items[k].classList.remove('on'); }
  c._lo = Math.max(2, i - 4); c._hi = Math.min(items.length - 3, i + 6);
  for (let k = c._lo; k <= c._hi; k++) { const d = (k - 2) - pos; const el = items[k]; el.style.transform = `perspective(420px) rotateX(${(-d * 21).toFixed(1)}deg) scale(${(1 - Math.min(Math.abs(d), 3) * 0.06).toFixed(3)})`; el.style.opacity = (1 - Math.min(Math.abs(d) * 0.28, 0.85)).toFixed(2); el.classList.toggle('on', k - 2 === i); }
}
function wheelVal(c) { const { n } = WCOLS[c.dataset.c]; return ((wIdx(c) % n) + n) % n; }
function wheelGet(root) { // -> {h (0-23), m}
  const v = {}; for (const c of $$('.wcol', root)) v[c.dataset.c] = wheelVal(c);
  return { h: ((v.h + 1) % 12) + (v.p ? 12 : 0), m: v.m };
}
function wheelWire(root, onChange) {
  for (const c of $$('.wcol', root)) {
    let tmr;
    c.addEventListener('scroll', () => {
      wheelMark(c); clearTimeout(tmr);
      tmr = setTimeout(() => { // recentre into the middle copy so it never runs out
        const { n, k } = WCOLS[c.dataset.c];
        if (k > 1) { const i = wIdx(c); if (i < n * 2 || i >= n * (k - 2)) wheelPut(c, ((i % n) + n) % n); }
        onChange && onChange();
      }, 140);
    });
    c.addEventListener('click', e => { const el = e.target.closest('.wi'); if (!el || !el.textContent) return; const k = [...c.children].indexOf(el) - 2; c.scrollTo({ top: k * WH, behavior: 'smooth' }); });
  }
}

/* ---------- "Install as app" hint on iPhone / iPad Safari ---------- */
function installHint() {
  try {
    if (window.PH_DEMO || navigator.standalone || matchMedia('(display-mode: standalone)').matches) return;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!ios || LS.get('ph_install_hint_off', false)) return;
    const el = document.createElement('div'); el.className = 'installbar';
    el.innerHTML = `<span style="font-size:26px">📲</span><span class="grow">${esc(t('installHint'))}</span><button style="background:#fff;color:#16324f;min-height:38px" id="ih-x">${esc(t('ok'))}</button>`;
    document.body.appendChild(el); $('#ih-x').onclick = () => { LS.set('ph_install_hint_off', true); el.remove(); };
  } catch (e) { }
}

/* ---------- Time picker: the real iOS wheel on iPhone/iPad, the look-alike wheel elsewhere ---------- */
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function timePickerHTML(k) { return IS_IOS ? `<input type="time" class="tp-native" data-tp="${k}">` : `<div data-tp="${k}">${wheelHTML()}</div>`; }
function timePicker(root, k, ts, onChange) {
  const el = $(`[data-tp="${k}"]`, root);
  if (el.tagName === 'INPUT') {
    el.value = hhmm(ts); el.addEventListener('input', () => onChange && onChange()); el.addEventListener('change', () => onChange && onChange());
    return { get: () => { const [h, m] = (el.value || hhmm(ts)).split(':').map(Number); return { h, m }; }, set: t2 => { el.value = hhmm(t2); } };
  }
  const wh = $('.wheel', el); wheelWire(wh, onChange); requestAnimationFrame(() => wheelSet(wh, ts));
  return { get: () => wheelGet(wh), set: t2 => wheelSet(wh, t2) };
}
const atTime = ({ h, m }, ref) => { const d = new Date(ref); d.setHours(h, m, 0, 0); let x = d.getTime(); if (x > ref + 60000) x -= 86400000; return x; };

/* ---------- Icons: one consistent line-icon set; symbols in the UI text are swapped for these automatically ---------- */
const ICONS = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  swap: '<path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 2M9.5 2.5h5"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  cup: '<path d="M6 4h12l-1.6 16.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8z"/><path d="M6.6 9h10.8"/>',
  snack: '<path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
  zelle: '<path d="M13 2.5 4.5 14H11l-1 7.5L19.5 10H13z"/>',
  print: '<path d="M6 9V3h12v6M6 18H4.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H18"/><rect x="6" y="14" width="12" height="7"/>',
  alert: '<path d="M10.3 4 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9"/><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0"/>',
  xcircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>', okcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.8"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', share: '<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', lock: '<rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5zM20 19v2.5H6"/>', rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>', ext: '<path d="M14 4h6v6M10 14 20 4M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>'
};
const ic = (n, cls = '') => `<span class="icn ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg></span>`;
const SYMBOLS = { '❚❚': 'pause', '⏸': 'pause', '▶': 'play', '■': 'stop', '＋': 'plus', '✕': 'x', '✓': 'check', '⇄': 'swap', '⏱': 'timer', '✎': 'edit', '⋯': 'more', '🥤': 'cup', '🍿': 'snack', '💵': 'cash', '💳': 'card', '⚡': 'zelle', '🖨': 'print', '⚠': 'alert', '🔔': 'bell', '❌': 'xcircle', '✅': 'okcircle', '⬇': 'down', '⬆': 'share', '🔍': 'search', '🔐': 'lock', '🔒': 'lock', '📲': 'phone', '★': 'star', '☆': 'star', 'ℹ': 'alert', '📘': 'book', '↺': 'rotate', '⟲': 'rotate', '↗': 'ext' };
const SYM_RE = new RegExp('(' + Object.keys(SYMBOLS).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')️?', 'g');
function iconize(root) {
  if (!root || root.nodeType === 3) root = root && root.parentNode;
  if (!root || !root.querySelectorAll && root.nodeType !== 1) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => { const p = n.parentNode; if (!p || /^(INPUT|TEXTAREA|OPTION|SELECT|SCRIPT|STYLE|TITLE)$/.test(p.nodeName) || p.closest('.icn,svg')) return 2; SYM_RE.lastIndex = 0; return SYM_RE.test(n.nodeValue) ? 1 : 2; } });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const span = document.createElement('span'); SYM_RE.lastIndex = 0; span.innerHTML = esc(n.nodeValue).replace(SYM_RE, (m, k) => ic(SYMBOLS[k])); n.replaceWith(...span.childNodes); }
}
if (typeof MutationObserver !== 'undefined') {
  const startIcons = () => { iconize(document.body); new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 || n.nodeType === 3) iconize(n.nodeType === 3 ? n.parentNode : n); }).observe(document.body, { childList: true, subtree: true }); };
  if (document.body) startIcons(); else addEventListener('DOMContentLoaded', startIcons);
}

