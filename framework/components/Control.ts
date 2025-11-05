import { XrmHelper } from '../core/XrmHelper';

/**
 * State of a control
 */
export interface ControlState {
  /**
   * Whether the control is currently visible
   */
  isVisible: boolean;

  /**
   * Whether the control is currently disabled
   */
  isDisabled: boolean;
}

/**
 * Control - Handles D365 form control operations via Xrm Client API
 */
export class Control {
  constructor(private xrmHelper: XrmHelper) {}

  /**
   * Gets the state of the specified control
   * @param controlName Name of the control to retrieve
   * @returns Promise which resolves with the current control state
   */
  async get(controlName: string): Promise<ControlState> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl(name);

      if (!control) {
        throw new Error(`Control '${name}' not found on form`);
      }

      // Check if control and its parents are visible
      const isVisible =
        control.getVisible() &&
        (!control.getParent() || control.getParent().getVisible()) &&
        (!control.getParent() ||
          !control.getParent().getParent() ||
          control.getParent().getParent().getVisible());

      return {
        isVisible: isVisible,
        isDisabled: (control as any).getDisabled() as boolean
      };
    }, controlName);
  }

  /**
   * Gets the options of the specified option set control
   * @param controlName Name of the control to retrieve
   * @returns Promise which resolves with the control's options
   */
  async getOptions(controlName: string): Promise<Xrm.OptionSetValue[]> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.OptionSetControl>(name);

      if (!control) {
        throw new Error(`Control '${name}' not found on form`);
      }

      return (control as any).getOptions() as Xrm.OptionSetValue[];
    }, controlName);
  }

  /**
   * Sets the visibility of the specified control
   * @param controlName Name of the control
   * @param visible Whether the control should be visible
   */
  async setVisible(controlName: string, visible: boolean): Promise<void> {
    await this.xrmHelper.waitForXrmReady();

    await this.xrmHelper.page.evaluate(
      ({ name, isVisible }) => {
        const control = window.Xrm.Page.getControl(name);

        if (!control) {
          throw new Error(`Control '${name}' not found on form`);
        }

        (control as any).setVisible(isVisible);
      },
      { name: controlName, isVisible: visible }
    );
  }

  /**
   * Sets the disabled state of the specified control
   * @param controlName Name of the control
   * @param disabled Whether the control should be disabled
   */
  async setDisabled(controlName: string, disabled: boolean): Promise<void> {
    await this.xrmHelper.waitForXrmReady();

    await this.xrmHelper.page.evaluate(
      ({ name, isDisabled }) => {
        const control = window.Xrm.Page.getControl(name);

        if (!control) {
          throw new Error(`Control '${name}' not found on form`);
        }

        (control as any).setDisabled(isDisabled);
      },
      { name: controlName, isDisabled: disabled }
    );
  }

  /**
   * Gets the label of the specified control
   * @param controlName Name of the control
   * @returns Promise which resolves with the control's label
   */
  async getLabel(controlName: string): Promise<string> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl(name);

      if (!control) {
        throw new Error(`Control '${name}' not found on form`);
      }

      return control.getLabel();
    }, controlName);
  }

  /**
   * Sets the label of the specified control
   * @param controlName Name of the control
   * @param label New label for the control
   */
  async setLabel(controlName: string, label: string): Promise<void> {
    await this.xrmHelper.waitForXrmReady();

    await this.xrmHelper.page.evaluate(
      ({ name, labelText }) => {
        const control = window.Xrm.Page.getControl(name);

        if (!control) {
          throw new Error(`Control '${name}' not found on form`);
        }

        control.setLabel(labelText);
      },
      { name: controlName, labelText: label }
    );
  }
}
