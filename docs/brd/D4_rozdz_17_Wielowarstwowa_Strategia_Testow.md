# Rozdział 17: Wielowarstwowa Strategia Testów i Rygor Jakości (D4)
## Pigeon-Fly · Standard Jakości Inżynierskiej, Testy RLS Supabase i 10 Warstw Weryfikacji

---

### 1. Filozofia Jakości: Rygor Wieloperspektywiczny
Zgodnie ze standardem studia Apps4Brew wypracowanym w repozytorium `organizer`, każda nowa funkcja domenowa, zmiana schematu bazy danych, polityka RLS czy mechanizm synchronizacji podlega bezwzględnej weryfikacji automatycznej przed jakimkolwiek wdrożeniem produkcyjnym.

---

### 2. Dziesięć Warstw Rygoru Jakościowego (Testing Matrix)

```
                       10 WARSTW JAKOŚCI PIGEON-FLY
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. CZYSTA LOGIKA DOMENOWA (100% Line Coverage, Pure Swift / TS)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 2. NIEZMIENNIKI MATEMATYCZNE I PBT (Property-Based fast-check)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 3. TESTY RÓŻNICOWE (Cross-Validation z Korpusem Python 3.14)          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 4. PERSYSTENCJA SQLITE I TRANSAKCYJNOŚĆ (Zero Partial Writes)          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 5. POLITYKI BEZPIECZEŃSTWA RLS SUPABASE (Testy pgTAP / .test.sql)      │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 6. PROTOKÓŁ SYNCHRONIZACJI DELTA (Offline Reconciliation & LWW)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 7. ERGOFIZYKA FIELD MODE I APPLE HIG (Wymiary dotyku >= 56 pt)         │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 8. DOSTĘPNOŚĆ I SENIORZY (VoiceOver & Dynamic Type XXL)                │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 9. BUDŻETY WYDAJNOŚCIOWE CPU I PAMIĘCI (Microsecond Benchmarks)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 10. TESTY SCENARIUSZOWE MAESTRO E2E (Pełne Przepływy Użytkownika)      │
 └────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Szczegółowy Zakres Nowych Warstw Chmurowych

#### Warstwa 5: Testy Polityk Row Level Security w Supabase (`pgTAP` / `.test.sql`)
- Wzorowane na standardzie repozytorium `organizer` (`supabase/tests/*.test.sql`):
  1. *Test Izolacji Gołębników:* Użytkownik $A$ nie ma prawa odczytać ani zmodyfikować ptaków ani współrzędnych gołębnika użytkownika $B$.
  2. *Test Uprawnień Tandemu:* Członek z rolą `MEMBER` może rejestrować przyloty i edytować stado, ale nie może usunąć profilu gołębnika ani zmienić właściciela (`OWNER`).
  3. *Test Odczytu Zweryfikowanego Rodowodu:* Każdy anonimowy użytkownik ma prawo odczytać publiczny certyfikat rodowodu z `verified_pedigrees` wyłącznie pod warunkiem, że flaga `is_revoked = false`.
  4. *Test Zgłoszenia Lost & Found:* Anonimowy użytkownik ma prawo wstawić rekord do `lost_pigeon_reports`, ale odczytać go może wyłącznie właściciel ptaka o danym numerze obrączki.

#### Warstwa 6: Protokół Synchronizacji Delta i Rozstrzyganie Konfliktów
- Testy symulujące zerwanie połączenia sieciowego w trakcie wysyłania paczki rekordów:
  - Weryfikacja, że nieprzesłane rekordy pozostają w stanie `PENDING` w tabeli `sync_queue` i zostaną ponowione po wznowieniu sieci.
  - Testy determinizmu Last-Write-Wins (LWW): weryfikacja, że rekord ze świeższym znacznikiem czasu UTC poprawnie aktualizuje dane bez generowania niespójności relacyjnych w drzewie genealogicznym.
  - Test modelu Append-Only dla przylotów z lotu: dwa niezależne telefony w gołębniku rejestrują przyloty różnych ptaków – po zsynchronizowaniu oba przyloty trafiają do tabeli wyników bez nadpisań.

#### Warstwa 10: Scenariusze Automatyczne E2E (Maestro) z Chmurą
- Rozszerzone scenariusze end-to-end:
  1. *Scenariusz Tandemu:* Użytkownik 1 tworzy gołąb na symulatorze A $\rightarrow$ Synchronizacja w tle $\rightarrow$ Użytkownik 2 na symulatorze B widzi ptaka w czasie rzeczywistym.
  2. *Scenariusz Live Broadcast:* Uruchomienie lotu $\rightarrow$ Skanowanie kodu QR $\rightarrow$ Weryfikacja odebrania pakietu WebSocket w przeglądarce testowej.
  3. *Scenariusz Lost & Found:* Symulacja wysłania formularza zgłoszenia znalezionego gołębia $\rightarrow$ Otrzymanie powiadomienia Push w aplikacji mobilnej.
