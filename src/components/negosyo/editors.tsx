import type { ReactNode } from "react";
import { costClasses, frequencies, salesPeriods, type Plan, type Startup, type Product, type Expense, blankStartup, blankProduct, blankExpense, limit, decimal } from "@/lib/negosyo/plan";
import { cents, startupLine, monthly, peso } from "@/lib/negosyo/finance";
import { useState } from "react";

export const uid = () => crypto.randomUUID();
type FieldProps = { label:string; value:string; change:(v:string)=>void; numeric?:boolean; max?:number; whole?:boolean };
export function Field({label,value,change,numeric=false,max=100000000,whole=false}:FieldProps) {
  const [error,setError]=useState("");
  return <label className="ng-field"><span>{label}</span><input value={value} maxLength={numeric?14:1000} inputMode={numeric?"decimal":"text"} onChange={e=>{
    const next=e.target.value;
    if(numeric && (!decimal(next,max) || (whole && !Number.isInteger(Number(next))))) {
      setError(`Use a number from 0 to ${max.toLocaleString("en-PH")}${whole?" in whole units":" with up to two decimal places"}.`);return;
    }
    setError("");change(next);
  }}/>{error && <small role="alert">{error}</small>}</label>;
}
export function Choice<T extends string>({label,value,options,change}:{label:string;value:T;options:readonly T[];change:(v:T)=>void}) {
  return <label className="ng-field"><span>{label}</span><select value={value} onChange={e=>change(e.target.value as T)}>{options.map(v=><option key={v}>{v}</option>)}</select></label>;
}
export type EditorProps = {plan:Plan; update:(patch:Partial<Plan>)=>void};
function Row({title,summary,children,remove}:{title:string;summary:string;children:ReactNode;remove:()=>void}) {
  return <details className="ng-row"><summary><strong>{title || "Untitled item"}</strong><span>{summary}</span></summary><div className="ng-grid">{children}</div><button type="button" onClick={remove}>Remove row</button></details>;
}
export function StartupRows({plan,update}:EditorProps) {
  function edit(id:string,patch:Partial<Startup>){ update({startup:plan.startup.map(r=>r.id===id?{...r,...patch}:r)}); }
  return <><p>Open a row to enter a quote or change its details. Optional items count towards funding when included.</p>
    {costClasses.map(category=>{
      const items=plan.startup.filter(i=>i.category===category);
      return items.length>0 && <section key={category}><h3>{category}</h3>{items.map(r=><div className="ng-checkrow" key={r.id}>
        <label><input type="checkbox" checked={r.included} aria-label={`Include ${r.name || "startup item"}`} onChange={e=>edit(r.id,{included:e.target.checked})}/></label>
        <Row title={r.name} summary={!r.included?"Excluded":r.price && r.quantity?peso(startupLine(r.quantity,r.price)):"Add estimate"} remove={()=>update({startup:plan.startup.filter(i=>i.id!==r.id)})}>
          <Field label="Item name" value={r.name} change={name=>edit(r.id,{name})}/><Choice label="Cost classification" value={r.category} options={costClasses} change={category=>edit(r.id,{category})}/>
          <Field numeric max={100000} label="Quantity" value={r.quantity} change={quantity=>edit(r.id,{quantity})}/><Field numeric label="Price per unit (PHP)" value={r.price} change={price=>edit(r.id,{price})}/>
          <Field label="Notes" value={r.notes} change={notes=>edit(r.id,{notes})}/><label><input type="checkbox" checked={r.required} onChange={e=>edit(r.id,{required:e.target.checked})}/> Required for my launch</label>
        </Row></div>)}</section>;
    })}<button disabled={plan.startup.length>=limit} onClick={()=>update({startup:[...plan.startup,blankStartup(uid())]})}>+ Add startup item</button>
    <p className="ng-note">Suggested requirements and sample costs are for planning purposes only. Actual expenses vary by location, supplier, and business requirements.</p></>;
}
export function Expenses({plan,update}:EditorProps) {
  function edit(id:string,patch:Partial<Expense>){update({expenses:plan.expenses.map(r=>r.id===id?{...r,...patch}:r)});}
  return <><p>Choose one way to count variable costs. Include rent, owner pay and other fixed bills whichever method you use.</p>
    <label className="ng-field"><span>Variable cost method</span><select value={plan.basis} onChange={e=>update({basis:e.target.value as Plan["basis"]})}><option value="unit">Costs entered per product or service</option><option value="budget">Shared variable expense budget at expected sales</option></select></label>
    <p className="ng-note">{plan.basis==="unit"?"Only fixed expense rows count here. Enter materials, packaging and fees per unit in Products.":"Only the variable budget counts. Per-unit cost inputs are ignored. This budget scales with volume and is allocated by revenue share."} Weekly × 52 ÷ 12 and annual ÷ 12 give monthly equivalents.</p>
    {plan.expenses.map(r=><Row key={r.id} title={r.name} summary={r.category==="Variable" && plan.basis==="unit"?"Excluded by method":r.cost?peso(monthly(r))+" / month":"Add estimate"} remove={()=>update({expenses:plan.expenses.filter(i=>i.id!==r.id)})}>
      <Field label="Expense name" value={r.name} change={name=>edit(r.id,{name})}/><Choice label="Classification" value={r.category} options={["Fixed","Variable"]} change={category=>edit(r.id,{category})}/>
      <Field numeric label="Cost per period (PHP)" value={r.cost} change={cost=>edit(r.id,{cost})}/><Choice label="Frequency" value={r.frequency} options={frequencies} change={frequency=>edit(r.id,{frequency})}/><Field label="Notes" value={r.notes} change={notes=>edit(r.id,{notes})}/>
    </Row>)}<button disabled={plan.expenses.length>=limit} onClick={()=>update({expenses:[...plan.expenses,blankExpense(uid())]})}>+ Add expense</button></>;
}
export function Products({plan,update}:EditorProps) {
  function edit(id:string,patch:Partial<Product>){update({products:plan.products.map(r=>r.id===id?{...r,...patch}:r)});}
  return <><p>Enter the price you charge and how many units or bookings you expect. Use one row for each distinct offering.</p>
    {plan.products.map(r=><Row key={r.id} title={r.name} summary={r.price?peso(cents(r.price))+" / unit":"Add price"} remove={()=>update({products:plan.products.filter(i=>i.id!==r.id)})}>
      <Field label="Product or service" value={r.name} change={name=>edit(r.id,{name})}/><Field numeric label="Selling price (PHP)" value={r.price} change={price=>edit(r.id,{price})}/>
      {plan.basis==="unit" && <><Field numeric label="Variable cost per unit (PHP)" value={r.cost} change={cost=>edit(r.id,{cost})}/><Field numeric label="Additional fee per unit (PHP)" value={r.extra} change={extra=>edit(r.id,{extra})}/></>}
      <Field numeric max={100000} label="Expected units sold" value={r.units} change={units=>edit(r.id,{units})}/><Choice label="Sales period" value={r.period} options={salesPeriods} change={period=>edit(r.id,{period})}/>
      <Field numeric max={1000} label="Service hours per unit (optional)" value={r.hours} change={hours=>edit(r.id,{hours})}/>
    </Row>)}<button disabled={plan.products.length>=limit} onClick={()=>update({products:[...plan.products,blankProduct(uid())]})}>+ Add product or service</button>
    <Field numeric label="Available service hours per month (optional)" value={plan.capacity} change={capacity=>update({capacity})}/></>;
}
