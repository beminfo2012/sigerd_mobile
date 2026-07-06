from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()
handler = app

@app.get("/api/hello")
@app.get("/")
def hello():
    return JSONResponse(status_code=200, content={"message": "Python Vercel Funciona!"})
