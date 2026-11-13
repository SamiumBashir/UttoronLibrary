import { readStore } from "@/lib/db";
import AboutInteractiveClient from "@/components/about/AboutInteractiveClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us",
};

export default function AboutPage() {
  const store = readStore();
  return <AboutInteractiveClient publishers={store.publishers} />;
}
