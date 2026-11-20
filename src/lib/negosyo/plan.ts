export const costClasses = ["Equipment and fixtures", "Initial inventory", "Pre-opening expenses", "Refundable deposits", "Other one-time costs"] as const;
export type CostClass = typeof costClasses[number];
export const frequencies = ["monthly", "weekly", "annual"] as const;
export const salesPeriods = ["day", "week", "month"] as const;
export type Startup = { id: string; name: string; category: CostClass; quantity: string; price: string; included: boolean; required: boolean; notes: string };
export type Expense = { id: string; name: string; cost: string; frequency: typeof frequencies[number]; category: "Fixed" | "Variable"; notes: string };
export type Product = { id: string; name: string; price: string; cost: string; extra: string; units: string; period: typeof salesPeriods[number]; hours: string };
export type Scenario = { name: string; volume: string; cost: string };
export type Plan = {
  version: 1; type: string; name: string; location: string; description: string; capital: string; days: string;
  startup: Startup[]; expenses: Expense[]; products: Product[]; scenarios: Scenario[];
  basis: "unit" | "budget"; reserveMonths: string; contingency: string; deferred: string; loan: string;
  principal: string; cashOut: string; capacity: string; confirmCash: boolean;
};
type Template = { name: string; icon: string; equipment: string[]; stock: string[]; expenses: string[]; products: string[] };
function business(name: string, icon: string, equipment: string, stock: string, expenses: string, products: string): Template {
  const list = (v: string) => v ? v.split("|") : [];
  return { name, icon, equipment: list(equipment), stock: list(stock), expenses: list(expenses), products: list(products) };
}
export const templates = [
  business("Coffee Shop", "☕", "Espresso machine|Grinder|Refrigerator|Water filter|Counter and furniture|Scales and pitchers", "Coffee beans|Milk and syrups|Cups and lids", "Rent|Wages and owner compensation|Utilities|Equipment maintenance", "Iced coffee|Hot coffee"),
  business("Food Stall or Small Restaurant", "🍲", "Stove and cookware|Cold storage|Prep counter|Serving utensils", "Ingredients|Takeaway containers", "Stall rental|Staff|Cooking fuel and electricity", "Rice meal"),
  business("Sari-Sari Store", "🏪", "Shelves|Counter and cash box|Refrigerator", "Packaged goods|Beverages|Bags", "Electricity|Rent|Storekeeper pay", "Packaged snack|Bottled drink"),
  business("Laundry Shop", "🧺", "Washers|Dryers|Plumbing and electrical installation|Baskets and folding table", "Detergent|Fabric conditioner", "Water and electricity|Rent|Repair allowance|Attendant pay", "Wash and fold"),
  business("Barber Shop or Salon", "✂️", "Styling chairs|Mirrors|Clippers and scissors|Sanitation equipment", "Shampoo|Blades and towels", "Rent|Staff|Utilities", "Haircut"),
  business("Car Wash", "🚗", "Pressure washer|Vacuum|Hoses and drainage", "Cleaning solutions|Microfibre cloths", "Water|Rent|Staff", "Basic wash"),
  business("Online Selling Business", "📦", "Packing table|Weighing scale|Lighting", "Merchandise|Mailers and labels", "Internet|Marketing|Software subscriptions", "Online order"),
  business("Printing and Photocopy Business", "🖨️", "Printer and copier|Computer|Paper cutter", "Paper|Ink and toner", "Rent|Electricity|Printer maintenance", "Printed page|Photocopy"),
  business("Aircon Cleaning and Repair Service", "❄️", "Cleaning pump|Test instruments|Ladder and safety gear", "Cleaning solution|Spare parts", "Transport|Technician pay|Tool maintenance", "Basic cleaning|Repair visit"),
  business("Freelance or Professional Services", "💻", "Computer|Monitor|Work desk", "Office supplies", "Internet|Software subscriptions|Owner compensation", "Consultation"),
  business("Custom Business", "✎", "", "", "", ""),
];
export const blankStartup = (id: string, name = "", category: CostClass = costClasses[0]): Startup =>
  ({ id, name, category, quantity: "1", price: "", included: true, required: false, notes: "" });
export const blankExpense = (id: string, name = ""): Expense => ({ id, name, cost: "", frequency: "monthly", category: "Fixed", notes: "" });
export const blankProduct = (id: string, name = ""): Product => ({ id, name, price: "", cost: "", extra: "0", units: "", period: "day", hours: "" });
export function newPlan(type = "Custom Business"): Plan {
  const t = templates.find(t => t.name === type) ?? templates[templates.length-1];
  const setup = t.equipment.length ? [
    blankStartup("pre", "Registration, permits and opening materials", "Pre-opening expenses"),
    blankStartup("deposit", "Refundable rental or utility deposit", "Refundable deposits"),
  ] : [];
  return {
    version: 1, type: t.name, name: "", location: "", description: "", days: "26", capital: "",
    startup: [...t.equipment.map((v,i) => blankStartup("eq"+i,v)), ...t.stock.map((v,i) => blankStartup("stock"+i,v,"Initial inventory")), ...setup],
    expenses: t.expenses.map((v,i) => blankExpense("exp"+i,v)), products: t.products.map((v,i) => blankProduct("item"+i,v)),
    scenarios: [{ name: "Conservative", volume: "75", cost: "110" }, { name: "Expected", volume: "100", cost: "100" }, { name: "Optimistic", volume: "125", cost: "100" }],
    basis: "unit", reserveMonths: "3", contingency: "0", deferred: "0", loan: "0", principal: "0", cashOut: "0", capacity: "", confirmCash: false,
  };
}

export const limit = 100;
export const decimal = (v: unknown, max = 100000000) => typeof v === "string" && (v === "" || (/^\d{1,9}(?:\.\d{0,2})?$/.test(v) && Number(v) <= max));
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) => typeof v === "string" && v.length <= 1000;
const member = (v: unknown, values: readonly string[]) => typeof v === "string" && values.includes(v);
function rows(v: unknown, check: (r: Record<string, unknown>) => boolean) {
  return Array.isArray(v) && v.length <= limit && v.every(r => record(r) && typeof r.id === "string" && /^[\w-]{1,80}$/.test(r.id) && text(r.name) && check(r)) && new Set(v.map(r => r.id)).size === v.length;
}
export function validPlan(p: unknown): p is Plan {
  if (!record(p) || p.version !== 1 || !templates.some(t => t.name === p.type)) return false;
  return [p.name,p.location,p.description].every(text) && [p.capital,p.loan,p.principal,p.cashOut,p.capacity].every(v => decimal(v))
    && decimal(p.days,31) && Number.isInteger(Number(p.days)) && decimal(p.reserveMonths,24) && Number.isInteger(Number(p.reserveMonths)) && decimal(p.deferred,100) && decimal(p.contingency,100)
    && member(p.basis,["unit","budget"]) && typeof p.confirmCash === "boolean"
    && rows(p.startup, r => member(r.category,costClasses) && decimal(r.price) && decimal(r.quantity,100000) && text(r.notes) && typeof r.included === "boolean" && typeof r.required === "boolean")
    && rows(p.expenses,r => member(r.category,["Fixed","Variable"]) && member(r.frequency,frequencies) && decimal(r.cost) && text(r.notes))
    && rows(p.products,r => member(r.period,salesPeriods) && [r.cost,r.extra,r.price].every(v=>decimal(v)) && decimal(r.units,100000) && decimal(r.hours,1000))
    && Array.isArray(p.scenarios) && p.scenarios.length === 3 && p.scenarios.every((s,i) => record(s) && s.name === ["Conservative","Expected","Optimistic"][i] && decimal(s.volume,300) && decimal(s.cost,300) && (i !== 1 || (Number(s.volume)===100 && Number(s.cost)===100)));
}
