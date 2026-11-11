# Szachy 0.8.1 Beta 3, DC4I

**Status:** testowa beta Android, otwarty kod GPL-3.0-or-later, nie wydanie produkcyjne Google Play.

## Nowe
- Własna ikona skoczka i nowy system wizualny z trybem jasnym, ciemnym i wysokim kontrastem.
- Szybki import zakończonych partii poprzez systemowe Udostępnij PGN na Androidzie, z kontrolą formatu, potwierdzeniem przez użytkownika i ochroną przed niekompletnymi partiami.
- Raport ruchu pokazujący faktyczny ruch, najlepszy wariant, głębokość analizy, ocenę pozycji i motyw taktyczny tylko wtedy, gdy wynika z zapisanych danych.
- Zachowana darmowa analiza Stockfish, ćwiczenia z własnych błędów, powtórki, wyzwania lokalne i raport formy.

## Prywatność
Brak reklam, abonamentu i obowiązkowego konta. Udostępniony PGN trafia lokalnie do aplikacji; Chess.com i Lichess są niezależnymi zewnętrznymi serwisami. Źródła i autorzy Open Chess pozostają wskazani.

## Weryfikacja wydania
- Testy jednostkowe, lint, TypeScript, Playwright desktop/mobile
- Android debug APK i niepodpisany AAB, applicationId com.dc4i.szachy
- Instalacja oraz ACTION_SEND PGN w emulatorze Android
- Sumy SHA-256 dla pobieranych plików

**Publikacja w Google Play wymaga osobnej weryfikacji konta, podpisu produkcyjnego i testu na fizycznym Galaxy S24 Ultra.**
