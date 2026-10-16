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
  ```
- **Korekcja Błędów:** Zastosowanie standardu **QR Code Level H (High)** — pozwala na bezbłędny odczyt kodu nawet przy **fizycznym zniszczeniu lub zabrudzeniu do 30% powierzchni naklejki** (odporność na pył piórowy, odchody, zadrapania pazurem).
- **Kryteria Akceptacji:**
  - *GIVEN:* Karta zarejestrowanego ptaka.
  - *WHEN:* Użytkownik klika „Generuj Kod QR Obrączki”.
  - *THEN:* System generuje wektorowy kod QR zoptymalizowany pod małą gęstość pikseli (QR Version 1 lub 2, siatka $21 \times 21$ lub $25 \times 25$ modułów).

---

### BR-SKAN-002: Generator Arkusza Naklejek do Druku (PDF A4)
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P8 (Andrzej)
- **Opis:** Funkcja generowania gotowego arkusza A4 z siatką mikronaklejek dla całego stada (np. 100 naklejek na jednym arkuszu samoprzylepnym), pasującego do standardowych szablonów etykiet (np. Avery Zweckform).
- **Kryteria Akceptacji:**
  - *GIVEN:* Lista 50 młodych ptaków z danego rocznika.
  - *WHEN:* Hodowca klika „Drukuj Arkusz Naklejek QR”.
  - *THEN:* Aplikacja generuje plik PDF A4 zawierający siatkę kodów QR z czytelnym miniaturowym nadrukiem numeru obrączki pod każdym kodem, gotowy do wydruku na domowej drukarce.

---

### BR-SKAN-003: Tryb Skanera Lufkowego w Czasie Rzeczywistym (Vision Framework)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P4 (Hans)
- **Opis:** Specjalny tryb skanowania aparatem, uruchamiany w chwili oczekiwania na powrót ptaków z lotu. Telefon montowany jest w uchwycie przy wejściu do gołębnika (tzw. lufka / wlot jednokierunkowy) lub trzymany w dłoni hodowcy.
- **Wymogi Wydajnościowe:**
  - Przetwarzanie strumienia wideo z kamery w 60 klatkach na sekundę za pomocą Apple `Vision Framework` (`VNDetectBarcodesRequest`).
  - Czas detekcji i odczytu kodu: $< 15\,\text{ms}$ od momentu pojawienia się naklejki w polu widzenia.
  - Kąt odczytu: Pełna tolerancja obrotu $360^\circ$ oraz pochylenia do $60^\circ$.
- **Kryteria Akceptacji:**
  - *GIVEN:* Telefon w trybie „Skaner Lufki”.
  - *WHEN:* Gołąb z mikronaklejką QR przechodzi przez wlot do gołębnika.
  - *THEN:* Aparat natychmiast rejestruje kod, bez konieczności dotykania ekranu czy naciskania migawki.

---

### BR-SKAN-004: Automatyczne Doświetlanie Wlotu (Smart Torch Control)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4
- **Opis:** Wloty gołębnika są często zacienione lub ptaki przylatują późnym popołudniem/o zmierzchu.
- **Kryteria Akceptacji:**
  - *GIVEN:* Uruchomiony tryb skanera w ciemnym gołębniku.
  - *WHEN:* Czujnik światła otoczenia w telefonie wykrywa poziom oświetlenia $< 50\text{ lux}$.
  - *THEN:* Aplikacja automatycznie włącza diodę LED (latarkę) na poziomie $30\%$ mocy (optymalne doświetlenie kodu bez oślepiania i płoszenia wlatującego ptaka).

---

### BR-SKAN-005: Precyzyjny Timestamping i Trwały Zapis w Dzienniku Zdarzeń
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3 (Marek)
- **Opis:** Zeskanowanie kodu musi natychmiast i nieodwracalnie utrwalić dokładny czas przylotu.
- **Kryteria Akceptacji:**
  - *GIVEN:* Zeskanowanie kodu QR ptaka `PL-0123-24-5555`.
  - *WHEN:* Kod zostaje zdekodowany.
  - *THEN:* System rejestruje transakcyjnie w SQLite rekord w tabeli `race_arrivals`:
    - `bird_id`: identyfikator ptaka,
    - `timestamp_exact`: uniksowy czas z dokładnością do milisekundy (`2026-06-14T11:42:18.421Z`),
    - `arrival_source`: `QR_CAMERA`.
  - *THEN:* Jeśli w danym dniu zdefiniowany jest aktywny lot konkursowy, system automatycznie wylicza czas lotu i prędkość w $m/min$.

---

### BR-SKAN-006: Akustyczna i Haptyczna Informacja Zwrotna (Field Feedback)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4 (Hans)
- **Opis:** Hodowca stojący w gołębniku musi otrzymać natychmiastowe, jednoznaczne potwierdzenie sukcesu bez konieczności wpatrywania się w ekran.
- **Kryteria Akceptacji:**
  - *GIVEN:* Poprawny odczyt kodu w lufce.
  - *WHEN:* Czas zostaje zarejestrowany.
  - *THEN:*
    1. Głośnik telefonu emituje głęboki, spokojny gong o częstotliwości $520\text{ Hz}$ (słyszalny dla człowieka, obojętny dla ptaków).
    2. Silnik Taptic Engine generuje potężną, podwójną wibrację haptyczną (`UINotificationFeedbackGenerator.FeedbackType.success`).
    3. Cały ekran telefonu na 1 sekundę błyska na żółty kontrastowy kolor z wielkim napisem numeru obrączki i wyliczoną prędkością.

---

### BR-SKAN-007: Ochrona Przed Podwójnym Zliczeniem Przylotu (Anti-Bouncing Guard)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Gdy gołąb zatrzyma się w lufce, aparat widzi jego obrączkę wielokrotnie przez kilka sekund.
- **Kryteria Akceptacji:**
  - *GIVEN:* Zeskanowanie ptaka o godzinie `11:42:18.100`.
  - *WHEN:* Ten sam ptak pozostaje w kadrze przez kolejne 3 sekundy.
  - *THEN:* System blokuje ponowną rejestrację tego samego ptaka przez okres **$3000\,\text{ms}$** (debouncer per ptak). Pierwszy zarejestrowany timestamp pozostaje święty i nienaruszony.
