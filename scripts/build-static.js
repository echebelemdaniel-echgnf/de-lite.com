// Copies public/ into docs/ for GitHub Pages (admin pages need the Node server, so they are left out).
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'public'), out = path.join(__dirname, '..', 'docs');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true, filter: f => !/admin\.(html|js)$/.test(f) });
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, '404.html'), fs.readFileSync(path.join(out, 'index.html')));
console.log('Static site written to docs/');
