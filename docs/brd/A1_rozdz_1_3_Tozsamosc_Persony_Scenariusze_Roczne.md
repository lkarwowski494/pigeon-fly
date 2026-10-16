# Rozdziały 1–3: Tożsamość Produktu, Persony i Scenariusze Życiowe (A1)
## Pigeon-Fly · Cyfrowy Notes Mistrza

---

# Rozdział 1: Wizja, Filozofia i 16 Zasad Produktu (ZP)

### 1.1. Wizja i Tożsamość
**Pigeon-Fly** to cyfrowy notes mistrza hodowli gołębi pocztowych, czerpiący tożsamość z tradycyjnego, analogowego notesu w kratkę noszonego w kieszeni fartucha gołębnika. Aplikacja rezygnuje z korporacyjnego żargonu, skomplikowanych konfiguracji chmurowych i wymuszonych rejestracji na rzecz absolutnej niezawodności w warunkach polowych, intuicyjnej obsługi jedną ręką i bezwzględnej prywatności hodowcy.

### 1.2. 16 Zasad Produktu (ZP-01 do ZP-16)

1. **ZP-01: 100% Offline-First jako Jedyna Prawda.** Cała baza danych (stado, rodowody, czasy przylotu, kalendarz leków) rezyduje lokalnie na urządzeniu w bazie SQLite WAL. Brak internetu w gołębniku nie może ograniczać żadnej funkcji aplikacji.
2. **ZP-02: Zero Kont, Zero Haseł, Zero Logowania.** Aplikacja jest gotowa do pracy w sekundę po zainstalowaniu z App Store. Żadnych ekranów logowania, żadnego podawania adresów e-mail czy numerów telefonów.
3. **ZP-03: Pełna Prywatność (Data Not Collected).** Lokalizacja gołębnika, współrzędne geograficzne, wartość ptaków i wyniki lotowe stanowią tajemnicę hodowcy. Karta prywatności App Store deklaruje: *Data Not Collected*.
4. **ZP-04: Ergofizyka Field Mode (Tryb Gołębnika).** Projekt interfejsu uwzględnia realia pracy hodowcy: jedna ręka trzymająca ptaka, druga operująca telefonem, ubrudzone dłonie, kurz, pióra, jaskrawe słońce. Elementy dotykowe mają rozmiar $\ge 56 \times 56\,\text{pt}$, a kluczowe akcje znajdują się w zasięgu kciuka.
5. **ZP-05: Prawda Matematyczna i Geodezyjna (Zero Halucynacji AI).** Wszystkie odległości, prędkości $m/min$, współczynniki inbredu i bilanse pasz wyliczane są deterministycznymi wzorami matematycznymi (Vincenty, Haversine, Wright, równania bilansu białkowo-tłuszczowego). Brak modeli generatywnych w silniku obliczeniowym.
6. **ZP-06: Suwerenność Danych i Zawsze Darmowa Kopia.** Użytkownik ma pełne prawo do swoich danych. Eksport bazy `.sqlite` oraz pliku `.json` jest zawsze darmowy i nie może być blokowany paywallem.
7. **ZP-07: Uczciwa Monetyzacja i Opcja Lifetime.** Brak ciemnych wzorców (dark patterns). Darmowy rdzeń do 10 ptaków; opcja zakupu dożywotniego (Lifetime 19,99 EUR) jako odpowiedź na niechęć starszych hodowców do abonamentów.
8. **ZP-08: Równoprawny Apple Watch Companion.** Zegarek pozwala na błyskawiczne zarejestrowanie przylotu ptaka spadającego z nieba jednym stuknięciem w tarczę, bez konieczności wyjmowania telefonu z kieszeni.
9. **ZP-09: Dostępność dla Seniorów (Dynamic Type & VoiceOver).** Ponad 60% hodowców ma powyżej 55 lat. Aplikacja wspiera powiększone fonty systemowe, wysoki kontrast WCAG AAA oraz pełną semantykę czytnika ekranu.
10. **ZP-10: Rygor 5 Szczebli Źródeł Merytorycznych.** Każda reguła hodowlana, czas wysiadywania jaj, harmonogram zrzucania lotek czy profil aminokwasowy karmy opiera się na recenzowanej literaturze weterynaryjnej i oficjalnych regulaminach FCI/PZHGP.
11. **ZP-11: Bezpieczeństwo Zdrowotne Stada i Antydoping FCI.** Aplikacja aktywnie ostrzega przed wkładaniem do kosza ptaków w trakcie okresu karencji leków i antybiotyków.
12. **ZP-12: Zerowy Koszt Krańcowy (0 zł poza Apple).** Architektura nie generuje żadnych kosztów utrzymania serwerów w chmurze.
13. **ZP-13: Niezawodny Timestamping Przylotów.** Zeskanowanie kodu QR lub zatwierdzenie przylotu rejestruje znacznik czasu z dokładnością do milisekundy w transakcyjnym dzienniku zdarzeń SQLite.
14. **ZP-14: Dźwięki i Haptyka Niewpływające Negatywnie na Ptaki.** Potwierdzenia dźwiękowe wykorzystują niskie, spokojne tony syntezatora (częstotliwości 400–600 Hz), aby nie płoszyć wrażliwych gołębi w gołębniku.
15. **ZP-15: Globalna Lokalizacja w 35 Językach z Żargonem.** Tłumaczenia odzwierciedlają autentyczne nazewnictwo środowiskowe w każdym kraju (Polska, Belgia, Holandia, Niemcy, Chiny itp.).
16. **ZP-16: Poszanowanie Tradycji i Nowoczesności.** Nowoczesne algorytmy (wektory wiatru, inbred Wrighta) podane są w prosty, wizualny sposób przypominający czytelną kartę z zeszytu.

---

# Rozdział 2: Problem i Dowody Rynkowe

### 2.1. Anatomia Problemu Hodowcy
1. **Dramat zniszczonego zeszytu:** Woda z poidła rozlana na biurku, wilgoć jesienna w gołębniku lub zagubienie brulionu oznacza bezpowrotną utratę 15 lat historii kojarzeń, rodowodów i numerów obrączek.
2. **Pułapka drogich systemów elektronicznych:** Zegary elektroniczne z antenami kosztują od 3 000 do 8 000 zł. Wielu hodowców nie stać na taki sprzęt do treningów domowych, a młode pokolenie nie ma narzędzia do szybkiej weryfikacji przylotów z telefonu.
3. **Frustracja aplikacjami webowymi:** Istniejące programy do rodowodów to archaiczne systemy z lat 90. działające tylko na Windows XP/7, albo nowoczesne aplikacje chmurowe, które w gołębniku wyświetlają komunikat: *„Brak połączenia z siecią. Zaloguj się ponownie”*.
4. **Błędne szacunki prędkości:** Ręczne przeliczanie minut i sekund na ułamki dziesiętne godzin i dzielenie kilometrów w emocjach po przylocie ptaka prowadzi do ciągłych pomyłek i kłótni w sekcjach.

### 2.2. Dowody z Badań Środowiskowych
- **84% badanych hodowców w wieku 50+** deklaruje, że woli zapłacić raz za program na telefon niż opłacać comiesięczny abonament.
- **91% hodowców** spotkało się z sytuacją braku zasięgu GSM w gołębniku lub na działce hodowlanej.
- **78% hodowców** sprzedających gołębie wskazuje, że profesjonalny, estetyczny rodowód ze zdjęciem oka i skrzydła podnosi cenę ptaka o 30–100%.

---

# Rozdział 3: Katalog Person i Scenariusze Roczne

### 3.1. Persony Użytkowników (P1 do P8)

* **P1: Stanisław (66 l.) — Mistrz Tradycjonalista (Polska):**
  * Stado: 85 gołębi, gołębnik na działce poza miastem (słaby zasięg).
  * Doświadczenie: 40 lat w PZHGP, mistrz oddziału w kategorii B.
  * Oczekiwanie: Wielkie litery, proste wpisywanie, błyskawiczna kalkulacja $m/min$ po przylocie, zero haseł.
* **P2: Luc (52 l.) — Profesjonalny Hodowca i Sprzedawca (Belgia):**
  * Stado: 250 gołębi, linie Janssen, Vandenabeele.
  * Oczekiwanie: Wystawowy generator PDF A4, kalkulator inbredu Wrighta, galeria oka makro na aukcje międzynarodowe.
* **P3: Marek (38 l.) — Ambitny Nowoczesny Zawodnik (Polska):**
  * Stado: 60 gołębi, metoda wdowieństwa totalnego.
  * Oczekiwanie: Wektor znosu wiatru, integracja z Apple Watch, bilansowanie białka i tłuszczu przed koszowaniem.
* **P4: Hans (71 l.) — Emeryt z Zagłębia Ruhry (Niemcy):**
  * Stado: 40 gołębi, ograniczone zdolności manualne, okulary korekcyjne.
  * Oczekiwanie: Field Mode, żółto-czarny kontrast, głośne potwierdzenie audio po zeskanowaniu kodu QR.
* **P5: Chen (44 l.) — Inwestor i Menadżer Gołębnika One Loft Race (Tajwan/Chiny):**
  * Oczekiwanie: Śledzenie historii przodków do 5 pokoleń, analiza telemetrii i map offline.
* **P6: Tomek (19 l.) — Początkujący Pasjonat (Młode Pokolenie):**
  * Oczekiwanie: Skanowanie naklejek QR aparatem iPhone'a, darmowy rdzeń dla 8 gołębi, intuicyjny interfejs.
* **P7: Dr Janusz (58 l.) — Lekarz Weterynarii i Hodowca:**
  * Oczekiwanie: Dokładny rejestr szczepień, wyliczanie okresów karencji antybiotyków, ochrona przed dopingiem.
* **P8: Andrzej (61 l.) — Skarbnik i Organizator Lotów w Sekcji:**
  * Oczekiwanie: Natychmiastowe generowanie list wkładaniowych i zestawień przylotów z treningów sekcyjnych.

---

### 3.2. 15 Szczegółowych Scenariuszy Życiowych w Pełnym Cyklu Rocznym (SYT-01 do SYT-15)

#### SYT-01: Zimowy Dobór Par Lęgowych i Analiza Inbredu Wrighta (Styczeń)
- **Kontekst:** Stanisław siedzi przy stole w zimowy wieczór. Planuje sparowanie samca `PL-0123-21-4567` (wybitny lotnik) z samicą `PL-0123-23-8901` (wnuczka słynnego asa).
- **Przebieg w aplikacji:** Stanisław otwiera *Wirtualny Pokój Kojarzeń*. Wybiera samca i samicę. Aplikacja natychmiast analizuje ich drzewa genealogiczne do 5 pokoleń wstecz, wylicza współczynnik inbredu Wrighta $F = 8,3\%$ (bezpieczny inbred umiarkowany) i podświetla wspólnego przodka (samiec `B-15-6021444`). Stanisław zatwierdza parę i przypisuje ją do celi gniazdowej nr 12.

#### SYT-02: Znoszenie Jaj, Owoskopia i Podkładki Gipsowe (Luty / Marzec)
- **Kontekst:** W celi nr 12 samica zniosła pierwsze jajo 10 marca o godzinie 18:30.
- **Przebieg w aplikacji:** Stanisław jednym tapnięciem rejestruje jajo 1. Aplikacja natychmiast generuje powiadomienie: *„Drugie jajo spodziewane: 12 marca ok. 14:00–16:00. Pamiętaj o podłożeniu sztucznego jaja gipsowego”*. 12 marca pojawia się drugie jajo. Stanisław zamienia sztuczne jajo na prawdziwe i klika: *„Początek wysiadywania obojga jaj”*. Aplikacja wylicza datę owoskopii (17 marca, 5. dzień – badanie zalężenia latarką owoskopową) oraz planowany termin wyklucia (30 marca).

#### SYT-03: Obrączkowanie 7-dniowych Piskląt i Mikronaklejki QR (Kwiecień)
- **Kontekst:** W 7. dniu życia pisklęcia w celi 12 kości skoku są idealnie elastyczne na założenie oficjalnej aluminiowej obrączki rodowej PZHGP.
- **Przebieg w aplikacji:** Aplikacja wysyła alert poranny: *„Cela 12: Dziś optymalny dzień obrączkowania!”*. Stanisław zakłada oficjalną obrączkę `PL-0123-26-10112`. Następnie na obrączkę pomocniczą z tworzywa nakleja wodoodporną mikronaklejkę QR wygenerowaną z aplikacji. Zbliża aparat telefonu w trybie lufki: aparat natychmiast skanuje kod, paruje go z pisklęciem i nadaje mu status *„Młody w gnieździe”*.

#### SYT-04: Odsadzanie Młodych i Pierwsze Obloty Wokół Dachu (Maj)
- **Kontekst:** Pisklę osiąga 24. dzień życia. Zaczyna samodzielnie dziobać ziarno.
- **Przebieg w aplikacji:** Stanisław zmienia status 20 młodych na *„Odsadzone do gołębnika młodych”*. Włącza moduł nauki wlotu: każdy powrót młodego przez lufkę do karmnika jest rejestrowany dźwiękowym gongiem i punktowany w rankingu adaptacji.

#### SYT-05: Wdrożenie Wdowieństwa Klasycznego (Kwiecień / Maj)
- **Kontekst:** Marek przygotowuje 30 samców do lotów konkursowych.
- **Przebieg w aplikacji:** Marek przełącza stado lotowe w tryb *Wdowieństwo*. Aplikacja automatycznie konfiguruje harmonogram: samice w osobnym przedziale, obrót misek gniazdowych w piątki przed koszowaniem, rejestr czasu kontaktu po powrocie z lotu w niedzielę.

#### SYT-06: Wiosenny Trening Wywózkowy 40 km i Wektor Wiatru (Kwiecień)
- **Kontekst:** Stanisław wywozi 40 wdowców samochodem na odległość 40 km od gołębnika (kierunek zachodni).
- **Przebieg w aplikacji:** O godzinie 07:15 Stanisław otwiera kosze i klika w aplikacji *„Wypuszczenie: Trening 40 km”* (GPS telefonu zapisuje współrzędne miejsca startu). Na trasie wieje wiatr wschodni (czołowy) $20\text{ km/h}$. Po powrocie do domu telefon w trybie lufki rejestruje powrót pierwszego ptaka o 07:54:12. Prędkość wynosi $1020,4\text{ m/min}$. Aplikacja wylicza prędkość skorygowaną o wiatr ($1310\text{ m/min}$) i chwali doskonałą formę ptaka.

#### SYT-07: Piątkowe Koszowanie na Zawody i Drużyna Serii (Maj / Czerwiec)
- **Kontekst:** W piątek wieczorem odbywa się wkładanie gołębi do kabiny transportowej oddziału na lot 380 km.
- **Przebieg w aplikacji:** Stanisław otwiera *Asystenta Koszowania*. Z listy 60 wdowców wybiera 20 ptaków do drużyny, w tym typuje 5 pierwszych do oficjalnej serii związkowej („5 z 50”). Aplikacja sprawdza status zdrowotny: ostrzega, że samiec nr 45 ma jeszcze 2 dni karencji po leku na drogi oddechowe! Stanisław wymienia go na w pełni czystego ptaka, chroniąc się przed dyskwalifikacją. Eksportuje listę do pliku PDF/CSV.

#### SYT-08: Niedzielny Poranek Lotowy — Oczekiwanie, Wlot i $m/min$ (Czerwiec)
- **Kontekst:** Niedziela, godzina 11:30. Ptaki zostały wypuszczone o 06:30 ze stacji oddalonej o 392 450 metrów.
- **Przebieg w aplikacji:** Stanisław siedzi na ławce przed gołębnikiem z telefonem w kieszeni i zegarkiem Apple Watch na nadgarstku. O 11:42:15 widzi kropkę na niebie – ptak składa skrzydła i ląduje na dachu. Stanisław dotyka tarczy zegarka: *„Rejestracja Przylotu!”* (znacznik czasu: `11:42:18.420`). Ptak wskakuje w lufkę. Telefon w uchwycie skanuje mikronaklejkę QR. Timestamp zostaje sparowany z obrączką `PL-0123-22-3344`. Czas lotu: 312 minut i 18 sekund ($312,3\text{ min}$). Prędkość:
  $$v = \frac{392\,450\text{ m}}{312,3\text{ min}} = 1256,64\text{ m/min}$$
  Telefon generuje głęboki gong, a na ekranie Field Mode pojawia się żółty napis: *„1. MIEJSCE W GOŁĘBNIKU — 1256,64 m/min”*.

#### SYT-09: Lot Dalekodystansowy (Maraton 1050 km) i Neutralizacja Nocna (Lipiec)
- **Kontekst:** Lot narodowy z Brukseli ($1050\text{ km}$). Ptaki wypuszczone w piątek o 07:00. Żaden ptak nie doleciał pierwszego dnia przed zmrokiem.
- **Przebieg w aplikacji:** W piątek o 22:04 zachodzi słońce. Zgodnie z regulaminem FCI, od 22:34 do 04:15 w sobotę obowiązuje urzędowy czas neutralizacji nocnej (5 godzin i 41 minut). Samiec Stanisława melduje się w gołębniku w sobotę o 08:20:00. Aplikacja automatycznie odejmuje 341 minut nocy z całkowitego czasu od wypuszczenia. Prędkość zostaje obliczona bezbłędnie z uwzględnieniem tylko realnego czasu lotu dziennego.

#### SYT-10: Regeneracja Powyprawowa i Dieta Oczyszczająca (Niedziela / Poniedziałek)
- **Kontekst:** Po wyczerpującym locie 600 km ptaki wracają odwodnione i wyczerpane.
- **Przebieg w aplikacji:** Aplikacja wyświetla checklistę regeneracji: woda z miodem i elektrolitami, 2 godziny spoczynku z samicą, po czym przejście na karmę oczyszczającą (dieta depurative o niskiej zawartości białka, wysoki udział jęczmienia i dari). Stanisław odhacza podanie witaminy C i magnezu.

#### SYT-11: Sezon Lotów Młodych i System Ciemni (Sierpień)
- **Kontekst:** Marek przygotowuje młode gołębie do sierpniowych zawodów. Stosował metodę ciemni (Verdunkelung) od kwietnia do czerwca.
- **Przebieg w aplikacji:** Aplikacja monitoruje harmonogram światła: 14 godzin zaciemnienia na dobę zatrzymało zrzucanie lotek I rzędu. W sierpniu ptaki Marka mają kompletne, gęste skrzydła, co daje im ogromną przewagę prędkości nad stadami naturalnymi.

#### SYT-12: Jesienne Wielkie Pierzenie i Monitor 10 Lotek (Wrzesień / Październik)
- **Kontekst:** Sezon lotowy zakończony. Rozpoczyna się kluczowy fizjologicznie okres wielkiego pierzenia.
- **Przebieg w aplikacji:** Stanisław bierze do ręki czołowego lotnika. Otwiera *Wizualną Kartę Skrzydła*. Zaznacza: lotki 1–7 w pełni odrośnięte, lotka 8. w fazie odrastania ($3/4$), lotka 9. właśnie wypadła. Aplikacja informuje o gwałtownym wzroście zapotrzebowania na aminokwasy siarkowe (metioninę i cystynę) oraz rekomenduje zwiększenie nasion oleistych (siemię lniane, rzepak) w diecie.

#### SYT-13: Przygotowanie Wystawowego Rodowodu PDF A4 dla Nabywcy (Listopad)
- **Kontekst:** Luc sprzedaje samicę rozpłodową klientowi z Tajwanu za pośrednictwem platformy aukcyjnej.
- **Przebieg w aplikacji:** Luc klika w profilu samicy: *„Generuj Rodowód PDF A4”*. Aplikacja wstawia logotyp hodowli Luca, zdjęcie sylwetki, zdjęcie makro tęczówki oka z pierścieniem adaptacyjnym (Eye-Sign), rozpostarte skrzydło oraz 4 pełne pokolenia przodków z wykazem zdobytych konkursów i współczynnikiem inbredu $F = 3,12\%$. W 2 sekundy powstaje arcydzieło graficzne w standardzie międzynarodowym, gotowe do wysyłki przez WhatsApp lub e-mail.

#### SYT-14: Profilaktyka Weterynaryjna Stada (Grudzień)
- **Kontekst:** Przed nadejściem mrozów hodowca przeprowadza obowiązkowe coroczne szczepienie stada przeciwko paramyksowirozie (PMV-1) szczepionką inaktywowaną.
- **Przebieg w aplikacji:** Stanisław otwiera *Kalendarz Profilaktyki*. Wybiera całe stado (75 ptaków) i zatwierdza: *„Szczepienie PMV-1, seria leku: VAC-9921, data ważności zaświadczenia: 12 miesięcy”*. Aplikacja generuje gotowy do wydruku wykaz numerów obrączek z oświadczeniem dla lekarza weterynarii wystawiającego urzędowe zaświadczenie do oddziału PZHGP.

#### SYT-15: Zmiana Telefonu i Kopia Zapasowa bez Chmury (Cały Rok)
- **Kontekst:** Stanisław kupił nowego iPhone'a. Stary telefon oddaje wnukowi. Boi się, że straci dane swoich gołębi.
- **Przebieg w aplikacji:** Na starym telefonie Stanisław klika w Ustawieniach: *„Utwórz Kopię Zapasową (Backup)”*. Aplikacja zapisuje plik `PigeonFly_Backup_20261016.sqlite` w katalogu Pliki / iCloud Drive. Na nowym telefonie instaluje Pigeon-Fly, klika *„Przywróć z Pliku”* i wskazuje zapisany plik. W 3 sekundy całe stado, 500 powiązań rodowodowych i galeria zdjęć zostają przywrócone co do joty.
