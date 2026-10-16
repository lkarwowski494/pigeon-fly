# Rozdziały 1–3: Tożsamość Produktu, Persony i Scenariusze Życiowe (A1)
## Pigeon-Fly · Cyfrowy Notes Mistrza w Erze Chmury Supabase

---

# Rozdział 1: Wizja, Filozofia i Zaktualizowane Zasady Produktu (ZP)

### 1.1. Wizja i Nowa Tożsamość
**Pigeon-Fly** to cyfrowy notes mistrza hodowli gołębi pocztowych, czerpiący tożsamość z tradycyjnego zeszytu w kratkę noszonego w kieszeni fartucha gołębnika, podniesiony do potęgi nowoczesnej bazy danych **Supabase**. Aplikacja łączy polową niezawodność (100% offline w gołębniku) z globalnymi możliwościami współpracy, transmisji wyników na żywo i certyfikacji rodowodów.

### 1.2. 18 Zasad Produktu (ZP-01 do ZP-18)

1. **ZP-01: Hybrydowy Offline-First z Replikacją Supabase.** Wszystkie operacje (odczyt, zapis, kalkulacje) wykonują się natychmiast w lokalnej bazie SQLite WAL. Brak internetu w gołębniku nie blokuje żadnej akcji. Gdy sieć staje się dostępna, silnik asynchronicznie replikuje dane z chmurą Supabase.
2. **ZP-02: Zero-Friction Wejścia (Anonimowy Start $\rightarrow$ Apple Sign-In).** Aplikacja nie zmusza do rejestracji. Hodowca zaczyna z lokalną bazą lub anonimową sesją Supabase. Dopiero włączenie tandemu, relacji live lub chmurowego backupu oferuje 1-tap powiązanie z *Sign in with Apple*.
3. **ZP-03: Bezpieczeństwo i Izolacja Danych (Row Level Security).** Dostęp do danych gołębnika jest chroniony na poziomie silnika PostgreSQL (Supabase RLS). Współrzędne gołębnika i prywatne notatki są ściśle ukryte przed światem.
4. **ZP-04: Ergofizyka Field Mode (Tryb Gołębnika).** Przyciski $\ge 56 \times 56\,\text{pt}$, obsługa jedną ręką, kontrast w słońcu, blokada wygaszania ekranu (`isIdleTimerDisabled = true`).
5. **ZP-05: Prawda Matematyczna i Geodezyjna (Zero Halucynacji AI).** Deterministyczne algorytmy Vincenty'ego, Wrighta, Weende i wzory FCI zaimplementowane w Swift oraz w procedurach PostgreSQL.
6. **ZP-06: Suwerenność Danych i Podwójna Kopia.** Hodowca ma prawo do swoich danych: darmowy eksport pliku `.sqlite` i `.json` lokalnie oraz bezpieczny skarbiec replikacji w chmurze Supabase.
7. **ZP-07: Uczciwa Monetyzacja z Opcją Lifetime.** Darmowy rdzeń do 10 ptaków; wersja Pro (1,99 EUR/msc, 6,99 EUR/rok, 19,99 EUR Lifetime) odblokowuje nielimitowane stado, tandem hodowlany, transmisje live i chmurę.
8. **ZP-08: Równoprawny Apple Watch Companion.** Zegarek z niezależnym 1-tap rejestrowaniem przylotu i buforem offline.
9. **ZP-09: Dostępność dla Seniorów (Dynamic Type & VoiceOver).** Pełne wsparcie powiększonych fontów i czytnika ekranu.
10. **ZP-10: Rygor 5 Szczebli Źródeł Merytorycznych.** Każda reguła oparta na regulaminach FCI/PZHGP i literaturze weterynaryjnej.
11. **ZP-11: Bezpieczeństwo Zdrowotne Stada i Antydoping FCI.** Kontrola okresów karencji leków i blokada wkładania ptaków w trakcie leczenia.
12. **ZP-12: Niskie Koszty Krańcowe Studia.** Wykorzystanie darmowego tieru Supabase (do 50 000 MAU) gwarantuje zerowe koszty serwerów przy starcie.
13. **ZP-13: Niezawodny Timestamping Przylotów.** Zapisywanie czasów co do milisekundy w append-only dzienniku zdarzeń.
14. **ZP-14: Dźwięki i Haptyka Przyjazne dla Ptaków.** Spokojne tony 400–600 Hz i haptyka Taptic Engine.
15. **ZP-15: Globalna Lokalizacja w 35 Językach z Żargonem.** Autentyczne nazewnictwo środowiskowe w każdym kraju.
16. **ZP-16: Poszanowanie Tradycji i Nowoczesności.** Nowoczesna chmura opakowana w prostotę notatnika.
17. **ZP-17: Zweryfikowany Cyfrowy Paszport Rodowodu.** Kryptograficzny certyfikat online pod kodem QR chroniący przed fałszowaniem rodowodów.
18. **ZP-18: Globalna Społeczność i Sieć Pomocy Zagubionym Ptakom (Lost & Found).** Błyskawiczny mechanizm zgłaszania odnalezionych ptaków z powiadomieniem właściciela.

---

# Rozdział 2: Problem i Dowody Rynkowe

### 2.1. Anatomia Nowych Wyzwań Środowiska
1. **Brak współpracy w spółkach hodowlanych (Tandemach):** W nowoczesnym sporcie gołębiarskim ponad 35% czołowych gołębników to tandemy (np. ojciec zajmuje się karmieniem rano, syn wypuszcza na obloty wieczorem). Dotychczasowe programy desktopowe uniemożliwiały wspólną pracę na dwóch telefonach.
2. **Fałszerstwa rodowodów na rynku transferowym:** Na aukcjach międzynarodowych regularnie dochodzi do podrabiania papierowych rodowodów znanych linii (np. Janssen, Koopman). Kupcy żądają cyfrowego uwierzytelnienia pochodzenia ptaka.
3. **Stres w dniu lotu i brak informacji („Czy ptaki już siadają?”):** W niedzielne poranki hodowcy wykonują dziesiątki telefonów do kolegów z okolicznych wsi, pytając o pierwsze przyloty. Brakowało lekkiego systemu do prywatnych mini-derbów na żywo.
4. **Dramat zagubionych ptaków po nawałnicach:** Co roku tysiące gołębi siada z wycieńczenia na dachach i balkonach ludzi niezwiązanych z hodowlą. Znalazca widzi numer obrączki, ale nie ma pojęcia, jak znaleźć właściciela.

---

# Rozdział 3: Katalog Person i Scenariusze Życiowe

### 3.1. Zaktualizowany Katalog Person (P1 do P10)

* **P1: Stanisław (66 l.) — Mistrz Tradycjonalista (Polska):** Gołębnik bez Wi-Fi, kocha prostotę, zyskuje automatyczny backup w chmurze przy powrocie do domu.
* **P2: Luc (52 l.) — Profesjonalny Hodowca i Sprzedawca (Belgia):** Sprzedaje ptaki do Azji, kluczowy użytkownik portalu weryfikacji rodowodów online (Supabase).
* **P3: Marek (38 l.) — Nowoczesny Zawodnik:** Korzysta z wektora wiatru, Apple Watch i transmisji Live Derby z kolegami z sekcji.
* **P4: Hans (71 l.) — Emeryt z Zagłębia Ruhry (Niemcy):** Field Mode, żółty kontrast, czytelny interfejs.
* **P5: Chen (44 l.) — Menadżer One Loft Race (Tajwan):** Obsługuje stado 1000 ptaków w chmurze Supabase, udostępnia podgląd właścicielom.
* **P6: Tomek (19 l.) — Początkujący Pasjonat:** Zaczyna od darmowego tieru, skanuje obrączki QR telefonem.
* **P7: Dr Janusz (58 l.) — Lekarz Weterynarii:** Rejestr szczepień i karencji antydopingowej.
* **P8: Andrzej (61 l.) — Skarbnik Oddziału:** Organizuje listy wkładaniowe i wyniki sekcyjne.
* **P9: Janusz (60 l.) i Michał (28 l.) — Tandem Hodowlany „Kowalski & Syn” (NOWA PERSONA):**
  - Ojciec jest w gołębniku ze smartfonem, syn w pracy z iPadem/MacBookiem.
  - Oboje mają dostęp do tego samego stada w Supabase w czasie rzeczywistym z uprawnieniami RLS.
* **P10: Karolina (30 l.) — Znalazca Zagubionego Gołębia (NOWA PERSONA):**
  - Mieszka w bloku w Warszawie. Znalazła na balkonie zmęczonego gołębia z obrączką i mikronaklejką QR.
  - Nie instaluje aplikacji – otwiera stronę `pigeonfly.app/znaleziony`, wpisuje numer obrączki lub skanuje kod aparatem. Właściciel natychmiast dostaje powiadomienie Push.

---

### 3.2. Kompletny Katalog Scenariuszy Życiowych i Rocznych (SYT-01 do SYT-24)

#### SYT-01: Zimowy Dobór Par i Symulacja Inbredu Wrighta (Grudzień / Styczeń)
- **Kontekst:** Stanisław planuje sezon lęgowy. Siedzi wieczorem w domu, analizując karty 40 gołębi rozpłodowych.
- **Przebieg:** Otwiera w Pigeon-Fly moduł *„Kojarzenie Par”*. Wybiera czołowego samca-rozpłodowca `PL-0123-19-101` i testuje trzy potencjalne samice. Dla każdej pary Pigeon-Fly natychmiast wylicza współczynnik inbredu $F$ wg Wrighta na podstawie 4 pokoleń. Dla pierwszej samicy $F = 25\%$ (ojciec x córka — ostrzeżenie o depresji inbredowej), dla drugiej $F = 3,125\%$ (bezpieczny line-breeding na słynnego dziadka). Stanisław zatwierdza parę i przypisuje ją do celi nr 12. Generuje wstępną kartę planowanego lęgu.

#### SYT-02: Pierwsze Jajo, Podmiana na Gips i Odliczanie +44h (Luty / Marzec)
- **Kontekst:** W celi nr 12 samica znosi pierwsze jajo w chłodny marcowy wieczór o 17:30.
- **Przebieg:** Stanisław wchodzi do gołębnika w grubych rękawicach roboczych. Wyjmuje jajo, wkłada do wytłaczarki z nasionami w temperaturze 16°C i wkłada parze sztuczne jajo gipsowe. W Pigeon-Fly włącza *Field Mode*, wybiera Celę 12 i dotyka przycisku *„Jajo 1 Zniesione (Podmieniono na sztuczne)”*. Aplikacja zapisuje timestamp i uruchamia odliczanie biologiczne: prognozowane jajo 2 za 44 godziny ($\pm 2\text{ h}$). Stanisław otrzymuje powiadomienie przypominające w telefonie i na Apple Watch.

#### SYT-03: Zniesienie Drugiego Jaja i Rozpoczęcie Inkubacji
- **Kontekst:** Po 43 godzinach i 40 minutach samica znosi drugie jajo.
- **Przebieg:** Stanisław zabiera jajo gipsowe i zwraca parze pierwsze naturalne jajo. W aplikacji klika *„Jajo 2 Zniesione — Rozpoczęto Pełną Inkubację”*. Pigeon-Fly natychmiast generuje 3 kluczowe punkty harmonogramu:
  1. *Owoskopia (Prześwietlanie)*: za 5 dni (19 marca).
  2. *Spodziewany Wylęg*: za 18 dni (1 kwietnia).
  3. *Okno Obrączkowania*: za 24–26 dni (7–9 kwietnia).

#### SYT-04: Owoskopia Dnia 5. — Wykrycie Zbuków i Zarodków
- **Kontekst:** Mija 5. doba inkubacji w celi 12. Stanisław wchodzi wieczorem po zmroku z owoskopem diodowym.
- **Przebieg:** Stanisław przykłada latarkę owoskopu do tępego bieguna jaja. W pierwszym widzi wyraźnego „pajączka” — rozgałęzioną sieć naczyń krwionośnych z pulsującym punktem. W aplikacji oznacza: *Jajo 1: Zapłodnione*. Drugie jajo jest całkowicie przezroczyste (zbuk). Aplikacja sugeruje: *„Jajo niezalężone. Zalecane usunięcie lub pozostawienie podkładu, by nie obciążać samicy pustym wysiadywaniem”*. Stanisław usuwa puste jajo, co zapobiega marnotrawieniu energii pary.

#### SYT-05: Zsynchronizowany Wylęg i Karmienie Mleczkiem z Wola (Kwiecień)
- **Kontekst:** Dokładnie w 18. dobie pisklę nakłuwa skorupę i wykluwa się o 06:15.
- **Przebieg:** Dzięki wcześniejszej podmianie jaja pisklęta klują się w odstępie zaledwie 2 godzin. Rodzice natychmiast zaczynają karmić je czystym mleczkiem z wola (prolaktynowa papka białkowo-tłuszczowa). Stanisław oznacza w aplikacji: *„Wyklute — Zdrowe”*. Moduł żywieniowy Pigeon-Fly automatycznie aktualizuje plan karmienia dla celi lęgowej: przejście na mieszankę lęgową 18% białka z dodatkiem witaminy A, D3 i fosforanu wapnia.

#### SYT-06: Krytyczne Okno Obrączkowania PZHGP (Doba 6–8)
- **Kontekst:** Młode pisklę ma 7 dni. Kość stępu osiąga optymalną grubość 7,6 mm.
- **Przebieg:** Stanisław otrzymuje rano czerwony alert na Apple Watch: *„Cela 12: Dziś optymalny dzień obrączkowania (Doba 7)! Jutro staw stępu może uniemożliwić nałożenie obrączki”*. Stanisław bierze oficjalną obrączkę rodową PZHGP `PL-0123-26-5501` z mikronaklejką QR Pigeon-Fly. Składa 3 przednie palce młodka, nasuwa obrączkę i delikatnie przeciąga palec tylny (hallux). Następnie skanuje kod QR obrączki aparatem iPhone'a. Aplikacja natychmiast łączy numer obrączki z rodowodem rodziców z celi 12 i generuje Cyfrowy Paszport Młodka.

#### SYT-07: Odsadzanie Piskląt i Samodzielność w Wolierze (Doba 24)
- **Kontekst:** Młode w celi 12 osiągają wiek 24 dni. Zaczynają schodzić z misek na podłogę.
- **Przebieg:** Stanisław przenosi młódka do sekcji młodych. W Pigeon-Fly oznacza: *„Odsadzony do gołębnika młodych”*. Aplikacja aktywuje protokół buforowania poidła kwasami organicznymi (ocet jabłkowy, pH 4,2), aby zabezpieczyć niedojrzały przewód pokarmowy młodka przed rzęsistkowicą i bakteriami *E. coli*.

#### SYT-08: Wdrożenie Systemu Ciemni (Verdunkelung) dla Młodych (Marzec – Czerwiec)
- **Kontekst:** Wiosna. Stanisław przygotowuje 50 młodych do jesiennych zawodów.
- **Przebieg:** W aplikacji włącza moduł *„Fotoperiod: System Ciemni”*. Aplikacja wylicza optymalny harmonogram rolet: zaciemnienie od 18:00 do 08:00 (14 godzin pełnej ciemności, poniżej 0,5 lx). Codziennie o 17:45 i 07:45 aplikacja wysyła przypomnienie o opuszczeniu/podniesieniu rolet. Dzięki temu szyszynka młodych wstrzymuje zrzucanie lotek skrzydła, zrzucając jedynie drobne pióra okrywowe. W sierpniu młode mają pełne skrzydła dorosłych asów.

#### SYT-09: Przejście na Doświetlanie (Belichtung) po Przesileniu Letnim (Czerwiec)
- **Kontekst:** 22 czerwca, po najdłuższym dniu w roku.
- **Przebieg:** Pigeon-Fly przełącza profil fotoperiodyczny na *„Doświetlanie (16h światła)”*. Stanisław ustawia zegar sterujący oświetleniem w gołębniku na godziny 05:00–22:00. Zapobiega to gwałtownemu załamaniu formy i zrzuceniu skrzydeł w trakcie sierpniowych konkursów młodych.

#### SYT-10: Tygodniowa Rotacja Żywieniowa Wdowców (Poniedziałek – Niedziela)
- **Kontekst:** Sezon lotów gołębi dorosłych. Wdowiec przygotowuje się do sobotniego koszowania na lot 520 km.
- **Przebieg:** Stanisław korzysta z modułu *Żywienie*.
  - *Poniedziałek:* Dieta depuratywna (oczyszczająca, jęczmień 40%, ostropest plamisty, elektrolity w poidle).
  - *Wtorek–Środa:* Dieta lekka lotowa (węglowodany, kukurydza cribs, ryż paddy).
  - *Czwartek–Piątek rano:* Ładowanie lipidowe (orzeszki ziemne 48% tłuszczu, nasiona słonecznika, kardi, L-karnityna w wodzie wg RD-16).
  - *Piątek po południu:* Czysta woda z magnezem i nasiona drobne (kanar, proso). Ptaki idą do kosza z pełnymi bateriami tłuszczowymi i wolnymi od ciężkostrawnego białka wolami.

#### SYT-11: Kontrola Pierzenia Skrzydła i Wyliczenie Indeksu ARI
- **Kontekst:** Przed koszowaniem na lot 650 km Stanisław ogląda skrzydło czołowego asa `PL-0123-22-4412`.
- **Przebieg:** Ptak zrzucił 6. lotkę, a 7. odrasta do połowy. Stanisław klika w kartę ptaka i przesuwa suwak 7. lotki na 50%. Pigeon-Fly natychmiast przelicza wskaźnik ARI (RD-12): $ARI = 0,85$. Aplikacja wyświetla informację: *„Dopuszczony do lotów średniodystansowych kat. B. Ze względu na lukę w strefie nośnej odradza się lot maratoński pow. 700 km”*. Stanisław podejmuje świadomą decyzję o zmianie ptaka na w pełni opierzonego zmiennika.

#### SYT-12: Profilaktyka Przeciw Rzęsistkowi i Zespołowi YPDS (Adeno-Coli)
- **Kontekst:** U młodych po locie treningowym pojawia się ospałość i wymioty ziarnem.
- **Przebieg:** Stanisław otwiera moduł *Zdrowie* i uruchamia *„Asystenta Diagnostycznego Objawów”*. Zaznacza: *wymioty ziarnem, zielonkawy kał, wiek: młode*. Aplikacja wskazuje podejrzenie Adeno-Coli (YPDS) i generuje natychmiastowy protokół ratunkowy:
  1. Głodówka 24h na ziarno twarde (podawać wyłącznie elektrolity i herbatkę z rumianku).
  2. Zakwaszenie poidła kwasem mrówkowym/octowym do pH 4,0.
  3. Podanie maślanu sodu i immunoglobulin żółtkowych IgY.
  4. Kontakt z lekarzem weterynarii przed podaniem antybiotyku.
  Dzięki szybkiej reakcji stado zostaje uratowane bez strat.

#### SYT-13: Rejestr Szczepień Stada i Karencja Antydopingowa FCI (E-Księga PIW)
- **Kontekst:** Stanisław szczepi całe stado przeciw Paramyksowirozie (PMV-1) szczepionką skojarzoną z Herpeswirusem.
- **Przebieg:** W module *Zdrowie* Stanisław wybiera *„Szczepienie Stadne”*. Skanuje kod kreskowy z butelki szczepionki (seria, data ważności). Zaznacza wszystkie 60 ptaków jednym kliknięciem. Aplikacja rejestruje zabieg i generuje gotowy raport PDF zgodny z wymaganiami Powiatowego Lekarza Weterynarii (PIW) do okazania przed sezonem. Dodatkowo aplikacja nanosi 14-dniowy okres karencji na leki i blokuje dodanie ptaka do listy wkładaniowej w przypadku trwającej kuracji antybiotykowej.

#### SYT-14: Koszowanie w Punkcie Wkładania — Lista Związkowa i Kontrola Zgłoszeń
- **Kontekst:** Piątek wieczór w punkcie wkładania sekcji. Stanisław wkłada 35 wdowców.
- **Przebieg:** Stanisław generuje z Pigeon-Fly oficjalną listę wkładaniową PDF z kodami obrączek, barwami i typowaniami do serii (np. 5 z 50). Podczas przekazywania ptaków komisji weryfikuje numery w aplikacji offline. Zegary elektroniczne ESK rejestrują czipy, a Stanisław zapisuje stację i planowaną godzinę wypuszczenia.

#### SYT-15: Niedzielny Poranek — Oczekiwanie, Wektor Wiatru i Pomiar m/min
- **Kontekst:** Niedziela rano, godz. 06:15. SMS z oddziału: *„Wypuszczono z Peine o 06:15, pogoda słoneczna, wiatr SW 15 km/h”*.
- **Przebieg:** Stanisław wprowadza do Pigeon-Fly godzinę startu `06:15:00`. Aplikacja pobiera z serwisu pogodowego wektor wiatru (RD-06) i wylicza przewidywaną prędkość stada (ok. 1350 m/min) oraz estymowany przylot: 11:22. Stanisław siada przed gołębnikiem z telefonem w lufce. O 11:24:15 pierwszy ptak wpada do wlotu. Kamera skanuje kod QR na obrączce pomocniczej. W ułamku sekundy aplikacja wyświetla:
  $$\text{Dystans: } 418\,520\text{ m} \quad | \quad \text{Czas: } 309\text{ min } 15\text{ s} \quad | \quad \textbf{Prędkość: } 1353,34\text{ m/min}$$
  Telefon generuje przyjemny ton 500 Hz i haptykę sukcesu.

#### SYT-16: Live Relacja z Lotu przez Supabase Realtime (Wspólne Emocje w Sekcji)
- **Kontekst:** Niedzielny lot z Peine (420 km). Marek czeka na gołębnika na swoje ptaki.
- **Przebieg:** Rano przed lotem Marek klika w aplikacji: *„Włącz Transmisję Live dla Znajomych”*. Aplikacja generuje unikalny kanał w Supabase Realtime i prywatny link `pigeonfly.app/live/MAREK-LOT`. Marek wysyła link na grupie WhatsApp swojej sekcji. O 11:24 pierwszy gołąb wchodzi przez lufkę. Telefon w lufce rejestruje kod QR. W ułamku sekundy przez WebSockets w Supabase informacja pojawia się na telefonach 15 kolegów z sekcji: *„Marek: 1. ptak PL-0123-23-4567, godz. 11:24:12, prędkość 1312,4 m/min!”*. Wszyscy widzą wynik na żywo bez dzwonienia.

#### SYT-17: Praca w Tandemie Hodowlanym Ojciec i Syn (Współdzielone Stado)
- **Kontekst:** Janusz i Michał prowadzą wspólny gołębnik. Janusz jest rano w gołębniku, Michał wraca po południu.
- **Przebieg:** Janusz dodaje Michała do gołębnika jako `MEMBER` w module *Tandem Hodowlany*. Rano Janusz w gołębniku oznacza w aplikacji, że para w celi 8 zniosła pierwsze jajo. Zapis trafia do lokalnego SQLite, a po wyjściu z gołębnika synchronizuje się z Supabase. Michał w biurze otwiera aplikację na Macu/iPadzie i natychmiast widzi zaktualizowany stan celi 8. Po południu Michał rejestruje szczepienie stada – Janusz widzi to natychmiast na swoim telefonie.

#### SYT-18: Odzyskanie Wybitnego Asa Lotowego przez Sieć Lost & Found
- **Kontekst:** Po ciężkim locie z burzami czołowy samiec Stanisława nie powrócił do gołębnika. Stanisław oznaczył go w aplikacji jako `ZAGINIONY`.
- **Przebieg:** Dwa dni później wycieńczony ptak ląduje w ogrodzie Karoliny pod Płockiem. Karolina widzi na nodze ptaka mikronaklejkę QR z napisem `pigeonfly.app`. Skanuje kod aparatem iPhone'a. Strona webowa w Supabase wyświetla bezpieczny formularz: *„Znalazłeś gołębia pocztowego! Wpisz swój numer telefonu lub miejscowość”*. Karolina wpisuje swój numer. Supabase Edge Function natychmiast wysyła powiadomienie Push do telefonu Stanisława: *„Twój gołąb PL-0123-22-1234 został odnaleziony w Płocku! Znalazca: 501-xxx-xxx”*. Stanisław dzwoni do Karoliny i odzyskuje bezcennego ptaka.

#### SYT-19: Weryfikacja Autentyczności Rodowodu Online przez Kupca z Tajwanu
- **Kontekst:** Luc wystawia samicę na sprzedaż. Klient z Tajwanu chce mieć 100% pewności, że rodowód nie został sfałszowany w Photoshopie.
- **Przebieg:** Luc drukuje rodowód PDF wygenerowany z Pigeon-Fly. Na dole dokumentu znajduje się kod QR i link `pigeonfly.app/pedigree/A9F-2026-BE`. Kupiec w Tajpej skanuje kod QR. Przeglądarka otwiera oficjalny certyfikat kryptograficzny z bazy Supabase z pieczęcią hodowli Luca, kompletnym drzewem przodków i oryginalnymi zdjęciami 4K oka i skrzydła. Kupiec bez wahania finalizuje transakcję.

#### SYT-20: Maraton Dwudniowy i Rygor Neutralizacji Nocnej FCI (Bruksela 950 km)
- **Kontekst:** Najtrudniejszy lot maratoński sezonu z Belgii. Ptaki nie dolatują w pierwszym dniu przed zmrokiem.
- **Przebieg:** Stanisław czeka na samicę z linii Jan Aarden. W aplikacji aktywny jest automatyczny zegar neutralizacji nocy (RD-35). Zgodnie z oficjalną tabelą wschodu i zachodu słońca dla współrzędnych gołębnika, czas od godziny 21:42 do 04:18 zostaje zatrzymany. Samica ląduje o 05:12 rano. Pigeon-Fly wylicza oficjalny czas konkursowy po potrąceniu godzin nocnych i plasuje ptaka w czołówce maratonu narodowego.

#### SYT-21: Kąpiel Regeneracyjna i Ziołowa Herbatka z Miodem
- **Kontekst:** Poniedziałek po maratonie. Zmęczone ptaki potrzebują relaksu mięśniowego.
- **Przebieg:** Stanisław przygotowuje basen z letnią wodą i solami do kąpieli. W module *Żywienie i Pielęgnacja* odhacza *„Kąpiel regeneracyjna z solą magnezową i octem”*. Do poidła podaje napar z 14 ziół z dodatkiem miodu pszczelego i witaminy B-complex. Aplikacja rejestruje procedurę i oznacza stan stada jako *„W trakcie regeneracji”*.

#### SYT-22: Jesienne Pierzenie Główne — Odbudowa Szaty na Zimą (Wrzesień – Listopad)
- **Kontekst:** Zakończenie sezonu lotowego. W gołębniku rozpoczyna się wymiana całego upierzenia (lotki, sterówki, pióra puchowe).
- **Przebieg:** Stanisław przełącza dietę stada na *„Mieszankę Pierzeniową”* o podwyższonej zawartości siarkowych aminokwasów (metionina, cystyna) oraz nasion oleistych (siemię lniane, rzepak). Raz w tygodniu w aplikacji aktualizuje stan zrzucenia lotek 8, 9 i 10 u poszczególnych asów. Monitoruje, by żadna lotka nie wyrosła ze skazą „krwawego pióra” lub przewężeniem stosiny.

#### SYT-23: Selekcja Jesienna i Planowanie Obsady Cel na Nowy Rok
- **Kontekst:** Listopad. W gołębniku jest 120 ptaków, a miejsc na zimę tylko 80.
- **Przebieg:** Stanisław otwiera w Pigeon-Fly *„Matrycę Selekcyjną”*. Aplikacja sortuje stado wg sumy konkursów, coeficjentów FCI, punktacji rodowodowej oraz ocen budowy anatomicznej (skrzydło, widełki miednicowe, upierzenie). Stanisław bez emocji i sentymentów eliminuje ptaki nie rokujące nadziei, uzyskując idealną obsadę 40 par na kolejny sezon.

#### SYT-24: Pełna Kopia Zapasowa Przed Zmianą Smartfona na Nowy Model
- **Kontekst:** Grudzień. Stanisław kupuje nowego iPhone'a na święta.
- **Przebieg:** Na starym telefonie wchodzi w *Ustawienia $\rightarrow$ Kopia Zapasowa*. Klika *„Eksportuj Pełny Skarbiec Gołębnika (.sqlite + media ZIP)”*. Plik zapisuje się w iCloud Drive oraz w pamięci pendrive'a Lightning. Po uruchomieniu nowego telefonu Stanisław instaluje Pigeon-Fly, loguje się przez Apple ID i w 3 sekundy całe stado, rodowody, zdjęcia i historia lotów z 10 lat są w pełni odtworzone.

