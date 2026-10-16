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

### 3.2. Nowe i Zaktualizowane Scenariusze Życiowe (SYT-01 do SYT-19)

*(Scenariusze SYT-01 do SYT-15 z wersji 0.1 pozostają w pełni aktualne: zimowy dobór par, owoskopia jaj, obrączkowanie 7-dniowych piskląt, wdowieństwo, trening 40 km, koszowanie, niedzielny poranek i $m/min$, maraton z neutralizacją, regeneracja, ciemnia, wielkie pierzenie 10 lotek, wystawowy PDF A4, szczepienie PMV-1, lokalny backup).*

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
