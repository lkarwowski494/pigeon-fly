# Rozdział 7.6: Wymagania Funkcjonalne — Telemetria IoT, Mapy Offline, Supabase i Apple Watch (B6)
## Pigeon-Fly · Specyfikacja Modułu 6 (BR-TEL)

---

### BR-TEL-001: Apple Watch Companion — Tarcza Gotowości Przylotowej
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P3 (Marek)
- **Opis:** Niezależny ekran na zegarku Apple Watch (watchOS 11+) z podglądem lotu i liczbą oczekiwanych gołębi.

---

### BR-TEL-002: 1-Tap Rejestracja Przylotu z Nadgarstka (Apple Watch Instant Clocking)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Hodowca jednym stuknięciem w tarczę zegarka rejestruje powrót ptaka spadającego z nieba z dokładnością do milisekundy (`Timestamp UTC`).

---

### BR-TEL-003: Parowanie Czasu z Zegarka z Numerem Obrączki
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Bezprzewodowe przypisanie zarejestrowanego czasu z zegarka do konkretnego ptaka po wejściu do gołębnika.

---

### BR-TEL-004: Współpraca z Miniaturowymi Modułami IoT / GPS / BTS
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P2, P3, P5 (Chen)
- **Opis:** Odbiór danych z miniaturowych modułów telemetrycznych montowanych na ptaku ($<3,5\text{ g}$) przez Bluetooth Low Energy (BLE) po powrocie do gołębnika.

---

### BR-TEL-005: Wektorowe Mapy Offline i Rekonstrukcja Trasy Przelotu
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P2, P3, P5
- **Opis:** Prezentacja trajektorii przelotu na wektorowej mapie offline z kolorowaniem gradientem prędkości i wskaźnikiem zboczenia z kursu (Drift Index).

---

### BR-TEL-006: Ręczny Import Plików GPX / CSV z Obcych Trackerów
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P3, P6
- **Opis:** Import plików GPX/CSV za pośrednictwem arkusza udostępniania plików iOS.

---

### BR-TEL-007: Supabase Edge Functions jako Brama Telemetryczna IoT (Cloud Ingestion)
- **Priorytet:** COULD · **Etap:** 2.x · **Persona:** P3, P5 (Chen)
- **Opis:** Dla modułów telemetrycznych nowej generacji wyposażonych w miniaturowe moduły komórkowe (NB-IoT / LTE-M): moduł wysyła skompresowany pakiet telemetryczny bezpośrednio do endpointu **Supabase Edge Function** (`/functions/v1/telemetry-ingest`).
- **Kryteria Akceptacji:**
  - *GIVEN:* Gołąb z aktywnym trackerem LTE-M lecący na trasie 500 km.
  - *WHEN:* Tracker łączy się z siecią co 30 minut i przesyła pakiet współrzędnych.
  - *THEN:* Supabase Edge Function waliduje autentyczność urządzenia, rozpakowuje współrzędne i transakcyjnie zapisuje je w tabeli `pigeon_telemetry_points`. Hodowca w aplikacji widzi aktualną pozycję ptaka na mapie niemal w czasie rzeczywistym.

---

### BR-TEL-008: Porównywarka Tras Przelotu w Chmurze (Multi-Bird Trail Overlay)
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P2, P3
- **Opis:** Możliwość nałożenia na jedną mapę śladów przelotu 5 różnych ptaków z tego samego lotu, co pozwala zidentyfikować, czy ptaki leciały w jednym stadzie, czy rozdzieliły się przed przeszkodami terenowymi (zbiorniki wodne, pasma górskie, strefy burzowe).
