# refine-project

<div align="center" style="margin: 30px;">
    <a href="https://refine.dev">
    <img alt="refine logo" src="https://refine.ams3.cdn.digitaloceanspaces.com/readme/refine-readme-banner.png">
    </a>
</div>
<br/>

This [Refine](https://github.com/refinedev/refine) project was generated with [create refine-app](https://github.com/refinedev/refine/tree/master/packages/create-refine-app).

## Cosmos Permissioned Network: Smart Contract Integration Guide

### Introduction

This project integrates smart contract and transaction data from a FastAPI backend (port 1318) into the frontend. Below are the main API endpoints and integration details.

### API Endpoints

- **List contracts:**
  - `GET http://localhost:1318/api/v1/contracts`
- **Contract details:**
  - `GET http://localhost:1318/api/v1/contracts/{address}`

### Integrated Components

- **Contract List Page:** `/contracts` (`src/app/contracts/page.tsx`)
- **Contract Detail Page:** `/contracts/[address]` (`src/app/contracts/[address]/page.tsx`)
- **Contract Widget:** `src/components/contract-widget/index.tsx`
  - Props:
    - `contractAddress`: Show details for a specific contract
    - `contractType`: Filter by contract type (e.g., "identity", "certification", "payment")
    - `maxDisplay`: Max contracts to display (default: 3)
    - `title`: Widget title (default: "Smart Contracts")
    - `showViewAll`: Show "View All" button (default: true)

#### Example Usage

Import the widget:
```tsx
import ContractWidget from '@/components/contract-widget';
```

Use in a component:
```tsx
// Default contract list
<ContractWidget />
// Filter by type
<ContractWidget contractType="identity" title="Identity Contracts" maxDisplay={2} />
// Show contract details
<ContractWidget contractAddress="cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr" />
```

#### Widget Integration
- Home page (`src/app/home/page.tsx`): Shows 3 latest contracts
- Node info page (`src/app/nodeinfo/page.tsx`): Shows 5 contracts

### API Configuration

API URLs are set in `src/config.ts`. FastAPI backend should run on port 1318:
```
NODEINFO_URL = "http://localhost:1318"
```

### Notes
- Ensure FastAPI backend is running on port 1318 for contract features.
- Components show error messages if data loading fails.
- To extend contract features, add endpoints to FastAPI and update frontend components.

---

## Getting Started

A React Framework for building internal tools, admin panels, dashboards & B2B apps with unmatched flexibility ✨

Refine's hooks and components simplifies the development process and eliminates the repetitive tasks by providing industry-standard solutions for crucial aspects of a project, including authentication, access control, routing, networking, state management, and i18n.

## Available Scripts

### Running the development server.

```bash
    npm run dev
```

### Building for production.

```bash
    npm run build
```

### Running the production server.

```bash
    npm run start
```

## Learn More

To learn more about **Refine**, please check out the [Documentation](https://refine.dev/docs)

- **REST Data Provider** [Docs](https://refine.dev/docs/core/providers/data-provider/#overview)
- **Ant Design** [Docs](https://refine.dev/docs/ui-frameworks/antd/tutorial/)

## License

MIT
