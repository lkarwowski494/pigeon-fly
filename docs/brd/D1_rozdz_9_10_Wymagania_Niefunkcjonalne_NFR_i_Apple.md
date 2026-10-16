# Rozdziały 9–10: Wymagania Niefunkcjonalne (NFR) i Wytyczne Apple HIG (D1)
## Pigeon-Fly · Standardy Jakościowe, Ergonomia Polowa i Bezpieczeństwo Supabase

---

# Rozdział 9: Katalog Wymagań Niefunkcjonalnych (NFR-001 do NFR-065)

### 9.1. Niezawodność i Architektura Hybrydowa Offline-First (NFR-OFF)
- **NFR-OFF-001 (Niezależność Polowa):** Aplikacja zachowuje 100% funkcjonalności obliczeniowej, bazodanowej i generowania dokumentów PDF bez aktywnego połączenia z siecią.
- **NFR-OFF-002 (Zero Network Blocking):** Wszelkie operacje zapisu i odczytu w gołębniku trafiają bezpośrednio do lokalnej bazy SQLite WAL. Żadne zapytanie sieciowe nie ma prawa blokować wątku głównego interfejsu (UI).
- **NFR-OFF-003 (Protokół Synchronizacji Delta):** Lokalne mutacje rejestrowane są w tabeli `sync_queue`. Gdy dostępne jest połączenie z internetem, silnik w tle wysyła zmienione rekordy do Supabase PostgREST w paczkach (batch up to 50 items) z mechanizmem wykładniczego ponawiania (Exponential Backoff: 1s, 2s, 4s, 8s...).

---

### 9.2. Bezpieczeństwo, Uwierzytelnianie i Izolacja Danych (NFR-SEC)
- **NFR-SEC-001 (Row Level Security w PostgreSQL):** Wszystkie tabele w bazie Supabase posiadają bezwzględnie aktywne RLS (`ENABLE ROW LEVEL SECURITY`). Brak jakichkolwiek polityk `USING (true)` poza publicznym portalem odczytu zweryfikowanych rodowodów.
- **NFR-SEC-002 (Anonimowy Start Zero-Friction):** Aplikacja generuje anonimowy token sesji Supabase Auth (`signInAnonymously()`). Użytkownik korzysta z chmury natychmiast bez podawania danych.
- **NFR-SEC-003 (Bezszwowe Łączenie Tożsamości z Apple Sign-In):** W chwili gdy hodowca decyduje się na tandem hodowlany lub zakup Pro, anonimowe konto zostaje bezutratnie scalone z Apple ID (`linkIdentity(with: .apple)`), zachowując wszystkie dotychczasowe dane stada i rodowodów.
- **NFR-SEC-004 (Szyfrowanie Współrzędnych):** Dokładne koordynaty GPS gołębnika są w bazie Supabase dostępne wyłącznie dla właściciela i autoryzowanych członków tandemu. W publicznych relacjach live oraz na rodowodach współrzędne są całkowicie ukryte.

---

### 9.3. Ergofizyka i Tryb Gołębnika (NFR-FIELD)
- **NFR-FIELD-001 (Wymiary Dotyku):** W trybie Field Mode wszystkie kafle i przyciski mają fizyczny wymiar $\ge 56 \times 56\,\text{pt}$ (w trybie standardowym $\ge 44 \times 44\,\text{pt}$).
- **NFR-FIELD-002 (Blokada Wygaszania Ekranu):** Podczas dyżuru przylotowego aplikacja ustawia `UIApplication.shared.isIdleTimerDisabled = true`.
- **NFR-FIELD-003 (Strefa Kciuka):** Kluczowe akcje ulokowane w dolnych 40% ekranu dla swobodnej obsługi jedną ręką.
- **NFR-FIELD-004 (Wysoki Kontrast w Słońcu):** Czerń `#000000` i jaskrawy bursztyn `#FFCC00` — doskonała widoczność na dachu w ostrym słońcu.

---

### 9.4. Dostępność i Wsparcie dla Seniorów (NFR-DOST)
- **NFR-DOST-001 (Dynamic Type):** Pełne skalowanie wszystkich tekstów do największych rozmiarów systemowych Accessibility XXL.
- **NFR-DOST-002 (VoiceOver):** Precyzyjne etykiety semantyczne dla czytnika ekranu na każdym kafelku i przycisku.
- **NFR-DOST-003 (Redukcja Ruchu):** Zgodność z systemową flagą `prefers-reduced-motion`.

---

### 9.5. Globalna Lokalizacja w 35 Językach (NFR-I18N)
- **NFR-I18N-001:** Zero hardcodowanych ciągów tekstowych. Wszystkie teksty ładowane ze słowników z uwzględnieniem żargonu hodowlanego PZHGP, FCI, KBDB, Verband.
- **NFR-I18N-002:** Pełne wsparcie dla 35 języków (w tym pismo od prawej do lewej RTL dla arabskiego i hebrajskiego).

---

### 9.6. Budżety Wydajnościowe CPU i Pamięci (NFR-WYD)
- **NFR-WYD-001:** Start aplikacji do pierwszego widoku stada: $< 400\,\text{ms}$.
- **NFR-WYD-002:** Przeliczenie formuły Vincenty'ego i prędkości $m/min$: $< 1\,\text{ms}$.
- **NFR-WYD-003:** Rekonstrukcja drzewa 5 pokoleń i inbredu Wrighta: $< 25\,\text{ms}$.
- **NFR-WYD-004:** Generowanie wektorowego PDF A4: $< 450\,\text{ms}$.
- **NFR-WYD-005:** Opóźnienie transmisji przylotu przez Supabase Realtime: $< 200\,\text{ms}$ w sieci LTE/5G.

---

# Rozdział 10: Wytyczne Apple Human Interface Guidelines (HIG)

1. **Standard Nawigacji:** Spójny dolny pasek 5 zakładek SF Symbols 6: *Gołębnik*, *Loty*, *Skaner QR*, *Zdrowie*, *Ustawienia / Chmura*.
2. **Standard Zamykania Modali:** Każde okno modalne posiada fizyczny, widoczny przycisk „Anuluj / Zamknij” w lewym górnym rogu nagłówka ($\ge 44 \times 44\,\text{pt}$).
3. **Wsparcie watchOS 11:** Niezależna aplikacja na Apple Watch z protokołem `WatchConnectivity` i odporną na brak sieci kolejką `WatchOfflineQueue`.
