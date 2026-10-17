const $=id=>document.getElementById(id);
const API=(window.DE_API||'').replace(/\/$/,'');
$('y').textContent=new Date().getFullYear();
const tog=$('tog'),menu=$('menu');
tog.onclick=()=>{const o=menu.classList.toggle('open');tog.setAttribute('aria-expanded',o)};
menu.onclick=e=>{if(e.target.tagName==='A'){menu.classList.remove('open');tog.setAttribute('aria-expanded',false)}};
function data(){
  const n=$('n').value.trim(),p=$('p').value.trim(),m=$('m').value.trim(),s=$('s').value;
  if(!n||!p||!m){$('e').textContent='Please enter your name, phone number and project details.';return null}
  if(p.replace(/\D/g,'').length<10){$('e').textContent='Enter a valid phone number, for example 0703 150 3838.';return null}
  $('e').textContent='';
  return{n,p,m,s,t:`Hello DE-Elite, my name is ${n}.\nService: ${s}\nPhone: ${p}\n\n${m}`}
}
function wa(d){window.open('https://wa.me/2347031503838?text='+encodeURIComponent(d.t),'_blank')}
$('qf').onsubmit=async e=>{e.preventDefault();$('e').className='err';const d=data();if(!d)return;
const b=e.submitter,old=b.textContent;b.disabled=true;b.textContent='Sending...';
try{const r=await fetch(API+'/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.n,phone:d.p,email:$('ea').value.trim(),service:d.s,message:d.m,website:$('w').value})});
const j=await r.json().catch(()=>({}));
if(r.status===400||r.status===429){$('e').textContent=j.error||'Please check your details and try again.';return}
if(!r.ok)throw 0;
$('qf').reset();$('e').className='ok';$('e').textContent='Thank you. Your request was received and we will call you shortly.'}
catch{$('e').textContent='We could not reach the server, so we opened WhatsApp for you instead.';wa(d)}
finally{b.disabled=false;b.textContent=old}};
$('em').onclick=()=>{const d=data();if(d)location.href='mailto:boningosam50@gmail.com?subject='+encodeURIComponent('Quote request: '+d.s)+'&body='+encodeURIComponent(d.t)};
// ---- pricing buttons preselect the service in the form
document.querySelectorAll('[data-svc]').forEach(a => a.addEventListener('click', () => { $('s').value = a.dataset.svc; }));

// ---- gallery: loads job photos uploaded from /admin; shows service tiles until photos exist
(async () => {
  const g = $('gal'), chips = $('chips'), lb = $('lb'); let items = [], cur = 'All';
  const src = p => p.static ? 'images/gallery/' + p.file : API + '/uploads/' + p.file;
  try { const r = await fetch(API + '/api/gallery'); if (r.ok) items = (await r.json()).photos || []; } catch {}
  if (!items.length) { try { const r = await fetch('gallery.json'); if (r.ok) items = ((await r.json()).photos || []).map(p => ({ ...p, static: true })); } catch {} }
  const icons = [['i-bolt', 'Electrical installation'], ['i-plug', 'Wiring'], ['i-sun', 'Solar & inverter systems'], ['i-cam', 'CCTV installation'], ['i-snow', 'Cooling & heating'], ['i-hat', 'Industrial jobs']];
  function draw() {
    g.textContent = ''; chips.textContent = '';
    if (!items.length) { chips.hidden = true; g.innerHTML = icons.map(([i, t]) => `<div class="tile ph"><svg><use href="#${i}"/></svg><span>${t}</span></div>`).join(''); return; }
    const cats = ['All', ...new Set(items.map(p => p.category))]; chips.hidden = cats.length < 3;
    cats.forEach(c => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = c; b.setAttribute('aria-pressed', c === cur); b.onclick = () => { cur = c; draw(); }; chips.append(b); });
    items.filter(p => cur === 'All' || p.category === cur).forEach(p => {
      const t = document.createElement('button'), im = new Image(), cap = document.createElement('span');
      t.className = 'tile'; im.src = src(p); im.alt = p.caption; im.loading = 'lazy'; cap.textContent = p.caption;
      t.onclick = () => { $('lbi').src = im.src; $('lbi').alt = p.caption; $('lbc').textContent = p.caption; lb.showModal(); };
      t.append(im, cap); g.append(t);
    });
  }
  $('lbx').onclick = () => lb.close(); lb.onclick = e => { if (e.target === lb) lb.close(); };
  draw();
})();
