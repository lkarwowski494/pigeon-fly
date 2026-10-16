# Rozdział 7.1: Wymagania Funkcjonalne — Cyfrowy Notes Gołębnika i Kartoteka Stada (B1)
## Pigeon-Fly · Specyfikacja Modułu 1 (BR-STADO)

---

### BR-STADO-001: Unikalna Rejestracja Oficjalnej Obrączki Rodowej
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P2 (Luc)
- **Opis:** System umożliwia dodanie do bazy ptaka z jego oficjalnym, unikalnym numerem obrączki stałej (rodowej) wydanej przez krajowy związek (np. PZHGP, KBDB, Verband, FCI).
- **Format Kanoniczny:** `[Kraj]-[Oddział]-[Rok]-[Numer]` (np. `PL-0123-26-12345` lub `BE-22-6021444`).
- **Kryteria Akceptacji:**
  - *GIVEN:* Użytkownik znajduje się na formularzu dodawania gołębia.
  - *WHEN:* Wpisuje numer obrączki `PL-0123-26-00123` i wybiera rok urodzenia `2026`.
  - *THEN:* System weryfikuje brak duplikatu w bazie SQLite oraz w Supabase (indeks `UNIQUE(country_code, year, ring_number)` per gołębnik). Jeśli numer już istnieje, wyświetla czytelne ostrzeżenie i uniemożliwia nadpisanie.

---

### BR-STADO-002: Numery Pomocnicze i Znaczniki Kolorystyczne
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław)
- **Opis:** Poza obrączką rodową hodowcy stosują na drugiej nodze obrączki pomocnicze (kolorowe znaczniki plastikowe, obrączki gumowe na loty, chipy elektroniczne).
- **Kryteria Akceptacji:**
  - *GIVEN:* Karta ptaka w trybie edycji.
  - *WHEN:* Użytkownik wprowadza numer pomocniczy (np. `GUM-42` lub kod transpondera chipa) oraz wybiera kolor znacznika z palety (czerwony, żółty, niebieski, zielony, biały).
  - *THEN:* W widoku listy stada obok numeru rodowego wyświetla się kolorowy piktogram obrączki pomocniczej ułatwiający natychmiastowe rozpoznanie ptaka na grzędzie.

---

### BR-STADO-003: Kartoteka Cech Fenotypowych i Barw Upierzenia
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4 (Hans)
- **Opis:** Rejestracja płci oraz standardowej barwy upierzenia według międzynarodowej klasyfikacji FCI.
- **Kanon Barw (12 typów):** Niebieska (Groszkowa), Niebieska z pasami, Nakrapiana (Ciemnonakrapiana), Czarna, Płowa (Czerwona), Czerwona nakrapiana, Szpakowata, Biała, Szekata (Pstra), Ciemna, Izabelowata, Mączna.
- **Kryteria Akceptacji:**
  - *GIVEN:* Formularz ptaka.
  - *WHEN:* Użytkownik wybiera płeć (Samiec $\mars$ / Samica $\venus$) oraz maść ze słownika.
  - *THEN:* Karta ptaka otrzymuje odpowiednią ikonę płci i oznaczenie barwne, a formularz kojarzeń uniemożliwia sparowanie dwóch samców lub dwóch samic.

---

### BR-STADO-004: Pełny Cykl Statusów Życiowych Ptaka
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P2
- **Opis:** Każdy gołąb w stadzie posiada ściśle zdefiniowany status operacyjny:
  1. `ROZPLODOWY` (sektor rozpłodu, ptaki do rozrodu),
  2. `LOTOWY` (drużyna lotowa dorosłych),
  3. `MLODY` (gołębnik młodych, tegoroczne przychówki),
  4. `W_GNIEZDZIE` (nielotne pisklęta pod opieką rodziców),
  5. `SPRZEDANY` (ptak przekazany innemu hodowcy, zachowany w historii genealogicznej),
  6. `ZAGINIONY` (nie powrócił z lotu/treningu),
  7. `ZSZEDL` (padł naturalnie lub drapieżnik, zachowany w rodowodach).
- **Kryteria Akceptacji:**
  - *GIVEN:* Gołąb ze statusem `LOTOWY`.
  - *WHEN:* Hodowca oznacza ptaka jako `SPRZEDANY` (podając datę i opcjonalnie nazwisko nabywcy).
  - *THEN:* Ptak znika z list wkładaniowych na loty, ale jego rekord w bazie SQLite i w Supabase pozostaje nienaruszony, a wszystkie drzewa genealogiczne jego potomków zachowują pełną ciągłość.

---

### BR-STADO-005: Przedziały Gołębnika i Przypisanie do Celi Gniazdowej
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław)
- **Opis:** Gołębnik dzieli się na fizyczne przedziały (Wdowce, Wdówki, Rozpłodowy, Młode). W przedziałach znajdują się ponumerowane cele gniazdowe (boxy).
- **Kryteria Akceptacji:**
  - *GIVEN:* Karta gołębia.
  - *WHEN:* Użytkownik wybiera przedział *Rozpłodowy* i celę nr *14*.
  - *THEN:* System sprawdza, czy w celi nr 14 nie ma już przypisanej innej obcej pary. W widoku *Plan Cel* użytkownik widzi schemat klatkowy z obsadzonymi celami.

---

### BR-STADO-006: Lokalna i Chmurowa Galeria Zdjęć (Sylwetka, Oko Makro, Skrzydło)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P2 (Luc), P5 (Chen)
- **Opis:** Możliwość wykonania i przypisania do karty ptaka 3 dedykowanych fotografii o wysokiej rozdzielczości:
  1. *Zdjęcie sylwetki:* Profil ptaka stojącego na spoczynku.
  2. *Zdjęcie makro oka (Eye-Sign):* Zbliżenie tęczówki, źrenicy i pierścienia adaptacyjnego.
  3. *Zdjęcie rozpostartego skrzydła:* Układ 10 lotek I rzędu i pokryw.
- **Kryteria Akceptacji:**
  - *GIVEN:* Widok profilu ptaka.
  - *WHEN:* Hodowca robi zdjęcie aparatem iPhone'a.
  - *THEN:* Obraz zostaje skompresowany lokalnie do formatu JPEG (jakość 0.8, maks. 1600x1200 px) i zapisany w piaskownicy `/Library/Application Support/Photos/[UUID].jpg`.
  - *THEN (Wersja PRO):* Plik asynchronicznie replikuje się do **Supabase Storage Bucket `loft-photos`** z prawem dostępu chronionym przez RLS.

---

### BR-STADO-007: Ocena Anatomiczna i Cechy Budowy Mistrzowskiej
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P2
- **Opis:** Narzędzie oceny cech fizycznych ptaka oparte na tradycyjnej selekcji manualnej mistrzów (widełki miednicy, grzebień mostka, elastyczność upierzenia).
- **Kryteria Akceptacji:**
  - *GIVEN:* Karta oceny ptaka.
  - *WHEN:* Hodowca zaznacza wskaźniki anatomiczne w skali 1–5 gwiazdek.
  - *THEN:* Profil ptaka generuje zagregowany „Indeks Budowy”, wyświetlany na karcie i uwzględniany przy rekomendacjach selekcyjnych.

---

### BR-STADO-008: Błyskawiczne Wyszukiwanie i Inteligentne Filtrowanie Stada
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P4
- **Opis:** Wyszukiwarka działająca w czasie $<5\text{ ms}$ na lokalnej bazie SQLite.
- **Kryteria Akceptacji:**
  - *GIVEN:* Lista stada licząca 250 gołębi.
  - *WHEN:* Użytkownik wpisuje w polu wyszukiwania ostatnie 3 cyfry obrączki (np. `444`).
  - *THEN:* Lista natychmiast filtruje się do ptaków zawierających `444` w numerze rodowym lub pomocniczym.

---

### BR-STADO-009: Multi-Device Sync i Asynchroniczna Replikacja Supabase
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P3, P9 (Tandem)
- **Opis:** Automatyczna replikacja stada między urządzeniami tego samego hodowcy (iPhone w gołębniku, iPad w domu, Mac w biurze) za pośrednictwem chmury Supabase.
- **Kryteria Akceptacji:**
  - *GIVEN:* Zalogowany użytkownik w wersji PRO na iPhone i iPadzie.
  - *WHEN:* Na iPhone dodaje nowego gołębia w gołębniku offline.
  - *WHEN:* Telefon odzyskuje połączenie z internetem.
  - *THEN:* Rekord ptaka replikuje się do tabeli `birds` w Supabase, a iPad w domu otrzymuje aktualizację przez WebSocket Realtime w czasie $<1\text{ s}$ bez konieczności ręcznego odświeżania.

---

### BR-STADO-010: Central Bloodline Registry (Wyszukiwarka Przodków w Chmurze)
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P2 (Luc), P6 (Tomek)
- **Opis:** Globalna baza publicznych rodowodów w Supabase. Gdy hodowca kupuje ptaka ze znanym numerem obrączki (np. `BE-22-6021444`), nie musi ręcznie przepisywać 30 przodków z kartki.
- **Kryteria Akceptacji:**
  - *GIVEN:* Formularz rejestracji zakupionego ptaka.
  - *WHEN:* Użytkownik klika „Pobierz z Centralnej Bazy Rodowodów”.
  - *THEN:* Aplikacja odpytuje Supabase i jeśli dany ptak lub jego przodkowie zostali wcześniej zarejestrowani jako publiczni przez hodowlę macierzystą, całe drzewo genealogiczne zostaje zaimportowane 1 tapnięciem.
