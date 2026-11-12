import { LiveVentureDetail } from "@/components/live-ventures";
export const metadata = { title: "Venture", robots: { index: false, follow: true } };
export default function VentureLiveView(){return <LiveVentureDetail initial={[]} query/>;}
