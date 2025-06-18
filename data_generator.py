"""
data_generator.py - Script to add comprehensive data to the ViEduChain-Hino system through the API
"""

import requests
import random
import string
import hashlib
import json
import os
import time
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# Default API base URL
API_BASE = 'http://localhost:8279/api'

# Configure logger
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_generator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DataGenerator")

# Parse command line arguments
parser = argparse.ArgumentParser(description='Generate data for ViEduChain-Hino system')
parser.add_argument('--api-base', help='API Base URL', default=API_BASE)
parser.add_argument('--module', help='Specific module to generate data for (eduadmission, eduid, educert, edupay, edumarket, researchledger)', default='all')
parser.add_argument('--count', help='Number of records to generate', type=int, default=10)
parser.add_argument('--dry-run', help='Print actions without executing API calls', action='store_true')
args = parser.parse_args()

# Update API base from arguments
API_BASE = args.api_base
DRY_RUN = args.dry_run
DATA_COUNT = args.count

# Create storage for generated data
class DataStore:
    def __init__(self):
        self.dids: List[str] = []
        self.nodes: List[Dict[str, str]] = []
        self.wallets: List[str] = []
        self.certificates: List[Dict[str, Any]] = []
        self.course_completions: List[Dict[str, Any]] = []
        self.degrees: List[Dict[str, Any]] = []
        self.nfts: List[str] = []
        self.seats: List[str] = []
        self.scores: List[Dict[str, Any]] = []
        self.research_papers: List[Dict[str, Any]] = []
        
        # Load from data.json if exists
        if os.path.exists('data.json'):
            try:
                with open('data.json', 'r') as f:
                    data = json.load(f)
                    for key, value in data.items():
                        if hasattr(self, key):
                            setattr(self, key, value)
                logger.info(f"Loaded existing data from data.json")
            except Exception as e:
                logger.error(f"Error loading data.json: {e}")
    
    def save(self):
        """Save all generated data to a JSON file"""
        data = {
            'dids': self.dids,
            'nodes': self.nodes,
            'wallets': self.wallets,
            'certificates': self.certificates,
            'course_completions': self.course_completions,
            'degrees': self.degrees,
            'nfts': self.nfts,
            'seats': self.seats,
            'scores': self.scores,
            'research_papers': self.research_papers
        }
        with open('data.json', 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved data to data.json")

# Initialize data store
data = DataStore()

# Helper to make API calls with logging and error handling
def api_call(endpoint: str, method: str = 'GET', json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{API_BASE}/{endpoint}"
    if DRY_RUN:
        logger.info(f"DRY RUN: {method} {url} - {json.dumps(json_data) if json_data else ''}")
        return {"success": True, "dry_run": True}
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url)
        else:  # POST
            response = requests.post(url, json=json_data)
        
        if response.status_code >= 400:
            logger.error(f"API Error: {method} {url} - Status {response.status_code}: {response.text}")
            return {"success": False, "error": response.text, "status_code": response.status_code}
        
        data = response.json()
        logger.info(f"API Success: {method} {url}")
        return data
    except Exception as e:
        logger.error(f"API Exception: {method} {url} - {str(e)}")
        return {"success": False, "error": str(e)}

# Helper to generate random dates
def random_date(start_date, end_date):
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_number_of_days)

# Helper to format dates for API
def format_date(date):
    return date.strftime("%Y-%m-%d")

# --- Data Generation Functions ---

# 1. Node Information
def generate_nodes():
    logger.info("Generating nodes...")
    universities = [
        "Đại học Quốc gia Hà Nội", 
        "Đại học Bách khoa Hà Nội", 
        "Đại học Ngoại thương",
        "Đại học Kinh tế Quốc dân", 
        "Đại học Y Hà Nội", 
        "Đại học Dược Hà Nội",
        "Đại học Sư phạm Hà Nội", 
        "Đại học Công nghệ thông tin", 
        "Đại học Thăng Long",
        "Đại học FPT", 
        "Đại học RMIT", 
        "Đại học Hà Nội",
        "Đại học Mở Hà Nội", 
        "Đại học Giao thông vận tải", 
        "Đại học Xây dựng"
    ]
    
    for i, univ in enumerate(universities[:DATA_COUNT], 1):
        node_id = f"node{i}"
        node_address = "0x" + ''.join(random.choices(string.hexdigits, k=40)).lower()
        node = {"id": node_id, "name": univ, "address": node_address}
        
        # Add node to nodeinfo
        result = api_call("nodeinfo/register", "POST", {
            "id": node_id,
            "name": univ,
            "address": node_address
        })
        
        if result.get("success", False) or DRY_RUN:
            data.nodes.append(node)
            logger.info(f"Added node: {node_id} - {univ}")
    
    return data.nodes

# 2. EduID Generation
def generate_dids():
    logger.info("Generating DIDs...")
    
    for i in range(1, DATA_COUNT + 1):
        did = f"did:viedu:{i:04d}"
        public_key = ''.join(random.choices(string.hexdigits, k=64)).lower()
        service_endpoint = f"https://service{i}.viedu.edu.vn"
        
        result = api_call("edu-id/register", "POST", {
            "did": did,
            "public_key": public_key,
            "service_endpoint": service_endpoint
        })
        
        if result.get("success", False) or DRY_RUN:
            data.dids.append(did)
            logger.info(f"Created DID: {did}")
    
    return data.dids

# 3. Certificate Generation
def generate_certificates():
    logger.info("Generating certificates...")
    
    if not data.dids:
        logger.warning("No DIDs found. Skipping certificate generation.")
        return []
    
    cert_types = ["degree", "course", "achievement"]
    cert_names = [
        "Bachelor of Science in Computer Science",
        "Master of Business Administration",
        "Professional Certificate in Data Science",
        "Certificate in Cybersecurity",
        "Doctorate in Engineering",
        "Certificate in Machine Learning",
        "Advanced Diploma in Programming",
        "Certificate in Web Development",
        "Postgraduate Certificate in Finance",
        "Certificate in Business Management"
    ]
    
    for i in range(1, DATA_COUNT + 1):
        student_did = random.choice(data.dids)
        certificate_type = random.choice(cert_types)
        certificate_name = random.choice(cert_names)
        issue_date = format_date(random_date(datetime(2020, 1, 1), datetime(2025, 6, 1)))
        issuer_did = random.choice(data.dids)  # Using DIDs as issuer DIDs
        metadata = json.dumps({"description": f"Certificate {i}", "additionalInfo": "Generated by script"})
        
        result = api_call("educert/create_certificate", "POST", {
            "student_did": student_did,
            "certificate_type": certificate_type,
            "certificate_name": certificate_name,
            "issue_date": issue_date,
            "issuer_did": issuer_did,
            "metadata": metadata
        })
        
        if result.get("success", False) or DRY_RUN:
            certificate = {
                "id": result.get("id", f"cert-{i}"),
                "student_did": student_did,
                "certificate_type": certificate_type,
                "certificate_name": certificate_name,
                "issue_date": issue_date,
                "issuer_did": issuer_did
            }
            data.certificates.append(certificate)
            logger.info(f"Created certificate: {certificate_name} for {student_did}")
    
    return data.certificates

# 4. Course Completion Records
def generate_course_completions():
    logger.info("Generating course completion records...")
    
    if not data.dids:
        logger.warning("No DIDs found. Skipping course completion generation.")
        return []
    
    course_ids = ["CS101", "CS102", "MATH101", "PHYS101", "ENG101", "BUS101", "DATA101", "AI101", "WEB101", "SEC101"]
    course_names = [
        "Introduction to Computer Science",
        "Data Structures and Algorithms",
        "Calculus I",
        "Physics for Scientists and Engineers",
        "English Composition",
        "Business Fundamentals",
        "Introduction to Data Science",
        "Artificial Intelligence Basics",
        "Web Development Foundations",
        "Introduction to Cybersecurity"
    ]
    grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"]
    
    for i in range(1, DATA_COUNT + 1):
        idx = i % len(course_ids)
        student_did = random.choice(data.dids)
        course_id = course_ids[idx]
        course_name = course_names[idx]
        completion_date = format_date(random_date(datetime(2020, 1, 1), datetime(2025, 6, 1)))
        grade = random.choice(grades)
        credits = random.randint(1, 5)
        instructor_did = random.choice(data.dids)
        institution_did = random.choice(data.dids)
        metadata = json.dumps({"notes": f"Course {i}", "semester": f"Fall 2024"})
        
        result = api_call("educert/create_course_completion", "POST", {
            "student_did": student_did,
            "course_id": course_id,
            "course_name": course_name,
            "completion_date": completion_date,
            "grade": grade,
            "credits": credits,
            "instructor_did": instructor_did,
            "institution_did": institution_did,
            "metadata": metadata
        })
        
        if result.get("success", False) or DRY_RUN:
            completion = {
                "id": result.get("id", f"completion-{i}"),
                "student_did": student_did,
                "course_id": course_id,
                "course_name": course_name,
                "completion_date": completion_date,
                "grade": grade
            }
            data.course_completions.append(completion)
            logger.info(f"Created course completion: {course_name} for {student_did} with grade {grade}")
    
    return data.course_completions

# 5. Degree Issuance
def generate_degrees():
    logger.info("Generating degrees...")
    
    if not data.dids:
        logger.warning("No DIDs found. Skipping degree generation.")
        return []
    
    degree_names = [
        "Bachelor of Science",
        "Master of Science",
        "Bachelor of Arts",
        "Master of Arts",
        "Bachelor of Business Administration",
        "Master of Business Administration",
        "Bachelor of Engineering",
        "Master of Engineering",
        "Doctor of Philosophy",
        "Doctor of Medicine"
    ]
    
    degree_types = ["associate", "bachelor", "master", "doctoral", "certificate"]
    
    majors = [
        "Computer Science",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Business Administration",
        "Finance",
        "Psychology",
        "Medicine",
        "Biology",
        "Physics",
        "Mathematics"
    ]
    
    honors = ["cum_laude", "magna_cum_laude", "summa_cum_laude", "none"]
    
    for i in range(1, DATA_COUNT + 1):
        idx = i % len(degree_names)
        student_did = random.choice(data.dids)
        degree_name = degree_names[idx]
        degree_type = degree_types[idx % len(degree_types)]
        major = majors[idx]
        graduation_date = format_date(random_date(datetime(2020, 1, 1), datetime(2025, 6, 1)))
        gpa = round(random.uniform(2.0, 4.0), 2)
        honor = random.choice(honors)
        institution_did = random.choice(data.dids)
        signature_authority = "University Registrar"
        metadata = json.dumps({"thesis": f"Thesis for degree {i}", "additionalInfo": "Generated by script"})
        
        result = api_call("educert/issue_degree", "POST", {
            "student_did": student_did,
            "degree_name": degree_name,
            "degree_type": degree_type,
            "major": major,
            "graduation_date": graduation_date,
            "gpa": str(gpa),
            "honors": honor,
            "institution_did": institution_did,
            "signature_authority": signature_authority,
            "metadata": metadata
        })
        
        if result.get("success", False) or DRY_RUN:
            degree = {
                "id": result.get("id", f"degree-{i}"),
                "student_did": student_did,
                "degree_name": degree_name,
                "degree_type": degree_type,
                "major": major,
                "graduation_date": graduation_date,
                "gpa": gpa
            }
            data.degrees.append(degree)
            logger.info(f"Created degree: {degree_name} in {major} for {student_did}")
    
    return data.degrees

# 6. EduPay Wallet Generation
def generate_wallets():
    logger.info("Generating wallets...")
    
    for i in range(1, DATA_COUNT + 1):
        address = "0x" + ''.join(random.choices(string.hexdigits, k=40)).lower()
        initial_amount = random.randint(1000, 10000)
        
        result = api_call("edupay/mint", "POST", {
            "address": address,
            "amount": initial_amount
        })
        
        if result.get("success", False) or DRY_RUN:
            data.wallets.append(address)
            logger.info(f"Created wallet: {address} with {initial_amount} tokens")
    
    # Generate some transfers
    if len(data.wallets) >= 2:
        logger.info("Generating transfers between wallets...")
        
        for _ in range(DATA_COUNT):
            from_addr = random.choice(data.wallets)
            to_addr = random.choice([w for w in data.wallets if w != from_addr])
            amount = random.randint(10, 100)
            
            api_call("edupay/transfer", "POST", {
                "from_address": from_addr,
                "to_address": to_addr,
                "amount": amount
            })
            
            logger.info(f"Transferred {amount} from {from_addr} to {to_addr}")
    
    return data.wallets

# 7. EduMarket NFT Generation
def generate_nfts():
    logger.info("Generating NFTs...")
    
    if not data.wallets:
        logger.warning("No wallets found. Skipping NFT generation.")
        return []
    
    nft_metadata = [
        "Course: Introduction to Blockchain",
        "Course: Advanced Smart Contracts",
        "Course: Cryptocurrency Economics",
        "Course: Decentralized Applications",
        "Course: Tokenomics and Game Theory",
        "Course: Blockchain Security",
        "Course: Distributed Systems",
        "Course: Privacy and Zero-Knowledge Proofs",
        "Course: Blockchain in Finance",
        "Course: Blockchain for Enterprise"
    ]
    
    for i in range(1, DATA_COUNT + 1):
        nft_id = f"nft-{i:03d}"
        creator = random.choice(data.wallets)
        metadata = nft_metadata[i % len(nft_metadata)]
        price = random.randint(100, 1000)
        
        result = api_call("edumarket/mint", "POST", {
            "id": nft_id,
            "creator": creator,
            "metadata": metadata,
            "price": price
        })
        
        if result.get("success", False) or DRY_RUN:
            data.nfts.append(nft_id)
            logger.info(f"Created NFT: {nft_id} - {metadata} for {price} tokens")
    
    # Generate some NFT purchases
    if data.nfts and len(data.wallets) >= 2:
        logger.info("Generating NFT purchases...")
        
        for _ in range(min(DATA_COUNT, len(data.nfts))):
            nft_id = random.choice(data.nfts)
            buyer = random.choice(data.wallets)
            price = random.randint(100, 1000)
            
            api_call("edumarket/buy", "POST", {
                "id": nft_id,
                "buyer": buyer,
                "amount": price
            })
            
            logger.info(f"NFT {nft_id} purchased by {buyer} for {price} tokens")
    
    return data.nfts

# 8. EduAdmission Data Generation
def generate_admission_data():
    logger.info("Generating admission data...")
    
    # Generate seats
    for i in range(1, DATA_COUNT + 1):
        seat_id = f"seat-{i:03d}"
        
        result = api_call("eduadmission/mint_seat", "POST", {
            "seat_id": seat_id
        })
        
        if result.get("success", False) or DRY_RUN:
            data.seats.append(seat_id)
            logger.info(f"Created seat: {seat_id}")
    
    # Generate scores
    if not data.dids:
        logger.warning("No DIDs found. Skipping score generation.")
    else:
        for i in range(1, DATA_COUNT + 1):
            candidate_hash = random.choice(data.dids)
            score = round(random.uniform(5.0, 10.0), 2)
            
            result = api_call("eduadmission/push_score", "POST", {
                "candidate_hash": candidate_hash,
                "score": score
            })
            
            if result.get("success", False) or DRY_RUN:
                data.scores.append({
                    "id": f"score-{i:03d}",
                    "candidate_hash": candidate_hash,
                    "score": score
                })
                logger.info(f"Created score: {score} for candidate {candidate_hash}")
        
        # Run matching algorithm
        if data.seats and data.scores:
            api_call("eduadmission/run_matching", "POST")
            logger.info("Ran admission matching algorithm")
    
    return data.scores

# 9. Research Ledger Data
def generate_research_data():
    logger.info("Generating research data...")
    
    if not data.dids:
        logger.warning("No DIDs found. Skipping research data generation.")
        return []
    
    research_titles = [
        "Blockchain Applications in Educational Credentialing",
        "Secure Identity Management with Decentralized Identifiers",
        "Smart Contracts for Automated Credential Verification",
        "Privacy-Preserving Methods in Educational Records",
        "Tokenization of Educational Assets: Opportunities and Challenges",
        "Consensus Mechanisms for Academic Peer Review",
        "Cross-Institutional Credential Verification Framework",
        "Scalability Solutions for Educational Blockchain Networks",
        "Blockchain-Based Solutions for Academic Fraud Prevention",
        "Interoperability Standards for Educational Blockchain Systems"
    ]
    
    for i in range(1, DATA_COUNT + 1):
        author = random.choice(data.dids)
        title = research_titles[i % len(research_titles)]
        abstract = f"Abstract for research paper #{i}: This paper explores {title.lower()}."
        hash_value = hashlib.sha256(f"{title}:{author}:{abstract}".encode()).hexdigest()
        
        result = api_call("researchledger/publish", "POST", {
            "author": author,
            "title": title,
            "abstract": abstract,
            "hash": hash_value
        })
        
        if result.get("success", False) or DRY_RUN:
            paper = {
                "id": result.get("id", f"paper-{i}"),
                "author": author,
                "title": title,
                "hash": hash_value
            }
            data.research_papers.append(paper)
            logger.info(f"Published research: {title} by {author}")
    
    return data.research_papers

# --- Main Execution ---

def main():
    logger.info(f"Starting data generation for ViEduChain-Hino - Count: {DATA_COUNT}, API: {API_BASE}")
      # Check API health before proceeding
    try:
        health_result = api_call("health", "GET")
        if not health_result.get("success", False) and not DRY_RUN:
            logger.error("API health check failed. Please ensure the API is running.")
            if DRY_RUN:
                logger.info("Continuing with dry run despite health check failure")
            else:
                return
    except Exception as e:
        logger.error(f"API health check error: {str(e)}")
        if DRY_RUN:
            logger.info("Continuing with dry run despite health check error")
        else:
            return
    
    # Generate data based on module selection
    module = args.module.lower()
    
    try:
        if module in ['all', 'nodeinfo']:
            generate_nodes()
            
        if module in ['all', 'eduid']:
            generate_dids()
            
        if module in ['all', 'educert']:
            generate_certificates()
            generate_course_completions()
            generate_degrees()
            
        if module in ['all', 'edupay']:
            generate_wallets()
            
        if module in ['all', 'edumarket']:
            generate_nfts()
            
        if module in ['all', 'eduadmission']:
            generate_admission_data()
            
        if module in ['all', 'researchledger']:
            generate_research_data()
            
        # Save all generated data
        data.save()
        
        logger.info("Data generation completed successfully!")
    except Exception as e:
        logger.error(f"Error during data generation: {str(e)}")

if __name__ == "__main__":
    main()
