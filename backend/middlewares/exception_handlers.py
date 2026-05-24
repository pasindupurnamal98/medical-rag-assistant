from fastapi import FastAPI
from fastapi.responses import JSONResponse
from logger import Logger

async def catch_exception_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
       
    except Exception as exc:
        Logger.error(f"Unhandled exception: {str(exc)}")
        return JSONResponse(status_code=500, contents={"error": str(exc)})
    
