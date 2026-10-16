# Rozdział 6.2: Tabela Zakresu Funkcjonalnego (Z-001 do Z-260) i Etapy Realizacji (A3)
## Pigeon-Fly · Macierz Zadań Hybrydowych (SQLite + Supabase)

---

### 1. Macierz Zakresu Funkcjonalnego

| ID | Moduł / Kategoria | Zakres Funkcjonalności | Priorytet | Etap | Nakład [Dni Agenta] |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Z-001** | Architektura | Konfiguracja projektu iOS 18 (SwiftUI, GRDB SQLite WAL, Clean Architecture) | MUST | MVP | 1,5 |
| **Z-002** | Architektura | Relacyjny schemat DDL lokalnej bazy SQLite (tabele, relacje, indeksy unikalne) | MUST | MVP | 1,0 |
| **Z-003** | Architektura | Transakcyjny silnik zdarzeń i mutacji bazy danych (Zero Partial Writes) | MUST | MVP | 1,0 |
| **Z-004** | Backup / DANE | 1-klikowy lokalny eksport bazy `.sqlite` do aplikacji Pliki i iCloud Drive (100% darmowy) | MUST | MVP | 0,5 |
| **Z-005** | Backup / DANE | Pełny eksport i import czytelnego pliku `.json` ze wszystkimi powiązaniami | MUST | MVP | 1,0 |
| **Z-006** | Backup / DANE | Silnik automatycznego backupu rotacyjnego (10 ostatnich kopii w piaskownicy aplikacji) | MUST | MVP | 0,5 |
| **Z-007** | Chmura / Supabase | Integracja oficjalnego klienta `Supabase-Swift` (Auth, PostgREST, Realtime, Storage) | MUST | MVP | 1,5 |
| **Z-008** | Chmura / Supabase | Schemat bazy danych PostgreSQL 16 w Supabase z politykami Row Level Security (RLS) | MUST | MVP | 2,0 |
| **Z-009** | Chmura / Sync | Asynchroniczny silnik synchronizacji delta (kolejka `sync_queue` w SQLite $\leftrightarrow$ Postgres RPC) | MUST | MVP | 2,5 |
| **Z-010** | Stado / Notes | Rejestracja gołębia: numer oficjalnej obrączki rodowej (format `PL-0123-26-12345`) | MUST | MVP | 0,5 |
| **Z-011** | Stado / Notes | Numery pomocnicze (obrączki gumowe, chipy, kolory znaczników) | MUST | MVP | 0,5 |
| **Z-012** | Stado / Notes | Kartoteka cech: płeć (samiec/samica), maść (12 standardowych barw upierzenia), rok | MUST | MVP | 0,5 |
| **Z-013** | Stado / Notes | Status ptaka: Rozpłodowy, Lotowy, Młody, W gnieździe, Sprzedany, Zaginiony, Zszedł | MUST | MVP | 0,5 |
| **Z-014** | Stado / Notes | Przypisanie do przedziału gołębnika i numeru celi gniazdowej | MUST | MVP | 0,5 |
| **Z-015** | Stado / Notes | Lokalna galeria zdjęć z aparatu: sylwetka, makro oka (Eye-Sign), rozpostarte skrzydło | MUST | MVP | 1,5 |
| **Z-016** | Stado / Notes | Karta ocen budowy anatomicznej: widełki, grzebień mostka, elastyczność piór | SHOULD | MVP | 1,0 |
| **Z-017** | Stado / Notes | Wyszukiwarka i zaawansowane filtry stada (wg rocznika, płci, statusu, celi) | MUST | MVP | 1,0 |
| **Z-018** | Stado / Notes | Szybkie grupowanie ptaków w drużyny lotowe (Drużyna A, Drużyna B, Młode) | SHOULD | MVP | 0,5 |
| **Z-019** | Chmura / Stado | Synchronizacja wielourządzeniowa stada w czasie rzeczywistym (iPhone, iPad, Mac) | MUST | MVP | 1,5 |
| **Z-020** | Rodowody | Relacje rodzicielskie (Ojciec, Matka) z walidacją cykli i płci | MUST | MVP | 1,0 |
| **Z-021** | Rodowody | Rekurencyjny silnik budowania drzewa genealogicznego w głąb do 5 pokoleń | MUST | MVP | 1,5 |
| **Z-022** | Rodowody | Algorytm obliczania współczynnika inbredu Wrighta ($F$) dla każdego ptaka | MUST | MVP | 1,5 |
| **Z-023** | Rodowody | Wirtualny Pokój Kojarzeń (symulacja inbredu i cech potomstwa przed połączeniem) | MUST | MVP | 1,5 |
| **Z-024** | Rodowody / PDF | Generator wystawowego dokumentu PDF A4 w układzie poziomym (Landscape) z 4 pokoleniami | MUST | MVP | 2,5 |
| **Z-025** | Rodowody / PDF | Osadzanie w dokumencie PDF zdjęć oka, skrzydła, herbu hodowli, nagród i podpisu | MUST | MVP | 1,5 |
| **Z-026** | Rodowody / PDF | Eksport rodowodu do AirPrint, WhatsApp, Mail i Zapisz w Plikach | MUST | MVP | 0,5 |
| **Z-027** | Chmura / Rodowody | Publikacja kryptograficznego certyfikatu rodowodu w Supabase (`pigeonfly.app/pedigree/[ID]`) | MUST | MVP | 1,5 |
| **Z-028** | Chmura / Rodowody | Publiczny portal webowy weryfikacji rodowodów pod kodem QR (ochrona przed fałszerstwem) | MUST | MVP | 2,0 |
| **Z-030** | QR / Skaner | Generator mikronaklejek QR na obrączki pomocnicze (kodowanie kompaktowe Level H) | MUST | MVP | 1,0 |
| **Z-031** | QR / Skaner | Moduł wydruku arkusza naklejek QR na papierze samoprzylepnym (PDF A4 z siatką etykiet) | SHOULD | MVP | 1,0 |
| **Z-032** | QR / Skaner | Szybki skaner aparatu z natywnym Vision Framework (analiza klatek 60 fps, czas $<15\text{ ms}$) | MUST | MVP | 2,0 |
| **Z-033** | QR / Skaner | Automatyczne doświetlanie latarką LED w ciemnym wlocie gołębnika (Field Mode) | MUST | MVP | 0,5 |
| **Z-034** | QR / Skaner | Natychmiastowy timestamp przylotu z dokładnością do milisekundy i rejestracją w SQLite | MUST | MVP | 0,5 |
| **Z-035** | QR / Skaner | Dźwiękowy gong potwierdzenia (400–600 Hz) i potężna haptyka Taptic Engine | MUST | MVP | 0,5 |
| **Z-036** | QR / Skaner | Ochrona przed podwójnym skanowaniem (debouncer 2000 ms per ptak) | MUST | MVP | 0,5 |
| **Z-037** | Chmura / Pomoc | Publiczny portal zgłaszania zagubionych gołębi (`pigeonfly.app/znaleziony`) | MUST | MVP | 2,0 |
| **Z-038** | Chmura / Pomoc | Supabase Edge Function: natychmiastowe powiadomienie Push APNs do właściciela ptaka | MUST | MVP | 1,5 |
| **Z-040** | Loty / Kalkulator | Definiowanie lotu/treningu: nazwa, data, godzina wypuszczenia, współrzędne GPS stacji | MUST | MVP | 1,0 |
| **Z-041** | Loty / Kalkulator | Baza współrzędnych gołębnika macierzystego (szyfrowana w Keychainie i chroniona RLS) | MUST | MVP | 0,5 |
| **Z-042** | Loty / Kalkulator | Geodezyjny kalkulator odległości: formuła Vincenty'ego WGS-84 oraz Haversine | MUST | MVP | 1,5 |
| **Z-043** | Loty / Kalkulator | Automatyczny kalkulator prędkości w czasie rzeczywistym: $v = \text{Dystans [m]} / \text{Czas [min]}$ | MUST | MVP | 1,0 |
| **Z-044** | Loty / Kalkulator | Dynamiczny ranking przylotów z danego lotu (kolejność, strata czasu do lidera, $m/min$) | MUST | MVP | 1,5 |
| **Z-045** | Loty / Kalkulator | Automatyczna neutralizacja nocna w maratonach (zegar wstrzymany na czas zmierzch-świt) | MUST | MVP | 1,5 |
| **Z-046** | Loty / Kalkulator | Wyliczanie oficjalnego współczynnika konkursowego (Coeff) i bazy punktowej 20% (1:5) | SHOULD | MVP | 1,0 |
| **Z-047** | Loty / Kalkulator | Wektor znosu wiatru i kalkulator prędkości aerodynamicznie skorygowanej (Aero Speed) | MUST | 1.1 | 2,0 |
| **Z-048** | Loty / Asystent | Asystent Dnia Koszowania: lista wkładaniowa, typowanie serii (np. 5/50), kontrola karencji | SHOULD | MVP | 1,5 |
| **Z-049** | Chmura / Loty | Supabase Realtime Live Race Broadcasting (transmisja przylotów na żywo dla kibiców) | MUST | 1.1 | 2,5 |
| **Z-050** | Zdrowie / Pierzenie | Interaktywna Karta 10 Lotek Skrzydła: rejestr zrzucania lotek I i II rzędu | MUST | MVP | 2,0 |
| **Z-051** | Zdrowie / Pierzenie | Wskaźnik Gotowości Aerodynamicznej (ARI) ostrzegający przed wkładaniem ptaka z brakami | SHOULD | MVP | 1,0 |
| **Z-052** | Zdrowie / Profilaktyka | Kalendarz szczepień stadnych (PMV-1, ospa, paratyfus) z lokalnymi powiadomieniami | MUST | MVP | 1,0 |
| **Z-053** | Zdrowie / Profilaktyka | Dziennik kuracji weterynaryjnych i automatyczny kalkulator okresów karencji leków | MUST | MVP | 1,5 |
| **Z-054** | Zdrowie / Żywienie | Dziennik programów karmienia (fazy: oczyszczająca, budująca białko, ładowanie tłuszczem) | SHOULD | MVP | 1,0 |
| **Z-055** | Zdrowie / Żywienie | Kalkulator paszowy: bilans białka, tłuszczu i energii metabolicznej z 20 ziaren (Weende) | MUST | 1.1 | 2,0 |
| **Z-056** | Zdrowie / Ciemnia | Moduł sterowania ciemnią (Verdunkelung) i rozjaśnianiem dla gołębi młodych | SHOULD | 1.1 | 1,0 |
| **Z-057** | Chmura / Tandem | Moduł Tandemu Hodowlanego (współdzielenie gołębnika między 2–3 osoby z rolami RLS) | MUST | 1.1 | 2,5 |
| **Z-060** | Apple Watch | Aplikacja watchOS: podgląd trwającego lotu, liczba oczekiwanych gołębi w powietrzu | MUST | MVP | 2,0 |
| **Z-061** | Apple Watch | 1-tap rejestracja przylotu z tarczy zegarka („Spadł ptak!”) z precyzyjnym timestampem | MUST | MVP | 1,5 |
| **Z-062** | Apple Watch | Bezprzewodowe parowanie zarejestrowanego czasu z zegarka z ptakiem w telefonie | MUST | MVP | 1,0 |
| **Z-070** | Telemetria / IoT | Odbiór danych z miniaturowych modułów GPS/BTS montowanych na gołębiu (Bluetooth) | MUST | 1.1 | 3,5 |
| **Z-071** | Telemetria / Mapy | Wektorowa mapa offline i rekonstrukcja trajektorii przelotu ptaka z punktami prędkości | MUST | 1.1 | 3,0 |
| **Z-072** | Chmura / Storage | Supabase Storage CDN dla bezstratnych fotografii 4K tęczówki oka (Eye-Sign) i skrzydła | SHOULD | 1.1 | 1,5 |
| **Z-073** | Chmura / IoT | Supabase Edge Functions jako brama telemetryczna IoT dla trackerów GPS/LTE-M | COULD | 2.x | 2,5 |
| **Z-080** | UI / Field Mode | Tryb Polowy (Field Mode): kafle $\ge 56\text{ pt}$, wysoki kontrast, obsługa jedną ręką | MUST | MVP | 2,0 |
| **Z-081** | UI / Field Mode | Blokada wygaszania ekranu (`isIdleTimerDisabled = true`) w trakcie dyżuru przylotowego | MUST | MVP | 0,5 |
| **Z-082** | UI / Dostępność | Pełne wsparcie dla powiększonych fontów Dynamic Type i czytnika ekranu VoiceOver | MUST | MVP | 1,5 |
| **Z-090** | Monetyzacja | Konfiguracja StoreKit 2: darmowy rdzeń (do 10 ptaków), subskrypcje, Lifetime, Family Sharing | MUST | MVP | 2,0 |
| **Z-091** | Monetyzacja | Elegancki ekran Paywalla Pro z podsumowaniem wartości chmurowych i darmowego backupu | MUST | MVP | 1,0 |
| **Z-100** | Lokalizacja | Pełny system lokalizacji na 35 języków z branżowym żargonem hodowlanym | MUST | MVP | 3,0 |

---

### 2. Podsumowanie Nakładu Pracy i Wariantów Wydania

- **Wariant Hybrydowy MVP (Zadania MUST + kluczowe SHOULD z tabeli):**
  - Zakres: **42–54 dni pracy agenta** (ok. 3–5 tygodni kalendarzowych przy pracy równoległej).
  - Rezultat: Kompletny cyfrowy notes mistrza, lokalna baza SQLite WAL, generator PDF A4, skaner QR, formuła Vincenty'ego, karta 10 lotek, Apple Watch Companion oraz **infrastruktura Supabase z asynchroniczną replikacją delta, portalem weryfikacji rodowodów online i siecią zgłoszeń Lost & Found**.
- **Wersja 1.1 (Zaraz po MVP):**
  - Zakres: Dodatkowe **14–18 dni pracy agenta**.
  - Rezultat: Supabase Realtime Live Race Broadcasting, Tandem Hodowlany z rolami RLS, wektor znosu wiatru, bilans paszowy Weende, import tras GPS/BTS przez BLE i wektorowe mapy offline.
