import { LiveVentureDetail } from "@/components/live-ventures";
import { DonationSupport } from "@/components/tools/donation-support";
export const metadata = { title: "Venture", robots: { index: false, follow: true } };
export default function VentureLiveView(){return <LiveVentureDetail initial={[]} query support={<DonationSupport />}/>;}
