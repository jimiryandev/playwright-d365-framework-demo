# Test Data Management Pattern

This directory contains the **Factory and Fixture pattern** for managing test data in Playwright D365 tests.

## Overview

The pattern consists of two main components:

1. **Factories** (`factories/`) - Generate test data with unique identifiers
2. **Fixtures** (`fixtures/`) - Pre-defined test scenarios with configuration

## Why This Pattern?

✅ **Consistency** - All tests use the same data generation logic
✅ **Uniqueness** - Timestamps prevent conflicts in concurrent test runs
✅ **Reusability** - Define scenarios once, use across multiple tests
✅ **Maintainability** - Change schema in one place
✅ **Clean Teardown** - Track created records for proper cleanup

---

## Factories

### Purpose
Factories generate test data with automatic timestamp injection for uniqueness.

### Structure

```typescript
// 1. Define the data interface
export interface AccountData {
  name: string;
  telephone1?: string;
  emailaddress1?: string;
  // OData relationships
  'parentaccountid@odata.bind'?: string;
}

// 2. Define creation options
export interface CreateAccountOptions {
  name?: string;
  phone?: string;
  email?: string;
  parentAccountId?: string;
}

// 3. Create the factory class
export class AccountFactory {
  static create(options: CreateAccountOptions = {}): AccountData {
    const timestamp = Date.now();
    return {
      name: `${options.name || 'Test Account'} ${timestamp}`,
      telephone1: options.phone,
      emailaddress1: options.email
    };
  }

  static createBulk(count: number, options = {}): AccountData[] {
    // Generate multiple records
  }
}
```

### Usage

```typescript
import { AccountFactory } from '../data/factories/AccountFactory';

// Simple creation
const account = AccountFactory.create({ name: 'My Account' });

// With relationships
const account = AccountFactory.create({
  name: 'Child Account',
  parentAccountId: parentAccount.id
});

// Bulk creation
const accounts = AccountFactory.createBulk(10, { name: 'Bulk Account' });
```

---

## Fixtures

### Purpose
Fixtures provide pre-configured test scenarios for repeatable tests.

### Structure

```typescript
interface AccountScenario {
  description: string;
  entities: {
    account: { type: string };
    contact?: { type: string };
  };
  data: {
    account: CreateAccountOptions;
    contact?: CreateContactOptions;
  };
}

export const ACCOUNT_TEST_SCENARIOS: Record<string, AccountScenario> = {
  SIMPLE_ACCOUNT: {
    description: 'Basic account',
    entities: { account: { type: 'account' } },
    data: {
      account: { name: 'Simple Account' }
    }
  },

  ACCOUNT_WITH_CONTACT: {
    description: 'Account with contact',
    entities: {
      account: { type: 'account' },
      contact: { type: 'contact' }
    },
    data: {
      account: { name: 'Parent Account' },
      contact: { firstname: 'John', lastname: 'Doe' }
    }
  }
};
```

### Usage

```typescript
import { ACCOUNT_TEST_SCENARIOS } from '../data/fixtures/account-scenarios';
import { AccountFactory } from '../data/factories/AccountFactory';

const scenario = ACCOUNT_TEST_SCENARIOS.SIMPLE_ACCOUNT;
const accountData = AccountFactory.create(scenario.data.account);
const account = await webApi.createRecord('account', accountData);
```

---

## Complete Test Example

```typescript
import { test } from '@playwright/test';
import { WebApi } from '../../framework';
import { AccountFactory } from '../data/factories/AccountFactory';
import { ContactFactory } from '../data/factories/ContactFactory';

test.describe('Account Tests', () => {
  let webApi: WebApi;
  let createdAccountIds: string[] = [];
  let createdContactIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Initialize WebApi
    webApi = new WebApi(new XrmHelper(page));

    // Reset tracking
    createdAccountIds = [];
    createdContactIds = [];
  });

  test.afterEach(async () => {
    // CRITICAL: Delete in REVERSE order

    // 1. Delete children first
    for (const contactId of createdContactIds) {
      await webApi.deleteRecord('contact', contactId);
    }

    // 2. Delete parents last
    for (const accountId of createdAccountIds) {
      await webApi.deleteRecord('account', accountId);
    }
  });

  test('should create account with contact', async () => {
    // Create account
    const accountData = AccountFactory.create({ name: 'Test Corp' });
    const account = await webApi.createRecord('account', accountData);
    createdAccountIds.push(account.id);

    // Create contact linked to account
    const contactData = ContactFactory.create({
      firstname: 'Jane',
      lastname: 'Doe',
      accountId: account.id  // Creates OData binding
    });
    const contact = await webApi.createRecord('contact', contactData);
    createdContactIds.push(contact.id);

    // Test logic here...

    // Cleanup happens automatically in afterEach
  });
});
```

---

## OData Relationships

Use the `@odata.bind` syntax for lookups:

```typescript
// Single-valued navigation (N:1 relationships)
{
  'parentaccountid@odata.bind': `/accounts(${parentId})`
}

// Example: Contact to Account
{
  'parentcustomerid_account@odata.bind': `/accounts(${accountId})`
}

// Example: Opportunity to Account
{
  'customerid_account@odata.bind': `/accounts(${accountId})`
}
```

---

## Cleanup Best Practices

### Rule: ALWAYS Delete in Reverse Creation Order

```typescript
// ✅ CORRECT ORDER
test.afterEach(async () => {
  // 1. Delete notes/activities (grandchildren)
  for (const noteId of createdNoteIds) {
    await webApi.deleteRecord('annotation', noteId);
  }

  // 2. Delete contacts (children)
  for (const contactId of createdContactIds) {
    await webApi.deleteRecord('contact', contactId);
  }

  // 3. Delete accounts (parents)
  for (const accountId of createdAccountIds) {
    await webApi.deleteRecord('account', accountId);
  }
});

// ❌ WRONG ORDER - Will cause errors
test.afterEach(async () => {
  await webApi.deleteRecord('account', accountId);     // ❌ Fails!
  await webApi.deleteRecord('contact', contactId);     // ❌ Orphaned
});
```

### Error Handling in Cleanup

```typescript
test.afterEach(async () => {
  for (const id of createdIds) {
    try {
      await webApi.deleteRecord('entity', id);
      console.log(`✅ Cleaned up: ${id}`);
    } catch (error) {
      // Log but don't fail the test
      console.error(`❌ Cleanup failed for ${id}:`, error);
    }
  }
});
```

---

## Adding New Factories

1. **Create the factory file** in `factories/`
2. **Define interfaces** for data and options
3. **Implement create()** with timestamp injection
4. **Add bulk creation** if needed
5. **Update fixtures** with new scenarios

### Template

```typescript
// MyEntityFactory.ts
export interface MyEntityData {
  name: string;
  // Add fields
}

export interface CreateMyEntityOptions {
  name?: string;
  // Add options
}

export class MyEntityFactory {
  private static getTimestamp(): number {
    return Date.now();
  }

  static create(options: CreateMyEntityOptions = {}): MyEntityData {
    const timestamp = this.getTimestamp();
    return {
      name: `${options.name || 'Test'} ${timestamp}`
    };
  }

  static createBulk(count: number, options = {}): MyEntityData[] {
    const items: MyEntityData[] = [];
    for (let i = 0; i < count; i++) {
      items.push(this.create({ ...options, name: `${options.name} ${i + 1}` }));
    }
    return items;
  }
}
```

---

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Type Safety** | TypeScript interfaces catch errors at compile time |
| **Uniqueness** | Timestamps prevent test data conflicts |
| **Reusability** | Define once, use everywhere |
| **Maintainability** | Single source of truth for data structures |
| **Clean Tests** | Tests focus on logic, not data generation |
| **Parallel Execution** | Unique data enables concurrent test runs |

---

## See Also

- **Example Test**: `tests/mda/account-factory-demo.spec.ts`
- **Framework Docs**: `FRAMEWORK_COMPONENTS.md`
- **Main README**: `README.md`
