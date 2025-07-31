# LayerNEXUS

**Turn messy CSVs into production-ready database schemas — complete with SQL and ER diagrams.**

LayerNEXUS is a full-stack, AI-assisted data normalization and schema generation tool. Designed for analysts, data engineers, and teams dealing with messy exports, it helps you go from spaghetti data to clean, normalized SQL with just a few clicks.

---

## 🔥 Tags

`data-normalization` `csv-to-sql` `erd-generator` `ai-powered` `fullstack` `docker` `react` `fastapi` `postgresql` `opensource`

---

## ✨ Features

- 🧠 **AI-Powered Schema Fix**: Normalize flat files into 3NF schemas
- 📊 **ER Diagram Preview**: Mermaid-based relational diagram generator
- 📂 **Multi-File Upload**: Batch processing and table inference
- 💾 **Multi-Dialect SQL Output**: PostgreSQL, MySQL, SQLite, MongoDB
- 🔐 **PII Masking**: Email, phone, name masking using Presidio
- 🐳 **Docker Deployment**: Full-stack Docker support with DB + frontend

---

## 🚀 Quickstart

### 1. Clone
```bash
git clone https://github.com/yourusername/layernexus.git
cd layernexus
```

### 2. Configure
Copy `.env.example` to `.env` and provide any needed variables:
```bash
cp .env.example .env
```

### 3. Start with Docker Compose
```bash
docker-compose up --build
```
Then visit `http://localhost:3000`

---

## 📁 Project Structure

```
layernexus/
├── backend/           # FastAPI + PII masking + schema inference
│   └── Dockerfile
├── frontend/          # React + Tailwind + ERD preview
│   └── Dockerfile
├── docker-compose.yml
├── .env.example       # Environment template
├── LICENSE            # MIT License
├── README.md          # You're here!
└── docs/              # Screenshots, diagrams (optional)
```

---

## 📸 Screenshots

> Add images like:
> - Upload flow
> - AI schema review output
> - ERD preview

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Pull requests welcome. Good first issues:
- Add new dialect (BigQuery, Oracle)
- Add row preview for CSVs
- Improve join prediction accuracy

---

## 💬 Creator’s Note

> This project was built to solve a real frustration — turning messy Excel or CSV exports into clean, connected databases.
> If this project helps you, please consider giving it a ⭐ star.

Thanks for checking it out!

— Max
