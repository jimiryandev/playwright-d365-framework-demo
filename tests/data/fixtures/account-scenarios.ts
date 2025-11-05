// tests/data/fixtures/account-scenarios.ts
import { INDUSTRY_CODE } from '../factories/AccountFactory';
import { PREFERRED_CONTACT_METHOD } from '../factories/ContactFactory';
import type { CreateAccountOptions } from '../factories/AccountFactory';
import type { CreateContactOptions } from '../factories/ContactFactory';

/**
 * Pre-defined test scenarios for Account-related tests
 * Each scenario defines the entities and their configuration
 */

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

/**
 * Collection of test scenarios
 * Use these for consistent, repeatable test data across your test suite
 */
export const ACCOUNT_TEST_SCENARIOS: Record<string, AccountScenario> = {
  /**
   * Simple account with no relationships
   * Good for basic CRUD operations
   */
  SIMPLE_ACCOUNT: {
    description: 'Basic account with minimal fields',
    entities: {
      account: { type: 'account' }
    },
    data: {
      account: {
        name: 'Simple Test Account',
        phone: '+1-555-0100',
        email: 'info@simpletest.com'
      }
    }
  },

  /**
   * Account with a primary contact
   * Demonstrates relationship management and cleanup order
   */
  ACCOUNT_WITH_CONTACT: {
    description: 'Account with associated primary contact',
    entities: {
      account: { type: 'account' },
      contact: { type: 'contact' }
    },
    data: {
      account: {
        name: 'Test Account with Contact',
        phone: '+1-555-0200',
        email: 'contact@testaccount.com',
        city: 'Seattle',
        state: 'Washington',
        country: 'USA'
      },
      contact: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@testaccount.com',
        phone: '+1-555-0201',
        jobTitle: 'Account Manager',
        preferredContactMethod: PREFERRED_CONTACT_METHOD.EMAIL
      }
    }
  },

  /**
   * Large enterprise account
   * Good for testing business logic and validation rules
   */
  ENTERPRISE_ACCOUNT: {
    description: 'Large enterprise account with full details',
    entities: {
      account: { type: 'account' }
    },
    data: {
      account: {
        name: 'Enterprise Corp',
        phone: '+1-555-1000',
        secondaryPhone: '+1-555-1001',
        email: 'info@enterprisecorp.com',
        website: 'https://www.enterprisecorp.com',
        addressLine1: '1000 Enterprise Way',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        industry: INDUSTRY_CODE.SOFTWARE,
        revenue: 10000000,
        employees: 500,
        description: 'Large enterprise software company specializing in cloud solutions'
      }
    }
  },

  /**
   * Small business account
   * Good for testing different validation rules
   */
  SMALL_BUSINESS: {
    description: 'Small business account',
    entities: {
      account: { type: 'account' }
    },
    data: {
      account: {
        name: 'Small Business LLC',
        phone: '+1-555-0500',
        email: 'hello@smallbiz.com',
        website: 'https://www.smallbiz.com',
        city: 'Portland',
        state: 'Oregon',
        country: 'USA',
        industry: INDUSTRY_CODE.RETAIL,
        revenue: 250000,
        employees: 10,
        description: 'Local retail business serving the Portland community'
      }
    }
  },

  /**
   * Technology startup account
   * Good for testing modern business scenarios
   */
  TECH_STARTUP: {
    description: 'Technology startup account',
    entities: {
      account: { type: 'account' }
    },
    data: {
      account: {
        name: 'Tech Innovations Inc',
        phone: '+1-555-2000',
        email: 'contact@techinnovations.com',
        website: 'https://www.techinnovations.com',
        addressLine1: '500 Innovation Drive',
        city: 'San Francisco',
        state: 'California',
        postalCode: '94105',
        country: 'USA',
        industry: INDUSTRY_CODE.SOFTWARE,
        revenue: 2000000,
        employees: 50,
        description: 'AI-powered SaaS platform for business automation'
      }
    }
  },

  /**
   * Healthcare provider account
   * Good for testing industry-specific scenarios
   */
  HEALTHCARE_PROVIDER: {
    description: 'Healthcare provider account',
    entities: {
      account: { type: 'account' }
    },
    data: {
      account: {
        name: 'City Medical Center',
        phone: '+1-555-3000',
        secondaryPhone: '+1-555-3001',
        email: 'info@citymedical.com',
        website: 'https://www.citymedical.com',
        addressLine1: '200 Healthcare Blvd',
        city: 'Boston',
        state: 'Massachusetts',
        postalCode: '02101',
        country: 'USA',
        industry: INDUSTRY_CODE.HEALTHCARE,
        employees: 200,
        description: 'Full-service medical center providing comprehensive healthcare services'
      }
    }
  }
} as const;

export type AccountScenarioName = keyof typeof ACCOUNT_TEST_SCENARIOS;
