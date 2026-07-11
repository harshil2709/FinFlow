# FinFlow | Premium Full-Stack Expense & Budget Tracker

FinFlow is a resilient, feature-rich financial dashboard built on the **MERN (MongoDB, Express, React, Node.js)** stack. It offers real-time analytics, category budgeting, and transaction compliance, wrapped in a premium glassmorphic dark-themed user interface.

---

## 🚀 Key Highlights (For Resume / Interviews)

- **Resilient Hybrid Storage Engine**: Architected a custom fail-safe database connection system that dynamically tests local/cloud MongoDB connectivity (with a 2s timeout) and automatically falls back to local JSON flat-file storage when database clusters are unreachable, ensuring **100% uptime**.
- **Interactive Financial Analytics**: Developed time-series trend lines and category distribution doughnut charts utilizing `react-chartjs-2`, displaying instant updates as CRUD operations occur.
- **Budget Compliance Monitor**: Programmed a category-wise limit tracking engine showing real-time visual progress gauges (Safe, Warning, Exceeded) comparing actual spend against limits.
- **Auto-Debit Subscriptions Tracker**: Engineered a recurring billing tracker that aggregates fixed monthly auto-debits (normalizing yearly fees) and renders a color-coded upcoming payment timeline with dynamic alerts.
- **Data Export & Portability**: Integrated a client-side CSV encoder enabling instant, custom-filtered data downloads based on search text, categories, dates, and transaction types.
- **Placement Demonstration Mode**: Added an automated seeding engine to populate the database with comprehensive mock transactions and budgets, facilitating friction-free recruiter evaluations.

---

## 🛠️ Tech Stack & Architecture

```mermaid
graph TD
    subgraph Frontend (React + Vite)
        A[Dashboard UI] -->|API Calls| B[Fetch API Services]
        C[Custom Glassmorphism CSS] -.-> A
        A -->|Interactive Visualizations| D[Chart.js / React-Chartjs-2]
    end

    subgraph Backend (Express.js / Node.js)
        B -->|REST Requests| E[server.js Gateway]
        E -->|Routing Layer| F[expenseroutes.js]
        F -->|Business Logic| G[expensecontroller.js]
    end

    subgraph Storage Layer
        G -->|Dynamic Driver Check| H{Mongoose Active?}
        H -->|Yes| I[(MongoDB Cloud / Local)]
        H -->|No Fallback| J[(Local JSON Storage)]
    end
```

- **Frontend**: React (Vite), Chart.js, Lucide Icons
- **Backend**: Node.js, Express.js, Cors, Dotenv, Nodemon
- **Database / Storage**: MongoDB (Mongoose ODM) & Local File System (JSON Flat-files)
- **Styling**: Vanilla CSS Variables (Sleek Glassmorphic Palette, Keyframe Animations)

---

## 📋 API Specifications

All endpoints are prefixed with `/api`.

### Transactions API

| Endpoint | Method | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `/expenses` | `GET` | Fetches filtered transactions | *Query params: `type`, `category`, `search`, `startDate`, `endDate`* |
| `/expenses` | `POST` | Creates a transaction | `{"title": "Internet", "amount": 1500, "type": "expense", "category": "Utilities"}` |
| `/expenses/:id` | `PUT` | Updates a transaction | `{"title": "Gourmet Dinner", "amount": 1800}` |
| `/expenses/:id` | `DELETE`| Deletes a transaction | *None* |

### Budgets API

| Endpoint | Method | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `/budgets` | `GET` | Get all budget category limits | *None* |
| `/budgets` | `POST` | Upsert budget limit | `{"category": "Food", "limit": 8000}` |
| `/budgets/:id` | `DELETE`| Delete budget limit | *None* |

### System Status API

| Endpoint | Method | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `/status` | `GET` | Get live database connection type | *None* |

### Subscriptions API

| Endpoint | Method | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `/subscriptions` | `GET` | Get auto-debit subscriptions | *None* |
| `/subscriptions` | `POST` | Create a subscription | `{"title": "Spotify", "amount": 119, "billingCycle": "monthly", "category": "Entertainment", "nextDueDate": "2026-07-21"}` |
| `/subscriptions/:id` | `PUT` | Update subscription status/details | `{"status": "paused"}` |
| `/subscriptions/:id` | `DELETE`| Remove subscription | *None* |

---

## 🏃‍♂️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Optional; falls back to local storage if not running)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/expense-tracker
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.
