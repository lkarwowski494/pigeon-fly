# Rozdział 7.4: Wymagania Funkcjonalne — Treningi, Loty, Kalkulator m/min i Relacje na Żywo (B4)
## Pigeon-Fly · Specyfikacja Modułu 4 (BR-LOT)

---

### BR-LOT-001: Konfiguracja Zawodów i Treningów Wywózkowych
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P3 (Marek)
- **Opis:** Definiowanie sesji lotowej z parametrami startowymi (nazwa, kategoria FCI A/B/C/M, współrzędne GPS stacji, czas wypuszczenia).

---

### BR-LOT-002: Geodezyjny Pomiary Dystansu (Vincenty WGS-84 & Haversine)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2 (Luc)
- **Opis:** Precyzyjne obliczenie odległości ortodromicznej z dokładnością do $1\text{ mm}$ (elipsoida WGS-84) z możliwością wpisania oficjalnego pomiaru związkowego.

---

### BR-LOT-003: Automatyczny Kalkulator Prędkości w Czasie Rzeczywistym ($m/min$)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P4
- **Formuła Matematyczna:**
  $$v = \frac{\text{Dystans [metry]}}{\text{Czas Lotu [minuty]}} = \frac{d}{T_{przylot} - T_{start}}$$
- **Kryteria Akceptacji:**
  - *GIVEN:* Dystans $392\,450\text{ m}$, start `06:30:00`, przylot `11:42:18`.
  - *WHEN:* Zostaje zarejestrowany przylot.
  - *THEN:* Aplikacja w czasie $<1\,\text{ms}$ wyświetla prędkość **$1256,64\text{ m/min}$**.

---

### BR-LOT-004: Dynamiczny Ranking Przylotów w Gołębniku (Live Loft Leaderboard)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P8
- **Opis:** Automatyczne sortowanie ptaków w gołębniku wg czasu przylotu i prędkości $m/min$, strata do lidera.

---

### BR-LOT-005: Automatyczna Neutralizacja Nocna w Maratonach (Overnight Neutralization)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3 (Marek)
- **Opis:** Zgodne z regulaminem FCI automatyczne wyłączanie godzin nocnych z czasu lotu w maratonach trwających powyżej 1 doby.

---

### BR-LOT-006: Wektor Znosu Wiatru i Korekta Aerodynamiczna (Aero Speed)
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P3 (Marek)
- **Opis:** Rozkład wektora wiatru na azymut lotu i wyliczenie prędkości znormalizowanej aerodynamicznie.

---

### BR-LOT-007: Asystent Dnia Koszowania i Lista Wkładaniowa
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P8 (Andrzej)
- **Opis:** Typowanie drużyny, serii (np. 5/50), kontrola karencji leków i eksport do PDF/CSV.

---

### BR-LOT-008: Supabase Realtime Live Race Broadcasting (Transmisje Przylotów na Żywo)
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P3 (Marek), P8 (Andrzej)
- **Opis:** Możliwość transmitowania powrotu ptaków z lotu w czasie rzeczywistym za pośrednictwem kanałów **Supabase Realtime WebSockets**.
- **Mechanizm Działania:**
  1. Przed lotem hodowca generuje unikalny token transmisji (np. `pigeonfly.app/live/MISTRZ-POZNAN`).
  2. Udostępnia link rodzinie, przyjaciołom lub członkom oddziału.
  3. W chwili gdy ptak wchodzi przez lufkę (lub zostanie zarejestrowany w telefonie/zegarku), aplikacja wysyła lekki pakiet zdarzenia do kanału Supabase Realtime:
     ```json
     {
       "race_id": "peine-2026",
       "bird_number": "PL-0123-23-4567",
       "arrival_time": "11:42:18",
       "speed_mpm": 1256.64,
       "rank_in_loft": 1
     }
     ```
  4. Na ekranach kibiców w przeglądarce WWW lub w aplikacji tabela wyników aktualizuje się w ułamku sekundy ($<200\,\text{ms}$) z animacją i fanfarami.
- **Kryteria Akceptacji:**
  - *GIVEN:* Aktywna transmisja live.
  - *WHEN:* Gołąb zostaje zeskanowany w lufce.
  - *THEN:* Wszyscy kibice z otwartym linkiem widzą przylot ptaka natychmiast, bez konieczności odświeżania strony.

---

### BR-LOT-009: Prywatne Mini-Derby Sekcji (Klubowe Ligi Przylotów na Żywo)
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P3, P8
- **Opis:** Grupa 3–15 hodowców z jednej sekcji zakłada wspólne prywatne „Derby”. Każdy z nich ma swój gołębnik o własnych współrzędnych i kilometrażu. W trakcie lotu baza Supabase agreguje przyloty ze wszystkich uczestniczących gołębników i tworzy wspólną, nieoficjalną tabelę prędkości $m/min$ na żywo.
- **Kryteria Akceptacji:**
  - *GIVEN:* Utworzone mini-derby 5 hodowców.
  - *WHEN:* U hodowcy A przylatuje ptak z prędkością $1260\text{ m/min}$, a u hodowcy B o 10 minut później, ale z prędkością $1265\text{ m/min}$ (dłuższy dystans).
  - *THEN:* Tabela derbów natychmiast klasyfikuje hodowcę B na 1. miejscu zgodnie z wyższą prędkością $m/min$.
