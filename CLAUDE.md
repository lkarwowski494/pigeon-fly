# PIGEON-FLY (Cyfrowy Notes Mistrza) — Zasady dla Agenta i Architektura Projektu

- **Repozytorium jest PUBLICZNE (ADR-031).** Nigdy nie commituj sekretów (klucze API, certyfikaty, .p8/.p12, .env) ani danych osobowych (dane hodowców, współrzędne prywatne bez zgody). Przed commitem sprawdź `git diff --cached`.
- **Filozofia Produktu: 100% Offline-First, Zero Login, Zero Telemetry (Data Not Collected).** Lokalna baza danych SQLite jako jedyne źródło prawdy. Brak wymogu połączenia z internetem w trakcie pracy w gołębniku.
- **Ergofizyka / Field Mode (Tryb Warsztatowy Gołębnika):** Aplikacja projektowana na trudne warunki polowe (kurz, pióra, brudne ręce, słońce odbijające się w ekranie, trzymanie ptaka w jednej ręce). Wielkie, kontrastowe elementy UI ($\ge 56 \times 56\,\text{pt}$), dźwiękowe i haptyczne potwierdzenia akcji, blokada wygaszania ekranu (`isIdleTimerDisabled = true`).
- **Narzędzia 0 zł poza opłatą Apple Developer.** Brak serwerów backendowych, brak płatnych baz chmurowych, brak zewnętrznych API generujących koszty krańcowe.
- **Testy przed kodem (TDD) i 9 warstw jakości:** Każda funkcja i kalkulator (zwłaszcza przeliczanie $m/min$, współrzędne geodezyjne Haversine/Vincenty, współczynnik inbredu Wrighta, bilans mieszanek paszowych) posiada rygorystyczne testy jednostkowe, testy oparte na właściwościach (Property-Based Testing `fast-check` / SwiftCheck) oraz niezmienniki matematyczne.
- **Definicja ukończenia (DoD):** Zgodnie z `docs/20-definicja-ukonczenia.md` — komplet testów automatycznych (logika domenowa, ekrany, scenariusze Maestro, odporność na awarie zasilania/restart, transakcyjny rollback w SQLite).
- **Zasada spójności interakcji:** Wzorce interakcji są jednolite w całej aplikacji. Każdy modal ma wyraźny przycisk „Anuluj / Zamknij” w lewym górnym rogu.
- **Merytoryczne podstawy i 5 szczebli hierarchii źródeł:**
  1. *Rachunek i formuły matematyczno-geodezyjne* (Haversine, Vincenty, wzór na prędkość FCI $v = d/t$, wzór inbredu Wrighta).
  2. *Regulaminy i normy oficjalne* (Międzynarodowa Federacja Gołębi Pocztowych FCI, Polski Związek Hodowców Gołębi Pocztowych PZHGP, KBDB, Verband Deutscher Brieftaubenzüchter).
  3. *Weterynaryjne publikacje naukowe i podręczniki medycyny ptaków* (choroby gołębi, wirusologia PMV-1, farmakologia, pierzenie, anatomia skrzydła i oka).
  4. *Uznane publikacje i encyklopedie mistrzowskie* (metody wdowieństwa, ciemnia, żywienie sportowe).
  5. *Praktyka i doświadczenie mistrzów* (wyłącznie jako oznaczone wskazówki hodowlane).
- **Ścisła zasada READ-ONLY dla innych repozytoriów:** Repozytoria `trening` oraz `Oczko` są **ŚCIŚLE READ-ONLY**. Absolutny zakaz dokonywania jakichkolwiek modyfikacji w tamtych projektach. Służą wyłącznie jako wzorce architektoniczne i standardy dokumentacji.
