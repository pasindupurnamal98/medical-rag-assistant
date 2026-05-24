from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware

app = FastAPI(title="Medical Assistant API",description="API for a medical assistant application",version="1.0.0")

#CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development, restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
    alow_credentials=["*"],
)

#Exception Handling Middleware
app.middleware("http")(catch_exception_middleware)