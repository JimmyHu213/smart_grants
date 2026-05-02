"use client";

import { useRef, useState } from "react";
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
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { importGrantsFromExcel } from "@/lib/actions/import-grants";
import type { ImportSummary } from "@/lib/actions/import-grants";

export function CrawlPageClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await importGrantsFromExcel(formData);

    if (response.success && response.data) {
      setResult(response.data);
      if (response.data.new > 0) {
        toast.success(`Imported ${response.data.new} grants for review`);
      } else {
        toast.info("No new grants found in file");
      }
    } else {
      toast.error(response.error ?? "Import failed");
    }

    setIsLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file?.name ?? null);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Grants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a spreadsheet of grants — AI will extract and normalise the data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Spreadsheet
          </CardTitle>
          <CardDescription>
            Accepts .xlsx, .xls, or .csv files. Each row should represent a grant
            with columns for name, jurisdiction, amount, eligibility, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {fileName ?? "No file selected"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading || !fileName}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Processing..." : "Import Grants"}
            </Button>

            {isLoading && (
              <p className="text-sm text-muted-foreground">
                AI is reading and normalising your data. This may take a minute.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary">{result.new} new</Badge>
              <Badge variant="outline">{result.skipped} skipped (duplicates)</Badge>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {result.errors.length} grant{result.errors.length > 1 ? "s" : ""} had issues
                </div>
                <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.new > 0 && (
              <Link href="/admin/grants/review">
                <Button variant="outline" className="gap-2">
                  Review imported grants
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
