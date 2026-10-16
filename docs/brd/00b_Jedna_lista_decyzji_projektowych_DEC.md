# Jedna Lista Decyzji Projektowych (DEC-01 do DEC-50)
## Pigeon-Fly · Rejestr Decyzji Architektonicznych, Biznesowych i Chmurowych (Supabase)

---

### DEC-01: Zakres Pierwszego Wydania (MVP Scope)
- **Kontekst:** Wybór granic pierwszej wersji z uwzględnieniem bazy chmurowej.
- **Opcje:**
  - *Opcja A:* Wszystkie moduły łącznie z mapami wektorowymi offline i trackerami IoT.
  - *Opcja B+ (Rekomendowana):* Moduły 1, 2, 3, 4 (Stado, Rodowody z PDF i weryfikacją online, Skaner QR w lufce, Kalkulator prędkości $m/min$, Zdrowie i Pierzenie 10 lotek) + Apple Watch Companion + Podstawowa synchronizacja Supabase (backup w chmurze, multi-device, portal weryfikacji rodowodu i sieć Lost & Found).
- **Rekomendacja:** **Opcja B+**. Łączy niezrównaną funkcjonalność polową z natychmiastowym efektem „wow” chmury Supabase (weryfikacja rodowodów online i pomoc w odnalezieniu zagubionych ptaków).

---

### DEC-02: Architektura Bazy Danych i Silnika Persystencji
- **Kontekst:** Wdrożenie chmurowej bazy danych (Supabase) przy zachowaniu niezawodności w gołębniku bez zasięgu GSM.
- **Opcje:**
  - *Opcja A (Czysto lokalna):* Tylko SQLite bez chmury.
  - *Opcja B (Czysto chmurowa):* Wyłącznie Supabase z wymogiem ciągłego połączenia z internetem.
  - *Opcja C (Hybrydowa — Rekomendowana):* **Architektura Hybrydowa Offline-First:**
    1. *Lokalny magazyn operacyjny:* Baza SQLite 3 w trybie WAL na urządzeniu jako natychmiastowy cel zapisu i odczytu.
    2. *Chmura:* **Supabase PostgreSQL 16** z protokołem asynchronicznej synchronizacji delta (kolejka zmian `sync_queue`), automatycznie replikująca dane, gdy pojawi się połączenie internetowe.
- **Rekomendacja:** **Opcja C**. Eliminuje jedyną wadę tradycyjnych baz chmurowych (zawieszanie się w gołębniku), dając hodowcy pełnię zalet chmury: multi-device sync, relacje live, zweryfikowane rodowody i współpracę w tandemie.

---

### DEC-03: Formuła Obliczania Dystansu Geodezyjnego Lotu
- **Kontekst:** Obliczanie ortodromy między punktem startu a gołębnikiem.
- **Rekomendacja:** **Opcja B (Równania elipsoidalne Vincenty'ego WGS-84)** z dokładnością do $0,001\text{ m}$. Formuła zaimplementowana zarówno w silniku lokalnym w Swift, jak i jako funkcja w PostgreSQL w Supabase (`ST_Distance` z PostGIS lub czysta funkcja PL/pgSQL).

---

### DEC-04: Format Danych i Struktura Kodu QR na Obrączkach
- **Kontekst:** Mikronaklejki QR na obrączki pomocnicze (8–10 mm).
- **Rekomendacja:** **Opcja B (Ultrakompaktowy format PF1 z korekcją Level H)**: `PF1:[Kraj]:[Rok]:[Numer]:[Checksum]`. Umożliwia zarówno odczyt w aplikacji mobilnej w 15 ms, jak i natychmiastowe przekierowanie na publiczny portal zgłoszenia zagubionego ptaka (`pigeonfly.app/b/[KOD]`).

---

### DEC-05: Technologia Skanera Wizyjnego w Lufce
- **Rekomendacja:** **Opcja A (Apple Vision Framework)** z analizą w NPU w 60 fps i automatycznym doświetleniem LED.

---

### DEC-06: Model Cenowy i Granice Darmowego Rdzenia (Free Tier)
- **Kontekst:** Granice między darmowym rdzeniem a płatną subskrypcją/Lifetime.
- **Rekomendacja:** **Opcja B**. Darmowy rdzeń pozwala na prowadzenie stada do **10 gołębi** w lokalnym notesie bez konta. Wersja PRO (1,99 EUR/msc, 6,99 EUR/rok, 19,99 EUR Lifetime) odblokowuje nielimitowane stado, synchronizację Supabase, tandem hodowlany, transmisje przylotów na żywo i weryfikację rodowodów online.

---

### DEC-07: Zakup Dożywotni (Lifetime) i Family Sharing
- **Rekomendacja:** **Opcja A (Lifetime 19,99 EUR)** z aktywnym Family Sharing i dożywotnim dostępem do chmury Supabase.

---

### DEC-08: Niezawodny Backup i Suwerenność Danych
- **Rekomendacja:** **Opcja A**. Niezależnie od chmury Supabase, użytkownik zawsze ma prawo do bezpłatnego wyeksportowania bazy `.sqlite` oraz pliku `.json` do lokalnego katalogu Pliki lub prywatnego dysku.

---

### DEC-09: Ergofizyka Field Mode i Obsługa Jedną Ręką
- **Rekomendacja:** **Opcja A**. Przyciski $\ge 56 \times 56\,\text{pt}$, strefa kciuka w dolnej części ekranu, wysoki kontrast i blokada wygaszania ekranu (`isIdleTimerDisabled = true`).

---

### DEC-10: Integracja z Apple Watch
- **Rekomendacja:** **Opcja A (Apple Watch Companion)** z natychmiastową rejestracją przylotu z tarczy zegarka i parowaniem z ptakiem w telefonie.

---

### DEC-31: Wybór Dostawcy Chmury: Supabase (PostgreSQL 16)
- **Kontekst:** Wybór platformy backendowej wspierającej relacyjność, autoryzację, synchronizację na żywo i pliki.
- **Opcje:**
  - *Opcja A (Firebase):* Baza dokumentowa NoSQL. Słaba obsługa złożonych zapytań relacyjnych (drzewa genealogiczne).
  - *Opcja B (Własny VPS z Node/Postgres):* Wymaga administracji serwerem, generuje stałe koszty infrastruktury.
  - *Opcja C (Supabase — Rekomendowana):* Relacyjny PostgreSQL 16, wbudowane Row Level Security (RLS), obsługa WebSockets Realtime, Supabase Storage z CDN, Edge Functions (Deno/TypeScript) oraz darmowy tier do 50k MAU.
- **Rekomendacja:** **Opcja C (Supabase)**. Idealna harmonia z relacyjnym modelem stada i rodowodów.

---

### DEC-32: Strategia Uwierzytelniania: Zero-Friction (Anonimowy Start $\rightarrow$ Apple Sign-In)
- **Kontekst:** Tradycyjni hodowcy nienawidzą zakładać kont przed rozpoczęciem pracy.
- **Opcje:**
  - *Opcja A:* Wymuszone logowanie e-mailem i hasłem na pierwszym ekranie.
  - *Opcja B (Rekomendowana):* **Zasada Zero-Friction:** Aplikacja startuje natychmiast z lokalną bazą SQLite lub z anonimową sesją Supabase Auth (`signInAnonymously()`). Dopiero gdy użytkownik chce włączyć tandem hodowlany, Live Broadcast lub synchronizację z drugim urządzeniem, 1-tapem łączy konto z **Sign in with Apple**.
- **Rekomendacja:** **Opcja B**. Zachowuje genialną prostotę wejścia i eliminuje jakiekolwiek bariery rejestracyjne.

---

### DEC-33: Protokół Synchronizacji Danych i Rozstrzyganie Konfliktów
- **Kontekst:** Ptak może zostać zmodyfikowany na iPadzie w domu i na telefonie w gołębniku offline.
- **Rekomendacja:** Protokół **Delta Sync** ze stemplem czasu `updated_at` (UTC) i strategią **Last-Write-Wins (LWW)** dla pól konfiguracyjnych oraz **Append-Only Event Sourcing** dla rejestracji przylotów z lotu (przyloty nigdy się nie nadpisują – każdy timestamp jest unikalnym zdarzeniem).

---

### DEC-34: Uprawnienia i Bezpieczeństwo RLS dla Tandemów Hodowlanych
- **Kontekst:** Spółki hodowlane (np. ojciec i syn, dwóch wspólników) zarządzają tym samym gołębnikiem z różnych telefonów.
- **Rekomendacja:** Tabela `loft_members` w Supabase z politykami RLS:
  - Rola `OWNER` (Mistrz): pełna kontrola, usuwanie stada, zarządzanie subskrypcją.
  - Rola `MEMBER` (Wspólnik): dodawanie ptaków, koszowanie, skanowanie przylotów, edycja zdrowia.
  - Rola `VIEWER` (Gość/Obserwator): podgląd stada i wyników na żywo bez prawa edycji.

---

### DEC-35: Transmisje Przylotów na Żywo (Live Race Broadcasting)
- **Kontekst:** Dzielenie się emocjami w dniu lotu z rodziną i kolegami z klubu.
- **Rekomendacja:** Wykorzystanie **Supabase Realtime Broadcast Channels**. Hodowca generuje kod/link transmisji (np. `pigeonfly.app/live/KOWALSKI-2026`). Każdy przylot zarejestrowany w lufce pojawia się natychmiast na ekranach kibiców w ułamku sekundy z prędkością $m/min$.

---

### DEC-36: Zweryfikowany Cyfrowy Paszport Rodowodu (Anti-Counterfeit Portal)
- **Kontekst:** Fałszowanie rodowodów przy sprzedaży wartościowych ptaków.
- **Rekomendacja:** Każdy wygenerowany rodowód otrzymuje kryptograficzny podpis SHA-256 i wpis w tabeli `verified_pedigrees` w Supabase. Na wydruku A4 umieszczany jest kod QR z linkiem `pigeonfly.app/pedigree/[ID]`. Zeskanowanie kodu aparatem dowolnego telefonu wyświetla oficjalny certyfikat hodowli, potwierdzający autentyczność rodowodu i wyników lotowych.

---

### DEC-37: Globalna Sieć Pomocy Zagubionym Gołębiom (Lost & Found Network)
- **Kontekst:** Dziesiątki tysięcy gołębi gubią się po nawałnicach. Znalazcy nie wiedzą, jak skontaktować się z hodowcą.
- **Rekomendacja:** Publiczny, bezpieczny formularz webowy `pigeonfly.app/znaleziony`. Po wpisaniu numeru obrączki lub zeskanowaniu mikronaklejki QR Supabase Edge Function natychmiast wysyła dyskretne powiadomienie Push do zarejestrowanego właściciela z numerem telefonu lub adresem znalazcy, bez upubliczniania prywatnych danych hodowcy.

---

### DEC-38: Przechowywanie Fotografii 4K w Supabase Storage
- **Kontekst:** Wystawowe zdjęcia makro tęczówki oka (Eye-Sign) i skrzydła wymagają najwyższej rozdzielczości.
- **Rekomendacja:** Na urządzeniu przechowywana jest zoptymalizowana miniatura JPEG, a oryginalny bezstratny plik trafia do zabezpieczonego bucketa **Supabase Storage** z globalną siecią CDN, zasilając podgląd w cyfrowym paszporcie rodowodu.

---

### DEC-39: Brama Telemetrii IoT przez Supabase Edge Functions
- **Kontekst:** Miniaturowe trackery montowane na ptakach przesyłają pakiety telemetryczne.
- **Rekomendacja:** Wdrożenie endpointu w **Supabase Edge Functions** (Deno/TypeScript), który przyjmuje pakiety telemetryczne (np. przez sieć komórkową modułu lub BLE Gateway), przetwarza współrzędne i transakcyjnie zapisuje punkty trasy w PostgreSQL.

---

### DEC-40 do DEC-50: Dodatkowe Decyzje Operacyjne
- **DEC-40:** Retencja danych transmisji live (czyszczenie kanałów realtime po 48h od zakończenia lotu).
- **DEC-41:** Ograniczenie rozmiaru magazynu Storage (maksymalnie 10 MB na ptaka w wersji Pro).
- **DEC-42:** Prywatne Mini-Derby Sekcji (agregacja wyników $m/min$ z kilku gołębników do wspólnej tabeli).
- **DEC-43 do DEC-50:** Procedury odzyskiwania konta przy utracie urządzenia, mechanizm eksportu danych zgodnie z RODO/GDPR oraz audyt bezpieczeństwa RLS.
