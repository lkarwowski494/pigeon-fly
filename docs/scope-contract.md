# Kontrakt Zakresu MVP v1.0 (Scope Contract & Kill List)
**Projekt:** Pigeon-Fly (`com.apps4loft.pigeonfly`)  
**Status:** ZAMROŻONY (Scope Lock — Decyzja DEC-RETRO-02)  
**Właściciel:** Łukasz (`lkarwowski494`)  
**Data wydania kontraktu:** 2026-10-18  

---

## 1. Zasada Nienaruszalności Zakresu (Scope Freeze)

Zgodnie z decyzją **`DEC-RETRO-02: Opcja A`**, zakres funkcjonalny wydania v1.0 zostaje bezwzględnie zablokowany na **100 modułach domenowych (Z-001 do Z-100)**.
Żadne nowe moduły, eksperymentalne ekrany ani zewnętrzne integracje nie mogą zostać dopisane do wersji produkcyjnej v1.0. Wszelkie prace inżynieryjne skupiają się wyłącznie na jakości rzemieślniczej, stabilności offline, testach i ergonomii polowej.

---

## 2. Architektura Domenowa 100 Modułów

Zakres został podzielony na dwie rozłączne warstwy, aby zapobiec syndromowi kombajnu:

### Warstwa A: Rdzeń Operacyjny Hodowcy (Dostępny na Pulpicie Głównym)
- **Z-001..Z-009:** Architektura SQLite WAL, kopie zapasowe JSON/SQLite, bezpieczna chmura Supabase RLS.
- **Z-010..Z-029:** Kartoteka stada, cechy fenotypowe (oko, skrzydło), rodowody 5 pokoleń, algorytm inbredu Sewalla Wrighta ($F$).
- **Z-030..Z-039:** Identyfikacja mikronaklejek QR (PF1 Level H), szybki skaner kamery w lufce.
- **Z-040..Z-049:** Operacje lotowe: geodezja Vincenty WGS-84, prędkość $m/min$, baza konkursowa FCI 20%, wektor wiatru.
- **Z-050..Z-059:** Zdrowie i kondycja: karta 10 lotek (ARI), profilaktyka PMV-1, ciemnia Verdunkelung, bilans pasz Weende.
- **Z-060..Z-079:** Urządzenia i cykl hodowlany: Apple Watch Companion, wirtualna matryca cel 2D, owoskopia D+5, transfer młódków D+24, GMP PZHGP.

### Warstwa B: Związkowy Pakiet Urzędowy i Sędziowski (Wyodrębniony Hub Urzędowy)
- **Z-080..Z-100:** Moduły formalno-prawne i sędziowskie dostępne wyłącznie poprzez dedykowany `OfficialProtocolsHubModal` (DEC-RETRO-04):
  - Deklaracje etyki i umowy dzierżawy (Z-080, Z-081)
  - Legalizacja anten ESK i test czułości (Z-084)
  - Ewidencja badań laboratoryjnych kału i sekcji zwłok (Z-088, Z-090)
  - Panele markerów DNA STR i bioasekuracja punktów koszowania (Z-091, Z-092)
  - Protokoły prób antydopingowych A/B (Z-093)
  - Przedsezonowe spisy 50/100 PZHGP (Z-095)
  - Komisyjne otwarcie zegarów i 100-pkt Standard FCI (Z-098, Z-099)
  - Złota Księga Mistrzów (Z-100)

---

## 3. Oficjalna Lista Wykluczeń (Kill List dla v1.0)

Poniższe funkcje i pomysły zostały **bezwzględnie odrzucone z wydania v1.0**, aby chronić prostotę notesu polowego i zapobiec przeciążeniu aplikacji:

1. **KILL-01: Giełda aukcyjna i moduł płatności P2P w aplikacji:**
   - *Powód odrzucenia:* Złamanie wytycznych Apple 3.1.5 (obrót żywymi zwierzętami), ryzyko prawne, gigantyczny bloat społecznościowy.
2. **KILL-02: Publiczne czaty i fora dyskusyjne w aplikacji:**
   - *Powód odrzucenia:* Naruszenie koncepcji skupionego notesu roboczego, wymóg moderacji UGC (Apple 1.2), rozpraszanie hodowcy w gołębniku.
3. **KILL-03: Automatyczny zakup pasz i suplementów w sklepach internetowych:**
   - *Powód odrzucenia:* Pigeon-Fly to suwerenne narzędzie rzemiosła, nie platforma afiliacyjna.
4. **KILL-04: Sztuczna inteligencja generująca opisy rodowodów ("AI Pedigree Story"):**
   - *Powód odrzucenia:* Bezwzględny zakaz halucynacji w rodowodach. Rodowód ma być twardym, urzędowym dokumentem opartym o fakty genealogiczne.
5. **KILL-05: Grywalizacja, awatary i animowane odznaki:**
   - *Powód odrzucenia:* Kategoryczny zakaz estetyki AI Slop. W sporcie gołębiarskim liczy się rzetelny wynik w $m/min$, nie wirtualne puchary.

---

## 4. Kryteria Gotowości Wydania v1.0 (Release Gates)

- [x] 100 modułów zaimplementowanych w architekturze Offline-First SQLite WAL.
- [x] 0 błędów TypeScript (`tsc --noEmit`).
- [x] 100% testów jednostkowych i integracyjnych zaliczonych.
- [x] Zunifikowany motyw polowy (WCAG AAA, brak zakazanego fioletu `#8B5CF6`).
- [x] Zintegrowany serwis zakupowy StoreKit / Play Billing z odzyskiem po reinstalacji.
- [ ] Zastąpienie 65-bajtowych atrap ikon produkcyjnymi grafikami PNG (1024×1024).
- [ ] Pełna ekstrakcja tekstów UI do słowników i18n.
