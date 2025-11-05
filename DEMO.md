# Playwright D365 Testing Framework - Demo Guide

**Duration**: 15 minutes
**Presenter**: James
**Audience**: Technical stakeholders

---

## 1. Introduction (2 minutes)

### What Is This?
A comprehensive **Playwright-based testing framework** specifically designed for **Dynamics 365 Model Driven Apps**.

### Why Does It Matter?
- ✅ **Automated UI testing** for D365 applications
- ✅ **Reliable data verification** across UI and API
- ✅ **Repeatable test scenarios** with consistent data
- ✅ **No manual cleanup** - automated teardown
- ✅ **Framework-based approach** - reusable, maintainable

### Key Technologies
- **Playwright**: Cross-browser automation
- **TypeScript**: Type-safe development
- **Xrm Client API**: Native D365 interactions
- **Factory Pattern**: Consistent test data generation

---

## 2. Project Structure (2 minutes)

```
playwright-d365-framework-demo/
│
├── framework/                      # Core framework components
│   ├── core/
│   │   └── XrmHelper.ts           # Xrm API wrapper
│   ├── modules/
│   │   ├── Attribute.ts           # Form field operations
│   │   ├── Entity.ts              # Entity metadata
│   │   └── WebApi.ts              # D365 Web API client
│   └── components/
│       ├── Grid.ts                # Power Grid operations
│       ├── Sidebar.ts             # Navigation sidebar
│       ├── SubGrid.ts             # Related records grid
│       └── Control.ts             # Form control operations
│
├── tests/
│   ├── mda/
│   │   ├── pages/
│   │   │   └── LoginPage.ts       # Page Object Model for login
│   │   ├── auth.setup.ts          # Reusable authentication
│   │   └── account-factory-demo.spec.ts
│   └── data/
│       ├── factories/              # Test data factories
│       │   ├── AccountFactory.ts
│       │   └── ContactFactory.ts
│       └── fixtures/               # Pre-defined scenarios
│           └── account-scenarios.ts
│
└── playwright.config.ts            # Test configuration
```

---

## 3. Page Object Model & Authentication (3 minutes)

### LoginPage POM
**Location**: `tests/mda/pages/LoginPage.ts`

**Why POM?**
- Encapsulates login UI interactions
- Reusable across all tests
- Easy to maintain when UI changes
- Type-safe locators

**Implementation**:
```typescript
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nextButton: Locator;
  readonly signInButton: Locator;
  readonly noButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.nextButton = page.locator('input[type="submit"][value="Next"]');
    this.signInButton = page.locator('input[type="submit"][value="Sign in"]');
    this.noButton = page.locator('input[value="No"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.nextButton.click();
    await this.passwordInput.fill(password);
    await this.signInButton.click();

    // Handle "Stay signed in?" prompt
    try {
      await this.noButton.click({ timeout: 10000 });
    } catch (err) {
      // Prompt didn't appear - continue
    }
  }
}
```

### Reusable Authentication Setup
**Location**: `tests/mda/auth.setup.ts`

**Benefits**:
- ✅ **One-time authentication** per test run
- ✅ **Session saved** to `auth/user.json`
- ✅ **All tests reuse** saved session
- ✅ **Retry logic** - 3 attempts with error handling
- ✅ **Fast test execution** - no repeated logins

**How It Works**:
```typescript
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const xrmHelper = new XrmHelper(page);

  // Navigate and login
  await page.goto(testConfig.mdaUrl);
  await loginPage.login(testConfig.username, testConfig.password);

  // Verify D365 is ready
  await xrmHelper.waitForXrmReady();

  // Save session for reuse
  await page.context().storageState({ path: 'auth/user.json' });
});
```

**Playwright Config Integration**:
```typescript
projects: [
  {
    name: 'mda-setup',
    testMatch: /auth\.setup\.ts/,  // Runs authentication
  },
  {
    name: 'mda-tests',
    use: {
      storageState: 'auth/user.json'  // Reuses session
    },
    dependencies: ['mda-setup']  // Runs after setup
  }
]
```

---

## 4. Live Test Execution (6 minutes)

### Run the Test
```bash
npm run test:mda
```

### What Happens

#### **STEP 1-2**: Create Test Accounts via Web API
```typescript
const accountData = AccountFactory.create({
  name: 'Contoso Corporation',
  phone: '+1-555-0100',
  email: 'info@contoso.com',
  city: 'Seattle',
  industry: INDUSTRY_CODE.SOFTWARE
});

const account = await webApi.createRecord('account', accountData);
```
- Creates **Contoso Corporation** (primary test account)
- Creates **Fabrikam Industries** (for search demo)

#### **STEP 3-4**: Create Contacts and Link to Account
```typescript
const primaryContactData = ContactFactory.create({
  firstname: 'John',
  lastname: 'Primary',
  email: 'john.primary@contoso.com',
  accountId: account.id
});

const primaryContact = await webApi.createRecord('contact', primaryContactData);

// Set as primary contact
await webApi.updateRecord('account', account.id, {
  'primarycontactid@odata.bind': `/contacts(${primaryContact.id})`
});
```

#### **STEP 5**: Create Secondary Contact
- **Jane Secondary**, CFO role

#### **STEP 6-7**: Navigate & Search in UI
```typescript
await sidebar.navigateByAriaLabel('Accounts');
await grid.waitForGridReady();

// Search for specific account
const searchBox = page.locator('input[aria-label*="Search"]');
await searchBox.fill('Contoso Corporation');
await searchBox.press('Enter');
```

#### **STEP 8**: Open Account Form
```typescript
const accountLink = page.locator(`a[aria-label*="Contoso Corporation"]`);
await accountLink.click();
await xrmHelper.waitForXrmReady();
```

#### **STEP 9-10**: Verify Form Fields
```typescript
const accountName = await attribute.getValue('name');
expect(accountName).toContain('Contoso Corporation');

const phone = await attribute.getValue('telephone1');
expect(phone).toBe('+1-555-0100');

const primaryContactLookup = await attribute.getValue('primarycontactid');
expect(primaryContactLookup).toBeTruthy();
```

#### **STEP 11**: Verify Contacts SubGrid
```typescript
const subgridControl = await control.get('Contacts');
expect(subgridControl.isVisible).toBe(true);

await subGrid.refresh('Contacts');
const contactCount = await subGrid.getRecordCount('Contacts');
expect(contactCount).toBe(2);  // Primary + Secondary

const contactIds = await subGrid.getRecordIds('Contacts');
expect(contactIds).toContain(primaryContact.id);
expect(contactIds).toContain(secondaryContact.id);
```

#### **STEP 12**: Verify via API
```typescript
const accountWithRelationships = await webApi.retrieveRecord(
  'account',
  account.id,
  '?$select=_primarycontactid_value&$expand=contact_customer_accounts($select=fullname,jobtitle)'
);

expect(accountWithRelationships._primarycontactid_value).toBe(primaryContact.id);
```

#### **CLEANUP**: Automated Teardown
```typescript
finally {
  for (const { id, entityType } of createdEntities.reverse()) {
    await webApi.deleteRecord(entityType, id);
  }
}
```
- Deletes in **reverse order** (children first, parent last)
- Guaranteed cleanup via `finally` block
- No test data pollution

---

## 5. Framework Components Deep Dive (3 minutes)

### XrmHelper (Core)
**Purpose**: Wrapper for D365 Xrm Client API

```typescript
class XrmHelper {
  async waitForXrmReady(): Promise<void> {
    await this.page.waitForFunction(
      () => typeof window.Xrm !== 'undefined' && window.Xrm.Page,
      { timeout: 60000 }
    );
  }
}
```
- Ensures Xrm API is available
- All framework modules depend on this

### Attribute Module
**Purpose**: Read/write form fields

```typescript
class Attribute {
  async getValue(attributeName: string): Promise<any>
  async setValue(attributeName: string, value: any): Promise<void>
  async setLookupValue(attributeName: string, id: string, entityType: string): Promise<void>
}
```
**Example**:
```typescript
const phone = await attribute.getValue('telephone1');
await attribute.setValue('telephone1', '+1-555-9999');
```

### WebApi Module
**Purpose**: D365 Web API operations

```typescript
class WebApi {
  async createRecord(entityType: string, data: any): Promise<{ id: string }>
  async retrieveRecord(entityType: string, id: string, query?: string): Promise<any>
  async updateRecord(entityType: string, id: string, data: any): Promise<void>
  async deleteRecord(entityType: string, id: string): Promise<void>
}
```

### SubGrid Module
**Purpose**: Interact with related record grids

```typescript
class SubGrid {
  async getRecordCount(subgridName: string): Promise<number>
  async getRecordIds(subgridName: string): Promise<string[]>
  async openNthRecord(subgridName: string, recordNumber: number): Promise<void>
  async refresh(subgridName: string): Promise<void>
}
```

### Grid Module
**Purpose**: Power Grid operations

```typescript
class Grid {
  async waitForGridReady(): Promise<void>
  async getGridRowCount(): Promise<number>
  async searchGrid(searchTerm: string): Promise<void>
  async openNthRecord(recordNumber: number): Promise<void>
}
```

### Control Module
**Purpose**: Form control operations

```typescript
class Control {
  async get(controlName: string): Promise<ControlState>
  async setVisible(controlName: string, visible: boolean): Promise<void>
  async setDisabled(controlName: string, disabled: boolean): Promise<void>
  async getLabel(controlName: string): Promise<string>
}
```

### Factory Pattern
**Purpose**: Generate consistent test data

```typescript
class AccountFactory {
  static create(overrides?: Partial<AccountData>): any {
    return {
      name: overrides?.name ?? `Account ${Date.now()}`,
      telephone1: overrides?.phone ?? '+1-555-0199',
      emailaddress1: overrides?.email ?? 'contact@example.com',
      address1_city: overrides?.city ?? 'Seattle',
      // ... with defaults
    };
  }

  static createBulk(count: number, overrides?: Partial<AccountData>): any[]
}
```

**Benefits**:
- ✅ Consistent data structure
- ✅ Unique values (timestamps, UUIDs)
- ✅ Override only what you need
- ✅ Bulk generation support

---

## 6. Key Benefits & Differentiators (2 minutes)

### Technical Excellence
| Feature | Benefit |
|---------|---------|
| **TypeScript** | Type-safe development, IntelliSense support |
| **Xrm API Integration** | Native D365 interactions, not just DOM clicks |
| **Page Object Model** | Maintainable, reusable login flows |
| **Reusable Auth** | Fast test execution, one login per suite |
| **Factory Pattern** | Consistent, predictable test data |
| **Modular Components** | Reusable across tests and projects |
| **Automated Cleanup** | No test data pollution |
| **Visual Evidence** | Screenshots/video on failure |

### Execution Speed
- **Authentication**: ~10s once, then instant for all tests
- **Full Test Suite**: ~23s including UI verification
- **API Operations**: <500ms per operation

### Reliability
- ✅ **Retry logic** for authentication (3 attempts)
- ✅ **Proper waits** using Xrm API readiness
- ✅ **Error handling** with meaningful messages
- ✅ **Cleanup guaranteed** via finally blocks

### Maintainability
- ✅ **Separation of concerns** (framework vs tests)
- ✅ **Reusable components** across test suites
- ✅ **POM pattern** for UI interactions
- ✅ **Type definitions** for D365 entities
- ✅ **Clear test structure** with step markers

---

## 7. Q&A Topics

### Authentication
**Q**: How does authentication work?
**A**: One-time login via LoginPage POM, session saved to `auth/user.json`, all tests reuse the session via Playwright's `storageState`. Includes retry logic and error handling.

### Parallel Execution
**Q**: Can tests run in parallel?
**A**: Yes, configured via `workers` in playwright.config.ts. Currently set to 1 for demo stability, but supports parallel execution.

### CI/CD Integration
**Q**: How does this integrate with CI/CD?
**A**: Standard Playwright config with environment variables. Includes retry logic (`retries: 2` in CI), HTML reporter, and trace files for debugging.

### Custom Components
**Q**: Can I add custom modules?
**A**: Absolutely! Framework is modular. Add new modules to `framework/components/` or `framework/modules/`, export from `index.ts`, and use in tests.

### Performance
**Q**: What about test performance?
**A**: Reusable auth provides instant login. API operations are fast (~500ms). SubGrid refresh ensures data is loaded before verification. Full suite runs in ~23s.

### Data Management
**Q**: How do you handle test data?
**A**: Factory pattern generates unique data, API creates records, UI verifies, cleanup in `finally` blocks. Tracks all created entities for proper deletion order.

---

## Demo Checklist

### Before Demo
- [ ] Environment variables configured (.env file)
- [ ] Authentication successful (run `npm run test:mda` once)
- [ ] D365 environment accessible
- [ ] Viewport set to 2560x1440 for visibility

### During Demo
- [ ] Show project structure in VS Code
- [ ] Highlight LoginPage POM implementation
- [ ] Explain authentication setup and reuse
- [ ] Run test live with console output visible
- [ ] Show browser automation in real-time
- [ ] Point out console logs during execution
- [ ] Show code samples for key components
- [ ] Discuss benefits and technical approach

### After Demo
- [ ] Answer questions
- [ ] Discuss next steps
- [ ] Provide code repository access

---

## Contact & Resources

**Repository**: `playwright-d365-framework-demo`
**Test Command**: `npm run test:mda`
**Framework Docs**: See `framework/` directory for component documentation

---

**End of Demo Guide**
