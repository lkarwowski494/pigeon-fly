# PIGEON-FLY — Wymagania Biznesowe (BRD), Wersja 0.2 (Hybrydowa z Supabase), Październik 2026
## Cyfrowy Notes Mistrza · Aplikacja Hybrydowa Offline-First z Bazą Danych Supabase

> **Status:** Wersja zaktualizowana o architekturę chmurową Supabase (PostgreSQL 16, Realtime, Auth, Storage, Edge Functions).  
> **Właściciel projektu:** Łukasz (`lkarwowski494`)  
> **Autorzy:** Analityk Biznesowy i Główny Architekt Systemów Mobilnych Apps4Brew Studio  
> **Repozytorium:** `https://github.com/lkarwowski494/pigeon-fly`  
> **Standard:** Parzystość inżynieryjna z projektami `organizer`, `trening` oraz `Oczko`.

---

## 1. Jak czytać pakiet dokumentacji BRD

Pakiet specyfikacji wymagań biznesowych dla aplikacji **Pigeon-Fly** został zaktualizowany o integrację z bazą danych w chmurze (np. **Supabase**), tworząc architekturę **Hybrydową Offline-First**:

| Tom / Plik | Rozdziały | Zawartość i Kluczowe Tematy |
| :--- | :--- | :--- |
| **`00_START`** (ten plik) | — | Streszczenie wykonawcze, nowa perspektywa chmurowa Supabase, filary rynkowe, model przychodu, 5 krytycznych ryzyk, próg wydania, statystyka liczbowa i spis treści. |
| **`00b_DEC`** | — | Rejestr 50 kluczowych decyzji projektowych (**DEC-01 do DEC-50**), w tym decyzje o protokole synchronizacji delta, architekturze RLS, tandemach hodowlanych i relacjach na żywo. |
| **`00c_ERRATA`** | — | Rejestr sprzeczności i errata, w tym rozstrzygnięcie koegzystencji trybu offline z chmurą, polityka prywatności przy synchronizacji oraz strategie rozwiązywania konfliktów (LWW / CRDT). |
| **`A1_Wizja_Persony`** | 1–3 | Filozofia hybrydowa, 16 Zasad Produktu, 10 person (w tym Tandem Hodowlany i Znalazca Zagubionego Ptaka) oraz 18 scenariuszy życiowych w pełnym rocznym cyklu. |
| **`A2_Rynek_Przychody`** | 4–6.1 | Globalna analiza rynku, audyt konkurencji, ekonomia chmury Supabase (darmowy tier vs Pro), monetizacja funkcji chmurowych (Tandem, Live Derby, Cloud Pedigree). |
| **`A3_Tabela_Zakresu`** | 6.2 | Kompletna macierz zakresu funkcjonalnego (**Z-001 do Z-260**) z uwzględnieniem modułów synchronizacji Supabase, Realtime i Storage. |
| **`A4_KPI_Marketing`** | 13, 15 | Metryki sukcesu, bezpieczna telemetria chmurowa bez naruszania prywatności, organiczny marketing w sekcjach PZHGP oraz ASO na 35 języków. |
| **`B1_Notes_Stada`** | 7.1 | Wymagania funkcjonalne kartoteki stada, synchronizacja wielourządzeniowa i centralna wyszukiwarka przodków (**BR-STADO-001 do 038**). |
| **`B2_Rodowody_PDF`** | 7.2 | Wymagania drzew genealogicznych, inbredu Wrighta, generatora PDF A4 oraz **kryptograficznego portalu weryfikacji rodowodów online** (**BR-ROD-001 do 034**). |
| **`B3_Skaner_QR`** | 7.3 | Wymagania mikronaklejek QR, błyskawicznego skanowania w lufce aparatem i precyzyjnego timestampingu (**BR-SKAN-001 do 025**). |
| **`B4_Loty_Kalkulator`** | 7.4 | Wymagania rejestru lotów, geodezyjnego kalkulatora $m/min$, wektora wiatru, **transmisji przylotów na żywo (Live Race Broadcast)** i prywatnych mini-derbów sekcji (**BR-LOT-001 do 050**). |
| **`B5_Zdrowie_Pierzenie`** | 7.5 | Wymagania interaktywnej karty 10 lotek skrzydła (wskaźnik ARI), kalendarza profilaktyki PMV-1, kontroli karencji leków i kalkulatora paszowego (**BR-ZDR-001 do 040**). |
| **`B6_Telemetria_Zegarek`** | 7.6 | Wymagania miniaturowych modułów IoT/BTS, wektorowych map offline, Supabase Edge Functions oraz Apple Watch Companion (**BR-TEL-001 do 038**). |
| **`C1_Reguly_Dziedzinowe`** | 8 | Zbiór 35 reguł dziedzinowych (**RD-01 do RD-35**) z dowodami matematycznymi, równaniami geodezyjnymi Vincenty'ego i wektorami testowymi. |
| **`C2_Zrodla_Badacz`** | 8.P | Rygor 5 szczebli hierarchii źródeł merytorycznych, certyfikacja regulaminów FCI/PZHGP oraz rejestr decyzji badawczych. |
| **`D1_Wymagania_NFR`** | 9–10 | Wymagania niefunkcjonalne: protokół synchronizacji delta, bezpieczeństwo Row Level Security (RLS), anonimowe logowanie z późniejszym łączeniem z Apple Sign-In, Field Mode i Apple HIG. |
| **`D2_Architektura_SQLite_Supabase`** | 11–12 | Pełny schemat DDL PostgreSQL dla Supabase z politykami RLS i triggerami, lokalny schemat SQLite WAL oraz protokół synchronizacji dwukierunkowej w Swift. |
| **`D3_Rejestr_Ryzyk`** | 14, 16 | Katalog 40 ryzyk z procedurami mitygacji dla warstwy chmurowej i polowej (awarie sieci, przekroczenie limitów bazy, ochrona prywatności). |
| **`D4_Strategia_Testow`** | 17 | 9 warstw jakości: testy jednostkowe, PBT, testy polityk RLS w SQL (`pgTAP`), testy odpornościowe i Maestro E2E. |

---

## 2. Streszczenie Wykonawcze: Nowy Wymiar z Bazą Danych Supabase

### Dlaczego wdrożenie bazy danych (Supabase) to technologiczny przełom dla Pigeon-Fly?
Zachowując żelazną zasadę **pracy polowej w 100% offline w gołębniku**, wprowadzenie chmurowego backendu **Supabase (PostgreSQL 16, Realtime, Storage, Auth, Edge Functions)** wynosi Pigeon-Fly na poziom, o jakim tradycyjne oprogramowanie gołębiarskie nie mogło nawet marzyć.

```
                    NOWE MOŻLIWOŚCI Z CHMURĄ SUPABASE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. TANDEM HODOWLANY (SPÓŁKI): Współdzielenie gołębnika między hodowcami     │
 │    (np. ojciec i syn, wspólnicy) z synchronizacją w czasie rzeczywistym.    │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. LIVE RACE BROADCASTING (RELACJE NA ŻYWO): Transmisja przylotów z lotu    │
 │    w czasie rzeczywistym (Supabase Realtime WebSockets) dla rodziny i klubu.│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. ZWERYFIKOWANY CYFROWY PASZPORT RODOWODU: Ochrona przed fałszerstwami.    │
 │    Publiczny portal weryfikacji rodowodów pod kodem QR (pigeonfly.app/ped). │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 4. GLOBALNA SIEĆ POMOCY ZAGUBIONYM PTAKOM (LOST & FOUND): Błyskawiczne      │
 │    zgłoszenie znalezionego gołębia przez przypadkowego znalazcę i powiadom. │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 5. SUPABASE STORAGE CDN DLA ZDJĘĆ 4K OKA I SKRZYDŁA: Błyskawiczne ładowanie │
 │    bezstratnych fotografii makro dla międzynarodowych kupców na aukcjach.   │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 6. SUPABASE EDGE FUNCTIONS JAKO BRAMA IoT: Bezpośredni odbiór pakietów GPS  │
 │    z miniaturowych trackerów na ptakach i rekonstrukcja trajektorii.        │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 7. MULTI-DEVICE SYNC & CLOUD VAULT: Bezpieczna replikacja stada w Postgresie│
 │    (iPhone w gołębniku, iPad na kanapie, Mac w biurze) i 0 ryzyka utraty.   │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strategia Monetyzacji i Cennik (Zaktualizowana)

Wprowadzenie chmury Supabase dramatycznie zwiększa wartość postrzeganą wersji **PRO**, jednocześnie zachowując nienaruszony, w pełni funkcjonalny **Darmowy Rdzeń**:

```
                       ARCHITEKTURA MONETYZACJI PIGEON-FLY
 ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
 │          FREE TIER (Darmowy)      │    │             PRO TIER              │
 │ • Do 10 ptaków w stadzie          │    │ • Nielimitowane stado i lęgi      │
 │ • 100% lokalny notes offline      │    │ • Pełna synchronizacja Supabase   │
 │ • Ręczny kalkulator prędkości     │    │ • Tandem Hodowlany (wspólnicy)    │
 │ • Skaner QR aparatem (lokalny)    │    │ • Live Race Broadcasting (Live)   │
 │ • Zawsze darmowy eksport backupu  │    │ • Zweryfikowany rodowód online QR │
 │ • Anonimowe używanie (Zero Login) │    │ • Sieć Lost & Found z alertami push│
 └─────────────────┬─────────────────┘    │ • Apple Watch Companion           │
                   │                      └─────────────────▲─────────────────┘
                   └─────────── PROGI PŁATNOŚCI ────────────┘
                                ├─ Miesięczna: 1,99 EUR
                                ├─ Roczna: 6,99 EUR (3 dni trial) [MOTOR]
                                └─ Lifetime: 19,99 EUR (Z chmurą i Family Sharing)
```

---

## 4. Statystyka Liczbowa Zaktualizowanego Pakietu BRD

| Parametr / Element Specyfikacji | Wartość Liczbowa |
| :--- | :--- |
| **Liczba Tomów Dokumentacji BRD** | **19 plików źródłowych markdown** |
| **Wymagania Funkcjonalne (BR)** | **230 wymagań** (w tym moduły chmurowe Supabase) |
| **Wymagania Niefunkcjonalne (NFR)** | **65 wymagań** (w tym synchronizacja delta, RLS, Storage) |
| **Reguły Dziedzinowe i Wzory (RD)** | **35 reguł** z wektorami testowymi |
| **Kluczowe Decyzje Projektowe (DEC)** | **50 decyzji** (z architekturą bazy PostgreSQL) |
| **Skatalogowane Ryzyka (RYZ)** | **40 ryzyk** z macierzą i procedurami mitygacji |
| **Tabela Zakresu Funkcjonalnego (Z)** | **260 pozycji** |
| **Liczba Obsługiwanych Języków od Dnia 1** | **35 języków** |
