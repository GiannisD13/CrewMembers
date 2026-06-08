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
- **JWT authentication flow** — token issuance on login/register, middleware-level validation, and role-based route guards (`require_owner`, `require_crew`, `require_admin`)
- **Relational data modelling** — 11 tables with one-to-one, one-to-many, and many-to-many relationships, unique constraints, and cascade deletes
- **Database migrations** — versioned schema changes with Alembic so the DB can be reproduced on any machine
- **File upload handling** — secure multipart uploads with MIME and size validation, UUID-based file naming, and static file serving
- **Two-sided marketplace logic** — matching algorithm that compares availability schedules between job postings and crew listings
- **Polling-based notifications** — the frontend polls the API every ~20 s to surface unread messages and new application events
- **Full-stack integration** — wiring a TypeScript fetch client to a FastAPI backend, handling auth headers, and keeping Pydantic schemas in sync with frontend TypeScript interfaces

---

## What You Need to Install

### Node.js

Node.js is the only thing you need to run the interface.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Click the big green **"LTS"** button to download
3. Open the downloaded file and follow the installer (keep clicking Next/Accept until it's done)

---

## How to Open a Terminal

- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type "Terminal", press Enter

---

## Setup (do this only once)

Open a terminal, navigate to the project folder, and run:

```
npm install
```

For example on Windows, if the folder is on the Desktop:
```
cd C:\Users\YourName\Desktop\OnBoard
npm install
```

This downloads everything the project needs. Wait until it finishes.

---

## How to Run

Every time you want to open the app, navigate to the project folder in a terminal and run:

```
npm run dev
```

Then open your browser and go to:

```
http://localhost:5173
```

To stop it, go back to the terminal and press `Ctrl + C`.
