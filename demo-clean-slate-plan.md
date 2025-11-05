# Clean Slate Demo Repository Plan

## Goal
Create a streamlined demo repository from scratch that includes ONLY:
- ✅ Working framework components (Grid, Sidebar, XrmHelper, WebApi, Entity)
- ✅ Reusable authentication with storage state
- ✅ Page Object Model for MDA login
- ✅ Clean structure ready for demo this afternoon
- ❌ NO load testing
- ❌ NO project-specific test specs
- ❌ NO outdated or experimental code

---

## Phase 1: Repository Setup (30 minutes)

### Step 1: Create New Repository Structure

```bash
mkdir playwright-d365-framework-demo
cd playwright-d365-framework-demo
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install --save-dev @playwright/test typescript @types/node
npm install --save-dev @types/xrm
npx playwright install
```

### Step 3: Create Base Configuration Files

**package.json scripts:**
```json
{
  "name": "playwright-d365-framework-demo",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:mda": "playwright test --project=mda-tests",
    "setup:mda": "playwright test --project=mda-setup",
    "codegen": "playwright codegen"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test", "xrm"]
  },
  "include": ["tests/**/*", "framework/**/*"]
}
```

**.gitignore:**
```
node_modules/
playwright-report/
test-results/
.env
auth/*.json
*.log
.DS_Store
```

**.env.example:**
```bash
# MDA Configuration
APP_URL=https://yourorg.crm.dynamics.com/main.aspx?appid=YOUR-APP-ID
O365_USERNAME=test-user@yourorg.com
O365_PASSWORD=your-password
```

---

## Phase 2: Framework Components (45 minutes)

### Directory Structure

```
playwright-d365-framework-demo/
├── framework/                    # Reusable D365 components
│   ├── core/
│   │   └── XrmHelper.ts         # Core Xrm bridge
│   ├── modules/
│   │   ├── Entity.ts            # Record operations
│   │   └── WebApi.ts            # Dataverse CRUD
│   ├── components/
│   │   ├── Grid.ts              # AG Grid interactions
│   │   └── Sidebar.ts           # Navigation helper
│   └── index.ts                 # Barrel export
│
├── tests/
│   └── mda/
│       ├── pages/
│       │   └── LoginPage.ts     # Page Object Model
│       ├── auth.setup.ts        # Auth setup script
│       ├── example.spec.ts      # Demo test
│       └── TestConfig.ts        # Config helper
│
├── auth/                        # Auth storage (gitignored)
│   └── user.json               # Saved auth state
│
├── .env                        # Environment vars (gitignored)
├── .env.example                # Template
├── playwright.config.ts        # Playwright config
├── tsconfig.json               # TypeScript config
├── package.json
└── README.md                   # Getting started guide
```

### Files to Copy from Current Repo

**From Current → New Demo Repo:**

1. **Framework Core** (`framework/core/`)
   - Copy: `tests/mda/utils/XrmHelper.ts` → `framework/core/XrmHelper.ts`

2. **Framework Modules** (`framework/modules/`)
   - Copy: `tests/mda/utils/Entity.ts` → `framework/modules/Entity.ts`
   - Copy: `tests/mda/utils/WebApi.ts` → `framework/modules/WebApi.ts`

3. **Framework Components** (`framework/components/`)
   - Copy: `tests/mda/components/Grid.ts` → `framework/components/Grid.ts`
   - Copy: `tests/mda/components/Sidebar.ts` → `framework/components/Sidebar.ts`

4. **Test Infrastructure** (`tests/mda/`)
   - Copy: `tests/mda/pages/LoginPage.ts` → `tests/mda/pages/LoginPage.ts`
   - Copy: `tests/mda/auth.setup.ts` → `tests/mda/auth.setup.ts`
   - Copy: `tests/mda/TestConfig.ts` → `tests/mda/TestConfig.ts`

### Create New Files

**framework/index.ts** (Barrel export for clean imports)
```typescript
// Core
export { XrmHelper } from './core/XrmHelper';

// Modules
export { Entity } from './modules/Entity';
export { WebApi } from './modules/WebApi';

// Components
export { Grid } from './components/Grid';
export { Sidebar } from './components/Sidebar';
```

**tests/mda/example.spec.ts** (Simple demo test)
```typescript
import { test, expect } from '@playwright/test';
import { XrmHelper, WebApi, Grid, Sidebar } from '../../framework';
import { testConfig, validateConfig } from './TestConfig';

test.describe('Framework Demo', () => {
  let xrmHelper: XrmHelper;
  let webApi: WebApi;
  let grid: Grid;
  let sidebar: Sidebar;

  test.beforeEach(async ({ page }) => {
    validateConfig();
    
    // Initialize framework components
    xrmHelper = new XrmHelper(page);
    webApi = new WebApi(xrmHelper);
    grid = new Grid(page);
    sidebar = new Sidebar(page);

    // Navigate to MDA
    await page.goto(testConfig.mdaUrl);
    await xrmHelper.waitForXrmReady();

    // Verify we're authenticated
    if (page.url().includes('error/errorhandler.aspx')) {
      throw new Error('Authentication failed');
    }
  });

  test('should demonstrate framework capabilities', async ({ page }) => {
    // Navigate using Sidebar
    await sidebar.navigateByAriaLabel('Accounts');
    
    // Wait for grid and verify it loaded
    await grid.waitForGridReady();
    const rowCount = await grid.getGridRowCount();
    
    console.log(`✅ Grid loaded with ${rowCount} accounts`);
    expect(rowCount).toBeGreaterThan(0);
    
    // Create a test account via WebApi
    const account = await webApi.createRecord('account', {
      name: `Demo Account ${Date.now()}`
    });
    
    console.log(`✅ Created account: ${account.id}`);
    expect(account.id).toBeDefined();
    
    // Clean up
    await webApi.deleteRecord('account', account.id);
    console.log('✅ Cleaned up test data');
  });
});
```

---

## Phase 3: Configuration (15 minutes)

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 30000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000
  },

  projects: [
    // Setup project - runs authentication
    {
      name: 'mda-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    
    // Test project - uses saved auth
    {
      name: 'mda-tests',
      testDir: './tests/mda',
      testIgnore: '**/auth.setup.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth/user.json'
      },
      dependencies: ['mda-setup']
    }
  ]
});
```

### tests/mda/TestConfig.ts

```typescript
import * as dotenv from 'dotenv';

dotenv.config();

interface TestConfig {
  mdaUrl: string;
  username: string;
  password: string;
}

export const testConfig: TestConfig = {
  mdaUrl: process.env.APP_URL || '',
  username: process.env.O365_USERNAME || '',
  password: process.env.O365_PASSWORD || ''
};

export function validateConfig(): void {
  const missing: string[] = [];

  if (!testConfig.mdaUrl) missing.push('APP_URL');
  if (!testConfig.username) missing.push('O365_USERNAME');
  if (!testConfig.password) missing.push('O365_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}
```

---

## Phase 4: Documentation (20 minutes)

### README.md

```markdown
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
│   └── mda/
│       ├── pages/         # Page Object Models
│       ├── auth.setup.ts  # Authentication
│       └── *.spec.ts      # Test files
├── auth/                  # Saved auth state (gitignored)
└── playwright.config.ts   # Playwright configuration
```

## Writing Tests

### Basic Pattern

```typescript
import { test, expect } from '@playwright/test';
import { XrmHelper, WebApi, Grid, Sidebar } from '../../framework';
import { testConfig, validateConfig } from './TestConfig';

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

### Setup/Teardown Pattern

```typescript
test('test with data', async ({ page }) => {
  const webApi = new WebApi(new XrmHelper(page));
  
  // Setup
  const account = await webApi.createRecord('account', {
    name: 'Test Account'
  });
  
  try {
    // Test logic
    // ...
  } finally {
    // Teardown
    await webApi.deleteRecord('account', account.id);
  }
});
```

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

## Next Steps

- Add more framework components (Form, Dialog, etc.)
- Add data factories for complex setup
- Integrate with CI/CD pipeline
- Extract framework to separate npm package

## License

MIT
```

### FRAMEWORK_COMPONENTS.md

```markdown
# Framework Components Reference

Detailed API documentation for each framework component.

## XrmHelper

### Constructor
```typescript
new XrmHelper(page: Page)
```

### Methods

**waitForXrmReady(timeout?: number): Promise<void>**
- Waits for `window.Xrm` to be available
- Default timeout: 60 seconds
- Use after any navigation or page load

**Example:**
```typescript
await page.goto(url);
await xrmHelper.waitForXrmReady();
// Now safe to use D365 APIs
```

---

## WebApi

### Constructor
```typescript
new WebApi(xrmHelper: XrmHelper)
```

### Methods

**createRecord(entityType: string, data: any): Promise<{id: string, entityType: string}>**
- Creates a Dataverse record
- Returns object with `id` and `entityType`

**retrieveRecord(entityType: string, id: string, options?: string): Promise<any>**
- Retrieves a single record
- Options supports OData query (e.g., `?$select=name,email`)

**updateRecord(entityType: string, id: string, data: any): Promise<{id: string, entityType: string}>**
- Updates a record

**deleteRecord(entityType: string, id: string): Promise<any>**
- Deletes a record

**retrieveMultipleRecords(entityType: string, options?: string, maxPageSize?: number): Promise<{entities: any[], '@odata.nextLink'?: string}>**
- Queries multiple records
- Returns entities array and optional next link for paging

### OData Relationships

Use `@odata.bind` for lookup fields:

```typescript
await webApi.createRecord('contact', {
  firstname: 'John',
  'parentcustomerid_account@odata.bind': `/accounts(${accountId})`
});
```

### Delete Order (CRITICAL!)

Always delete in REVERSE order of creation:

```typescript
const account = await webApi.createRecord('account', {...});
const contact = await webApi.createRecord('contact', {...});

// Delete in REVERSE
await webApi.deleteRecord('contact', contact.id);  // Child first
await webApi.deleteRecord('account', account.id);  // Parent last
```

---

## Entity

### Constructor
```typescript
new Entity(xrmHelper: XrmHelper)
```

### Methods

**getRecordId(): Promise<string>**
- Gets current record's GUID

**getEntityName(): Promise<string>**
- Gets entity logical name

**save(): Promise<void>**
- Saves current record

**isDirty(): Promise<boolean>**
- Checks if record has unsaved changes

**getPrimaryAttributeValue(): Promise<string>**
- Gets primary field value (usually name)

**isValid(): Promise<boolean>**
- Checks if all required fields are filled

**getFormType(): Promise<number>**
- Returns form type (0=Undefined, 1=Create, 2=Update, 3=Read Only, etc.)

**refresh(save?: boolean): Promise<void>**
- Refreshes record data from server
- Optional: save changes first

---

## Grid

### Constructor
```typescript
new Grid(page: Page, gridName?: string)
```

### Methods

**waitForGridReady(timeout?: number): Promise<void>**
- Waits for grid data to load
- Default timeout: 30 seconds
- Handles loading spinner

**getGridRowCount(): Promise<number>**
- Returns number of visible rows

**openNthRecord(recordNumber: number, columnIndex?: number): Promise<void>**
- Double-clicks cell to open record
- recordNumber is zero-based
- Default column: 2 (usually main field)

**getCellTextByIndex(recordNumber: number, columnIndex: number): Promise<string>**
- Gets text from specific cell
- Both indices are zero-based

**getRecordName(recordNumber: number): Promise<string>**
- Shortcut for getting main field (column 2)

### Example

```typescript
const grid = new Grid(page);
await grid.waitForGridReady();

const count = await grid.getGridRowCount();
console.log(`Found ${count} records`);

if (count > 0) {
  const name = await grid.getRecordName(0);
  console.log(`First record: ${name}`);
  
  await grid.openNthRecord(0);  // Opens first record
}
```

---

## Sidebar

### Constructor
```typescript
new Sidebar(page: Page)
```

### Methods

**navigateToHome(): Promise<void>**
- Navigates to home page

**navigateByAriaLabel(label: string): Promise<void>**
- Navigates using aria-label attribute
- Example: `navigateByAriaLabel('Accounts')`

**navigateByText(text: string): Promise<void>**
- Navigates using data-text attribute
- Example: `navigateByText('Active Accounts')`

**getGroupsInCurrentArea(): Promise<string[]>**
- Returns list of group names in current area

**getSubAreasInGroup(groupName: string): Promise<string[]>**
- Returns sub-areas within a group

### Example

```typescript
const sidebar = new Sidebar(page);

// Navigate to entity
await sidebar.navigateByAriaLabel('Cases');

// Or discover and navigate
const groups = await sidebar.getGroupsInCurrentArea();
const subAreas = await sidebar.getSubAreasInGroup(groups[0]);
await sidebar.navigateByText(subAreas[0]);
```
```

---

## Phase 5: Validation & Demo Prep (20 minutes)

### Step 1: Run Through Complete Flow

```bash
# 1. Install dependencies
npm install
npx playwright install

# 2. Set up .env file
cp .env.example .env
# Edit .env with your credentials

# 3. Run authentication setup
npm run setup:mda

# 4. Verify auth file created
ls -la auth/user.json

# 5. Run example test
npm run test:mda

# 6. Check test results
npx playwright show-report
```

### Step 2: Demo Checklist

- [ ] Repository structure is clean
- [ ] All framework components present and working
- [ ] Auth setup works (creates `auth/user.json`)
- [ ] Example test passes
- [ ] Documentation is clear and concise
- [ ] No load testing remnants
- [ ] No project-specific code
- [ ] `.gitignore` properly excludes sensitive files
- [ ] `.env.example` provides clear template

### Step 3: Demo Talking Points

**1. Clean Architecture (2 min)**
- Framework separate from tests
- Reusable components
- Clear separation of concerns

**2. Framework Components (5 min)**
- Show each component briefly
- Demonstrate one in action (Grid or WebApi)
- Explain the hybrid pattern potential

**3. Authentication Pattern (3 min)**
- Storage state approach
- Show auth setup
- Explain benefits (speed, stability)

**4. Demo Test (5 min)**
- Walk through example.spec.ts
- Run it live
- Show Playwright UI mode

**5. Future Plans (2 min)**
- Extracting to npm package
- Adding more components
- CI/CD integration

---

## Execution Timeline (2 hours total)

### T-2 hours: Setup & Copy

**0:00-0:30** - Repository setup and configuration
- Create repo structure
- Install dependencies
- Configure TypeScript and Playwright
- Create .env and other config files

**0:30-1:15** - Copy framework components
- Copy XrmHelper, Entity, WebApi
- Copy Grid, Sidebar
- Copy LoginPage and auth setup
- Create barrel export (index.ts)
- Create example test

**1:15-1:35** - Documentation
- Create README.md
- Create FRAMEWORK_COMPONENTS.md
- Add inline comments to example test

**1:35-2:00** - Validation & Polish
- Run full flow
- Fix any issues
- Practice demo walkthrough
- Prepare talking points

---

## Quick Command Reference

```bash
# Initial setup
npm install
npx playwright install
cp .env.example .env
# Edit .env with credentials

# Run authentication
npm run setup:mda

# Run tests
npm test                    # All tests
npm run test:headed         # See browser
npm run test:ui            # Playwright UI mode
npm run test:mda           # MDA tests only

# Development
npm run codegen            # Generate test code
```

---

## Post-Demo Actions

After successful demo, you can:

1. **Start Framework Extraction**
   - Follow the full framework extraction plan
   - This clean repo is perfect starting point

2. **Add More Components**
   - Form component
   - Dialog handling
   - Business Process Flow

3. **Enhance Documentation**
   - Add video tutorials
   - Create architecture diagrams
   - Write migration guide

4. **Set Up CI/CD**
   - Azure DevOps pipeline
   - GitHub Actions
   - Automated test runs

---

## Success Criteria

✅ Repository is clean and organized
✅ Framework components work independently
✅ Authentication uses storage state pattern
✅ Example test demonstrates key features
✅ Documentation is clear and complete
✅ No project-specific or legacy code
✅ Ready to demo in 2 hours
✅ Ready to extract into standalone framework

---

## Key Differences from Current Repo

| Aspect | Current Repo | Clean Demo Repo |
|--------|-------------|-----------------|
| **Load Testing** | Included | ❌ Removed |
| **Framework Location** | Mixed with tests | ✅ Separate `framework/` |
| **Test Specs** | Many project-specific | ✅ One clean example |
| **Documentation** | Scattered wikis | ✅ Consolidated README |
| **Data Factories** | Multiple | ✅ None (keep it simple) |
| **Auth** | Multiple apps | ✅ MDA only (focused) |
| **Structure** | Evolved organically | ✅ Intentional design |

---

## Next Steps After Demo

1. Get feedback from demo audience
2. Refine based on feedback
3. Begin full framework extraction
4. Publish as npm package
5. Migrate current project to use package

---

## Summary

This plan gives you a **clean, demo-ready repository** in **2 hours** that showcases:
- ✅ Reusable framework architecture
- ✅ Storage state authentication
- ✅ Page Object Model
- ✅ Working examples
- ✅ Clear documentation

It strips away complexity while preserving the valuable framework components, giving you a perfect foundation for both the demo and future framework extraction.

**Ready to start? Follow the timeline and checklist above!**
