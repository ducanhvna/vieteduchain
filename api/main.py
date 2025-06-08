from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import permissions, permissions_service_router, educert, eduid, edupay, researchledger, eduadmission, nodeinfo

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(permissions.router)
app.include_router(permissions_service_router.router)
app.include_router(educert.router)
app.include_router(eduid.router)
app.include_router(edupay.router)
app.include_router(researchledger.router)
app.include_router(eduadmission.router)
app.include_router(nodeinfo.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cosmos Permissioned Network API"}