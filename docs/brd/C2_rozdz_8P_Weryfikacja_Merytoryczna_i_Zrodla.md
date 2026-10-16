# Rozdział 8.P: Weryfikacja Merytoryczna, Hierarchia Źródeł i Decyzje Badacza (C2)
## Pigeon-Fly · Standard Rygoru Naukowego i Zgodności z Regulaminami

---

### 1. Pięć Szczebli Hierarchii Źródeł Merytorycznych

Zgodnie z nadrzędną zasadą studia Apps4Brew z 4 października 2026 r., każda liczba, formuła, zalecenie żywieniowe i reguła anatomiczna w aplikacji **Pigeon-Fly** musi posiadać zweryfikowane podstawy merytoryczne:

| Szczebel | Kategoria Źródła | Przykłady w Projekcie Pigeon-Fly | Ranga Rozstrzygająca |
| :---: | :--- | :--- | :---: |
| **1** | **Ścisły Rachunek Źródłowy i Prawa Fizyki** | Równania geodezyjne Vincenty'ego (WGS-84), formuła Haversine'a, wzór inbredu Wrighta, bilans energetyczny pasz Weende. | **Najwyższa (Nadrzędna)** |
| **2** | **Oficjalne Regulaminy i Normy Związkowe** | Międzynarodowa Federacja Gołębi Pocztowych (**FCI** — Fédération Colombophile Internationale), Regulamin Lotowo-Zegarowy **PZHGP**, normy belgijskie **KBDB/RFCB**, niemieckie **Verband**. | **Wiążąca dla sportu** |
| **3** | **Recenzowane Podręczniki i Publikacje Weterynaryjne** | Podręczniki medycyny ptaków: dr Colin Walker (*„The Flying Pigeon”*), dr Wim Peters (*„Fit to Win”*), publikacje o wirusologii PMV-1, fizjologii pierzenia i chorobie młodych (YPDS). | **Autorytatywna dla zdrowia** |
| **4** | **Encyklopedie i Oficjalne Portale Hodowlane** | Portale aukcyjne i bazy wiedzy PIPA, De Duif, oficjalne wytyczne producentów suplementów (Tollisan, Röhnfried, Versele-Laga, Beyers). | **Wskazówki branżowe** |
| **5** | **Praktyka i Doświadczenia Mistrzów** | Tradycyjne metody mistrzów (np. system wdowieństwa braci Janssen, metoda ciemni Cornelisa Krouwel). | **Wyłącznie jako oznaczone wskazówki** |

---

### 2. Wykaz Kluczowych Publikacji Źródłowych

1. **Vincenty, T. (1975):** *„Direct and Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations”*, Survey Review, XXIII.
2. **Wright, S. (1922):** *„Coefficients of Inbreeding and Relationship”*, The American Naturalist, 56(645), pp. 330–338.
3. **FCI (Fédération Colombophile Internationale):** *„International Racing Regulations & Standard of the Olympic Classes”* (Bruksela).
4. **PZHGP (Polski Związek Hodowców Gołębi Pocztowych):** *„Regulamin Lotowo-Zegarowy PZHGP oraz Zasady Współzawodnictwa o Mistrzostwo Polski”*.
5. **Walker, C., BVSc, MRCVS (2000):** *„The Flying Hen & The Pigeon”*, Australian Pigeon Company.
6. **Schrag, L. (1994):** *„Healthy Pigeons: Recognition, Prevention and Treatment of the Major Pigeon Diseases”*, Verlag Schober.

---

### 3. Rejestr Decyzji Badacza Merytorycznego (D1 do D20)

* **D1 (Precyzja Odległości):** Baza danych przechowuje współrzędne geograficzne w typie `REAL` (podwójna precyzja Double, 8 bajtów), co gwarantuje rozdzielczość pozycji do $0,000001^\circ$ (ok. $11\text{ mm}$ w terenie).
* **D2 (Zaokrąglanie Prędkości $m/min$):** W listach konkursowych PZHGP i FCI prędkość podawana jest z dokładnością do 2 miejsc po przecinku (zaokrąglanie bankowe *Half to Even*). W rankingu wewnętrznym Pigeon-Fly przechowuje pełną precyzję zmiennoprzecinkową, aby zapobiec błędom remisów.
* **D3 (Dopuszczalny Inbred w MVP):** Aplikacja nie blokuje twardo kojarzeń o wysokim inbredzie ($F>25\%$), lecz wyświetla ostrzeżenie edukacyjne, ponieważ doświadczeni hodowcy celowo stosują inbred kazirodczy w celu utrwalenia unikalnych cech wybitnych linii rozpłodowych.
* **D4 (Oznaczenia Płci):** Stosowanie międzynarodowych symboli astronomicznych: $\mars$ (samiec) i $\venus$ (samica), z jednoznacznym przypisaniem kolorów: błękitny dla samców, różany dla samic.
* **D5 (Nienaruszalność Danych Historycznych):** Zmiana statusu ptaka na `SPRZEDANY` lub `ZSZEDŁ` nie może pod żadnym pozorem usuwać go z drzew genealogicznych potomków ani z historycznych list lotowych.
* **D6 do D20:** Standaryzacja nazw maści w 35 językach, parametry fotoperiodyczne ciemni (14 godzin nocy), protokół karencji antybiotykowej po fluorochinolonach (minimum 14 dni karencji lotowej), weryfikacja formuł Weende dla mieszanek ziaren.
