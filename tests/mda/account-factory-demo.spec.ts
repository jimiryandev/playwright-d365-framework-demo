import { test, expect } from '@playwright/test';
import { XrmHelper, WebApi, Grid, Sidebar, Attribute, SubGrid, Control } from '../../framework';
import { testConfig, validateConfig } from './test-config';
import { AccountFactory, INDUSTRY_CODE } from '../data/factories/AccountFactory';
import { ContactFactory } from '../data/factories/ContactFactory';
import { ACCOUNT_TEST_SCENARIOS } from '../data/fixtures/account-scenarios';

interface CreatedEntity {
  id: string;
  entityType: string;
}

/**
 * Demo test showing the Factory and Fixture pattern for test data management
 * This is the recommended approach for creating and managing test data
 */
test.describe('Account Factory Pattern Demo', () => {
  let xrmHelper: XrmHelper;
  let webApi: WebApi;
  let grid: Grid;
  let sidebar: Sidebar;
  let attribute: Attribute;
  let subGrid: SubGrid;
  let control: Control;

  test.beforeEach(async ({ page }) => {
    validateConfig();
    await page.goto(testConfig.mdaUrl);
    xrmHelper = new XrmHelper(page);
    webApi = new WebApi(xrmHelper);
    grid = new Grid(page);
    sidebar = new Sidebar(page);
    attribute = new Attribute(xrmHelper);
    subGrid = new SubGrid(xrmHelper);
    control = new Control(xrmHelper);
  });

  test('SHOWCASE: Create account with primary and secondary contacts, verify in UI', async ({ page }) => {
    const createdEntities: CreatedEntity[] = [];

    try {
      // ========================================
      // STEP 1: Create First Account (Contoso)
      // ========================================
      console.log('STEP 1: Creating first account (Contoso)...');
      const accountData = AccountFactory.create({
        name: 'Contoso Corporation',
        phone: '+1-555-0100',
        email: 'info@contoso.com',
        city: 'Seattle',
        state: 'Washington',
        country: 'USA',
        industry: INDUSTRY_CODE.SOFTWARE
      });

      const account = await webApi.createRecord('account', accountData);
      createdEntities.push({ id: account.id, entityType: 'account' });
      console.log(`✓ Created account: ${account.id}`);

      // ========================================
      // STEP 2: Create Second Account (Fabrikam)
      // ========================================
      console.log('STEP 2: Creating second account (Fabrikam) for search demo...');
      const fabrikamData = AccountFactory.create({
        name: 'Fabrikam Industries',
        phone: '+1-555-0200',
        email: 'info@fabrikam.com',
        city: 'Portland',
        state: 'Oregon',
        country: 'USA',
        industry: INDUSTRY_CODE.MANUFACTURING
      });

      const fabrikamAccount = await webApi.createRecord('account', fabrikamData);
      createdEntities.push({ id: fabrikamAccount.id, entityType: 'account' });
      console.log(`✓ Created second account: ${fabrikamAccount.id}`);

      // ========================================
      // STEP 3: Create Primary Contact
      // ========================================
      console.log('STEP 3: Creating primary contact...');
      const primaryContactData = ContactFactory.create({
        firstname: 'John',
        lastname: 'Primary',
        email: 'john.primary@contoso.com',
        phone: '+1-555-0101',
        jobTitle: 'CEO',
        accountId: account.id
      });

      const primaryContact = await webApi.createRecord('contact', primaryContactData);
      createdEntities.push({ id: primaryContact.id, entityType: 'contact' });
      console.log(`✓ Created primary contact: ${primaryContact.id}`);

      // ========================================
      // STEP 4: Link Primary Contact to Account
      // ========================================
      console.log('STEP 4: Setting primary contact on account...');
      await webApi.updateRecord('account', account.id, {
        'primarycontactid@odata.bind': `/contacts(${primaryContact.id})`
      });
      console.log(`✓ Linked primary contact to account`);

      // ========================================
      // STEP 5: Create Secondary Contact
      // ========================================
      console.log('STEP 5: Creating secondary contact...');
      const secondaryContactData = ContactFactory.create({
        firstname: 'Jane',
        lastname: 'Secondary',
        email: 'jane.secondary@contoso.com',
        phone: '+1-555-0102',
        jobTitle: 'CFO',
        accountId: account.id
      });

      const secondaryContact = await webApi.createRecord('contact', secondaryContactData);
      createdEntities.push({ id: secondaryContact.id, entityType: 'contact' });
      console.log(`✓ Created secondary contact: ${secondaryContact.id}`);

      // ========================================
      // STEP 6: Navigate to Accounts Grid
      // ========================================
      console.log('STEP 6: Navigating to Accounts grid...');
      await sidebar.navigateByAriaLabel('Accounts');
      await grid.waitForGridReady();
      console.log(`✓ Navigated to Accounts grid`);

      // Give time to see the grid
      await page.waitForTimeout(2000);

      // ========================================
      // STEP 7: Search for the Account
      // ========================================
      console.log('STEP 7: Searching for Contoso account (filtering from 2 accounts)...');
      await grid.searchGrid('Contoso Corporation');
      await page.waitForTimeout(2000);
      console.log(`✓ Searched for account`);

      // ========================================
      // STEP 8: Open the Account Record
      // ========================================
      console.log('STEP 8: Opening account record using Grid.openNthRecord()...');
      await grid.openNthRecord(0);
      console.log(`✓ Opened account form`);

      // Give time to see the form
      await page.waitForTimeout(2000);

      // ========================================
      // STEP 9: Verify Account Form Fields
      // ========================================
      console.log('STEP 9: Verifying account form fields...');

      // Verify account name
      const accountName = await attribute.getValue('name');
      expect(accountName).toContain('Contoso Corporation');
      console.log(`✓ Account Name: ${accountName}`);

      // Verify phone
      const phone = await attribute.getValue('telephone1');
      expect(phone).toBe('+1-555-0100');
      console.log(`✓ Phone: ${phone}`);

      // ========================================
      // STEP 10: Verify Primary Contact Lookup
      // ========================================
      console.log('STEP 10: Verifying primary contact lookup field...');
      const primaryContactLookup = await attribute.getValue('primarycontactid');
      expect(primaryContactLookup).toBeTruthy();
      console.log(`✓ Primary Contact is set: ${JSON.stringify(primaryContactLookup)}`);

      // Give time to inspect the form with all verified fields
      console.log('Pausing for 5 seconds to inspect the form...');
      await page.waitForTimeout(5000);

      // ========================================
      // STEP 11: Verify Contacts Subgrid
      // ========================================
      console.log('STEP 11: Verifying contacts subgrid...');

      // First, verify the subgrid control exists and is visible
      const subgridControl = await control.get('Contacts');
      expect(subgridControl.isVisible).toBe(true);
      expect(subgridControl.isDisabled).toBe(false);
      console.log(`✓ Contacts subgrid control is visible and enabled`);

      // Now use SubGrid module to get record count
      const contactCount = await subGrid.getRecordCount('Contacts');
      expect(contactCount).toBe(2);
      console.log(`✓ Contacts subgrid has ${contactCount} records (primary + secondary)`);

      // Get the record IDs to verify they match our created contacts
      const contactIds = await subGrid.getRecordIds('Contacts');
      expect(contactIds).toContain(primaryContact.id);
      expect(contactIds).toContain(secondaryContact.id);
      console.log(`✓ Both contacts verified in subgrid`);

      // Give time to see the subgrid with both contacts
      await page.waitForTimeout(3000);

      // ========================================
      // STEP 12: Verify Relationships via API
      // ========================================
      console.log('STEP 12: Verifying relationships via API...');

      const accountWithRelationships = await webApi.retrieveRecord(
        'account',
        account.id,
        '?$select=_primarycontactid_value&$expand=contact_customer_accounts($select=fullname,jobtitle)'
      );

      expect(accountWithRelationships._primarycontactid_value).toBe(primaryContact.id);
      console.log(`✓ Primary contact relationship verified`);

      console.log(`✓ All verifications passed!`);

    } finally {
      // ========================================
      // CLEANUP: Delete in reverse order
      // ========================================
      console.log('Starting cleanup in reverse order...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });

  // ========================================
  // ADDITIONAL EXAMPLE TESTS (Commented Out)
  // ========================================
  // Uncomment these to see more factory pattern examples

  /*
  test('should create account using factory pattern', async () => {
    const createdEntities: CreatedEntity[] = [];

    try {
      const accountData = AccountFactory.create({
        name: 'Factory Demo Account',
        phone: '+1-555-0100',
        email: 'demo@example.com',
        city: 'Seattle'
      });

      const account = await webApi.createRecord('account', accountData);
      createdEntities.push({ id: account.id, entityType: 'account' });

      console.log(`Created account: ${account.id}`);
      expect(account.id).toBeDefined();

      await sidebar.navigateByAriaLabel('Accounts');
      await grid.waitForGridReady();

      const rowCount = await grid.getGridRowCount();
      expect(rowCount).toBeGreaterThan(0);

    } finally {
      console.log('Starting cleanup...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });

  test('should use pre-defined scenario from fixtures', async () => {
    const createdEntities: CreatedEntity[] = [];

    try {
      const scenario = ACCOUNT_TEST_SCENARIOS.ENTERPRISE_ACCOUNT;

      console.log(`Running scenario: ${scenario.description}`);

      const accountData = AccountFactory.create(scenario.data.account);
      const account = await webApi.createRecord('account', accountData);
      createdEntities.push({ id: account.id, entityType: 'account' });

      console.log(`Created account from scenario: ${account.id}`);
      expect(account.id).toBeDefined();

    } finally {
      console.log('Starting cleanup...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });

  test('should create multiple accounts in bulk', async () => {
    const createdEntities: CreatedEntity[] = [];

    try {
      const bulkAccountData = AccountFactory.createBulk(3, {
        name: 'Bulk Test Account',
        city: 'Portland'
      });

      console.log(`Creating ${bulkAccountData.length} accounts in bulk...`);

      for (const accountData of bulkAccountData) {
        const account = await webApi.createRecord('account', accountData);
        createdEntities.push({ id: account.id, entityType: 'account' });
        console.log(`Created bulk account: ${account.id}`);
      }

      expect(createdEntities.length).toBe(3);

      await sidebar.navigateByAriaLabel('Accounts');
      await grid.waitForGridReady();

      const rowCount = await grid.getGridRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(3);

    } finally {
      console.log('Starting cleanup...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });

  test('should demonstrate full CRUD lifecycle with factory', async () => {
    const createdEntities: CreatedEntity[] = [];

    try {
      const accountData = AccountFactory.create({
        name: 'CRUD Demo Account',
        industry: INDUSTRY_CODE.SOFTWARE,
        revenue: 5000000
      });

      const account = await webApi.createRecord('account', accountData);
      createdEntities.push({ id: account.id, entityType: 'account' });
      console.log(`CREATE: Account ${account.id}`);

      const retrievedAccount = await webApi.retrieveRecord(
        'account',
        account.id,
        '?$select=name,revenue'
      );
      console.log(`READ: ${retrievedAccount.name}`);
      expect(retrievedAccount.accountid).toBe(account.id);

      await webApi.updateRecord('account', account.id, {
        name: `${retrievedAccount.name} - Updated`,
        revenue: 7500000
      });
      console.log(`UPDATE: Account updated`);

      const updatedAccount = await webApi.retrieveRecord(
        'account',
        account.id,
        '?$select=name,revenue'
      );
      expect(updatedAccount.name).toContain('Updated');
      expect(updatedAccount.revenue).toBe(7500000);
      console.log(`VERIFY: ${updatedAccount.name} - Revenue: ${updatedAccount.revenue}`);

    } finally {
      console.log('Starting cleanup...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });

  test('should create account with complex scenario', async () => {
    const createdEntities: CreatedEntity[] = [];

    try {
      const scenario = ACCOUNT_TEST_SCENARIOS.ACCOUNT_WITH_CONTACT;
      console.log(`Running scenario: ${scenario.description}`);

      console.log('Creating account...');
      const accountData = AccountFactory.create(scenario.data.account);
      const account = await webApi.createRecord('account', accountData);
      createdEntities.push({ id: account.id, entityType: 'account' });
      console.log(`Created account: ${account.id}`);

      console.log('Creating contact...');
      const contactData = ContactFactory.create({
        ...scenario.data.contact!,
        accountId: account.id
      });
      const contact = await webApi.createRecord('contact', contactData);
      createdEntities.push({ id: contact.id, entityType: 'contact' });
      console.log(`Created contact: ${contact.id}`);

      expect(account.id).toBeDefined();
      expect(contact.id).toBeDefined();

    } finally {
      console.log('Starting cleanup in reverse order...');

      for (const { id, entityType } of createdEntities.reverse()) {
        try {
          console.log(`Deleting ${entityType} with ID: ${id}`);
          await webApi.deleteRecord(entityType, id);
          console.log(`Successfully deleted ${entityType}`);
        } catch (error) {
          console.error(`Failed to cleanup ${entityType} ${id}:`, error);
        }
      }

      console.log('Cleanup completed');
    }
  });
  */
});

/**
 * USAGE NOTES:
 *
 * 1. TRY/CATCH/FINALLY PATTERN:
 *    - All test logic goes in the try block
 *    - Cleanup happens in finally block (guaranteed to run)
 *    - Use createdEntities.reverse() for proper cleanup order
 *    - Destructure { id, entityType } in the cleanup loop for cleaner code
 *
 * 2. ENTITY TRACKING:
 *    - Push to createdEntities immediately after creation
 *    - Track both id and entityType for proper cleanup
 *    - Delete in reverse order (children first, parents last)
 *
 * 3. RELATIONSHIP PATTERN:
 *    When creating related records, use OData binding:
 *    {
 *      'fieldname@odata.bind': '/entitysetname(id)'
 *    }
 *
 * 4. BULK OPERATIONS:
 *    For performance testing, use createBulk():
 *    const accounts = AccountFactory.createBulk(100, { name: 'Perf Test' });
 *
 * 5. SCENARIO REUSE:
 *    Define scenarios once in fixtures, use across multiple tests
 *    Import constants: INDUSTRY_CODE, PREFERRED_CONTACT_METHOD
 */
