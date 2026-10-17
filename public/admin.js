const $ = id => document.getElementById(id); let all = [];
const j = async (u, o = {}) => { const r = await fetch(u, { ...o, headers: { 'Content-Type': 'application/json' } }); if (r.status === 401) throw 0; return r.json(); };
function el(t, txt, cls) { const e = document.createElement(t); if (txt != null) e.textContent = txt; if (cls) e.className = cls; return e; }
const wa = p => { let d = p.replace(/\D/g, ''); if (d[0] === '0') d = '234' + d.slice(1); return 'https://wa.me/' + d; };
async function load() {
  try { all = (await j('/api/admin/quotes')).quotes; $('lg').hidden = true; $('app').hidden = false; render(); }
  catch { $('lg').hidden = false; $('app').hidden = true; }
}
function render() {
  const f = $('f').value, box = $('list'), rows = all.filter(q => !f || q.status === f);
  box.textContent = ''; $('c').textContent = rows.length + ' of ' + all.length + ' requests';
  if (!rows.length) box.append(el('p', 'No requests yet. New quotes from the website will appear here.', 'meta'));
  rows.forEach(q => {
    const c = el('div', null, 'card'); c.style.marginBottom = '14px';
    c.append(el('h3', q.name + ' - ' + q.service), el('span', q.status, 'tag'));
    c.append(el('div', new Date(q.createdAt).toLocaleString() + ' | ' + q.phone + (q.email ? ' | ' + q.email : ''), 'meta'), el('div', q.message, 'msg'));
    const a = el('div', null, 'acts');
    const call = el('a', 'Call', 'btn b1'); call.href = 'tel:' + q.phone.replace(/[^\d+]/g, '');
    const chat = el('a', 'WhatsApp', 'btn'); chat.href = wa(q.phone); chat.target = '_blank'; chat.rel = 'noopener'; chat.style.borderColor = 'var(--line)';
    const sel = el('select'); sel.style.width = 'auto'; ['new', 'contacted', 'done'].forEach(s => { const o = el('option', s); o.value = s; o.selected = s === q.status; sel.append(o); });
    sel.onchange = async () => { await j('/api/admin/quotes/' + q.id, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }); q.status = sel.value; render(); };
    const del = el('button', 'Delete', 'btn'); del.style.cssText = 'border-color:#d63b3b;color:#d63b3b';
    del.onclick = async () => { if (confirm('Delete this request permanently?')) { await j('/api/admin/quotes/' + q.id, { method: 'DELETE' }); all = all.filter(x => x !== q); render(); } };
    a.append(call, chat, sel, del); c.append(a); box.append(c);
  });
}
$('f').onchange = render;
$('lg').onsubmit = async e => {
  e.preventDefault(); $('le').textContent = '';
  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('pw').value }) });
  if (r.ok) { $('pw').value = ''; load(); } else $('le').textContent = (await r.json().catch(() => ({}))).error || 'Sign in failed';
};
$('out').onclick = async () => { await fetch('/api/admin/logout', { method: 'POST' }); load(); };
load();

// ---- tabs + job photo manager
function tab(n) { $('qp').hidden = !!n; $('gp').hidden = !n; $('t1').className = 'btn' + (n ? '' : ' b1'); $('t2').className = 'btn' + (n ? ' b1' : ''); if (n) gal(); }
$('t1').onclick = () => tab(0); $('t2').onclick = () => tab(1);
async function gal() {
  const box = $('gl'); box.textContent = ''; const { photos } = await (await fetch('/api/gallery')).json();
  if (!photos.length) box.append(el('p', 'No photos yet. Upload your first job photo above.', 'meta'));
  photos.forEach(p => {
    const c = el('div', null, 'card'), im = new Image(); im.src = '/uploads/' + p.file; im.alt = p.caption; im.style.cssText = 'width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px';
    const d = el('button', 'Delete', 'btn'); d.style.cssText = 'border-color:#d63b3b;color:#d63b3b;padding:6px 14px;margin-top:10px';
    d.onclick = async () => { if (confirm('Delete this photo?')) { await j('/api/admin/gallery/' + p.id, { method: 'DELETE' }); gal(); } };
    c.append(im, el('div', p.caption + ' (' + p.category + ')', 'meta'), d); box.append(c);
  });
}
$('up').onsubmit = async e => {
  e.preventDefault(); $('ue').textContent = ''; const b = e.submitter; b.disabled = true;
  try {
    const r = await fetch('/api/admin/gallery', { method: 'POST', body: new FormData($('up')) });
    if (r.ok) { $('up').reset(); gal(); } else $('ue').textContent = (await r.json().catch(() => ({}))).error || 'Upload failed.';
  } catch { $('ue').textContent = 'Network error. Try again.'; }
  b.disabled = false;
};
