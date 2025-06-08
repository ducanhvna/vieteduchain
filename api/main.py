from fastapi import FastAPI
from routers import permissions, permissions_service_router, educert, eduid, edupay, researchledger

app = FastAPI()

app.include_router(permissions.router)
app.include_router(permissions_service_router.router)
app.include_router(educert.router)
app.include_router(eduid.router)
app.include_router(edupay.router)
app.include_router(researchledger.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cosmos Permissioned Network API"}