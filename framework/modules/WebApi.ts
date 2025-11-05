import { XrmHelper } from '../core/XrmHelper';

/**
 * WebApi - Handles D365 Web API operations
 */
export class WebApi {
  constructor(private xrmHelper: XrmHelper) {}

  /**
   * Create a single record
   * @returns Object with id and entityType of created record
   */
  async createRecord(
    entityLogicalName: string,
    data: any
  ): Promise<{ id: string; entityType: string }> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(
      ({ entityName, recordData }) => {
        return window.Xrm.WebApi.createRecord(entityName, recordData) as any;
      },
      { entityName: entityLogicalName, recordData: data }
    );
  }

  /**
   * Retrieve a single record
   * @returns The record object with requested attributes
   */
  async retrieveRecord(
    entityLogicalName: string,
    id: string,
    options?: string
  ): Promise<any> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(
      ({ entityName, recordId, queryOptions }) => {
        return window.Xrm.WebApi.retrieveRecord(entityName, recordId, queryOptions);
      },
      { entityName: entityLogicalName, recordId: id, queryOptions: options }
    );
  }

  /**
   * Retrieve multiple records
   * @returns Object with entities array and optional nextLink for paging
   */
  async retrieveMultipleRecords(
    entityLogicalName: string,
    options?: string,
    maxPageSize?: number
  ): Promise<{
    entities: any[];
    '@odata.nextLink'?: string;
    '@odata.count'?: number;
  }> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(
      ({ entityName, queryOptions, pageSize }) => {
        return window.Xrm.WebApi.retrieveMultipleRecords(entityName, queryOptions, pageSize);
      },
      { entityName: entityLogicalName, queryOptions: options, pageSize: maxPageSize }
    );
  }

  /**
   * Update a single record
   * @returns Object with id and entityType of updated record
   */
  async updateRecord(
    entityLogicalName: string,
    id: string,
    data: any
  ): Promise<{ id: string; entityType: string }> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(
      ({ entityName, recordId, recordData }) => {
        return window.Xrm.WebApi.updateRecord(entityName, recordId, recordData) as any;
      },
      { entityName: entityLogicalName, recordId: id, recordData: data }
    );
  }

  /**
   * Delete a single record
   * NOTE: Actually returns { entityType, id, name } but @types/xrm has wrong type
   * @returns Object with entityType, id, and name of deleted record
   */
  async deleteRecord(
    entityLogicalName: string,
    id: string
  ): Promise<any> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(
      ({ entityName, recordId }) => {
        return window.Xrm.WebApi.deleteRecord(entityName, recordId);
      },
      { entityName: entityLogicalName, recordId: id }
    );
  }
}
