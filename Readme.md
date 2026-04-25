# Q-Commerce Ops Automation Suite 🦊

_[Kliknij tutaj, aby przejść do polskiej wersji językowej / Click here for the Polish version](#-wersja-polska)_

A comprehensive browser extension and Google Apps Script backend designed to automate daily operations, darkstore management, HR shift adjustments, and daily reporting for a quick-commerce delivery platform.

> **⚠️ Security Disclaimer:** For confidentiality (NDA) and operational security reasons, this repository is an anonymized version of the original project. All real API endpoints, bot tokens, spreadsheet IDs, Google Drive folder IDs, and internal company names have been replaced with placeholders.

---

## 💡 About the author & project origin

My main career path and daily work revolve around **data and analytics**. This project wasn't created to make me a front-end developer, but out of a purely pragmatic need: **I wanted to automate highly tedious and repetitive manual processes at my job.** The goal was successfully achieved – the tool saves dispatchers hours of manual clicking. Since my daily focus is on data, **I heavily utilized Artificial Intelligence (AI) to assist me in writing this code.** This project serves as proof that I can identify bottlenecks in company processes and effectively deliver a working business solution using modern technological tools.

---

## 🏗️ System Architecture

This project is built with a decoupled Full-Stack approach:

1. **Frontend (Browser Extension):** A Manifest V3 Chrome extension that injects floating command centers into internal operational dashboards and HR systems.
2. **Backend (Google Apps Script):** Two separate Google Sheets acting as databases and API endpoints (via `doPost` / `doGet` webhooks) to handle concurrent data streams.

---

## 🚀 Key Features

### 1. Operations Management Panel (Frontend + Backend)

A floating UI injected into the internal dispatch dashboard allowing mass-actions across multiple darkstores:

- **No manual data entry (Auto-Sync):** The extension is directly connected to Google Sheets. Every action in the system (e.g., closing a store, changing status) automatically populates the appropriate reports in real-time. This eliminates manual data rewriting and prevents human errors (Single Source of Truth).
- **Dynamic Delivery Time Adjustments:** Mass-update delivery time estimates based on weather/traffic. Connects to `TrafficWebhook.js`.
- **Store Status Toggling:** Instantly pause/resume order intake for specific zones with customizable, multi-language customer-facing messages.
- **Service Fee Policies:** Temporarily increase delivery fees (e.g., +5 PLN, +10 PLN) during high demand, logging data straight to the database.
- **Telegram Integration:** Automatically dispatches alerts to specific regional Telegram channels whenever a zone's status or delivery timeframe changes.

### 2. HR & Shift Automation / Kadromierz Scraper (Frontend)

- **Live Shift Radar:** Scrapes and analyzes active shifts in real-time to provide alerts for missing clock-ins or unlogged clock-outs.
- **Auto-Shift Bridging (Łamanki):** An automated DOM-manipulation script that clicks through the HR interface to automatically close and split overlapping shifts. **It turns a tedious 15-minute clicking process into a 5-second automated task.**
- **Clipboard Reporting:** Generates instant, formatted reports of late or absent couriers.

### 3. Daily Command Center & Report Generator (Backend)

Located directly inside the Google Sheets operational database (`Automat.js` & `Sidebar.html`):

- **Custom UI Sidebar:** Built with HTML/CSS/JS, allowing dispatchers to easily queue incidents (stolen orders, courier delays, screenshots of queues).
- **Automated Gmail Drafts:** Parses the queued data and auto-generates a daily HTML email report, attaching images (screenshots) directly inline, and saves it as a draft for the management team.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), Web Scraping, DOM Manipulation, HTML/CSS.
- **Backend:** Google Apps Script (GAS), Google Sheets API, Gmail API, Google Drive API.
- **External Integrations:** Telegram Bot API, internal REST APIs.

<br><br>

---

---

<br><br>

# 🇵🇱 Wersja Polska

# Automatyzacja Operacji Q-Commerce 🦊

Kompleksowe rozszerzenie do przeglądarki oraz backend oparty na Google Apps Script, zaprojektowane w celu automatyzacji codziennych operacji, zarządzania darkstore'ami, modyfikacji zmian HR oraz generowania dziennych raportów dla platformy quick-commerce (szybkich dostaw).

> **⚠️ Informacja o bezpieczeństwie:** Ze względów poufności (NDA) i bezpieczeństwa operacyjnego, to repozytorium jest zanonimizowaną wersją oryginalnego projektu. Wszystkie prawdziwe endpointy API, tokeny botów, ID arkuszy, ID folderów Google Drive oraz wewnętrzne nazwy firmy zostały zastąpione danymi zastępczymi (placeholderami).

---

## 💡 O autorze i powstaniu projektu

Moja główna ścieżka rozwoju i codzienna praca to **dane i analityka** (w tym kierunku się kształcę). Ten projekt nie powstał po to, aby zrobić ze mnie front-end developera, ale z czysto pragmatycznej potrzeby: **chciałem zautomatyzować niezwykle żmudne i powtarzalne procesy manualne w mojej pracy**.

Cel został w pełni osiągnięty – narzędzie oszczędza dyspozytorom godziny ręcznego klikania. Ponieważ na co dzień skupiam się na danych, **przy pisaniu tego kodu w dużej mierze wspomagałem się Sztuczną Inteligencją (AI)**. Projekt ten jest dowodem na to, że potrafię zidentyfikować wąskie gardło w procesach firmy i skutecznie dowieźć działające rozwiązanie biznesowe, wykorzystując do tego nowoczesne narzędzia technologiczne.

---

## 🏗️ Architektura Systemu

Projekt został zbudowany z podziałem na Frontend i Backend:

1. **Frontend (Rozszerzenie przeglądarki):** Rozszerzenie w architekturze Manifest V3, które wstrzykuje pływające panele dowodzenia (Command Centers) do wewnętrznych systemów operacyjnych oraz platformy HR.
2. **Backend (Google Apps Script):** Dwa oddzielne Arkusze Google pełniące rolę baz danych i endpointów API (poprzez webhooki `doPost` / `doGet`), obsługujące równoległe strumienie danych.

---

## 🚀 Główne funkcje

### 1. Panel Zarządzania Operacjami (Frontend + Backend)

Pływający interfejs wstrzykiwany do wewnętrznego panelu dyspozytorskiego, pozwalający na masowe operacje na wielu darkstore'ach jednocześnie:

- **Brak ręcznego wprowadzania danych (Auto-Sync):** Rozszerzenie jest bezpośrednio podpięte pod Arkusze Google. Każda akcja w systemie (np. zamknięcie sklepu, zmiana statusu) automatycznie, w czasie rzeczywistym uzupełnia odpowiednie raporty i tabele w Arkuszach. Eliminuje to konieczność żmudnego przepisywania danych przez dyspozytorów i zapobiega błędom ludzkim (tzw. Single Source of Truth).
- **Dynamiczne dostosowywanie czasów dostaw:** Masowa zmiana czasów dostaw w zależności od pogody/ruchu drogowego. Łączy się z arkuszem poprzez `TrafficWebhook.js`.
- **Zarządzanie statusem sklepów:** Błyskawiczne wstrzymywanie i wznawianie przyjmowania zamówień dla wybranych stref z możliwością personalizacji wielojęzycznych komunikatów dla klientów.
- **Zarządzanie Polityką Opłat:** Tymczasowe zwiększanie opłat za dostawę (np. +5zł, +10zł) w okresach wysokiego popytu, logujące się prosto do bazy danych.
- **Integracja z Telegramem:** Automatyczne wysyłanie alertów na dedykowane, regionalne kanały Telegram za każdym razem, gdy zmienia się status strefy lub okno czasowe dostawy.

### 2. Automatyzacja HR / Web Scraping (Frontend)

- **Radar Zmian na żywo:** Analiza i scrapowanie aktywnych zmian (Kadromierz) w czasie rzeczywistym, wysyłająca alerty o brakujących odbiciach "wejścia" lub "wyjścia" z pracy.
- **Auto-Łamanki (Łączenie zmian):** Zautomatyzowany skrypt manipulujący modelem DOM, który przeklikuje się przez interfejs HR, aby automatycznie zamykać i rozdzielać nakładające się zmiany. **Zamienia 15-minutowy, frustrujący proces ręczny w 5-sekundowe kliknięcie.**
- **Raportowanie do schowka:** Generowanie gotowych, sformatowanych raportów o spóźnionych i nieobecnych kurierach bezpośrednio do schowka systemowego.

### 3. Generator Raportów (Backend)

Umiejscowiony bezpośrednio w głównym Arkuszu Google bazy operacyjnej (`Automat.js` & `Sidebar.html`):

- **Niestandardowy Panel Boczny (Sidebar):** Zbudowany w HTML/CSS/JS, pozwalający dyspozytorom łatwo dodawać incydenty do kolejki (skradzione zamówienia, opóźnienia, zrzuty ekranu kolejek).
- **Automatyczne Szkice Gmail:** Skrypt przetwarza zakolejkowane dane i automatycznie generuje dzienny raport email w formacie HTML, osadza zdjęcia bezpośrednio w treści i zapisuje go jako gotowy do wysłania szkic dla kadry menedżerskiej.

---

## 🛠️ Technologie

- **Frontend:** Vanilla JavaScript (ES6+), Web Scraping, Manipulacja DOM, HTML/CSS.
- **Backend:** Google Apps Script (GAS), Google Sheets API, Gmail API, Google Drive API.
- **Zewnętrzne Integracje:** Telegram Bot API, Wewnętrzne REST API.
