# Rozdział 7.4: Wymagania Funkcjonalne — Treningi, Loty i Kalkulator Prędkości m/min (B4)
## Pigeon-Fly · Specyfikacja Modułu 4 (BR-LOT)

---

### BR-LOT-001: Konfiguracja Zawodów i Treningów Wywózkowych
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P3 (Marek)
- **Opis:** Definiowanie sesji lotowej z precyzyjnymi parametrami startowymi.
- **Pola Danych Lotu:**
  - Nazwa stacji / punktu wypuszczenia (np. *„Pyrzyce”*, *„Peine”*, *„Bruksela”*),
  - Typ: *Trening Prywatny* lub *Oficjalny Lot Konkursowy*,
  - Kategoria lotu FCI: *A (Sprint: 100–400 km)*, *B (Średni: 300–600 km)*, *C (Długi: 500–800 km)*, *M (Maraton: >700 km)*,
  - Data i dokładny czas wypuszczenia stada (np. `2026-06-14 06:15:00`),
  - Współrzędne GPS stacji wypuszczenia (Szerokość / Długość geograficzna z mapy lub wpisane ręcznie).
- **Kryteria Akceptacji:**
  - *GIVEN:* Ekran tworzenia lotu.
  - *WHEN:* Użytkownik podaje czas startu `06:30:00` i wybiera stację wypuszczenia.
  - *THEN:* Lot przechodzi w status `W_TOKU`, a aplikacja uruchamia zegar czasu lotu odliczający w czasie rzeczywistym.

---

### BR-LOT-002: Geodezyjny Pomiary Dystansu (Vincenty WGS-84 & Haversine)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2 (Luc)
- **Opis:** Precyzyjne obliczenie odległości w linii prostej (ortodromy) pomiędzy punktem wypuszczenia a współrzędnymi gołębnika.
- **Algorytm:** Równania elipsoidalne Vincenty'ego na elipsoidzie WGS-84 z dokładnością do $1\text{ mm}$ (zabezpieczone fallbackiem Haversine'a).
- **Kryteria Akceptacji:**
  - *GIVEN:* Gołębnik w Poznaniu ($52^\circ 24' 30''\text{ N}, 16^\circ 55' 02''\text{ E}$) i punkt wypuszczenia w Berlinie ($52^\circ 31' 12''\text{ N}, 13^\circ 24' 18''\text{ E}$).
  - *WHEN:* Aplikacja przelicza dystans.
  - *THEN:* Wynik wynosi dokładnie $238\,845\text{ metrów} \pm 2\text{ m}$.
  - *GIVEN:* Hodowca posiadający urzędowy pomiar oddziałowy PZHGP.
  - *WHEN:* Wpisuje w pole „Oficjalny dystans gołębnika” wartość $238\,850\text{ m}$.
  - *THEN:* Wartość urzędowa staje się wartością nadrzędną dla wszystkich oficjalnych wyliczeń prędkości.

---

### BR-LOT-003: Automatyczny Kalkulator Prędkości w Czasie Rzeczywistym ($m/min$)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P4
- **Opis:** Zgodnie z oficjalnym kanonem sportu gołębiarskiego na całym świecie, prędkość lotu wyrażana jest w **metrach na minutę ($m/min$)** z dokładnością do drugiego lub trzeciego miejsca po przecinku.
- **Formuła Matematyczna:**
  $$v = \frac{\text{Dystans [metry]}}{\text{Czas Lotu [minuty]}} = \frac{d}{T_{przylot} - T_{start}}$$
  gdzie czas w minutach liczony jest z uwzględnieniem sekund:
  $$\text{Czas [min]} = (godziny \times 60) + minuty + \frac{sekundy}{60}$$
- **Wektor Testowy:**
  - Dystans: $392\,450\text{ m}$,
  - Czas startu: `06:30:00`,
  - Czas przylotu: `11:42:18`,
  - Czas lotu: $5\text{ h } 12\text{ min } 18\text{ s} = 312\text{ min } 18\text{ s} = 312,3\text{ min}$.
  - Prędkość:
    $$v = \frac{392\,450}{312,3} = 1256,644\text{ m/min}$$
- **Kryteria Akceptacji:**
  - *GIVEN:* Trwający lot z dystansem $392\,450\text{ m}$.
  - *WHEN:* Zostaje zarejestrowany przylot o godzinie `11:42:18`.
  - *THEN:* Aplikacja w czasie $<1\,\text{ms}$ wyświetla prędkość **$1256,64\text{ m/min}$**.

---

### BR-LOT-004: Dynamiczny Ranking Przylotów w Gołębniku (Live Loft Leaderboard)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3, P8
- **Opis:** Po każdym przylocie ptaka tabela wyników aktualizuje się automatycznie.
- **Struktura Rankingu:**
  1. Pozycja w gołębniku (1., 2., 3. itd.),
  2. Numer obrączki i nazwa ptaka,
  3. Czas przylotu (`HH:mm:ss`),
  4. Czas trwania lotu,
  5. Prędkość w $m/min$,
  6. Strata czasowa i prędkościowa do pierwszego zameldowanego ptaka (lidera stada).
- **Kryteria Akceptacji:**
  - *GIVEN:* 5 zameldowanych ptaków.
  - *WHEN:* Przylatuje 6. ptak.
  - *THEN:* Tabela sortuje się rosnąco wg czasu przylotu (malejąco wg $m/min$), a nowy rekord podświetla się animacją.

---

### BR-LOT-005: Automatyczna Neutralizacja Nocna w Maratonach (Overnight Neutralization)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3 (Marek)
- **Opis:** W lotach dalekodystansowych trwających dłużej niż jeden dzień (maratonach pow. 700 km), godziny nocne są urzędowo wyłączone z czasu lotu.
- **Reguła FCI:** Czas zatrzymany 30 minut po zachodzie słońca w dniu wypuszczenia; wznowiony 30 minut przed wschodem słońca w dniu kolejnym.
- **Kryteria Akceptacji:**
  - *GIVEN:* Lot maratoński wypuszczony w piątek o `06:00`.
  - *GIVEN:* Czas neutralizacji nocnej zdefiniowany od `22:30` w piątek do `04:30` w sobotę ($6\text{ godzin} = 360\text{ minut}$).
  - *WHEN:* Ptak melduje się w gołębniku w sobotę o godzinie `07:30:00`.
  - *THEN:* Całkowity czas zegarowy to $25,5\text{ h}$. Czas lotu do kalkulacji $m/min$ wynosi:
    $$T_{efektywny} = 25,5\text{ h} - 6,0\text{ h} = 19,5\text{ h} = 1170\text{ minut}$$
    Prędkość wyliczana jest wyłącznie z uwzględnieniem $1170\text{ minut}$.

---

### BR-LOT-006: Wektor Znosu Wiatru i Korekta Aerodynamiczna (Aero Speed)
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P3 (Marek)
- **Opis:** Rozłożenie wektora wiatru na azymut trasy przelotu:
  - Składowa czołowa / plecowa: $V_{w\_parallel} = V_w \cos(\theta_{wiatr} - \theta_{trasa})$
  - Kąt znosu bocznego (drift angle): $\beta = \arcsin\left( \frac{V_w \sin(\theta_{wiatr} - \theta_{trasa})}{V_{ptak}} \right)$
- **Kryteria Akceptacji:**
  - *GIVEN:* Lot pod silny wiatr czołowy $30\text{ km/h}$, prędkość surowa $1050\text{ m/min}$.
  - *WHEN:* Użytkownik włącza analizę aerodynamiczną.
  - *THEN:* Aplikacja wykazuje, że ptak wykonał pracę fizyczną odpowiadającą $1420\text{ m/min}$ w warunkach ciszy wiatrowej.

---

### BR-LOT-007: Asystent Dnia Koszowania i Lista Wkładaniowa
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P8 (Andrzej)
- **Opis:** Narzędzie przygotowania drużyny przed wyjazdem do punktu wkładań oddziału:
  - Wybór ptaków z listy stada,
  - Oznaczenie ptaków typowanych do serii (np. 1–5 na liście wkładaniowej),
  - Weryfikacja gotowości: alert, jeśli ptak ma zrzuconą 8. lub 9. lotkę lub jest w trakcie karencji weterynaryjnej,
  - Eksport oficjalnej listy wkładaniowej do pliku PDF/CSV.
