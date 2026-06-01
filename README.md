# Zagadnienie pośrednika

Nowoczesna aplikacja Next.js do rozwiązywania zagadnienia pośrednika metodą wierzchołka północno-zachodniego (NW).

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

## Stack

- **Next.js 15** — App Router, API Routes
- **React 19** — interfejs użytkownika
- **Tailwind CSS 4** — ciemny, minimalistyczny motyw
- **Vis.js** — wizualizacja grafu połączeń

## Struktura

```
app/              — strony i API
components/       — komponenty UI
lib/              — algorytm i logika solvera
```

## Legacy

Stara wersja (Node.js + HTML) pozostaje w plikach `server.js` i `index.html` dla referencji.
