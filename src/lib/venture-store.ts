import { doc, runTransaction, type Firestore } from "firebase/firestore";
import { validateVenture, type VentureRecord } from "./venture-model";
export async function writeVenture(db: Firestore, input: VentureRecord, originalSlug: string | null, reserved: string[], remove = false) {
  const { status, revision } = input;
  const venture = remove && originalSlug ? { ...input.venture, slug: originalSlug } : input.venture;
  if(!['draft','published'].includes(status)||!Number.isInteger(revision)||revision<0)throw new Error("Invalid venture status or revision.");
  if (!remove) { const problem=validateVenture(venture); if(problem)throw new Error(problem); }
  const renaming=!!originalSlug && originalSlug!==venture.slug;
  if (!remove && (renaming||!originalSlug) && reserved.includes(venture.slug)) throw new Error("This slug belongs to an existing source venture.");
  const ref=doc(db,"managedVentures",venture.slug), pub=doc(db,"publicVentures",venture.slug);
  const old=doc(db,"managedVentures",originalSlug||venture.slug), oldPub=doc(db,"publicVentures",originalSlug||venture.slug);
  const nextRevision=renaming?1:revision+1;
  await runTransaction(db,async tx=>{
    const existing=await tx.get(old);
    if((existing.exists()?existing.data().revision:0)!==revision)throw new Error("This venture changed in another tab. Copy your edits and reopen it before saving.");
    if(renaming||!originalSlug){const target=renaming?await tx.get(ref):existing, visibility=await tx.get(pub);if(target.exists()||visibility.exists())throw new Error("That URL slug is already reserved. Choose another slug.");}
    if(revision===0&&originalSlug){const visibility=await tx.get(oldPub);if(visibility.exists())throw new Error("This venture changed in another tab. Reopen it before saving.");}
    if(remove)tx.delete(old);
    else tx.set(ref,{slug:venture.slug,content:JSON.stringify(venture),status,revision:nextRevision});
    tx.set(remove?oldPub:pub,!remove&&status==="published"?{slug:venture.slug,deleted:false,content:JSON.stringify(venture)}:{slug:remove?(originalSlug||venture.slug):venture.slug,deleted:true});
    if(renaming&&!remove){if(existing.exists())tx.delete(old);tx.set(oldPub,{slug:originalSlug,deleted:true});}
  });
  return {...input,revision:nextRevision};
}
