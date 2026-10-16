# Rejestr Sprzeczności, Errata i Rozstrzygnięcia Regulaminowe (00c)
## Pigeon-Fly · Standard Zgodności Dziedzinowej

> **Cel dokumentu:** Identyfikacja pozornych i rzeczywistych sprzeczności pomiędzy zwyczajami hodowców a regulaminami oficjalnymi (FCI, PZHGP, KBDB), ograniczeniami technologicznymi platformy iOS oraz przyjęcie jednoznacznych rozstrzygnięć inżynierskich.

---

### SPRZ-01: Czas Przylotu w Zegarach Elektronicznych (ESK) vs Aparat w Telefonie
- **Sprzeczność:** Oficjalne zawody PZHGP/FCI wymagają plombowanych zegarów elektronicznych (np. Benzing, Tauris, Bricon, Mega) z antenami RFID. Czy Pigeon-Fly ma zastąpić oficjalny zegar ESK na liście konkursowej?
- **Rozstrzygnięcie:** **NIE.** Pigeon-Fly jest cyfrowym notesem mistrza, asystentem hodowcy i niezależnym systemem kontroli stada. Zeskanowanie kodu QR w lufce służy do prywatnego, błyskawicznego pomiaru prędkości, analizy formy, weryfikacji powrotów i treningów prywatnych. W opisie App Store i dokumentacji jasno komunikujemy: *„Aplikacja służy do prywatnej ewidencji hodowlanej, treningów i analizy prędkości w czasie rzeczywistym; oficjalne zawody związkowe podlegają regulaminom macierzystych federacji.”*

---

### SPRZ-02: Formuła Odległości Geodezyjnej: Płaska Ziemia vs Sfera vs Elipsoida
- **Sprzeczność:** Starsze kalkulatory związkowe stosowały uproszczoną siatkę kilometrową lub wzór Haversine'a. Nowoczesne systemy FCI wymagają elipsoidy WGS-84 (Vincenty).
- **Rozstrzygnięcie:** Aplikacja domyślnie stosuje formułę **Vincenty'ego (WGS-84)**. W ustawieniach lotu hodowca może również wpisać **oficjalny urzędowy kilometraż gołębnika** (tzw. pomiar związkowy z dokładnością do 1 metra), który staje się nadrzędną wartością bazową dla wyliczenia $m/min$.

---

### SPRZ-03: Czas Neutralizacji Nocnej (Początek i Koniec Zmierzchu)
- **Sprzeczność:** W lotach dalekodystansowych (maratonach) PZHGP stosuje czasami stałe godziny neutralizacji (np. 22:00 – 04:30), podczas gdy regulamin FCI opiera się na astronomicznym zachodzie i wschodzie słońca $\pm 30\text{ minut}$ dla danej szerokości geograficznej.
- **Rozstrzygnięcie:** W module lotu wprowadzamy przełącznik:
  1. *Tryb Astronomiczny FCI:* Automatyczne wyliczenie czasu zachodu i wschodu słońca na podstawie współrzędnych gołębnika (obliczenia offline wg równań solarnych NOAA).
  2. *Tryb Ręczny Związkowy:* Hodowca wpisuje dokładne godziny neutralizacji podane w komunikacie komisji lotowej oddziału.

---

### SPRZ-04: Numeracja Lotek w Skrzydle (Od Środka na Zewnątrz vs Od Zewnątrz do Środka)
- **Sprzeczność:** Hodowcy z Europy Wschodniej i Zachodniej numerują 10 lotek I rzędu od wewnątrz (od lotki 1. graniczącej z lotkami II rzędu) na zewnątrz (lotka 10. zewnętrzna, najdłuższa). Niektóre publikacje ornitologiczne stosują odwrotną numerację descendentną.
- **Rozstrzygnięcie:** Aplikacja ściśle przyjmuje **kanon hodowlany**:
  - **Lotka 1:** Pierwsza zrzucana na wiosnę (najbardziej wewnętrzna).
  - **Lotka 10:** Ostatnia zrzucana na jesień (skrajna zewnętrzna pióro nośne).

---

### SPRZ-05: Współczynnik Inbredu Wrighta ($F$): Rodowody Niepełne
- **Sprzeczność:** Tradycyjne rodowody papierowe często urywają się na 3. lub 4. pokoleniu z adnotacją „nieznany” lub „oryg. Janssen”. Brak danych przodków uniemożliwia pełne domknięcie wzoru Wrighta.
- **Rozstrzygnięcie:** Algorytm inbredu traktuje każdego nieznanego przodka jako osobnika niespokrewnionego ($F=0$). Wyliczony współczynnik opatrzony jest etykietą: *„Współczynnik F obliczony na podstawie X kompletnych pokoleń (minimalna wartość inbredu)”*.

---

### SPRZ-06: Prywatność Położenia Gołębnika (Zagrożenie Kradzieżą Cennego Stada)
- **Sprzeczność:** Elitarne gołębie pocztowe osiągają na aukcjach zawrotne kwoty (od kilkunastu tysięcy do nawet 1,6 mln EUR za ptaka). Hodowcy panicznie boją się wycieku lokalizacji gołębnika.
- **Rozstrzygnięcie:** Bezwzględna zasada **Data Not Collected**. Współrzędne GPS gołębnika nigdy nie są transmitowane przez sieć, nie są zapisywane w plikach telemetrycznych, a kopia zapasowa w pliku jest szyfrowana kluczem lokalnym urządzenia użytkownika.
