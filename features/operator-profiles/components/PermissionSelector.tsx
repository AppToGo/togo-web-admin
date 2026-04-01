"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PermissionCatalog, ProfilePermission } from "../types";

interface PermissionSelectorProps {
  permissions: PermissionCatalog[];
  selectedPermissions: ProfilePermission[];
  onChange: (permissions: ProfilePermission[]) => void;
  searchQuery?: string;
}

interface GroupedPermissions {
  [domain: string]: PermissionCatalog[];
}

export function PermissionSelector({
  permissions,
  selectedPermissions,
  onChange,
  searchQuery: externalSearchQuery,
}: PermissionSelectorProps) {
  const t = useTranslations("operatorProfiles");
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
    // Expand all domains by default
    const domains = new Set<string>();
    permissions.forEach((p) => domains.add(p.domain));
    return domains;
  });

  const searchQuery = externalSearchQuery ?? internalSearchQuery;

  // Group permissions by domain
  const groupedPermissions = useMemo(() => {
    const grouped: GroupedPermissions = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.domain]) {
        grouped[permission.domain] = [];
      }
      grouped[permission.domain].push(permission);
    });
    return grouped;
  }, [permissions]);

  // Filter permissions based on search query
  const filteredGroupedPermissions = useMemo(() => {
    if (!searchQuery.trim()) return groupedPermissions;

    const query = searchQuery.toLowerCase();
    const filtered: GroupedPermissions = {};

    Object.entries(groupedPermissions).forEach(([domain, domainPermissions]) => {
      const matching = domainPermissions.filter(
        (p) =>
          p.code.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.domain.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[domain] = matching;
      }
    });

    return filtered;
  }, [groupedPermissions, searchQuery]);

  // Check if a permission is selected
  const isPermissionSelected = useCallback(
    (code: string) => {
      return selectedPermissions.some((p) => p.permissionCode === code);
    },
    [selectedPermissions]
  );

  // Toggle a single permission
  const togglePermission = useCallback(
    (permission: PermissionCatalog) => {
      const isSelected = isPermissionSelected(permission.code);
      if (isSelected) {
        onChange(
          selectedPermissions.filter((p) => p.permissionCode !== permission.code)
        );
      } else {
        onChange([
          ...selectedPermissions,
          {
            id: `${Date.now()}-${permission.code}`,
            permissionCode: permission.code,
            params: permission.requiresParams ? {} : undefined,
          },
        ]);
      }
    },
    [isPermissionSelected, selectedPermissions, onChange]
  );

  // Toggle all permissions in a domain
  const toggleDomain = useCallback(
    (domain: string) => {
      const domainPermissions = groupedPermissions[domain] || [];
      const domainCodes = domainPermissions.map((p) => p.code);
      const selectedCodes = selectedPermissions.map((p) => p.permissionCode);

      const allSelected = domainCodes.every((code) =>
        selectedCodes.includes(code)
      );

      if (allSelected) {
        // Remove all permissions from this domain
        onChange(
          selectedPermissions.filter(
            (p) => !domainCodes.includes(p.permissionCode)
          )
        );
      } else {
        // Add all missing permissions from this domain
        const existingCodes = new Set(selectedCodes);
        const newPermissions = domainPermissions
          .filter((p) => !existingCodes.has(p.code))
          .map((p) => ({
            id: `${Date.now()}-${p.code}`,
            permissionCode: p.code,
            params: p.requiresParams ? {} : undefined,
          }));
        onChange([...selectedPermissions, ...newPermissions]);
      }
    },
    [groupedPermissions, selectedPermissions, onChange]
  );

  // Check if all permissions in a domain are selected
  const isDomainFullySelected = useCallback(
    (domain: string) => {
      const domainPermissions = groupedPermissions[domain] || [];
      const selectedCodes = new Set(
        selectedPermissions.map((p) => p.permissionCode)
      );
      return (
        domainPermissions.length > 0 &&
        domainPermissions.every((p) => selectedCodes.has(p.code))
      );
    },
    [groupedPermissions, selectedPermissions]
  );

  // Check if some (but not all) permissions in a domain are selected
  const isDomainPartiallySelected = useCallback(
    (domain: string) => {
      const domainPermissions = groupedPermissions[domain] || [];
      const selectedCodes = new Set(
        selectedPermissions.map((p) => p.permissionCode)
      );
      const selectedCount = domainPermissions.filter((p) =>
        selectedCodes.has(p.code)
      ).length;
      return selectedCount > 0 && selectedCount < domainPermissions.length;
    },
    [groupedPermissions, selectedPermissions]
  );

  // Toggle domain expansion
  const toggleDomainExpansion = useCallback((domain: string) => {
    setExpandedDomains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  }, []);

  // Get domain icon/label
  const getDomainLabel = (domain: string) => {
    return t(`domains.${domain}`, { defaultValue: domain });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      {externalSearchQuery === undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("permissions.searchPlaceholder")}
            value={internalSearchQuery}
            onChange={(e) => setInternalSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          {t("permissions.selectedCount", { count: selectedPermissions.length })}
        </span>
        <span className="text-slate-400">
          {t("permissions.totalCount", { count: permissions.length })}
        </span>
      </div>

      {/* Permission Groups */}
      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-3">
          {Object.entries(filteredGroupedPermissions).map(([domain, domainPermissions]) => (
            <div
              key={domain}
              className="border border-slate-200 rounded-lg overflow-hidden bg-white/50"
            >
              {/* Domain Header */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 bg-slate-50/80 cursor-pointer select-none",
                  "hover:bg-slate-100/80 transition-colors"
                )}
                onClick={() => toggleDomainExpansion(domain)}
              >
                <button
                  type="button"
                  className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDomainExpansion(domain);
                  }}
                >
                  {expandedDomains.has(domain) ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-slate-900">
                    {getDomainLabel(domain)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {domainPermissions.length}
                  </Badge>
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`domain-${domain}`}
                    checked={isDomainFullySelected(domain)}
                    data-state={
                      isDomainPartiallySelected(domain) ? "indeterminate" : undefined
                    }
                    onCheckedChange={() => toggleDomain(domain)}
                  />
                  <Label
                    htmlFor={`domain-${domain}`}
                    className="text-xs text-slate-600 cursor-pointer"
                  >
                    {t("permissions.selectAll")}
                  </Label>
                </div>
              </div>

              {/* Domain Permissions */}
              {expandedDomains.has(domain) && (
                <div className="divide-y divide-slate-100">
                  {domainPermissions.map((permission) => (
                    <div
                      key={permission.code}
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 hover:bg-slate-50/50 transition-colors",
                        isPermissionSelected(permission.code) && "bg-indigo-50/30"
                      )}
                    >
                      <Checkbox
                        id={`permission-${permission.code}`}
                        checked={isPermissionSelected(permission.code)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`permission-${permission.code}`}
                          className="text-sm font-medium text-slate-900 cursor-pointer flex items-center gap-2"
                        >
                          {permission.code}
                          {permission.requiresParams && (
                            <Lock className="w-3 h-3 text-amber-500" />
                          )}
                        </Label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {permission.description}
                        </p>
                      </div>
                      {isPermissionSelected(permission.code) && (
                        <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(filteredGroupedPermissions).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>{t("permissions.noResults")}</p>
              {searchQuery && (
                <p className="text-sm mt-1">
                  {t("permissions.tryDifferentSearch")}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
