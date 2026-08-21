import type { Json } from "@/integrations/supabase/types";

export type OnlineStoreRow = { id: string; store_id: string; slug: string; display_name: string; logo_url: string; display_email: string; display_phone: string; description: string; shipping_note: string; checkout_note: string; is_published: boolean; setup_completed: boolean; terms_version: string; privacy_version: string; accepted_terms_at: string | null; accepted_privacy_at: string | null; created_at: string; updated_at: string };
export type OnlineProductRow = { id: string; store_id: string; product_id: string; enabled: boolean; featured: boolean; description: string; created_at: string; updated_at: string };
export type OnlineOrderRow = { id: string; store_id: string; online_store_id: string; order_number: string; customer_name: string; customer_email: string; customer_phone: string; shipping_address: string; customer_note: string; payment_method: string; status: string; subtotal: number; shipping_fee: number; total: number; created_at: string; updated_at: string };
export type OnlineOrderItemRow = { id: string; order_id: string; store_id: string; product_id: string; product_name: string; unit_price: number; quantity: number; line_total: number };
export type OnlineCatalogRow = { store_id: string; slug: string; display_name: string; logo_url: string; display_email: string; display_phone: string; store_description: string; currency: string; product_id: string; name: string; sku: string; category: string; price: number; image_url: string; image_urls: string[]; featured: boolean; description: string };
export type PublicStoreCatalogRow = { product_id: string; name: string; category: string; price: number; image_url: string; image_urls: string[]; featured: boolean; description: string; stock_quantity: number };
export type OnlineStoreHeroRow = { store_id: string; slug: string; id: string; image_url: string; title: string; subtitle: string; sort_order: number };
export type StorefrontConfigRow = { id: string; store_id: string; template: string; theme: Json; branding: Json; navigation: Json; sections: Json; seo: Json; custom_css: string; is_published: boolean; version: number; created_at: string; updated_at: string };

export type OnlineDatabase = {
  public: {
    Tables: {
      online_stores: { Row: OnlineStoreRow; Insert: Partial<OnlineStoreRow> & Pick<OnlineStoreRow,"store_id"|"slug"|"display_name">; Update: Partial<OnlineStoreRow>; Relationships: [] };
      online_products: { Row: OnlineProductRow; Insert: Partial<OnlineProductRow> & Pick<OnlineProductRow,"store_id"|"product_id">; Update: Partial<OnlineProductRow>; Relationships: [] };
      online_orders: { Row: OnlineOrderRow; Insert: Partial<OnlineOrderRow>; Update: Partial<OnlineOrderRow>; Relationships: [] };
      online_order_items: { Row: OnlineOrderItemRow; Insert: Partial<OnlineOrderItemRow> & Pick<OnlineOrderItemRow,"order_id"|"store_id"|"product_id"|"product_name"|"unit_price"|"quantity"|"line_total">; Update: Partial<OnlineOrderItemRow>; Relationships: [] };
      product_images: { Row: { id: string; product_id: string; store_id: string; image_url: string; sort_order: number; created_at: string }; Insert: Partial<{ id: string; product_id: string; store_id: string; image_url: string; sort_order: number; created_at: string }>; Update: Partial<{ image_url: string; sort_order: number }>; Relationships: [] };
      store_hero_banners: { Row: { id: string; store_id: string; image_url: string; title: string; subtitle: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }; Insert: Partial<{ id: string; store_id: string; image_url: string; title: string; subtitle: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }>; Update: Partial<{ image_url: string; title: string; subtitle: string; sort_order: number; is_active: boolean; updated_at: string }>; Relationships: [] };
      storefront_configs: { Row: StorefrontConfigRow; Insert: Partial<StorefrontConfigRow> & Pick<StorefrontConfigRow,"store_id">; Update: Partial<StorefrontConfigRow>; Relationships: [] };
    };
    Views: {
      online_catalog: { Row: OnlineCatalogRow; Insert: never; Update: never; Relationships: [] };
      online_store_heroes: { Row: OnlineStoreHeroRow; Insert: never; Update: never; Relationships: [] };
      public_storefront_configs: { Row: Pick<StorefrontConfigRow,"store_id"|"template"|"theme"|"branding"|"navigation"|"sections"|"seo"|"version"|"updated_at">; Insert: never; Update: never; Relationships: [] };
    };
    Functions: {
      create_online_order: { Args: { _slug: string; _customer_name: string; _customer_email: string; _customer_phone: string; _shipping_address: string; _customer_note: string; _payment_method: string; _items: Json }; Returns: string };
      get_public_store_catalog: { Args: { _slug: string }; Returns: PublicStoreCatalogRow[] };
      upsert_storefront_config: { Args: { _store_id: string; _template: string; _theme: Json; _branding: Json; _navigation: Json; _sections: Json; _seo: Json; _custom_css: string; _publish: boolean }; Returns: StorefrontConfigRow };
    };
    Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  };
};
