# APM — focused ordering prototype

A standalone, buildless HTML/CSS/JavaScript prototype. All listing details, audiences, prices, and transactions are fictional. No backend, payment processing, map service, URL fetch, CRM connection, or mailing service is used. The supplied photography is included locally so the prototype works offline.

## Open

Open `index.html` directly, or run `python3 -m http.server 3088 --bind 127.0.0.1` from this directory and visit http://127.0.0.1:3088. No install or build step is needed. Order choices persist in this browser's local storage. “Start another order” on the confirmation screen resets the draft.

## Connected walkthrough

1. **Product:** Flyers and Brochures are selected for 128 Willow Lane. Add/remove print products and continue.
2. **Design:** Review the flyer, optionally change templates or edit text/photo. Open **Add QR code**, validate the example outdated URL, then remove `-old` and validate again. Save and approve. Repeat for the brochure.
3. **Delivery:** Ship 100 flyers to Jordan's office for $40 ($34 print + $6 shipping). Paper and a paid PDF are under **Paper & extras**.
4. **Brochure recipients:** Mail → **Choose mailing lists**. The 100-person Willow Lane list is selected. **Create list → Radius** → preview 50 single-family addresses, excluding the property → add → use selected lists. Open **Paper & sample copy**, select the sample checkbox, then resolve the missing address with **Add sample address → Use Jordan’s office address → Save**. 150 recipients + 1 sample = 151 pieces; $75.50 print/postage + $4.50 preparation = $80.
5. **Review:** $120 subtotal + $10 illustrative estimated tax = $130. Add promo `LISTING10` ($10), use $20 store credit and $30 ad budget. $70 remains. Choose a simulated card or corporate account. Corporate billing requires cost center and comments. Review the acknowledgement and **Submit for Approval**. Admin direct-order routing is a separate, explicit choice.

## Focus decisions

- Persistent listing bar; four chevron steps; one primary action per view.
- Main column is the current decision; supporting column is its proof or compact price summary.
- Product tabs retain context and show progress. Selected products share the listing while keeping their own designs and delivery settings.
- Templates, focused text/photo editing, QR controls, full proof, and addresses use one drawer at a time. Radius uses its own view and returns to saved-list selection.
- Delivery only reveals the selected method. Extras and detailed price explanations stay collapsed. Credits and billing appear after product review.
- Incomplete proof/delivery blocks submission. Missing sample address, unavailable paper, invalid/unchecked URL, promo, and allocation errors appear where the user can resolve them.

## Proposed behavior beyond established capabilities

The text/photo editor, two template variants, default fulfillment choices, pickup offices/date selection, local draft persistence, illustrative source setup screens (Upload, Street, Demographics, CRM), automatic remainder allocation to the second card, admin direct ordering, and confirmation status are design proposals. Radius geography and eligibility are illustrative. QR generation and validation are simulated; the QR graphic shows placement and is not a functional encoded URL. Digital/advertising products are catalog-level only. No detailed digital campaign workflow is implied.

Pricing is illustrative: unit printing/postage, explicit fulfillment and PDF charges, and estimated tax (subtotal ÷ 12, rounded to cents) update with the order. All displayed credit deductions and billing allocations derive from the same totals. The ad-budget credit is made eligible for this example as requested in the brief.

## Assets

Property exterior: [Unsplash](https://images.unsplash.com/photo-1600596542815-ffad4c1539a9) (`photo-1600596542815-ffad4c1539a9`). Interior: [Unsplash](https://images.unsplash.com/photo-1600210492486-724fe5c67fb0) (`photo-1600210492486-724fe5c67fb0`). Photos illustrate a fictional listing; no actual property association is claimed. Icons are inline SVG; no external runtime dependencies.
