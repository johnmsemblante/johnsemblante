"use client";

import { useRef, useState, type FormEvent } from "react";
import { InquiryForm } from "@/components/inquiry-form";
import { estimateNotice, needsCustomQuote, referenceFor, tripReferences } from "./rates";
const peso = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount);
type Result = { message: string; title: string; reference?: string; date?: string; note?: string };

export function TripEstimator() {
  const [choice, setChoice] = useState("custom");
  const [extra, setExtra] = useState(false);
  const [stops, setStops] = useState<string[]>([""]);
  const [result, setResult] = useState<Result | null>(null);
  const [inquire, setInquire] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const reference = referenceFor(choice);
  function invalidate() { setResult(null); setInquire(false); }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const modified = extra || data.get("modified") === "on";
    const custom = needsCustomQuote(choice, modified, field("vehicle"), data.get("multiDay") === "on");
    const summary = [
      "Golden Travel — request final quotation (not a booking)",
      `Trip: ${reference?.name ?? "Custom itinerary"}`,
      `Travel date: ${field("date")} | Pickup time: ${field("time")}`,
      `From: ${field("from")} | Final drop-off: ${field("to")}`,
      `Travel type: ${field("tripType")} | Multiple days: ${data.get("multiDay") === "on" ? "Yes" : "No"}`,
      `Passengers: ${field("passengers")} | Vehicle preference: ${field("vehicle")}`,
      `Luggage: ${field("luggage") || "Not specified"}`,
      `Suggested package stops: ${reference?.stops.join(" → ") ?? "None"}`,
      `Extra stops in requested order: ${extra ? stops.map(s => s.trim()).filter(Boolean).join(" → ") : "None"}`,
      `Expected total hours, including stops: ${field("hours") || "Please advise"}`,
      `Package changes: ${data.get("modified") === "on" ? "Yes" : "No"}`,
      `Notes / time at stops: ${field("notes") || "None"}`,
      reference ? `Historical vehicle reference: ${peso(reference.amount)}, quoted ${reference.date}. Not a current trip total.` : "No supported price reference; manual quotation required.",
      `Assessment: ${custom ? "Custom quotation required" : "Historical reference only; current total requires confirmation"}`,
      estimateNotice,
    ].join("\n");
    setResult({ message: summary, title: custom ? "Personalized quotation required" : "Your starting budget reference", reference: reference ? peso(reference.amount) : undefined, date: reference?.date, note: reference?.note });
    setInquire(false);
    requestAnimationFrame(() => resultHeading.current?.focus());
  }
  return <section id="trip-estimator" className="venture-section trip-estimator" tabIndex={-1}>
    <p className="eyebrow">Plan before you book</p><h2>Explore your trip budget.</h2>
    <p>Choose a previous itinerary for a dated price reference, or build a custom trip for a personalized quotation. No live fuel adjustment, route-distance pricing, or availability check is applied.</p>
    <form onSubmit={calculate} onChange={invalidate}>
      <label htmlFor="trip-package">Package or custom trip</label>
      <select id="trip-package" value={choice} onChange={e => { setChoice(e.target.value); invalidate(); }}><option value="custom">Build my own trip</option>{tripReferences.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {reference && <div className="trip-package-info"><p><strong>Suggested stops</strong></p><p>{reference.stops.join(" → ")}</p><p>Stops are a proposed itinerary, not guaranteed activity bookings. Confirm that the schedule is practical.</p><label className="trip-check"><input type="checkbox" name="modified" /> I want to change or remove package stops</label></div>}
      <div className="trip-fields">
        <div><label htmlFor="trip-from">Pickup location (required)</label><input id="trip-from" name="from" required maxLength={160} placeholder="Hotel, landmark or address in Cebu" /></div>
        <div><label htmlFor="trip-to">Final drop-off (required)</label><input id="trip-to" name="to" required maxLength={160} placeholder="Return hotel or final destination" /></div>
        <div><label htmlFor="trip-date">Travel date (required)</label><input id="trip-date" name="date" type="date" required /></div>
        <div><label htmlFor="trip-time">Pickup time (required)</label><input id="trip-time" name="time" type="time" required /></div>
        <div><label htmlFor="trip-type">Journey type</label><select id="trip-type" name="tripType"><option>Return trip</option><option>One-way</option><option>Multiple destinations / other</option></select></div>
        <div><label htmlFor="trip-vehicle">Vehicle preference</label><select id="trip-vehicle" name="vehicle"><option>Recommend a vehicle</option><option>Van</option><option>Sedan</option><option>SUV</option></select></div>
        <div><label htmlFor="trip-passengers">Passengers (required)</label><input id="trip-passengers" name="passengers" type="number" min="1" max="100" step="1" required /></div>
        <div><label htmlFor="trip-hours">Expected total hours (optional)</label><input id="trip-hours" name="hours" type="number" min="1" max="240" step="0.5" /></div>
      </div>
      <label htmlFor="trip-luggage">Luggage (optional)</label><input id="trip-luggage" name="luggage" maxLength={160} placeholder="For example: 4 large suitcases" />
      <label className="trip-check"><input name="multiDay" type="checkbox" /> Overnight or multiple-day trip</label>
      <label className="trip-check"><input type="checkbox" checked={extra} onChange={e => { setExtra(e.target.checked); invalidate(); }} /> Add places along the way</label>
      {extra && <fieldset className="trip-stops"><legend>Extra stops, in travel order</legend>{stops.map((stop, i) => <div key={i}><label htmlFor={`trip-stop-${i}`}>Stop {i + 1}</label><div className="trip-stop-row"><input id={`trip-stop-${i}`} required maxLength={120} value={stop} onChange={e => setStops(values => values.map((value, index) => index === i ? e.target.value : value))} /><button type="button" aria-label={`Remove stop ${i + 1}`} disabled={stops.length === 1} onClick={() => { setStops(values => values.filter((_, index) => i !== index)); invalidate(); }}>Remove</button></div></div>)}<button type="button" disabled={stops.length >= 5} onClick={() => { setStops(values => [...values, ""]); invalidate(); }}>Add another stop</button><p>Up to five extra stops. Include longer itineraries in your notes.</p></fieldset>}
      <label htmlFor="trip-notes">Time at stops and special requests (optional)</label><textarea id="trip-notes" name="notes" rows={4} maxLength={400} placeholder="Tell us how long you want to stay, any changed stops, activities, or accessibility needs." />
      <p>Island/ferry routes, overnight trips, large groups and unusual itineraries need manual review. Passenger count does not guarantee vehicle capacity.</p>
      <button type="submit" className="button">Review my trip budget</button>
    </form>
    {result && <div className="trip-result"><h3 ref={resultHeading} tabIndex={-1}>{result.title}</h3>{result.reference ? <><p className="trip-reference">{result.reference}<span>Historical vehicle quotation · not per person or your final total</span></p><p>Reference date: {result.date}. This amount is not recalculated for your pickup, group size, chosen vehicle, date or changes.</p><p>{result.note}</p></> : <p>We do not have a verified pricing rule for this route. Send the itinerary below for a tailored quotation.</p>}
      <p className="trip-disclaimer"><strong>Estimate notice:</strong> {estimateNotice}</p>
      <p><strong>Not priced here:</strong> attraction tickets, boats/ferries, activities, tolls, parking, meals, accommodation and extra hours. Fuel and driver inclusions must also be confirmed in the final quote. No automatic fuel surcharge or extra-hour allowance is assumed.</p>
      <details><summary>Review the itinerary to send</summary><pre>{result.message}</pre></details>
      <button className="button" type="button" onClick={() => setInquire(true)}>Request final quotation</button>
      {inquire && <InquiryForm key={result.message} initialTopic="Golden Travel and Tours" initialMessage={result.message} travel />}
    </div>}
    <noscript>Please use the business contact links below to request a quotation. The budget planner needs JavaScript.</noscript>
  </section>;
}
