# APM — ordering prototype (mockup 2)

A clickable prototype for ordering listing marketing (flyers, brochures, postcards and others), choosing an audience or fulfillment option, and submitting through credits, payment and approval. It's plain HTML/CSS/JS with no build step and no backend. Every listing, person, price and service is fictional, and every payment, check and submission is simulated.

```bash
python3 -m http.server 4721 --directory mini-apps/test-ai/mockup-apm-2
```

Open http://localhost:4721. The **Design notes** button (top right) links to each scenario. You can also open a scenario directly by URL:

| URL hash | Shows |
| --- | --- |
| `#scenario=fresh` | Empty order: listing and product selection |
| `#scenario=flyer` / `#scenario=brochure` | Customize workspace for each product |
| `#scenario=qr` | Flyer QR link that fails the check (scenario 5) |
| `#scenario=sample` | Brochure missing its sample-copy address (scenario 3) |
| `#scenario=lists` / `#scenario=radius` | Saved lists drawer / radius builder (scenario 4) |
| `#scenario=editor` | Edit-design concept |
| `#scenario=checkout` | Payment step with the $120 → $70 arithmetic (scenario 6) |

Files: `data.js` (fictional data and pricing), `art.js` (generated photos, product art, icons, QR pattern, map), `proof.js` (proof layouts), `app.js` (state, views, actions), `styles.css`.

## Directions considered

1. **A · Proof-first workspace (developed).** The proof and its configuration sit side by side, with product tabs that show readiness and an order summary that stays on screen. It reads well for agents who order occasionally and is fast for coordinators who order often.
2. **B · Coordinator order board.** A dense table of listings × products with bulk actions and status inline. Fast for repeat work, but intimidating for occasional agents, and the proof gets pushed into a secondary view.
3. **C · Guided one-question flow.** Full-screen steps with large choices and plain-language help. Very approachable, but slow, and the proof is hidden while you configure.

## Key UX decisions

- **The listing stays in view.** A sticky context bar shows address, event and date on every screen. Changing the listing updates every proof and asks for each proof to be reviewed again.
- **Readiness as a checklist, not a gate.** Each product tab, the summary rail and the cart show "N to fix" with a text label and an icon, not just a color. Every item has a **Fix** button that jumps to the exact section, with the user's choices kept. You can review the order before everything is finished, but you can't submit.
- **Proof first, at a readable size.** A large, sticky proof sits beside the configuration. Brochure and postcard pages have Outside/Inside or Front/Back toggles. On mailed pieces, the address panel shows the indicia for the chosen mail class and the first real recipient.
- **Versioned review.** "I've reviewed this proof" is tied to a proof version. Any saved change (template, text, photo, QR) marks the proof as changed and asks for review again.
- **Plain-language distribution.** Each of Mail, Ship, Pickup and Download has a one-line description, plus a fuller explanation of who receives what. Mail quantity comes from the selected lists. Ship and Pickup use a quantity stepper with presets.
- **Transparent quantity math.** For mail, a table shows each list, the +1 sample copy, and printed vs. mailed totals (100 + 50 + 1 = 151 printed). Every product's cost is broken into line items.
- **Unavailable options stay visible.** Paper that can't be mailed is shown as unavailable, with a reason. If the user switches to Mail while holding that paper, a callout offers two one-click fixes: switch paper or ship instead.
- **QR progressive disclosure.** The QR controls are collapsed by default. Their states are: not added → unsaved change → needs attention / ready to save → saved (or saved with an unconfirmed link after an explicit override). Removing a code takes an inline confirmation.
- **One layer at a time.** Mailing lists and radius targeting live in a single side drawer that steps between views. The editor is the only modal, and it asks before discarding unsaved edits. Esc closes the top layer.
- **Radius audience you can see.** The radius builder shows the nearest N addresses, home-type filters, an exclude-the-listing toggle, a live map and radius, the first recipients, and the resulting order totals before you save.
- **Checkout as three tabs with a live ledger.** The tabs are Products / Credits / Payment. The ledger shows subtotal, tax, each credit, remaining amount, allocation by payment method, balance remaining, and the credit balance left after the order. Corporate billing shows the approver and asks for a cost center only when that account is selected. The final button reads **Submit for Approval** when corporate billing is used and **Place order** otherwise, and the text beside it says what will happen. Anything blocking submission is listed above the button.

## Proposed behavior beyond the brief

These are design choices, not established capabilities:

- Text and photo editing in "Edit design" (the established editor only exposes QR controls).
- The per-product, versioned proof-review checkbox.
- Simulated QR link checking. The QR graphic is decorative and not scannable.
- A $0.10 address-data fee per radius record, a flat $1.00 sample copy, a $8 flat shipping fee, pickup locations and ready times, and shipping estimates.
- "Nearest N" radius selection, which derives the radius from the quantity.
- Upload / Street / Demographics / CRM import flows, which are sketched as three-step outlines only.
- Tax as an illustrative estimate. It is tuned so $120 gives $10.
- Card amounts authorized at submit and charged after approval when payment is split with corporate billing.
- Social Media, Image Download and Facebook Ad are represented in the catalog and order, but their detailed setup isn't designed.
