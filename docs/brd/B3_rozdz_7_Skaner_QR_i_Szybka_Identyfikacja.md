# Rozdział 7.3: Wymagania Funkcjonalne — Skanowanie Kodów QR i Szybki Identyfikator w Lufce (B3)
## Pigeon-Fly · Specyfikacja Modułu 3 (BR-SKAN)

---

### BR-SKAN-001: Generowanie Kompaktowych Mikronaklejek QR na Obrączki
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P6 (Tomek)
- **Opis:** Aplikacja generuje unikalne kody QR o ultrakompaktowej strukturze danych, zoptymalizowane do druku na mikronaklejkach o wymiarach zaledwie $8 \times 8\text{ mm}$ lub $10 \times 10\text{ mm}$, naklejanych na plastikowe obrączki pomocnicze gołębia.
- **Format Danych w Kodzie:**
  ```
  PF1:[Kraj]:[Rok]:[NumerObrączki]:[SumaKontrolnaCRC16]
  Przykład: PF1:PL:26:012345:8F2A
  Publiczny URL awaryjny: https://pigeonfly.app/b/PL-26-012345
  ```
- **Korekcja Błędów:** Standard **QR Code Level H (High)** — odporność na zniszczenie lub zabrudzenie do 30% powierzchni naklejki.

---

### BR-SKAN-002: Generator Arkusza Naklejek do Druku (PDF A4)
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P8 (Andrzej)
- **Opis:** Generowanie gotowego arkusza A4 z siatką mikronaklejek dla całego stada pasującego do standardowych szablonów etykiet.

---

### BR-SKAN-003: Tryb Skanera Lufkowego w Czasie Rzeczywistym (Vision Framework)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P4 (Hans)
- **Opis:** Skanowanie aparatem w 60 fps z wykorzystaniem Apple Vision Framework, czas odczytu $<15\text{ ms}$, pełna tolerancja obrotu.

---

### BR-SKAN-004: Automatyczne Doświetlanie Wlotu (Smart Torch Control)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4
- **Opis:** Automatyczne włączenie latarki LED na poziomie $30\%$ mocy przy oświetleniu $<50\text{ lux}$.

---

### BR-SKAN-005: Precyzyjny Timestamping i Trwały Zapis w Dzienniku Zdarzeń
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3 (Marek)
- **Opis:** Zapis w SQLite WAL co do milisekundy (`2026-06-14T11:42:18.421Z`) oraz asynchroniczna replikacja do tabeli `race_arrivals` w Supabase.

---

### BR-SKAN-006: Akustyczna i Haptyczna Informacja Zwrotna (Field Feedback)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4 (Hans)
- **Opis:** Gong audio $520\text{ Hz}$, podwójna wibracja Taptic Engine i żółty błysk ekranu.

---

### BR-SKAN-007: Ochrona Przed Podwójnym Zliczeniem Przylotu (Anti-Bouncing Guard)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Debouncer $3000\,\text{ms}$ per ptak chroniący przed zduplikowaniem rekordu przy zatrzymaniu się gołębia w kadrze.

---

### BR-SKAN-008: Globalna Sieć Pomocy Zagubionym Gołębiom (Lost & Found Portal w Supabase)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P10 (Karolina — Znalazca)
- **Opis:** Wykorzystanie kodu QR na nodze ptaka jako bezpiecznego identyfikatora ratunkowego w przypadku zaginięcia podczas lotu lub załamania pogody.
- **Mechanizm Ratunkowy:**
  1. Znalazca zmęczonego gołębia (np. na balkonie lub w ogrodzie) skanuje kod QR zwykłym aparatem telefonu (bez konieczności posiadania aplikacji Pigeon-Fly) lub wchodzi na `pigeonfly.app/znaleziony`.
  2. Przeglądarka wyświetla prosty, bezpieczny formularz w Supabase:
     - Numer odnalezionego ptaka (zaczytany z kodu QR),
     - Pole na numer telefonu lub adres e-mail znalazcy,
     - Opcjonalne zdjęcie ptaka i lokalizacja odnalezienia.
  3. **Ochrona Prywatności:** Znalazca **nie widzi** nazwiska hodowcy, jego adresu ani współrzędnych gołębnika.
  4. **Natychmiastowy Alert:** Supabase Edge Function natychmiast wysyła powiadomienie Push (APNs) oraz e-mail do właściciela ptaka:
     *„ALARM: Twój gołąb PL-0123-24-5555 został odnaleziony w Płocku! Znalazca zostawił numer telefonu: 501-xxx-xxx. Kliknij, aby zadzwonić.”*
- **Kryteria Akceptacji:**
  - *GIVEN:* Zarejestrowany ptak w Pigeon-Fly z aktywną chmurą.
  - *WHEN:* Znalazca wypełnia formularz na `pigeonfly.app/znaleziony`.
  - *THEN:* Właściciel otrzymuje powiadomienie Push w czasie $<3\text{ sekund}$ od zatwierdzenia formularza przez znalazcę.
