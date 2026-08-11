import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
import type { BranchRow, StoreRole, StoreRow } from "@/lib/pos-types";

export type Membership = { store: StoreRow; role: StoreRole };

type StoreContextValue = {
  memberships: Membership[];
  branches: BranchRow[];
  store: StoreRow | null;
  branch: BranchRow | null;
  role: StoreRole | null;
  userId: string;
  isLoading: boolean;
  error: Error | null;
  setActiveStore: (storeId: string) => void;
  setActiveBranch: (branchId: string) => void;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

async function fetchMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("store_members")
    .select("role, stores!inner(*)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row): row is typeof row & { stores: StoreRow } => Boolean(row.stores))
    .map((row) => ({ store: row.stores, role: row.role }));
}

async function fetchBranches(storeId: string): Promise<BranchRow[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("store_id", storeId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function StoreProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [storeId, setStoreId] = useState<string | null>(() => activeStoreCache.getStoreId());
  const [branchId, setBranchId] = useState<string | null>(() => activeStoreCache.getBranchId());

  const membershipsQuery = useQuery({
    queryKey: ["memberships", userId],
    queryFn: fetchMemberships,
  });

  const memberships = useMemo(() => membershipsQuery.data ?? [], [membershipsQuery.data]);

  // Reconcile the cached store id against what the user can actually access.
  useEffect(() => {
    if (memberships.length === 0) return;
    const valid = storeId && memberships.some((m) => m.store.id === storeId);
    if (!valid) {
      const next = memberships[0]!.store.id;
      setStoreId(next);
      activeStoreCache.setStoreId(next);
      setBranchId(null);
      activeStoreCache.setBranchId(null);
    }
  }, [memberships, storeId]);

  const branchesQuery = useQuery({
    queryKey: ["branches", storeId],
    queryFn: () => fetchBranches(storeId as string),
    enabled: Boolean(storeId),
  });

  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);

  useEffect(() => {
    if (branches.length === 0) return;
    const valid = branchId && branches.some((b) => b.id === branchId);
    if (!valid) {
      const next = branches[0]!.id;
      setBranchId(next);
      activeStoreCache.setBranchId(next);
    }
  }, [branches, branchId]);

  const setActiveStore = useCallback((next: string) => {
    setStoreId(next);
    activeStoreCache.setStoreId(next);
    setBranchId(null);
    activeStoreCache.setBranchId(null);
  }, []);

  const setActiveBranch = useCallback((next: string) => {
    setBranchId(next);
    activeStoreCache.setBranchId(next);
  }, []);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const membership = memberships.find((m) => m.store.id === storeId) ?? null;

  const value: StoreContextValue = {
    memberships,
    branches,
    store: membership?.store ?? null,
    branch: branches.find((b) => b.id === branchId) ?? null,
    role: membership?.role ?? null,
    userId,
    isLoading: membershipsQuery.isLoading || (Boolean(storeId) && branchesQuery.isLoading),
    error: (membershipsQuery.error as Error | null) ?? (branchesQuery.error as Error | null),
    setActiveStore,
    setActiveBranch,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used inside <StoreProvider>");
  return ctx;
}
