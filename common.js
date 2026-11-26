/* ส่วนที่ใช้ร่วมกัน: เรียก API, โลโก้, แจ้งเตือน, ตัวช่วยจัดรูปแบบ */
const CFG = window.DLTV_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });

async function api(action, ...args) {
  const url = CFG.API_URL || '';
  if (!url || /XXXX/.test(url)) throw new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js');
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, args }), signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('เซิร์ฟเวอร์ตอบกลับ ' + r.status);
    const j = await r.json();
    if (!j.ok) { const e = new Error(j.error || 'เกิดข้อผิดพลาด'); e.auth = j.auth; throw e; }
    return j.data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('เชื่อมต่อนานเกินไป กรุณาลองใหม่');
    if (e instanceof TypeError) throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    throw e;
  } finally { clearTimeout(t); }
}

function toast(msg, kind = '') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 2800);
}

/* โลโก้: ลองไฟล์ในโฟลเดอร์ assets ก่อน ถ้าไม่มีจึงใช้ URL ต้นฉบับ */
function mountLogos() {
  const L = [
    [CFG.LOGO_FOUNDATION_LOCAL, CFG.LOGO_FOUNDATION, 'มูลนิธิการศึกษาทางไกลผ่านดาวเทียม'],
    [CFG.LOGO_DLTV_LOCAL, CFG.LOGO_DLTV, 'DLTV']
  ];
  $$('.logos').forEach(box => {
    box.innerHTML = '';
    L.forEach(([loc, remote, alt], i) => {
      if (i) { const s = document.createElement('span'); s.className = 'sep'; box.append(s); }
      const img = new Image(); img.alt = alt; img.decoding = 'async';
      img.onerror = () => { if (remote && img.dataset.f !== '1') { img.dataset.f = '1'; img.src = remote; } else { img.remove(); } };
      img.src = loc || remote; box.append(img);
    });
  });
}

/* คลื่นสัญญาณดาวเทียมในส่วนหัว */
const WAVES = `<svg class="waves" viewBox="0 0 560 420" aria-hidden="true">${[60, 120, 180, 240, 300, 360].map((r, i) => `<circle cx="430" cy="120" r="${r}" fill="none" stroke="rgba(255,255,255,${(0.22 - i * 0.03).toFixed(2)})" stroke-width="${i ? 1.5 : 2}"/>`).join('')}<g transform="translate(430 120) rotate(-28)"><rect x="-38" y="-9" width="26" height="18" rx="2" fill="rgba(255,255,255,.85)"/><rect x="12" y="-9" width="26" height="18" rx="2" fill="rgba(255,255,255,.85)"/><rect x="-11" y="-13" width="22" height="26" rx="5" fill="#f2b705"/><line x1="0" y1="13" x2="0" y2="24" stroke="#f2b705" stroke-width="3"/></g></svg>`;

/* ป้ายหัวคอลัมน์สำหรับตารางบนมือถือ */
new MutationObserver(() => { for (const c of document.querySelectorAll('.stack td:not([data-l])')) { let i = 0, p = c; while ((p = p.previousElementSibling)) i += p.colSpan; c.dataset.l = c.closest('table').rows[0].cells[i]?.textContent || ''; } }).observe(document.documentElement, { childList: true, subtree: true });

function btnBusy(btn, on, label) {
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${esc(label || 'กำลังดำเนินการ…')}`; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}

/* ตัวเลขนับขึ้น */
function countUp(el, to, d = 0) {
  const from = 0, t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700;
  const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e, d); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
