# Negosyo Startup Calculator PH

Enter a selling price, cost per sale and monthly fixed bills for one offering. The quick estimate rounds the break-even volume up to whole sales. Use these figures in a plan carries them into editable product and expense rows. Open detailed planner resumes the current plan.

Open `/tools/business-startup-calculator/` from Free Tools or the public Ventures listings. The route is registered in `src/config/tool-ventures.ts`. Templates, copy and formulas ship with the website. No Firestore documents, admin editors, tax data feeds or supplier integrations are used.

## Planning workflow

Select a template, enter available owner capital and review the operating-day assumption. Open checklist rows to enter local quotes, mark required items and exclude purchases you already own. Review fixed bills and select a variable cost method. Enter each offering's price, volume and sales period. The forecast step changes volume and variable cost assumptions for conservative and optimistic cases. Confirm cash assumptions before reading payback or runway.

## Calculation conventions

- Prices are parsed as integer centavos. The model multiplies scaled integer quantities, prices and scenario percentages and rounds each line to the nearest centavo. Weekly estimates use 52/12 and annual amounts use 1/12.
- Unit-cost mode includes product costs and fees. Shared-budget mode replaces them with variable operating expenses, scaled by scenario volume and cost rate. The allocation to products uses revenue share. Fixed bills stay constant.
- Operating break-even uses fixed expenses divided by weighted contribution margin. Only a single offering gets a whole-unit target. Nonpositive contribution produces no target. Missing required inputs identify a partial report.
- Opening cash equals available owner funds plus loan proceeds less included startup purchases and deposits. The monthly reserve is the greatest cumulative end-of-month cash deficit within the selected reserve period. Contingency applies once to startup cash costs. Neither buffer is a launch expense.
- The first month receives only the immediate share of sales. Later months collect both current receipts and the prior deferred share. Outflows include operating costs, other entered cash outflows and principal repayments capped by remaining debt. Stock replenishment equals consumption. The model holds deposits through the horizon. Interest, taxes and withdrawals require explicit inputs.
- Payback is the first month cumulative net cash covers the opening owner outlay. Runway counts full months before available closing cash turns negative. The horizon is 120 months and the printable report includes the first 12. This is a steady-state, monthly forecast.

## Storage, backup and review

Up to 12 plans are stored in browser local storage under `negosyo-plans-v1`. Export JSON before clearing browser data. Imports validate the version, row types, IDs, field lengths, numeric ranges and scenario structure before adding a separate plan. If local saving fails, export the open plan. The print action opens the browser's native print dialog. The PDF option depends on the browser or operating system.

Run `node --test tests/negosyo.test.cjs`, the admin documentation tests, TypeScript, the static build and the export SEO audit. Check editing on a narrow viewport, JSON round trips, restore after reload, and the printed report after any form or model change.
