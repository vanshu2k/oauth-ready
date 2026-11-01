import { OG_SIZE, siteCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "OAuth Ready: how long until your users can connect?";

export default function Image() {
  return siteCard();
}
