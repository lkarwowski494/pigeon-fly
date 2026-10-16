# PIGEON-FLY — Wymagania Biznesowe (BRD), Wersja Robocza 0.1, Październik 2026
## Cyfrowy Notes Mistrza · Aplikacja 100% Offline-First dla Hodowców Gołębi Pocztowych

> **Status:** Wersja kompletna do akceptacji właściciela.  
> **Właściciel projektu:** Łukasz (`lkarwowski494`)  
> **Autorzy:** Analityk Biznesowy i Architekt Systemów Mobilnych Apps4Brew Studio  
> **Projekt powiązany:** `pigeon-fly` (`https://github.com/lkarwowski494/pigeon-fly`)  
> **Standard jakościowy:** Pełna parzystość architektoniczna i rygor dokumentacyjny projektów `trening`, `Oczko` oraz `organizer`.

---

## 1. Jak czytać pakiet dokumentacji BRD

Pakiet specyfikacji wymagań biznesowych dla aplikacji **Pigeon-Fly** został podzielony na modularne, spójne tomy, odpowiadające standardowi korporacyjnemu i rygorowi badawczemu studia:

| Tom / Plik | Rozdziały | Zawartość i Kluczowe Tematy |
| :--- | :--- | :--- |
| **`00_START`** (ten plik) | — | Streszczenie wykonawcze dla właściciela, archetyp produktu, czym wygrywamy, model przychodu, 5 krytycznych ryzyk, próg wydania, statystyka liczbowa i spis treści. |
| **`00b_DEC`** | — | Jedna lista 50 kluczowych decyzji projektowych (**DEC-01 do DEC-50**) z opcjami, kompromisami i twardymi rekomendacjami. |
| **`00c_ERRATA`** | — | Rejestr 35 sprzeczności, niejasności regulaminowych (FCI vs PZHGP) i decyzji rozstrzygających. |
| **`A1_Wizja_Persony`** | 1–3 | Filozofia produktu, 16 Zasad Produktu (**ZP-01 do ZP-16**), 8 szczegółowych person (**P1 do P8**) oraz 15 scenariuszy życiowych (**SYT-01 do SYT-15**) w pełnym rocznym cyklu hodowlano-lotowym. |
| **`A2_Rynek_Przychody`** | 4–6.1 | Globalna analiza rynku sportu gołębiarskiego (Polska, Belgia, Holandia, Niemcy, Rumunia, Tajwan, Chiny), audyt konkurencji, ekonomia jednostkowa Freemium, Paywall Pro i Lifetime. |
| **`A3_Tabela_Zakresu`** | 6.2 | Kompletna macierz zakresu funkcjonalnego (**Z-001 do Z-240**) z podziałem na moduły, priorytety (MUST/SHOULD/COULD), etapy wdrożenia i estymowany nakład pracy agenta. |
| **`A4_KPI_Marketing`** | 13, 15 | Metryki sukcesu produktu bez naruszania prywatności (Zero Telemetry), organiczny marketing środowiskowy w oddziałach PZHGP oraz strategia ASO na 35 rynków językowych. |
| **`B1_Notes_Stada`** | 7.1 | Wymagania funkcjonalne cyfrowego notesu, kartoteki gołębi, numerów obrączek rodowych i pomocniczych, cech budowy, statusów oraz galerii oka i skrzydła (**BR-STADO-001 do 035**). |
| **`B2_Rodowody_PDF`** | 7.2 | Wymagania budowania drzewa genealogicznego w głąb (do 5 pokoleń), algorytmu inbredu Wrighta, wirtualnego pokoju kojarzeń i generatora wystawowych rodowodów PDF A4 (**BR-ROD-001 do 030**). |
| **`B3_Skaner_QR`** | 7.3 | Wymagania generowania mikronaklejek QR, błyskawicznego skanowania w lufce/wlocie gołębnika, precyzyjnego timestampingu i zabezpieczeń przed fałszowaniem (**BR-SKAN-001 do 025**). |
| **`B4_Loty_Kalkulator`** | 7.4 | Wymagania rejestru lotów i treningów, geodezyjnego kalkulatora prędkości $m/min$, wektora znosu wiatru, neutralizacji nocnej w maratonach i rankingu przylotów (**BR-LOT-001 do 045**). |
| **`B5_Zdrowie_Pierzenie`** | 7.5 | Wymagania interaktywnej karty 10 lotek skrzydła, kalendarza profilaktyki i szczepień, karencji leków (antydoping FCI), kalkulatora karmy i sterowania ciemnią (**BR-ZDR-001 do 040**). |
| **`B6_Telemetria_Zegarek`** | 7.6 | Wymagania modułu śledzenia IoT/BTS, wektorowych map offline, synchronizacji BLE po powrocie oraz dedykowanej aplikacji Apple Watch Companion (**BR-TEL-001 do 035**). |
| **`C1_Reguly_Dziedzinowe`** | 8 | Zbiór 35 reguł dziedzinowych (**RD-01 do RD-35**) z dowodami matematycznymi, formułami fizycznymi, wzorami geodezyjnymi i precyzyjnymi wektorami testowymi. |
| **`C2_Zrodla_Badacz`** | 8.P | Rygor 5 szczebli hierarchii źródeł merytorycznych, certyfikacja regulaminów FCI/PZHGP oraz rejestr decyzji badawczych badacza merytorycznego (**D1 do D20**). |
| **`D1_Wymagania_NFR`** | 9–10 | Wymagania niefunkcjonalne: architektura 100% Offline-First, lokalizacja na 35 języków, Ergofizyka Field Mode, Apple HIG, VoiceOver, wydajność bazy SQLite WAL (**NFR-001 do NFR-060**). |
| **`D2_Architektura_SQLite`** | 11–12 | Relacyjny schemat DDL SQLite, indeksy, klucze obce, procedury rotacyjnego backupu, mechanizmy transakcyjne i wzorcowe modele danych w Swift (SwiftData / SQLite). |
| **`D3_Rejestr_Ryzyk`** | 14, 16 | Katalog 40 ryzyk produktowych, technicznych, prawnych i środowiskowych (**RYZ-01 do RYZ-40**) wraz z macierzą prawdopodobieństwo/skutek i procedurami mitygacji. |
| **`D4_Strategia_Testow`** | 17 | Wielowarstwowa strategia jakości (9 warstw testów), testy oparte na właściwościach (PBT), testy polowe Field Mode, testy odpornościowe i macierz testów. |

### System Identyfikatorów
- **`BR-[MOD]-nnn`**: Wymaganie funkcjonalne (Business Requirement). Każde posiada unikalny numer, przypisaną personę, mierzalne kryteria akceptacji w formacie *GIVEN / WHEN / THEN*, priorytet (**MUST**, **SHOULD**, **COULD**) oraz etap wdrożenia (**MVP**, **1.1**, **1.2**, **2.x**).
- **`NFR-[KOD]-nnn`**: Wymaganie niefunkcjonalne. Kody: `OFF` (Offline), `I18N` (Lokalizacja), `FIELD` (Ergofizyka/Polowość), `DOST` (Dostępność/WCAG), `WYD` (Wydajność), `DANE` (Persystencja SQLite), `BEZP` (Prywatność/Bezpieczeństwo), `ZEG` (Apple Watch/Wearables), `TEST` (Jakość).
- **`RD-nn`**: Reguła dziedzinowa (Domain Rule) – wzory geodezyjne, aerodynamika, inbred, fizjologia pierzenia, biochemia karmienia z wektorami testowymi.
- **`DEC-nn`**: Kluczowa decyzja projektowa czekająca na rozstrzygnięcie lub zatwierdzona przez właściciela.
- **`RYZ-nn`**: Skatalogowane ryzyko z planem mitygacji.
- **`Z-nnn`**: Wiersz tabeli zakresu.

---

## 2. Streszczenie Wykonawcze dla Właściciela

### Czym jest Pigeon-Fly?
**Pigeon-Fly** to wyspecjalizowana, bezkompromisowo niezawodna aplikacja mobilna na iOS (oraz Apple Watch), zaprojektowana jako bezpośredni cyfrowy odpowiednik tradycyjnego **zeszytu w kratkę**, w którym od ponad 100 lat mistrzowie hodowli gołębi pocztowych zapisują dane o parach lęgowych, jajach, obrączkach, zrzuconych lotkach i czasach przylotu z zawodów.

Aplikacja rozwiązuje fundamentalny problem starzejącej się grupy hodowców (średnia wieku w Europie to 55–68 lat): **ogromną niechęć do skomplikowanych platform chmurowych, konieczności rejestracji kont, logowania hasłami i awaryjności systemów webowych w warunkach gołębnika (brak zasięgu, kurz, pióra, brudne dłonie, pośpiech)**.

### Dla kogo budujemy aplikację?
Główne persony użytkowników:
1. **Pan Stanisław (66 l., Mistrz Tradycjonalista, Polska):** Hoduje 80 gołębi. Wszystko ma w 3 zeszytach. Nienawidzi abonamentów, nie ma Wi-Fi w gołębniku. Chce podejść do lufki, zeskanować ptaka aparatem, zobaczyć natychmiast jego prędkość w $m/min$ i mieć pewność, że dane nie znikną przy zmianie telefonu.
2. **Luc (52 l., Profesjonalny Hodowca i Sprzedawca, Belgia / Flandria):** Sprzedaje ptaki na rynek azjatycki (PIPA). Potrzebuje w 5 sekund wygenerować elegancki, prestiżowy rodowód PDF A4 z 4 pokoleniami, zdjęciem oka makro i certyfikatem inbredu Wrighta.
3. **Marek (38 l., Nowoczesny Zawodnik, Polska/Niemcy):** Stosuje wdowieństwo totalne i system ciemni. Szuka przewagi technologicznej: liczy wektor znosu wiatru, bilansuje tłuszcze i białko w diecie, używa Apple Watch do odhaczania ptaków spadających z nieba.
4. **Hans (71 l., Emeryt z Zagłębia Ruhry, Niemcy):** Słaby wzrok, drżenie rąk. Wymaga ogromnych przycisków, żółto-czarnego kontrastu i pełnego wsparcia powiększonego fontu (Dynamic Type).

### 5 Filarów Zwycięstwa Rynkowego (Czym deklasujemy rywali)
1. **100% Offline-First i Zero Login (Brak Chmury i Rejestracji):** Większość rywali wymaga logowania do portali webowych. Gdy w gołębniku pada zasięg GSM, aplikacja konkurencji zawiesza się. Pigeon-Fly ma silnik SQLite działający lokalnie z zerowym opóźnieniem.
2. **Ergofizyka Polowa (Field Mode):** Specjalny tryb interfejsu stworzony do pracy w gołębniku. Gdy hodowca trzyma cennego ptaka w lewej dłoni, prawą ręką obsługuje telefon: przyciski o rozmiarze $\ge 56 \times 56\,\text{pt}$, brak wygaszania ekranu (`isIdleTimerDisabled = true`), potwierdzenia głośnym dźwiękiem i wibracją Taptic Engine.
3. **Skaner Kodów QR na Lufce (Wlocie):** Zamiast drogich, stacjonarnych anten elektronicznych zegarów (kosztujących 3 000 – 8 000 zł), hodowca nakleja mikronaklejki QR na obrączki pomocnicze. Wystarczy zbliżyć telefon do wlatującego ptaka, aby zarejestrować przylot z dokładnością do ułamka sekundy i automatycznie wyliczyć prędkość $m/min$.
4. **Wystawowy Generator Rodowodów PDF A4 z Inbredem Wrighta:** Generowanie lokalnie w ułamku sekundy profesjonalnego dokumentu PDF w standardzie międzynarodowych domów aukcyjnych.
5. **Uczciwy Model Monetyzacji (Z Zakupem Dożywotnim Lifetime):** Tradycyjni hodowcy organicznie nienawidzą comiesięcznych opłat. Oferujemy bezpłatny darmowy rdzeń, a wersja Pro ma opcję zakupu jednorazowego Lifetime (19,99 EUR), co gwarantuje gigantyczną przewagę psychologiczną nad konkurencją.

---

## 3. Strategia Monetyzacji i Cennik

Aplikacja operuje w modelu **Freemium z uczciwym Paywallem funkcjonalno-ilościowym**:

```
                       ARCHITEKTURA MONETYZACJI PIGEON-FLY
 ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
 │          FREE TIER (Darmowy)      │    │             PRO TIER              │
 │ • Zarządzanie do 10 ptakami       │    │ • Nielimitowana wielkość stada    │
 │ • Podstawowa kartoteka stada      │    │ • Generator PDF rodowodów A4      │
 │ • Ręczny kalkulator prędkości     │    │ • Wirtualny pokój kojarzeń & F    │
 │ • Skaner QR (podstawowy)          │    │ • Wykresy formy, wiatru i znosu   │
 │ • 100% darmowy eksport backupu    │    │ • Śledzenie tras GPS/BTS (IoT)    │
 │ • Pełna baza SQLite i brak reklam │    │ • Wsparcie dla Apple Watch        │
 └─────────────────┬─────────────────┘    └─────────────────▲─────────────────┘
                   │                                        │
                   └─────────── PROGI PŁATNOŚCI ────────────┘
                                ├─ Miesięczna: 1,99 EUR
                                ├─ Roczna: 6,99 EUR (3 dni trial) [MOTOR]
                                └─ Lifetime: 19,99 EUR (Jednorazowo)
```

### Progi Cenowe:
1. **Darmowy Rdzeń (Free Tier):**
   - Pełna funkcjonalność dla stada do **10 gołębi** (idealne dla początkujących hodowców, gołębi ozdobnych lub do przetestowania aplikacji).
   - Ręczne wprowadzanie czasów i kalkulator prędkości.
   - 100% darmowy eksport i import bazy SQLite/JSON (zasada suwerenności danych – kopia zapasowa nigdy nie jest płatna!).
2. **Subskrypcja Miesięczna:** **1,99 EUR** / miesiąc (w Polsce 8,99 zł) — dedykowana dla użytkowników sezonowych na 3 miesiące lotów.
3. **Subskrypcja Roczna:** **6,99 EUR** / rok (w Polsce 29,99 zł) z **3-dniowym darmowym okresem próbnym (Trial)** — główny motor subskrypcyjny na cały roczny cykl (lęgi, loty, pierzenie).
4. **Zakup Dożywotni (Lifetime):** **19,99 EUR** jednorazowo (w Polsce 89,99 zł) z aktywnym **Family Sharing (Chmura rodzinna Apple)** — kluczowy wybór starszych hodowców.

---

## 4. Pięć Najważniejszych Ryzyk Projektowych (RYZ)

1. **Ryzyko odrzucenia przez Apple pod zarzutem „prostego kalkulatora” (Wytyczna App Store 4.3b, RYZ-01):**
   - *Mitygacja:* Od wersji 1.0 aplikacja zawiera rozbudowaną kartotekę genealogiczną, skaner kodów QR aparatem z analizą klatek w locie, zaawansowaną ergofizykę Field Mode, generator wektorowy PDF A4 oraz integrację z Apple Watch.
2. **Utrata lub uszkodzenie danych hodowli przy braku chmury (RYZ-02):**
   - *Mitygacja:* Automatyczny, transakcyjny backup rotacyjny (10 ostatnich kopii w lokalnym `/Library/Application Support/Backups`) po każdej kluczowej sesji (lęgi, lot), plus 1-tap eksport do prywatnego iCloud Drive lub lokalnego pliku `.sqlite`.
3. **Błędy obliczeń geodezyjnych i prędkości $m/min$ wywołujące spory w oddziałach (RYZ-03):**
   - *Mitygacja:* Wdrożenie formuły ortodromy Vincenty'ego i Haversine'a z dokładnością do $0,001\text{ m}$, certyfikowane wektory testowe z oficjalnych list konkursowych PZHGP i FCI, testy PBT (Property-Based Testing).
4. **Trudne warunki oświetleniowe i fizyczne przy skanowaniu QR w lufce (RYZ-04):**
   - *Mitygacja:* Wykorzystanie natywnego silnika Vision Framework na iOS, automatyczne doświetlanie latarką LED w trybie lufki, generowanie kodów QR z korekcją błędów Level H (30% uszkodzeń naklejki nie zaburza odczytu).
5. **Bariera technologiczna starszych hodowców (RYZ-05):**
   - *Mitygacja:* Radykalne uproszczenie UX (maksymalnie 2 tapnięcia do celu), gigantyczne fonty i przyciski w Field Mode, dźwiękowy feedback (potwierdzenie sukcesu głębokim gongiem/dzwonkiem), brak jakichkolwiek formularzy rejestracyjnych.

---

## 5. Próg Wydania (Release Quality Gate)

Wydanie aplikacji do publicznych testów TestFlight oraz do App Store blokują wyłącznie znaleziska o priorytecie **KRYTYCZNYM** i **WYSOKIM**:
- Jakakolwiek możliwość uszkodzenia lub utraty bazy danych stada przy migracji, imporcie lub awaryjnym wyłączeniu telefonu.
- Błąd matematyczny w obliczaniu odległości geodezyjnej lub prędkości lotu w $m/min$ przekraczający tolerancję regulaminową $0,01\text{ m/min}$.
- Naruszenie deklaracji prywatności *Data Not Collected* (jakikolwiek wyciek telemetrii lub identyfikatorów urządzenia).
- Niezgodność z Apple HIG w zakresie minimalnego obszaru dotykowego kontrolek ($\ge 44 \times 44\,\text{pt}$ w trybie standardowym, $\ge 56 \times 56\,\text{pt}$ w Field Mode).
- Brak pełnego tłumaczenia terminologii hodowlanej w deklarowanych językach.

---

## 6. Statystyka Liczbowa Dokumentu BRD

| Parametr / Element Specyfikacji | Wartość Liczbowa |
| :--- | :--- |
| **Liczba Tomów Dokumentacji BRD** | **19 plików źródłowych markdown** |
| **Wymagania Funkcjonalne (BR)** | **210 wymagań** (MUST: 135 · SHOULD: 55 · COULD: 20) |
| **Wymagania Niefunkcjonalne (NFR)** | **60 wymagań** (OFF, FIELD, I18N, WYD, DANE, ZEG, BEZP, DOST) |
| **Reguły Dziedzinowe i Wzory Matematyczne (RD)** | **35 reguł** z wektorami testowymi |
| **Kluczowe Decyzje Projektowe (DEC)** | **50 decyzji** ze szczegółową analizą kompromisów |
| **Skatalogowane Ryzyka (RYZ)** | **40 ryzyk** z macierzą i procedurami mitygacji |
| **Tabela Zakresu Funkcjonalnego (Z)** | **240 pozycji** (MVP: 110 · 1.1: 52 · 1.2: 44 · 2.x: 34) |
| **Liczba Obsługiwanych Języków od Dnia 1** | **35 języków** (w tym dialekty i żargon hodowlany) |
