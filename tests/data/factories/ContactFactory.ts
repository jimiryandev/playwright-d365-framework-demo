// tests/data/factories/ContactFactory.ts

/**
 * Preferred Method of Contact option set values
 * From the standard Contact entity schema
 */
export const PREFERRED_CONTACT_METHOD = {
  ANY: 1,
  EMAIL: 2,
  PHONE: 3,
  FAX: 4,
  MAIL: 5
} as const;

export type PreferredContactMethod = typeof PREFERRED_CONTACT_METHOD[keyof typeof PREFERRED_CONTACT_METHOD];

/**
 * Interface representing the Contact entity data structure
 * Based on standard D365 Contact entity fields only
 */
export interface ContactData {
  /** First name (typically required along with lastname) */
  firstname: string;

  /** Last name (typically required along with firstname) */
  lastname: string;

  /** Primary email address */
  emailaddress1?: string;

  /** Main phone number */
  telephone1?: string;

  /** Mobile phone number */
  mobilephone?: string;

  /** Job title */
  jobtitle?: string;

  /** Contact description or notes */
  description?: string;

  /** Preferred method of contact (standard option set) */
  preferredcontactmethodcode?: PreferredContactMethod;

  /** Relationship to parent account (OData binding) */
  'parentcustomerid_account@odata.bind'?: string;
}

/**
 * Options for creating a contact
 * Provides user-friendly parameter names that map to D365 field names
 */
export interface CreateContactOptions {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  description?: string;
  preferredContactMethod?: PreferredContactMethod;

  /** For relationships */
  accountId?: string;
}

/**
 * Factory for creating Contact test data
 * Contacts are commonly associated with Accounts in test scenarios
 *
 * @example
 * // Create a simple contact
 * const contact = ContactFactory.create({
 *   firstname: "John",
 *   lastname: "Doe"
 * });
 *
 * @example
 * // Create a detailed contact
 * const contact = ContactFactory.create({
 *   firstname: "Jane",
 *   lastname: "Smith",
 *   email: "jane.smith@example.com",
 *   phone: "+1-555-0199",
 *   preferredContactMethod: PREFERRED_CONTACT_METHOD.EMAIL
 * });
 *
 * @example
 * // Create a contact linked to an account
 * const contact = ContactFactory.create({
 *   firstname: "Bob",
 *   lastname: "Johnson",
 *   accountId: accountId
 * });
 */
export class ContactFactory {
  private static getTimestamp(): number {
    return Date.now();
  }

  /**
   * Creates a single contact with optional customization
   * @param options - Optional configuration for the contact
   * @returns ContactData ready for WebApi.createRecord()
   */
  static create(options: CreateContactOptions = {}): ContactData {
    const timestamp = this.getTimestamp();
    const contactData: ContactData = {
      firstname: options.firstname || 'Test',
      lastname: options.lastname ? `${options.lastname} ${timestamp}` : `Contact ${timestamp}`
    };

    // Map optional fields
    if (options.email) contactData.emailaddress1 = options.email;
    if (options.phone) contactData.telephone1 = options.phone;
    if (options.mobile) contactData.mobilephone = options.mobile;
    if (options.jobTitle) contactData.jobtitle = options.jobTitle;
    if (options.description) contactData.description = options.description;
    if (options.preferredContactMethod !== undefined) {
      contactData.preferredcontactmethodcode = options.preferredContactMethod;
    }

    // OData relationship bindings
    if (options.accountId) {
      contactData['parentcustomerid_account@odata.bind'] = `/accounts(${options.accountId})`;
    }

    return contactData;
  }

  /**
   * Creates multiple contacts with the same configuration
   * @param count - Number of contacts to create
   * @param options - Base configuration for all contacts
   * @returns Array of ContactData
   *
   * @example
   * const contacts = ContactFactory.createBulk(3, {
   *   firstname: "Test",
   *   accountId: accountId
   * });
   */
  static createBulk(
    count: number,
    options: CreateContactOptions = {}
  ): ContactData[] {
    const contacts: ContactData[] = [];

    for (let i = 0; i < count; i++) {
      const contactOptions = {
        ...options,
        lastname: options.lastname ? `${options.lastname} ${i + 1}` : `Bulk Contact ${i + 1}`
      };
      contacts.push(this.create(contactOptions));
    }

    return contacts;
  }
}
