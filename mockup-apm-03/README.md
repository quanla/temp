# APM — Listing studio

Standalone, buildless interaction prototype. No existing application source was used. Open index.html directly, or run `python3 -m http.server 4173 --bind 127.0.0.1` in this folder and visit http://127.0.0.1:4173.

## Directions considered

1. Editorial Studio (developed): warm ivory, forest green, editorial property proofs, compact delivery configuration, and a persistent campaign summary.
2. Campaign Board: product status cards with a readiness checklist, suited to repeated coordinator work.
3. Guided Concierge: sequential decisions and larger explanations, suited to infrequent agent use.

The developed direction borrows the campaign checklist while keeping a proof and its configuration together on wide screens. Narrow screens stack them. The listing stays visible across products. Product readiness uses text and checkmarks as well as color.

## Walkthrough

1. Keep Flyers and Brochures selected. Choose Create your materials.
2. Flyers starts at 100 copies, Ship, premium matte: $30 print + $14 shipping = $44. Optionally add a $5 PDF. Expand and acknowledge the proof.
3. Switch to Brochures, Mail. Manage lists → Create a list → Radius. Preview 50 single-family addresses around the listing, excluding the property. Add the audience and confirm both lists: 150 recipients.
4. Enable the sample copy. The quantity becomes 151, and the missing-address warning appears. Add 220 Cedar Avenue (fictional) and save. Print $75.50 + Standard postage $12.08 = $87.58. Review the brochure proof.
5. QR example: enter `willow`, validate, then correct to `https://cedar.example/willow`. Save. A campaign-level design change resets proof review for both products.
6. Review campaign → Credits → WELCOME10, $20 store credit, $30 ad budget → Payment. With no PDF, subtotal $131.58 + $10 illustrative tax − $60 credits = $81.58. Use corporate billing with a comment, or split saved-card allocations. Acknowledge and Submit for Approval.

## Deliberate proposals and limits

- Focused headline editing, the two branded template concepts, pickup location, recipient previews, and campaign-wide QR/headline sharing are design proposals.
- Radius targeting and map are simulated. Non-radius creation methods describe possible behavior; they do not upload, connect, purchase, or modify recipients.
- Ad-budget eligibility for print is a proposed Cedar policy, explicitly labeled in checkout.
- All payment information is fictional. Card addition is illustrative. There are no service connections or charges. Approval is simulated, with no production or notification side effects.
- Session state resets on refresh. Fonts and stock photos load from Google Fonts and Unsplash; an internet connection is needed for those assets. Imagery illustrates a fictional listing and agent.
- Quantity is capped at 5,000 for this concept. Fixed $10 tax is illustrative, not a tax calculator. Mailing transit labels are examples, not guarantees.
- Social Media and Image Download are free catalog entries; their detailed workflows and advertising are outside the developed flow.
- The two template designs are presentation concepts; QR artwork is not scannable. No production print export is generated.

## Validation

JavaScript syntax checked with `node --check app.js`. Browser checked catalog-to-studio navigation, radius results, 150-to-151 quantity composition, missing-address resolution, QR invalid-to-corrected state, and proof status updates. All data is fictional.
