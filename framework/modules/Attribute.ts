import { XrmHelper } from '../core/XrmHelper';

/**
 * Define behavior during setting of field values
 */
interface SetValueSettings {
  /**
   * Time to wait after setting a value to give onChange handlers time to work
   */
  settleTime?: number;
  /**
   * Set value no matter whether field is readonly or hidden
   */
  forceValue?: boolean;
}

/**
 * Attribute - Handles D365 form attribute/field operations via Xrm Client API
 */
export class Attribute {
  constructor(private xrmHelper: XrmHelper) {}

  /**
   * Gets the required level of the specified attribute
   * @param attributeName Name of the attribute
   * @returns Required level of the specified attribute
   */
  async getRequiredLevel(attributeName: string): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate((attrName: string) => {
      const attr = window.Xrm.Page.getAttribute(attrName);
      if (!attr) throw new Error(`Attribute '${attrName}' not found on form`);
      return attr.getRequiredLevel();
    }, attributeName);
  }

  /**
   * Gets the value of the specified attribute
   * @param attributeName Name of the attribute
   * @returns Value of the specified attribute
   */
  async getValue(attributeName: string): Promise<any> {
    await this.xrmHelper.waitForXrmReady();

    const [attributeType, value] = await this.xrmHelper.page.evaluate((attrName: string) => {
      const attribute = window.Xrm.Page.getAttribute(attrName);
      if (!attribute) throw new Error(`Attribute '${attrName}' not found on form`);

      const attributeType = attribute.getAttributeType();
      const isDate = attributeType === 'datetime';
      const rawValue = attribute.getValue();

      // For datetime, convert to ISO string
      let value = rawValue;
      if (isDate && rawValue instanceof Date) {
        value = rawValue.toISOString();
      }

      return [attributeType, value];
    }, attributeName);

    // Convert ISO string back to Date object for datetime fields
    if (attributeType === 'datetime' && typeof value === 'string') {
      return new Date(Date.parse(value));
    }

    return value;
  }

  /**
   * Sets the value of the specified attribute
   * @param attributeName Name of the attribute
   * @param value Value to set
   * @param settings Settings defining time to wait (ms) after setting value and whether to force into readonly fields
   * @returns Returns promise that resolves once value is set and settleTime is over
   */
  async setValue(
    attributeName: string,
    value: any,
    settings?: number | SetValueSettings
  ): Promise<void> {
    const defaults: SetValueSettings = {
      settleTime: 500,
      forceValue: false
    };

    const safeSettings = {
      ...defaults,
      ...(typeof settings === 'number' ? { settleTime: settings } as SetValueSettings : settings)
    };

    const isDate = Object.prototype.toString.call(value) === '[object Date]';
    await this.xrmHelper.waitForXrmReady();

    await this.xrmHelper.page.evaluate(
      ({ attrName, val, opts }) => {
        const attribute = window.Xrm.Page.getAttribute(attrName);
        if (!attribute) throw new Error(`Attribute '${attrName}' not found on form`);

        // Check if field is editable unless forceValue is true
        const editable = opts.forceValue || attribute.controls.get().some((control: any) => {
          return (
            !control.getDisabled() &&
            control.getVisible() &&
            (!control.getParent() || control.getParent().getVisible()) &&
            (!control.getParent() || !control.getParent().getParent() || control.getParent().getParent().getVisible())
          );
        });

        if (!editable) {
          throw new Error(
            `Attribute '${attrName}' has no unlocked and visible control, users can't set a value like that.`
          );
        }

        // Set value (convert ISO string back to Date for datetime fields)
        const finalValue = attribute.getAttributeType() === 'datetime' ? new Date(val) : val;
        attribute.setValue(finalValue);
        attribute.fireOnChange();
      },
      { attrName: attributeName, val: isDate ? (value as Date).toISOString() : value, opts: safeSettings }
    );

    // Wait for onChange handlers to complete
    await this.xrmHelper.page.waitForTimeout(safeSettings.settleTime || 500);
  }

  /**
   * Sets multiple attribute values at once
   * @param values JS object with keys matching the attribute names and values containing the values to set
   * @param settings Settings defining time to wait (ms) after setting value and whether to force into readonly fields
   * @returns Returns promise that resolves once values are set and settleTime is over
   * @example attribute.setValues({ name: "Account Name", telephone1: "+1-555-0100", industrycode: 1 })
   */
  async setValues(values: { [key: string]: any }, settings?: number | SetValueSettings): Promise<void> {
    for (const attributeName in values) {
      await this.setValue(attributeName, values[attributeName], settings);
    }
  }

  /**
   * Gets the attribute type
   * @param attributeName Name of the attribute
   * @returns Type of the attribute (e.g., 'string', 'datetime', 'lookup', 'optionset')
   */
  async getAttributeType(attributeName: string): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate((attrName: string) => {
      const attr = window.Xrm.Page.getAttribute(attrName);
      if (!attr) throw new Error(`Attribute '${attrName}' not found on form`);
      return attr.getAttributeType();
    }, attributeName);
  }

  /**
   * Gets the formatted value of the specified attribute (useful for lookups and optionsets)
   * @param attributeName Name of the attribute
   * @returns Formatted value of the specified attribute
   */
  async getFormattedValue(attributeName: string): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate((attrName: string) => {
      const attribute = window.Xrm.Page.getAttribute(attrName);
      if (!attribute) throw new Error(`Attribute '${attrName}' not found on form`);
      return attribute.getFormat();
    }, attributeName);
  }

  /**
   * Checks if the attribute is dirty (has unsaved changes)
   * @param attributeName Name of the attribute
   * @returns True if the attribute has been changed
   */
  async isDirty(attributeName: string): Promise<boolean> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate((attrName: string) => {
      const attr = window.Xrm.Page.getAttribute(attrName);
      if (!attr) throw new Error(`Attribute '${attrName}' not found on form`);
      return attr.getIsDirty();
    }, attributeName);
  }

  /**
   * Sets the required level of the attribute
   * @param attributeName Name of the attribute
   * @param requirementLevel The requirement level ('none', 'required', 'recommended')
   */
  async setRequiredLevel(attributeName: string, requirementLevel: 'none' | 'required' | 'recommended'): Promise<void> {
    await this.xrmHelper.waitForXrmReady();
    await this.xrmHelper.page.evaluate(
      ({ attrName, level }) => {
        const attr = window.Xrm.Page.getAttribute(attrName);
        if (!attr) throw new Error(`Attribute '${attrName}' not found on form`);
        attr.setRequiredLevel(level as any);
      },
      { attrName: attributeName, level: requirementLevel }
    );
  }
}
