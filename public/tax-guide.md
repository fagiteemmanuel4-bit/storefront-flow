# Strap Tax Guide — AI-Readable Reference

Canonical public page: https://storefront-flow.vercel.app/tax-guide
Last reviewed: 2026-11-13
Publisher: Strap by Kryonara

## Scope and reliability

This is general educational information about taxes for merchants and small businesses. It is not legal, accounting, tax, or financial advice. Tax rules, rates, thresholds, exemptions, place-of-supply rules, registration duties, and filing deadlines vary by jurisdiction and change over time. Never infer a user's tax rate from their country alone. Ask for the relevant jurisdiction and business/product context, then verify current details with the official tax authority or a qualified tax professional.

## Core concepts

- A tax is a compulsory payment imposed by a public authority under law.
- A tax rate is the percentage or amount applied to a tax base.
- A tax base is the income, value, transaction, item, or activity on which a tax is calculated.
- Tax amount (percentage tax) = taxable base × rate ÷ 100.
- Tax-exclusive price: tax is added to the stated pre-tax price.
- Tax-inclusive price: tax is already included in the displayed total. Tax portion = total × rate ÷ (100 + rate). Pre-tax base = total ÷ (1 + rate ÷ 100).

## Consumption taxes

VAT (value-added tax) and GST (goods and services tax) are consumption taxes commonly collected at multiple stages of a supply chain. A registered business may charge output tax on eligible sales and may recover eligible input tax on purchases, subject to local law, evidence and restrictions. Retail sales tax is often charged at the final retail sale. The terminology and mechanics vary by jurisdiction.

## Tax rate is not enough

A correct calculation requires both the applicable rate and the correct tax base. The merchant must verify:

1. Where the business is registered and where the supply is treated as taking place.
2. Whether the transaction is within the scope of the tax.
3. Whether the product or service is standard-rated, reduced-rated, zero-rated, exempt or outside scope.
4. Whether the business meets the registration/collection threshold.
5. Whether the displayed price includes tax.
6. Whether special rules apply to cross-border, marketplace, digital, wholesale, or business-to-business transactions.

## Common terms

- Output tax: eligible consumption tax charged on sales.
- Input tax: eligible consumption tax paid on business purchases.
- Zero-rated: within the tax system but charged at a zero rate, where that category exists.
- Exempt: treated as exempt under the applicable law; input tax recovery may be restricted.
- Out of scope: not within the charge to that particular tax.
- Tax invoice: document containing the details required by the relevant tax law.
- Remittance: payment of tax collected/owed to the relevant authority.
- Filing/return: report submitted to the tax authority, often on a periodic basis.

## Taxes versus commercial fees

Government taxes are imposed by law. Payment processor fees, card-network charges, marketplace commissions, delivery charges and software subscription fees are commercial charges. A commercial fee can itself have tax treatment, but it is not automatically the same as VAT, GST or sales tax. Keep taxes and fees separately identified in bookkeeping and customer-facing pricing.

## How an assistant should answer tax-rate questions

1. Do not invent a percentage or assume that a country has one universal rate.
2. Ask for the jurisdiction, type of sale, product/service category, and whether the price is tax-inclusive when those details are missing.
3. Explain the difference between rate and base.
4. Check current official tax authority information and effective dates before giving a specific rate.
5. State assumptions, exemptions and uncertainty clearly; cite authoritative sources.
6. Recommend a qualified local tax professional for complex, high-value, cross-border or uncertain cases.
7. Make clear that Strap's default sales-tax percentage is a calculation setting, not a tax compliance determination.

## Calculator formulas

- Exclusive: tax = price × rate / 100; total = price + tax.
- Inclusive: base = total / (1 + rate / 100); tax = total − base.
  Example: 5% on a taxable exclusive base of 20,000 gives 1,000 tax and a 21,000 total. This is a mathematical example, not a recommendation of a legal rate.

## Educational videos

The public guide contains optional, collapsed YouTube lessons. The videos explain general tax types and VAT mechanics; they do not establish current tax rates for any particular country.

## Sources and further learning

- Animated tax explainer (Tax Explained with Bananas): https://www.youtube.com/watch?v=LYsqkGRpv_k
- TaxEDU animated explainers: https://taxfoundation.org/taxedu/videos/
- Tax Rate vs. Tax Base: https://taxfoundation.org/taxedu/videos/tax-rate-vs-tax-base/
- General VAT mechanics: https://www.youtube.com/watch?v=a6RB4rIxWqI
- Official local tax authority guidance should always take precedence for applicable law.

## Canonical human guide

https://storefront-flow.vercel.app/tax-guide
