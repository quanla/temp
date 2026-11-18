# APM ordering prototype (07): enterprise admin direction

A standalone, clickable mockup of the APM marketing-order flow, styled as a traditional enterprise admin dashboard. It uses vanilla HTML, CSS, and JS with no build step. All listings, people, lists, and prices are fictional. Payment and submission are simulated.

```bash
python3 -m http.server 4727 --directory mini-apps/test-ai/mockup-apm-07
```

Then open http://localhost:4727. The repo's `.claude/launch.json` has a `mockup-apm-07` entry.

## Layout

- A dark header holds search, the cart count, and the user with a green **Admin** role tag.
- A compact icon rail (with labels) sits beside a light-gray sidebar. The sidebar has only the Orders, Audiences, and Library links, plus a small **This order** card that tracks Design and Delivery status for each product.
- The large white panel has a chevron wizard (**Product → Design → Delivery → Review**), a one-line listing strip, two columns, and a footer. The footer holds one primary action. Back is always secondary.

Wizard states use both color and shape: completed steps are green with a check, the active step is light blue with a number and an underline, and future steps are gray.

## Happy path

1. **Product.** Pick a listing (or use **Change listing**), then select Flyers and Brochures. The cards show live proofs. The digital products (Social Media, Image Download, Facebook Ad) are listed as separate **Set up** entry points.
2. **Design.** Each product has its own tab. The main column has three rows: Template, Text & photos, and QR code. The supporting column shows a proof scaled to fit, with **View larger**. **Approve proof & continue** moves to the next product.
3. **Delivery.** Choose Mail, Ship, Pickup, or Download, each described in plain language. Only that method's fields appear. Paper, sample copy, and PDF sit in a collapsed **Options** section with a one-line summary. The right column shows the price for that product and the order total so far. **Why this price?** explains what drives the price.
4. **Review.** Three steps run in sequence: Products, then Credits, then Payment. Finished steps collapse to a one-line summary with an Edit link. The order total stays on the right. Credits appear in the total only after you reach the Credits step.

## Scenarios

| Scenario | How to try it |
| --- | --- |
| QR correction | On the Flyers design, the QR row shows the link has a space. Click **Fix link**. You can use the suggested fix, type a corrected URL, check **Use this link anyway** to override, or **Remove QR code**. **Approve** is blocked until the QR row is resolved, and the error appears on that row. |
| Bulk flyers | Ship is the default: 100 × $0.32 + $9 ground shipping = **$41.00**. One option is unavailable (14 pt Cardstock) and says why. The PDF add-on is +$5. |
| Mailed brochures | **Choose saved lists** → Austin Past Clients (100). Then **Create list → Radius** (50). The recipient table totals 100 + 50 + 1 sample = **151 printed**, for $78 + $1 = **$79.00**. |
| Missing sample address | The sample copy is on by default, but its saved address has no ZIP. The Options summary shows a warning. Clicking **Continue** opens Options and focuses the ZIP field. Type a ZIP or use **Use office address**. |
| Radius audience | Starts at the listing with 50 single-family homes and the listing itself excluded. Shows a map, the nearest addresses, and the cost impact. Asking for more homes than exist shows an inline error. **Add 50 recipients to order** returns to Delivery with the list selected and saved. |
| Checkout | $120.00 + $9.90 tax (8.25%) − $10 promo `WILLOW10` − $20 store credit − $30 ad budget = **$69.90**. Corporate billing is the default and requires a cost center. The final action is **Submit for Approval**. Choosing a card changes it to **Place order**. You can split payment between two cards. |

## How noise is reduced

- Each step has one purpose and one primary button in a fixed footer.
- Template browsing, the text and photo editor, saved lists, and listing selection open in a single right-side drawer. Drawers never stack.
- Radius targeting and the other list sources replace the panel body with a focused view instead of sharing the screen with order settings.
- Only the selected delivery method's fields are shown. Optional extras stay collapsed behind a summary.
- Errors appear inline on the field or row involved, and only after the user tries to continue. The one exception is the sample-address warning, which shows up front because the default would otherwise fail.
- The price breakdown and line items are hidden until requested.

## Proposed behavior beyond the brief

- **Text & photos editor.** Covers the headline, displayed price, description, and cover photo. The layout stays locked to the template. It is labeled as proposed.
- **Upload, Street, Demographics, and CRM list sources.** Simple illustrative states, labeled **Proposed design**. Radius is the developed example.
- **Credits and approvals.** Credits are applied in a fixed order (promo, then store credit, then ad budget) and never exceed the balance due. The approver name, cost-center list, and order timeline are illustrative.
- **Changes after approval.** Changing an approved proof (template, text, or QR) resets its approval and shows "Proof updated since you approved it".
- **Quantity limits.** Shipped or pickup orders must be at least 25 pieces. Above 5,000, online pricing isn't available, and the user is directed to request a quote.
