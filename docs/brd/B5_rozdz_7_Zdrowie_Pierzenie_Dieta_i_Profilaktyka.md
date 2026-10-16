# Rozdział 7.5: Wymagania Funkcjonalne — Zdrowie, Pierzenie, Dieta i Profilaktyka (B5)
## Pigeon-Fly · Specyfikacja Modułu 5 (BR-ZDR)

---

### BR-ZDR-001: Wizualna Karta Skrzydła i Monitor 10 Lotek I Rzędu
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1 (Stanisław), P3 (Marek)
- **Opis:** Interaktywny diagram wektorowy skrzydła gołębia, obrazujący 10 lotek I rzędu (od wewnątrz: lotka 1 do skrajnej zewnętrznej: lotka 10) oraz 10 lotek II rzędu i 12 sterówek ogona.
- **Stany Pojedynczej Lotki:**
  1. `PELNA` (pióro dojrzałe, obecne),
  2. `WYPADLA` (luka w skrzydle, pusta torebka piórowa),
  3. `ODRASTA_1_4` (odrost do 25% długości),
  4. `ODRASTA_1_2` (odrost do 50% długości — tzw. „krwawa pałka”, pióro silnie unaczynione, zakaz ucisku!),
  5. `ODRASTA_3_4` (odrost do 75% długości).
- **Kryteria Akceptacji:**
  - *GIVEN:* Karta skrzydła wybranego gołębia.
  - *WHEN:* Hodowca klika w lotkę nr 7 i oznacza stan *Wypadła*, a w lotkę nr 6 *Odrasta 1/2*.
  - *THEN:* Skrzydło graficznie odzwierciedla lukę, data zmiany zostaje zapisana w historii pierzenia ptaka, a system aktualizuje Wskaźnik Gotowości Aerodynamicznej (ARI).

---

### BR-ZDR-002: Wskaźnik Gotowości Aerodynamicznej Skrzydła (ARI Index)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Lotki 8, 9 i 10 to tzw. lotki napędowe i nośne (odpowiadają za 70% siły nośnej i ciągu przy locie pod wiatr). Zrzucenie dwóch sąsiednich lotek skrajnych drastycznie zaburza opływ powietrza i może doprowadzić do załamania formy lub zerwania wiązadeł skrzydła.
- **Kryteria Akceptacji:**
  - *GIVEN:* Gołąb ze zrzuconą 8. lotką lub odrastającą „krwawą pałką”.
  - *WHEN:* Hodowca próbuje dodać tego ptaka do listy wkładaniowej na lot konkursowy kategorii B, C lub M.
  - *THEN:* Aplikacja wyświetla wyraźny żółty/czerwony alert ostrzegawczy:
    *„UWAGA: Ptak posiada niepełną 8. lotkę napędową. Ryzyko kontuzji i spadku prędkości o 15–25%. Zalecany odpoczynek lub lot krótki kat. A”*.

---

### BR-ZDR-003: Kalendarz Szczepień Stadnych z Certyfikacją Weterynaryjną
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P7 (Dr Janusz)
- **Opis:** Harmonogram obowiązkowych szczepień profilaktycznych stada:
  1. **Paramyksowiroza (PMV-1):** Szczepienie inaktywowane podskórne w kark (obowiązkowe 1 raz w roku przed sezonem lotowym dla wszystkich ptaków dorosłych i młodych).
  2. **Ospodifteryt (Ospa gołębi / Pox):** Szczepienie metodą skaryfikacji mieszków piórowych na udzie lub iniekcyjne.
  3. **Salmonelloza (Paratyfus):** Szczepienie profilaktyczne po uprzednim odrobaczeniu i kuracji oczyszczającej.
- **Kryteria Akceptacji:**
  - *GIVEN:* Kalendarz zdrowia stada.
  - *WHEN:* Zbliża się 30 dni do wygaśnięcia rocznego zaświadczenia PMV-1.
  - *THEN:* System wysyła lokalne powiadomienie push: *„Za 30 dni upływa ważność szczepienia PMV-1 stada. Zaplanuj wizytę lekarza weterynarii przed pierwszym koszowaniem”*.

---

### BR-ZDR-004: Dziennik Kuracji i Kalkulator Okresu Karencji (Antydoping FCI)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P3, P7 (Dr Janusz)
- **Opis:** Zgodnie z międzynarodowymi przepisami antydopingowymi FCI, obecność w organizmie gołębia sulfonamidów, fluorochinolonów (np. enrofloksacyny), sterydów czy kortykosteroidów podczas lotu skutkuje natychmiastową dyskwalifikacją hodowcy i zawieszeniem licencji.
- **Kryteria Akceptacji:**
  - *GIVEN:* Rejestr leczenia gołębia lub całego przedziału.
  - *WHEN:* Hodowca zapisuje podanie antybiotyku o okresie karencji wynoszącym 7 dni (zakończenie kuracji: 10 maja).
  - *THEN:* Ptaki objęte kuracją otrzymują w systemie status `KARENCJA` do dnia 17 maja. Próba włożenia ich do kosza na lot w dniu 15 maja jest blokowana ostrzeżeniem blokującym.

---

### BR-ZDR-005: Dziennik Programów Żywieniowych (Cykl Tygodniowy Wdowca)
- **Priorytet:** SHOULD · **Etap:** MVP · **Persona:** P1, P3 (Marek)
- **Opis:** Harmonogram żywienia podzielony na poszczególne dni tygodnia:
  - *Niedziela (powrót):* Dieta oczyszczająca (depurative), woda z miodem, elektrolitami i glukozą.
  - *Poniedziałek / Wtorek:* Dieta regeneracyjna z podwyższoną zawartością białka (groch, wyka, soja) na odbudowę tkanki mięśniowej.
  - *Środa / Czwartek:* Dieta sportowa/lotowa (kukurydza, dari, kardi).
  - *Piątek (dzień koszowania):* Dieta wysokoenergetyczna bogata w tłuszcze (orzeszki ziemne łuskane, słonecznik łuskany, konopie, rzepak) podawana z olejami i drożdżami piwnymi.
- **Kryteria Akceptacji:**
  - *GIVEN:* Widok zakładki Zdrowie w piątek rano.
  - *WHEN:* Użytkownik otwiera aplikację.
  - *THEN:* Ekran główny wyświetla rekomendację dnia: *„Piątek przed lotem: Ładowanie tłuszczowe (orzeszki/konopie). Sprawdź stan wola przed koszowaniem”*.

---

### BR-ZDR-006: Kalkulator Paszowy 20 Ziaren (Białko, Tłuszcz, Energia MJ/kg)
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P2, P3
- **Opis:** Narzędzie komponowania własnych mieszanek paszowych.
- **Baza Składników:** Kukurydza drobna (Criollo), Kukurydza czerwona (Bordeaux), Groch żółty, Groch zielony, Peluszka, Wyka, Bobik, Soja tostowana, Pszenica, Jęczmień browarny, Dari (sorgo białe), Milo (sorgo czerwone), Kardi (krokosz barwierski), Słonecznik czarny, Słonecznik pasiasty, Konopie, Rzepak, Siemię lniane, Proso, Ryż niełuskany (Paddy).
- **Kryteria Akceptacji:**
  - *GIVEN:* Formularz tworzenia mieszanki paszowej.
  - *WHEN:* Użytkownik podaje procentowy udział 5 ziaren (np. Kukurydza 30%, Kardi 20%, Konopie 15%, Dari 20%, Jęczmień 15% = 100%).
  - *THEN:* Aplikacja natychmiast wylicza:
    - Białko ogólne (% surowego białka),
    - Tłuszcz surowy (%),
    - Węglowodany strawne (%),
    - Wartość energii metabolicznej (MJ/kg paszy).

---

### BR-ZDR-007: Moduł Sterowania Ciemnią i Światłem (Verdunkelung System)
- **Priorytet:** SHOULD · **Etap:** 1.1 · **Persona:** P3 (Marek)
- **Opis:** System zaciemniania gołębnika młodych w celu regulacji hormonów tarczycy i zatrzymania pierzenia lotek przed zawodami.
- **Kryteria Akceptacji:**
  - *GIVEN:* Włączony tryb „System Ciemni”.
  - *WHEN:* Użytkownik konfiguruje godziny ciemni (np. 17:30 do 08:30 — 15 godzin ciemności).
  - *THEN:* Aplikacja wyświetla powiadomienia alarmowe o konieczności zasłonięcia i odsłonięcia żaluzji gołębnika oraz generuje wykres dobowy cyklu fotoperiodycznego.
