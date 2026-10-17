# YEP 2026 plan: targets, levers and war-room (24/11–4/12/2026, 11 days)

For: Amir (CEO). Owners: Syahmi (Product & Supply), Hussaini (Sales), Rahiim (CX & Ops), Amir (Marketing, Finance, Tech).
Prepared 17/10/2026. Final version after three independent verifications (see section 7).

**Sources**
- Analyst reports in `out/`: baseline.md, wigs.md, tc.md, levers.md. Verifier reports: verify_numbers.md, verify_realism.md, verify_execution.md.
- Re-checks on `sales_raw_full.csv` (closed_time to 17/10/2026; Closed + Modified + Payment; Amount; Pax; depart_date; tc) and `promo_Raw.csv` (Revenue, Closed Leads, Closed Pax).
- Scripts: `scratchpad/scripts/plan/a1–a8.py` (draft) and `scratchpad/scripts/final/f1–f3.py` (final re-checks), run with `python3 -I`.
- "JT" means GT. Anything labelled ASSUMPTION is a judgement, not data.

**KPI definition (new, binding).** Every YEP target in this plan is **CRM revenue with closed_time 24/11–4/12/2026, all statuses**. This is the number the war-room can see hourly. promo_Raw attribution is reported alongside but runs 0–21% higher (it books late entries: MYP 26 promo_Raw JT RM8.19M vs CRM-window RM6.75M = 1.21x; YES 25 1.00x; YES 24 1.06x). All historical comparisons below are on the CRM basis unless marked.

---

## 0. Where I overrode the analysts (read first)

baseline.md and wigs.md used the old sales file, which ends 21/05/2026. The repaired file changes three conclusions.

**1. The JT base is higher than baseline.md said.**

| Period (vs same period 2025) | JT revenue | JT pax |
|---|---|---|
| Non-promo days, 1/6–17/10/2026 | +113% | +110% |
| 1–17/10/2026 | +95% | |
| 7/9–17/10/2026 (post-MF), per day | +123% | |

- **Business-as-usual JT runs at RM336–364k/day** (1–17/10 and 7/9–17/10). Weekly rates since MF range 324–419k/day with no clear decline. YES 25's promo rate was RM333k/day (CRM). An ordinary October day now sells as much JT as a YES 25 promo day did.
- **No-promo JT counterfactual for 24/11–4/12: RM4.78M** (mean of four methods, RM410–469k/day). **Range RM4.3–4.8M** (low end = weakest post-MF week 324k × 1.22 seasonal step-up × 11). About 840 pax at ARPP 5,680.

**2. PT is worse than baseline.md said.**
- 1–17/10/2026 PT revenue −46%, pax −51% YoY. YTD (1/1–17/10) −26% revenue, −34% pax.
- Only **10 PT pax for 2027 departures were booked 1–17/10/2026**, against 68 a year earlier (−85%). 2027 PT on books is 633 pax vs 908 a year earlier (−30%).
- **PT counterfactual is RM0.34M**, trend-corrected (Oct-26 23.1k/day × 1.34 2025 Oct→window step-up × 11), not the draft's RM0.45M.

**3. 2027 on-the-books is now measurable.**
- At 17/10/2026: **4,674 JT pax / RM26.6M** booked for 2027 departures, 2.10x the 2,225 pax on books for 2026 at 17/10/2025. PT 633 pax / RM1.64M. UH-GT 7 pax.
- 2026 full-year JT estimate **18,568 pax** (11,143 departed/departing Jan–Oct + 6,555 Nov–Dec on books ÷ 0.883). WIGS GT commit (44,414) = **2.39x 2026**. Actual growth history: 1.54–1.61x/yr.
- WIGS PT (8,369) = 1.32x a 2026 PT estimate of 6,360.

---

## 1. Executive summary

1. **Commit RM10.1M for YEP 26 (≈1,975 pax), CRM basis. Floor RM7.65M, stretch RM13.15M.**
   - JT: RM9.0M / 1,585 pax. PT: RM0.65M / 265 pax. UH-GT: RM0.22M / 20 pax (30 if Ramadan blocks confirmed by 31/10). Other: RM0.2M.
   - On CRM basis that is +54% on YES 24 (RM6.55M), 2.0x YES 25 (RM5.03M), and +6% on YES 25 + POST YES 25 combined (RM9.48M over 24 days) in 11 days.
   - On promo_Raw attribution it equals about **RM10.1–12.2M**, i.e. the draft's RM11.5M ambition, stated on a basis we can track.
   - JT needs **+RM4.2M incremental** over the counterfactual (1.88x), close to the best non-MATTA promo ever (MYP 26: +RM4.47M). **High but realistic: about 50–55% probability (ASSUMPTION).**
   - The draft's RM11.5M (CRM) would need +RM5.2M incremental JT, 17% above the record: about 35–40% likely. It becomes the **stretch-1 bonus kicker**.
2. **Single most important insight: YEP has to be a seat-filling event for Jan, Mar and May 2027, not a generic sale.**
   - WIGS plans RM3.79M of deposits falling due Jul–Oct 2026 on 12,944 Jan–Apr 2027 GT seats (WIGS investment model; payment and attrition terms "TBC" on all 58 rows, to be verified).
   - Per-month booking curves put Jan–Apr at **about 8.8k pax (≈68% fill)**: Apr on track (≈103%), but **Jan 53%, Mar 48% (biased low by Ramadan 2026), Feb 13% of 262 seats**. May 2027 (5,822 seats; RM1.85M deposit due Nov 2026) is pacing to 61%.
   - Seats are not short in aggregate (Jan–May: 18,766 seats, 3,304 booked = 17.6%). The gaps are specific departures: Turki Mar 45/552, May 64/768; Switzerland-Italy Mar 15/300; Seoul Mar 36/440, May 29/640. **Price, creative and TC incentives go to those departures.** Seoul Jan is already 74% sold: steer it to Mar/May.
3. **WIGS 2027 GT cannot be reached through YEP.**
   - At commit, 2027 GT on-books at 31/12/2026 ≈ **9,180 pax (21% of commit)**. Being on track would need 12.0–13.9k.
   - On the historical 31/12 booked share (25.8–31.4%), 2027 lands at **29.2k–35.6k, 66–80% of 44,414**. A WIGS-sized YEP only moves it to 75–91%.
   - **Recommendation:** re-forecast WIGS GT to about **36k** as commit (44.4k as stretch); negotiate staged May/Jun 2027 deposits in W1–W2.
4. **PT is in structural decline. Target it to hold trend-adjusted YES 25, not WIGS.**
   - PT commit RM0.65M = trend-adjusted YES 25 (0.96M × 0.54–0.66 = 0.52–0.63M) plus a modest lever. The WIGS-required RM1.6M is not a target.
   - The fix is product-led (private version of each hero JT, long-haul fixed-price PT), done after YEP as much as before.
5. **The binding constraint is closing throughput, not leads or seats.**
   - Commit needs **≈608 closed leads = 55/day**, 1.07x MYP 26's record 51.6/day (promo_Raw). With Robot1 (online) taking 7–25%, humans must close 41–51/day ≈ **16–20 human TCs** at MYP productivity (2.6 closings/TC/day) vs 16 at MYP 26.
   - Leads needed: **≈3,900–5,100 (355–460/day)**, at 12–15.6% closed leads per in-promo lead (MYP 26 benchmark). Not the draft's 9,420.
   - Concentration: **Ikhwan + Robot1 = 60% of CRM rows since 7/9** (36.7% + 24.5%). Ikhwan's login had ~0 rows May 2024–Dec 2025, then 150–280/month in 2026: confirm it is one person, not a shared entry login.
   - **Levers needed: about +RM2.9M net over a YES 25-sized base. Realistic: +2.0–4.0M.**

---

## 2. Target table

### 2a. Method

Target = no-promo counterfactual for the 11 days + an **incremental** lift judged achievable. I switched from multiplicative uplift to incremental RM because multiplicative uplift falls as the base rises (r = −0.64 across six non-MATTA promos).

**JT counterfactual: RM4.78M (range 4.3–4.8M).**

| Method | Calculation | Daily rate |
|---|---|---|
| c1 | Oct 1–17/2026 RM336k × 2025 step-up (24/11–4/12/25 RM210k ÷ Oct 1–17/25 RM172k = 1.22) | RM410k |
| c2 | 7/9–17/10/2026 RM364k × 1.287 | RM469k |
| c3 | 2025 window (RM2.31M) × Jun–Oct non-promo YoY (2.13) ÷ 11 | RM448k |
| c3b | 2025 window × Oct YoY (1.95) ÷ 11 | RM410k |

**History, CRM basis (all from `sales_raw_full.csv`, pre-30-day base vs promo window):**

| Promo | JT base/day | JT promo/day | JT mult. | **JT incremental RM** | PT incremental RM |
|---|---|---|---|---|---|
| MYP 25 | 147k | 228k | 1.55x | 0.81M | 0.38M |
| YES 25 | 197k | 333k | 1.69x | 1.63M | 0.20M |
| PRE MF 9/26 | 309k | 563k | 1.82x | 2.29M | −0.10M |
| YES 24 | 135k | 452k | 3.35x | 3.49M | 0.71M |
| MYP 26 (record) | 207k | 614k | 2.96x | **4.47M** | 0.31M |
| **YEP 26 commit** | **≈434k** | **≈818k** | **1.88x** | **≈4.2M** | ≈0.31M |

MATTA Fairs are excluded (physical fair, walk-in buyers).

**Conversion assumptions.**
- Pax per closed lead (2026 promos, promo_Raw): JT 3.1, PT 4.56, UH-GT 1.95, other 3.6.
- **Closed leads per in-promo lead: 12–15.6% (ASSUMPTION).** 15.6% = MYP 26 568 closed leads ÷ (331 leads/day Sheet7 × 11); 12% is a conservative case. Promo closings include leads captured earlier, so this is not a same-day close rate (Sheet7 same-day = 6.3%, 2 days only). Lead counts are directional until the SleekFlow DB is read.

### 2b. Targets by segment

**JT/GT (WIGS "GT")**

| Level | Revenue RM | Pax | ARPP | Closed leads | Closings/day | Incremental vs CF | Mult. |
|---|---|---|---|---|---|---|---|
| FLOOR | 7.00M | 1,232 | 5,680 | 397 | 36 | +2.2M (≈PRE MF 9/26) | 1.46x |
| **COMMIT** | **9.00M** | **1,585** | **5,680** | **511** | **46** | **+4.2M (≈MYP 26)** | **1.88x** |
| STRETCH | 11.50M | 2,025 | 5,680 | 653 | 59 | +6.7M (new record) | 2.41x |
| WIGS-required (wigs.md) | 16.16M | 2,900 | 5,570 | 936 | 85 | +11.4M | 3.38x |

- ARPP 5,680 = Oct-2026 JT ARPP (5,685); 2027 on-books ARPP 5,695.
- Comparisons (CRM window): YES 24 RM4.97M, YES 25 RM4.00M, YES 25 + POST RM7.41M, MYP 26 RM6.75M. Commit = 1.81x YES 24, 2.25x YES 25, +33% on MYP 26.
- **Why the floor is RM7.0M:** counterfactual plus an increment between YES 25 and PRE MF 9/26. Below it, YEP added less than our weakest recent promo.

**PT**

| Level | Revenue RM | Pax | ARPP | Closed leads |
|---|---|---|---|---|
| FLOOR | 0.45M | 184 | 2,450 | 40 |
| **COMMIT** | **0.65M** | **265** | **2,450** | **58** |
| STRETCH | 0.90M | 367 | 2,450 | 80 |

- Counterfactual RM0.34M + historical PT increment 0.2–0.3M (YES 25 0.20M, MYP 26 0.31M).
- ARPP 2,450: 2026 promo PT ARPP ranged 1,818–2,460 (pooled 2,190); Oct-2026 PT ARPP was 2,979. At 2,190 the commit needs 297 pax.
- YES 25 PT (CRM) was RM0.92M; YES 24 RM1.34M. The commit is −29% on YES 25, in line with −46% Oct trend.
- **Leakage:** about 29% of PT pax booked in this window depart Dec 2026 (2025 window: 71% next-year), so they do not feed WIGS 2027.

**UH-GT (no WIGS line; set bottom-up)**

| Level | Revenue RM | Pax | ARPP | Closed leads |
|---|---|---|---|---|
| FLOOR | 0.10M | 10 | 10,000 | 5 |
| **COMMIT** | **0.22M** | **20** | **11,000** | **10** |
| STRETCH | 0.40M | 35 | 11,400 | 18 |

- MYP 26 sold 31 UH-GT pax / RM0.31M (CRM); MF 9/26 13 pax / RM0.14M. Oct 2026: 2 pax; 7 on books for 2027.
- **Raise the commit to 30 pax / RM0.33M only if Syahmi confirms Ramadan-2027 hotel and air blocks by 31/10.** Otherwise UH stays at 20 and sells always-on.

**Other (CT/ST/BT/IT/WT; report only)**

| Level | Revenue | Pax | Closed leads |
|---|---|---|---|
| FLOOR | 0.10M | 53 | 15 |
| COMMIT | 0.20M | 105 | 29 |
| STRETCH | 0.35M | 175 | 48 |

Lumpy (corporate/group bookings can add RM0.5M+). Low confidence.

### 2c. Totals (CRM closed_time 24/11–4/12/2026)

| Level | Revenue | Pax | Closed leads | Closings/day | Leads needed (12–15.6%) | vs YES 24 (6.55M) | vs YES 25 (5.03M) | vs WIGS-req GT+PT (17.76M) |
|---|---|---|---|---|---|---|---|---|
| FLOOR | **RM7.65M** | 1,479 | 457 | 42 | 2,900–3,800 | +17% | 1.52x | 43% |
| **COMMIT** | **RM10.07M** | **1,975** | **608** | **55** | **3,900–5,100** | **+54%** | **2.00x** | **57%** |
| STRETCH | **RM13.15M** | 2,602 | 796 | 72 | 5,100–6,600 | +101% | 2.61x | 74% |

**Recommendation:** commit the company to **RM10.1M** (CRM basis). TC bonus from floor upward; **stretch-1 kicker at RM11.5M**, stretch-2 at RM13M+. Publish per segment. **Do not let JT over-delivery hide a PT or UH miss.**

**Conditions, or cut to floor:** (1) ≥20 JT-selling heads (incl. surge staff) confirmed for 24/11–4/12 by 9/11; (2) price-to-fill list for Jan/Mar/May hero departures priced by 1/11; (3) SleekFlow DB access by W2.

**Daily pace curve (ASSUMPTION; YES 24, YES 25, MYP 26 shape: first 3 days ≈17%, last 3 days ≈52%).** There is no precedent for a late-November promo, so D3/D5 are soft signals; only D5 triggers spend.

| Checkpoint | FLOOR | COMMIT | STRETCH |
|---|---|---|---|
| End of D3 (Thu 26/11) | 1.30M | 1.71M | 2.24M |
| End of D5 (Sat 28/11) | 2.25M | 2.96M | 3.87M |
| End of D8 (Tue 1/12) | 3.67M | 4.83M | 6.31M |
| End of D11 (Fri 4/12) | 7.65M | 10.07M | 13.15M |

---

## 3. How YEP ladders into WIGS 2027

| Segment | WIGS commit pax | Revenue |
|---|---|---|
| GT (80% + 60% new) | 44,414 | RM251.7M |
| PT | 8,369 | RM20.9M |
| UH | no line | – |

**GT ladder, pax for 2027 departures**

| | FLOOR | **COMMIT** | STRETCH | WIGS-req YEP |
|---|---|---|---|---|
| On books at 17/10/2026 | 4,674 | 4,674 | 4,674 | 4,674 |
| + non-promo 18/10–23/11 (2025 flow 764 × 2.1; ASSUMPTION) | 1,604 | 1,604 | 1,604 | 1,604 |
| + YEP JT pax × 95% departing 2027 | 1,171 | **1,505** | 1,923 | 2,755 |
| + non-promo 5–31/12 (ASSUMPTION) | 1,392 | 1,392 | 1,392 | 1,392 |
| **On books at 31/12/2026** | 8,841 | **9,175** | 9,593 | 10,425 |
| % of commit | 19.9% | **20.7%** | 21.6% | 23.5% |
| YEP alone % of commit | 2.6% | **3.4%** | 4.3% | 6.2% |
| Implied 2027 final (÷31.4% / ÷25.8%) | 28.2–34.3k | **29.2–35.6k** | 30.6–37.2k | 33.2–40.4k |
| % of commit | 63–77% | **66–80%** | 69–84% | 75–91% |

Cross-check: 4,674 ÷ share booked by 17/10 of prior year (14.8% / 12.0%) = 31.5–39.0k. On track at 31/12 would need 12.0–13.9k on books; no YEP can deliver that (it would need 4–6k JT pax, 2–3x MF 9/26).

**Remaining GT gap after year-end (commit case): ≈35,240 pax** to book during 2027 = **2.56x** the 2026 in-year flow (13,781, of which 12,911 actual to 17/10 + ≈870 projected Nov–Dec; 2.73x on actual-to-date).

| 2027 booking period | Share (2026 pattern) | Required 2027 GT pax | 2026 (actual to 17/10 + projected) |
|---|---|---|---|
| Jan–Feb (needs a **new Jan 2027 promo**) | 19.8% | 6,980 | 2,734 |
| Mar–Apr (PRE / MF 4/27 / POST) | 17.1% | 6,030 | 2,350 |
| May | 7.9% | 2,780 | 1,091 |
| Jun (MYP 27) | 13.8% | 4,860 | 1,895 |
| Jul–Aug | 17.5% | 6,170 | 2,416 |
| Sep (PRE / MF 9/27) | 13.7% | 4,830 | 1,892 |
| Oct–Dec | 10.2% | 3,590 | 533 actual + ≈870 projected |

**Seats by departure month** (on-books ÷ 2026 share booked by 17/10 for the same month):

| Departure | On books 17/10 | Projected final | WIGS seats | Fill |
|---|---|---|---|---|
| Jan 2027 | 1,174 | ≈2,150 | 4,042 | 53% |
| Feb 2027 | – | ≈35 | 262 | 13% |
| Mar 2027 | 429 | ≈2,040 | 4,214 | 48% (biased low: Mar 2026 was Ramadan) |
| Apr 2027 | 1,145 | ≈4,550 | 4,426 | ≈103% |
| May 2027 | 558 | ≈3,540 | 5,822 | 61% |
| **Jan–Apr** | 2,761 | **≈8,780** | 12,944 | **≈68%** |

Near-full cells (stop-sell needed): Seoul Jan 253/340, Uzbekistan Apr 58/60, Kazakhstan Apr 14/12, Hokkaido Jan 16/16.

**What later promos must close:** Jan 2027 promo ≈7k (decide by **D8, 1/12**, not 18/12); MF 4/27 + PRE + POST ≈6k; MYP 27 ≈4.9k; MF 9/27 ≈4.8k (Dec 2027 is the biggest WIGS month, 6,400 pax). Each is ≈2.5x its 2026 equivalent. **Realistic WIGS GT commit ≈36k.** Plan airline deposits to that.

**PT ladder:** commit 265 pax × ≈0.71 departing 2027 ≈ 190 pax = 2.3% of WIGS PT. 2027 PT projects to **≈4–7k (49–81% of WIGS; ASSUMPTION)** — 4.1k on the 2026 curve, 6.7k on the 2025 curve; PT's decline points to the low end. Re-forecast WIGS PT to ≈5k.

**UH:** add a WIGS line (ASSUMPTION: ≈200–300 pax / RM2.5–3.5M for 2027).

---

## 4. Growth levers ranked by RM impact

Base without levers (counterfactual + YES 25-sized increments: JT 6.4M, PT 0.54M, UH/other 0.2M) ≈ **RM7.15M**. The commit needs **+RM2.9M net**. Lever ranges overlap (3, 4 and 6 are the same leads converting better); realistic net **+2.0–4.0M**.

| Rank | Lever | Segment | Net 11-day RM | Confidence | Evidence | Owner |
|---|---|---|---|---|---|---|
| 1 | **Departure-level price-to-fill list** for Jan / Mar / May 2027 heroes (Turki, Eropah 6, Kunming-ShangriLa, Switzerland-Italy, Seoul Mar/May, Balkan, TKO); deepest price on lowest-fill dates; stop-sell feed on near-full cells | JT | +0.6–1.2M | Medium | Top 7 ≈60% of MF 9/26 JT revenue; Turki Mar 8% and Switzerland-Italy Mar 5% booked | Syahmi |
| 2 | **Hard deadline, no POST, 72-hour final call** (2–4/12, open to 23:59) | All | +0.4–0.8M JT + 0.1M PT | **High** | Last 3 days 59.7% at YES 24 (hard close) vs 47.6% at YES 25 (POST followed); MYP 26 PT ≈71% in last 3 days | Hussaini, Amir |
| 3 | **Surge capacity: 6–8 surge staff + Robot1 scaling + weekend/evening rota** | JT, PT | +0.4–0.9M (weekend +0.2–0.35M) | Medium | Commit needs 16–20 human TCs vs 16 at MYP 26; Robot1 = 24.5% of rows since 7/9 and is the only channel that adds closings without TCs; weekend/weekday 0.53 at YES 25 vs 0.71 Jun–Oct 2026 | Hussaini, Rahiim, Amir (Robot1) |
| 4 | **Re-activation** of MF 9/26, PRE MF 9/26, MYP 26 contacts minus known bookers, plus past travellers | JT, UH | +0.5–1.0M | Medium | Existing-contact share rose from 6–7% to 19–23% around YES 25. Non-converters cannot be identified by ID (0 lead→sale matches): exclude bookers manually for the top 2–3k | Amir, Hussaini |
| 5 | **Ask-for-sale discipline**: price, deadline, payment link same day; "AFS sent" tag | All | Directional (AFS 30.5% → 35–40%) | Low (2 days of data) | Sheet7: AFS 30.5%, AFS→close 20.8% | Hussaini |
| 6 | **Speed-to-lead rule**: first reply <15 min; PT itinerary <1h | All | Not sized | Low until DB measured | 12 of 17 lost leads (71%) TC-controllable (n=17) | Rahiim |
| 7 | **New-for-2027 destinations as headline** (Chengdu, China 4 Wilayah, Shanghai, Kazakhstan, Uzbekistan, Spain-Morocco-Portugal, Hokkaido, Hanoi-Sapa) | JT | +0.4–0.8M | Medium-low | Chengdu 2→92 pax, Hanoi 40→96 (MF 9/25→9/26); SMP ARPP 10.7–11.2k | Syahmi, Amir |
| 8 | **Low deposit / instalment + "best price till MATTA 2027"** | JT, UH | +0.2–0.5M | Low-medium (margin risk) | Assumed "wait for MATTA" behaviour | Amir (finance) |
| 9 | **Premium mix and add-ons** (long-haul, single supplement, insurance) | JT | +0.2–0.5M | Medium | JT ARPP flat at 5.4–5.9k | Syahmi, Hussaini |
| 10 | **Ramadan-2027 / June-2027 umrah blocks** with one named TC (Zaid) and a landing page | UH-GT | +0.1–0.3M | Low-medium | Median UH lead time 140 days; MYP 26 31 pax | Syahmi |
| 11 | **Private version of each hero JT** (6+ pax fixed price) | PT | +0.15–0.35M | Medium-low | 78% of PT revenue (MF 9/26) sits in destinations that also have a JT | Syahmi |
| 12 | **Long-haul PT fixed packages** (NZ, Switzerland, Perth/Melbourne, Japan family) | PT | +0.1–0.3M | Low-medium | PT ARPP>6k cohort 75 pax / RM0.65M → 3 / RM0.04M at MF 9 (cohort chosen by outcome; overstates the fall) | Syahmi |
| 13 | **6–10 pre-priced PT templates + human-in-loop itinerary drafter** (replaces the PT quote bot) | PT | +0.1–0.2M | Medium-low | MF Online PT RM0.60M → RM0.08M | Amir |
| 14 | **PT incentive parity** | PT | +0.1–0.2M | Low | PT top-5 TC share 64% → 43% | Hussaini |
| 15 | **Load-capped routing** (≤25 new leads/TC/day; ASSUMPTION until DB) | JT | +0.06–0.19M | Medium | −1.06pp close rate per +10 leads/week | Rahiim |
| 16 | **"Cuti sekolah" Dec 2026 PT** | PT | +0.1–0.2M (not WIGS) | Medium | 28.8% of PT pax in the 2025 window departed same Q4 | Hussaini |
| — | **PRE-YEP 17–23/11: early-access waitlist only, no early-bird price** | JT | Feeds lever 4; not sized | Medium | A priced early-bird one week out would pull the same buyers out of the YEP window; PRE MF 9/26 (fair) is not a valid precedent | Amir |

Dropped as a sized lever: coaching the bottom half (5 of 6 bottom-half TCs in tc.md have left; current roster unmeasured).

**Notes**
- **PRE-YEP:** if Amir prefers a priced early-bird, the KPI becomes one combined 18-day target (CRM 17/11–4/12 ≥ RM13.1M = commit + ≈RM3.0M counterfactual for 7 days). Do not raise YEP on top of it.
- **No POST YEP.** POST YES 25 kept JT going (0.86x) but cut YES 25's last-day share from 32% to 24% and did nothing for PT (0.23x).
- **Close Fri 4/12 23:59.** Pushing to Sun 6/12 collides with the school break and peak December departures (1,012 JT pax depart 24/11–6/12; 4,579 in Dec).

---

## 5. Action plan, 19 Oct – 18 Dec 2026

YEP day numbering: D1 = Tue 24/11 … D11 = Fri 4/12. **Amir must name one tech lead / vendor by 21/10**; the draft gave Amir 21 of 38 actions.

### W1, 19–25 Oct: Decide and lock

| Action | Owner | Automation |
|---|---|---|
| Sign off targets (CRM-basis floor / commit / stretch per segment), **YEP media budget and CPL plan**, TC bonus plan, **margin floor per departure and discount authority matrix** | Amir | — |
| Name tech lead / vendor and SleekFlow admin | Amir | — |
| Seat audit Jan–Jun 2027 per departure (sold vs block); **verify deposits actually paid and attrition/release dates** (all 58 rows "TBC") | Syahmi, Amir (finance) | Agent builds a daily "sold vs block" sheet from CRM depart_date × tripid + Syahmi's block sheet |
| Open staged-deposit negotiation for May/Jun 2027 blocks with airlines | Syahmi | — |
| Ramadan-2027 / June-2027 umrah block quotes. **Go/no-go on UH 30 pax by 31/10** | Syahmi | — |
| Request SleekFlow DB access; run M1, M5, M11 (tc.md section 6) | Rahiim, tech lead | Agent runs SQL, writes per-TC SLA baseline |
| **Map MFKL codes to people** (they appear only in MATTA months: 606 rows Apr, 688 Sep 2026; permanent TCs logged almost nothing under own names during MF 9/26). **Confirm what the "Ikhwan" login represents** | Hussaini | — |
| Leave freeze for key sales staff 20/11–4/12; name backups for Ikhwan, Robot1 owner, Zaid (UH) | Hussaini | — |

### W2, 26 Oct – 1 Nov: Product and pricing

| Action | Owner | Automation |
|---|---|---|
| Hero price-to-fill grid by departure date; instalment; "best price till MATTA 2027" terms. Priced by 1/11 | Syahmi, Amir | — |
| **Visa cut-off rule per Jan 2027 Europe departure** (4–7 weeks over December peak; ASSUMPTION) | Syahmi | — |
| PT: private-version grid for every hero JT; 4–6 long-haul fixed packages; 6–10 pre-priced PT templates; Dec "cuti sekolah" list | Syahmi | Agent drafts itineraries (BM/EN), human approves |
| **Robot1 readiness**: YEP prices, hero departures, availability caps, payment-gateway load test | Amir | — |
| Surge hiring: 6–8 people (proven ≥RM200k at MF where real temps), contracts, budget, SleekFlow seats, CRM logins | Hussaini, Rahiim | — |
| Re-activation list: MF/MYP contacts minus bookers (manual name/date match for top 2–3k) + 2025–26 JT travellers | Amir, Hussaini | Agent scores and drafts WhatsApp offers |
| AFS script, deadline-close script; **"AFS sent" tag + lost-reason pick-list** (full 6-stage taxonomy after YEP) | Hussaini | — |

### W3, 2–8 Nov: Build (Deepavali 8–9/11)

| Action | Owner | Automation |
|---|---|---|
| Creative: hero departures, new-for-2027, umrah, PT private | Amir | Agent generates ad variants and A/B copy |
| **SleekFlow rules-based first-responder** (menu: destination, month, pax; brochure; "TC replies within 15 min"), live by 9/11. No LLM pricing or payment links | Rahiim, tech lead | SleekFlow flow |
| Fix SleekFlow→sheet sync (dead since 13/7); WhatsApp template approval and broadcast limits / opt-in check | Tech lead, Amir | Agent normalises utm_campaign |
| **Availability / stop-sell feed** for TCs and Robot1 | Syahmi, tech lead | Agent flags cells ≥80% sold |
| **Separate ops desk from sales floor** for Nov–Dec departures | Rahiim | — |
| Onboard surge staff: hero product training, CRM entry, AFS script | Hussaini, Rahiim | — |
| UH: landing page; leads routed to Zaid | Amir, Syahmi | — |
| Payment links and instalment workflow tested end-to-end | Amir (finance), Rahiim | Agent sends payment reminders |

### W4, 9–15 Nov: Warm-up and dry run

| Action | Owner | Automation |
|---|---|---|
| 10/11: teaser and "YEP early access" waitlist. Lookalikes from MF 9/26 and MYP 26 bookers | Amir | — |
| War-room dashboard live (CRM hourly; SleekFlow when sync works) | Tech lead, Rahiim | Agent refreshes hourly |
| Load caps (≤25 new leads/TC/day until DB says otherwise); routing JT→JT specialists, overflow to surge staff | Rahiim | — |
| Confirm ≥20 JT-selling heads by 9/11 (condition for commit) | Hussaini | — |
| Weekend and evening rota for 28–29/11 and 2–4/12 | Hussaini, Rahiim | — |

### W5, 16–23 Nov: PRE-YEP early access (17–23/11)

| Action | Owner | Automation |
|---|---|---|
| Waitlist push: register for D1 access to hero departures (no early-bird price) | Amir, Hussaini | — |
| Re-activation wave 1 | Amir | Batches capped to TC capacity |
| Full rehearsal 21/11: first-responder → TC handover, payment link, CRM entry, dashboard | Rahiim | — |

### W6, 24–29 Nov: YEP D1–D6

| Action | Owner | Automation |
|---|---|---|
| Launch 24/11 00:00; war-room 09:30 and 17:30 | Hussaini (chair), all | — |
| Black Friday (27/11) counter-message: "your 2027 holiday, not a 1-day deal" | Amir | — |
| **D5 checkpoint (Sat 28/11):** below RM2.25M (floor pace) → +30% hero ad budget, re-activation wave 2, flash offer on lowest-fill departures. Above RM3.87M (stretch pace) → stop discount escalation, protect margin | Amir, Hussaini, Syahmi | Pace-vs-curve alert |
| Weekend coverage 28–29/11 | Rahiim | — |

### W7, 30 Nov – 4 Dec: YEP D7–D11

| Action | Owner | Automation |
|---|---|---|
| Final-call 2–4/12: countdown, all hands, open to 23:59 | Hussaini | D-3, D-1, last-6h reminders to "AFS sent" leads |
| **D8 (1/12): decide staged May/Jun deposits on actual pace, and decide the Jan 2027 promo** | Syahmi, Amir | — |
| PT "cuti sekolah" push | Hussaini | "Departing <30 days" feed |
| Hard close Fri 4/12 23:59. No POST | Amir | — |

### Post-promo, 5–18 Dec

| Action | Owner | Automation |
|---|---|---|
| Balance and deposit collection; cancellation watch | Rahiim, Amir (finance) | Payment reminders |
| Lost-reason review; close-rate and response time by TC; bonus payout | Hussaini | Agent writes retrospective pack |
| Seat re-plan Jan–Jun 2027; release or renegotiate low-fill blocks before attrition dates | Syahmi | — |
| Build Jan 2027 promo (≈7k GT pax Jan–Feb booking). Re-forecast WIGS GT ≈36k, PT ≈5k, add UH line | Amir | — |
| Lead→sale join (write SleekFlow ID / phone_hash into CRM booking); full lead_stage taxonomy | Tech lead | — |
| Retrospective 11/12 | All | — |

### War-room KPIs (6 core, 09:30 / 17:30)

1. Revenue by segment vs pace curve (CRM closed_time).
2. Closed leads per day vs 55 (commit).
3. Leads per day vs 355–460.
4. % first reply <15 min (manual sample if DB unavailable).
5. Jan–May 2027 share of JT pax (target ≥55%; YES 25 had ≈66% in Jan–Jun 2026).
6. Availability alerts on hero cells (≥80% sold).

Secondary (daily): ARPP (JT ≥5,600, PT ≥2,300), AFS rate, Robot1 share, weekend/weekday ratio (≥0.75), UH pipeline, payment-link conversion, lead hygiene (tc_id, type, destination, travel date filled).

---

## 6. Risks, what could make this wrong, and data gaps

### Risks

| Risk | Detail | Mitigation |
|---|---|---|
| **Promo fatigue / pull-forward** | Sep 2026 was a record RM26.9M. YES 25 uplift was weak after a strong MF 9/25 | Commit sized on incremental RM ≈ MYP 26, not on multiplier |
| **Counterfactual overstated** | 47% of Oct 2026 JT closings depart in 2026 (39% Oct 2025); that demand fades by late Nov. At RM4.3M, the commit needs +RM4.7M (record) | D5 checkpoint; floor still holds |
| **Concentration** | Ikhwan 36.7% and Robot1 24.5% of rows since 7/9 (≈60%). UH = Zaid (39 of 59 closings) | Identity check, backups and leave freeze in W1 |
| **Capacity** | YES 25 ran with 11 JT TCs vs 15 at YES 24 and underperformed. MFKL fair productivity (walk-in buyers) does not transfer to WhatsApp | ≥20 heads condition; Robot1 scaling |
| **Ops overload** | 6,555 JT pax depart Nov–Dec 2026 | Separate ops desk (W3) |
| **PT keeps falling** | Oct PT −46% | PT commit already set on trend |
| **Margin** | Price-to-fill + price guarantee can buy revenue at low gross | Margin floor per departure (WIGS GT gross 12.0%) |
| **Oversell** | Seoul Jan 74%, several cells ≥100% | Stop-sell feed (W3) |
| **Timing** | First late-Nov year-end promo; Black Friday, 12.12; payday ≈25/11 (ASSUMPTION); school break 4–5/12 | Treat D3/D5 as soft signals |

### What could make the targets wrong
- **Upside:** an MYP 26-style response on today's base could reach RM11.5–13M CRM. The D5 stretch trigger exists to capture it, not cap it.
- **Funnel inputs:** closed-leads-per-lead (12–15.6%) and leads/day rest on 2 days of Sheet7 and promo_Raw closed leads. The SleekFlow sheet decays (314 leads in Jun, 108 in Jul 2026) and cannot size the funnel.
- **WIGS bridge:** two years of booking curves only.

### Data gaps to close before 24/11

| Gap | Close by | How | Owner |
|---|---|---|---|
| SleekFlow message DB (response times, AFS, current-roster close rates) | 31/10 | tc.md section 6 SQL (M1, M5, M6, M11) | Rahiim, tech lead |
| SleekFlow→sheet sync dead since 13/7/2026 | 6/11 | Fix sync, backfill, verify vs DB | Tech lead |
| Seat block vs sold per departure; deposits actually paid; attrition terms | 25/10 | Airline block sheet joined to CRM tripid; finance ledger | Syahmi, Amir |
| MFKL code → person mapping; Ikhwan login | 25/10 | Fair roster | Hussaini |
| UH Amount = 0 on 21 of 85 UH rows | 6/11 | CRM validation (Amount > 0) and back-fill | Rahiim |
| Marketing spend by campaign (no ROAS / CPL possible) | 25/10 | Export Meta spend; map to cleaned utm | Amir |
| YEP budget, discount depth, margin floor | 25/10 | CEO decision (W1) | Amir |
| No lead→sale join (0 ID matches) | after YEP | Write SleekFlow ID into CRM at closing | Tech lead |
| WIGS: no UH line; GT and PT not re-forecast | 18/12 | Add UH; re-forecast GT ≈36k, PT ≈5k | Amir |
| Ramadan 2027 and school calendar 2027 dates | 31/10 | JAKIM / KPM announcements | Syahmi |

---

## 7. Verification log

Three verifiers re-ran the draft from raw data (verify_numbers.md, verify_realism.md, verify_execution.md). I re-checked every disputed figure with `scripts/final/f1–f3.py`.

**Confirmed and kept:** counterfactual methods (RM4.78M), on-books (JT 4,674 / PT 633 / UH 7), WIGS totals (44,414 GT, 8,369 PT), 2026 full-year 18,568, booked-share curves, YES/MYP figures, pace-curve shape, lost-lead sample, Sheet7 rates.

**Changed:**

| # | What changed | Why (data) |
|---|---|---|
| 1 | **Commit RM11.53M → RM10.07M, stated on CRM closed_time basis.** Floor 8.30 → 7.65M, stretch 15.40 → 13.15M; RM11.5M kept as stretch-1 kicker | Draft compared targets to promo_Raw totals but tracked pace on CRM; the two differ by up to 1.21x (MYP 26). On CRM, draft JT RM10M needed +RM5.22M incremental, 17% above the record (MYP 26 +4.47M). New JT RM9.0M needs +4.2M |
| 2 | JT method: multiplicative uplift → incremental RM | Uplift falls as base rises (r = −0.64); draft ladder mixed promo_Raw numerator with CRM base (MYP 26 3.59x vs 2.96x CRM) |
| 3 | **PT RM1.0M → RM0.65M**, ARPP 2,700 → 2,450; counterfactual 0.45 → 0.34M | Draft cited PT ARPP range 2,279–2,460; actual 2026 range 1,818–2,460 (pooled 2,190). Trend-corrected counterfactual 0.34M; PT increments historically 0.2–0.3M |
| 4 | UH 30 → 20 pax (30 only with Ramadan blocks by 31/10) | Oct 2026 2 UH pax; 7 on books for 2027 |
| 5 | **Jan–Apr seat fill 48–58% → ≈68%** (Jan 53%, Feb 13%, Mar 48%, Apr ≈103%, May 61%) | Draft's aggregate share was mix-distorted; its own per-month table summed to 8,777 |
| 6 | "Already paid RM3.79M" → "RM3.79M planned to fall due Jul–Oct 2026; terms TBC, verify" | WIGS investment model, not a ledger; attrition "TBC" on all 58 rows |
| 7 | **Leads needed 9,420 → 3,900–5,100**; surge staff **25–30 → 6–8**; throughput named as the constraint | 8% was a same-day rate; MYP 26 closed 15.6% of in-promo leads. Commit = 55 closings/day = 1.07x MYP 26 → 16–20 human TCs vs 16 |
| 8 | MFKL "83% of MF revenue" removed as temp evidence | MFKL codes exist only in MATTA months (606 Apr, 688 Sep 2026); permanent TCs logged 1–4 rows each during MF 9/26 → booth IDs |
| 9 | Lever 1 rewritten: price-to-fill on low-fill departures + stop-sell; "open extra departures" dropped | Jan–May 17.6% filled; Seoul Jan 74%, several cells ≥100% |
| 10 | LLM first-responder → SleekFlow rules-based flow; PT quote bot → pre-priced templates; umrah bot dropped; lead→sale join and 6-stage taxonomy moved after YEP | No live price/availability source; 4-week builds with no test time; CEO owned 21 of 38 actions |
| 11 | Added W1 actions: tech lead, media budget, deposit ledger + attrition, MFKL/Ikhwan identity, leave freeze, margin floor; staged-deposit negotiation moved W4 → W1–W2; Robot1 readiness, visa cut-offs, stop-sell, ops desk, WhatsApp template check added | Missing actions flagged by execution review |
| 12 | PRE-YEP: priced early-bird → waitlist only (or one combined 18-day target) | Cannibalisation of the same hero buyers; PRE MF 9/26 is a fair precedent |
| 13 | Jan 2027 promo decision 18/12 → D8 (1/12) | 18/12 leaves ≈3 holiday weeks to build a ≈7k-pax event |
| 14 | WIGS ladder recomputed: next-year share 96% → 95%; 31/12 on-books 9,361 → 9,175; 2027 final 29.8–36.3k → 29.2–35.6k; phasing column relabelled (12,911 actual + ≈870 projected; 2.56x / 2.73x) | Verify_numbers issues 2 and 6; new JT commit |
| 15 | Small fixes: post-MF YoY +129% → +123% per day; other pax/closed lead 3.9 → 3.6; PT 2027 projection 4–5k → 4–7k; PT long-haul cohort caveat; war-room KPIs cut to 6 core | verify_numbers issues 3, 6, 7, 10 |

**Not adopted:** realism's RM4.1M low counterfactual (it used a 306k/day week; Mon–Sun weeks since MF run 324–419k/day, so the low end is RM4.3M). Realism's 96% next-year share (verify_numbers measured 94.8–95.3%; used 95%).

**Still unverified:** SleekFlow-based figures from tc.md (existing-contact share, −1.06pp per +10 leads, 7.1–7.7% autumn conversion); response-time effects (DB blocked).
