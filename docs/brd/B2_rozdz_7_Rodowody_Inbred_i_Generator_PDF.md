# Rozdział 7.2: Wymagania Funkcjonalne — Rodowody, Inbred Wrighta, Generator PDF i Weryfikacja Chmurowa (B2)
## Pigeon-Fly · Specyfikacja Modułu 2 (BR-ROD)

---

### BR-ROD-001: Relacje Genealogiczne i Walidacja Spójności Drzewa
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P2 (Luc)
- **Opis:** System umożliwia przypisanie każdemu gołębiowi Ojca (`sire_id`) oraz Matki (`dam_id`).
- **Kryteria Akceptacji:**
  - *GIVEN:* Formularz edycji rodowodu ptaka $P$.
  - *WHEN:* Użytkownik wybiera ojca i matkę.
  - *THEN:* System sprawdza niezmienniki:
    1. Ojciec musi być zarejestrowany jako samiec ($\mars$).
    2. Matka musi być zarejestrowana jako samica ($\venus$).
    3. Rok urodzenia rodziców nie może być późniejszy niż rok urodzenia ptaka $P$ ($rok_{rodzic} \le rok_P$).
    4. Brak cykli rekurencyjnych (ptak nie może być własnym przodkiem — detekcja pętli grafu skierowanego DAG).

---

### BR-ROD-002: Rekurencyjny Silnik Genealogiczny do 5 Pokoleń w Głąb
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2, P5 (Chen)
- **Opis:** Silnik bazy danych potrafi w czasie $<30\,\text{ms}$ zrekonstruować pełne drzewo przodków ptaka do 5 pokoleń (łącznie do 62 bezpośrednich przodków).
- **Kryteria Akceptacji:**
  - *GIVEN:* Ptak z zarejestrowaną wielopokoleniową historią.
  - *WHEN:* Użytkownik otwiera widok *Drzewo Genealogiczne*.
  - *THEN:* Interfejs renderuje interaktywny, przewijalny wykres drzewa z podziałem na gałęzie ojcowskie i matczyne, z możliwością przejścia do karty dowolnego przodka.

---

### BR-ROD-003: Algorytm Obliczania Współczynnika Inbredu Wrighta ($F$)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P3 (Marek)
- **Opis:** Deterministyczne wyliczanie współczynnika inbredu Sewalla Wrighta ($F$) dla każdego ptaka na podstawie analizy wspólnych przodków po stronie ojca i matki.
- **Formuła Matematyczna:**
  $$F_X = \sum_{A} \left( \frac{1}{2} \right)^{n_1 + n_2 + 1} (1 + F_A)$$
- **Kryteria Akceptacji:**
  - *GIVEN:* Kojarzenie pełnego rodzeństwa (brat x siostra o niespokrewnionych rodzicach).
  - *WHEN:* System wylicza współczynnik inbredu potomstwa.
  - *THEN:* Wynik wynosi dokładnie **$F = 25,0\%$** ($0,2500$).
  - *THEN:* Wartość wyświetla się z kolorowym oznaczeniem ryzyka (Zielony $<6,25\%$, Żółty $6,25–12,5\%$, Pomarańczowy $12,5–25\%$, Czerwony $>25\%$).

---

### BR-ROD-004: Wirtualny Pokój Kojarzeń (Virtual Mating Room)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2, P3
- **Opis:** Narzędzie symulacji par hodowlanych przed fizycznym wpuszczeniem ptaków do cel lęgowych.
- **Kryteria Akceptacji:**
  - *GIVEN:* Użytkownik wybiera z listy dowolnego samca i dowolną samicę.
  - *WHEN:* Klika „Symuluj Skojarzenie”.
  - *THEN:* Ekran w czasie rzeczywistym prezentuje:
    1. Hipotetyczny współczynnik inbredu $F$ przyszłego potomstwa.
    2. Listę wspólnych przodków.
    3. Prawdopodobieństwo dziedziczenia barwy upierzenia.
    4. Przycisk „Zatwierdź Parę i Przypisz Celę”.

---

### BR-ROD-005: Generator Wystawowych Rodowodów PDF A4 (Format PIPA)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P5 (Chen)
- **Opis:** Moduł generowania wektorowych dokumentów PDF w standardzie A4 Landscape z 4 pokoleniami przodków, zdjęciem sylwetki, makro oka i skrzydła.
- **Kryteria Akceptacji:**
  - *GIVEN:* Profil gołębia z kompletem danych i zdjęć.
  - *WHEN:* Użytkownik klika „Generuj Rodowód PDF”.
  - *THEN:* W czasie $<500\,\text{ms}$ powstaje plik PDF o jakości wektorowej 300 DPI, gotowy do druku AirPrint lub eksportu.

---

### BR-ROD-006: Bezpośredni Druk AirPrint i Udostępnianie
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2
- **Opis:** Integracja z systemowym arkuszem udostępniania iOS (`UIActivityViewController`).

---

### BR-ROD-007: Zweryfikowany Cyfrowy Paszport Rodowodu (Anti-Counterfeit Portal w Supabase)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P5 (Chen)
- **Opis:** Ochrona przed fałszerstwami rodowodów przy międzynarodowych transferach i aukcjach (np. Chiny, Tajwan, Rumunia).
- **Mechanizm Działania:**
  1. Przy generowaniu rodowodu aplikacja oblicza skrót kryptograficzny **SHA-256** z danych ptaka, unikalnych numerów przodków i daty wydania.
  2. W tabeli `verified_pedigrees` w Supabase publikowany jest rekord certyfikatu z unikalnym tokenem publicznym (UUIDv4).
  3. Na wygenerowanym dokumencie PDF A4 (w prawym dolnym rogu) umieszczany jest oficjalny kod QR oraz czytelny link:
     ```
     https://pigeonfly.app/pedigree/[TOKEN_UUID]
     ```
  4. Kupiec z dowolnego miejsca na świecie skanuje kod QR aparatem swojego telefonu.
  5. Przeglądarka otwiera publiczny portal weryfikacyjny z certyfikatem autentyczności: potwierdza nazwę hodowli wystawcy, status ptaka, kompletne drzewo 4 pokoleń oraz oryginalne zdjęcia 4K oka i skrzydła hostowane w Supabase Storage CDN.
- **Kryteria Akceptacji:**
  - *GIVEN:* Rodowód wygenerowany w wersji PRO.
  - *WHEN:* Kupiec skanuje kod QR z wydrukowanej kartki papieru.
  - *THEN:* W przeglądarce telefonu otwiera się strona ze stemplem *„Zweryfikowany Cyfrowy Rodowód Pigeon-Fly — Certyfikat Autentyczny”*. Jakakolwiek próba sfałszowania danych na papierze (np. zmiana numeru przodka) jest natychmiast demaskowana przez rozbieżność z bazą w chmurze Supabase.
