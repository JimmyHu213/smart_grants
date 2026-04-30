"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { triggerCrawl } from "@/lib/actions/crawl";
import type { CrawlSummary } from "@/lib/actions/crawl";

const SOURCES = [
  {
    id: "grant_connect",
    label: "GrantConnect (grants.gov.au)",
    description: "Federal government grants portal",
  },
  {
    id: "business_gov",
    label: "business.gov.au",
    description: "Business grants and programs listing",
  },
] as const;

export function CrawlPageClient() {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(SOURCES.map((s) => s.id))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlSummary | null>(null);

  function toggleSource(id: string) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCrawl() {
    if (selectedSources.size === 0) {
      toast.error("Select at least one source");
      return;
    }

    setIsLoading(true);
    setResult(null);

    const response = await triggerCrawl(Array.from(selectedSources));

    if (response.success && response.data) {
      setResult(response.data);
      const total = response.data.new + response.data.updated;
      if (total > 0) {
        toast.success(`Found ${total} grants to review`);
      } else {
        toast.info("No new grants found");
      }
    } else {
      toast.error(response.error ?? "Crawl failed");
    }

    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crawl Grants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover new grants from government sources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Sources
          </CardTitle>
          <CardDescription>
            Choose which government portals to crawl for grants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOURCES.map((source) => (
            <div key={source.id} className="flex items-start gap-3">
              <Checkbox
                id={source.id}
                checked={selectedSources.has(source.id)}
                onCheckedChange={() => toggleSource(source.id)}
                disabled={isLoading}
              />
              <div>
                <Label htmlFor={source.id} className="font-medium">
                  {source.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {source.description}
                </p>
              </div>
            </div>
          ))}

          <Button
            onClick={handleCrawl}
            disabled={isLoading || selectedSources.size === 0}
            className="mt-4"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Crawling..." : "Start Crawl"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Crawl Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary">{result.new} new</Badge>
              <Badge variant="secondary">{result.updated} updated</Badge>
              <Badge variant="outline">{result.unchanged} unchanged</Badge>
              <Badge variant="outline">{result.skipped} skipped</Badge>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {result.errors.length} source
                  {result.errors.length > 1 ? "s" : ""} had errors
                </div>
                <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {(result.new > 0 || result.updated > 0) && (
              <Link href="/admin/grants/review">
                <Button variant="outline" className="gap-2">
                  Review pending grants
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
