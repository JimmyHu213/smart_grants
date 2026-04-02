"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  UserPlus,
  Building2,
  Users,
  GitBranch,
} from "lucide-react";
import { CompanyFormDialog, type CompanyWithUsers } from "./company-form-dialog";
import { CreateUserDialog } from "./create-user-dialog";

// ─── Component ─────────────────────────────────────────

export function CompaniesPageClient({
  companies,
}: {
  companies: CompanyWithUsers[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyWithUsers | null>(null);
  const [addUserTarget, setAddUserTarget] = useState<CompanyWithUsers | null>(
    null
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Companies</h2>
          <p className="text-sm text-muted-foreground">
            {companies.length} {companies.length !== 1 ? "companies" : "company"}{" "}
            registered
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Company
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c.profiles.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Applications
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c._count.applications, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Company</TableHead>
              <TableHead>ABN</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Indigenous</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No companies yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium leading-snug">
                        {company.name}
                      </p>
                      {company.profiles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {company.profiles.map((profile) => (
                            <span
                              key={profile.id}
                              className="text-xs text-muted-foreground"
                            >
                              {profile.email}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {company.abn ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {company.jurisdiction ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {company.industry ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {company.indigenousOwnership ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {company.profiles.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {company._count.applications}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${company.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditCompany(company)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAddUserTarget(company)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <CompanyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      {/* Edit Dialog */}
      {editCompany && (
        <CompanyFormDialog
          open={!!editCompany}
          onOpenChange={(open) => {
            if (!open) setEditCompany(null);
          }}
          mode="edit"
          company={editCompany}
        />
      )}

      {/* Add User Dialog */}
      {addUserTarget && (
        <CreateUserDialog
          open={!!addUserTarget}
          onOpenChange={(open) => {
            if (!open) setAddUserTarget(null);
          }}
          companyId={addUserTarget.id}
          companyName={addUserTarget.name}
        />
      )}
    </div>
  );
}
