# Szachy na Android TV, kandydat z 22 listopada 2026

[English](../verification/2026-11-22-android-tv.md) | Polski

Bieżący wynik: kod 8003 jest zainstalowany i przyjęty na urządzeniu, z zachowaniem partii oraz czytelnymi polskimi etykietami. Kod 8002 przeszedł pełny test ustawień i gry. Wyniki opisuje trzecia iteracja poniżej; wcześniejsze oczekiwania są historycznymi punktami kontrolnymi.

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

## Trzecia iteracja: odbiór urządzenia i zawijanie etykiet

Ta sekcja jest bieżącym punktem kontrolnym. Wcześniejsze zapisy o oczekiwaniu
opisują poprzednie przekazania i nie zastępują wyników poniżej.

### Potwierdzone testy kodu 8002

Jedyny kontroler urządzenia sprawdził pilotem, z odczytem ekranu:

- Aktualizacja zachowała testową partię 1.e4 e5. Back zapisał ją i wrócił do
  ustawień z komunikatem o zapisie.
- Przejście z ekranu głównego do Graj, grupy Boty, wybór Pipa i przewijanie
  listy działały. Wybrany element był widoczny po przewinięciu.
- Po wyborze czarnych Down przechodził bezpośrednio do widocznego Graj,
  bez wejścia w niewidocznego bota nad kontrolkami koloru.
- Rozpoczęła się nowa gra czarnymi. Pip wykonał 1.a4, fokus był na e7,
  a OK, Up, Up, OK wykonało 1...e5. Bot odpowiedział 2.e3.
- Szachownica i przyciski pozostały nad dolnym menu przy fizycznym obrazie
  1280x720 i gęstości 213.
- Wyjście poza krawędź szachownicy przeniosło fokus na Cofnij bez dodania ruchu.
  Home i przełączenie do innej aplikacji działały.
- Pojedyncze Left z odczytem stanu po zmianie widoku poprawnie wybierały grupę
  botów. Szybka wcześniejsza seria nie potwierdziła błędu grupy wyboru.
  Nie zmieniano z tego powodu logiki pilota ani gry.

Usunięto tylko krótką partię utworzoną przez kontrolera do testu. Pozostałe dane
zachowano. Nazwy dowodów i dokładne warunki opisuje wersja angielska.

### Kod 8003: długie polskie nazwy

W przyjętym układzie tekst "Zaproponuj remis" nadal przylegał do "Cofnij".
Jedna reguła CSS, wyłącznie dla TV, ogranicza szerokość etykiety i pozwala ją
zawinąć. Logika wejścia, stan gry i działanie szachów pozostają bez zmian.
Widok telefonu nie jest objęty tą regułą.

Istniejący test po ruchu w 960x540 używa teraz rzeczywistego języka pl-PL,
wykonuje e4, czeka na odpowiedź bota i sprawdza granice napisów wewnątrz
przycisków oraz położenie przycisków nad menu. Test przeszedł. Obejrzany zrzut
pokazuje czytelne dwie linie długiej etykiety. Lint nie zgłosił ostrzeżeń ani
błędów. Przeszły TypeScript/Vite, synchronizacja Capacitor i budowa Androida.
Dla tej zmiany CSS nie rozszerzano zestawu testów; wcześniejsze liczby siedem
i 24 dotyczą odpowiednich poprzednich iteracji.

Pakiet: Szachy-0.8.2-tv.alpha.2.apk, wersja 0.8.2-tv.alpha.2, kod 8003,
14 390 872 bajty. SHA-256:
11b3b4e487018402d992757851adba2238af3bf14c71646d4c77852f0b9c18e4.

Źródło: 7efd52c31728f5450f0604ff33f9350f0e022823. Zachowano podpis istniejącej
instalacji. Klucz pozostał na Mac Pro; po przesłaniu na mini ponownie sprawdzono
sumę pliku. [Oczyszczony zapis artefaktu i odbioru](../verification/2026-11-22-android-tv-receipt.json)
oraz prywatny chess-tv3-receipt.json zawierają dokładne dane.

Odbiór kodu 8003 na urządzeniu: PASS. Kontroler potwierdził aktualizację bez
usuwania danych, kod wersji, wznowienie partii czarnymi z Pipem oraz końcowy
odczyt i zrzut ekranu. Ruchy 1.a4 e5 2.e3 pozostały niezmienione. Szachownica
i wszystkie przyciski są nad dolnym menu. "Zaproponuj remis" zajmuje dwie
czytelne linie wewnątrz przycisku, bez obcięcia. Dowody: chess8003-install.json
oraz chess8003-final-game.png/XML w prywatnym katalogu testów. Ten odczyt
aktualizacji jest osobny od wcześniejszych pełnych testów ustawień i gry na 8002.
Nie opublikowano publicznego wydania ani nie uruchomiono hostowanego CI.
