# Rozdziały 14 i 16: Rejestr Ryzyk (RYZ-01 do RYZ-40) i Plan Mitygacji (D3)
## Pigeon-Fly · Macierz Oceny Ryzyka w Architekturze Hybrydowej (SQLite + Supabase)

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
 │              │ RYZ-15 (RLS Leak)│                  │                  │
 ├──────────────┼──────────────────┼──────────────────┼──────────────────┤
 │ WYSOKI       │ RYZ-07 (Bateria) │ RYZ-04 (Brud QR) │ RYZ-06 (Senior)  │
 │              │ RYZ-11 (Inbred)  │ RYZ-08 (Zegarek) │ RYZ-14 (Zerwana) │
 ├──────────────┼──────────────────┼──────────────────┼──────────────────┤
 │ ŚREDNI       │ RYZ-16 (Limity)  │ RYZ-09 (BLE IoT) │ RYZ-17 (Spam L&F)│
 └──────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

### 2. Szczegółowy Rejestr Ryzyk i Procedury Mitygacji

#### RYZ-01: Odrzucenie Aplikacji przez Apple jako „Prosty Kalkulator” (Wytyczna 4.3b)
- **Prawdopodobieństwo:** Średnie · **Skutek:** Krytyczny · **Kategoria:** Sklep / Apple
- **Plan Mitygacji:** Demonstracja hybrydowej architektury chmurowej Supabase, zaawansowanego generatora wektorowego PDF A4, analizatora 10 lotek skrzydła, skanera kodów aparatem w czasie rzeczywistym z Vision Framework, sieci ratunkowej Lost & Found oraz wsparcia dla Apple Watch.

#### RYZ-02: Uszkodzenie lub Utrata Bazy Danych Hodowli w Gołębniku
- **Prawdopodobieństwo:** Niskie · **Skutek:** Krytyczny · **Kategoria:** Architektura Danych
- **Plan Mitygacji:** Tryb SQLite WAL (Write-Ahead Logging) z atomowymi transakcjami. Podwójna ochrona: automatyczny backup rotacyjny lokalny (10 kopii) + asynchroniczna replikacja do chmury Supabase PostgreSQL.

#### RYZ-03: Błędy Obliczeń Geodezyjnych Wywołujące Spory w Oddziałach
- **Prawdopodobieństwo:** Średnie · **Skutek:** Wysoki · **Kategoria:** Domena / Regulamin
- **Plan Mitygacji:** Zastosowanie algorytmu elipsoidalnego Vincenty'ego (WGS-84) o dokładności geodezyjnej do $0,001\text{ m}$. Zestaw testów różnicowych (Cross-Validation) z oficjalnym korpusem list konkursowych PZHGP i FCI.

#### RYZ-04: Zabrudzenie Mikronaklejki QR Pyłem Piórowym w Lufce
- **Prawdopodobieństwo:** Średnie · **Skutek:** Wysoki · **Kategoria:** Sprzęt / Ergofizyka
- **Plan Mitygacji:** Kody QR z korekcją błędów **Level H (do 30% odporności na fizyczne zniszczenie)**, automatyczne doświetlenie LED w ciemnym wlocie oraz opcjonalne 1-tap potwierdzenie manualne.

#### RYZ-05: Wyciek Położenia Gołębnika i Kradzież Cennego Stada
- **Prawdopodobieństwo:** Niskie · **Skutek:** Krytyczny · **Kategoria:** Bezpieczeństwo / Prawne
- **Plan Mitygacji:** Rygorystyczne polityki Row Level Security (RLS) w PostgreSQL — współrzędne gołębnika są w 100% niewidoczne dla osób postronnych. W publicznych linkach i rodowodach wyświetlana jest wyłącznie nazwa miejscowości/sekcji bez koordynatów GPS.

#### RYZ-06: Bariera Technologiczna i Odrzucenie Aplikacji przez Starszych Hodowców
- **Prawdopodobieństwo:** Wysokie · **Skutek:** Wysoki · **Kategoria:** UX / Psychologia
- **Plan Mitygacji:** Tryb Polowy (Field Mode) z kaflami $\ge 56 \times 56\,\text{pt}$, zero wymuszonych rejestracji na starcie (anonimowy start sesji), głośny feedback dźwiękowy i haptyczny, powiększone fonty Dynamic Type.

#### RYZ-14: Zerwane Połączenie Sieciowe w Gołębniku w Trakcie Synchronizacji Supabase
- **Prawdopodobieństwo:** Wysokie · **Skutek:** Wysoki · **Kategoria:** Chmura / Sieć
- **Opis:** Hodowca rejestruje powrót ptaków w gołębniku na granicy zasięgu LTE/EDGE.
- **Plan Mitygacji:** Żadne zapytanie nie blokuje interfejsu. Wszelkie operacje zapisywane są natychmiast w lokalnej tabeli `sync_queue` w SQLite. Wypychanie do Supabase następuje w tle z mechanizmem wykładniczego ponawiania (Exponential Backoff).

#### RYZ-15: Przypadkowy Wyciek Danych Stada przez Lukę w Politykach RLS Supabase
- **Prawdopodobieństwo:** Niskie · **Skutek:** Krytyczny · **Kategoria:** Bezpieczeństwo Chmury
- **Opis:** Błędnie skonstruowana polityka RLS mogłaby pozwolić obcemu hodowcy podejrzeć ptaki innego gołębnika.
- **Plan Mitygacji:** Zasada **Default Deny** we wszystkich tabelach. Każda tabela posiada testy bezpieczeństwa w standardzie `pgTAP` sprawdzające izolację danych między różnymi `auth.uid()`.

#### RYZ-16: Przekroczenie Limitów Darmowego Planu Supabase
- **Prawdopodobieństwo:** Niskie · **Skutek:** Średni · **Kategoria:** Finanse / Infrastruktura
- **Opis:** Nagły wzrost liczby użytkowników mógłby doprowadzić do wyczerpania darmowej puli 500 MB bazy danych.
- **Plan Mitygacji:** Zdjęcia przechowywane są wyłącznie w Supabase Storage (nigdy jako BLOB w bazie!). Baza Postgres przechowuje tylko lekkie metadane tekstowe (500 MB mieści ponad 1 mln ptaków). Przy przekroczeniu 50k MAU opłata 25 USD za plan Pro jest z wielokrotnym zapasem pokrywana z subskrypcji użytkowników.

#### RYZ-17: Spam i Fałszywe Zgłoszenia w Sieci Lost & Found
- **Prawdopodobieństwo:** Średnie · **Skutek:** Średni · **Kategoria:** Społeczność
- **Opis:** Nieuczciwi użytkownicy próbujący wysyłać fałszywe powiadomienia o odnalezieniu ptaka.
- **Plan Mitygacji:** Weryfikacja formatu obrączki (musi istnieć w bazie gołębi ze statusem `ZAGINIONY`), rate limiting na adres IP w Supabase Edge Function oraz brak udostępniania bezpośredniego kontaktu do hodowcy przed potwierdzeniem przez system.
