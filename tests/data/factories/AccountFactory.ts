// tests/data/factories/AccountFactory.ts

/**
 * Standard D365 Industry Code option set values
 * Common values from the out-of-the-box Account entity
 */
export const INDUSTRY_CODE = {
  ACCOUNTING: 1,
  AGRICULTURE_FORESTRY: 2,
  BROADCASTING: 3,
  BROKERS: 4,
  BUILDING_SUPPLY_RETAIL: 5,
  BUSINESS_SERVICES: 6,
  CONSULTING: 7,
  CONSUMER_SERVICES: 8,
  DESIGN: 9,
  DISTRIBUTORS_IMPORTERS: 10,
  FINANCIAL_SERVICES: 11,
  FOOD_BEVERAGE: 12,
  HEALTHCARE: 13,
  HOSPITALITY: 14,
  INSURANCE: 15,
  LEGAL_SERVICES: 16,
  MANUFACTURING: 17,
  MEDIA_MARKETING: 18,
  NON_PROFIT: 19,
  RETAIL: 20,
  SOFTWARE: 21,
  TELECOMMUNICATIONS: 22,
  TRANSPORTATION: 23,
  UTILITIES: 24,
  WHOLESALE: 25
} as const;

export type IndustryCode = typeof INDUSTRY_CODE[keyof typeof INDUSTRY_CODE];

/**
 * Interface representing the Account entity data structure
 * Based on standard D365 Account entity schema
 */
export interface AccountData {
  /** Account name (required) */
  name: string;

  /** Main phone number */
  telephone1?: string;

  /** Secondary phone number */
  telephone2?: string;

  /** Primary email address */
  emailaddress1?: string;

  /** Company website URL */
  websiteurl?: string;

  /** Street address line 1 */
  address1_line1?: string;

  /** City */
  address1_city?: string;

  /** State or province */
  address1_stateorprovince?: string;

  /** Postal code */
  address1_postalcode?: string;

  /** Country or region */
  address1_country?: string;

  /** Industry classification (option set) */
  industrycode?: IndustryCode;

  /** Annual revenue */
  revenue?: number;

  /** Number of employees */
  numberofemployees?: number;

  /** Account description or notes */
  description?: string;

  /** Relationship to parent account (OData binding) */
  'parentaccountid@odata.bind'?: string;

  /** Relationship to primary contact (OData binding) */
  'primarycontactid@odata.bind'?: string;
}

/**
 * Options for creating an account
 * Provides user-friendly parameter names that map to D365 field names
 */
export interface CreateAccountOptions {
  name?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  industry?: IndustryCode;
  revenue?: number;
  employees?: number;
  description?: string;

  /** For relationships */
  parentAccountId?: string;
  primaryContactId?: string;
}

/**
 * Factory for creating Account test data
 * Follows the factory pattern for consistent, unique test data generation
 *
 * @example
 * // Create a simple account
 * const account = AccountFactory.create({ name: "Contoso" });
 *
 * @example
 * // Create a detailed account
 * const account = AccountFactory.create({
 *   name: "Fabrikam",
 *   email: "info@fabrikam.com",
 *   phone: "+1-555-0100",
 *   city: "Seattle",
 *   industry: INDUSTRY_CODE.SOFTWARE
 * });
 */
export class AccountFactory {
  private static getTimestamp(): number {
    return Date.now();
  }

  /**
   * Creates a single account with optional customization
   * @param options - Optional configuration for the account
   * @returns AccountData ready for WebApi.createRecord()
   */
  static create(options: CreateAccountOptions = {}): AccountData {
    const timestamp = this.getTimestamp();
    const accountData: AccountData = {
      name: options.name ? `${options.name} ${timestamp}` : `Test Account ${timestamp}`
    };

    // Map optional fields
    if (options.phone) accountData.telephone1 = options.phone;
    if (options.secondaryPhone) accountData.telephone2 = options.secondaryPhone;
    if (options.email) accountData.emailaddress1 = options.email;
    if (options.website) accountData.websiteurl = options.website;
    if (options.addressLine1) accountData.address1_line1 = options.addressLine1;
    if (options.city) accountData.address1_city = options.city;
    if (options.state) accountData.address1_stateorprovince = options.state;
    if (options.postalCode) accountData.address1_postalcode = options.postalCode;
    if (options.country) accountData.address1_country = options.country;
    if (options.industry !== undefined) accountData.industrycode = options.industry;
    if (options.revenue !== undefined) accountData.revenue = options.revenue;
    if (options.employees !== undefined) accountData.numberofemployees = options.employees;
    if (options.description) accountData.description = options.description;

    // OData relationship bindings
    if (options.parentAccountId) {
      accountData['parentaccountid@odata.bind'] = `/accounts(${options.parentAccountId})`;
    }
    if (options.primaryContactId) {
      accountData['primarycontactid@odata.bind'] = `/contacts(${options.primaryContactId})`;
    }

    return accountData;
  }

  /**
   * Creates multiple accounts with the same configuration
   * Useful for performance testing or bulk data scenarios
   * @param count - Number of accounts to create
   * @param options - Base configuration for all accounts
   * @returns Array of AccountData
   *
   * @example
   * const accounts = AccountFactory.createBulk(5, {
   *   name: "Test Company",
   *   city: "London"
   * });
   */
  static createBulk(
    count: number,
    options: CreateAccountOptions = {}
  ): AccountData[] {
    const accounts: AccountData[] = [];

    for (let i = 0; i < count; i++) {
      const accountOptions = {
        ...options,
        name: options.name ? `${options.name} ${i + 1}` : `Bulk Test Account ${i + 1}`
      };
      accounts.push(this.create(accountOptions));
    }

    return accounts;
  }
}
