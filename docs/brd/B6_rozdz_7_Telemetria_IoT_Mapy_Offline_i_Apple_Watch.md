# Rozdział 7.6: Wymagania Funkcjonalne — Telemetria IoT, Mapy Offline i Apple Watch (B6)
## Pigeon-Fly · Specyfikacja Modułu 6 (BR-TEL)

---

### BR-TEL-001: Apple Watch Companion — Tarcza Gotowości Przylotowej
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P3 (Marek)
- **Opis:** Niezależny ekran na zegarku Apple Watch (watchOS 11+) uruchamiany w trakcie oczekiwania na powrót ptaków z lotu lub treningu.
- **Zawartość Ekranu Zegarka:**
  1. Nazwa trwającego lotu i dystans w kilometrach,
  2. Liczba ptaków w powietrzu (np. *„Oczekiwanych: 18 / 20”*),
  3. Czas trwania lotu od momentu wypuszczenia (`HH:mm:ss`),
  4. Wielki, kontrastowy przycisk: **„SPADŁ PTAK!” (ZAREJESTRUJ PRZYLOT)**.
- **Kryteria Akceptacji:**
  - *GIVEN:* Aktywny lot w aplikacji iPhone'a.
  - *WHEN:* Użytkownik podnosi nadgarstek z zegarkiem Apple Watch.
  - *THEN:* Zegarek natychmiast wyświetla aktualny stan lotu bez opóźnień komunikacyjnych.

---

### BR-TEL-002: 1-Tap Rejestracja Przylotu z Nadgarstka (Apple Watch Instant Clocking)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Hodowca stojący na podwórku widzi ptaka lądującego na dachu gołębnika. Nie musi wyciągać telefonu z kieszeni, odblokowywać ekranu ani szukać ikony aplikacji.
- **Kryteria Akceptacji:**
  - *GIVEN:* Ptak dotyka deski lądowania dachu o `11:42:18.420`.
  - *WHEN:* Hodowca uderza w przycisk „SPADŁ PTAK!” na tarczy Apple Watch.
  - *THEN:*
    1. Zegarek rejestruje lokalny znacznik czasu z dokładnością do ułamka sekundy (`Timestamp: 11:42:18.420`).
    2. Zegarek generuje potężny impuls haptyczny na nadgarstku (`WKHapticType.success`) i dźwięk dzwonka.
    3. Czas zostaje zakolejkowany w `WatchOfflineQueue` i natychmiast przesłany do iPhone'a przez sesję `WCSession`.

---

### BR-TEL-003: Parowanie Czasu z Zegarka z Numerem Obrączki (Fast Pairing)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Po zejściu ptaka z dachu przez lufkę do gołębnika następuje przypisanie zarejestrowanego wcześniej czasu do konkretnego osobnika.
- **Kryteria Akceptacji:**
  - *GIVEN:* Zarejestrowany czas z Apple Watch (`11:42:18`) w poczekalni nieprzypisanych przylotów.
  - *WHEN:* Hodowca wchodzi do gołębnika i skanuje kod QR ptaka `PL-0123-22-3344` (lub wybiera go z listy ptaków w powietrzu).
  - *THEN:* Aplikacja pyta: *„Przypisać czas 11:42:18 z zegarka do ptaka PL-0123-22-3344?”*. Po zatwierdzeniu ptak otrzymuje oficjalny czas przylotu z zegarka, a jego prędkość $m/min$ zostaje przeliczona wstecz.

---

### BR-TEL-004: Współpraca z Miniaturowymi Modułami IoT / GPS / BTS
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P2, P3, P5 (Chen)
- **Opis:** Obsługa ultra-lekkich modułów telemetrycznych montowanych na ogonie lub nodze gołębia (waga modułu $< 3,5\text{ g}$, np. trackery BTS / zgrubny GPS).
- **Format Danych Pakietowych:**
  - Identyfikator wieży telekomunikacyjnej (Cell ID / LAC / MCC / MNC) lub koordynaty GPS ($lat, lon, alt$),
  - Znacznik czasu pakietu,
  - Poziom naładowania mikrobaterii.
- **Kryteria Akceptacji:**
  - *GIVEN:* Ptak powraca do gołębnika z zamontowanym modułem BLE.
  - *WHEN:* Moduł znajdzie się w promieniu 10 metrów od iPhone'a hodowcy.
  - *THEN:* Aplikacja przez CoreBluetooth bezprzewodowo pobiera bufor zarejestrowanych punktów trasy z pamięci flash modułu w czasie $<5\text{ sekund}$.

---

### BR-TEL-005: Wektorowe Mapy Offline i Rekonstrukcja Trasy Przelotu
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P2, P3, P5
- **Opis:** Prezentacja faktycznej trajektorii lotu ptaka na wektorowej mapie topograficznej działającej w 100% offline (pakiety kafelków wektorowych OpenStreetMap / MapLibre bez konieczności połączenia z internetem).
- **Elementy Wizualne:**
  1. *Linia ortodromy (idealna trasa w linii prostej):* Przerywana niebieska linia łącząca punkt startu z gołębnikiem.
  2. *Rzeczywisty ślad lotu ptaka:* Linia ciągła kolorowana gradientem prędkości:
     - Zielony: prędkość optymalna ($>75\text{ km/h}$),
     - Żółty: prędkość umiarkowana ($50–75\text{ km/h}$),
     - Czerwony: drastyczne zwolnienie lub postój na wodopoju / przeczekanie nawałnicy ($<30\text{ km/h}$).
  3. *Wskaźnik zboczenia z kursu (Drift Index):* Maksymalne odchylenie od osi lotu w kilometrach.
- **Kryteria Akceptacji:**
  - *GIVEN:* Zaimportowane 120 punktów trasy z lotu 400 km.
  - *WHEN:* Użytkownik otwiera zakładkę *Analiza Trasy*.
  - *THEN:* Mapa natychmiast renderuje przelot bez pobierania danych z sieci, z możliwością przesuwania suwaka czasu i oglądania animacji lotu ptaka punkt po punkcie.

---

### BR-TEL-006: Ręczny Import Plików GPX / CSV z Obcych Trackerów
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P3, P6
- **Opis:** Możliwość zaimportowania pliku śladu GPS z dowolnego zewnętrznego miniaturowego rejestratora (np. Qstarz, Flymaster, Bad Elf) za pośrednictwem arkusza udostępniania plików iOS.
- **Kryteria Akceptacji:**
  - *GIVEN:* Plik `lot_peine_2026.gpx` w aplikacji Pliki.
  - *WHEN:* Użytkownik wybiera opcję „Otwórz w Pigeon-Fly”.
  - *THEN:* Aplikacja parsuje węzły `<trkpt>`, weryfikuje znaczniki czasu, przypisuje trasę do wybranego gołębia z listy i generuje statystyki przelotu.
