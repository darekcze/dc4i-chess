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

## Druga iteracja: wyniki na urządzeniu i poprawiony pakiet

Koordynator potwierdził na Living Room TV instalację wersji8001 z zachowaniem
danych, kafelek Google TV oraz pełny poziomy obraz. Samym pilotem wykonał e2-e4,
a bot Ivan odpowiedział e7-e5. Zaznaczenie planszy było widoczne.

Test ujawnił dwa dalsze problemy: strzałka w dół z wyboru koloru potrafiła wejść
w ukryty fragment listy botów, a po ruchu przyciski gry chowały się za dolnym menu.
Gęstość213 oznacza około960x540 pikseli CSS przy fizycznym obrazie1280x720.
Ten układ był dotąd traktowany jak mały ekran telefonu.

Poprawka uwzględnia widoczność elementu wewnątrz przewijanego obszaru i zachowuje
przechodzenie przez listę, gdy zaznaczenie jest już w niej. Na TV przy szerokości
800-1023 pikseli CSS plansza i przyciski są w osobnych kolumnach. Dolne menu
nie przykrywa obszaru gry. Widok telefonu pozostaje zachowany.

Przeszły sprawdzenia lint, TypeScript, kompilacja Androida oraz siedem testów TV,
w tym wybór bota pilotem, przewijanie listy, rozpoczęcie gry i widoczność przycisków
po ruchu. Osobny agent przejrzał poprawki nawigacji i układu bez znalezienia problemu
blokującego. Pełny wcześniejszy zestaw24 testów dotyczył wersji8001; dla tej poprawki
wykonano siedem testów dotyczących TV.

Nowy pakiet: Szachy-0.8.2-tv.alpha.1.apk, kod8002. Podpis jest zgodny z poprzednią
instalacją, a suma SHA-256 to
4b013f45604621762ecd7219a8e0285ed7c301f453cbb23c8d6e71b3c71b1b81.
Źródło: 5efeb4886be2396c477f8851af852c9afebee539. Pakiet i potwierdzenie
chess-tv2-receipt.json są w prywatnym katalogu testów na Mac mini.

W tym punkcie wersja8002 czeka na powtórny test fizycznego urządzenia.
Nie należy utożsamiać sukcesu testów przeglądarkowych z zakończeniem tego odbioru.
