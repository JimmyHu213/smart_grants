import { requireAdmin } from "@/lib/auth";
import { CrawlPageClient } from "./crawl-page-client";

export default async function CrawlGrantsPage() {
  await requireAdmin();
  return <CrawlPageClient />;
}
