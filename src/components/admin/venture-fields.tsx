"use client";
import { ImageUpload } from "./image-upload";
import { pageUrl } from "@/lib/page-model";
type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
const image = () => ({src:"",alt:"",width:1200,height:800});
const samples:Record<string,()=>Value>={
  offerings:()=>({title:"",description:"",price:0,image:image()}),questions:()=>({question:"",answer:""}),
  phones:()=>({label:"",url:"tel:"}),socials:()=>({label:"",url:"https://"}),steps:()=>"",
  artwork:image,vehicles:()=>({name:"",image:image()}),gallery:()=>({...image(),title:"",thumbnailSrc:"",sourceUrl:"",caption:""}),
};
/** Schema-driven controls preserve every existing section and asset. */
export function VentureFields({ value, onChange, path="venture", onBusy, disabled=false }: { value: Value; onChange:(value:Value)=>void; path?:string; onBusy:(busy:boolean)=>void; disabled?:boolean }) {
  const name=path.split('.').at(-1)!;
  if(Array.isArray(value))return <section className="venture-array"><h3>{name}</h3>{value.map((item,index)=><details key={index} className="page-field-group" open={typeof item!=="object"}><summary>{name} {index+1}{item&&typeof item==='object'&&!Array.isArray(item)&&typeof (item.title??item.name??item.question)==='string'?`: ${item.title??item.name??item.question}`:""}</summary><VentureFields value={item} path={`${path}.${index}`} disabled={disabled} onBusy={onBusy} onChange={next=>onChange(value.map((v,i)=>i===index?next:v))}/><button type="button" disabled={disabled} onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Remove item</button></details>)}<button type="button" disabled={disabled||value.length>=(name==='gallery'||name==='offerings'?50:20)} onClick={()=>onChange([...value,samples[name]?.()??structuredClone(value[0]??"")])}>Add {name==='steps'?"step":"item"}</button></section>;
  if(value&&typeof value==="object")return <div className="venture-object">{Object.entries(value).filter(([key])=>path!=='venture'||(value.theme==='photography'?!['offerings','offeringsNote','artwork','vehicles','ordering','storyImage','phones'].includes(key):key!=='gallery')).map(([key,child])=><div key={key} className="venture-object-field">
    {typeof child==='object'&&child!==null&&<h4>{key}</h4>}
    <VentureFields path={`${path}.${key}`} value={child} disabled={disabled} onBusy={onBusy} onChange={next=>onChange({...value,[key]:next})}/>
    {key==='src'&&typeof child==='string'&&<><ImageUpload disabled={disabled} onBusy={onBusy} onUpload={url=>onChange({...value,src:url,...('thumbnailSrc' in value?{thumbnailSrc:url}:{})})}/>{pageUrl(child,true)&&<img className="work-editor-preview" src={child} alt={typeof value.alt==='string'?value.alt:'Venture image preview'}/>}</>}
    {['logo','hero','storyImage','image','price','canonicalBase'].includes(key)&&<button type="button" disabled={disabled} onClick={()=>{const next={...value};delete next[key];onChange(next);}}>Remove {key}</button>}
  </div>)}
    {name!=='seo'&&['logo','hero','storyImage'].filter(key=>path==='venture'&&!(key in value)).map(key=><button key={key} type="button" disabled={disabled} onClick={()=>onChange({...value,[key]:image()})}>Add {key} image</button>)}
    {path.includes('.offerings.')&&!('image' in value)&&<button type="button" disabled={disabled} onClick={()=>onChange({...value,image:image()})}>Add offering image</button>}
    {path.includes('.offerings.')&&!('price' in value)&&<button type="button" disabled={disabled} onClick={()=>onChange({...value,price:0})}>Add price</button>}
    {path==='venture'&&!('canonicalBase' in value)&&<button type="button" disabled={disabled} onClick={()=>onChange({...value,canonicalBase:'https://'})}>Set custom canonical URL</button>}
  </div>;
  const label=name.replace(/([a-z])([A-Z])/g,'$1 $2');
  if(name==='theme')return <label>Layout<select value={String(value)} onChange={e=>onChange(e.target.value)}><option value="coffee">Coffee / products</option><option value="travel">Travel / services</option><option value="photography">Photography</option></select></label>;
  if(typeof value==='number')return <label>{label}<input type="number" min={0} max={name==='price'?10000000:20000} step={name==='price'?'0.01':'1'} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
  return <label>{path==='venture.seo.title'?'Meta title':path==='venture.seo.description'?'Meta description':label}{['story','description','answer','note','offeringsNote','caption'].includes(name)?<textarea rows={name==='story'?7:3} maxLength={name==='story'?20000:path==='venture.seo.description'?500:4000} value={String(value??"")} onChange={e=>onChange(e.target.value)}/>:<input value={String(value??"")} maxLength={path==='venture.seo.title'?160:['src','url','thumbnailSrc','sourceUrl','canonicalBase'].includes(name)?2000:500} onChange={e=>onChange(e.target.value)} />}</label>;
}
