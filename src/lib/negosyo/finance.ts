import { costClasses, decimal, type Plan, type Expense, type Scenario } from "./plan";

export function cents(value: string) {
  if (!decimal(value) || !value) return 0;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
// Multiply integer factors before rounding to a centavo or whole unit.
function divideProduct(factors: number[], denominator: number, roundUp = false) {
  const divisor = BigInt(denominator);
  const numerator = factors.reduce((value, factor) => value * BigInt(factor), BigInt(1));
  return Number((numerator + (roundUp ? divisor - BigInt(1) : divisor / BigInt(2))) / divisor);
}
export const startupLine = (quantity: string, price: string) => divideProduct([cents(quantity), cents(price)], 100);
const amount = (v: string) => decimal(v) ? Number(v) : 0;
const currency = new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"});
export const peso = (v: number | null) => v === null ? "—" : currency.format(v/100);
export const percent = (v: number | null) => v === null ? "—" : (v*100).toFixed(1)+"%";
export function monthly(e: Expense) {
  const cost = cents(e.cost);
  return divideProduct([cost, e.frequency === "weekly" ? 52 : 1], e.frequency === "monthly" ? 1 : 12);
}
export function forecast(p: Plan, scenario: Scenario) {
  const costFactor = amount(scenario.cost)/100;
  const fixed = p.expenses.filter(e=>e.category==="Fixed").reduce((s,e)=>s+monthly(e),0);
  const budget = p.basis === "budget" ? p.expenses.filter(e=>e.category==="Variable").reduce((s,e)=>s+monthly(e),0) : 0;
  const products = p.products.map(item=>{
    const periods = item.period==="day" ? Math.trunc(amount(p.days)) : item.period==="week" ? 52 : 1;
    const denominator = 100 * 10000 * (item.period==="week" ? 12 : 1);
    const factors = [cents(item.units), periods, cents(scenario.volume)];
    const units = factors.reduce((value,n)=>value*n,1)/denominator;
    const price = cents(item.price);
    const unitCost = (cents(item.cost)+cents(item.extra))*costFactor;
    return {name:item.name,units,price,unitCost, revenue:divideProduct([...factors,price],denominator), variable:divideProduct([...factors,cents(item.cost)+cents(item.extra),cents(scenario.cost)],denominator*10000), hours:units*amount(item.hours)};
  });
  const revenue = products.reduce((s,i)=>s+i.revenue,0);
  const variable = p.basis==="budget" ? divideProduct([budget,cents(scenario.cost),cents(scenario.volume)],100000000) : products.reduce((s,i)=>s+i.variable,0);
  // Allocate the pooled budget by sales value. Cumulative rounding reconciles the lines.
  let cumulativeRevenue = 0, allocated = 0;
  for (const item of products) if (p.basis==="budget") {
    cumulativeRevenue += item.revenue;
    const total = revenue ? divideProduct([variable,cumulativeRevenue],revenue) : 0;
    item.variable = total-allocated; allocated=total;
    item.unitCost = item.units ? item.variable/item.units : 0;
  }
  const contribution = revenue-variable, profit = contribution-fixed;
  const only = products.length===1 ? products[0] : undefined;
  const unitMargin = only && (p.basis==="unit" || only.units>0) ? only.price-only.unitCost : null;
  const ratio = revenue>0 ? contribution/revenue : only && only.price>0 && unitMargin!==null ? unitMargin/only.price : null;
  const breakRevenue = ratio!==null && ratio>0
    ? (revenue ? divideProduct([fixed,revenue],contribution,true) : Math.ceil(fixed / ratio)) : null;
  const breakUnits = only && only.price>0 && unitMargin!==null && unitMargin>0 ? Math.ceil(fixed/unitMargin) : null;
  return {name:scenario.name,products,revenue,variable,fixed,contribution,ratio,profit, margin:revenue?profit/revenue:null,breakRevenue,breakUnits,hours:products.reduce((s,i)=>s+i.hours,0)};
}
export function analyse(p: Plan) {
  const included=p.startup.filter(i=>i.included);
  const allocation=costClasses.map(category=>({category,total:included.filter(i=>i.category===category).reduce((s,i)=>s+startupLine(i.quantity,i.price),0)}));
  const startup=allocation.reduce((s,i)=>s+i.total,0);
  const scenarios=p.scenarios.map(s=>forecast(p,s)), expected=scenarios[1];
  const capital=cents(p.capital), loan=cents(p.loan);
  const delayed=Math.round(expected.revenue*amount(p.deferred)/100);
  const contingency=Math.round(startup*amount(p.contingency)/100);
  const reserveWindow=amount(p.reserveMonths);
  let debt=loan, cumulative=0, reserve=0, payback:number|null=null, runway:number|null=null;
  const equity=Math.max(0,startup-loan);
  let openingCash=capital+loan-startup;
  if (openingCash<0) runway=0;
  const cash=[];
  for(let month=1;month<=120;month++) {
    const receipts=expected.revenue-(month===1?delayed:0);
    const principal=Math.min(debt,cents(p.principal));
    debt-=principal;
    const outflows=expected.fixed+expected.variable+cents(p.cashOut)+principal;
    const net=receipts-outflows;
    cumulative+=net;
    if(month<=reserveWindow) reserve=Math.max(reserve,-cumulative);
    if(payback===null && equity>0 && cumulative>=equity) payback=month;
    if(runway===null && openingCash+net<0) runway=month-1;
    openingCash+=net;
    cash.push({month,receipts,outflows,net,cumulative,closing:openingCash});
  }
  const funding=startup+reserve+contingency, gap=capital+loan-funding;
  const missing:string[]=[];
  if(!p.capital) missing.push("Enter available capital. Enter 0 if you have none.");
  if(!p.days || +p.days<=0) missing.push("Enter operating days between 1 and 31.");
  if(included.some(i=>!i.name.trim() || !i.price || !i.quantity || +i.quantity<=0)) missing.push("Give each included startup item a name, positive quantity and price, or exclude it.");
  if(p.expenses.some(e=>(e.category==="Fixed" || p.basis==="budget") && (!e.name.trim() || !e.cost))) missing.push("Complete the names and amounts of active expense rows.");
  if(!p.products.length || p.products.some(i=>!i.name.trim() || !i.price || !i.units || (p.basis==="unit" && !i.cost))) missing.push("Enter a name, price, sales volume and applicable unit cost for each offering. Enter 0 for a known zero.");
  if(p.basis==="budget" && expected.variable>0 && !expected.revenue) missing.push("A shared variable budget needs expected sales revenue to establish the sales mix.");
  if([p.reserveMonths,p.contingency,p.deferred,p.loan,p.principal,p.cashOut].some(v=>v==="") || p.scenarios.some(s=>s.volume===""||s.cost==="")) missing.push("Complete the forecast assumptions, using 0 for any amount that does not apply.");
  if(!Number.isSafeInteger(startup) || !Number.isSafeInteger(funding) || scenarios.some(s=>[s.revenue,s.variable,s.fixed,s.profit].some(n=>!Number.isSafeInteger(n))) || cash.some(c=>!Number.isSafeInteger(c.closing))) missing.push("The combined amounts exceed the calculator's centavo precision. Reduce the planning scale.");
  const warnings:string[]=[];
  if(!missing.length) {
    if(gap<0) warnings.push("Funding shortfall. Review startup spending, financing or the reserve period.");
    if(expected.breakRevenue===null) warnings.push("Break-even is unavailable until the sales mix has a positive contribution margin.");
    if(expected.contribution>0 && expected.fixed>expected.contribution) warnings.push("Monthly fixed costs exceed the contribution left from sales.");
    if(expected.profit<=0 && scenarios[2].profit>0) warnings.push("Only stronger sales or lower unit costs turn this plan profitable in the optimistic case.");
    if(p.capacity && scenarios.some(s=>s.hours>+p.capacity)) warnings.push("At least one scenario needs more service hours than the monthly capacity entered.");
    if(expected.contribution>0 && scenarios[0].revenue>0 && scenarios[0].contribution<=0) warnings.push("The conservative cost assumption consumes all contribution. Review pricing and unit costs.");
    if(expected.products.some(i=>i.revenue<i.variable)) warnings.push("At least one offering costs more to deliver than it earns.");
    if(loan>0 && cents(p.principal)===0) warnings.push("The loan remains outstanding throughout the projection. Enter repayments if due.");
  }
  return {startup,allocation,scenarios,expected,capital,loan,equity,contingency,reserve,funding,gap,cash,missing,warnings,
    payback:!missing.length && p.confirmCash ? payback : null,runway};
}
export type Analysis = ReturnType<typeof analyse>;
