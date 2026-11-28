# APM Order Studio — UI/UX mockup

A clickable prototype for ordering real-estate marketing materials. It uses plain HTML/CSS/JS with no build step and no backend. All listings, people, prices, QR codes, and addresses are fictional, and payments and link checks are simulated.

## Run it

Open `index.html` in a browser. To serve it over HTTP instead:

```bash
python3 -m http.server 4391 --bind 127.0.0.1
```

Then visit http://127.0.0.1:4391. **Design notes** in the header gives a short tour of the scenarios.

| File | Contents |
| --- | --- |
| `data.js` | Fictional listings, agent, catalog, papers, mailing classes, credits, billing accounts, lists |
| `art.js` | Inline-SVG "photography", product illustrations, icons, simulated QR, radius map |
| `proof.js` | Flyer / tri-fold brochure / postcard proofs, sized with container-query units so one renderer works for full proofs and thumbnails |
| `app.js` | State, derived pricing/validation, views, and actions |
| `styles.css` | Theme tokens, layout, components, proof templates |

## Directions explored

1. **A · Proof Studio (built).** A three-pane workspace: an order rail on the left, a large live proof in the center, and configuration on the right with a sticky price and next action. It keeps the light/charcoal look with a deeper, calmer green.
2. **B · Guided Wizard.** One decision per screen, with large cards and conversational prompts. It's the friendliest option for agents who order occasionally, but it's slow for coordinators and hides the proof while you configure.
3. **C · Order Board.** A spreadsheet-style grid of listing × product rows with inline settings and bulk actions. It's the fastest for repeat coordinators, but the proof shrinks to a thumbnail, which works against proof review.

A was chosen because it keeps the proof and its configuration visible together. It works for both audiences, and the rail gives coordinators the multi-product overview that C was aiming for.

## Connected views

1. **Listing & products:** listing/event cards (address, event type, date, price), a three-column product catalog with multi-select, Free badges, and a sticky selection bar.
2. **Customize workspace:** the order rail with per-product status and cart subtotal, the proof (Fit/Actual size, Outside/Inside for brochures), templates with "save as default," QR code, Mail/Ship/Pickup/Download, and distribution-specific options. A sticky footer shows the open items, the price, an expandable "How is this priced?", and the next step.
3. **Recipients:** saved lists (name, count, created date, select, edit) and a live summary of how the selection changes printed pieces and cost. Create a list from Upload / Radius / Street / Demographics / CRM; **Radius** is fully developed with a map, filters, a results preview, and "Save list & add to Brochures."
4. **Review & checkout:** Products / Credits / Payment steps with a persistent summary. It covers promo code, store credit, and ad budget with remaining balances; saved cards, adding a card, splitting across two methods, and corporate billing with cost center and a note to the approver; then the acknowledgement and **Submit for Approval** (or **Place order** when paying only by card).
5. **Confirmation:** an approval timeline with what happens next.

## Scenarios covered

| # | Scenario | Where |
| --- | --- | --- |
| 1 | 128 Willow Lane, Jordan Ellis / Cedar Realty, Flyers + Brochures | Start → Customize |
| 2 | 100 flyers shipped; paper choice; PDF add-on; price lines | Flyers → Ship |
| 3 | 100 saved + 50 radius + 1 sample = **151 printed**; missing sample address → "Use Cedar Realty office" | Brochures → Mail |
| 4 | Radius around the listing: 50 single-family homes, listing excluded, map preview, back into the order | Brochures → Change or add lists → Create a list |
| 5 | QR link fails (`/listngs/`); suggestion or explicit override; Generate & save; delete with confirmation | Flyers → QR code |
| 6 | Checkout arithmetic, computed live | Review & checkout |

Default checkout numbers after scenarios 1–4: $204.50 subtotal (printing $146.72, postage $43.79, shipping $9.00, add-ons $4.99) + $12.52 tax (8.25% on printing and add-ons only) = $217.02. After −$10 promo, −$20 store credit, and −$30 ad budget, **$157.02** remains, paid by corporate billing or split with a card. The structure matches the brief's $120 + $10 − $10 − $20 − $30 = $70 example, but every figure here is derived from the configured products, so the totals stay consistent as you change options.

## Key UX decisions

- **Listing context is always visible.** A context bar under the header shows the address, event, date, and agent on every screen after the start. Listing facts are locked in the editor and flow into every product.
- **Proof first, configuration beside it.** The proof is scaled to the viewport, not shown as an oversized image. Template thumbnails are real miniature renders, so a template choice previews what you'll get.
- **One status model everywhere.** Each product computes a list of open items, such as an unsaved QR, a missing sample address, no lists, an unavailable paper, or an unapproved proof. The same list drives the rail pills, the panel footer, the review page, and the checkout blockers. Every item has a **Fix** link that jumps to the field and highlights it.
- **Distribution in plain language.** Each option says what physically happens ("We print and mail one piece to each address on your lists" vs. "A bulk box of prints delivered to you").
- **Quantity is explained, not just shown.** A composition bar and equation (100 + 50 + 1 sample = 151 printed) appear for Mail. The recipients screen shows the cost change before you commit.
- **Price transparency.** Paper and mailing-class options show per-piece prices. "How is this priced?" itemizes printing, postage, shipping, and add-ons. Checkout states what tax applies to.
- **Recoverable states, no technical errors.** Unavailable paper explains why and what to do. Invalid and unreachable links are worded for people, and the override is an explicit, labeled choice. Changing a design after approval visibly un-approves it ("Proof changed since your approval").
- **Progressive disclosure.** QR controls are collapsible, list creation sits behind a tab, split payment sits behind a toggle, and corporate details appear only when a corporate account is used. The editor and notes are the only modals; recipients is a full page with a back link that keeps the order intact.
- **Not color-only.** Every status pairs an icon with text, and selected cards show a check mark as well as a green outline.
- **Approval vs. order.** The final button and its explanation change with the payment mix: any corporate-billing share means **Submit for Approval** ("nothing is printed or charged until approved"); a card-only order means **Place order · $X**.

## Proposed behavior beyond the brief

These are design choices this mockup adds. Some are tagged in the UI with a purple "Design proposal" badge.

- The focused **text & photo editor** (headline presets, description, hero photo swap). Listing facts stay read-only.
- **Approval reset** when a template, copy, or QR change happens after a proof was approved.
- **Link check** with a suggested correction (simulated locally; no network request).
- **Pickup locations and ready times**, the **ship-to card and delivery estimate**, and the ship cost tiers.
- Linen paper **unlocking at 250+ copies** as an example of a conditionally available option.
- **Radius preview details:** an estimated distance, "Current Resident" naming, a property-type filter rendered on the map, and a stale-preview warning when settings change.
- Upload, Street, Demographics, and CRM list sources are **illustrative states only**.
- **Split payment** across exactly two methods, with a card portion "after approval" when corporate billing is involved.
- **Credit caps:** credits can't exceed the balance or the amount due, and "Use max" respects both.
- Social Media, Image Download, and Facebook Ad are in the catalog and the order, but are set up **after checkout** (their workflows are out of scope).
