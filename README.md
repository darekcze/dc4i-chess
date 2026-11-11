# Szachy

**Bezpłatna aplikacja open source na Androida i w przeglądarce.** Analizuj zakończone partie Chess.com z pomocą Stockfish, rozwiązuj zadania, ucz się debiutów i wykonuj codzienne treningi.

[![GPL-3.0-or-later](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](LICENSE)
[![CI](https://github.com/darekcze/dc4i-chess/actions/workflows/ci.yml/badge.svg)](https://github.com/darekcze/dc4i-chess/actions/workflows/ci.yml)

## Co oferuje Szachy

- Import zakończonych partii z publicznego API Chess.com, Lichess lub z plików PGN.
- Nieograniczoną lokalną analizę Stockfish, klasyfikację ruchów i ponowne rozegranie błędów.
- Polskojęzyczny trening dzienny oparty o wykrywane słabości z przeanalizowanych partii.
- Zadania taktyczne, trener debiutów z powtórkami, lekcje, boty i lokalne wyzwania.
- Tryb offline dla wcześniej pobranych danych, bez konta, reklam i opłat.

Szachy nie służą do podpowiadania ruchów podczas trwających partii online. Nie jesteśmy powiązani z Chess.com ani Lichess.

## Instalacja Android

Zainstaluj APK z [GitHub Releases](https://github.com/darekcze/dc4i-chess/releases), gdy pojawi się pierwsza wersja beta. Pakiet aplikacji na Androida: `com.dc4i.szachy`.

## Budowanie

Wymagane Node.js 22+, JDK 21 i Android SDK 36.

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run android
cd android
./gradlew assembleDebug bundleRelease
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
Plik AAB jest domyślnie niepodpisany, podpis do Google Play wymaga osobnego klucza.

## Community i kod źródłowy

Przyjmujemy zgłoszenia błędów, propozycje funkcji, tłumaczenia i pull requesty przez [GitHub Issues](https://github.com/darekcze/dc4i-chess/issues). Poprawki ogólne przekazujemy także do projektu macierzystego. Projekt pozostaje otwarty na GPL-3.0-or-later.

## Autorzy i licencje

Szachy jest forkiem [Open Chess](https://github.com/jupiutrera/open-chess) autorstwa **jupiutrera i społeczności**. Oryginalną dokumentację zachowujemy w [docs/OPEN_CHESS_UPSTREAM_README.md](docs/OPEN_CHESS_UPSTREAM_README.md), a historię zmian w Git.

Silnik Stockfish jest na GPL-3.0, Chessground na GPL-3.0, chess.js na BSD-2, dane otwarć i zadań Lichess na CC0, figury Chessnut na Apache-2.0, figury cburnett na GPL-2.0-or-later. Szczegółowe licencje zasobów znajdują się w repozytorium. Usunęliśmy wszystkie zestawy figur objęte ograniczeniem zastosowań komercyjnych.

## Prywatność

Przeczytaj [politykę prywatności](public/privacy.html) i [informacje dla Google Play](docs/play/release.md).
Kontakt z wydawcą: hello@dc4i.com.

**Wydawca projektu:** DC4I sp. z o.o., Warszawa, Polska.
