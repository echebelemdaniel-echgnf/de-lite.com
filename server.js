const express = require('express'), helmet = require('helmet'), rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer'), fs = require('fs/promises'), path = require('path'), crypto = require('crypto');

const multer = require('multer'), compression = require('compression');
const PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'quotes.json');
const ADMIN_PW = process.env.ADMIN_PASSWORD;
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const NOTIFY = process.env.NOTIFY_EMAIL || 'boningosam50@gmail.com';
const SERVICES = ['Electrical installation', 'Wiring', 'Solar & inverter systems', 'CCTV installation', 'Cooling & heating', 'Industrial / consulting', 'Other'];
const STATUSES = ['new', 'contacted', 'done'];

const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 465, secure: (+process.env.SMTP_PORT || 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

// ---- storage: JSON file with a serialized write queue and atomic rename
let queue = Promise.resolve();
const load = async (file = FILE) => { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return []; } };
function mutate(fn, file = FILE) {
  const run = queue.then(async () => {
    const list = await load(file); const out = await fn(list);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file + '.tmp', JSON.stringify(list, null, 2)); await fs.rename(file + '.tmp', file);
    return out;
  });
  queue = run.catch(() => {}); return run;
}

// ---- admin session: signed expiring token in an httpOnly cookie
const sign = exp => crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
const sameHash = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());
function isAdmin(req) {
  const m = /(?:^|;\s*)de_admin=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return false;
  const [exp, sig] = m[1].split('.'); if (!exp || !sig || +exp < Date.now()) return false;
  const good = sign(exp); return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
const requireAdmin = (req, res, next) => !ADMIN_PW ? res.status(503).json({ error: 'Admin is disabled. Set ADMIN_PASSWORD.' }) : isAdmin(req) ? next() : res.status(401).json({ error: 'Not signed in' });

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], frameAncestors: ["'none'"],
  upgradeInsecureRequests: PROD ? [] : null } } }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
// ---- CORS: lets the GitHub Pages site call this API (set ALLOWED_ORIGIN=https://yourname.github.io)
const ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(['/api/quotes', '/api/gallery', '/uploads'], (req, res, next) => {
  const o = req.headers.origin;
  if (o && ORIGINS.includes(o)) { res.set({ 'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});


const quoteLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please call us on 0703 150 3838.' } });
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again later.' } });
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

// ---- public API
app.post('/api/quotes', quoteLimit, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: bots fill this, humans never see it
  const q = { name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120), service: clean(b.service, 40), message: clean(b.message, 2000) };
  if (q.name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[+\d\s()-]{10,20}$/.test(q.phone)) return res.status(400).json({ error: 'Enter a valid phone number.' });
  if (q.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) return res.status(400).json({ error: 'Enter a valid email address or leave it blank.' });
  if (!SERVICES.includes(q.service)) return res.status(400).json({ error: 'Choose a service.' });
  if (q.message.length < 10) return res.status(400).json({ error: 'Please describe your project in a few words.' });
  const rec = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...q };
  try { await mutate(list => { list.push(rec); }); } catch (e) { console.error(e); return res.status(500).json({ error: 'Could not save. Please call us.' }); }
  if (mailer) mailer.sendMail({
    from: process.env.SMTP_USER, to: NOTIFY, replyTo: q.email || undefined, subject: `New quote request: ${q.service} (${q.name})`,
    text: `Name: ${q.name}\nPhone: ${q.phone}\nEmail: ${q.email || '-'}\nService: ${q.service}\n\n${q.message}`
  }).catch(e => console.error('Email failed:', e.message));
  res.json({ ok: true, id: rec.id });
});

// ---- admin API
app.post('/api/admin/login', loginLimit, (req, res) => {
  if (!ADMIN_PW) return res.status(503).json({ error: 'Admin is disabled. Set ADMIN_PASSWORD.' });
  if (!sameHash(String(req.body?.password || ''), ADMIN_PW)) return res.status(401).json({ error: 'Wrong password' });
  const exp = Date.now() + 8 * 3600e3;
  res.setHeader('Set-Cookie', `de_admin=${exp}.${sign(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 3600}${PROD ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => { res.setHeader('Set-Cookie', 'de_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/quotes', requireAdmin, async (req, res) => res.json({ quotes: (await load()).reverse() }));
app.patch('/api/admin/quotes/:id', requireAdmin, async (req, res) => {
  if (!STATUSES.includes(req.body?.status)) return res.status(400).json({ error: 'Bad status' });
  const ok = await mutate(list => { const q = list.find(x => x.id === req.params.id); if (q) q.status = req.body.status; return !!q; });
  res.status(ok ? 200 : 404).json({ ok });
});
app.delete('/api/admin/quotes/:id', requireAdmin, async (req, res) => {
  const ok = await mutate(list => { const i = list.findIndex(x => x.id === req.params.id); if (i > -1) list.splice(i, 1); return i > -1; });
  res.status(ok ? 200 : 404).json({ ok });
});

// ---- gallery (job photos): public list, admin upload/delete
const GAL = path.join(DATA_DIR, 'gallery.json'), UPLOADS = path.join(DATA_DIR, 'uploads');
const CATS = ['Electrical installation', 'Wiring', 'Solar & inverter', 'CCTV', 'Cooling & heating', 'Industrial'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } }).single('photo');
const imgExt = b => b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'png'
  : b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' ? 'webp' : null;
app.get('/api/gallery', async (req, res) => { res.set('Cache-Control', 'public, max-age=60'); res.json({ photos: (await load(GAL)).reverse() }); });
app.post('/api/admin/gallery', requireAdmin, (req, res, next) => upload(req, res, e => e ? res.status(400).json({ error: e.code === 'LIMIT_FILE_SIZE' ? 'Photo is over 8 MB.' : 'Upload failed.' }) : next()), async (req, res) => {
  const f = req.file, ext = f && imgExt(f.buffer), cat = clean(req.body.category, 40);
  if (!ext) return res.status(400).json({ error: 'Please choose a JPG, PNG or WebP photo.' });
  if (!CATS.includes(cat)) return res.status(400).json({ error: 'Choose a category.' });
  const id = crypto.randomUUID(), file = id + '.' + ext;
  await fs.mkdir(UPLOADS, { recursive: true }); await fs.writeFile(path.join(UPLOADS, file), f.buffer);
  const rec = { id, file, category: cat, caption: clean(req.body.caption, 120) || cat, createdAt: new Date().toISOString() };
  await mutate(l => { l.push(rec); }, GAL); res.json({ ok: true, photo: rec });
});
app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
  const rec = await mutate(l => { const i = l.findIndex(x => x.id === req.params.id); return i > -1 ? l.splice(i, 1)[0] : null; }, GAL);
  if (!rec) return res.status(404).json({ ok: false });
  await fs.unlink(path.join(UPLOADS, path.basename(rec.file))).catch(() => {}); res.json({ ok: true });
});
// ---- CSV export of quote requests
const cell = v => { v = String(v ?? ''); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
app.get('/api/admin/quotes.csv', requireAdmin, async (req, res) => {
  const rows = (await load()).map(q => [q.createdAt, q.name, q.phone, q.email, q.service, q.status, q.message].map(cell).join(','));
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="quotes.csv"' });
  res.send(['Date,Name,Phone,Email,Service,Status,Message', ...rows].join('\n'));
});

app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', index: false }));
app.get('/health', (req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: PROD ? '1h' : 0 }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: 'Something went wrong' }); });

app.listen(PORT, () => console.log(`DE-Elite running on http://localhost:${PORT}` + (ADMIN_PW ? '' : '  (admin disabled: set ADMIN_PASSWORD)')));
