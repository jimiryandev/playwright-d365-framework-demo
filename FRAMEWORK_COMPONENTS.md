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
- Default column: 1 (checkbox column for most reliable opening)

**getCellTextByIndex(recordNumber: number, columnIndex: number): Promise<string>**
- Gets text from specific cell
- Both indices are zero-based

**getRecordName(recordNumber: number): Promise<string>**
- Shortcut for getting main field

**getColumnInfo(): Promise<Array<{index: number, text: string}>>**
- Gets all visible column headers and their indices

**getColumnIndexByName(columnName: string): Promise<number>**
- Gets column index by header name

**selectAllRecords(): Promise<void>**
- Selects all records in grid

**deselectAllRecords(): Promise<void>**
- Deselects all records

**selectNthRecord(recordNumber: number): Promise<void>**
- Selects specific record by index

**isRecordSelected(recordNumber: number): Promise<boolean>**
- Checks if record is selected

**sortColumnAtoZ(columnName: string): Promise<void>**
- Sorts column ascending

**sortColumnZtoA(columnName: string): Promise<void>**
- Sorts column descending

### Example

```typescript
const grid = new Grid(page);
await grid.waitForGridReady();

const count = await grid.getGridRowCount();
console.log(`Found ${count} records`);

if (count > 0) {
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

**getCurrentArea(): Promise<string>**
- Gets the currently active area

**changeArea(areaName: string): Promise<void>**
- Switches to different area

**expandRecentMenu(): Promise<void>**
- Expands the Recent menu

**getRecentItems(): Promise<string[]>**
- Gets all recent items

**expandPinnedMenu(): Promise<void>**
- Expands the Pinned menu

**getPinnedItems(): Promise<string[]>**
- Gets all pinned items

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
