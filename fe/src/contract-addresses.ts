// Auto-generated contract addresses from deployment on Tue Jun 24 20:38:14 +07 2025
// Original file backed up at /Users/dungbui299/Documents/github/cosmos-permissioned-network/fe/src/contract-addresses.ts.bak.20250624203814

export const CONTRACT_ADDRESSES = {
  // Contract addresses on the testing chain
  testing: {
    eduid: "not_deployed",
    educert: "not_deployed",
    edupay: "not_deployed",
    researchledger: "not_deployed",
    eduadmission: "not_deployed"
  },
  
  // Production addresses - to be manually configured
  production: {
    eduid: "",
    educert: "",
    edupay: "",
    researchledger: "",
    eduadmission: ""
  }
};

// Export contract addresses based on environment
const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';
export default isProduction ? CONTRACT_ADDRESSES.production : CONTRACT_ADDRESSES.testing;
