"use client";

import { useEffect, useRef, useState } from "react";
import { blankExpense, blankProduct, decimal, newPlan, templates, validPlan, type Plan } from "@/lib/negosyo/plan";
import { analyse, cents, peso } from "@/lib/negosyo/finance";
import { Expenses, Field, Products, StartupRows, uid, type EditorProps } from "./editors";
import { Metric, Report, Scenarios } from "./report";

const steps=["Business","Startup checklist","Operating expenses","Products & services","Sales forecast","Feasibility report"];
const storageKey="negosyo-plans-v1";
type Saved = {id:string;step:number;plan:Plan};
const emptyEstimate = {price:"",cost:"",bills:""};
type Workspace = {active:string;plans:Saved[];quick?:boolean;estimate?:typeof emptyEstimate};
function initial(): Workspace {return {quick:true,active:"first",plans:[{id:"first",step:0,plan:newPlan()}]};}
function readWorkspace(raw:string):Workspace {
  const w=JSON.parse(raw);
  if(!w || !Array.isArray(w.plans) || !w.plans.length || w.plans.length>12 || !w.plans.every((s:Saved)=>s && typeof s.id==="string" && Number.isInteger(s.step) && s.step>=0 && s.step<steps.length && validPlan(s.plan)) || new Set(w.plans.map((s:Saved)=>s.id)).size!==w.plans.length || !w.plans.some((s:Saved)=>s.id===w.active)) throw Error("Invalid workspace");
  if(!w.estimate || !Object.keys(emptyEstimate).every(key=>decimal(w.estimate[key]))) w.estimate = emptyEstimate;
  return w;
}
function Forecast({plan,update}:EditorProps) {
  return <><p>Compare hypothetical trading months. Change sales or pricing in Products and bills in Operating expenses. All three scenarios recalculate immediately.</p>
    <div className="ng-grid"><Field numeric max={31} whole label="Operating days per month" value={plan.days} change={days=>update({days})}/>
    {plan.scenarios.filter(s=>s.name!=="Expected").map(s=><fieldset key={s.name}><legend>{s.name}</legend>
      {(["volume","cost"] as const).map(k=><Field key={k} numeric max={300} label={k==="volume"?"Sales volume (% of expected)":"Variable cost rate (% of expected)"} value={s[k]} change={v=>update({scenarios:plan.scenarios.map(row=>row.name===s.name?{...row,[k]:v}:row)})}/>)}</fieldset>)}</div>
    <h3>Opening cash and payment timing</h3><p>Use 0 for assumptions that do not apply. These assumptions affect funding and cash recovery separately from operating profit.</p>
    <div className="ng-grid"><Field numeric whole max={24} label="Cash reserve period (months)" value={plan.reserveMonths} change={reserveMonths=>update({reserveMonths})}/>
      <Field numeric max={100} label="Startup contingency (%)" value={plan.contingency} change={contingency=>update({contingency})}/>
      <Field numeric max={100} label="Sales collected next month (%)" value={plan.deferred} change={deferred=>update({deferred})}/>
      <Field numeric label="Opening loan proceeds (PHP)" value={plan.loan} change={loan=>update({loan})}/>
      <Field numeric label="Monthly loan principal repayment (PHP)" value={plan.principal} change={principal=>update({principal})}/>
      <Field numeric label="Other monthly cash outflows, e.g. withdrawals (PHP)" value={plan.cashOut} change={cashOut=>update({cashOut})}/>
    </div><label className="ng-confirm"><input type="checkbox" checked={plan.confirmCash} onChange={e=>update({confirmCash:e.target.checked})}/> I have reviewed collection timing, loan payments and other cash outflows for the payback estimate.</label></>;
}

export function NegosyoCalculator() {
  const [work,setWork]=useState<Workspace>(initial),[ready,setReady]=useState(false);
  const [message,setMessage]=useState(""),[storageError,setStorageError]=useState("");
  const [blocked,setBlocked]=useState(false);
  const input=useRef<HTMLInputElement>(null), heading=useRef<HTMLHeadingElement>(null);
  const current=work.plans.find(s=>s.id===work.active)!, {plan,step}=current;
  const result=analyse(plan);
  useEffect(()=>{
    try {const raw=localStorage.getItem(storageKey);if(raw)setWork(readWorkspace(raw));}
    catch {setBlocked(true);setStorageError("The browser could not restore this workspace. Export any new plan as JSON. You can explicitly replace the local workspace below.");}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready || blocked)return;
    try {localStorage.setItem(storageKey,JSON.stringify(work));setStorageError("");}
    catch {setStorageError("Local saving is unavailable or storage is full. Export a JSON backup before leaving.");}
  },[work,ready,blocked]);
  function changeCurrent(patch:Partial<Saved>){setWork(w=>({...w,plans:w.plans.map(s=>s.id===w.active?{...s,...patch}:s)}));}
  function update(patch:Partial<Plan>){changeCurrent({plan:{...plan,...patch}});}
  function navigate(n:number){changeCurrent({step:n});requestAnimationFrame(()=>heading.current?.focus());}
  function add(p:Plan) {
    if(work.plans.length>=12){setMessage("This browser holds up to 12 plans. Export and remove a plan first.");return;}
    const id=uid();setWork(w=>({...w,active:id,plans:[...w.plans,{id,plan:p,step:0}]}));
  }
  function template(type:string){
    if(type===plan.type)return;
    if((plan.startup.length || plan.expenses.length || plan.products.length) && !window.confirm("Replace this plan’s checklist, recurring expenses and offerings with the selected template?"))return;
    const next=newPlan(type);update({type,startup:next.startup,expenses:next.expenses,products:next.products,confirmCash:false});
  }
  function download(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="negosyo-business-plan.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importPlan(file?:File) {
    if(!file)return;
    try {
      if(file.size>2000000)throw Error();
      const data:unknown=JSON.parse(await file.text());if(!validPlan(data))throw Error();
      add(data);if(work.plans.length<12)setMessage("Imported as a separate local plan.");
    }catch{setMessage("Import failed. Choose a valid Negosyo v1 JSON export under 2 MB. Your current plan is safe.");}
    if(input.current)input.current.value="";
  }
  const estimate = work.estimate ?? emptyEstimate;
  const margin = cents(estimate.price) - cents(estimate.cost);
  const complete = Object.values(estimate).every(value=>value !== "");
  function openEstimatePlan() {
    const next = newPlan();
    next.products = [{...blankProduct("quick-offer","Main product or service"),price:estimate.price,cost:estimate.cost}];
    next.expenses = [{...blankExpense("quick-bills","Monthly fixed bills"),cost:estimate.bills}];
    if(JSON.stringify(plan) === JSON.stringify(newPlan())) changeCurrent({plan:next,step:3});
    else {
      if(work.plans.length >= 12){setMessage("All 12 plan slots are in use. Open the detailed planner to manage them.");return;}
      const id=uid();
      setWork(w=>({...w,active:id,plans:[...w.plans,{id,plan:next,step:3}]}));
    }
    setWork(w=>({...w,quick:false}));
  }
  if(work.quick) return <div className="ng-app"><section className="ng-panel ng-form-flow">
    <h2>Quick break-even estimate</h2>
    <p>How many sales will cover your monthly bills? Start with one product or service.</p>
    <div className="ng-grid">{([["price","Selling price per sale (PHP)"],["cost","Cost to make one sale (PHP)"],["bills","Fixed bills per month (PHP)"]] as const).map(([key,label])=><Field key={key} numeric label={label} value={estimate[key]} change={value=>setWork(w=>({...w,estimate:{...w.estimate ?? emptyEstimate,[key]:value}}))}/>)}</div>
    <div className="ng-quick-result" role="status">{!complete ? "Enter all three amounts to see your monthly sales target." : margin <= 0 ? "Your price needs to exceed the cost per sale to contribute toward monthly bills." : <><strong>{Math.ceil(cents(estimate.bills)/margin).toLocaleString("en-PH")} sales per month</strong><span>Each sale contributes {peso(margin)} toward fixed bills.</span></>}</div>
    <div className="ng-actions">{complete && <button className="ng-primary" disabled={!ready} onClick={openEstimatePlan}>Use these figures in a plan</button>}<button disabled={!ready} onClick={()=>setWork(w=>({...w,quick:false}))}>Open detailed planner</button></div>
    {(message || storageError) && <p role="status">{message} {storageError}</p>}
  </section></div>;
  const editor={plan,update};
  return <div className="ng-app">
    <div className="ng-workspace ng-screen"><label>Local plan <select disabled={!ready} value={work.active} onChange={e=>setWork({...work,active:e.target.value})}>{work.plans.map((s,i)=><option key={s.id} value={s.id}>{s.plan.name || s.plan.type} · {i+1}</option>)}</select></label>
      <button onClick={()=>setWork(w=>({...w,quick:true}))}>Quick estimate</button>
      <button disabled={!ready} onClick={()=>add(newPlan())}>New plan</button>
      <details><summary>Manage plans</summary><div className="ng-actions">
        <button onClick={download}>Export JSON</button><button disabled={!ready} onClick={()=>input.current?.click()}>Import JSON</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e=>void importPlan(e.target.files?.[0])}/>
        <button disabled={!ready} onClick={()=>{if(confirm("Reset this plan to a blank custom business?"))changeCurrent({plan:newPlan(),step:0});}}>Reset current plan</button>
        {work.plans.length>1 && <button onClick={()=>{if(confirm("Delete this local plan? Export a backup first if you need it.")){const plans=work.plans.filter(s=>s.id!==work.active);setWork({...work,plans,active:plans[0].id});}}}>Delete current plan</button>}
      </div><p>Plans stay in this browser. Clearing site storage removes them. Keep JSON backups for another browser or device.</p></details>
    </div>
    <div className="ng-screen" role="status">{message}{storageError && <p>{storageError}</p>}{blocked && <button onClick={()=>{if(confirm("Allow this workspace to replace previously saved local data?"))setBlocked(false);}}>Enable local saving</button>}</div>
    <nav className="ng-steps ng-screen" aria-label="Planner steps">{steps.map((label,i)=><button key={label} aria-current={i===step?"step":undefined} onClick={()=>navigate(i)}><span>{i+1}</span>{label}</button>)}</nav>
    <div className={step===5?"ng-layout ng-final":"ng-layout"}>
      <section className="ng-panel ng-screen">
        <p className="eyebrow">Step {step+1} of 6</p><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
        <div className="ng-form-flow">
        {step===0 && <><p>Start with your business type. Each template prepares an editable checklist with blank prices for your own quotes.</p>
          <fieldset><legend>Business type</legend><div className="ng-templates">{templates.map(t=><label key={t.name}><input type="radio" name="business-type" checked={plan.type===t.name} onChange={()=>template(t.name)}/><span aria-hidden="true">{t.icon}</span>{t.name}</label>)}</div></fieldset>
          <div className="ng-grid"><Field label="Business name (optional)" value={plan.name} change={name=>update({name})}/><Field label="Location (optional)" value={plan.location} change={location=>update({location})}/>
          <Field numeric label="Available owner capital (PHP)" value={plan.capital} change={capital=>update({capital})}/><Field numeric whole max={31} label="Operating days per month" value={plan.days} change={days=>update({days})}/></div>
          <Field label="Business description (optional)" value={plan.description} change={description=>update({description})}/></>}
        {step===1 && <StartupRows {...editor}/>}
        {step===2 && <Expenses {...editor}/>}
        {step===3 && <Products {...editor}/>}
        {step===4 && <><Forecast {...editor}/><Scenarios result={result}/></>}
        {step===5 && <><p>Review the assumptions, then print the report or download an editable copy.</p><div className="ng-actions"><button className="ng-primary" onClick={()=>window.print()}>Print / Save as PDF</button><button onClick={download}>Export plan as JSON</button></div></>}
        </div>
        <div className="ng-actions ng-paging">{step>0 && <button onClick={()=>navigate(step-1)}>Back</button>}{step<5 && <button className="ng-primary" onClick={()=>navigate(step+1)}>Continue to {steps[step+1]}</button>}</div>
      </section>
      {step<5 && <aside className="ng-aside ng-screen"><h2>Plan at a glance</h2><p>{result.missing.length?"Partial totals · complete your inputs":"Expected monthly scenario"}</p>
        <Metric label="Owner capital" value={peso(result.capital)}/><Metric label="Launch spending" value={peso(result.startup)}/><Metric label="Monthly revenue" value={peso(result.expected.revenue)}/><Metric label="Monthly operating result" value={peso(result.expected.profit)}/>
        <button onClick={()=>navigate(5)}>Review full report →</button></aside>}
    </div>
    <div className={step===5?"ng-output":"ng-output ng-print-only"}><Report plan={plan} result={result}/></div>
  </div>;
}
