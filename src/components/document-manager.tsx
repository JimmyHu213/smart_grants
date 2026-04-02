"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Loader2,
  File,
  Link2,
} from "lucide-react";
import {
  saveDocumentMetadata,
  deleteDocument,
  getSignedDownloadUrl,
  getSignedUploadUrl,
} from "@/lib/actions/documents";

// ─── Types ─────────────────────────────────────────────

type ChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
};

type DocumentRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  checklistItemId: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: {
    fullName: string | null;
    email: string;
  };
  checklistItem: {
    label: string;
  } | null;
};

type DocumentManagerProps = {
  applicationId: string;
  checklistItems: ChecklistItem[];
  documents: DocumentRecord[];
  isAdmin: boolean;
  canUpload: boolean;
};

// ─── Helpers ──────────────────────────────────────────

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (mimeType?.startsWith("image/")) {
    return <Image className="h-4 w-4 text-blue-400" aria-hidden="true" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-400" aria-hidden="true" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────

export function DocumentManager({
  applicationId,
  checklistItems,
  documents,
  isAdmin,
  canUpload,
}: DocumentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("File type not allowed. Please upload PDF, DOCX, PNG, or JPG.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress("Preparing upload...");

    try {
      // Step 1: Get signed upload URL from server
      const { path, token, error: urlError } = await getSignedUploadUrl({
        applicationId,
        fileName: file.name,
      });

      if (urlError || !path || !token) {
        toast.error(urlError ?? "Failed to prepare upload");
        return;
      }

      // Step 2: Upload file directly to Supabase Storage
      setUploadProgress("Uploading file...");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
        });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Step 3: Save metadata in database
      setUploadProgress("Saving record...");
      const result = await saveDocumentMetadata({
        applicationId,
        checklistItemId: selectedChecklistItem || undefined,
        fileName: file.name,
        fileUrl: path,
        fileSize: file.size,
        mimeType: file.type,
      });

      if (result.success) {
        toast.success("Document uploaded successfully");
        setSelectedChecklistItem("");
      } else {
        toast.error(result.error ?? "Failed to save document record");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc: DocumentRecord) {
    setDownloading(doc.id);
    try {
      const { url, error } = await getSignedDownloadUrl(doc.fileUrl);
      if (error || !url) {
        toast.error(error ?? "Failed to generate download link");
        return;
      }
      // Open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Failed to download document");
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete(docId: string) {
    setDeleting(docId);
    try {
      const result = await deleteDocument({ documentId: docId });
      if (result.success) {
        toast.success("Document deleted");
      } else {
        toast.error(result.error ?? "Failed to delete document");
      }
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {canUpload && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Document</Label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {/* Checklist item selector */}
                {checklistItems.length > 0 && (
                  <div className="flex-1 space-y-1.5">
                    <Label
                      htmlFor="checklist-item-select"
                      className="text-xs text-muted-foreground"
                    >
                      Link to checklist item (optional)
                    </Label>
                    <Select
                      value={selectedChecklistItem}
                      onValueChange={(val) => setSelectedChecklistItem(val ?? "")}
                    >
                      <SelectTrigger
                        id="checklist-item-select"
                        className="w-full"
                        aria-label="Select checklist item"
                      >
                        <SelectValue placeholder="No checklist item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No checklist item</SelectItem>
                        {checklistItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* File input + button */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="document-file-input"
                    aria-label="Choose file to upload"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? uploadProgress : "Choose File"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Accepted: PDF, DOCX, PNG, JPG. Maximum 10 MB.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/20"
            >
              {/* File icon */}
              <div className="shrink-0">{getFileIcon(doc.mimeType)}</div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.fileName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>{formatDate(doc.createdAt)}</span>
                  <span>
                    by {doc.uploadedBy.fullName ?? doc.uploadedBy.email}
                  </span>
                  {doc.checklistItem && (
                    <span className="flex items-center gap-1">
                      <Link2 className="h-3 w-3" aria-hidden="true" />
                      {doc.checklistItem.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  aria-label={`Download ${doc.fileName}`}
                >
                  {downloading === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>

                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={deleting === doc.id}
                          aria-label={`Delete ${doc.fileName}`}
                        />
                      }
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{doc.fileName}
                          &rdquo;? This action cannot be undone. The file will be
                          removed from storage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(doc.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
