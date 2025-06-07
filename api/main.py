from fastapi import FastAPI
from routers import permissions, permissions_service_router

app = FastAPI()

app.include_router(permissions.router)
app.include_router(permissions_service_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cosmos Permissioned Network API"}