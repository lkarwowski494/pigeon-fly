# Rozdziały 13 i 15: KPI Bez Śledzenia, Marketing Środowiskowy i ASO (A4)
## Pigeon-Fly · Cyfrowy Notes Mistrza

---

# Rozdział 13: Wskaźniki Sukcesu (KPI) Bez Telemetrii i Bez Śledzenia

Zgodnie z nadrzędną zasadą **ZP-03 (Data Not Collected)**, aplikacja Pigeon-Fly nie zawiera żadnych pakietów SDK firm trzecich (brak Firebase Analytics, AppsFlyer, Mixpanel, Facebook SDK). Pomiar sukcesu opiera się wyłącznie na zanonimizowanych, agregowanych danych dostarczanych przez Apple App Store Connect oraz na wskaźnikach lokalnych.

### 13.1. Zewnętrzne Wskaźniki Biznesowe (App Store Connect)
1. **Konwersja z Darmowego Rdzenia do Wersji PRO:** Cel: $\ge 4,5\%$ wszystkich pobrań (ze względu na realną potrzebę nielimitowanego stada powyżej 10 ptaków).
2. **Struktura Przychodów:**
   - 60% przychodów z zakupu dożywotniego (**Lifetime 19,99 EUR**).
   - 30% przychodów z subskrypcji rocznej (**6,99 EUR / rok**).
   - 10% przychodów z subskrypcji miesięcznej (**1,99 EUR / msc**).
3. **Konwersja 3-Dniowego Trialu w Subskrypcję Roczną:** Cel: $\ge 65\%$.
4. **Wskaźnik Zwrotów (Refund Rate):** Cel: $< 1,0\%$ (świadczy o doskonałej jakości i spełnieniu obietnic).
5. **Średnia Ocen w App Store:** Cel: $\ge 4,8 \bigstar$ przy co najmniej 100 recenzjach w pierwszym sezonie lotowym.

### 13.2. Wskaźniki Doskonałości Lokalnej (Testy Inżynieryjne)
- **Czas generowania rodowodu PDF A4:** $< 500\,\text{ms}$ na iPhone 11.
- **Czas skanowania kodu QR aparatem w lufce:** $< 20\,\text{ms}$ od momentu pojawienia się kodu w kadrze.
- **Czas geodezyjnego wyliczenia prędkości $m/min$ (Vincenty):** $< 1\,\text{ms}$.
- **Rozmiar bazy danych SQLite dla stada 200 ptaków i 5 pokoleń:** $< 1,5\,\text{MB}$ (bez zdjęć) — ultrakompaktowość.

---

# Rozdział 15: Marketing Środowiskowy, Wystawy i ASO

### 15.1. Strategia Marketingu Organicznego w Środowisku Hodowców
Społeczność hodowców gołębi pocztowych to środowisko oparte na silnych więziach lokalnych, autorytecie mistrzów i marketingu szeptanym:
1. **Dni Koszowania w Punktach Wkładań (Sekcje PZHGP):** Gdy hodowca wyciąga w punkcie wkładaniowym telefon, pokazuje elegancką listę wkładaniową i błyskawiczny rodowód PDF wygenerowany w 2 sekundy, wzbudza natychmiastowe zainteresowanie kolegów z sekcji.
2. **Obecność na Głównej Wystawie Krajowej:**
   - *Polska:* Ogólnopolska Wystawa Gołębi Pocztowych i Międzynarodowe Targi (Sosnowiec / Katowice) — 15 000 odwiedzających w 2 dni.
   - *Niemcy:* Międzynarodowa Wystawa *DBA (Deutsche Brieftauben-Ausstellung)* w Dortmundzie / Kassel — największa impreza w Europie.
   - *Belgia:* Targi *Fugare* w Kortrijk.
3. **Partnerstwa z Portalami Aukcyjnymi (PIPA, Herbots, De Duif):** Promowanie rodowodów Pigeon-Fly jako standardu estetycznego dla ptaków wystawianych na sprzedaż.

---

### 15.2. Strategia ASO (App Store Optimization) w 35 Językach

Tytuł i podtytuł w kluczowych językach:
- **Polski (PL):**
  - *Tytuł:* Pigeon-Fly: Notes Gołębnika
  - *Podtytuł:* Rodowody PDF, loty, kalkulator prędkości m/min, skaner QR offline
  - *Słowa kluczowe:* gołębie pocztowe, notes hodowcy, pzhgp, rodowód gołębia, prędkość m/min, lufka, pierzenie, loty gołębi, wdowieństwo, inbred
- **Angielski (EN):**
  - *Tytuł:* Pigeon-Fly: Pigeon Loft Book
  - *Podtytuł:* Racing pigeon manager, pedigrees PDF, flight speed m/min, offline
  - *Słowa kluczowe:* pigeon racing, homing pigeon, pigeon pedigree, loft manager, pigeon speed calculator, pigeon clock, moulting, pigeon timer
- **Niemiecki (DE):**
  - *Tytuł:* Pigeon-Fly: Brieftauben Schlag
  - *Podtytuł:* Schlagmanager, Abstammung PDF, Fluggeschwindigkeit m/min, Offline
  - *Słowa kluczowe:* brieftauben, brieftaubensport, schlagmanager, tauben stammbaum, fluggeschwindigkeit, mauser, witwer, bontaube
- **Niderlandzki / Flamandzki (NL):**
  - *Tytuł:* Pigeon-Fly: Duivenhok Notities
  - *Podtytuł:* Duivensport, stamboom PDF, vliegsnelheid m/min, offline hoklijst
  - *Słowa kluczowe:* duivensport, postduiven, stamboom duif, duivenhok, vliegsnelheid, kbdb, duivenklok, rui
- **Rumuński (RO):**
  - *Tytuł:* Pigeon-Fly: Ceas Porumbei Voiajori
  - *Podtytuł:* Pedigree PDF, viteza m/min, evidenta crescatorie porumbei offline
  - *Słowa kluczowe:* porumbei voiajori, columbofil, pedigree porumbei, viteza porumbei, clasament, ceas porumbei
- **Chiński Tradycyjny (ZH-TW / Tajwan):**
  - *Tytuł:* Pigeon-Fly: 賽鴿管理大師
  - *Podtytuł:* 賽鴿血統書PDF，分速計算機m/min，鴿舍筆記離線版
  - *Słowa kluczowe:* 賽鴿, 信鴿, 鴿舍, 血統書, 分速, 賽鴿計時, 換羽, 海翔
