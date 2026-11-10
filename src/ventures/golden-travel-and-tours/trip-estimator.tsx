"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { InquiryForm } from "@/components/inquiry-form";
import { estimateNotice } from "./rates";
import { selectedPackage, tourPackages } from "./packages";
const peso = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount);
type Result = { message: string; title: string; reference?: string; date?: string; note?: string };
const todayInCebu = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function TripEstimator() {
  const [mode, setMode] = useState("custom");
  const [choice, setChoice] = useState("");
  const [customize, setCustomize] = useState(false);
  const [extra, setExtra] = useState(false);
  const [stops, setStops] = useState<string[]>([""]);
  const [result, setResult] = useState<Result | null>(null);
  const [inquire, setInquire] = useState(false);
  const [validation, setValidation] = useState("");
  const [minimumDate, setMinimumDate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { setMinimumDate(todayInCebu()); }, []);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const plannerForm = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const reference = selectedPackage(mode, choice);
  function invalidate() { setResult(null); setInquire(false); }
  function inquirySent() {
    plannerForm.current?.reset();
    setMode("custom"); setChoice(""); setCustomize(false); setExtra(false); setStops([""]);
    setResult(null); setInquire(false); setValidation(""); setMinimumDate(todayInCebu()); setSubmitted(true);
    requestAnimationFrame(() => confirmation.current?.focus());
  }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    if (!field("from") || !field("to") || (extra && stops.some(stop => !stop.trim())) || (customize && !field("customization"))) {
      setValidation("Please enter pickup, drop-off, and any required stop or customization details.");
      return;
    }
    if (field("date") < todayInCebu()) { setValidation("Please choose today or a future travel date in Cebu."); return; }
    setValidation("");
    const modified = extra || (mode === "packages" && customize);
    const rate = reference?.fixedRate;
    const custom = !rate || modified || data.get("multiDay") === "on";
    const summary = [
      "Golden Travel: request final quotation (not a booking)",
      `Trip: ${reference?.name ?? "Custom itinerary"}`,
      `Travel date: ${field("date")} | Pickup time: ${field("time")}`,
      `From: ${field("from")} | Final drop-off: ${field("to")}`,
      `Travel type: ${field("tripType")} | Multiple days: ${data.get("multiDay") === "on" ? "Yes" : "No"}`,
      `Passengers: ${field("passengers")} | Vehicle preference: ${field("vehicle")}`,
      `Luggage: ${field("luggage") || "Not specified"}`,
      `Suggested package stops: ${reference?.stops.join(" → ") ?? "None"}`,
      `Extra stops in requested order: ${extra ? stops.map(s => s.trim()).filter(Boolean).join(" → ") : "None"}`,
      `Expected total hours, including stops: ${field("hours") || "Please advise"}`,
      `Package customization: ${mode === "packages" && customize ? field("customization") : "None"}`,
      `Notes / time at stops: ${field("notes") || "None"}`,
      rate ? `Package reference: ${peso(rate.amount)}, confirmed ${rate.confirmedOn}. Conditions: ${rate.conditions}. Changes require quotation.` : "No supported price reference; manual quotation required.",
      `Assessment: ${custom ? "Custom quotation required" : "Package rate reference; final total requires confirmation"}`,
      estimateNotice,
    ].join("\n");
    setResult({ message: summary, title: custom ? "Personalized quotation required" : "Your starting budget reference", reference: rate ? peso(rate.amount) : undefined, date: rate?.confirmedOn, note: rate?.conditions });
    setInquire(false);
    requestAnimationFrame(() => resultHeading.current?.focus());
  }
  return <section className="trip-estimator" aria-label="Trip details">
    <p>Build your own trip or explore our 12 suggested packages. Choose an itinerary, tell us what you would like to change, and request a confirmed price. Availability and practical schedules are confirmed by the team.</p>
    {submitted && <p ref={confirmation} tabIndex={-1} className="trip-submission-success" role="status">Thank you! Your trip inquiry has been submitted. The form is ready for a new itinerary. The team will reply to the email address you provided; this does not confirm a booking.</p>}
    <form ref={plannerForm} onSubmit={calculate} onChange={() => { invalidate(); setValidation(""); setSubmitted(false); }}>
      <label htmlFor="trip-mode">How would you like to plan?</label>
      <select id="trip-mode" value={mode} onChange={e => { setMode(e.target.value); setChoice(""); setCustomize(false); setExtra(false); setStops([""]); invalidate(); }}><option value="custom">Build my own trip</option><option value="packages">Packages</option></select>
      {mode === "packages" && <><label htmlFor="trip-package">Choose a package (required)</label><select id="trip-package" value={choice} required onChange={e => { setChoice(e.target.value); setCustomize(false); invalidate(); }}><option value="" disabled>Select one of the 12 packages</option>{tourPackages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></>}
      {reference && <div className="trip-package-info"><h3>{reference.name}</h3><p><strong>{reference.fixedRate ? `${peso(reference.fixedRate.amount)} · package reference` : "Rate: Request quotation"}</strong></p>{reference.fixedRate ? <p>{reference.fixedRate.conditions} · Confirmed {reference.fixedRate.confirmedOn}</p> : <p>A fixed rate for this exact itinerary is not yet published. Request the current price for your group and travel date.</p>}<p><strong>Suggested destinations and activities</strong></p><ul>{reference.stops.map(stop => <li key={stop}>{stop}</li>)}</ul><p>Activity tickets are not included unless confirmed in your quotation. The team will confirm access, stop order, and whether the itinerary needs more than one day.</p><label className="trip-check"><input type="checkbox" checked={customize} onChange={e => { setCustomize(e.target.checked); invalidate(); }} /> Customize this package</label>{customize && <><label htmlFor="trip-customization">What would you like to change? (required)</label><textarea id="trip-customization" name="customization" required maxLength={400} rows={3} placeholder="Add or remove destinations, change activities, or request a different schedule." /></>}</div>}
      <div className="trip-fields">
        <div><label htmlFor="trip-from">Pickup location (required)</label><input id="trip-from" name="from" required maxLength={160} placeholder="Hotel, landmark or address in Cebu" /></div>
        <div><label htmlFor="trip-to">Final drop-off (required)</label><input id="trip-to" name="to" required maxLength={160} placeholder="Return hotel or final destination" /></div>
        <div><label htmlFor="trip-date">Travel date (required)</label><input id="trip-date" name="date" type="date" min={minimumDate} onFocus={() => setMinimumDate(todayInCebu())} required /></div>
        <div><label htmlFor="trip-time">Pickup time (required)</label><input id="trip-time" name="time" type="time" required /></div>
        <div><label htmlFor="trip-type">Journey type</label><select id="trip-type" name="tripType"><option>Return trip</option><option>One-way</option><option>Multiple destinations / other</option></select></div>
        <div><label htmlFor="trip-vehicle">Vehicle preference</label><select id="trip-vehicle" name="vehicle"><option>Recommend a vehicle</option><option>Van</option><option>Sedan</option><option>SUV</option></select></div>
        <div><label htmlFor="trip-passengers">Passengers (required)</label><input id="trip-passengers" name="passengers" type="number" min="1" max="100" step="1" required /></div>
        <div><label htmlFor="trip-hours">Expected total hours (optional)</label><input id="trip-hours" name="hours" type="number" min="1" max="240" step="0.5" /></div>
      </div>
      <label htmlFor="trip-luggage">Luggage (optional)</label><input id="trip-luggage" name="luggage" maxLength={160} placeholder="For example: 4 large suitcases" />
      <label className="trip-check"><input name="multiDay" type="checkbox" /> Overnight or multiple-day trip</label>
      <label className="trip-check"><input type="checkbox" checked={extra} onChange={e => { setExtra(e.target.checked); invalidate(); }} /> Add places along the way</label>
      {extra && <fieldset className="trip-stops"><legend>Extra stops, in travel order</legend>{stops.map((stop, i) => <div key={i}><label htmlFor={`trip-stop-${i}`}>Stop {i + 1}</label><div className="trip-stop-row"><input id={`trip-stop-${i}`} required maxLength={160} value={stop} onChange={e => setStops(values => values.map((value, index) => index === i ? e.target.value : value))} placeholder="Place name, landmark or address" /><button type="button" aria-label={`Remove stop ${i + 1}`} disabled={stops.length === 1} onClick={() => { setStops(values => values.filter((_, index) => i !== index)); invalidate(); }}>Remove</button></div></div>)}<button type="button" className="trip-add-stop" disabled={stops.length >= 5} onClick={() => { setStops(values => [...values, ""]); invalidate(); }}>Add another stop</button><p>Up to five extra stops. Include longer itineraries in your notes.</p></fieldset>}
      <label htmlFor="trip-notes">Time at stops and special requests (optional)</label><textarea id="trip-notes" name="notes" rows={4} maxLength={400} placeholder="Tell us how long you want to stay, any changed stops, activities, or accessibility needs." />
      <p>Island/ferry routes, overnight trips, large groups and unusual itineraries need manual review. Passenger count does not guarantee vehicle capacity.</p>
      {validation && <p role="alert" className="form-error">{validation}</p>}
      <button type="submit" className="button">Review my itinerary</button>
    </form>
    {result && <div className="trip-result"><h3 ref={resultHeading} tabIndex={-1}>{result.title}</h3>{result.reference ? <><p className="trip-reference">{result.reference}<span>Package reference · not per person or your final total</span></p><p>Reference date: {result.date}. This reference is not recalculated for your pickup, group size, chosen vehicle, date or changes.</p><p>{result.note}</p></> : <p>We do not have a verified pricing rule for this route. Send the itinerary below for a tailored quotation.</p>}
      <p className="trip-disclaimer"><strong>Estimate notice:</strong> {estimateNotice}</p>
      <p><strong>Not priced here:</strong> attraction tickets, boats/ferries, activities, tolls, parking, meals, accommodation and extra hours. Fuel and driver inclusions must also be confirmed in the final quote. No automatic fuel surcharge or extra-hour allowance is assumed.</p>
      <details><summary>Review the itinerary to send</summary><pre>{result.message}</pre></details>
      <button className="button" type="button" onClick={() => setInquire(true)}>Request final quotation</button>
      {inquire && <InquiryForm key={result.message} initialTopic="Golden Travel and Tours" initialMessage={result.message} travel onSuccess={inquirySent} />}
    </div>}
    <noscript>Please use the business contact links below to request a quotation. The budget planner needs JavaScript.</noscript>
  </section>;
}
