import { BatteryCharging, BookOpen, Camera, CreditCard, Glasses, Headphones, Laptop, Plug, Smartphone, Usb, Droplets, Package, Umbrella } from "lucide-react";
import type { Item, Category } from "@/lib/types";

const paths = {
  top: "M8 3 3 6 1 11 5 13 7 9v12h10V9l2 4 4-2-2-5-5-3c0 4-8 4-8 0Z",
  bottom: "M6 3h12l2 18h-6l-2-12-2 12H4L6 3Zm0 4h12M12 3v6",
  outer: "M9 3 4 6 1 18l4 2 3-10v11h8V10l3 10 4-2-3-12-5-3-3 4-3-4Zm3 4v14M8 15h2m4 0h2",
  dress: "M9 3v4L5 21h14L15 7V3h-2v3h-2V3H9ZM8 12h8",
  shoes: "M3 7h5l3 6 9 3c2 1 2 5 0 5H3V7Zm0 10h18M10 11l-2 2m5 0-2 2",
  sock: "M8 3h8v10l4 4c2 3-2 6-4 4l-8-6V3Zm0 4h8m-8 6h4v4",
  underwear: "M3 5h18l-4 14h-3l-2-6-2 6H7L3 5Zm1 4h16",
  hat: "M6 14V9a6 6 0 0 1 12 0v5M2 14h20v4H2v-4Z",
  scarf: "M5 3h14v6H5V3Zm3 6v12h4V9m3 0v9h4V9M8 18h4m3-3h4",
  glove: "M7 12V5a1 1 0 0 1 2 0v5-6a1 1 0 0 1 2 0v6-7a1 1 0 0 1 2 0v7-5a1 1 0 0 1 2 0v8l2-3c1-2 3-1 2 1l-3 8H8l-4-7c-1-2 1-3 2-1l1 1Zm1 7v3h8v-3",
  bottle: "M9 2h6v4H9V2ZM8 6h8l2 4v11H6V10l2-4Zm-2 7h12",
  brush: "M10 10V3h5v7h-5Zm2 0v12m-2-16h5m-5 3h5",
  accessory: "M5 5h14v14H5V5Zm0 4h14m-10 0v10m6-10v10",
};
export function ItemIcon({ item, className = "size-8" }: { item: Pick<Item, "name" | "category"> & Partial<Pick<Item, "color">>; className?: string }) {
  const name = item.name.toLowerCase();
  const Icon = name.includes("charger") ? Usb : name.includes("adapter") ? Plug : name.includes("power bank") ? BatteryCharging : name.includes("phone") ? Smartphone : name.includes("laptop") ? Laptop : name.includes("headphone") ? Headphones : name.includes("reader") ? BookOpen : name.includes("camera") ? Camera : name.includes("sunglass") ? Glasses : item.category === "documents" ? CreditCard : name.includes("umbrella") ? Umbrella : item.category === "tech" ? Package : null;
  const props = { className: `shrink-0 ${className}`, style: { color: item.color }, role: "img", "aria-label": item.name, strokeWidth: 1.7 };
  if (Icon) return <Icon {...props} />;
  let kind: keyof typeof paths = item.category in paths ? item.category as keyof typeof paths : "accessory";
  if (name.includes("sock")) kind = "sock";
  else if (name.includes("underwear") || name.includes("swim") || name === "bra") kind = "underwear";
  else if (name.includes("hat") || name.includes("beanie")) kind = "hat";
  else if (name.includes("scarf")) kind = "scarf";
  else if (name.includes("glove")) kind = "glove";
  else if (name.includes("toothbrush") || name.includes("razor")) kind = "brush";
  else if (item.category === "toiletry") kind = "bottle";
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}
export function CategoryIcon({ category, label }: { category: Category; label: string }) {
  return <ItemIcon item={{ category, name: label }} className="size-5" />;
}