import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.routes.api_routes import router
from backend.app.utils.paths import resolve_path

app = FastAPI(
    title="Order-Time Late Delivery Risk Prediction and Operations Review Framework",
    description="Enterprise Logistics Intelligence Platform for DATA THIRAN 2026 (Problem Statement DT-LSC-04)",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs/charts for direct visual inspection if needed
charts_dir = resolve_path("outputs", "charts")
if os.path.exists(charts_dir):
    app.mount("/outputs/charts", StaticFiles(directory=charts_dir), name="charts")

# Include API Router
app.include_router(router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Order-Time Late Delivery Risk Prediction Platform",
        "hackathon": "DATA THIRAN 2026",
        "problem_id": "DT-LSC-04",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
