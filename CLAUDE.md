# PIGEON-FLY (Cyfrowy Notes Mistrza) — Zasady dla Agenta i Architektura Projektu

- **Repozytorium jest PUBLICZNE (ADR-031).** Nigdy nie commituj sekretów (klucze API `service_role`, tokeny, certyfikaty, .p8/.p12, .env) ani danych osobowych (dane hodowców, współrzędne prywatne bez zgody). Przed commitem sprawdź `git diff --cached`.
- **Filozofia Architektoniczna: Hybrydowy Offline-First z Chmurą Supabase (PostgreSQL + Realtime + Storage + Auth + Edge Functions).**
  - *W gołębniku:* 100% lokalne, bezopóźnieniowe operacje w bazie SQLite (tryb WAL). Brak sieci nie blokuje żadnej funkcji notesu, skanera ani kalkulatora.
  - *Gdy dostępna sieć:* Asynchroniczna, dwukierunkowa synchronizacja delta z chmurą **Supabase**, zapewniająca synchronizację wielourządzeniową, bezpieczny backup, współpracę w tandemie hodowlanym, relacje z lotów na żywo (Live Race Broadcast) oraz globalną sieć zgłaszania zagubionych ptaków (Lost & Found).
- **Bezpieczeństwo Danych i Row Level Security (RLS):** Wszystkie tabele w Supabase PostgreSQL posiadają bezwzględnie włączone RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Dostęp do gołębnika i ptaków ściśle izolowany do właściciela (`auth.uid() = owner_id`) lub autoryzowanych członków tandemu.
- **Ergofizyka / Field Mode (Tryb Warsztatowy Gołębnika):** Aplikacja projektowana na trudne warunki polowe (kurz, pióra, brudne ręce, słońce odbijające się w ekranie, trzymanie ptaka w jednej ręce). Wielkie, kontrastowe elementy UI ($\ge 56 \times 56\,\text{pt}$), dźwiękowe i haptyczne potwierdzenia akcji, blokada wygaszania ekranu (`isIdleTimerDisabled = true`).
- **Narzędzia 0 zł poza opłatą Apple Developer i darmowym tierem Supabase.** Darmowy tier Supabase (do 50 000 MAU, 500 MB bazy, 1 GB storage) pokrywa potrzeby w początkowej fazie. Brak zewnętrznych płatnych API.
- **Testy przed kodem (TDD) i 9 warstw jakości:** Każda funkcja, kalkulator ($m/min$, Vincenty, inbred Wrighta) oraz protokół synchronizacji posiada rygorystyczne testy jednostkowe, testy oparte na właściwościach (Property-Based Testing `fast-check` / SwiftCheck) oraz testy RLS w standardzie SQL (`pgTAP`).
- **Definicja ukończenia (DoD):** Zgodnie z `docs/20-definicja-ukonczenia.md` — komplet testów automatycznych (logika domenowa, ekrany, scenariusze Maestro, odporność na awarie zasilania/restart, transakcyjny rollback, determinizm synchronizacji).
- **Zasada spójności interakcji:** Wzorce interakcji są jednolite w całej aplikacji. Każdy modal ma wyraźny przycisk „Anuluj / Zamknij” w lewym górnym rogu.
- **Merytoryczne podstawy i 5 szczebli hierarchii źródeł:**
  1. *Rachunek i formuły matematyczno-geodezyjne* (Haversine, Vincenty, wzór na prędkość FCI $v = d/t$, wzór inbredu Wrighta).
  2. *Regulaminy i normy oficjalne* (Międzynarodowa Federacja Gołębi Pocztowych FCI, Polski Związek Hodowców Gołębi Pocztowych PZHGP, KBDB, Verband).
  3. *Weterynaryjne publikacje naukowe i podręczniki medycyny ptaków* (choroby gołębi, wirusologia PMV-1, farmakologia, pierzenie, anatomia skrzydła i oka).
  4. *Uznane publikacje i encyklopedie mistrzowskie* (metody wdowieństwa, ciemnia, żywienie sportowe).
  5. *Praktyka i doświadczenie mistrzów* (wyłącznie jako oznaczone wskazówki hodowlane).
- **Ścisła zasada READ-ONLY dla innych repozytoriów:** Repozytoria `trening` oraz `Oczko` są **ŚCIŚLE READ-ONLY**. Absolutny zakaz dokonywania jakichkolwiek modyfikacji w tamtych projektach. Służą wyłącznie jako wzorce architektoniczne i standardy dokumentacji.
