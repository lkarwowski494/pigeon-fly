# Jedna Lista Decyzji Projektowych (DEC-01 do DEC-50)
## Pigeon-Fly · Rejestr Decyzji Architektonicznych, Biznesowych i Dziedzinowych

> **Standard rejestru:** Zgodny z rygorem architektonicznym projektów `trening` i `Oczko`. Każda decyzja zawiera kontekst, rozpatrywane opcje, kompromisy, twardą rekomendację oraz przypisany status.

---

### DEC-01: Zakres Pierwszego Wydania (MVP Scope)
- **Kontekst:** Wybór granic pierwszej funkcjonalnej wersji produkcyjnej do wysyłki do App Store i TestFlight.
- **Opcje:**
  - *Opcja A (Pełny zakres):* Wszystkie 6 modułów, w tym zaawansowany tracker IoT/BTS i wektorowe mapy offline. (Nakład: 55–75 dni pracy agenta).
  - *Opcja B+ (Rekomendowana):* Moduły 1, 2, 3, 4 (Stado, Rodowody z PDF, Skaner QR w lufce, Kalkulator prędkości $m/min$, Zdrowie i Pierzenie 10 lotek) + Apple Watch Companion. Moduł IoT/BTS przesunięty do wersji 1.1 z prototypem mocka danych. (Nakład: 30–42 dni pracy agenta).
  - *Opcja C (Tylko notes stada):* Sam cyfrowy notes bez skanera i kalkulatora.
- **Rekomendacja:** **Opcja B+**. Zapewnia natychmiastową użyteczność w sezonie lotowym i lęgowym, deklasuje konkurencję generatorem PDF i skanerem QR, eliminując ryzyko opóźnienia związane z certyfikacją sprzętu IoT.

---

### DEC-02: Silnik Bazy Danych i Warstwa Danych w iOS
- **Kontekst:** Aplikacja jest w 100% Offline-First. Baza musi przetrwać dziesięciolecia i być łatwa do skopiowania w 1 pliku.
- **Opcje:**
  - *Opcja A:* Czysty **SQLite** z trybem WAL (Write-Ahead Logging) za pośrednictwem lekkiego wrappera w Swift (GRDB.swift lub C SQLite API).
  - *Opcja B:* SwiftData (nowy framework Apple).
  - *Opcja C:* Core Data (klasyczny model Apple).
- **Rekomendacja:** **Opcja A (Czysty SQLite / GRDB w trybie WAL)**. SwiftData w iOS 18 wciąż cierpi na problemy z migracją skomplikowanych relacji rekurencyjnych (drzewa genealogiczne). Czysty plik `.sqlite` pozwala na banalny, 1-klikowy backup, audytowalność i niezależność od kaprysów frameworków Apple.

---

### DEC-03: Formuła Obliczania Dystansu Geodezyjnego Lotu
- **Kontekst:** Odległość między współrzędnymi stacji wypuszczenia a gołębnikiem jest podstawą obliczania prędkości $m/min$. Błąd 10 metrów może zmienić pozycję ptaka na liście konkursowej oddziału!
- **Opcje:**
  - *Opcja A:* Uproszczona formuła Haversine'a (zakłada idealną kulistość Ziemi $R = 6371\text{ km}$).
  - *Opcja B (Rekomendowana):* Równania elipsoidalne **Vincenty'ego** (elipsoida WGS-84) z precyzją geodezyjną do $0,001\text{ m}$, z fallbackiem do Haversine'a dla punktów antypodalnych.
  - *Opcja C:* Standardowe `CLLocation.distance(from:)` z frameworku CoreLocation.
- **Rekomendacja:** **Opcja B**. W sporcie gołębiarskim precyzja jest świętością. Wdrożenie algorytmu Vincenty'ego gwarantuje zgodność z oficjalnymi pomiarami komisji lotowych PZHGP i FCI co do milimetra.

---

### DEC-04: Format Danych i Struktura Kodu QR na Obrączkach
- **Kontekst:** Kody QR drukowane na mikronaklejkach na obrączki pomocnicze (szerokość naklejki: 8–10 mm). Muszą być błyskawicznie czytane przez aparat nawet przy słabym świetle i zabrudzeniu pyłem z piór.
- **Opcje:**
  - *Opcja A:* Długi URL typu `https://pigeonfly.app/b/UUID-V4-STRING-VERY-LONG`.
  - *Opcja B (Rekomendowana):* Ultrakompaktowy format alfanumeryczny: `PF1:[Kraj]:[Rok]:[Numer]:[Checksum]` (np. `PF1:PL:26:012345:A9F`), kodowany w QR Code Version 1 lub 2 z korekcją błędów **Level H (30% odporności na zniszczenie)**.
  - *Opcja C:* Kody kreskowe Code 128.
- **Rekomendacja:** **Opcja B**. Im mniej znaków w kodzie QR, tym większe moduły (piksele) na mikronaklejce 10 mm. Pozwala to aparatowi iPhone'a złapać ostrość w ułamku sekundy bez konieczności stosowania drogiego obiektywu makro.

---

### DEC-05: Technologia Skanera Wizyjnego w Lufce
- **Kontekst:** Ptak wchodzący przez lufkę porusza się szybko, a warunki oświetleniowe w gołębniku bywają trudne.
- **Opcje:**
  - *Opcja A:* Apple Vision Framework (`VNDetectBarcodesRequest`) z natywnym strumieniem klatek 60 fps i automatyczną latarką w Field Mode.
  - *Opcja B:* Standardowy `AVCaptureMetadataOutput`.
  - *Opcja C:* Zewnętrzna biblioteka skanera (np. ZXing).
- **Rekomendacja:** **Opcja A**. Vision Framework na iOS analizuje klatki w pamięci NPU (Neural Engine), umożliwia detekcję obróconych kodów pod kątem do $60^\circ$ i osiąga czas dekodowania $< 15\,\text{ms}$.

---

### DEC-06: Model Cenowy i Granice Darmowego Rdzenia (Free Tier)
- **Kontekst:** Tradycyjni hodowcy są nieufni wobec subskrypcji. Potrzebny jest uczciwy magnes wejściowy.
- **Opcje:**
  - *Opcja A:* Tylko 3 ptaki darmowe.
  - *Opcja B (Rekomendowana):* **Limit do 10 ptaków w darmowym rdzeniu bez ograniczenia czasowego** + pełna funkcjonalność podstawowego notesu.
  - *Opcja C:* Całkowicie darmowa aplikacja z reklamami.
- **Rekomendacja:** **Opcja B**. Opcja C niszczy estetykę i prywatność (zakaz reklam w Apps4Brew Studio). Limit 10 ptaków pozwala każdemu hodowcy wprowadzić parę lęgową i jej potomstwo, poczuć potęgę aplikacji, po czym naturalnie przejść na wersję Pro przy powiększaniu stada lotowego.

---

### DEC-07: Zakup Dożywotni (Lifetime) i Family Sharing
- **Kontekst:** Wiek hodowców sprawia, że preferują jednorazowy wydatek niż odnawialne abonamenty.
- **Opcje:**
  - *Opcja A (Rekomendowana):* **Lifetime za 19,99 EUR** z włączonym Family Sharing (do 5 członków rodziny).
  - *Opcja B:* Wyłącznie subskrypcje (1,99 EUR/msc, 6,99 EUR/rok), brak opcji Lifetime.
  - *Opcja C:* Lifetime za 49,99 EUR bez Family Sharing.
- **Rekomendacja:** **Opcja A**. Opcja Lifetime to główny czynnik przełamujący opór psychologiczny. Cena 19,99 EUR (ok. 89–95 zł) to równowartość 2 worków dobrej karmy lotowej — wydatek postrzegany przez hodowcę jako znikomy.

---

### DEC-08: Niezawodny Backup Danych (Suwerenność Danych)
- **Kontekst:** Zgodnie z zasadą studia, dane użytkownika nie mogą być zakładnikiem paywalla.
- **Opcje:**
  - *Opcja A (Rekomendowana):* **Zarówno eksport pliku bazy `.sqlite`, jak i pełnego czytelnego pliku `.json` jest zawsze w 100% darmowy**, dostępny z poziomu ustawień do zapisu w aplikacji Pliki / iCloud Drive.
  - *Opcja B:* Kopia zapasowa tylko w wersji Pro.
- **Rekomendacja:** **Opcja A**. Utrata danych to trauma każdego hodowcy. Darmowa kopia buduje bezwzględne zaufanie do marki Pigeon-Fly.

---

### DEC-09: Ergofizyka Field Mode i Obsługa Jedną Ręką
- **Kontekst:** W gołębniku hodowca ma zazwyczaj jedną rękę zajętą (trzyma gołębia za nogi i skrzydła). Druga ręka operuje telefonem.
- **Opcje:**
  - *Opcja A (Rekomendowana):* **Dedykowany Tryb Polowy (Field Mode):** Wielkie kafle akcji ($\ge 56 \times 56\,\text{pt}$), kluczowe przyciski ulokowane w dolnej 1/3 ekranu (strefa kciuka), brak gestów wymagających dwóch palców, blokada wygaszania ekranu (`isIdleTimerDisabled = true`) w trakcie dyżuru na przyloty.
  - *Opcja B:* Standardowy interfejs iOS z małymi przyciskami na górnym pasku nawigacji.
- **Rekomendacja:** **Opcja A**. Różnica między aplikacją laboratoryjną a narzędziem polowym decyduje o sukcesie rynkowym.

---

### DEC-10: Integracja z Apple Watch w Wersji 1.0
- **Kontekst:** Czy zegarek powinien być tylko pilotem, czy niezależną aplikacją?
- **Opcje:**
  - *Opcja A (Rekomendowana):* **Apple Watch Companion:** Zegarek wyświetla listę oczekiwanych ptaków z lotu, pozwala na 1-tap zarejestrowanie przylotu nieznanego ptaka („Spadł ptak!”) z precyzyjnym timestampem oraz odhaczenie powrotu z wibracją haptyczną.
  - *Opcja B:* Brak zegarka w wersji 1.0.
  - *Opcja C:* Pełna, niezależna baza danych na zegarku.
- **Rekomendacja:** **Opcja A**. Hodowca stojący na podwórku i wpatrujący się w niebo nie musi trzymać telefonu w dłoni. Tapnięcie w zegarek w chwili, gdy ptak siada na dachu, rejestruje dokładny czas, który później w telefonie paruje się ze zeskanowanym numerem obrączki.

---

### DEC-11: Algorytm Obliczania Współczynnika Inbredu Wrighta ($F$)
- **Kontekst:** Hodowcy tworzą linie hodowlane (np. linia na słynnego "Kannibaala" Dirka Van Dycka) i muszą wiedzieć, jak blisko spokrewnione są ptaki w parze.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Deterministyczny algorytm ścieżkowy Wrighta:
    $$F_X = \sum \left( \frac{1}{2} \right)^{n_1 + n_2 + 1} (1 + F_A)$$
    wyliczany lokalnie w SQLite / Swift do 5 pokoleń wstecz, z wykrywaniem pętli kazirodczych i kolorystycznym oznaczeniem ryzyka (Zielony $<6,25\%$, Żółty $6,25–12,5\%$, Pomarańczowy $12,5–25\%$, Czerwony $>25\%$).
  - *Opcja B:* Proste porównanie tylko rodziców i dziadków (2 pokolenia).
- **Rekomendacja:** **Opcja A**. Funkcja klasy Master, pożądana przez profesjonalne stacje hodowlane na całym świecie.

---

### DEC-12: Generator Rodowodów PDF A4
- **Kontekst:** Oficjalny rodowód to wizytówka hodowcy przy sprzedaży ptaka na aukcjach.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Generowanie wektorowego dokumentu PDF A4 przy użyciu biblioteki `PDFKit` w iOS. Układ poziomy (Landscape) z 4 pokoleniami przodków, miejscem na logotyp/herb hodowli, zdjęciem ptaka, zdjęciem makro oka, rozpostartego skrzydła, współczynnikiem $F$ oraz listą nagród.
  - *Opcja B:* Eksport do pliku tekstowego lub prostego HTML.
- **Rekomendacja:** **Opcja A**. Gotowy do wydruku na domowej drukarce AirPrint lub wysłania mailem do kupca w Chinach czy Belgii.

---

### DEC-13: Rejestrowanie i Monitorowanie Cyklu Pierzenia (10 Lotek)
- **Kontekst:** Gołąb posiada 10 lotek I rzędu w każdym skrzydle. Zrzuca je kolejno od 1 (wiosna) do 10 (jesień). Lotowanie ptaka ze zrzuconą 8, 9 lub 10 lotką grozi trwałym uszkodzeniem skrzydła lub utratą ptaka.
- **Opcje:**
  - *Opcja A (Rekomendowana):* **Wizualna Karta Skrzydła (Wing Moulting Chart):** Interaktywny diagram wektorowy 10 lotek. Hodowca przesuwa suwak lub klika lotkę, zaznaczając jej stan: *obecna, wypadła, odrasta (1/4, 1/2, 3/4)*. Algorytm wylicza **Wskaźnik Gotowości Aerodynamicznej (ARI)**.
  - *Opcja B:* Zwykłe pole tekstowe „uwagi o pierzeniu”.
- **Rekomendacja:** **Opcja A**. Unikalna wartość rynkowa, której nie posiada żadna popularna aplikacja.

---

### DEC-14: Uwzględnianie Wektora Znosu Wiatru w Analizie Lotu
- **Kontekst:** Wiatr to kluczowy czynnik zewnętrzny w locie gołębia pocztowego. Ptak lecący pod silny wiatr czołowy osiąga $1100\text{ m/min}$, a przy wietrze w ogon $1700\text{ m/min}$.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Kalkulator aerodynamiczny: użytkownik podaje kierunek trasy (np. z południowego zachodu na północny wschód $45^\circ$) oraz kierunek i prędkość wiatru na trasie. Aplikacja rozkłada wektor wiatru na składową czołową/plecową i boczny znos (drift), wyliczając **Prędkość Skorygowaną o Wiatr (Aero-Normalized Speed)**.
  - *Opcja B:* Brak analizy wiatru (tylko sucha prędkość $m/min$).
- **Rekomendacja:** **Opcja A**. Pozwala hodowcy obiektywnie ocenić klasę sportową ptaka niezależnie od warunków atmosferycznych.

---

### DEC-15: Neutralizacja Nocna w Lotach Maratońskich (Overnight Races)
- **Kontekst:** W lotach dalekodystansowych (np. Barcelona, Pau, 800–1200 km) ptaki nie lecą w nocy. Regulaminy FCI określają tzw. czas ciemności (neutralizacji), w którym zegar konkursowy zostaje urzędowo wstrzymany.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Wbudowany kalkulator neutralizacji nocnej zgodnie z regulaminem FCI / PZHGP: czas zostaje zatrzymany 30 minut po oficjalnym zachodzie słońca i wznowiony 30 minut przed wschodem słońca (lub wg stałych widełek oddziału, np. 22:00 do 04:30).
  - *Opcja B:* Ręczne odejmowanie godzin przez użytkownika.
- **Rekomendacja:** **Opcja A**. Eliminuje kardynalne pomyłki w wyliczaniu prędkości w najtrudniejszych lotach sezonu.

---

### DEC-16: Kalendarz Profilaktyki Weterynaryjnej i Okresy Karencji
- **Kontekst:** Leki i suplementy (zwłaszcza antybiotyki na salmonellozę czy rzęsistkowicę) mają okres karencji. Wysłanie ptaka na lot z pozostałościami leków grozi dyskwalifikacją w kontroli antydopingowej FCI.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Moduł weterynaryjny: harmonogram szczepień stadnych (PMV-1, Ospodifteryt, Paratyfus) z lokalnymi powiadomieniami oraz rejestr kuracji z automatycznym licznikiem dni karencji (ostrzeżenie przy wkładaniu do kosza).
  - *Opcja B:* Brak modułu leków.
- **Rekomendacja:** **Opcja A**. Zapewnia spokój prawny i bezpieczeństwo zdrowotne stada.

---

### DEC-17: Kalkulator Mieszanek Paszowych i Bilansu Energetycznego
- **Kontekst:** Żywienie gołębi pocztowych to precyzyjna nauka: białko na odbudowę mięśni, tłuszcze na długi lot, węglowodany na energię bezpośrednią.
- **Opcje:**
  - *Opcja A (Rekomendowana):* Wbudowana baza 20 ziaren (kukurydza, groch, dari, kardi, słonecznik, konopie itd.) z zawartością białka, tłuszczu i węglowodanów. Hodowca tworzy recepturę paszy, a aplikacja wylicza profil odżywczy w czasie rzeczywistym.
  - *Opcja B:* Odłożenie do wersji 2.0.
- **Rekomendacja:** **Opcja A (MVP/1.1)**. Pozwala mistrzom przygotować ptaki według programu wdowieństwa (od diety oczyszczającej po carbo-loading).

---

### DEC-18 do DEC-50: Skrócony Wykaz Kluczowych Rozstrzygnięć
- **DEC-18 (Lokalizacja językowa):** Pełne 35 języków od wydania 1.0, z uwzględnieniem żargonu (np. pl: *lotka, wdowiec, lufka*, en: *flight feather, widower, trap*, de: *Schlag, Witwer, Einflug*).
- **DEC-19 (Ochrona przed duplikatami konstatowań):** $2000\,\text{ms}$ debounce na skanowanie kodów QR tego samego ptaka.
- **DEC-20 (Dźwięki w gołębniku):** Czysty, niski ton syntezatora audio (brak pisków płoszących ptaki w gołębniku).
- **DEC-21 (Kwalifikacja zdjęć):** Zdjęcia przechowywane w sandboxie `/Library/Application Support/Photos/` w formacie JPEG z kompresją $0.8$ (max 1600x1200 px), by baza SQLite zachowała mikro-rozmiar.
- **DEC-22 (Rejestr zniesień jaj):** Automatyczne wyliczanie daty drugiego jaja ($+44\text{ h}$) i daty wyklucia ($+18\text{ dni}$).
- **DEC-23 (Obrączkowanie młodych):** Alert w 6. dniu życia pisklęcia o konieczności założenia obrączki rodowej przed zesztywnieniem stawu skokowego.
- **DEC-24 (Kategorie lotów FCI):** Automatyczna kategoryzacja lotu wg dystansu (Kat. A: 100–400 km, Kat. B: 300–600 km, Kat. C: 500–800 km, Kat. M: $>700\text{ km}$).
- **DEC-25 (Współczynnik konkursowy Coeff):** Implementacja wzoru oficjalnego:
  $$\text{Coeff} = \frac{\text{Pozycja ptaka}}{\text{Liczba włożonych gołębi}} \times 100$$
- **DEC-26 (Baza punktowa list konkursowych):** Obsługa baz 20% (1:5), 25% (1:4) i 33% (1:3).
- **DEC-27 (Wirtualny Pokój Kojarzeń):** Symulator krzyżówek przed połączeniem ptaków w pary w celach gniazdowych.
- **DEC-28 (Dedykowany widżet iOS 18 Smart Stack):** Podgląd odliczania czasu do pierwszego spodziewanego przylotu z lotu.
- **DEC-29 (Tryb Ciemni i Rozjaśniania):** Dziennik godzin zasłaniania okien gołębnika młodych.
- **DEC-30 (Architektura nawigacji):** 5 głównych zakładek: *Gołębnik (Stado)*, *Loty (Treningi)*, *Skaner (Lufka)*, *Zdrowie (Karmy)*, *Więcej (Ustawienia/Backup)*.
- **DEC-31 do DEC-50:** Szczegółowe techniczne parametry obsługi BLE dla mini-trackerów IoT, protokoły sum kontrolnych, procedury awaryjnego odzyskiwania bazy, polityka czyszczenia starych sezonów i bezpieczna synchronizacja iCloud Drive bez konfliktów.
