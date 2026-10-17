# DE-Elite Electrical Engineering Services: website + backend

**Frontend** (`public/`): index.html, styles.css, script.js, plus admin.html and admin.js.
**Backend** (`server.js`): Node.js + Express. Saves quote requests, emails them to you, and serves a password-protected admin page at `/admin`.

## Run on your computer
1. Install Node.js 20 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` (and the SMTP lines if you want email alerts).
4. `npm run dev`, then open http://localhost:3000 and http://localhost:3000/admin

## Deploy (Render, Railway, Fly, or any VPS)
- Build command: `npm install`   Start command: `npm start`
- Set environment variables from `.env.example`, plus `NODE_ENV=production`.
- **Important:** quotes are saved in `DATA_DIR`. On Render/Railway attach a persistent disk/volume and point `DATA_DIR` at it (e.g. `/var/data`), or quotes are lost on redeploy.
- Gmail alerts: turn on 2-step verification and create an App Password, then use it as `SMTP_PASS`.

## Notes
- If the server is unreachable, the form falls back to opening WhatsApp, so no lead is lost.
- Spam protection: rate limits, a hidden honeypot field, input validation, and security headers (helmet).
- Change the phone numbers, email or address in `public/index.html`, `public/script.js` (WhatsApp number) and `server.js` (notify email).

## Job photos
Sign in at `/admin`, open **Job photos**, and upload photos of your real jobs (JPG/PNG/WebP, up to 8 MB). They appear in the website's *Our work* gallery with category filters. Photos are saved in `DATA_DIR/uploads`, so keep `DATA_DIR` on a persistent disk.

## Other additions
- Quote requests can be exported to CSV from `/admin`.
- Pricing and FAQ text lives in `public/index.html` (search for `id="pricing"` and `id="faq"`). Add real naira prices to the `.pl` lines when you are ready.

## Put it live on GitHub Pages (what to do if GitHub showed an error)
GitHub Pages only hosts static files, so it cannot run `server.js`. The `docs/` folder is a ready static copy of the site.
1. Upload this whole project to a GitHub repository (the `docs` folder must be included).
2. Repository **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, Folder = `/docs`. Save.
3. After about a minute your site is live at `https://YOURNAME.github.io/REPO/`.
4. Whenever you edit anything in `public/`, run `npm run build:static` to refresh `docs/`.

On Pages the quote form opens WhatsApp (no lead is lost). To also save quotes, get emails and use the admin page, run the backend too:
1. Create a free/cheap Node web service on Render (it reads `render.yaml`), attach the disk, set `ADMIN_PASSWORD` and `ALLOWED_ORIGIN=https://YOURNAME.github.io`.
2. Put the Render address in `public/config.js` (`window.DE_API = 'https://de-elite.onrender.com'`), run `npm run build:static`, push again.
3. Manage quotes and job photos at `https://de-elite.onrender.com/admin`.

### Job photos without the backend
Copy real photos into `public/images/gallery/` and list them in `public/gallery.json`:
`{"photos":[{"file":"db-woji.jpg","category":"Wiring","caption":"Distribution board, Woji"}]}`
Then run `npm run build:static`.
DE-ELITE Electrical Engineering Services ⚡

Powering Homes, Businesses & Industries

Welcome to the official project repository for DE-ELITE Electrical Engineering Services, a business providing electrical installation, wiring, solar and inverter systems, CCTV installations, cooling and heating systems, and general industrial engineering services.

🏢 About the Business

DE-ELITE Electrical Engineering Services is committed to delivering safe, reliable, and efficient electrical solutions tailored to residential, commercial, and industrial needs.

Our core values are Safety, Quality, and Reliability.

🛠️ Our Services

- Electrical Installation: Conduit and surface electrical installation.
- Wiring: Electrical wiring and related services.
- Solar & Inverter Systems: Supply and installation of solar and inverter solutions.
- CCTV Installation: Security camera supply and installation.
- Cooling & Heating Systems: Air conditioning and related systems.
- Industrial & Consultant Jobs: General engineering and industrial consultancy services.

💻 Website Features

The website project is intended to provide visitors with:

- A professional business landing page.
- Company information and service descriptions.
- Visual displays of electrical engineering projects.
- Contact information for enquiries and service requests.
- A responsive layout for mobile, tablet, and desktop devices.

🧰 Technologies

The technology stack can be updated to match the actual implementation.

- HTML5 — Website structure
- CSS3 — Styling and responsive layouts
- JavaScript — Interactive functionality

📍 Contact Information

- Business Name: DE-ELITE Electrical Engineering Services
- Phone: 07031503838 / 07066754753
- Email: boningosam50@gmail.com
- Address: #23 Ogboroma Street, off Woji, Port Harcourt, Rivers State, Nigeria.

🎯 Mission

To provide dependable electrical engineering solutions through professional service delivery, quality workmanship, and a strong commitment to safety.

🚀 Getting Started

To run the website locally:

1. Clone the repository.
   
   git clone YOUR_GITHUB_REPOSITORY_URL

2. Navigate to the project folder.
   
   cd YOUR_PROJECT_FOLDER

3. Open the project in Visual Studio Code.
   
   code .

4. Open "index.html" in your browser, or use the VS Code Live Server extension if installed.

📂 Suggested Project Structure

de-elite-electrical-services/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── images/
│   ├── logo.png
│   ├── electrical-installation.jpg
│   ├── wiring.jpg
│   ├── solar-inverter.jpg
│   ├── cctv-installation.jpg
│   └── cooling-heating.jpg
└── README.md

The folder structure is a suggested organization and should be adjusted to match the actual project.

🔒 Safety, Quality & Reliability

DE-ELITE Electrical Engineering Services aims to deliver efficient solutions that meet customer needs while prioritizing safety and quality workmanship.

📄 License

A license has not yet been specified. Add an appropriate license if you intend to distribute the website source code publicly.

---

DE-ELITE Electrical Engineering Services
Your Trusted Electrical Engineering Partner! ⚡
