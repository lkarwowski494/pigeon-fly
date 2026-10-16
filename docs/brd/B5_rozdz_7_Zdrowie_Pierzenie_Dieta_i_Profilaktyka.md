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

### BR-ZDR-007: Moduł Sterowania Ciemnią i Światłem (Verdunkelung & Belichtung System)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P3 (Marek), P1 (Stanisław)
- **Opis:** System fotoperiodycznej manipulacji długością dnia świetlnego dla młodych gołębi:
  1. **Zaciemnianie (Verdunkelung):** Od 15 marca do 21 czerwca — 14 godzin całkowitej ciemności (18:00–08:00) i 10 godzin światła. Oszukuje szyszynkę, zmusza organizm do wymiany pierza drobnego, lecz **całkowicie blokuje zrzucanie 10 lotek pierwszorzędowych**. W sierpniu młódki lecą pełnym skrzydłem, zyskując potężną przewagę aerodynamiczną.
  2. **Doświetlanie (Belichtung):** Od 22 czerwca do połowy września — sztuczne przedłużanie dnia do 16–17 godzin (doświetlanie rano od 05:00 i wieczorem do 22:30 lampami o temperaturze barwowej 6000K). Zapobiega spadkowi formy i blokuje jesienne pierzenie główne podczas zawodów.
- **Kryteria Akceptacji:**
  - *GIVEN:* Przedział młodzieży z włączonym systemem ciemni.
  - *WHEN:* Wybija godzina 17:45.
  - *THEN:* Aplikacja wysyła powiadomienie Push: *„Za 15 minut zasłoń żaluzje gołębnika (reżim 14h ciemności)”*.

---

### BR-ZDR-008: 12-Miesięczny Kalendarz Weterynaryjny i Koproskopia
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P7 (Dr Janusz)
- **Opis:** Całoroczna ścieżka profilaktyki weterynaryjnej stada:
  - *Grudzień / Styczeń:* Badanie parazytologiczne kału (koproskopia flotacyjna: kokcydia, nicienie *Ascaridia columbae*, kapilarie *Capillaria*) + odrobaczanie + wypalanie cel palnikiem gazowym;
  - *Styczeń / Luty:* Obowiązkowe szczepienie inaktywowane PMV-1 (paramyksowiroza) + szczepienie przeciw ospie gołębi;
  - *Luty / Marzec:* Kontrola wola (trichomonadoza / rzęsistek / żółty guzek) przed parowaniem;
  - *Kwiecień:* Przegląd dróg oddechowych (mykoplazmoza, ornitoza, katar zakaźny / coryza);
  - *Maj / Czerwiec:* Profilaktyka syndromu młodych (Adeno-Coli / YPDS);
  - *Wrzesień / Październik:* Kontrola salmonellozy (paratyfus) po sezonie lotowym.
- **Kryteria Akceptacji:**
  - *GIVEN:* Rejestr profilaktyki stada.
  - *WHEN:* Hodowca wpisuje wynik koproskopii: *„Kokcydia: nieliczne w p.w., Nicienie: ujemny”*.
  - *THEN:* System rekomenduje naturalne zakwaszanie poidła (ocet jabłkowy, oregano) bez konieczności stosowania chemioterapeutyków.

---

### BR-ZDR-009: Protokół Suplementacji Poidła i Karmnika (Matrix Dodatków)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P3
- **Opis:** Precyzyjny podział suplementów ze względu na drogę podania i fazę tygodniową:
  1. **Do poidła (woda):**
     - Elektrolity + glukoza (niedziela po locie);
     - Zakwaszacz jelitowy (pH 4.0–4.5, poniedziałek–wtorek);
     - Kompleks witamin B + Aminokwasy (środa);
     - L-karnityna + Magnez (czwartek);
     - Czysta, świeża woda (piątek przed koszowaniem — zakaz barwienia wody!).
  2. **Na karmę (zwilżanie):**
     - Olej czosnkowy + drożdże piwne (bomba witaminowa B, naturalny allicynowy antybiotyk);
     - Olej z zarodków pszennych (bogaty w witaminę E — płodność i wytrzymałość mięśniowa);
     - Siemię lniane gotowane (śluz osłaniający przewód pokarmowy w okresie pierzenia);
     - Tran / oleje rybie (kwasy Omega-3);
     - Algi morskie i minerały sypkie.
- **Kryteria Akceptacji:**
  - *GIVEN:* Widok ekranu Żywienie w dany dzień tygodnia.
  - *THEN:* Użytkownik widzi precyzyjną listę: co wsypać do karmnika, co wlać do poidła i jakie minerały/grit postawić w wolnym dostępie.

---

### BR-ZDR-010: Profilaktyka Syndromu Młodych Ptaków (Adeno-Coli / YPDS)
- **Priorytet:** MUST · **Etap:** 1.1 · **Persona:** P3, P7
- **Opis:** Moduł wczesnego ostrzegania przed największą plagą hodowli młodzieży (*Young Pigeon Disease Syndrome* — infekcja Adenowirus + E. coli + Cirkowirus):
  - Objawy wczesne: wole pełne wody i gnijącego ziarna (tzw. "lejące wole"), utrata apetytu, wymioty, zielonkawo-śluzowata cuchnąca biegunka, apatia;
  - Protokół ratunkowy w aplikacji: natychmiastowe odstawienie karmy ciężkiej, podaż elektrolitów, zakwaszenie wody do pH 4.0 (bariera kwasowa żołądka gruczołowego uniemożliwiająca namnażanie *E. coli*), podanie przeciwciał żółtkowych IgY oraz maślanu sodu.
- **Kryteria Akceptacji:**
  - *WHEN:* Użytkownik zaznacza u młodego ptaka objaw „zaleganie karmy w wolu”.
  - *THEN:* Aplikacja natychmiast generuje czerwoną kartę procedury postępowania z Adeno-Coli i rekomenduje natychmiastową izolację ptaka w wolierze kwarantannowej.

---

### BR-ZDR-011: E-Księga Leczenia Stada (Dziennik Urzędowy Weterynarii)
- **Priorytet:** MUST · **Etap:** MVP · **Persona:** P1, P7 (Dr Janusz)
- **Opis:** Zgodnie z rozporządzeniem Ministra Rolnictwa i wytycznymi Powiatowego Lekarza Weterynarii (PIW), każda hodowla musi posiadać księgę ewidencji leczenia zwierząt gospodarskich i ptaków.
- **Pola Rekordu:** Data podania leku, Nazwa handlowa i substancja czynna, Numer serii (Batch No), Dawka i sposób podania, Liczba ptaków leczonych, Okres karencji w dniach, Data zakończenia karencji, Imię i nazwisko lekarza weterynarii.
- **Funkcja Eksportu:** Generowanie urzędowego raportu PDF jednym kliknięciem podczas kontroli weterynaryjnej na gołębniku.

