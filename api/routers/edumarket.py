from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

# In-memory mock DB (replace with contract calls in production)
COURSE_NFTS = {}

router = APIRouter()

class CourseNFT(BaseModel):
    id: str
    creator: str
    owner: str
    metadata: str
    price: Decimal
    sold: bool

class MintCourseNFTRequest(BaseModel):
    id: str
    metadata: str
    price: Decimal
    creator: str

class BuyCourseNFTRequest(BaseModel):
    id: str
    buyer: str
    amount: Decimal

@router.post("/edumarket/mint", response_model=CourseNFT)
def mint_course_nft(req: MintCourseNFTRequest):
    if req.id in COURSE_NFTS:
        raise HTTPException(status_code=400, detail="Course already exists")
    nft = CourseNFT(
        id=req.id,
        creator=req.creator,
        owner=req.creator,
        metadata=req.metadata,
        price=req.price,
        sold=False
    )
    COURSE_NFTS[req.id] = nft
    return nft

@router.post("/edumarket/buy", response_model=CourseNFT)
def buy_course_nft(req: BuyCourseNFTRequest):
    nft = COURSE_NFTS.get(req.id)
    if not nft:
        raise HTTPException(status_code=404, detail="CourseNFT not found")
    if nft.sold:
        raise HTTPException(status_code=400, detail="Course already sold")
    if req.amount < nft.price:
        raise HTTPException(status_code=400, detail="Insufficient payment")
    # Fee logic (2%)
    fee = nft.price * Decimal('0.02')
    payout = nft.price - fee
    # In production: transfer payout to creator, fee to scholarship fund
    nft.owner = req.buyer
    nft.sold = True
    COURSE_NFTS[req.id] = nft
    return nft

@router.get("/edumarket/{id}", response_model=CourseNFT)
def get_course_nft(id: str):
    nft = COURSE_NFTS.get(id)
    if not nft:
        raise HTTPException(status_code=404, detail="CourseNFT not found")
    return nft

@router.get("/edumarket", response_model=List[CourseNFT])
def list_course_nfts(sold: Optional[bool] = None):
    nfts = list(COURSE_NFTS.values())
    if sold is not None:
        nfts = [n for n in nfts if n.sold == sold]
    return nfts
