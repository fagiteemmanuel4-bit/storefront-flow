import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/currency";

export type ExportRange = { from: Date | null; to: Date | null; label: string };

type StoreInfo = { id: string; name: string; currency: string };

const HEADER_FILL = "FF1B1B1B";
const ACCENT_FILL = "FFF6C445";

function styleHeader(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF444444" } } };
  });
}

function finish(sheet: ExcelJS.Worksheet, headerRowNumber = 1) {
  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: sheet.columnCount },
  };
}

/** Builds and triggers download of a multi-sheet workbook for the store. */
export async function downloadStoreWorkbook(store: StoreInfo, range: ExportRange): Promise<void> {
  const [productsRes, stockRes, branchesRes] = await Promise.all([
    supabase.from("products").select("*").eq("store_id", store.id).order("name"),
    supabase.from("branch_stock").select("*").eq("store_id", store.id),
    supabase.from("branches").select("*").eq("store_id", store.id).order("created_at"),
  ]);
  for (const res of [productsRes, stockRes, branchesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  let salesQuery = supabase
    .from("sales")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });
  if (range.from) salesQuery = salesQuery.gte("created_at", range.from.toISOString());
  if (range.to) salesQuery = salesQuery.lte("created_at", range.to.toISOString());
  const salesRes = await salesQuery;
  if (salesRes.error) throw new Error(salesRes.error.message);
  const sales = salesRes.data ?? [];

  const saleIds = sales.map((s) => s.id);
  let items: {
    sale_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[] = [];
  if (saleIds.length > 0) {
    const itemsRes = await supabase
      .from("sale_items")
      .select("sale_id, product_name, quantity, unit_price, line_total")
      .in("sale_id", saleIds);
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    items = itemsRes.data ?? [];
  }

  const products = productsRes.data ?? [];
  const stock = stockRes.data ?? [];
  const branches = branchesRes.data ?? [];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const stockByProduct = new Map<string, number>();
  for (const row of stock) {
    stockByProduct.set(row.product_id, (stockByProduct.get(row.product_id) ?? 0) + row.quantity);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Strap";
  wb.created = new Date();

  /* ---------- Summary ---------- */
  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ width: 30 }, { width: 30 }];
  summary.mergeCells("A1:B1");
  const titleCell = summary.getCell("A1");
  titleCell.value = `${store.name} — store export`;
  titleCell.font = { bold: true, size: 16 };
  summary.getRow(1).height = 28;
  summary.mergeCells("A2:B2");
  summary.getCell("A2").value = `Period: ${range.label}`;
  summary.getCell("A2").font = { color: { argb: "FF666666" } };

  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const unitsSold = items.reduce((sum, i) => sum + i.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * (stockByProduct.get(p.id) ?? 0),
    0,
  );
  const lowStock = products.filter(
    (p) => (stockByProduct.get(p.id) ?? 0) <= (p.low_stock_threshold ?? 0),
  ).length;

  const rows: [string, string | number][] = [
    ["Generated", new Date().toLocaleString()],
    ["Currency", store.currency],
    ["Products", products.length],
    ["Locations", branches.length],
    ["Sales in period", sales.length],
    ["Units sold", unitsSold],
    ["Revenue", formatMoney(revenue, store.currency)],
    ["Inventory value (retail)", formatMoney(inventoryValue, store.currency)],
    ["Low / out of stock lines", lowStock],
  ];
  summary.addRow([]);
  for (const [label, value] of rows) {
    const r = summary.addRow([label, value]);
    r.getCell(1).font = { bold: true };
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F3EC" } };
  }
  summary.getCell(`A${summary.rowCount - rows.length + 3}`);

  /* ---------- Products ---------- */
  const sheet = wb.addWorksheet("Products");
  sheet.columns = [
    { header: "Name", key: "name", width: 32 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Barcode", key: "barcode", width: 18 },
    { header: "Category", key: "category", width: 18 },
    { header: "Cost", key: "cost", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Price", key: "price", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Margin %", key: "margin", width: 12, style: { numFmt: "0.0" } },
    { header: "Stock", key: "stock", width: 10 },
    { header: "Stock value", key: "value", width: 16, style: { numFmt: "#,##0.00" } },
    { header: "Low stock at", key: "low", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];
  for (const p of products) {
    const qty = stockByProduct.get(p.id) ?? 0;
    const price = Number(p.price);
    const cost = Number(p.cost);
    const row = sheet.addRow({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      cost,
      price,
      margin: price > 0 ? ((price - cost) / price) * 100 : 0,
      stock: qty,
      value: qty * price,
      low: p.low_stock_threshold,
      status: !p.is_active
        ? "Inactive"
        : qty <= 0
          ? "Out of stock"
          : qty <= p.low_stock_threshold
            ? "Low"
            : "OK",
    });
    if (qty <= p.low_stock_threshold) {
      row.getCell("status").font = { bold: true, color: { argb: "FFB3261E" } };
    }
  }
  styleHeader(sheet.getRow(1));
  const totalRow = sheet.addRow({
    name: "TOTAL",
    stock: products.reduce((s, p) => s + (stockByProduct.get(p.id) ?? 0), 0),
    value: inventoryValue,
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_FILL } };
  });
  finish(sheet);

  /* ---------- Stock by location ---------- */
  const stockSheet = wb.addWorksheet("Stock by location");
  stockSheet.columns = [
    { header: "Location", key: "branch", width: 24 },
    { header: "Product", key: "product", width: 32 },
    { header: "Quantity", key: "qty", width: 12 },
  ];
  const productName = new Map(products.map((p) => [p.id, p.name]));
  for (const row of stock) {
    stockSheet.addRow({
      branch: branchName.get(row.branch_id) ?? "—",
      product: productName.get(row.product_id) ?? "—",
      qty: row.quantity,
    });
  }
  styleHeader(stockSheet.getRow(1));
  finish(stockSheet);

  /* ---------- Sales ---------- */
  const salesSheet = wb.addWorksheet("Sales");
  salesSheet.columns = [
    { header: "Reference", key: "ref", width: 20 },
    { header: "Date", key: "date", width: 22 },
    { header: "Location", key: "branch", width: 22 },
    { header: "Payment", key: "pay", width: 14 },
    { header: "Subtotal", key: "sub", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Tax", key: "tax", width: 12, style: { numFmt: "#,##0.00" } },
    { header: "Total", key: "total", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Note", key: "note", width: 28 },
  ];
  for (const s of sales) {
    salesSheet.addRow({
      ref: s.reference,
      date: new Date(s.created_at).toLocaleString(),
      branch: branchName.get(s.branch_id) ?? "—",
      pay: s.payment_method,
      sub: Number(s.subtotal),
      tax: Number(s.tax),
      total: Number(s.total),
      note: s.note,
    });
  }
  styleHeader(salesSheet.getRow(1));
  const salesTotal = salesSheet.addRow({ ref: "TOTAL", total: revenue });
  salesTotal.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_FILL } };
  });
  finish(salesSheet);

  /* ---------- Sold items ---------- */
  const itemsSheet = wb.addWorksheet("Sold items");
  itemsSheet.columns = [
    { header: "Product", key: "product", width: 32 },
    { header: "Units sold", key: "qty", width: 14 },
    { header: "Revenue", key: "revenue", width: 16, style: { numFmt: "#,##0.00" } },
  ];
  const agg = new Map<string, { qty: number; revenue: number }>();
  for (const i of items) {
    const current = agg.get(i.product_name) ?? { qty: 0, revenue: 0 };
    current.qty += i.quantity;
    current.revenue += Number(i.line_total);
    agg.set(i.product_name, current);
  }
  for (const [name, v] of [...agg.entries()].sort((a, b) => b[1].revenue - a[1].revenue)) {
    itemsSheet.addRow({ product: name, qty: v.qty, revenue: v.revenue });
  }
  styleHeader(itemsSheet.getRow(1));
  finish(itemsSheet);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug =
    store.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "store";
  link.href = url;
  link.download = `${slug}-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
