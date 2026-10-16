# Rozdziały 4–6.1: Rynek, Konkurencja i Model Przychodu w Modelu Hybrydowym (A2)
## Pigeon-Fly · Cyfrowy Notes Mistrza z Architekturą Supabase

---

# Rozdział 4: Globalna Analiza Rynku i Przewagi Chmurowe

### 4.1. Wielkość Rynku i Cyfrowa Transformacja
Sport gołębiarski przechodzi głęboką transformację pokoleniową:
- Ponad **400 000 zrzeszonych hodowców** w Europie i Azji (Polska: 40 tys., Niemcy: 25 tys., Belgia: 18 tys., Tajwan i Chiny: 300 tys.+).
- Coraz powszechniejsze stają się **spółki hodowlane (Tandemy)**: 2–3 hodowców wspólnie inwestuje w materiał rozpłodowy i lotuje pod jednym szyldem. Wymaga to współdzielenia bazy danych stada w czasie rzeczywistym.
- Rynek aukcyjny (sprzedaż gołębi) osiąga obroty rzędu **kilkudziesięciu milionów euro rocznie** na czołowych platformach (PIPA, De Duif). Weryfikacja cyfrowa rodowodu staje się rynkową koniecznością.

---

### 4.2. Dlaczego Supabase Deklasuje Istniejącą Konkurencję?

| Parametr / Funkcja | Tradycyjne Programy Desktopowe (DOS/Win) | Portale Webowe (MyPigeons itp.) | Aplikacje Zegarów ESK (Benzing/Tauris) | **Pigeon-Fly (Hybryda SQLite + Supabase)** |
| :--- | :---: | :---: | :---: | :---: |
| **Praca w gołębniku bez zasięgu GSM** | ❌ Brak (tylko stacjonarny PC) | ❌ Zawiesza się / błąd sieci | ⚠️ Tylko antena zegarowa | ✅ **100% Płynne Offline (SQLite WAL)** |
| **Współpraca w tandemie (Multi-User)** | ❌ Brak | ⚠️ Płatne drogie konta | ❌ Brak | ✅ **Pełna współpraca w czasie rzecz. (RLS)** |
| **Relacje z lotu na żywo (Live Broadcast)** | ❌ Brak | ⚠️ Z opóźnieniem | ⚠️ Wymaga drogiej subskrypcji ESK | ✅ **Błyskawiczne WebSockets (Realtime)** |
| **Weryfikacja rodowodu kodem QR online** | ❌ Brak | ❌ Brak | ❌ Brak | ✅ **Publiczny portal kryptograficzny** |
| **Globalna sieć zgłaszania zagubionych ptaków** | ❌ Brak | ❌ Brak | ❌ Brak | ✅ **Lost & Found Portal z push alertem** |
| **Model cenowy** | Zazwyczaj stare licencje PC | Drogi abonament roczny | Anteny za 3 000–8 000 zł | ✅ **Freemium + Lifetime (19,99 EUR)** |

---

# Rozdział 5: Model Przychodu, Chmura Supabase i Unit Economics

### 5.1. Pakiety Cenowe i Podział Funkcjonalności

```
                  PAKIETY CENOWE PIGEON-FLY Z CHMURĄ SUPABASE
 ┌──────────────────────┬──────────────────────┬────────────────────────┐
 │ SUBSKRYPCJA MIESIĘCZ.│  SUBSKRYPCJA ROCZNA  │    ZAKUP DOŻYWOTNI     │
 │       (Sezonowa)     │   (Główny Motor)     │       (Lifetime)       │
 ├──────────────────────┼──────────────────────┼────────────────────────┤
 │   1,99 EUR / msc     │    6,99 EUR / rok    │   19,99 EUR (Jednoraz.)│
 │   (w Polsce 8,99 zł) │  (w Polsce 29,99 zł) │   (w Polsce 89,99 zł)  │
 │                      │  3 DNI DARMOWY TRIAL │  FAMILY SHARING (do 5) │
 └──────────────────────┴──────────────────────┴────────────────────────┘
```

### 5.2. Macierz Uprawnień: Free Tier vs Wersja PRO (Supabase)

| Funkcjonalność | Darmowy Rdzeń (Free Tier) | Wersja PRO (Subskrypcja / Lifetime) |
| :--- | :---: | :---: |
| **Liczba gołębi w kartotece** | **Do 10 ptaków** (stado startowe) | **Bez limitu** (nielimitowane stada) |
| **Praca w gołębniku offline (SQLite)** | ✅ Pełny dostęp | ✅ Pełny dostęp |
| **Ręczny kalkulator prędkości $m/min$** | ✅ Pełny dostęp | ✅ Pełny dostęp |
| **Lokalna kopia zapasowa SQLite / JSON** | ✅ **Zawsze 100% darmowa** | ✅ **Zawsze 100% darmowa** |
| **Replikacja w chmurze Supabase** | ❌ Brak synchronizacji | ✅ **Automatyczna bezpieczna replikacja** |
| **Multi-Device Sync (iPhone, iPad, Mac)**| ❌ Tylko jedno urządzenie | ✅ **Bezszwowa synchronizacja w locie** |
| **Tandem Hodowlany (wspólnicy)** | ❌ Brak | ✅ **Do 3 członków tandemu z rolami RLS** |
| **Live Race Broadcasting (WebSockets)** | ❌ Brak | ✅ **Transmisja przylotów na żywo** |
| **Weryfikacja Rodowodu Online (Portal QR)**| ❌ Tylko lokalny PDF | ✅ **Certyfikat online w chmurze** |
| **Sieć Pomocy Zagubionym (Lost & Found)** | ❌ Brak alertów push | ✅ **Natychmiastowe powiadomienia Push** |
| **Supabase Storage dla zdjęć 4K oka** | ❌ Tylko miniatury lokalne | ✅ **Bezstratne zdjęcia w chmurze CDN** |
| **Aplikacja Apple Watch Companion** | ❌ Podgląd | ✅ **Pełne odhaczanie przylotów** |

---

### 5.3. Ekonomia Infrastruktury Chmurowej Supabase i Rentowność

Dzięki architekturze Supabase koszty infrastruktury są niemal zerowe na starcie i idealnie skalują się z przychodami:
1. **Darmowy Tier Supabase (Free Plan):**
   - Do **50 000 Aktywnych Użytkowników Miesięcznie (MAU)**.
   - 500 MB bazy danych PostgreSQL (mieści ponad 1 000 000 rekordów ptaków!).
   - 1 GB magazynu Supabase Storage (dla zdjęć i certyfikatów PDF).
   - 200 jednoczesnych połączeń Realtime WebSockets.
   - **Koszt: 0 USD / miesiąc.**
2. **Skalowanie do Planu Płatnego (Supabase Pro Plan — 25 USD / msc):**
   - Aktywowany dopiero przy przekroczeniu 50 000 MAU lub przy zapotrzebowaniu na większy Storage.
   - Koszt 25 USD/msc pokrywa zaledwie **4 subskrypcje roczne (6,99 EUR)** lub **2 zakupy Lifetime (19,99 EUR)** miesięcznie!
3. **Masa Marżowa:**
   - Przy 1 000 użytkowników PRO roczny przychód netto studia wynosi **~21 000 – 60 000 PLN** przy kosztach infrastruktury wynoszących ok. **1 200 PLN rocznie** (marża brutto $> 95\%$).

---

# Rozdział 6.1: Zakres Pierwszego Wydania (MVP) vs Wersje Kolejne

- **Wydanie 1.0 (MVP z Supabase):**
  - Moduł 1: Cyfrowy Notes Gołębnika (karty ptaków, relacje rodzicielskie, statusy, cechy budowy).
  - Moduł 2: Skanowanie Kodów QR aparatem w lufce (Vision Framework 60 fps, timestamp ms).
  - Moduł 3: Treningi i Loty, geodezyjny kalkulator prędkości $m/min$ (formuła Vincenty'ego), ranking na żywo, neutralizacja nocna.
  - Moduł 4: Zdrowie i Pierzenie (Wizualna Karta 10 lotek ARI, kalendarz szczepień PMV-1, karencje leków).
  - Moduł 5 (Chmura Supabase):
    * Asynchroniczna synchronizacja dwukierunkowa delta (SQLite $\leftrightarrow$ Supabase),
    * Multi-device sync (iPhone + iPad),
    * Portal Weryfikacji Rodowodów Online pod kodem QR (`pigeonfly.app/pedigree/[ID]`),
    * Globalna sieć pomocy zagubionym gołębiom (Lost & Found portal z powiadomieniem Push).
  - Generator Wystawowych Rodowodów PDF A4.
  - Apple Watch Companion.
  - 100% lokalny backup SQLite/JSON do Plików i iCloud Drive.
  - Pełne 35 języków.

- **Wydanie 1.1 (Zaraz po MVP):**
  - Supabase Realtime Live Race Broadcasting (transmisje przylotów na żywo dla znajomych).
  - Moduł Tandemu Hodowlanego (współdzielenie gołębnika między 2–3 hodowcami z rolami RLS).
  - Wektor znosu wiatru i korekta aerodynamiczna.
  - Bilansowanie mieszanek paszowych 20 ziaren (Weende).
  - Import tras z miniaturowych modułów GPS/BTS przez BLE i wektorowe mapy offline.
