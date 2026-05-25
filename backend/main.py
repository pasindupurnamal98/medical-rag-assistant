from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from routes.upload_pdfs import router as upload_router
from backend.routes.ask_question import router as ask_router

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

#routers


#1.upload pdfs
app.include_router(upload_router)

#2.ask question
app.include_router(ask_router)