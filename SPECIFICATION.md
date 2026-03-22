# Specifikace webové aplikace: Revize Plynu CZ

## 1. Přehled projektu

### 1.1 Název aplikace
**RevizePlyn** — Webová aplikace pro evidenci a správu revizí plynových zařízení

### 1.2 Účel
Demo webová aplikace pro revizní techniky plynových zařízení v České republice. Umožňuje evidenci zakázek, správu revizí, sledování termínů a generování revizních zpráv. Aplikace je navržena pro jednoduchou obsluhu staršími uživateli.

### 1.3 Cílová skupina
- Revizní technici plynových zařízení (typicky 45–65 let)
- Drobní podnikatelé provádějící revize
- Správci objektů zajišťující revize

### 1.4 Klíčové principy
- **Bez přihlášení** — demo verze, okamžitě použitelná
- **Celá aplikace v češtině** — veškerý UI, hlášky, nápovědy
- **Responzivní design** — mobil, tablet i velký monitor
- **Větší písmo** — přizpůsobeno starším uživatelům (min. base 18px)
- **Jednoduchá navigace** — minimální počet kliknutí k cíli

---

## 2. Rešerše existujících řešení

### 2.1 Existující Windows aplikace
| Software | Typ | Popis |
|----------|-----|-------|
| **Revize.GAS** (2MSOFT) | Windows desktop | Specializovaný na plynová zařízení, sleduje legislativu NV 191/2022 Sb., export PDF, LAN síť, evidence závad |
| **Revidesk** | Webová aplikace | Univerzální systém pro všechny typy revizí, automatické upozornění, týmová spolupráce |
| **Revidovat.cz** | Webová aplikace | Správa revizních zpráv, QR kódy pro zařízení, sdílení s klienty |
| **FACMAN** | Webová aplikace | Komplexní správa revizí objektů, notifikace, přílohy |
| **eRevizák** | Webová aplikace | Správa všech typů revizí, automatické obnovení, havarijní služba |

### 2.2 Společné vlastnosti existujících řešení
- Evidence a plánování revizí s hlídáním termínů
- Generování revizních zpráv do PDF
- Archivace dokumentů a fotografií
- Automatická upozornění na blížící se termíny
- Správa více objektů a zařízení

### 2.3 Identifikované mezery na trhu
- Většina řešení je placená (měsíční předplatné)
- Žádné open-source nebo volně dostupné demo
- Starší Windows aplikace nemají responzivní mobilní verzi
- UX často nepřizpůsobeno starším uživatelům
- Chybí jednoduché řešení pro jednotlivce / malé firmy

---

## 3. Legislativní kontext

### 3.1 Klíčová legislativa
- **Nařízení vlády č. 191/2022 Sb.** — O vyhrazených technických plynových zařízeních a požadavcích na zajištění jejich bezpečnosti
- **ČSN 38 6405** — Plynová zařízení – Zásady provozu
- **Zákon č. 250/2021 Sb.** — O bezpečnosti práce v souvislosti s provozem vyhrazených technických zařízení

### 3.2 Typy revizí a kontrol
| Typ | Perioda | Popis |
|-----|---------|-------|
| **Výchozí revize** | Před prvním uvedením do provozu | Povinná před spuštěním nového nebo zásadně upraveného zařízení |
| **Provozní revize** | Každé 3 roky | Periodická kontrola bezpečnosti provozu |
| **Pravidelná kontrola** | 1× ročně | Roční kontrola (v roce provozní revize se neprovádí samostatně) |
| **Mimořádná revize** | Po události | Po opravě, zásahu, odstávce delší 6 měsíců apod. |

### 3.3 Povinný obsah revizní zprávy
1. Název, sídlo a IČ provozovatele
2. Přesné označení provozu / objektu
3. Datum provedení revize
4. Jméno, příjmení a číslo oprávnění revizního technika
5. Druh provedené revize (výchozí / provozní / mimořádná)
6. Označení a technické údaje revidovaného zařízení
7. Údaje o provedených zkouškách (čísla měřidel, přístroje)
8. Zjištěné závady a doporučení k odstranění
9. Závažnost závad s ohledem na bezpečnost
10. Závěr — zda je zařízení schopné bezpečného provozu

---

## 4. Funkční požadavky

### 4.1 Dashboard (Nástěnka)
**Priorita: VYSOKÁ**
- Přehled nadcházejících revizí (tento týden, tento měsíc)
- Počet rozpracovaných zakázek
- Upozornění na prošlé termíny (červeně zvýrazněné)
- Rychlé statistiky (celkem zakázek, dokončené, rozpracované)
- Rychlý přístup k nejčastějším akcím (nová zakázka, nová revize)

### 4.2 Správa zakázek (objednávek)
**Priorita: VYSOKÁ**

#### 4.2.1 Vytvoření zakázky
- Zákazník (jméno/firma, adresa, telefon, e-mail)
- Typ zakázky:
  - **Nová stavba** — výchozí revize nové instalace
  - **Rekonstrukce** — revize po zásadní úpravě
  - **Pravidelná revize** — plánovaná provozní revize
  - **Pravidelná kontrola** — roční kontrola
  - **Mimořádná revize** — po havárii, opravě, odstávce
  - **Oprava + revize** — kombinace opravy a následné revize
- Adresa objektu (může se lišit od adresy zákazníka)
- Popis požadavku (volný text)
- Plánované datum realizace
- Priorita (normální / spěchá)
- Poznámky

#### 4.2.2 Stavy zakázky
```
Nová → Naplánovaná → Probíhá → Dokončena → Fakturováno
                  ↘ Odložená ↗
                  ↘ Zrušená
```

#### 4.2.3 Přehled zakázek
- Tabulkový seznam s filtrováním a řazením
- Filtr podle: stavu, typu, zákazníka, data
- Fulltextové vyhledávání
- Barevné rozlišení stavů

### 4.3 Evidence zařízení
**Priorita: VYSOKÁ**
- Typ zařízení (kotel, sporák, ohřívač, rozvod plynu, regulátor, měřidlo, atd.)
- Výrobce a model
- Výrobní / sériové číslo
- Rok výroby / uvedení do provozu
- Umístění (objekt, místnost, patro)
- Technické parametry (výkon, tlak, průtok)
- Přiřazení k objektu / zákazníkovi
- Historie revizí daného zařízení
- Fotodokumentace

### 4.4 Revizní zprávy
**Priorita: VYSOKÁ**

#### 4.4.1 Vytvoření revizní zprávy
- Automatické číslování (formát: RZ-YYYY-NNNN)
- Předvyplnění údajů ze zakázky a zařízení
- Výběr typu revize
- Údaje o revizním technikovi (jméno, číslo oprávnění)
- Provedené zkoušky:
  - Zkouška těsnosti (přístroj, výsledek)
  - Zkouška funkčnosti
  - Kontrola odvodu spalin
  - Měření CO (přístroj, naměřená hodnota)
  - Kontrola větrání
- Zjištěné závady (seznam):
  - Popis závady
  - Závažnost (A – nebezpečí, B – zhoršený stav, C – doporučení)
  - Termín odstranění
  - Stav (neodstraněna / odstraněna)
- Celkový závěr:
  - ✅ Zařízení je schopné bezpečného provozu
  - ⚠️ Zařízení je schopné provozu s výhradami (nutno odstranit závady)
  - ❌ Zařízení není schopné bezpečného provozu (odstavit!)
- Datum a podpis

#### 4.4.2 Export revizní zprávy
- Generování do PDF dle vzoru stanoveného legislativou
- Možnost tisku přímo z aplikace
- Uložení do archivu

### 4.5 Kalendář a plánování
**Priorita: STŘEDNÍ**
- Měsíční/týdenní přehled naplánovaných revizí
- Barevné rozlišení typů zakázek
- Upozornění na blížící se termíny (7 dní, 3 dny, dnes)
- Přetahování zakázek mezi dny (drag & drop na desktopu)

### 4.6 Evidence zákazníků
**Priorita: STŘEDNÍ**
- Jméno / název firmy
- IČ / DIČ
- Kontaktní údaje (telefon, e-mail)
- Fakturační adresa
- Seznam objektů zákazníka
- Historie zakázek a revizí

### 4.7 Evidence objektů
**Priorita: STŘEDNÍ**
- Název / označení objektu
- Adresa
- Typ objektu (rodinný dům, bytový dům, provozovna, výrobní hala)
- Vlastník / správce
- Seznam zařízení v objektu
- Historie všech revizí na objektu

### 4.8 Hlídání termínů
**Priorita: VYSOKÁ**
- Automatický výpočet příští revize na základě typu a data poslední revize
- Vizuální upozornění na nástěnce:
  - 🟢 V pořádku (do příští revize více než 30 dní)
  - 🟡 Blíží se (do 30 dní)
  - 🔴 Po termínu!
- Seznam zařízení s expirující platností revize
- Řazení podle naléhavosti (nejkritičtější nahoře)

### 4.9 Prohledávání a filtrování revizí
**Priorita: VYSOKÁ**
- Souhrnný přehled všech vytvořených revizí na jednom místě
- Filtrování podle: typu revize, stavu, zákazníka, objektu, data, závažnosti závad
- Řazení podle: data, zákazníka, typu, stavu
- Fulltextové vyhledávání napříč revizními zprávami
- Rychlé přepínání mezi zobrazením „karty" a „tabulka"

### 4.10 QR kódy pro zařízení
**Priorita: VYSOKÁ**
- Automatické generování unikátního QR kódu pro každé evidované zařízení
- QR kód obsahuje odkaz na detail zařízení v aplikaci
- Možnost tisku QR štítku (pro nalepení na zařízení)
- Naskenováním QR kódu telefonem se otevře karta zařízení s historií revizí
- Hromadný tisk QR kódů pro vybraná zařízení

### 4.11 Sdílení revizních zpráv
**Priorita: VYSOKÁ**
- Vygenerování unikátního sdílecího odkazu pro revizní zprávu
- Zákazník si může zprávu prohlédnout a stáhnout PDF bez přihlášení
- Sdílecí stránka zobrazuje: revizní zprávu, zjištěné závady, závěr
- Možnost zkopírovat odkaz nebo odeslat přes e-mail (manuálně)
- Přehled sdílených zpráv s datem posledního zobrazení

### 4.12 Číselníky a nastavení
**Priorita: STŘEDNÍ**
- Údaje o revizním technikovi (jméno, číslo oprávnění, kontakt)
- Typy zařízení (předdefinovaný seznam + vlastní)
- Typy závad (předdefinovaný seznam)
- Měřidla a přístroje (evidence, platnost kalibrace)
- Šablony revizních zpráv

### 4.13 Vyhledávání
**Priorita: STŘEDNÍ**
- Globální vyhledávání přes celou aplikaci
- Hledání podle: zákazníka, adresy, čísla zakázky, čísla revize, zařízení
- Naposledy zobrazené záznamy (rychlý přístup)

---

## 5. Nefunkční požadavky

### 5.1 Jazyk a lokalizace
- Celé UI v **českém jazyce**
- České formáty dat:
  - Datum: DD.MM.RRRR
  - Čas: HH:MM
  - Měna: Kč (ne CZK)
  - Oddělovač tisíců: mezera (1 000)
  - Desetinná čárka: čárka (3,14)
- Diakritika plně podporována

### 5.2 Responzivní design
- **Mobil** (< 768px): jednoslovcový layout, hamburger menu, velké touch targety
- **Tablet** (768–1024px): dvousloupcový layout
- **Desktop** (> 1024px): plný layout s bočním menu
- Minimální touch target: 48×48px

### 5.3 Přístupnost a čitelnost (KLÍČOVÉ)
- **Základní velikost písma: 18px** (místo obvyklých 14–16px)
- Nadpisy proporčně větší (H1: 32px, H2: 26px, H3: 22px)
- **Vysoký kontrast** — tmavý text na světlém pozadí
- **Řádkování min. 1.6** pro lepší čitelnost
- Tlačítka dostatečně velká s jasným popisem
- Ikony doplněné textem (ne pouze ikony)
- Formuláře s velkými poli a jasným labelem nad polem
- Barevné rozlišení doplněné textem/ikonou (pro barvoslepé)
- Žádné drobné šedé texty — vše dobře čitelné

### 5.4 Bez přihlášení
- Aplikace je demo — žádná autentizace
- Data se ukládají lokálně (localStorage / IndexedDB) nebo v demo databázi
- Při prvním spuštění se načtou ukázková data
- Možnost resetu na výchozí ukázková data

### 5.5 Offline podpora (BONUS)
- Service Worker pro základní offline funkčnost
- Možnost vyplnit revizi v terénu bez připojení
- Synchronizace po obnovení připojení

### 5.6 Výkon
- První načtení < 3 sekundy
- Navigace mezi stránkami < 500ms
- Plynulé scrollování i na starších zařízeních

---

## 6. Technické doporučení

### 6.1 Doporučený tech stack
- **Frontend**: Next.js / React s TypeScript
- **Styling**: Tailwind CSS (snadná responzivita a přizpůsobení fontů)
- **State management**: Zustand nebo React Context
- **Lokální úložiště**: IndexedDB (Dexie.js) pro demo data
- **PDF generování**: jsPDF nebo react-pdf
- **Kalendář**: FullCalendar nebo vlastní
- **Ikony**: Lucide React (čisté, dobře čitelné ikony)

### 6.2 Struktura aplikace
```
/                        → Nástěnka (Dashboard)
/zakazky                 → Seznam zakázek
/zakazky/nova            → Nová zakázka
/zakazky/:id             → Detail zakázky
/zakazky/:id/revize      → Vytvoření revizní zprávy k zakázce
/zarizeni                → Seznam zařízení
/zarizeni/:id            → Detail zařízení
/zarizeni/:id/qr         → QR kód zařízení (tisk)
/zakaznici               → Seznam zákazníků
/zakaznici/:id           → Detail zákazníka
/objekty                 → Seznam objektů
/objekty/:id             → Detail objektu
/kalendar                → Kalendář plánovaných revizí
/revizni-zpravy          → Archiv revizních zpráv (s filtry a vyhledáváním)
/revizni-zpravy/:id      → Detail revizní zprávy
/sdileni/:token          → Veřejná sdílecí stránka revizní zprávy (bez menu)
/nastaveni               → Nastavení (údaje technika, číselníky)
```

### 6.3 Datový model (zjednodušený)
```
Zákazník (1) ──── (N) Objekt
Objekt    (1) ──── (N) Zařízení
Zákazník  (1) ──── (N) Zakázka
Zakázka   (1) ──── (N) Revizní zpráva
Zařízení  (1) ──── (N) Revizní zpráva
Revizní zpráva (1) ──── (N) Zjištěná závada
```

---

## 7. Ukázková (seed) data pro demo

Aplikace musí při prvním spuštění obsahovat rozsáhlá, realisticky vypadající data, aby demo působilo jako živá aplikace skutečného revizního technika. Všechna data musí být fiktivní, ale věrohodná — správné formáty IČ, reálné názvy ulic v odpovídajících městech, skutečné modely zařízení, správné technické parametry.

### 7.0 Revizní technik (uživatel demo)
Aplikace běží jako demo pro jednoho technika:
- **Ing. Miroslav Dvořák**
- Oprávnění č. RT-P-2019/0847 (revize plynových zařízení)
- Platnost oprávnění: 01.03.2024 – 28.02.2029
- IČ: 76543210
- Sídlo: Kotlářská 1247/12, 602 00 Brno
- Tel: +420 602 345 678
- E-mail: dvorak.revize@email.cz
- Měřidla:
  - Detektor úniku plynu Testo 316-2 (kalibrace do 15.09.2026)
  - Analyzátor spalin Testo 300 (kalibrace do 22.11.2026)
  - Manometr digitální Keller LEO 2 (kalibrace do 03.05.2027)

### 7.1 Zákazníci — fyzické osoby (8–10 osob)
Běžní majitelé domů a bytů, kteří potřebují pravidelné revize. Realistická česká jména, adresy v Brně a okolí (hlavní oblast působnosti technika).

| # | Jméno | Typ | Adresa objektu | Telefon | Poznámka |
|---|-------|-----|----------------|---------|----------|
| 1 | **Jan Novák** | Rodinný dům | Horní 14, 639 00 Brno-Štýřice | +420 731 222 456 | Starší kotel, pravidelný zákazník od 2019 |
| 2 | **Marie Svobodová** | Byt v OV | Palackého tř. 87/3, 612 00 Brno | +420 608 111 234 | Byt 3+1, plynový sporák + karma |
| 3 | **Petr Veselý** | Rodinný dům | Jihlavská 42, 664 41 Troubsko | +420 775 333 890 | Novostavba 2023, výchozí revize hotová |
| 4 | **Alena Procházková** | Rodinný dům | Na Kopci 7, 664 48 Moravany | +420 602 444 567 | Dva kotle (podlažní vytápění) |
| 5 | **Jiří Černý** | Byt v BD | Vídeňská 119/28, 619 00 Brno | +420 723 555 123 | SVJ požaduje revizi za celý dům |
| 6 | **Hana Kučerová** | Rodinný dům | Hlavní 203, 664 34 Kuřim | +420 606 666 789 | Starý průtokový ohřívač, doporučena výměna |
| 7 | **František Dvořáček** | Rodinný dům | Nádražní 31, 666 01 Tišnov | +420 739 777 012 | Vzdálený zákazník, dojezd 40 min |
| 8 | **Ludmila Marková** | Byt v OV | Botanická 24/5, 602 00 Brno | +420 774 888 345 | Seniorka, nutno volat den předem |

### 7.2 Zákazníci — firmy a správci (5–6 firem)
Stavební firmy, bytová družstva, správcovské společnosti a provozovny — generují více zakázek naráz.

| # | Firma | IČ | Typ | Adresa sídla | Kontaktní osoba | Poznámka |
|---|-------|----|-----|--------------|-----------------|----------|
| 1 | **MORAVOSTAV s.r.o.** | 26247852 | Stavební firma | Příkop 838/6, 602 00 Brno | Ing. Tomáš Hora, +420 541 235 100 | Staví RD v Kuřimi a Tišnově, výchozí revize novostaveb |
| 2 | **Bytové družstvo Harmonie** | 00558214 | Bytové družstvo | Loosova 13/2, 638 00 Brno-Lesná | Vladimír Kratochvíl, +420 545 222 333 | 3 bytové domy, 48 bytových jednotek |
| 3 | **SB Správa budov a.s.** | 28301587 | Správcovská společnost | Cejl 107/48, 602 00 Brno | Jana Pokorná, +420 543 210 555 | Spravuje 12 objektů v Brně |
| 4 | **Restaurace U Zlatého lva s.r.o.** | 04521963 | Provozovna (gastro) | Zelný trh 8, 602 00 Brno | Pavel Krejčí, +420 530 123 456 | Profesionální kuchyně, 2 plynové sporáky + gril |
| 5 | **DOMOSTAV Group a.s.** | 25527843 | Developerská firma | Masarykova 427/31, 602 00 Brno | Ing. Radek Šimek, +420 541 777 888 | Projekt 24 RD v Modřicích, hromadné výchozí revize |
| 6 | **Domov seniorů Tišnov, p.o.** | 71184520 | Příspěvková organizace | Černohorská 101, 666 01 Tišnov | Mgr. Eva Součková, +420 549 418 200 | Kotelna + kuchyně, zvýšené nároky na bezpečnost |

### 7.3 Objekty (15–20 objektů)
Každý zákazník má 1–N objektů. Firmy mají více objektů (stavby, bytové domy). Každý objekt má realistickou adresu.

Příklady:
- Jan Novák → 1 objekt (jeho RD)
- BD Harmonie → 3 objekty (Loosova 13, 15, 17)
- MORAVOSTAV → 6 objektů (novostavby v různém stadiu)
- SB Správa budov → 4 objekty (spravované BD v Brně)
- DOMOSTAV Group → 8 objektů (řadové domy v Modřicích, fáze 1)

### 7.4 Zařízení (40–50 zařízení)
Realistické modely skutečných výrobců dostupných na českém trhu. Správné technické parametry.

#### Plynové kotle
| Model | Výrobce | Výkon | Typ | Rok |
|-------|---------|-------|-----|-----|
| Junkers (Bosch) CerapurComfort ZWBC 28-3 C | Bosch | 28 kW | kondenzační, turbo | 2020 |
| Vaillant ecoTEC plus VU 256/5-5 | Vaillant | 25 kW | kondenzační, turbo | 2018 |
| Protherm Gepard Condens 25 MKO | Protherm | 25 kW | kondenzační, turbo | 2022 |
| Baxi Luna Duo-tec+ 28 GA | Baxi | 28 kW | kondenzační, turbo | 2019 |
| Viessmann Vitodens 100-W B1HF | Viessmann | 19 kW | kondenzační, turbo | 2023 |
| Protherm Medvěd Condens 25 KKS | Protherm | 25 kW | kondenzační, stacionární | 2016 |
| Junkers (Bosch) ZWE 24-5 MFK | Bosch | 24 kW | atmoférický (starší) | 2008 |

#### Průtokové ohřívače a karmy
| Model | Výrobce | Výkon | Rok |
|-------|---------|-------|-----|
| Vaillant atmoMAG 114/1 | Vaillant | 19.2 kW | 2010 |
| Junkers (Bosch) WR 11-2 P | Bosch | 19.2 kW | 2006 |
| Mora Vega 13 | Mora | 22.1 kW | 2017 |

#### Plynové sporáky
| Model | Výrobce | Rok |
|-------|---------|-----|
| Mora Premium 6106 AW | Mora | 2019 |
| Gorenje GI 6322 XA | Gorenje | 2021 |
| Electrolux EKK54953OX | Electrolux | 2018 |
| Gastro profesionální sporák REDFOX SP-90/5 GLS | RedFox | 2020 |

#### Plynové rozvody
| Popis | Materiál | DN | Rok |
|-------|----------|----|-----|
| Nízkotlaký plynovod — RD | ocel | DN 25 | 2008–2023 |
| Nízkotlaký plynovod — BD | ocel | DN 40 | 2005 |
| Přípojka plynu — novostavba | PE-HD | DN 32 | 2023 |
| Domovní plynovod — BD 3 podlaží | ocel | DN 50 | 1998 |

#### Regulátory a další
| Typ | Model | Rok |
|-----|-------|-----|
| Regulátor tlaku | B6 (Tartarini) | 2012 |
| Regulátor tlaku | Francel B10 | 2015 |
| Plynový gril | Gastro-Line 800 | 2021 |
| HUP (hlavní uzávěr plynu) | kulový kohout DN 25 | různé |

### 7.5 Zakázky (20–25 zakázek)
Rozložení musí pokrývat všechny stavy a typy, aby demo ukazovalo reálný provoz. Data rozložená od cca 6 měsíců zpět do 2 měsíců do budoucna.

#### Podle stavu:
| Stav | Počet | Příklady |
|------|-------|----------|
| **Dokončeno / Fakturováno** | 10–12 | Pravidelné revize hotové v posledních měsících |
| **Naplánovaná** | 4–5 | Naplánované na příští týdny (zobrazí se v kalendáři) |
| **Probíhá** | 2 | Rozpracované — technik už byl na místě, dodělává zprávu |
| **Nová** | 2–3 | Čerstvě přijaté objednávky, zatím nenaplánované |
| **Po termínu!** | 2 | Měly být hotové minulý měsíc — ukázka červeného upozornění |
| **Odložená** | 1 | Zákazník odložil (např. rekonstrukce se zpozdila) |
| **Zrušená** | 1 | Zrušená zakázka |

#### Podle typu:
| Typ zakázky | Počet | Scénář |
|-------------|-------|--------|
| **Pravidelná revize (provozní)** | 8–10 | Tříleté provozní revize kotlů, rozvodů |
| **Pravidelná kontrola (roční)** | 3–4 | Roční kontroly v bytových domech |
| **Výchozí revize (novostavba)** | 4–5 | MORAVOSTAV a DOMOSTAV — nové domy |
| **Rekonstrukce** | 2 | Výměna kotle, nový rozvod |
| **Mimořádná revize** | 1 | Po havárii / po opravě |
| **Oprava + revize** | 1 | Oprava netěsnosti + následná revize |

### 7.6 Revizní zprávy (12–15 dokončených zpráv)
Každá dokončená zakázka má kompletní revizní zprávu. Zprávy musí obsahovat realistické detaily.

#### Příklady konkrétních zpráv:

**RZ-2025-0001** — Provozní revize, Jan Novák, Horní 14, Brno
- Zařízení: Junkers ZWE 24-5 MFK (atmosférický kotel z 2008)
- Zkoušky: těsnost OK, spaliny OK, CO 28 ppm (v normě), funkčnost OK
- Závada B: Nedostatečné větrání kotelny — doporučena úprava mřížky (termín 3 měsíce)
- Závěr: ⚠️ Schopné provozu s výhradami

**RZ-2025-0005** — Výchozí revize, MORAVOSTAV, novostavba Kuřim
- Zařízení: Protherm Gepard Condens 25 MKO (nový) + NTL plynovod PE-HD DN 32
- Zkoušky: těsnost plynovodu OK (zkušební tlak 50 kPa / 30 min), kotel — spaliny OK, CO 5 ppm
- Závady: žádné
- Závěr: ✅ Schopné bezpečného provozu

**RZ-2025-0009** — Provozní revize, Restaurace U Zlatého lva
- Zařízení: RedFox SP-90/5 GLS + Gorenje sporák + plynový gril Gastro-Line 800
- Zkoušky: těsnost OK, odvod spalin — digestoř OK, CO v normě u všech spotřebičů
- Závada A: Netěsný spoj u přívodu grilu — **NEBEZPEČÍ, nutno ihned odstranit!**
- Závada C: Chybí štítek na HUP — doporučení
- Závěr: ❌ Gril odstaven do opravy, ostatní zařízení schopná provozu

**RZ-2024-0042** — Provozní revize, BD Harmonie, Loosova 13
- Zařízení: domovní plynovod DN 50, 12 bytových jednotek (sporáky, karmy)
- Zkoušky: hromadná zkouška těsnosti stoupacího vedení, kontrola všech bytů
- Závady: 2× závada B (prostor u plynových spotřebičů zatarasen — byty č. 7 a č. 11)
- Závěr: ⚠️ Schopné provozu s výhradami

### 7.7 Zjištěné závady (15–20 závad napříč zprávami)
Realistické závady různé závažnosti, jaké revizní technik skutečně nachází v praxi.

| Závažnost | Příklady závad | Počet |
|-----------|----------------|-------|
| **A — Nebezpečí** | Netěsný spoj (únik plynu), vadný odvod spalin do obytného prostoru, nefunkční pojistka plamene | 2–3 |
| **B — Zhoršený stav** | Nedostatečné větrání kotelny, koroze na potrubí, chybějící revize (prošlá lhůta), zatarasený prostor u spotřebiče, poškozená těsnění | 6–8 |
| **C — Doporučení** | Chybějící štítek na HUP, doporučení modernizace starého kotle, doporučení výměny flexi hadice, chybí provozní řád | 5–7 |

Některé závady mají stav „odstraněna" (zákazník opravil a technik to potvrdil).

### 7.8 Sdílecí odkazy (3–4 sdílené zprávy)
- 2 zprávy sdílené zákazníkům (Jan Novák, MORAVOSTAV) — odkaz aktivní
- 1 zpráva sdílená BD Harmonie — zákazník si ji již zobrazil (datum posledního zobrazení)
- 1 neaktivní / expirovaný odkaz

### 7.9 Pravidla pro seed data
1. **Všechna jména, IČ, adresy a kontakty musí být fiktivní** — nesmí odpovídat skutečným osobám/firmám
2. **Adresy musí odpovídat reálné struktuře** — správné PSČ, existující ulice nebo realisticky znějící názvy, správné městské části
3. **Modely zařízení musí být reálné** — skutečné výrobky dostupné na českém trhu se správnými technickými parametry
4. **Datumy musí být konzistentní** — výchozí revize před provozní, tříletý cyklus dodržen, zakázka vytvoření < naplánování < dokončení
5. **Čísla revizních zpráv** — sekvenční v rámci roku (RZ-RRRR-NNNN), bez mezer
6. **Závady musí být odborně správné** — reálné problémy, které technik skutečně řeší (ne vymyšlené nesmysly)
7. **Telefony** ve formátu +420 XXX XXX XXX, e-maily na doménách email.cz, seznam.cz, firma.cz
8. **Ceny / fakturace** se v demo nezobrazují (není součástí MVP)

---

## 8. Wireframe koncepty

### 8.1 Nástěnka (mobil)
```
┌──────────────────────────┐
│  ☰  RevizePlyn           │
├──────────────────────────┤
│                          │
│  🔴 2 po termínu!        │
│  🟡 3 blíží se termín    │
│                          │
│  ┌──────┐ ┌──────┐      │
│  │  12  │ │   5  │      │
│  │zakáz.│ │rozpra│      │
│  └──────┘ └──────┘      │
│                          │
│  📋 Nadcházející revize   │
│  ├─ Novák, 25.3. kotel  │
│  ├─ BD Harmonie, 28.3.  │
│  └─ U Zlatého lva, 2.4. │
│                          │
│  [+ Nová zakázka]        │
│  [+ Nová revize]         │
│                          │
├──────────────────────────┤
│ 🏠  📋  📅  ⚙️           │
│Domů Zakáz Kalen Nast     │
└──────────────────────────┘
```

### 8.2 Nástěnka (desktop)
```
┌────────────┬─────────────────────────────────────────────┐
│            │                                             │
│  RevizePlyn│   Nástěnka                                  │
│            │                                             │
│  ──────    │   🔴 2 zakázky po termínu!                   │
│  🏠 Domů   │   🟡 3 zakázky — blíží se termín             │
│  📋 Zakázky│                                             │
│  🔧 Zařízení│  ┌─────────┬─────────┬─────────┬─────────┐ │
│  👥 Zákazn.│  │  Celkem  │ Rozprac.│Dokončeno│ Po term.│ │
│  🏢 Objekty│  │   47     │    5    │   38    │    2    │ │
│  📅 Kalendář│  └─────────┴─────────┴─────────┴─────────┘ │
│  📄 Rev.zpr.│                                            │
│  ⚙️ Nastav.│   Nadcházející revize                       │
│            │   ┌──────────────────────────────────────┐  │
│            │   │ 25.3. │ Novák │ Kotel │ Provozní    │  │
│            │   │ 28.3. │ BD H. │ Rozvod│ Kontrola    │  │
│            │   │  2.4. │ Lev   │ Sporák│ Výchozí     │  │
│            │   └──────────────────────────────────────┘  │
│            │                                             │
│            │   [+ Nová zakázka]  [+ Nová revize]         │
└────────────┴─────────────────────────────────────────────┘
```

---

## 9. Barevné schéma

| Prvek | Barva | Hex |
|-------|-------|-----|
| Primární (akce, odkazy) | Tmavě modrá | `#1E40AF` |
| Sekundární (pozadí menu) | Světle šedá | `#F3F4F6` |
| Úspěch / V pořádku | Zelená | `#16A34A` |
| Varování / Blíží se | Oranžová | `#EA580C` |
| Chyba / Po termínu | Červená | `#DC2626` |
| Text | Tmavě šedá | `#1F2937` |
| Pozadí | Bílá | `#FFFFFF` |
| Ohraničení | Světle šedá | `#D1D5DB` |

**Poznámka**: Vysoký kontrast (WCAG AA minimum) pro všechny kombinace text/pozadí.

---

## 10. Prioritizace funkcí (MVP → Rozšíření)

### Fáze 1 — MVP (Minimum Viable Product)
1. ✅ Nástěnka se statistikami a upozorněními
2. ✅ Správa zakázek (CRUD + stavy)
3. ✅ Evidence zákazníků (základní)
4. ✅ Evidence zařízení (základní)
5. ✅ Tvorba revizní zprávy (formulář)
6. ✅ Export revizní zprávy do PDF
7. ✅ Hlídání termínů (barevné upozornění, řazení dle naléhavosti)
8. ✅ Prohledávání a filtrování revizí (fulltext, filtry, řazení)
9. ✅ QR kódy pro zařízení (generování, tisk, sken → detail)
10. ✅ Sdílení revizních zpráv (unikátní odkaz pro zákazníka)
11. ✅ Responzivní layout s velkým písmem
12. ✅ Demo data

### Fáze 2 — Rozšíření
13. Kalendář s plánováním
14. Evidence objektů
15. Fotodokumentace (nahrání fotek)
16. Evidence měřidel a kalibrace
17. Šablony revizních zpráv

### Fáze 3 — Bonus
18. Offline podpora (Service Worker)
19. Export dat (CSV/Excel)
20. Statistiky a reporty (měsíční přehled práce)
21. Notifikace (push / e-mail — pouze s backendem)

---

## 11. Omezení demo verze

- Žádná autentizace ani správa uživatelů
- Data uložena pouze lokálně v prohlížeči
- Maximálně ~100 záznamů pro plynulý chod
- Žádné odesílání e-mailů ani notifikací
- Žádné napojení na datové schránky či ARES

---

## 12. Konkurenční výhody oproti existujícím řešením

| Vlastnost | RevizePlyn (naše) | Revize.GAS | Revidesk | Revidovat.cz |
|-----------|-------------------|------------|----------|--------------|
| Zdarma | ✅ | ❌ | ❌ | ❌ |
| Bez instalace | ✅ | ❌ (Windows) | ✅ | ✅ |
| Bez registrace | ✅ | ❌ | ❌ | ❌ |
| Velké písmo pro seniory | ✅ | ❌ | ❌ | ❌ |
| Mobilní verze | ✅ | ❌ | ✅ | ✅ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Offline režim | ✅ (plán) | ✅ | ❌ | ❌ |
| Česká legislativa 2022+ | ✅ | ✅ | ✅ | ✅ |

---

## 13. Nasazení (Deployment)

### 13.1 Platforma
- **Azure App Service** (Web Apps) — **Free tier (F1)**
- Bez vlastní domény — aplikace poběží na výchozí Azure subdoméně: `https://revizeplyn.azurewebsites.net` (nebo podobný dostupný název)
- HTTPS automaticky zajištěno Azurem

### 13.2 Omezení Free tier (F1)
- 1 GB RAM, 1 GB úložiště
- 60 minut CPU / den (sdílená instance)
- Žádný custom domain, žádný SSL certifikát pro vlastní doménu
- Aplikace se po nečinnosti uspí (~20 min) — první načtení po uspání může trvat 10–30 s (cold start)
- **Dostačující pro demo účely** — aplikaci bude používat 1–2 lidé (technik / strýček)

### 13.3 Co to znamená pro architekturu
- Aplikace musí být **statická nebo serverless-friendly** (rychlý cold start)
- Doporučení: **Next.js se statickým exportem** (`output: 'export'`) nebo **SPA (React/Vite)** nasazený jako statický web
  - Alternativa: Next.js v SSR režimu na Node.js runtime (pomalejší cold start, ale stále OK pro demo)
- Veškerá data v **localStorage / IndexedDB** v prohlížeči uživatele (žádná databáze na serveru)
- Žádný backend server, žádná API — čistě klientská aplikace
- Build výstup: statické soubory (HTML, JS, CSS) nebo Node.js app

### 13.4 Postup nasazení
1. Build aplikace (`npm run build`)
2. Vytvořit Azure App Service (F1 tier) přes Azure CLI nebo Azure Portal
3. Nasadit build výstup (přes `az webapp up`, GitHub Actions, nebo ZIP deploy)
4. Ověřit na `https://revizeplyn.azurewebsites.net`
5. Sdílet odkaz strýčkovi k otestování

### 13.5 Účel nasazení
- **Uživatelské testování** — strýček (revizní technik) si aplikaci vyzkouší na reálném zařízení (telefon, tablet, počítač)
- **Zpětná vazba** — ověření, zda velikost písma, rozložení a funkce odpovídají reálným potřebám
- **Bez nutnosti instalace** — stačí otevřít odkaz v prohlížeči
- Není určeno pro produkční provoz ani ukládání skutečných dat
