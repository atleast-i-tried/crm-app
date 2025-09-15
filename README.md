# EngageCRM 📩

EngageCRM is a scalable customer engagement platform built for marketing and communication teams. It provides powerful campaign management, intelligent customer segmentation, and background delivery pipelines (via RabbitMQ) to ensure reliable message delivery at scale.

---

##  Features

* **Campaign Management** – Create, queue, and track campaigns with filters and logic (AND/OR).
* **Customer Segmentation** – Filter customers by spend, visits, or inactivity.
* **Background Processing** – Asynchronous delivery using RabbitMQ + worker processes.
* **Vendor Integration** – Unified API layer to send SMS/WhatsApp/Email via third-party vendors.
* **Logs & Analytics** – Track campaign delivery, success, and failures.
* **Authentication** – Secure routes with NextAuth (Google OAuth, Credentials).
* **Scalable Architecture** – Decoupled ingestion/delivery flows for high throughput.

---

##  Architecture

```
Next.js (App Router)
│
├── API Routes (/api)
│    ├── campaigns        → Create & list campaigns
│    ├── customers        → CRUD customers
│    ├── vendor/send      → Forward to vendor APIs (SMS/WhatsApp)
│    ├── logs             → Fetch campaign logs
│    └── auth/[...nextauth] → Authentication (NextAuth)
│
├── MongoDB              → Stores campaigns, customers, logs
├── RabbitMQ             → Message broker for async processing
└── Worker (Node.js)     → Consumes jobs, applies filters, calls vendor APIs
```

---

##  Project Structure

```
engageCRM/
├── app/
│   ├── api/             # API routes
│   │   ├── campaigns/
│   │   ├── customers/
│   │   ├── logs/
│   │   └── vendor/
│   ├── dashboard/       # Frontend UI
│   └── auth/            # Authentication pages
├── lib/                 # Database + RabbitMQ helpers
├── models/              # Mongoose models
├── workers/             # Background workers
├── public/              # Static assets
└── README.md
```

---

## ⚙ Backend Routes

### Campaigns

* `GET /api/campaigns` → List all campaigns.
* `POST /api/campaigns` → Create campaign, publish job to RabbitMQ.

  ```json
  {
    "name": "Loyalty Push",
    "message": "Thanks for shopping!",
    "filters": [ { "key": "minSpend", "value": 500 } ],
    "logic": "AND",
    "createdBy": "admin@example.com"
  }
  ```

  Response:

  ```json
  {
    "campaign": { ... },
    "matchedCustomers": 120,
    "queued": true
  }
  ```

### Customers

* `GET /api/customers` → List customers.
* `POST /api/customers` → Add new customer.
* `PUT /api/customers/:id` → Update customer.
* `DELETE /api/customers/:id` → Delete customer.

### Logs

* `GET /api/logs?campaignId=123` → Fetch campaign logs with statuses.

### Vendor API

* `POST /api/vendor/send` → Proxy to vendor integrations.

  ```json
  {
    "to": "+9199999999",
    "message": "Hello",
    "channel": "whatsapp"
  }
  ```

### Authentication

* `GET /api/auth/[...nextauth]` → Google OAuth + Credentials login.

---

##  Frontend Routes (Dashboard)

* `/dashboard`

  * Overview of campaigns & customers.
* `/dashboard/campaigns`

  * List campaigns with stats & logs.
  * Create new campaigns.
* `/dashboard/customers`

  * Manage customer list (add/edit/delete).
* `/dashboard/logs`

  * View per-campaign logs.

---

## 🛠 Worker (Background Processor)

* Consumes messages from `campaignQueue`.
* Applies filters and logic to fetch matching customers.
* Sends messages via `/api/vendor/send`.
* Logs results in `CampaignLog` collection.

Run worker:

```bash
node workers/campaignWorker.js
```

---

##  Models

### Customer

```ts
{
  name: String,
  phone: String,
  totalSpend: Number,
  visits: Number,
  lastActive: Date
}
```

### Campaign

```ts
{
  name: String,
  message: String,
  filters: Array,
  logic: "AND" | "OR",
  createdBy: String,
  createdAt: Date
}
```

### CampaignLog

```ts
{
  campaignId: ObjectId,
  customerId: ObjectId,
  status: "SENT" | "FAILED",
  error?: String,
  timestamp: Date
}
```

---

##  Setup & Run

### Prerequisites

* Node.js 18+
* MongoDB (local or Atlas)
* RabbitMQ (local or CloudAMQP)

### Installation

```bash
git clone https://github.com/your-org/engageCRM.git
cd engageCRM
npm install
```

### Environment Variables (`.env.local`)

```
MONGODB_URI=mongodb://localhost:27017/engagecrm
RABBITMQ_URL=amqp://localhost
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=yyy
```

### Run Dev Server

```bash
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

### Start Worker

```bash
node workers/campaignWorker.js
```

---





