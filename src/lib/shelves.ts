import { supabase } from "@/integrations/supabase/client";

export type Shelf = { id: string; name: string; store_id: string };

/** Shelves are user-named groupings of products inside one shop. */
export async function fetchShelves(storeId: string): Promise<Shelf[]> {
  const { data, error } = await supabase
    .from("shelves")
    .select("id, name, store_id")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createShelf(storeId: string, name: string): Promise<Shelf> {
  const clean = name.trim();
  if (!clean) throw new Error("Give the shelf a name first.");
  const { data, error } = await supabase
    .from("shelves")
    .insert({ store_id: storeId, name: clean })
    .select("id, name, store_id")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The shelf was not created. Please try again.");
  return data;
}
