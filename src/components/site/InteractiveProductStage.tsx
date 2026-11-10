import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleCheck,
  ClipboardList,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";

type PreviewTab = "overview" | "inventory" | "orders";

export function InteractiveProductStage() {
  const [tab, setTab] = useState<PreviewTab>("overview");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = stage.getBoundingClientRect();
        const progress = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
        stage.style.setProperty("--stage-scroll", `${(progress - 0.5) * 12}px`);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--stage-rotate-x", `${-y * 5}deg`);
    event.currentTarget.style.setProperty("--stage-rotate-y", `${x * 7}deg`);
  }

  function resetPointer(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--stage-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--stage-rotate-y", "0deg");
  }

  return (
    <div
      ref={stageRef}
      className="product-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label="Interactive preview of the Strap retail workspace"
    >
      <div className="product-stage__ambient" aria-hidden="true" />
      <div className="product-stage__device">
        <div className="product-stage__topbar">
          <div className="product-stage__brand">
            <img src="/brand/logo-mark-inverse.svg" alt="" width="26" height="26" />
            <span>Strap workspace</span>
          </div>
          <span className="product-stage__sample">Illustrative preview</span>
        </div>

        <div className="product-stage__app">
          <aside className="product-stage__sidebar" aria-hidden="true">
            <span className="product-stage__store"><Store size={15} /> Northside Market</span>
            <span className="product-stage__nav product-stage__nav--active"><BarChart3 size={15} /> Overview</span>
            <span className="product-stage__nav"><ShoppingBag size={15} /> Sales</span>
            <span className="product-stage__nav"><Boxes size={15} /> Inventory</span>
            <span className="product-stage__nav"><Users size={15} /> Customers</span>
            <span className="product-stage__nav"><ClipboardList size={15} /> Online orders</span>
            <span className="product-stage__nav"><Wallet size={15} /> Expenses</span>
          </aside>

          <div className="product-stage__content">
            <div className="product-stage__heading">
              <div>
                <p className="product-stage__eyebrow">YOUR BUSINESS, CONNECTED</p>
                <h2>Store overview</h2>
              </div>
              <span className="product-stage__status"><span /> Workspace preview</span>
            </div>

            <div className="product-stage__tabs" role="tablist" aria-label="Preview a Strap workflow">
              {([
                ["overview", "Overview"],
                ["inventory", "Inventory"],
                ["orders", "Orders"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  id={`strap-preview-tab-${value}`}
                  aria-controls="strap-preview-panel"
                  tabIndex={tab === value ? 0 : -1}
                  onClick={() => setTab(value)}
                  className={tab === value ? "is-active" : ""}
                >
                  {label}
                </button>
              ))}
            </div>

            <div id="strap-preview-panel" className="product-stage__panel" role="tabpanel" aria-labelledby={`strap-preview-tab-${tab}`}>
              {tab === "overview" && (
                <>
                  <div className="product-stage__metrics">
                    <Metric label="Sales today" value="₦248,500" change="Sample total" icon={Wallet} />
                    <Metric label="Transactions" value="36" change="Sample activity" icon={ShoppingCart} />
                    <Metric label="Stock alerts" value="4" change="Needs attention" icon={Boxes} />
                  </div>
                  <div className="product-stage__chart-card">
                    <div className="product-stage__chart-heading">
                      <div><strong>Sales activity</strong><span>Illustrative weekly view</span></div>
                      <Activity size={17} />
                    </div>
                    <div className="product-stage__bars" aria-label="Illustrative sales chart">
                      {[38, 54, 44, 76, 61, 88, 68].map((height, index) => (
                        <span key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                    <div className="product-stage__chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                  </div>
                </>
              )}

              {tab === "inventory" && (
                <div className="product-stage__list-card">
                  <div className="product-stage__list-heading"><strong>Inventory overview</strong><span>Sample catalogue</span></div>
                  {[
                    ["House blend coffee · 500g", "SKU 00184", "In stock", "good"],
                    ["Everyday rice · 5kg", "SKU 00231", "Low stock", "low"],
                    ["Sparkling water · 6 pack", "SKU 00302", "In stock", "good"],
                  ].map(([name, sku, status, tone]) => (
                    <div className="product-stage__product-row" key={sku}>
                      <span className="product-stage__product-icon"><Package size={16} /></span>
                      <span className="product-stage__product-name"><strong>{name}</strong><small>{sku}</small></span>
                      <span className={`product-stage__stock product-stage__stock--${tone}`}>{status}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === "orders" && (
                <div className="product-stage__list-card">
                  <div className="product-stage__list-heading"><strong>Recent online orders</strong><span>Sample orders</span></div>
                  {[
                    ["Order #1048", "Today · 10:42 AM", "New"],
                    ["Order #1047", "Today · 9:18 AM", "Processing"],
                    ["Order #1046", "Yesterday · 4:06 PM", "Completed"],
                  ].map(([name, time, status]) => (
                    <div className="product-stage__order-row" key={name}>
                      <span className="product-stage__order-icon"><ShoppingBag size={16} /></span>
                      <span><strong>{name}</strong><small>{time}</small></span>
                      <span className="product-stage__order-status">{status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="product-stage__footnote">
              <CircleCheck size={14} />
              <span>One workspace for sales, stock, customers and online orders.</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>
      <div className="product-stage__floating product-stage__floating--left" aria-hidden="true">
        <span className="product-stage__floating-icon"><Boxes size={16} /></span>
        <span><strong>Stock stays connected</strong><small>Across your operation</small></span>
        <ArrowDownRight size={15} />
      </div>
      <div className="product-stage__floating product-stage__floating--right" aria-hidden="true">
        <span className="product-stage__floating-icon"><Search size={16} /></span>
        <span><strong>Find what matters</strong><small>At a glance</small></span>
        <ArrowUpRight size={15} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="product-stage__metric">
      <span className="product-stage__metric-icon"><Icon size={15} /></span>
      <span className="product-stage__metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </div>
  );
}
