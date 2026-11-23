import type { ReactNode } from "react";
import { cents, startupLine, monthly, percent, peso, type Analysis } from "@/lib/negosyo/finance";
import type { Plan } from "@/lib/negosyo/plan";

export function Metric({label,value}:{label:string;value:string}) {
  return <div className="ng-metric"><span>{label}</span><strong>{value}</strong></div>;
}
function Table({title,heads,rows}:{title:string;heads:string[];rows:ReactNode[][]}) {
  return <div className="ng-table" tabIndex={0} role="region" aria-label={title}><table><caption>{title}</caption><thead><tr>{heads.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={i}>{r.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
const number=(n:number)=>n.toLocaleString("en-PH",{maximumFractionDigits:2});
export function Scenarios({result}:{result:Analysis}) {
  const largest = Math.max(1,...result.scenarios.map(s=>Math.abs(s.profit)));
  return <div>
    <figure className="ng-chart"><figcaption>Operating profit or loss by scenario</figcaption>
      {result.scenarios.map(s=><div key={s.name} className="ng-chart-row"><span>{s.name}</span>
        <div aria-hidden="true" className="ng-track"><i className={s.profit<0?"ng-loss":"ng-profit"} style={{width:(Math.abs(s.profit)/largest*50)+"%"}}/></div>
        <strong>{peso(s.profit)}</strong></div>)}
    </figure>
    <Table title="Monthly sales scenarios" heads={["Scenario","Revenue","Variable costs","Fixed costs","Operating result"]} rows={result.scenarios.map(s=>[s.name,peso(s.revenue),peso(s.variable),peso(s.fixed),peso(s.profit)])}/>
  </div>;
}
export function Report({plan:p,result:r}:{plan:Plan;result:Analysis}) {
  const e=r.expected, ready=!r.missing.length;
  return <article className="ng-report">
    <h2>{p.name.trim() || p.type} feasibility report</h2><p>{[p.type,p.location,p.days+" operating days per month"].filter(Boolean).join(" · ")}</p>{p.description && <p>{p.description}</p>}
    {!!r.missing.length && <div className="ng-notice"><strong>Incomplete plan · figures below are partial totals</strong><ul>{r.missing.map(v=><li key={v}>{v}</li>)}</ul></div>}
    <h3>Launch funding</h3><div className="ng-metrics">
      <Metric label="Available owner capital" value={peso(r.capital)}/><Metric label="Opening loan proceeds" value={peso(r.loan)}/><Metric label="Startup purchases and deposits" value={peso(r.startup)}/>
      <Metric label="Working cash reserve" value={peso(r.reserve)}/><Metric label="Contingency allowance" value={peso(r.contingency)}/><Metric label="Total funding required" value={peso(r.funding)}/>
      <Metric label={ready?(r.gap<0?"Capital shortfall":"Capital surplus"):"Provisional funding balance"} value={peso(ready?Math.abs(r.gap):r.gap)}/>
    </div>
    <Table title="Startup allocation" heads={["Classification","Included total"]} rows={r.allocation.map(i=>[i.category,peso(i.total)])}/>
    <Table title="Startup checklist" heads={["Item","Class","Status","Quantity","Unit price","Included total","Notes"]} rows={p.startup.map(i=>[i.name,i.category,i.included?(i.required?"Included · required":"Included · optional"):"Excluded",i.quantity,i.price?peso(cents(i.price)):"Pending",i.included && i.price && i.quantity?peso(startupLine(i.quantity,i.price)):"Not available",i.notes])}/>
    <Table title="Recurring expenses" heads={["Expense","Class","Cost","Period","Monthly equivalent","Notes"]} rows={p.expenses.map(i=>[i.name,i.category,i.cost?peso(cents(i.cost)):"Pending",i.frequency,i.category==="Variable" && p.basis==="unit"?"Excluded by method":peso(monthly(i)),i.notes])}/>
    <h3>Expected operating performance</h3><div className="ng-metrics">
      <Metric label="Monthly revenue" value={peso(e.revenue)}/><Metric label="Variable expenses" value={peso(e.variable)}/><Metric label="Fixed expenses" value={peso(e.fixed)}/><Metric label="Total operating costs" value={peso(e.variable+e.fixed)}/>
      <Metric label="Monthly operating profit / loss" value={peso(e.profit)}/><Metric label="Operating margin" value={percent(e.margin)}/>
    </div>
    <Table title="Pricing and monthly sales mix" heads={["Offering","Units / month","Unit price","Variable cost / unit","Contribution / unit","Margin","Revenue","Variable costs","Contribution"]} rows={e.products.map(i=>[i.name,number(i.units),peso(i.price),peso(Math.round(i.unitCost)),peso(Math.round(i.price-i.unitCost)),percent(i.price?(i.price-i.unitCost)/i.price:null),peso(i.revenue),peso(i.variable),peso(i.revenue-i.variable)])}/>
    <p>Contribution is the amount left after variable costs to pay fixed bills. {p.basis==="unit"?"Each offering uses its own unit cost and additional fee.":"Shared variable expenses are allocated to offerings by expected revenue share."} Weekly volumes use 52 weeks ÷ 12 months.</p>
    <Scenarios result={r}/><p>{p.scenarios.map(s=>s.name+" "+s.volume+"% volume / "+s.cost+"% variable cost rate").join(" · ")}. Prices and fixed costs stay constant.</p>
    <h3>Break-even and cash recovery</h3><div className="ng-metrics"><Metric label="Operating break-even revenue / month" value={ready?peso(e.breakRevenue):"Pending"}/>
      {e.products.length===1 && <Metric label="Whole units to break even" value={ready && e.breakUnits!==null?number(e.breakUnits):"Not available"}/>}
      <Metric label="Expected contribution margin" value={percent(e.ratio)}/><Metric label="Owner investment payback" value={r.payback!==null?`Month ${r.payback}`:"Undetermined"}/>
      <Metric label="Full months before cash runs short" value={!ready || !p.confirmCash?"Pending":r.runway===null?"At least 120":String(r.runway)}/>
    </div>
    <p>{ready && e.breakRevenue!==null ? (e.profit>=0?"Expected sales cover operating costs. ":"Expected sales fall below operating break-even. "):""}Monthly fixed costs are divided by the contribution margin. Multiple offerings use the expected mix, so a different mix changes the target. A zero or negative margin cannot cover fixed bills through additional sales.</p>
    <p>{!p.confirmCash?"Review the cash assumptions in Sales forecast and confirm them to estimate payback and runway.":!ready?"Complete the inputs listed above to assess payback.":r.equity===0?"No initial owner outlay is modelled for recovery.":r.payback===null?"Cumulative cash flow does not recover the initial owner outlay within the 120-month projection.":`Projected receipts less cash outflows first recover the ${peso(r.equity)} owner outlay in month ${r.payback}.`}</p>
    <h3>Cash assumptions and risks</h3>
    <p>The reserve covers the largest cumulative cash deficit over the first {p.reserveMonths} months. Contingency is {p.contingency}% of startup costs. These buffers are held as cash, rather than spent on opening day.</p>
    <p>{p.deferred}% of sales is collected the following month, with the rest collected immediately. Operating bills are paid monthly. Starting stock is maintained through replenishment equal to cost consumed. Deposits stay tied up. Loan principal of up to {peso(cents(p.principal))} is repaid monthly until the loan is cleared. Additional monthly cash outflows are {peso(cents(p.cashOut))}.</p>
    <p>Assumes constant monthly sales and costs. Enter interest and owner pay under recurring expenses if applicable. Taxes, financing fees, asset replacement, and owner withdrawals are excluded unless entered. Operating results are before depreciation. End-of-month cash may mask a shortfall between payment dates.</p>
    {!!r.warnings.length && <ul className="ng-notice">{r.warnings.map(v=><li key={v}>{v}</li>)}</ul>}
    <Table title="First year of expected cash flow" heads={["Month","Receipts","Cash outflows","Net cash","Cumulative net cash","Closing cash"]} rows={r.cash.slice(0,12).map(i=>[i.month,peso(i.receipts),peso(i.outflows),peso(i.net),peso(i.cumulative),peso(i.closing)])}/>
    <p>Suggested requirements and sample costs are for planning purposes only. Actual expenses vary by location, supplier, and business requirements.</p>
    <p>These estimates depend on your assumptions and do not constitute professional financial advice.</p>
  </article>;
}
