# APM ordering prototype (04)

A clickable, standalone mockup of the APM marketing ordering flow. It uses vanilla HTML, CSS, and JS with no build step. All listings, people, lists, and prices are fictional, and checkout is simulated.

```bash
python3 -m http.server 4724 --directory mini-apps/test-ai/mockup-apm-04
```

Then open http://localhost:4724. The repo's `.claude/launch.json` also has a `mockup-apm-04` entry.

## The flow

**Product → Design → Delivery → Review**, with one dominant action in a fixed footer at every step.

1. **Product.** Six illustrated cards on a 3-column grid; pick several. The listing (128 Willow Lane) stays pinned in a slim context bar. You can change it only here, so every product shares it.
2. **Design.** Each product gets a large proof with Front/Back (or Outside/Inside) and three quiet settings rows: Template, Text & photos, and QR code. **Approve proof & continue** is the only primary action. A product rail at the top shows per-product status.
3. **Delivery.** Four plain-language method cards: Mail, Ship, Pickup, and Download. Only the chosen method's fields appear. Paper, sample copy, and PDF live in a collapsed **Options** section with a one-line summary.
4. **Review.** Three numbered sections: Products, Credits, and Payment. A sticky total sits on the right. The final action reads **Submit for approval** for corporate billing and **Place order** for cards.

## Scenarios to try

| Scenario | Where |
| --- | --- |
| Flyers + Brochures for one listing | Step 1 |
| QR correction | Flyers proof → QR code “Fix”. The link has spaces: use the suggested fix or type a new one to reach the “ready to save” state. A “Use this link anyway” override and Remove are also there. |
| 100 shipped flyers | Flyers delivery defaults to Ship 100 → $30.00 print + $8.00 shipping = **$38.00** |
| Mailed brochures, 151 pieces | Brochures → Choose saved lists → *Austin Past Clients* (100) → Create list → Radius (50) → composition shows 100 + 50 + 1 sample = **151**, **$82.00** |
| Missing sample address | The sample copy is on by default, but its saved address has no ZIP. The Options summary flags it; Continue opens it, focuses the ZIP, and offers “Use office address”. |
| Radius audience | 50 nearest single-family homes, listing excluded, map + nearest-first preview, +$27.00 impact, then **Add 50 recipients** returns to the order |
| Checkout | $120.00 + $9.90 tax (8.25%) − $10 promo `WILLOW10` − $20 store credit − $30 ad budget = **$69.90** due on approval |
| Incomplete proof | Use the stepper to skip ahead without approving, or edit text after approving. Review flags “Proof not approved” with a link back. |

## How it reduces noise

- One question per screen and one green button per step, always in the same place. Back and secondary actions use quiet styling.
- The proof is the largest element on the Design step. Template browsing, text editing, and QR settings open in a single side drawer only when asked. Drawers never stack.
- The price stays a single line in the footer, and **Breakdown** expands the detail only when you need it.
- Delivery shows only the chosen method. Extras sit behind a labeled Options row whose summary also carries any problem, so the happy path has no warning cards.
- Radius targeting gets its own full-screen focus view instead of sharing space with order settings.
- Checkout defaults to the remembered method and cost center. Promo entry, split cards, and new-card fields appear only when chosen.
- Errors sit next to the field. The footer lists what's left, each with a fix link that jumps and focuses the field.
- State always uses text and shape as well as color: check marks, “Ready”, “Proof not approved”, dashed QR placeholder.

## Proposed behavior (beyond the brief)

- **Approve = continue.** Approving the proof is the step's primary action. Any later edit saves automatically and resets approval to “Changes saved · approve again”.
- **Text & photos editor:** cover photo, headline, and description, with listing facts read-only and kept in sync. This is labeled in the UI as a design proposal.
- **QR checks** cover format only (spaces, missing domain), offer a one-click fix, and say plainly that the page itself isn't visited.
- **Adding a QR code to a second product** pre-fills the link already saved on another product.
- **Radius** picks the *nearest* N matching addresses and shows the resulting radius, rather than asking for a distance. New lists are saved for reuse and tagged “New”.
- **Upload, Street, Demographics, and CRM** list creation are illustrative placeholders only.
- **Pickup** offers two studio locations and a “ready in ~2 business days” note. **Ship** has an editable address and an arrival estimate. Online pricing stops above 2,500 pieces with a quote message.
- **Ad budget amount** is adjustable. Credits stop at the order total.
- **Social Media, Image Download, and Facebook Ad** are part of the order, but their setup happens after submission (out of scope).
- **Confirmation page** shows the approval → print → mail timeline.

## Files

- `index.html`: shell and font links
- `data.js`: fictional listings, lists, papers, cards, and credits
- `art.js`: SVG “photography”, agent portrait, logo, and decorative QR codes (works offline)
- `proof.js`: flyer, brochure, and postcard proofs, scaled with container query units so the same markup works as a full proof or a thumbnail
- `app.js`: state, pricing, validation, views, and events
- `styles.css`: theme and layout
