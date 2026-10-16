# Rozdział 7.2: Wymagania Funkcjonalne — Rodowody, Inbred Wrighta i Generator PDF (B2)
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
- **Opis:** Silnik bazy danych potrafi w czasie $<30\,\text{ms}$ zrekonstruować pełne drzewo przodków ptaka do 5 pokoleń (łącznie do 62 bezpośrednich przodków: 2 rodziców, 4 dziadków, 8 pradziadków, 16 prapradziadków, 32 praprapradziadków).
- **Kryteria Akceptacji:**
  - *GIVEN:* Ptak z zarejestrowaną wielopokoleniową historią.
  - *WHEN:* Użytkownik otwiera widok *Drzewo Genealogiczne*.
  - *THEN:* Interfejs renderuje interaktywny, przewijalny wykres drzewa z podziałem na gałęzie ojcowskie (górna połowa) i matczyne (dolna połowa), z możliwością kliknięcia w dowolnego przodka i przejścia do jego karty.

---

### BR-ROD-003: Algorytm Obliczania Współczynnika Inbredu Wrighta ($F$)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P3 (Marek)
- **Opis:** Deterministyczne wyliczanie współczynnika inbredu Sewalla Wrighta ($F$) dla każdego ptaka na podstawie analizy wspólnych przodków po stronie ojca i matki.
- **Formuła Matematyczna:**
  $$F_X = \sum_{A} \left( \frac{1}{2} \right)^{n_1 + n_2 + 1} (1 + F_A)$$
  gdzie:
  - $A$ to wspólny przodek ojca i matki,
  - $n_1$ to liczba pokoleń od ojca do wspólnego przodka $A$,
  - $n_2$ to liczba pokoleń od matki do wspólnego przodka $A$,
  - $F_A$ to współczynnik inbredu samego przodka $A$.
- **Kryteria Akceptacji:**
  - *GIVEN:* Kojarzenie pełnego rodzeństwa (brat x siostra o niespokrewnionych rodzicach).
  - *WHEN:* System wylicza współczynnik inbredu potomstwa.
  - *THEN:* Wynik wynosi dokładnie **$F = 25,0\%$** ($0,2500$).
  - *GIVEN:* Kojarzenie półrodzeństwa (wspólny ojciec, dwie różne matki).
  - *WHEN:* System wylicza inbred potomstwa.
  - *THEN:* Wynik wynosi dokładnie **$F = 12,5\%$** ($0,1250$).
  - *THEN:* Wartość wyświetla się z kolorowym oznaczeniem ryzyka genetycznego:
    - Zielony ($0,0\% \le F < 6,25\%$ — outcross / bezpieczny),
    - Żółty ($6,25\% \le F < 12,5\%$ — umiarkowany inbred liniowy),
    - Pomarańczowy ($12,5\% \le F \le 25,0\%$ — bliski inbred hodowlany),
    - Czerwony ($F > 25,0\%$ — skrajny inbred kazirodczy z ostrzeżeniem o możliwej depresji inbredowej).

---

### BR-ROD-004: Wirtualny Pokój Kojarzeń (Virtual Mating Room)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2, P3
- **Opis:** Narzędzie symulacji par hodowlanych przed fizycznym wpuszczeniem ptaków do cel lęgowych.
- **Kryteria Akceptacji:**
  - *GIVEN:* Użytkownik wybiera z listy dowolnego samca i dowolną samicę.
  - *WHEN:* Klika „Symuluj Skojarzenie”.
  - *THEN:* Ekran w czasie rzeczywistym prezentuje:
    1. Hipotetyczny współczynnik inbredu $F$ przyszłego potomstwa.
    2. Listę wspólnych przodków (np. *„Samiec B-15-6021444 pojawia się 3 razy w rodowodzie”*).
    3. Prawdopodobieństwo dziedziczenia barwy upierzenia (zgodnie z genetyką krzyżówek gołębi).
    4. Przycisk „Zatwierdź Parę i Przypisz Celę”.

---

### BR-ROD-005: Generator Wystawowych Rodowodów PDF A4 (Format PIPA / Międzynarodowy)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P5 (Chen)
- **Opis:** Moduł generowania profesjonalnych, wektorowych dokumentów PDF w standardzie A4 Landscape (poziomym), powszechnie stosowanym na międzynarodowych aukcjach gołębi (np. PIPA, De Duif).
- **Elementy Składowe Dokumentu PDF:**
  1. **Nagłówek:** Nazwa gołębnika / hodowli (np. *„Loft Karwowski — Racing Pigeons”*), logotyp/herb hodowcy, adres, telefon, e-mail.
  2. **Karta Główna Ptaka:** Numer obrączki (duży font), płeć, maść, rok, nazwa własna (np. *„Szybki Błękit”*), współczynnik inbredu $F$.
  3. **Zdjęcia Wbudowane:** Zdjęcie sylwetki (lewy panel), zdjęcie oka makro Eye-Sign (okrągłe pole z ramką), zdjęcie rozpostartego skrzydła.
  4. **Drzewo 4 Pokoleń:**
     - Pokolenie 1: Ojciec i Matka (pełny opis, numery obrączek, osiągnięcia lotowe).
     - Pokolenie 2: 4 Dziadków.
     - Pokolenie 3: 8 Pradziadków.
     - Pokolenie 4: 16 Prapradziadków (numery obrączek i szczepy).
  5. **Stopka:** Data wygenerowania dokumentu, unikalny kod weryfikacyjny dokumentu i pole na odręczny podpis hodowcy.
- **Kryteria Akceptacji:**
  - *GIVEN:* Profil gołębia z kompletem danych i zdjęć.
  - *WHEN:* Użytkownik klika „Generuj Rodowód PDF”.
  - *THEN:* W czasie $<500\,\text{ms}$ na iPhone powstaje plik PDF o nieskazitelnej jakości wektorowej (teksty ostre przy dowolnym powiększeniu, zdjęcia zoptymalizowane w 300 DPI do druku).
  - *GIVEN:* Użytkownik w darmowym Free Tierze.
  - *WHEN:* Generuje rodowód.
  - *THEN:* Dokument zawiera półprzezroczysty znak wodny *„Wygenerowano w Pigeon-Fly Free”*. W wersji PRO znak wodny jest usuwany, a dokument zyskuje certyfikat czystości wydruku.

---

### BR-ROD-006: Bezpośredni Druk AirPrint i Udostępnianie
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2
- **Opis:** Bezpośrednia integracja z systemowym arkuszem udostępniania iOS (`UIActivityViewController`).
- **Kryteria Akceptacji:**
  - *GIVEN:* Wygenerowany podgląd rodowodu PDF.
  - *WHEN:* Użytkownik klika ikonę udostępniania.
  - *THEN:* Może natychmiast wydrukować dokument na bezprzewodowej drukarce domowej AirPrint, wysłać plik PDF przez aplikację Wiadomości / WhatsApp lub zapisać w chmurze iCloud Drive.
