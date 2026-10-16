# Rozdziały 14 i 16: Rejestr Ryzyk (RYZ-01 do RYZ-40) i Plan Mitygacji (D3)
## Pigeon-Fly · Macierz Oceny Ryzyka i Procedury Ochronne

---

### 1. Macierz Oceny Ryzyka

Każde zidentyfikowane ryzyko zostało ocenione pod kątem prawdopodobieństwa wystąpienia (**P: Niskie / Średnie / Wysokie**) oraz potencjalnego skutku dla użytkownika i produktu (**S: Niski / Średni / Wysoki / Krytyczny**).

```
                      MACIERZ RYZYK PROJEKTU PIGEON-FLY
 ┌──────────────┬──────────────────┬──────────────────┬──────────────────┐
 │ SKUTEK \ P.  │     NISKIE       │     ŚREDNIE      │     WYSOKIE      │
 ├──────────────┼──────────────────┼──────────────────┼──────────────────┤
 │ KRYTYCZNY    │ RYZ-02 (Baza)    │ RYZ-01 (Apple)   │                  │
 │              │ RYZ-05 (Wyciek)  │ RYZ-03 (Wzory)   │                  │
 ├──────────────┼──────────────────┼──────────────────┼──────────────────┤
 │ WYSOKI       │ RYZ-07 (Bateria) │ RYZ-04 (Brud QR) │ RYZ-06 (Senior)  │
 │              │ RYZ-11 (Inbred)  │ RYZ-08 (Zegarek) │                  │
 ├──────────────┼──────────────────┼──────────────────┼──────────────────┤
 │ ŚREDNI       │ RYZ-15 (i18n)    │ RYZ-09 (BLE IoT) │ RYZ-10 (Brak GPS)│
 └──────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

### 2. Szczegółowy Rejestr Ryzyk i Procedury Mitygacji

#### RYZ-01: Odrzucenie Aplikacji przez Apple jako „Prosty Kalkulator” (Wytyczna 4.3b)
- **Prawdopodobieństwo:** Średnie · **Skutek:** Krytyczny · **Kategoria:** Sklep / Apple
- **Opis:** Recenzent App Store może powierzchownie ocenić aplikację jako prosty kalkulator czasu lotu i odrzucić ją z zarzutem braku głębi funkcjonalnej.
- **Plan Mitygacji:** Od wersji 1.0 aplikacja zawiera rozbudowany, unikalny moduł rekurencyjnych rodowodów do 5 pokoleń, zaawansowany generator wektorowy PDF A4, analizator 10 lotek skrzydła, skaner kodów aparatem w czasie rzeczywistym z analizą klatek 60 fps, moduł zdrowia i wsparcie dla Apple Watch. Do formularza recenzji dołączane jest wideo demonstracyjne pokazujące pracę w gołębniku.

#### RYZ-02: Uszkodzenie lub Utrata Bazy Danych Hodowli w Gołębniku
- **Prawdopodobieństwo:** Niskie · **Skutek:** Krytyczny · **Kategoria:** Architektura Danych
- **Opis:** Nagłe rozładowanie telefonu w trakcie trwania lotu lub upadek na betonową podłogę gołębnika mógłby doprowadzić do uszkodzenia pliku bazy danych.
- **Plan Mitygacji:** Tryb SQLite WAL (Write-Ahead Logging) z atomowymi transakcjami. Automatyczny backup rotacyjny (10 kopii w `/Library/Application Support/Backups/`). Przed każdą migracją schematu tworzona jest bezwzględna kopia zapasowa w chronionym katalogu.

#### RYZ-03: Błędy Obliczeń Geodezyjnych Wywołujące Spory w Oddziałach
- **Prawdopodobieństwo:** Średnie · **Skutek:** Wysoki · **Kategoria:** Domena / Regulamin
- **Opis:** Rozbieżność 10 metrów w wyliczeniu odległości ortodromicznej mogłaby podważyć wiarygodność aplikacji w oczach hodowców.
- **Plan Mitygacji:** Zastosowanie algorytmu elipsoidalnego Vincenty'ego (WGS-84) o dokładności geodezyjnej do $0,001\text{ m}$. Zestaw testów różnicowych (Cross-Validation) porównujący wyniki z certyfikowanym korpusem list konkursowych PZHGP i FCI. Możliwość ręcznego nadpisania dystansu oficjalnym pomiarem związkowym.

#### RYZ-04: Zabrudzenie Mikronaklejki QR Pyłem Piórowym i Trudności ze Skanowaniem
- **Prawdopodobieństwo:** Średnie · **Skutek:** Wysoki · **Kategoria:** Sprzęt / Ergofizyka
- **Opis:** W gołębniku unosi się pył z piór (puder) i kurz, a ptaki wchodzące przez lufkę poruszają się gwałtownie.
- **Plan Mitygacji:** Kody QR generowane są z korekcją błędów **Level H (do 30% odporności na fizyczne zniszczenie)**. Strumień wideo z kamery analizowany jest w pamięci NPU z automatycznym doświetleniem LED przy słabym świetle. Dodatkowo zawsze dostępna jest opcja manualnego 1-tap zatwierdzenia z listy ptaków w locie.

#### RYZ-05: Wyciek Położenia Gołębnika i Kradzież Cennego Stada
- **Prawdopodobieństwo:** Niskie · **Skutek:** Krytyczny · **Kategoria:** Bezpieczeństwo / Prawne
- **Opis:** Wartość stada czołowych hodowców sięga setek tysięcy euro. Wyciek dokładnych współrzędnych gołębnika stanowi zagrożenie przestępcze.
- **Plan Mitygacji:** Bezwzględna zasada **100% Offline (Data Not Collected)**. Żadne współrzędne geograficzne nie opuszczają urządzenia. Klucze i dane wrażliwe są chronione w Keychainie urządzenia.

#### RYZ-06: Bariera Technologiczna i Odrzucenie Aplikacji przez Starszych Hodowców
- **Prawdopodobieństwo:** Wysokie · **Skutek:** Wysoki · **Kategoria:** UX / Psychologia
- **Opis:** Seniorzy (60–75 lat) szybko rezygnują z aplikacji, jeśli wymaga ona logowania, zapamiętywania haseł lub posiada zbyt małe przyciski.
- **Plan Mitygacji:** Radykalny Tryb Polowy (Field Mode) z kaflami $\ge 56 \times 56\,\text{pt}$, zero formularzy logowania, potężny feedback dźwiękowy i haptyczny, pełne wsparcie dla Dynamic Type (wielkie litery).

#### RYZ-07: Szybkie Zużycie Baterii Podczas Dyżuru Przylotowego
- **Prawdopodobieństwo:** Niskie · **Skutek:** Wysoki · **Kategoria:** Bateria / iOS
- **Opis:** Ciągła praca kamery wideo 60 fps i blokada wygaszania ekranu mogą rozładować baterię telefonu podczas wielogodzinnego oczekiwania na maraton.
- **Plan Mitygacji:** Tryb oszczędzania energii w skanerze: po 30 sekundach bezruchu kamera przechodzi w tryb detekcji ruchu o niskiej częstotliwości (10 fps), a pełna rozdzielczość 60 fps aktywuje się natychmiast po wykryciu ruchu w polu widzenia lufki.

#### RYZ-08: Desynchronizacja Czasowa Zegarka Apple Watch
- **Prawdopodobieństwo:** Średnie · **Skutek:** Średni · **Kategoria:** Wearables
- **Opis:** Zegarek odcięty od telefonu na podwórku rejestruje przyloty w lokalnym buforze.
- **Plan Mitygacji:** `WatchOfflineQueue` przechowuje znaczniki czasu wraz z uniksowym timestampem UTC (`epoch_ms`). Po zbliżeniu się do telefonu kolejka opróżnia się automatycznie bez żadnego dryfu czasowego (Zero Clock Skew).

#### RYZ-09 do RYZ-40: Skatalogowane Ryzyka Uzupełniające
- **RYZ-09 (Błędy Ramki BLE):** Uszkodzone pakiety z obcych trackerów IoT są walidowane sumą kontrolną CRC16 i odrzucane bez wywoływania awarii aplikacji.
- **RYZ-10 (Brak Fixa GPS):** Możliwość ręcznego wskazania gołębnika na mapie offline lub wpisania współrzędnych z mapy papierowej.
- **RYZ-11 (Nieskończona Pętla w Inbredzie):** Algorytm Wrighta posiada twardy limit głębokości do 5 pokoleń i weryfikację cykli grafu DAG.
- **RYZ-12 (Ograniczenie Pamięci Zdjęć):** Automatyczna kompresja JPEG 0.8 do maks. 1600x1200 px chroni urządzenie przed zapełnieniem pamięci flash.
- **RYZ-13 (Niepoprawne Tłumaczenia Żargonu):** Rygorystyczny audyt terminologii z udziałem aktywnych hodowców z poszczególnych krajów.
- **RYZ-14 do RYZ-40:** Ryzyka związane z odrzuceniem Family Sharing, zmianami formatu plików Apple, zmianami w przepisach antydopingowych FCI i procedurami odzyskiwania danych po utracie urządzenia.
