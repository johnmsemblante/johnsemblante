const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'), ts=require('typescript');
function load(name,mocks={}) {
  const exports={};
  const code=ts.transpileModule(fs.readFileSync('src/lib/negosyo/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',code)(id=>mocks[id]??require(id),exports);
  return exports;
}
const model=load('plan');
const {newPlan,templates,validPlan,blankStartup,blankExpense,blankProduct}=model;
const {analyse,cents,monthly,startupLine}=load('finance',{'./plan':model});
const item=(id,price,cost,units)=>({...blankProduct(id,id),price,cost,units,period:'month'});
function fixture() {
  const p=newPlan();
  p.capital='1500';p.days='20';p.confirmCash=true;
  p.startup=[{...blankStartup('stock','Opening stock','Initial inventory'),price:'600'},{...blankStartup('deposit','Deposit','Refundable deposits'),price:'400'}];
  p.expenses=[{...blankExpense('rent','Rent'),cost:'300'}];
  p.products=[item('Meals','100','40','10')];
  return p;
}
for(const t of templates) test(t.name+' template and JSON round trip',()=>{
  const p=newPlan(t.name);
  assert.ok(validPlan(JSON.parse(JSON.stringify(p))));
  assert.equal(p.type,t.name);assert.ok(p.startup.every(i=>i.price===''));
  assert.equal(Boolean(p.startup.length),t.name!=='Custom Business');
  assert.ok(analyse(p).missing.length);
});
test('centavo rounding, missing values, invalid amounts and frequency conversion',()=>{
  assert.equal(cents('0.29'),29);assert.equal(cents('11.1'),1110);
  for(const invalid of ['','-2','1e7','3.011','Infinity'])assert.equal(cents(invalid),0);
  assert.equal(startupLine('1.15','0.10'),12);
  assert.equal(monthly({...blankExpense('x'),cost:'30',frequency:'weekly'}),13000);
  assert.equal(monthly({...blankExpense('x'),cost:'120',frequency:'annual'}),1000);
});
test('inventory is an opening cash purchase, deposits tie up cash, and replenishment follows sales',()=>{
  const p=fixture();
  p.startup.push({...blankStartup('exclude','Excluded'),price:'999',included:false});
  const r=analyse(p);
  assert.deepEqual(r.missing,[]);assert.equal(r.startup,100000);
  assert.equal(r.allocation[1].total,60000);assert.equal(r.expected.revenue,100000);
  assert.equal(r.expected.variable,40000);assert.equal(r.expected.profit,30000);
  assert.equal(r.expected.breakUnits,5);assert.equal(r.expected.breakRevenue,50000);
  assert.equal(r.payback,4);assert.equal(r.reserve,0);assert.equal(r.gap,50000);
});
test('weighted mix and scenario sensitivity',()=>{
  const p=fixture();p.products.push(item('Repairs','200','150','5'));
  const r=analyse(p);assert.equal(r.expected.contribution,85000);assert.equal(r.expected.ratio,.425);
  assert.equal(r.expected.breakRevenue,70589);assert.equal(r.expected.breakUnits,null);
  assert.deepEqual(r.scenarios.map(s=>s.revenue),[150000,200000,250000]);
  assert.deepEqual(r.scenarios.map(s=>s.variable),[94875,115000,143750]);
});
test('variable cost modes exclude the other source and pooled allocations reconcile',()=>{
  const p=fixture();p.expenses.push({...blankExpense('pack','Packaging'),category:'Variable',cost:'90'});
  assert.equal(analyse(p).expected.variable,40000);
  p.basis='budget';p.products.push(item('Service','50','999','4'));const r=analyse(p);
  assert.equal(r.expected.variable,9000);
  assert.deepEqual(r.expected.products.map(i=>i.variable),[7500,1500]);
  assert.equal(r.scenarios[0].variable,7425);
});
test('cash lag, loan draw and repayments, reserve, shortfall and payback',()=>{
  const p=fixture();Object.assign(p,{capital:'600',loan:'400',principal:'200',deferred:'100',contingency:'10',reserveMonths:'3'});
  const r=analyse(p);assert.equal(r.expected.profit,30000);assert.equal(r.equity,60000);
  assert.deepEqual(r.cash.slice(0,3).map(i=>i.net),[-90000,10000,30000]);
  assert.equal(r.reserve,90000);assert.equal(r.funding,200000);assert.equal(r.gap,-100000);
  assert.equal(r.payback,7);assert.equal(r.runway,0);
  p.confirmCash=false;assert.equal(analyse(p).payback,null);
});
test('zero volume, zero cost, negative contribution, missing data and capacity',()=>{
  const p=fixture();p.products[0].units='0';let r=analyse(p);
  assert.equal(r.expected.revenue,0);assert.equal(r.expected.margin,null);assert.equal(r.payback,null);
  p.expenses=[];p.products[0].units='10';r=analyse(p);assert.equal(r.expected.breakRevenue,0);assert.equal(r.expected.breakUnits,0);
  p.products[0].price='40';assert.equal(analyse(p).expected.breakRevenue,null);
  p.products[0].price='0';assert.equal(analyse(p).expected.breakUnits,null);
  p.products[0].price='30';assert.equal(analyse(p).expected.breakRevenue,null);
  p.products[0].hours='2';p.capacity='12';assert.ok(analyse(p).warnings.some(w=>w.includes('service hours')));
  p.startup[0].quantity='';assert.ok(analyse(p).missing.length);assert.equal(analyse(p).payback,null);
});
test('weekly and daily units and paid per-unit fees',()=>{
  const p=fixture();Object.assign(p.products[0],{period:'week',units:'1',price:'10.01',cost:'2',extra:'0.50'});
  let e=analyse(p).expected;assert.equal(e.revenue,4338);assert.equal(e.variable,1083);
  p.products[0].period='day';e=analyse(p).expected;assert.equal(e.revenue,20020);assert.equal(e.variable,5000);
});
test('import rejects malformed data, unknown versions, duplicate IDs and oversized values',()=>{
  for(const set of [p=>p.version=2,p=>p.scenarios=[],p=>p.days='1.5',p=>p.days='32',p=>p.capital='-10',p=>p.startup.push(p.startup[0]),p=>p.products[0].price=Infinity,p=>p.deferred='101',p=>p.expenses[0].notes='a'.repeat(1001)]){
    const p=fixture();set(p);assert.equal(validPlan(p),false);
  }
});
