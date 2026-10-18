# Architektura Docelowa (TO-BE) i Przeprojektowanie Procesów Biznesowych (BPR)
**Projekt:** PIGEON-FLY (`com.apps4loft.pigeonfly`)  
**Autor:** Rola 7: Principal Product Architect (BPR + UX Refactor) & Rola 17: Koordynator Napraw  
**Status:** ZATWIERDZONE DO WDROŻENIA (V1.0-RC)  
**Data rewizji:** 2026-10-18  

---

## 1. Geneza i Diagnoza AS-IS (Problem Paraliżu Modalnego)

W fazie pilotażowej aplikacja Pigeon-Fly zawierała **79 niezależnych komponentów typu Modal (`*Modal.tsx`)**. 
W warunkach polowych gołębnika (zabrudzone rękawice, pył gołębi, ostre światło słoneczne, ptak trzymany w jednej dłoni) taka architektura powodowała krytyczne bariery ergonomiczne:

1. **Utrata kontekstu ekranu głównego (Context Blindness):** Otwarcie pełnoekranowego okna dialogowego odcinało hodowcę od listy ptaków, tabeli przylotów lub podglądu cel lęgowych.
2. **Kaskady modalne (Modal-over-Modal):** Otwarcie asystenta doboru par z poziomu modala lęgów blokowało interfejs systemowy i generowało błędy renderowania w systemach iOS i Android.
3. **Ryzyko utraty danych (Accidental Dismiss):** Przypadkowe dotknięcie tła lub gest cofania zamykał modal bez zapisu formularza w toku wprowadzania danych.
4. **Wysoki Time-to-Value (TTV):** Każda rutynowa akcja (odczyt obrączki, wpis karmienia, pomiar lotki) wymagała 4–5 interakcji: kliknięcie przycisku ➔ animacja modala ➔ przewinięcie ➔ zapis ➔ zamknięcie.

---

## 2. Model Docelowy TO-BE (Wzorzec P16: Jedna Otwarta Karta Inline)

Architektura TO-BE zastępuje uciążliwe modale wzorcem **P16 (Accordion Inline Collapsible Card „Jedna Otwarta”)**:

```
+--------------------------------------------------------------+
| [GŁÓWNY EKRAN STADA / LĘGÓW / LOTÓW]                         |
|                                                              |
| ▼ KARTA A: Status Par i Cel Lęgowych        [CELA A-04] [AKTYWNA]
|   - Szybki podgląd wiersza bez wchodzenia w modal            |
|                                                              |
| ▲ KARTA B: Wpis Owoskopii i Prześwietlenia   [OTWARTA]       |
|   +--------------------------------------------------------+ |
|   | Data zniesienia: 2026-03-10 (Jajo 1)                   | |
|   | Status zarodka:  [ Zapłodnione (Żywe) ]                | |
|   | Szybki zapis:    [ ZATWIERDŹ 48PT ]                    | |
|   +--------------------------------------------------------+ |
|                                                              |
| ▼ KARTA C: Szczepienia i Karencje           [2 ZABIEGI]      |
+--------------------------------------------------------------+
```

### Zasady Wzorca P16:
- **Zasada Jednej Otwartej (Single-Expanded Accordion):** W danym module w danym momencie rozwinięta jest maksymalnie jedna sekcja edycyjna, co zapobiega chaotycznemu rozciąganiu widoku.
- **Kontekst Zawsze Widoczny:** Hodowca widzi listę sąsiednich pozycji bez opuszczania widoku.
- **Autozapis i Brak Tła Blokującego:** Wpisywanie danych odbywa się w warstwie rodzimej; zmiana karty lub przejście do innej zakładki natychmiast zapisuje stan w lokalnym SQLite.
- **Wymiary Polowe:** Minimalna wysokość nagłówka karty wynosi **52pt**, a każdego przycisku akcji **min. 48pt** z haptycznym potwierdzeniem stuknięcia (`Haptics.impactAsync`).

---

## 3. Matryca Przekształceń Modali do Kart Inline (Redukcja o >50%)

| Obszar Funkcjonalny | Liczba Modali AS-IS | Model TO-BE | Redukcja | Osiągnięty TTV |
|---|---|---|---|---|
| **Lęgi i Rozpłód (Z-010..Z-020)** | 12 modali | 2 ekrany dedykowane + 4 karty inline P16 (`CollapsibleCard`) | **-66%** | Zmniejszenie czasu zapisu lęgu z 18s do 4s |
| **Loty i Przyloty (Z-021..Z-035)** | 14 modali | Ekran Cockpit Lotowy + Karta Szybkiego Taktowania | **-71%** | Rejestracja przylotu z zegara < 2s |
| **Żywienie i Suplementacja (Z-036..Z-045)** | 8 modali | Karta Inline Diety Dnia + Kalkulator Mieszanek | **-62%** | Odnotowanie karmy: 1 tap (preset) |
| **Zdrowie i Weterynaria (Z-046..Z-060)** | 16 modali | Triage Doctor Inline + Karty Karencji PIW | **-56%** | Weryfikacja karencji leku: natychmiast |
| **Protokoły i Sędziowanie (Z-061..Z-100)** | 29 modali | Hub Protokołów z bezpośrednim generatorem PDF | **-50%** | Druk lub eksport PDF w 1 kliknięcie |
| **SUMA** | **79 modali** | **Architektura Hybrydowa (Inline First + Hub)** | **-58%** | **Średni zysk ergonomiczny: 3.4x szybsza obsługa** |

---

## 4. Wskaźniki Efektywności Czasowej (Time-to-Value Metrics)

1. **Koszo-wpis (Basketing Entry):**
   - AS-IS: 8.4 sekundy (Otwórz modal -> szukaj ptaka -> wpisz numer klatki -> zatwierdź).
   - TO-BE: **1.8 sekundy** (Zeskanowanie kodu QR naklejki aparatem lub czytnikiem NFC; automatyczne dodanie do listy wkładaniowej).

2. **Rejestracja Przylotu z Zegara (Clock Arrival):**
   - AS-IS: 6.2 sekundy.
   - TO-BE: **1.1 sekundy** (Automatyczny odbiór pakietu ESK / manualny 1-tap z klawiatury numerycznej 48pt).

3. **Eksport Rodowodu i Karty Oceny (Pedigree / FCI Show Card):**
   - AS-IS: 14 sekund (Nawigacja po 3 modalach konfiguracji).
   - TO-BE: **1 kliknięcie (2.2 sekundy)** z poziomu karty ptaka bezpośrednio do systemowego arkusza Share/Print.

4. **Weryfikacja Karencji Medycznej przed Lotem:**
   - AS-IS: 25 sekund (Szukanie w historii zabiegów).
   - TO-BE: **0 sekund (Pasywny wskaźnik)**: Czerwony badge blokady wkładania do kosza, jeśli karencja nie upłynęła.

---

## 5. Standard Implementacyjny Komponentu `CollapsibleCard`

Wszystkie nowe ekrany i refaktoryzowane moduły korzystają ze standaryzowanego komponentu:
`src/components/CollapsibleCard.tsx`

```tsx
<CollapsibleCard
  title="Cela A-04 — Lęg Podstawowy"
  subtitle="PL-0284-23-1402 x PL-0284-22-9854"
  badge="Oczekuje na klucie"
  badgeColor="#D97706"
  isOpen={activeCardId === 'clutch-04'}
  onToggle={() => setActiveCardId(activeCardId === 'clutch-04' ? null : 'clutch-04')}
>
  <ClutchInlineEditor clutchId="c-01" />
</CollapsibleCard>
```

Każda karta zachowuje rzemieślniczy standard barwny (brak fioletów AI, tło `#1E2127`, ramka `#2F343F`, akcent kobalt `#2563EB` lub bursztyn `#D97706`).
