<img width="800" height="450" alt="OnBoard-website-intro-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/a6cdca88-f656-4392-b0a6-b530067801aa" />
# OnBoard — Yacht Crew Marketplace

---

## Tech Stack

### Backend

- **FastAPI** — REST API with automatic OpenAPI/Swagger docs
- **SQLAlchemy 2.0** — ORM with a relational data model across 11 tables
- **Alembic** — database migrations
- **PostgreSQL** — primary database
- **JWT (HS256)** — stateless authentication with role-based access control (owner / crew / admin)
- **bcrypt / passlib** — password hashing
- File upload pipeline with MIME-type validation and on-disk storage

### Frontend

- **React 18 + TypeScript** — component-driven UI
- **Vite** — build tooling
- **TailwindCSS** — utility-first styling with a custom design token system
- **React Router v6** — client-side routing with auth and role guards

---

## What I Built & Learned

This project is a full-stack, two-sided marketplace built entirely from scratch. The emphasis was on backend and API development:

- **Designed a REST API from scratch** — resource naming, HTTP semantics, status codes, and a clear contract between the frontend and backend via Pydantic schemas
- **JWT authentication flow** — token issuance on login/register, middleware-level validation, and role-based route guards
- **Relational data modelling** — 11 tables with one-to-one, one-to-many, and many-to-many relationships, unique constraints, and cascade deletes
- **Database migrations** — versioned schema changes with Alembic so the DB can be reproduced on any machine
- **File upload handling** — secure multipart uploads with MIME and size validation, UUID-based file naming, and static file serving
- **Two-sided marketplace logic** — matching algorithm that compares availability schedules between job postings and crew listings
- **Polling-based notifications** — the frontend polls the API every ~20 s to surface unread messages and new application events
- **Full-stack integration** — wiring a TypeScript fetch client to a FastAPI backend, handling auth headers, and keeping Pydantic schemas in sync with frontend TypeScript interfaces

---

## What You Need to Install

- **Node.js** (LTS) — [nodejs.org](https://nodejs.org)
- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **PostgreSQL 15+** — [postgresql.org](https://www.postgresql.org/download/)

---

## How to Open a Terminal

- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type "Terminal", press Enter

---

## Setup (do this only once)

### 1. Environment variables

Create a file called `.env` at the root of the project with the following content:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/onboard
SECRET_KEY=replace-with-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Replace `yourpassword` with your PostgreSQL password and create a database named `onboard` (or change the name in the URL).

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 3. Frontend

From the **repo root**:

```bash
npm install
```

---

## How to Run

You need two terminals open — one for each side.

### Backend (terminal 1)

```bash
cd backend
venv\Scripts\activate   # or: source venv/bin/activate on Mac/Linux
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`.  
Interactive API docs (Swagger UI): `http://localhost:8000/docs`

### Frontend (terminal 2)

From the repo root:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

To stop either server, press `Ctrl + C` in its terminal.
