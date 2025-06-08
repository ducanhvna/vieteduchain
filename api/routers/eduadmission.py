from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List, Dict

router = APIRouter()

# In-memory stores
seats: Dict[str, dict] = {}  # seat_id -> seat info
scores: Dict[str, dict] = {}  # candidate_hash -> score
results: Dict[str, dict] = {}  # candidate_hash -> result

class MintSeatRequest(BaseModel):
    seat_id: str

class BurnSeatRequest(BaseModel):
    seat_id: str

class PushScoreRequest(BaseModel):
    candidate_hash: str
    score: int

class RunMatchingRequest(BaseModel):
    pass

class AddSeatRequest(BaseModel):
    seat_id: str
    student_id: str
    school: str
    major: str
    year: int

class AddScoreRequest(BaseModel):
    score_id: str
    student_id: str
    subject: str
    score: float
    year: int

class AddResultRequest(BaseModel):
    result_id: str
    student_id: str
    school: str
    status: str
    year: int

@router.post("/eduadmission/mint_seat")
def mint_seat(req: MintSeatRequest):
    if req.seat_id in seats:
        raise HTTPException(status_code=400, detail="Seat already exists.")
    seats[req.seat_id] = {"id": req.seat_id, "owner": None, "burned": False}
    return {"success": True, "seat": seats[req.seat_id]}

@router.post("/eduadmission/burn_seat")
def burn_seat(req: BurnSeatRequest):
    seat = seats.get(req.seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found.")
    if seat["burned"]:
        raise HTTPException(status_code=400, detail="Seat already burned.")
    seat["burned"] = True
    seat["owner"] = None
    return {"success": True, "seat": seat}

@router.post("/eduadmission/push_score")
def push_score(req: PushScoreRequest):
    scores[req.candidate_hash] = {"candidate_hash": req.candidate_hash, "score": req.score}
    return {"success": True, "score": scores[req.candidate_hash]}

@router.post("/eduadmission/run_matching")
def run_matching():
    # Sort candidates by score desc, assign to available seats
    available_seats = [s for s in seats.values() if not s["burned"] and s["owner"] is None]
    sorted_candidates = sorted(scores.values(), key=lambda x: -x["score"])
    results.clear()
    for i, candidate in enumerate(sorted_candidates):
        seat = available_seats[i] if i < len(available_seats) else None
        result = {
            "candidate_hash": candidate["candidate_hash"],
            "seat_id": seat["id"] if seat else None,
            "admitted": seat is not None,
            "score": candidate["score"]
        }
        if seat:
            seat["owner"] = candidate["candidate_hash"]
        results[candidate["candidate_hash"]] = result
    return {"success": True, "results": list(results.values())}

@router.get("/eduadmission/get_seat")
def get_seat(seat_id: str):
    seat = seats.get(seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found.")
    return seat

@router.get("/eduadmission/get_score")
def get_score(candidate_hash: str):
    score = scores.get(candidate_hash)
    if not score:
        raise HTTPException(status_code=404, detail="Score not found.")
    return score

@router.get("/eduadmission/get_result")
def get_result(candidate_hash: str):
    result = results.get(candidate_hash)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found.")
    return result

@router.get("/eduadmission/list_results")
def list_results():
    return list(results.values())

@router.get("/eduadmission/list_seats")
def list_seats():
    return list(seats.values())

@router.get("/eduadmission/list_scores")
def list_scores():
    # Ưu tiên trả về các bản ghi có trường score_id (dạng AddScoreRequest/dummy), nếu không thì trả về các bản ghi cũ
    score_list = [s for s in scores.values() if "score_id" in s]
    if not score_list:
        # fallback: trả về các bản ghi cũ dạng {candidate_hash, score}
        score_list = [
            {
                "score_id": k,
                "student_id": v.get("candidate_hash", ""),
                "subject": "",
                "score": v.get("score", 0),
                "year": ""
            }
            for k, v in scores.items()
        ]
    return score_list

class AssignSeatRequest(BaseModel):
    seat_id: str
    candidate_hash: str

@router.post("/eduadmission/assign_seat")
def assign_seat(req: AssignSeatRequest):
    seat = seats.get(req.seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found.")
    if seat["burned"]:
        raise HTTPException(status_code=400, detail="Seat already burned.")
    if seat["owner"] is not None:
        raise HTTPException(status_code=400, detail="Seat already assigned.")
    seat["owner"] = req.candidate_hash
    seat["burned"] = True  # Burn seat after assignment (xác nhận nhập học)
    return {"success": True, "seat": seat}

@router.post("/eduadmission/add_seat")
def add_seat(req: AddSeatRequest):
    if req.seat_id in seats:
        raise HTTPException(status_code=400, detail="Seat already exists.")
    seat = req.dict()
    seats[req.seat_id] = seat
    return {"success": True, "seat": seat}

@router.post("/eduadmission/add_score")
def add_score(req: AddScoreRequest):
    if req.score_id in scores:
        raise HTTPException(status_code=400, detail="Score already exists.")
    score = req.dict()
    scores[req.score_id] = score
    return {"success": True, "score": score}

@router.post("/eduadmission/add_result")
def add_result(req: AddResultRequest):
    if req.result_id in results:
        raise HTTPException(status_code=400, detail="Result already exists.")
    result = req.dict()
    results[req.result_id] = result
    return {"success": True, "result": result}
