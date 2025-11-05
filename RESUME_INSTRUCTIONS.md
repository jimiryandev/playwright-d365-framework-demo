# Quick Resume Instructions

## For New Chat Session

**Copy and paste this to resume:**

---

Hi! I need to continue work on generating Playwright test data factories from D365 solution metadata.

**Context**:
- Working directory: `/home/james/Repos/playwright-d365-framework-demo`
- Unpacked solution at: `power_platform/solutions/playwright_test/`
- Full progress document: `FACTORY_GENERATION_PROGRESS.md`

**Task**:
Read the entity metadata XML files and generate complete TypeScript factories:
1. Read `power_platform/solutions/playwright_test/Entities/account/account.xml`
2. Read `power_platform/solutions/playwright_test/Entities/contact/contact.xml`
3. Generate complete factory code for `tests/data/factories/AccountFactory.ts`
4. Generate complete factory code for `tests/data/factories/ContactFactory.ts`
5. Update fixtures in `tests/data/fixtures/account-scenarios.ts` with real field examples

**What to generate**:
- Parse XML to extract field names, types, option sets, and relationships
- Replace TODO comments in skeleton factories with actual field definitions
- Create TypeScript interfaces with proper types
- Generate option set enums from metadata
- Add OData binding for lookup fields
- Update the demo test if needed

Please read `FACTORY_GENERATION_PROGRESS.md` first for complete context, then proceed with generating the factories.

---

## Alternative Short Version

Hi! Please:
1. Read `FACTORY_GENERATION_PROGRESS.md` for full context
2. Read XML files from `power_platform/solutions/playwright_test/Entities/account/` and `/contact/`
3. Generate complete factories in `tests/data/factories/`

Working dir: `/home/james/Repos/playwright-d365-framework-demo`
