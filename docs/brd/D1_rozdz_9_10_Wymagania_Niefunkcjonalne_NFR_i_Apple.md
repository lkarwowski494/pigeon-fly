# Rozdziały 9–10: Wymagania Niefunkcjonalne (NFR) i Wytyczne Apple HIG (D1)
## Pigeon-Fly · Standardy Jakościowe, Ergonomia Polowa i Prywatność

---

# Rozdział 9: Katalog Wymagań Niefunkcjonalnych (NFR-001 do NFR-060)

### 9.1. Niezawodność i Architektura Offline (NFR-OFF)
- **NFR-OFF-001:** Aplikacja zachowuje 100% funkcjonalności obliczeniowej, bazodanowej i generowania dokumentów PDF bez aktywnego połączenia z siecią komórkową lub Wi-Fi.
- **NFR-OFF-002:** Brak jakichkolwiek wywołań blokujących interfejs użytkownika w oczekiwaniu na odpowiedź sieciową (Zero Network Blocking).
- **NFR-OFF-003:** Baza danych SQLite otwarta w trybie **WAL (Write-Ahead Logging)** z synchronicznością `NORMAL` — gwarancja odporności na nagłą utratę zasilania telefonu bez uszkodzenia indeksów.

---

### 9.2. Ergofizyka i Tryb Gołębnika (NFR-FIELD)
- **NFR-FIELD-001 (Minimalny Rozmiar Przycisków):** W trybie Field Mode wszystkie przyciski i kafle interaktywne mają fizyczny wymiar $\ge 56 \times 56\,\text{pt}$ (w trybie standardowym $\ge 44 \times 44\,\text{pt}$ zgodnie z Apple HIG).
- **NFR-FIELD-002 (Blokada Wygaszania Ekranu):** Podczas trwania dyżuru przylotowego w module Skanera i Lotu aplikacja ustawia:
  ```swift
  UIApplication.shared.isIdleTimerDisabled = true
  ```
  zapobiegając uśpieniu telefonu, gdy hodowca obserwuje niebo. Po wyjściu z ekranu przylotów flaga automatycznie powraca do wartości `false`.
- **NFR-FIELD-003 (Strefa Kciuka):** Wszystkie krytyczne akcje (skanuj, zatwierdź, dodaj czas) znajdują się w dolnych $40\%$ wysokości ekranu, umożliwiając bezproblemową obsługę jedną ręką (gdy druga trzyma ptaka).
- **NFR-FIELD-004 (Wysoki Kontrast w Słońcu):** Interfejs Field Mode wykorzystuje paletę o ultrawysokim kontraście (głęboka czerń `#000000` i jaskrawy bursztyn/żółć `#FFCC00`), gwarantując czytelność przy bezpośrednim oświetleniu promieniami słonecznymi.

---

### 9.3. Dostępność i Wsparcie dla Seniorów (NFR-DOST)
- **NFR-DOST-001 (Dynamic Type):** Pełne skalowanie wszystkich tekstów interfejsu zgodnie z ustawieniami systemowymi wielkości fontu, w tym dla największych rozmiarów dostępnościowych (Accessibility Sizes).
- **NFR-DOST-002 (VoiceOver):** Każdy element interfejsu, kafelek ptaka, wynik prędkości i status lotki posiada precyzyjną, syntetyczną etykietę czytnika ekranu (np. *„Gołąb PL-0123-22-4444, samiec, niebieski, prędkość 1256 metrów na minutę, pierwsze miejsce w gołębniku”*).
- **NFR-DOST-003 (Redukcja Ruchu):** Wsparcie dla systemowej flagi `prefers-reduced-motion` — eliminacja zbędnych animacji przejść na rzecz natychmiastowych zmian widoków.

---

### 9.4. Globalna Lokalizacja w 35 Językach (NFR-I18N)
- **NFR-I18N-001:** Zero hardcodowanych ciągów tekstowych w kodzie źródłowym. Wszystkie teksty ładowane przez funkcję `t(key)` ze ściśle typowanych słowników.
- **NFR-I18N-002 (Kanon 35 Języków):**
  Angielski (US/UK), Polski, Niemiecki, Niderlandzki (Holandia/Flandria), Francuski, Rumuński, Włoski, Hiszpański, Portugalski, Chiński (Tradycyjny - Tajwan), Chiński (Uproszczony), Japoński, Arabski, Turecki, Czeski, Słowacki, Węgierski, Bułgarski, Chorwacki, Serbski, Grecki, Szwedzki, Duński, Norweski, Fiński, Tajski, Wietnamski, Indonezyjski, Ukraiński, Litewski, Łotewski, Estoński, Hindi, Koreański, Hebrajski.
- **NFR-I18N-003:** Zgodność z kierunkiem pisma od prawej do lewej (RTL) dla języka arabskiego i hebrajskiego.

---

### 9.5. Budżety Wydajnościowe CPU i Pamięci (NFR-WYD)
- **NFR-WYD-001:** Zimny start aplikacji do pierwszego interaktywnego widoku stada: $< 400\,\text{ms}$ na iPhone 11.
- **NFR-WYD-002:** Wyliczenie odległości Vincenty'ego i prędkości $m/min$: $< 1\,\text{ms}$.
- **NFR-WYD-003:** Rekonstrukcja drzewa genealogicznego 5 pokoleń (62 przodków) i obliczenie inbredu Wrighta: $< 25\,\text{ms}$.
- **NFR-WYD-004:** Generowanie i zapis wektorowego pliku PDF A4 rodowodu: $< 450\,\text{ms}$.
- **NFR-WYD-005:** Maksymalne zużycie pamięci RAM: $< 65\,\text{MB}$ podczas intensywnego skanowania wideo w lufce.

---

### 9.6. Prywatność i Bezpieczeństwo Danych (NFR-BEZP)
- **NFR-BEZP-001 (Deklaracja App Store):** Karta prywatności App Store zawiera oficjalne oświadczenie: **Data Not Collected**.
- **NFR-BEZP-002 (Szyfrowanie Współrzędnych):** Współrzędne geograficzne gołębnika macierzystego są szyfrowane kluczem systemowym iOS Keychain (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`).
- **NFR-BEZP-003 (Zero Telemetrii):** Brak jakichkolwiek wywołań sieciowych wysyłających crashlogi, identyfikatory IDFA/IDFV czy statystyki użycia.

---

# Rozdział 10: Wytyczne Apple Human Interface Guidelines (HIG)

1. **Spójność Nawigacji:** Zastosowanie standardowego paska 5 zakładek (Tab Bar) u dołu ekranu z czytelnymi symbolami SF Symbols 6:
   - *Gołębnik* (`bird.fill`),
   - *Loty* (`stopwatch.fill`),
   - *Skaner QR* (`qrcode.viewfinder`),
   - *Zdrowie* (`cross.case.fill`),
   - *Ustawienia / Więcej* (`gearshape.fill`).
2. **Standard Zamykania Okien Modalnych:** Zgodnie ze standardem studia Apps4Brew, każde okno modalne i wysuwane od dołu (sheet) posiada **widoczny, dotykowy przycisk „Anuluj / Zamknij” umieszczony w lewym górnym rogu nagłówka** (obszar $\ge 44 \times 44\,\text{pt}$). Gest przeciągnięcia w dół jest jedynie opcjonalnym dodatkiem.
3. **Wsparcie dla Apple Watch (watchOS 11):** Niezależna aplikacja zegarkowa wykorzystująca SwiftUI i protokół `WatchConnectivity` z kolejką offline na wypadek braku natychmiastowego połączenia z iPhone'em.
