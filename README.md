# Matematika 🧮

Zabavna matematička igra za decu osnovnoškolskog uzrasta. Roditelj zaključa TV (ili tablet, konzolu…) četvorocifrenim PIN kodom, a dete rešavanjem matematičkih zadataka otkriva PIN i otključava uređaj!

Aplikacija radi u browseru, može da se **instalira kao aplikacija** (PWA) i **radi bez interneta** nakon prvog učitavanja.

## Kako radi

1. **Roditelj** bira temu, težinu, operacije i režim, pa unosi PIN kod
2. Ekran **„Predaj uređaj”** sakriva PIN pre nego što dete preuzme uređaj
3. Aplikacija generiše matematički lanac za svaku cifru PIN-a
4. **Dete** rešava zadatke korak po korak — rezultat jednog zadatka je početak sledećeg
5. Svaki rešen lanac otkriva jednu cifru PIN koda
6. Kada su svi zadaci rešeni — PIN je otkriven! 🎉

## Režimi igre

| Režim | Opis |
| --- | --- |
| **Digitalno** | Interaktivni zadaci na ekranu, sa proverom odgovora i animacijama. Svaki lanac otkriva jednu cifru PIN-a. |
| **Štampa** | Radni list za štampanje (A4) — isti zadaci kao u digitalnom režimu, dete rešava olovkom na papiru. |
| **Avantura** (meta) | Duža igra (~30 min) sa pričom i **tajnom mapom** (mreža 10×10). Zadaci otkrivaju koordinate (red i kolonu) za svaku cifru, a cifru dete pronalazi na mapi. |
| **Avantura — štampa** (meta-print) | Avantura sa tajnom mapom kao radni list za štampanje. |
| **Množenje → PIN** | Zadaci samo sa množenjem; **cifra jedinica** rezultata prenosi se u sledeći red, a poslednja cifra lanca je cifra PIN-a. |
| **Tablica množenja** | Vežbanje tablice množenja za izabrani broj — bez PIN koda, samo vežba. |

### Nivoi težine

| Nivo | Sabiranje / oduzimanje | Množenje / deljenje |
| --- | --- | --- |
| **Lako** | brojevi do 10 | tablice 2, 3, 5 i 10 |
| **Srednje** | brojevi do 20 | tablice 2–5 i 10 |
| **Teško** | dvocifreni brojevi | tablice 2–10 |

### Ostalo

- **4 teme**: Tajni Agent 🕵️, Svemirska Avantura 🚀, Lov na Blago 🗺️, Detektiv 🔍 — svaka sa svojom pričom i bojama
- **2 pisma**: ćirilica / latinica (prekidač u uglu ekrana)
- **4 operacije**: sabiranje, oduzimanje, množenje, deljenje (bira se bilo koja kombinacija)

## Razvoj

### Preduslovi

- [Bun](https://bun.sh/) 1.4+ (CI koristi tačno verziju iz `packageManager` u `package.json`)

### Instalacija i pokretanje

```bash
git clone git@github.com:ssf01/matematika.git
cd matematika
bun install
bun run dev          # http://localhost:4321
```

### Skripte

| Komanda | Šta radi |
| --- | --- |
| `bun run dev` | Dev server sa hot reload-om |
| `bun run build` | Produkcijski build u `dist/` (uključuje generisanje service worker precache liste) |
| `bun run preview` | Lokalni pregled produkcijskog build-a (ovde radi i service worker / offline) |
| `bun run test` | Vitest testovi (jednom) |
| `bun run test:watch` | Vitest u watch režimu |
| `bun run test:coverage` | Testovi + izveštaj pokrivenosti (`coverage/`, za `src/lib` i `src/i18n`) |
| `bun run lint` | ESLint (TypeScript, React Hooks, jsx-a11y) |
| `bun run lint:fix` | ESLint sa automatskim ispravkama |
| `bun run typecheck` | `astro check` — provera tipova za `.ts`, `.tsx` i `.astro` |
| `bun run check` | typecheck + lint + test (pokreni pre push-a) |

Testovi za čistu logiku (`src/lib`, `src/i18n`) rade u `node` okruženju, a testovi komponenti (`*.test.tsx`) u `jsdom`-u — vidi `vitest.config.ts`.

### CI

GitHub Actions (`.github/workflows/ci.yml`) na svaki push/PR ka `main` pokreće: `install --frozen-lockfile` → typecheck → lint → testove sa pokrivenošću → build. Dependabot (`.github/dependabot.yml`) jednom nedeljno predlaže grupisane minor/patch nadogradnje paketa i jednom mesečno za GitHub Actions.

## PWA i rad bez interneta

- `public/manifest.webmanifest` + ikonice (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) omogućavaju instalaciju („Dodaj na početni ekran”).
- `public/sw.js` je ručno napisan service worker, registruje se samo u produkcijskom build-u:
  - HTML: prvo mreža, pa keš (offline rezerva)
  - `/_astro/*` (heširani fajlovi): prvo keš
  - ostali fajlovi sa istog domena: keš, uz osvežavanje u pozadini
  - zahtevi ka drugim domenima (npr. analitika) se **ne** keširaju niti presreću
- Pri build-u, integracija `precache-manifest` u `astro.config.mjs` upisuje listu svih fajlova iz `dist/` i heš sadržaja u `dist/sw.js`, tako da svaki deploy dobija novu verziju keša, a stari keševi se brišu.
- `public/_headers` (Cloudflare Pages) postavlja `no-cache` za `sw.js` i dugotrajno keširanje za `/_astro/*`.

## Privatnost

- Aplikacija **nema naloge ni backend** — sve se dešava u browseru. Stanje igre (uključujući PIN) čuva se samo u `sessionStorage` i briše se zatvaranjem taba; izbor pisma (ćirilica/latinica) pamti se u `localStorage`.
- Za osnovnu statistiku poseta učitava se analitička skripta sa `stats.uikraft.com` (Umami-stil, `data-website-id`). Skripta se učitava sa `defer` (ne blokira prikaz), aplikacija joj ne prosleđuje PIN ni odgovore (nema prilagođenih događaja), i service worker je ne kešira niti presreće. Ako je blokirate (npr. ad-blockerom) ili ste offline, aplikacija radi normalno.

## Deploy (Cloudflare Pages)

1. Poveži GitHub repozitorijum sa Cloudflare Pages
2. Build command: `bun run build`
3. Build output directory: `dist`
4. Framework preset: Astro

## Tech stack

- **Astro 5** — statički sajt generator
- **React 19** — interaktivne komponente (islands)
- **Tailwind CSS 4** — stilizovanje
- **Zustand 5** — upravljanje stanjem (sessionStorage)
- **Vitest 4** + Testing Library — testovi
- **ESLint 9** (typescript-eslint, react-hooks, jsx-a11y) — linting
- **Bun** — package manager i runtime
- **TypeScript** (strict) — type safety

## Struktura projekta

```
src/
├── components/
│   ├── setup/    — Wizard za podešavanje igre
│   ├── puzzle/   — Digitalni i avantura mod, tablica množenja
│   ├── print/    — Štampani radni list
│   ├── reveal/   — Predaja uređaja, otkrivanje PIN-a + animacije
│   ├── themes/   — Sistem tema (4 teme)
│   └── ui/       — Zajedničke UI komponente
├── i18n/         — Prevodi i transliteracija (ćirilica ↔ latinica)
├── lib/          — Generator zadataka, validator, tipovi
├── stores/       — Zustand store
├── styles/       — Globalni CSS + print CSS
├── layouts/      — Astro layout (meta tagovi, PWA, analitika)
└── pages/        — Astro stranice
public/           — favicon, PWA manifest, ikonice, service worker, _headers
```

## Doprinos

1. Napravi granu od `main` (`git checkout -b moja-izmena`)
2. Za logiku zadataka (`src/lib`) dodaj ili ažuriraj testove pored koda (`*.test.ts`)
3. Pre push-a pokreni `bun run check` (i `bun run build` ako menjaš konfiguraciju)
4. Otvori pull request ka `main` — CI mora da prođe
5. Tekstove za UI dodaj u `src/i18n/translations.ts` (ćirilicom; latinica se dobija transliteracijom)

Nove lint greške nisu dozvoljene. Neka pravila su privremeno na `warn` zbog postojećeg koda (vidi komentare u `eslint.config.js`) — kada ispraviš upozorenja u fajlu, slobodno vrati pravilo na `error`.
