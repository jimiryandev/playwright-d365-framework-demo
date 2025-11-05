# Playwright D365 Framework Demo

A clean, reusable Playwright framework for testing Microsoft Dynamics 365 Model-Driven Apps.

## Features

- ✅ **Reusable Components**: Grid, Sidebar, XrmHelper, WebApi, Entity
- ✅ **Storage State Auth**: Fast, stable authentication
- ✅ **Page Object Model**: Maintainable login handling
- ✅ **TypeScript**: Full type safety
- ✅ **Clean Architecture**: Framework separate from tests

## Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
APP_URL=https://yourorg.crm.dynamics.com/main.aspx?appid=YOUR-APP-ID
O365_USERNAME=test-user@yourorg.com
O365_PASSWORD=your-password
```

### 3. Run Tests

```bash
# Run all tests (includes auth setup)
npm test

# Run with UI mode
npm run test:ui

# Run headed mode (see browser)
npm run test:headed
```

## Framework Components

### XrmHelper
Bridge to D365's `window.Xrm` API. Handles waiting for Xrm to be ready.

```typescript
import { XrmHelper } from '../../framework';

const xrmHelper = new XrmHelper(page);
await xrmHelper.waitForXrmReady();
```

### WebApi
Dataverse CRUD operations for setup/teardown.

```typescript
import { WebApi } from '../../framework';

const webApi = new WebApi(xrmHelper);

// Create
const account = await webApi.createRecord('account', {
  name: 'Test Account'
});

// Delete
await webApi.deleteRecord('account', account.id);
```

### Entity
Record lifecycle operations (save, refresh, get values).

```typescript
import { Entity } from '../../framework';

const entity = new Entity(xrmHelper);
await entity.save();
const id = await entity.getRecordId();
```

### Grid
AG Grid interactions (wait, navigate, read data).

```typescript
import { Grid } from '../../framework';

const grid = new Grid(page);
await grid.waitForGridReady();
const rowCount = await grid.getGridRowCount();
await grid.openNthRecord(0);
```

### Sidebar
D365 sitemap navigation.

```typescript
import { Sidebar } from '../../framework';

const sidebar = new Sidebar(page);
await sidebar.navigateByAriaLabel('Accounts');
await sidebar.navigateToHome();
```

## Authentication

This framework uses Playwright's storage state pattern:

1. **Setup runs once** (`auth.setup.ts`)
   - Logs in with real credentials
   - Saves cookies/tokens to `auth/user.json`

2. **Tests reuse auth** (fast!)
   - Load `auth/user.json`
   - No repeated logins

### Manual Auth Setup

```bash
npm run setup:mda
```

## Project Structure

```
├── framework/              # Reusable D365 components
│   ├── core/              # XrmHelper
│   ├── modules/           # Entity, WebApi
│   ├── components/        # Grid, Sidebar
│   └── index.ts           # Exports
├── tests/
│   ├── data/              # Test data management
│   │   ├── factories/     # Data generation (AccountFactory, ContactFactory)
│   │   ├── fixtures/      # Pre-defined test scenarios
│   │   └── README.md      # Factory pattern documentation
│   └── mda/
│       ├── pages/         # Page Object Models
│       ├── auth.setup.ts  # Authentication
│       ├── test-config.ts # Configuration
│       └── *.spec.ts      # Test files
├── auth/                  # Saved auth state (gitignored)
└── playwright.config.ts   # Playwright configuration
```

## Writing Tests

### Basic Pattern

```typescript
import { test, expect } from '@playwright/test';
import { XrmHelper, WebApi, Grid, Sidebar } from '../../framework';
import { testConfig, validateConfig } from './test-config';

test('my test', async ({ page }) => {
  validateConfig();

  const xrmHelper = new XrmHelper(page);
  const webApi = new WebApi(xrmHelper);
  const grid = new Grid(page);
  const sidebar = new Sidebar(page);

  await page.goto(testConfig.mdaUrl);
  await xrmHelper.waitForXrmReady();

  // Your test logic here
});
```

### Setup/Teardown with Factory Pattern (Recommended)

```typescript
import { AccountFactory } from '../data/factories/AccountFactory';
import { ContactFactory } from '../data/factories/ContactFactory';

test.describe('Account Tests', () => {
  let createdAccountIds: string[] = [];
  let createdContactIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Initialize and reset tracking
    createdAccountIds = [];
    createdContactIds = [];
  });

  test.afterEach(async () => {
    // CRITICAL: Delete in REVERSE order
    for (const contactId of createdContactIds) {
      await webApi.deleteRecord('contact', contactId);
    }
    for (const accountId of createdAccountIds) {
      await webApi.deleteRecord('account', accountId);
    }
  });

  test('test with factory data', async ({ page }) => {
    // Generate data using factory
    const accountData = AccountFactory.create({ name: 'Test Account' });
    const account = await webApi.createRecord('account', accountData);
    createdAccountIds.push(account.id);

    // Test logic here...
    // Cleanup happens automatically in afterEach
  });
});
```

**See**: `tests/data/README.md` for complete factory pattern documentation

## Common Issues

### Auth Fails
- Check `.env` credentials are correct
- Ensure MFA is disabled on test account
- Delete `auth/user.json` and re-run setup

### Grid Not Found
- Verify you're on correct page
- Check `waitForGridReady()` was called
- Inspect page in headed mode: `npm run test:headed`

### Xrm Not Ready
- Always call `await xrmHelper.waitForXrmReady()` after navigation
- Increase timeout if needed

## Test Data Management

This repository includes a **Factory and Fixture pattern** for managing test data:

- **Factories** - Generate unique test data with timestamps
- **Fixtures** - Pre-defined test scenarios
- **Clean Teardown** - Automatic cleanup in reverse creation order

**Example files**:
- `tests/data/factories/AccountFactory.ts` - Account data generation
- `tests/data/fixtures/account-scenarios.ts` - Pre-configured scenarios
- `tests/mda/account-factory-demo.spec.ts` - Complete working example

**See**: `tests/data/README.md` for detailed documentation

## Next Steps

- Add more framework components (Form, Dialog, etc.)
- Customize factories with your specific fields
- Add more test scenarios to fixtures
- Integrate with CI/CD pipeline
- Extract framework to separate npm package

## License

MIT
