# Szachy na Android TV, kandydat z 22 listopada 2026

[English](../verification/2026-11-22-android-tv.md) | Polski

Dariusz zlecił instalację, testy na Living Room TV oraz poprawianie wykrytych
problemów. Wersja 0.8.0 uruchamiała się w wąskim pionowym obszarze, zawijała
tekst głównej akcji i ucinała etykietę dolnej nawigacji. Kod nie miał obsługi
szachownicy pilotem ani kafelka w launcherze Google TV.

## Poprawki

Kandydat 0.8.1 / 8001 dodaje kafelek Google TV, poziomy ekran na telewizorach,
obsługę kierunków pomiędzy elementami i widoczny kursor pola szachownicy.
Strzałki przesuwają kursor, OK wybiera figurę lub cel ruchu. Kierunki uwzględniają
obrót szachownicy. Wyjście poza jej krawędź pozwala przejść do innych elementów.
Na telefonach zachowano pionową orientację i dotychczasową obsługę dotykiem.

## Potwierdzone sprawdzenia

- 392 testy jednostkowe, lint i sprawdzenie TypeScript zakończyły się powodzeniem.
- Wszystkie 24 testy przeglądarkowe dla komputera, telefonu i pilota przeszły.
- Potwierdzono ruch e2-e4, odpowiedź bota, wyjście z szachownicy oraz ruch e7-e5
  z perspektywy czarnych w testach przeglądarkowych.
- APK został zbudowany i podpisany tym samym certyfikatem co zainstalowana Beta 2.
  Klucz prywatny pozostał na Mac Pro.

Plik na Mac mini: Szachy-0.8.1-tv-candidate.apk. Dokładna suma kontrolna,
certyfikat i ścieżka znajdują się w angielskim raporcie. Aktualizacja ma być
wykonana z zachowaniem danych aplikacji.

W tym punkcie kontrolnym osobny kontroler prowadzi testy fizycznego Chromecasta.
Sukces testów przeglądarkowych nie oznacza jeszcze pełnego odbioru na urządzeniu.
Należy potwierdzić kafelek, poziomy ekran, grę pilotem, Back oraz wznowienie.

Zmiany zapisano na gałęzi fix/android-tv-remote-20261122. Otwarcie PR odroczono,
ponieważ aktywne przepływy GitHub uruchomiłyby zadania hostowane podczas
obowiązującej przerwy związanej z rozliczeniami. Nie opublikowano wydania w sklepie
ani nowej wersji strony.
