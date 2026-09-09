# 📦 UPS SmartOps: Predictive Logistics Analytics & Workforce Optimization Platform

An enterprise-grade decision-support web application for logistics, parcel hub, and warehouse operations managers.

---

## 🚀 Core Decision-Support Narrative

```
   1. Historical Patterns
      "Here is what happened."
             ↓
   2. Meta Prophet Forecasts (Inbound & Outbound)
      "Here is what workload we expect to happen."
             ↓
   3. Capacity & Workforce Planning
      "Here is how much workforce we will need."
             ↓
   4. Capacity Gap Detection
      "Here is whether our current capacity is sufficient."
             ↓
   5. Expected Processing Time
      "Here is how long the workload will take."
             ↓
   6. Cross-Dock Resource Balancer & Directives
      "Here is what the manager can do."
```

---

## 🌟 Key Features

1. **Independent Facebook/Meta Prophet Pipelines**:
   - Separate time-series pipelines for **Inbound** and **Outbound** operations (never conflated into one model).
   - Learns trend, weekly sortation rhythms, and 90% confidence uncertainty intervals.
   - Dynamic forecast horizons (7, 14, 30 days).
   - Time-based backtesting validation displaying **MAE**, **RMSE**, and **MAPE (%)**.

2. **Deterministic Operational Capacity Calculator**:
   - Calculates required workers:
     $$\text{Required Workers} = \lceil \frac{\text{Forecasted Stock}}{\text{Processing Rate} \times \text{Shift Hours}} \rceil$$
   - Calculates processing duration with available staffing:
     $$\text{Expected Duration} = \frac{\text{Forecasted Stock}}{\text{Available Workers} \times \text{Processing Rate}}$$
   - Classifies status as **Optimal**, **Warning**, **Critical**, or **Surplus**.

3. **Resource Optimization & Cross-Dock Balancer**:
   - Identifies cross-functional shift imbalances (e.g. Inbound shortage + Outbound surplus).
   - Recommends feasible worker reallocations without exceeding total available facility headcount.
   - Generates ranked actionable directives for operations managers.

4. **Interactive What-If Scenario Sandbox**:
   - Real-time sliders for Workload volume, Staffing levels, Processing speed, Shift limits, and Peak-Hour congestion.
   - Live sensitivity curve plotting expected duration vs. worker count with shift limit cutoff thresholds.

5. **Data Management & Demo Mode**:
   - Preloaded with realistic 90-day historical data and operational shift logs.
   - CSV upload support with real-time schema validation and summary statistics.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, FastAPI, Facebook Prophet, Pandas, NumPy, Scikit-learn, Uvicorn
- **Frontend**: React 18, Vite, Recharts, Lucide React, Custom Glassmorphism Design System
- **Containerization**: Docker, Docker Compose, Nginx

---

## ⚡ Quick Start

### Option 1: Run with Docker Compose (Recommended)

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API & Swagger Docs: `http://localhost:8000/docs`

### Option 2: Run Locally (Development)

#### 1. Backend:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python generate_demo_data.py
uvicorn main:app --reload --port 8000
```

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status |
| `GET` | `/api/dashboard/summary` | Complete unified executive dashboard payload |
| `POST` | `/api/forecast/inbound` | Inbound Prophet forecast pipeline with accuracy metrics |
| `POST` | `/api/forecast/outbound` | Outbound Prophet forecast pipeline with accuracy metrics |
| `POST` | `/api/workforce/plan` | Inbound & Outbound workforce and capacity timeline |
| `POST` | `/api/optimize` | Cross-dock labor rebalancing and AI directives |
| `POST` | `/api/scenario` | What-If parameter sensitivity simulation |
| `POST` | `/api/upload/{type}` | Upload custom historical or operational CSVs |
| `GET` | `/api/demo-data/stats` | Summary statistics of active datasets |
