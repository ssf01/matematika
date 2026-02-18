# Matematika 🧮

Zabavna matematička igra za decu osnovnoškolskog uzrasta. Roditelji zaključaju TV četvorocifrenim PIN kodom, a dete rešavanjem matematičkih zadataka otkriva PIN i otključava TV!

## Kako radi

1. **Roditelj** bira temu, težinu, operacije i unosi PIN kod
2. Aplikacija generiše matematičke lance za svaku cifru PIN-a
3. **Dete** rešava zadatke korak po korak
4. Svaki tačan lanac otkriva jednu cifru PIN koda
5. Kada su svi zadaci rešeni — PIN je otkriven! 🎉

## Funkcionalnosti

- **4 teme**: Tajni Agent 🕵️, Svemirska Avantura 🚀, Lov na Blago 🗺️, Detektiv 🔍
- **2 pisma**: Ćirilica / Latinica (toggle)
- **3 nivoa težine**: Lako (≤10), Srednje (≤18), Teško (dvocifreni)
- **4 operacije**: Sabiranje, Oduzimanje, Množenje, Deljenje
- **2 režima**: Digitalno (interaktivno) + Štampa (radni list za štampanje)
- **Tablica množenja**: Poseban mod za vežbanje tablice množenja (1-10)
- **"Predaj uređaj"**: Ekran koji sprečava dete da vidi unos PIN-a

## Setup

### Preduslovi

- [Bun](https://bun.sh/) (v1.0+)

### Instalacija

```bash
git clone git@github.com:ssf01/matematika.git
cd matematika
bun install
```

### Development

```bash
bun run dev
```

Otvori [http://localhost:4321](http://localhost:4321) u browseru.

### Build

```bash
bun run build
```

Statički fajlovi se generišu u `dist/` direktorijumu.

### Preview produkcijskog build-a

```bash
bun run preview
```

## Deploy (Cloudflare Pages)

1. Poveži GitHub repozitorijum sa Cloudflare Pages
2. Build command: `bun run build`
3. Build output directory: `dist`
4. Framework preset: Astro

## Tech Stack

- **Astro** — statički sajt generator
- **React** — interaktivne komponente (islands)
- **Tailwind CSS v4** — stilizovanje
- **Zustand** — upravljanje stanjem (sessionStorage)
- **Bun** — package manager i runtime
- **TypeScript** — type safety

## Struktura projekta

```
src/
├── components/
│   ├── setup/    — Wizard za podešavanje igre
│   ├── puzzle/   — Digitalni mod (interaktivni zadaci)
│   ├── print/    — Štampani radni list
│   ├── reveal/   — Otkrivanje PIN-a + animacije
│   ├── themes/   — Sistem tema (4 teme)
│   └── ui/       — Zajedničke UI komponente
├── i18n/         — Prevodi i transliteracija (ćirilica ↔ latinica)
├── lib/          — Generator zadataka, validator, tipovi
├── stores/       — Zustand store
├── styles/       — Globalni CSS + print CSS
├── layouts/      — Astro layout
└── pages/        — Astro stranice
```
