from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    applications,
    auth,
    availability,
    certifications,
    listings,
    messages,
    users,
)

app = FastAPI(title="Crew Platform API", version="1.0.0")

# Frontend runs on Vite (5173 dev, 4173 preview). Adjust for production later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}


API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["users"])
app.include_router(availability.router,prefix=f"{API_PREFIX}/availability-schedules", tags=["availability"])
# listings, applications and messages use routes that already contain their resource
# names (e.g. /job-postings, /crew-listings, /conversations), so they mount at the base prefix.
app.include_router(listings.router, prefix=API_PREFIX, tags=["listings"])
app.include_router(applications.router, prefix=API_PREFIX, tags=["applications"])
app.include_router(messages.router, prefix=API_PREFIX, tags=["messages"])
app.include_router(certifications.router, prefix=f"{API_PREFIX}/certifications", tags=["certifications"])
