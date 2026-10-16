# Rozdział 8: Reguły Dziedzinowe, Matematyka i Fizyka Lotu (C1)
## Pigeon-Fly · Kanon Obliczeniowy i Wektory Testowe (RD-01 do RD-35)

---

### RD-01: Precyzyjna Odległość Geodezyjna Vincenty'ego (Elipsoida WGS-84)
- **Kategoria:** Geodezja / Matematyka Wyższa · **Tier:** 1 (Ścisły Rachunek Źródłowy)
- **Zastosowanie:** Obliczanie urzędowej odległości w linii prostej między stacją startową a gołębnikiem.
- **Równania:**
  Dla elipsoidy WGS-84 o półosi wielkiej $a = 6378137,0\text{ m}$, spłaszczeniu $f = 1 / 298,257223563$ i półosi małej $b = a(1 - f)$:
  Szerokości zredukowane:
  $$U_1 = \arctan((1 - f) \tan \phi_1), \quad U_2 = \arctan((1 - f) \tan \phi_2)$$
  Różnica długości geograficznej $L = \lambda_2 - \lambda_1$. Iteracyjne wyliczenie różnicy na sferze pomocniczej $\lambda$:
  $$\sin \sigma = \sqrt{(\cos U_2 \sin \lambda)^2 + (\cos U_1 \sin U_2 - \sin U_1 \cos U_2 \cos \lambda)^2}$$
  $$\cos \sigma = \sin U_1 \sin U_2 + \cos U_1 \cos U_2 \cos \lambda, \quad \sigma = \arctan2(\sin \sigma, \cos \sigma)$$
  $$\sin \alpha = \frac{\cos U_1 \cos U_2 \sin \lambda}{\sin \sigma}, \quad \cos^2 \alpha = 1 - \sin^2 \alpha$$
  $$\cos(2\sigma_m) = \cos \sigma - \frac{2 \sin U_1 \sin U_2}{\cos^2 \alpha}$$
  $$C = \frac{f}{16} \cos^2 \alpha [4 + f(4 - 3 \cos^2 \alpha)]$$
  Iteracja kończy się, gdy $|\lambda - \lambda_{poprz}| < 10^{-12}$. Ostateczna odległość $s$:
  $$u^2 = \cos^2 \alpha \left( \frac{a^2 - b^2}{b^2} \right)$$
  $$A = 1 + \frac{u^2}{16384} [4096 + u^2(-768 + u^2(320 - 175 u^2))]$$
  $$B = \frac{u^2}{1024} [256 + u^2(-128 + u^2(74 - 47 u^2))]$$
  $$\Delta \sigma = B \sin \sigma \left\{ \cos(2\sigma_m) + \frac{B}{4} \left[ \cos \sigma (-1 + 2\cos^2(2\sigma_m)) - \frac{B}{6} \cos(2\sigma_m) (-3 + 4\sin^2 \sigma) (-3 + 4\cos^2(2\sigma_m)) \right] \right\}$$
  $$s = b \cdot A \cdot (\sigma - \Delta \sigma)$$
- **Wektor Testowy:**
  - Punkt A (Gołębnik): $52,408333^\circ\text{ N}, 16,917222^\circ\text{ E}$
  - Punkt B (Stacja Wypuszczenia): $52,520000^\circ\text{ N}, 13,405000^\circ\text{ E}$
  - Oczekiwany wynik: $s = 238\,845,18\text{ metrów} \pm 0,05\text{ m}$.

---

### RD-02: Formuła Haversine'a (Fallback Sferyczny)
- **Kategoria:** Geodezja · **Tier:** 1
- **Zastosowanie:** Zabezpieczenie przed brakiem zbieżności w rzadkich punktach quasi-antypodalnych.
- **Równanie:**
  $$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
  gdzie promień Ziemi $R = 6371008,8\text{ m}$.

---

### RD-03: Oficjalna Prędkość Lotu w Metrach na Minutę ($m/min$)
- **Kategoria:** Regulamin FCI / PZHGP · **Tier:** 2 (Oficjalne Normy Związkowe)
- **Zastosowanie:** Oficjalna miara prędkości w listach konkursowych.
- **Równanie:**
  $$v = \frac{d_{\text{metry}}}{T_{\text{minuty}}}$$
  gdzie czas $T$ wyrażony jest w minutach z dokładnością do ułamka sekundy:
  $$T_{\text{minuty}} = (H_{przylot} - H_{start}) \times 60 + (M_{przylot} - M_{start}) + \frac{S_{przylot} - S_{start}}{60}$$
- **Wektor Testowy:**
  - Dystans: $520\,000\text{ m}$
  - Czas startu: `06:00:00`
  - Czas przylotu: `12:45:30`
  - Czas trwania: $405\text{ minut } 30\text{ sekund} = 405,5\text{ min}$
  - Prędkość: $v = \frac{520000}{405,5} = 1282,367\dots \approx 1282,37\text{ m/min}$.

---

### RD-04: Współczynnik Konkursowy (Coeff)
- **Kategoria:** Regulamin FCI / Mistrzostwa Świata · **Tier:** 2
- **Zastosowanie:** Klasyfikacja asów lotowych (Ace Pigeon) na szczeblu krajowym i międzynarodowym (im mniejszy coeff, tym wybitniejszy wynik!).
- **Formuła FCI:**
  $$\text{Coeff} = \frac{\text{Pozycja zdobyta na liście konkursowej}}{\text{Liczba gołębi włożonych na lot}} \times 100 \quad [\text{lub } \times 1000 \text{ wg reguł kat. Olimpijskiej}]$$
- **Wektor Testowy:**
  - Gołąb zajął 3. miejsce w oddziale na 2 400 włożonych ptaków.
  - $\text{Coeff} = \frac{3}{2400} \times 100 = 0,125$ (wynik wybitny!).

---

### RD-05: Współczynnik Inbredu Sewalla Wrighta ($F$)
- **Kategoria:** Genetyka Populacyjna · **Tier:** 1 (Biomatematyka)
- **Zastosowanie:** Mierzenie stopnia pokrewieństwa i homozygotyczności pary.
- **Formuła:**
  $$F_X = \sum \left( \frac{1}{2} \right)^{n_1 + n_2 + 1} (1 + F_A)$$
- **Wektory Testowe:**
  - Ojciec x Córka (matka córki niespokrewniona): $n_1 = 0, n_2 = 1 \implies F = (0,5)^{0 + 1 + 1} = (0,5)^2 = 0,25$ ($25\%$).
  - Brat x Siostra (wspólni rodzice A i B):
    $$F = (0,5)^{1 + 1 + 1} + (0,5)^{1 + 1 + 1} = 0,125 + 0,125 = 0,25 \quad (25\%)$$
  - Kuzyn x Kuzynka (wspólni dziadkowie):
    $$F = (0,5)^{2 + 2 + 1} + (0,5)^{2 + 2 + 1} = 0,03125 + 0,03125 = 0,0625 \quad (6,25\%)$$

---

### RD-06: Wektorowa Analiza Znosu Wiatru (Aero Speed)
- **Kategoria:** Fizyka / Aerodynamika · **Tier:** 1
- **Równania:**
  - Azymut trasy przelotu: $\theta_{trasa}$
  - Kierunek z którego wieje wiatr: $\theta_{wiatr}$ (kierunek wektora wiatru: $\theta_{w} = \theta_{wiatr} + 180^\circ$)
  - Różnica kątowa: $\Delta \theta = \theta_{w} - \theta_{trasa}$
  - Składowa wzdłużna (czołowa/plecowa): $V_{\parallel} = V_w \cos(\Delta \theta)$
  - Składowa poprzeczna (boczna): $V_{\perp} = V_w \sin(\Delta \theta)$
  - Prędkość znormalizowana (moc aerodynamiczna ptaka):
    $$V_{aero} = \sqrt{(V_{ziemia} - V_{\parallel})^2 + V_{\perp}^2}$$

---

### RD-07: Wskaźnik Gotowości Aerodynamicznej Skrzydła (ARI)
- **Kategoria:** Fizjologia Ptaków / Aerodynamika · **Tier:** 3 (Podręczniki Weterynarii)
- **Wagi Poszczególnych Lotek I Rzędu w Sile Ciągu:**
  $$\text{Wagi } w_i: \quad L_1..L_4 = 0,05 \text{ każda}, \quad L_5..L_7 = 0,10 \text{ każda}, \quad L_8 = 0,20, \quad L_9 = 0,25, \quad L_{10} = 0,25$$
  $$\sum_{i=1}^{10} w_i = 1,00$$
- **Formuła:**
  $$\text{ARI} = \sum_{i=1}^{10} w_i \cdot s_i$$
  gdzie $s_i \in \{1,0 \text{ (pełna)}, 0,75 \text{ (odrasta 3/4)}, 0,50 \text{ (odrasta 1/2)}, 0,25 \text{ (odrasta 1/4)}, 0,0 \text{ (wypadła)}\}$.
- **Interpretacja:**
  - $\text{ARI} \ge 0,90$: Pełna gotowość do lotów maratońskich i trudnych.
  - $0,80 \le \text{ARI} < 0,90$: Dopuszczenie do lotów krótkich (kat. A).
  - $\text{ARI} < 0,80$: Bezwzględny zakaz koszowania (zagrożenie kalectwem).

---

### RD-08 do RD-35: Zestawienie Formuł Dodatkowych
- **RD-08 (Cykl Jaj):** Czas między 1. a 2. jajem wynosi $44 \pm 2\text{ godziny}$. Czas inkubacji: $18\text{ dni } \pm 12\text{ godzin}$.
- **RD-09 (Obrączkowanie):** Okno anatomiczne zamyka się między $6.$ a $8.$ dniem życia pisklęcia.
- **RD-10 (Białko w Paszy):** Zapotrzebowanie w okresie lęgów: $16–18\%$; w okresie lotów krótkich: $12–14\%$; w okresie pierzenia: $15–17\%$ (z wysokim udziałem metioniny).
- **RD-11 (Tłuszcze przed Lotem):** Poziom tłuszczu w diecie przed lotem maratońskim podnoszony do $8–11\%$ (orzeszki, konopie).
- **RD-12 (Pojemność Wola):** Objętość wola gołębia dorosłego wynosi $25–35\text{ ml}$ wody lub $20–30\text{ g}$ spęczniałego ziarna.
- **RD-13 do RD-35:** Parametry fotoperiodyczne ciemni (14 h ciemności/dobę), stężenie elektrolitów po locie ($300\text{ mOsm/L}$), dawki kwasów organicznych (ocet jabłkowy: $5\text{ ml/L}$ wody, pH 4,5–5,0 przeciw rzęsistkowicy).
