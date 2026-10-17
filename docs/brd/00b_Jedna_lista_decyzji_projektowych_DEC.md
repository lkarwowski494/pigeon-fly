# Jedna Lista Decyzji Projektowych (DEC-01 do DEC-114 oraz DEC-RETRO-01 do DEC-RETRO-08)
## Pigeon-Fly · Rejestr Decyzji Architektonicznych, Biznesowych, Biologicznych i Związkowych PZHGP/FCI

> **Status:** Wersja zaktualizowana w trybie Retrofit (18.10.2026). Zsynchronizowano z `docs/decyzje_biezace.md` (100 modułów Z-001..Z-100, commit `ea0e0b3`).  
> **Właściciel decyzji:** Łukasz (`lkarwowski494`)  
> **Zasada Nadrzędna:** Decyzje należą do Łukasza (min. 2 realne opcje z analizą kompromisów i rekomendacją analityka).

---

## 1. Kluczowe Decyzje Architektoniczne i Biznesowe (DEC-01 do DEC-56)

- **DEC-01 (Zakres MVP):** Opcja B+ (Hybrydowa z Supabase — Notes stada, rodowody PDF A4, inbred Wrighta, skaner QR, kalkulator $m/min$ Vincenty, karta 10 lotek ARI, szczepienia PMV-1, Field Mode, Apple Watch oraz Supabase sync delta, online rodowody QR, sieć Lost & Found).
- **DEC-02 (Architektura Bazy Danych):** Opcja C (Hybrydowy Offline-First z bazą SQLite 3 WAL jako natychmiastowym celem zapisu w gołębniku + asynchroniczna replikacja do PostgreSQL 16 w Supabase).
- **DEC-03 (Obliczenia Geodezyjne):** Opcja B (Równania elipsoidalne Vincenty'ego WGS-84 z dokładnością do 1 mm).
- **DEC-04 (Format Kodu QR):** Opcja B (Ultrakompaktowy format PF1 z korekcją błędów Reed-Solomon Level H odporny do 30% zabrudzenia piórami).
- **DEC-06 (Granice Free Tier):** Opcja B (Nielimitowany czasowo darmowy rdzeń do 10 ptaków; wersja Pro dla większych stad i funkcji sieciowych).
- **DEC-07 (Cennik i Monetyzacja):** Opcja A (0,99 EUR/mc, 4,99 EUR/rok, 14,99–19,99 EUR Lifetime z Family Sharing).
- **DEC-08 (Kopia Zapasowa):** Opcja A (Zawsze 100% darmowy eksport i import bazy SQLite oraz JSON/CSV).
- **DEC-31 (Wybór Bazy Chmurowej):** Opcja C (Supabase PostgreSQL 16 z Row Level Security i Realtime WebSockets).
- **DEC-32 (Strategia Uwierzytelniania):** Opcja B (Zero-Friction: Anonimowy start $\rightarrow$ Apple Sign-In przy przejściu na funkcje PRO/Tandem).

---

## 2. Decyzje Związkowe, Biologiczne i Urzędowe PZHGP/FCI (DEC-57 do DEC-114)

- **DEC-57 do DEC-72:** Moduły rozrodu, matrycy cel 2D (Nest Box Matrix), owoskopii D+5, obrączkowania D+6..8, rotacji paszowej Weende, aerodynamiki skrzydła, bilansu elektrolitowego poidła pH 4.2–4.5.
- **DEC-73 do DEC-80:** Planiści lęgów (Z-073), asystent żywienia (Z-074), kalkulator GMP (Z-075), 21-dniowa kwarantanna (Z-076), restytucja powrotowa i poidło izotoniczne (Z-077), dziennik wywózek i Flock Cohesion Index (Z-078), lotowy paszport kariery (Z-079), deklaracja Fair-Play i zgoda na antydoping (Z-080).
- **DEC-81 do DEC-90:** Umowa dzierżawy reproduktora (Z-081), puchar ligi zespołowej (Z-082), 96h superkompensacja lipidowa (Z-083), weryfikacja anten ESK min. 5.0 cm (Z-084), bilans odwodnienia w kabinie transportowej (Z-085), certyfikat członkostwa PZHGP (Z-086), protokół kontroli gołębnika (Z-087), diagnostyka OPG/EPG i antybiogramy (Z-088), auto-transfer młodych D+24 (Z-089), protokół zgonu i utylizacja SARIA (Z-090).
- **DEC-91 do DEC-100:** Profilowanie genetyczne DNA STR ISAG i markery LDHA/DRD4 (Z-091), atestacja sanitarna punktu koszowania Virkon S (Z-092), protokół prób antydopingowych A i B (Z-093), e-rejestr wypożyczeń koszy (Z-094), urzędowy spis 50/100 PZHGP z PMV-1 (Z-095), protokół awarii kabiny i zrzutu awaryjnego (Z-096), ewidencja błąkaczy i kwarantanna (Z-097), komisyjny audyt odchyłki chodu zegarów ESK $\le \pm 2\text{s}$ (Z-098).
- **DEC-113 (Reprezentacja na Wystawę Ogólnopolską — Z-099):** Klasy Sport FCI A–H z weryfikacją minimów 2-letnich oraz Klasa Standard FCI wg 100-punktowego wzorca sędziowskiego (5 cech eksterieru, min. 2500 kkm samce, 2000 kkm samice).
- **DEC-114 (Jubileuszowy: Złota Księga Mistrzów i Roczny Bilans Stada — Z-100):** Całoroczny bilans 4 filarów (Sport, Rozpłód, Dobrostan, Panteon Asów) z certyfikacją medalową stada (Diamentowy, Złoty, Srebrny, Brązowy Gołębnik) i uroczystym dyplomem A4 PDF ze złotą bordiurą.

---

## 3. Wiążące Rozstrzygnięcia Procedury Retrofit (DEC-RETRO-01 do DEC-RETRO-08)

- **DEC-RETRO-01 (Strategia Danych):** Opcja B (Hybrydowa — 100% lokalny rdzeń SQLite WAL, Supabase wyłącznie dla funkcji sieciowych PRO).
- **DEC-RETRO-02 (Granica Zakresu):** Opcja A (Zamrożenie zakresu na 100 modułach Z-001..Z-100 i stabilizacja pod App Store).
- **DEC-RETRO-03 (Format Wektorów Testowych Fixture):** Opcja B (Modularne fixtury domenowe JSON w `tests/fixtures/`).
- **DEC-RETRO-04 (Ergonomia UI 100 Modułów):** Opcja A (Związkowy Katalog Urzędowy PZHGP/FCI z wyszukiwarką błyskawiczną i filtrami, odciążający ekran `loty.tsx`).
- **DEC-RETRO-05 (Deduplikacja Stylów Modali):** Opcja A (Wydzielenie `src/theme/modalTheme.ts`).
- **DEC-RETRO-06 (Eliminacja Ostrzeżenia SafeAreaView):** Opcja A (Globalna migracja na `react-native-safe-area-context`).
- **DEC-RETRO-07 (Kolejność Egzekucji):** Opcja B (Najpierw kanoniczna dokumentacja BRD i fixtury, potem refaktoryzacja kodu).
- **DEC-RETRO-08 (Zakres Synchronizacji BRD):** Opcja A (Pełna kanoniczna synchronizacja Tomów `00`, `00b`, `A3`, `C1`).
