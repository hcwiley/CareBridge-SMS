# CareBridge-SMS

HIPAA-aware SMS/MMS assistant for pregnancy-related support. TypeScript monorepo with strict TDD, modular services, and clean integration boundaries for future Epic/FHIR, geolocation, and LLM safety layers.

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

## Setup

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

## Running Tests

Run all tests from the root:
```bash
pnpm test
```

Run tests in watch mode:
```bash
cd packages/sms-server
pnpm test:watch
```

Run tests for a specific package:
```bash
pnpm --filter sms-server test
```

## Project Structure

```
CareBridge-SMS/
├── packages/
│   └── sms-server/          # Core backend logic for handling inbound SMS/MMS
│       ├── src/
│       │   └── __tests__/   # Test files
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── packages/
│   └── sms-client/          # Future SMS/MMS provider wrapper (Twilio, Azure, etc.)
├── package.json             # Root workspace configuration
└── pnpm-workspace.yaml      # pnpm workspace definition
```

## Development

This project follows **Test-Driven Development (TDD)** principles:

1. Write tests first (tests define the expected behavior)
2. Implement the production code to make tests pass
3. Refactor while keeping tests green

### Current Test Coverage

- **First-time user detection**: Test verifies that the system recognizes new users and triggers a registration SMS dialog via the HIPAA-eligible SMS provider abstraction.

See `packages/sms-server/src/__tests__/smsServer.firstTimeUser.spec.ts` for the current test implementation.
