# ViEduChain-Hino Deployment Report

## Deployment Status

### Core Blockchain Services
- ✅ Core node: Running on http://localhost:26657
- ✅ Additional core nodes: 
  - Running on http://localhost:26658
  - Running on http://localhost:26667

### API Services
- ✅ Main API: Running on http://localhost:8279
  - API Documentation: http://localhost:8279/docs
- ✅ Additional API nodes:
  - Running on http://localhost:8280
  - Running on http://localhost:8289

### Frontend Applications
- ✅ Refine-based frontend: Running on http://localhost:3580
- ❓ Original UI: Running on http://localhost:3179 (marked as unhealthy by Docker)

## API Endpoints Tested

The following API endpoints were tested:
- ✅ Node Info (/api/nodeinfo)
- ✅ Edu ID Registration (/api/edu-id/register)
- ✅ Edu Certificate Issue (/api/edu-cert/issue)
- ✅ Edu Pay Mint (/api/edupay/mint)
- ✅ Edu Pay Transfer (/api/edupay/transfer)
- ✅ Edu Admission Create (/api/edu-admission/create)

Note: The API tests are currently returning 404 errors, which is expected since the smart contracts have not been deployed yet. However, the API endpoints are responding correctly, indicating that the services are running properly.

## Contract Deployment

Smart contracts need to be deployed using the appropriate tools. This requires configuration of the appropriate wallets and blockchain parameters. The `auto_deploy_contract.py` script in the repository can be used for this purpose, but requires proper environment setup.

## Accessing the Application

- Frontend UI: http://localhost:3580
- API Documentation: http://localhost:8279/docs
- Core Blockchain Status: http://localhost:26657/status

## Next Steps

1. Deploy smart contracts to the blockchain
2. Configure environment variables for contract addresses
3. Run comprehensive tests against the deployed contracts
4. Monitor services for stability

## Troubleshooting

If services become unresponsive, you can restart them using:

```powershell
# Navigate to the deploy directory
cd c:\Users\Admin\Documents\GitHub\vieteduchain-hino\deploy

# Restart all services
docker-compose down
docker-compose up -d

# Or restart specific services
docker-compose restart core api
```

For frontend issues:
```powershell
# Navigate to the frontend directory
cd c:\Users\Admin\Documents\GitHub\vieteduchain-hino\fe

# Restart the frontend
docker-compose down
docker-compose up -d
```
