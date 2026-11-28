# APM redesign mockup 09: "Xpresso Hub"

A clickable mockup of Auto Property Marketing, redesigned as a section of Xpresso. Plain HTML, CSS and JavaScript; no build step, no backend.

Open `index.html` in a browser (it works from the file system). Lato and Font Awesome load from CDNs, so the first load needs a connection.

## How to look at it

- Start at the events list. **1301 NE Loop 820, New Listing** is the sample event from the brief: in progress, postcards and brochures in the cart, subtotal $206.05.
- The dashed pink **Mockup controls** button (bottom left) is not part of the design. It holds the switches the brief asks for: internal user, admin, hide pricing, copay, the three checkout variants, and simulated failures (autosave fails, template no longer available, merge field error, invalid listing address, no social accounts, image template error, events list loading/empty/error, session expired). **Reset mockup** clears everything.
- State is kept in `sessionStorage`, so it survives a reload and carries across screens.
- The mockup runs on a fixed "today" of **Monday, October 19, 2026**, so the brief's October dates stay meaningful (one open house is in the past, one is close enough to trigger the mailing class warning).

## How the screens are organized

It is one page (`index.html`) with hash routes, so state carries without a server.

| Route | Screen |
|---|---|
| `#/events` | Events list |
| `#/event/{id}` | Event overview: the hub for one event |
| `#/event/{id}/p/{product}` | Customize one product |
| `#/event/{id}/checkout` | Cart and checkout, one page |
| `#/event/{id}/complete` | Order complete |
| `#/help`, `#/settings`, `#/approvals`, `#/xpresso`, `#/expired` | Help, and stubs for things outside the mockup |

Files: `styles.css` (theme variables at the top), `js/data.js` (sample data and price rules), `js/core.js` (state, pricing, validation, shell, dialogs), `js/art.js` (placeholder photos and design previews), `js/events.js`, `js/workspace.js` (overview, product page, editor, template picker, artwork check), `js/products.js` (option panels, mailing lists), `js/checkout.js`.

## UX decisions, and where they depart from today

**1. A hub replaces the wizard.** Today: Postcards, then Brochures, then Flyers, and so on, with only Previous and Next. Here, opening an event lands on one overview that shows every product with a thumbnail, a plain sentence ("Mailed to 49 recipients plus 1 sample card to you. First Class, 3 to 5 business days."), its price and its status, next to a running order summary. An agent who accepts the defaults goes **email link, overview, checkout, done**: two clicks and one checkbox. Product selection is not a separate step; it is the on/off switch on each card.

**2. You can jump anywhere.** Product pages have a step bar (Overview, each selected product with a ready or needs-attention mark, Cart). "Next" still exists for people who like going in order, but nothing forces the order.

**3. Required inputs are open, never collapsed.** On a print product the first two sections are "How should we deliver it?" and "Who gets it?", marked Required, with the mailing list and recipient count visible and editable in place. The ten-section form became four groups: delivery, who or how many, paper and finish, extras. The preview stays pinned beside them on desktop.

**4. Blocked always says why.** The primary button is never a silent gray. The sticky bar names the first problem ("Please complete required field(s): The sample card needs a name") and the link jumps to the field. The overview lists blockers above its button, each linking to the fix. Leaving a product for the overview is always allowed; only checkout is gated.

**5. Price is visible from the first screen.** The events list shows an estimate per event, the overview shows per-product prices and a subtotal, every option shows its own price difference, and each product page ends in a price breakdown. All of it disappears cleanly under "hide pricing", leaving quantities.

**6. One dialog at a time.** No stacked modals anywhere.
- Change template: the "your customization will be lost" warning is inside the picker, and the button becomes "Replace my design".
- Mailing lists: one drawer with steps inside it (list, choose type, set up, back). Removing a list confirms in the row.
- Artwork check: scanning and results are one dialog that changes state.
- Editor: unsaved-changes, design-warning and merge-field prompts are a strip inside the editor.
- Deleting an address, removing a Facebook account: confirm in place.

**7. The editor has one Save and one Close.** Close asks to save, discard or keep editing only when something changed. Help is a toggle in the editor's top bar, and "Editing help" is also on the product page, so it is reachable without entering edit mode.

**8. Hidden actions are surfaced.** "Change event type" is a labeled button on the listing card. "Remove this product" is a button at the top of the product page (and the switch on the overview). The cart icon always opens a drawer; with nothing in it, it says why.

**9. Social Media no longer blocks.** It is free and not an order item, so it is marked Optional. Post now, schedule, or skip. If it has not gone out, checkout and the confirmation page offer it again.

**10. Changing the event type is not scary.** The dialog says each type keeps its own products and cart, that the current work stays saved, and whether the target type starts fresh or resumes. Open House and Price Change fields are in the same dialog. New Neighbor shows a lock with the reason.

**11. The artwork check runs in the background.** On the overview each product is scanned quietly and gets a chip ("Artwork check: 2 possible issues") that opens the results; it advises, it does not block. Leaving a product after a change runs it in a dialog with Skip, as today. The check really reads the design fields: fix the price to `$500,000`, remove `0 SQ.FT.` and replace `Name`/`Title` in the editor and it passes.

**12. Checkout is one page with a pinned summary.** Products, shipping, credits, payment and terms are cards in one column; the summary and the final button stay in view (a bottom bar on phones). Errors appear on the section that needs fixing and are listed, linked, above the button. The cheapest shipping service and the default card are preselected.

**13. The events list is a worklist.** Photo, type, status badge (Not started, In progress, Submitted for approval, Completed), what is in the cart, what it costs, type-specific detail (open house date, price change), search, type and status filters, sort, and removable filter chips.

**14. After checkout the event is not a dead end.** The confirmation offers downloads, the next waiting events, and "Order more for this listing", which reopens the event. This last one needs backend support that may not exist today; see "Unsure" below.

**15. Wording.** Event types are always New Listing, Sold, Open House, Price Change, New Neighbor. Products are always Postcards, Brochures, Flyers, Social Media, Image Download, Facebook Ad. Sentence case throughout; all-caps only in table headers. The headline printed on a design ("Just Listed", "Just Sold") is marketing copy on the artwork and is editable; it is not used as a label in the interface.

**16. States.** Skeletons for loading (events, proof regeneration, image files, ad preview, social posting). Errors are inline bars with a retry, never browser alerts.

## Feature checklist

### A. Events list
| Feature | Where |
|---|---|
| Events not yet checked out; address, city/state/zip, photo with count, created date, type, agent | `#/events` cards |
| "Submitted for Approval" tag | Orange badge (4901 N Beach St, Sold) |
| Open starts or resumes; autosave | Start / Resume button; "All changes saved" indicator in the event |
| Show Completed Events | Toggle in the toolbar |
| Select Office & User (admin) | Turn on "Office or company admin" in Mockup controls; button at top right of the list |
| Edit listing details, delete with confirmation | Pencil and trash on each card; also "Edit listing details" on the overview |
| Profile & Settings link to a stub | Button on the list, rail gear, account menu; `#/settings` |
| 20 at a time; loading; empty "No available events." | "Show n more"; skeletons on first load; Mockup controls, Events list: Loading / Empty / Error |
| "Submission Successful" after submitting for approval | Success bar on the list after Submit for Approval |

### B. Event setup
| Feature | Where |
|---|---|
| Listing address and event type | Listing card at the top of the overview |
| Types offered only where templates exist; New Neighbor locked | "Change event type" dialog lists four types; open 77 Sundance Square (New Neighbor) for the lock |
| Open House needs date, start, end | Fields in the type dialog, prefilled when known |
| Price Change needs old and new price | Fields in the type dialog |
| Each type has its own selections and cart; warning on switch | Info note in the type dialog; switching back restores the earlier work |
| Product selection, free products, availability rules, defaults | Switch on each overview card; "Not available" cards explain why (try Open House: no brochure template; or "No social accounts connected") |
| At least one product | "Select at least one product" blocker |
| Past open house warning: change date or proceed | 4901 N Beach St, Open House: warning bar with both choices |
| Pick a different event | "Choose a different event" on the listing card; breadcrumb |

### C. Customizing a product
| Feature | Where |
|---|---|
| Merged preview, side switcher, all-sides view | Preview card: Front / Back / All sides tabs |
| Edit design: canvas, field form, save, close with save/discard, six-item help | "Edit design": full-screen editor with placeholder canvas, side tabs (text, images, sides), Help, Close, Save |
| Design warnings with the preview; listed on save | Flyers (low image quality) and Brochures (text cropped in field07): warning bars; saving in the editor shows "Return to editing / Save anyway" |
| Merge field error | Mockup controls, "Merge field error on save", then save in the editor |
| Change template: style dropdown, thumbnail grid, current marked, save as default, lost-customization warning | "Change template" |
| Reset template with confirmation | "Reset" |
| Download proof | "Download proof" (simulated with a message) |
| Remove this product with confirmation, only when more than one | Button at the top of the product page; otherwise "Only product in this event" |
| Artwork check: scanning, skip, per-page results with thumbnails, beta note, helpful yes/no, proceed or fix | Chip on overview and preview; dialog when leaving Postcards on 1301 NE Loop 820 |
| Autosave, save failure with retry | Indicator on preview and summary; Mockup controls, "Autosave fails" |
| Template no longer available | Mockup controls, "Template no longer available" |
| Visible reason when blocked; "Processing data, please wait" | Sticky bar; processing shows for a moment after template change, reset or save |
| Internal: order ID link, editor version, company, branch, agent, production files | Mockup controls, "Internal user": panel under the preview |

### D. Print products
| Feature | Where |
|---|---|
| Distribution method: Mail, Ship, Download, Pickup; hidden when single | "How should we deliver it?" (Flyers offer Pickup) |
| Radius list "{address} (New)" with editable count; saved lists; at least one | "Who gets it?" |
| Manage mailing lists: table, select, edit, remove, filter, selected only, paging | "Manage mailing lists" drawer |
| Create a new list: ten types, Radius built, others placeholder | "Create a new mailing list" in the drawer |
| Sample card toggle, editable address, name required | "Add sample card" under the lists |
| Mailing class with delivery times | "Mailing class" |
| Open House arrival warning and switch to First Class | 818 Magnolia Ave, Open House, Postcards: choose Standard |
| Invalid listing address: correct Address 1 and Postal Code | Mockup controls, "Invalid listing address" |
| Quantity for ship/pickup; no pricing policy | "How many?": enter below 25 or above 5,000 |
| Paper type, coating options with prices | "Paper and finish" |
| PDF download with purchase ($2.50) | "Extras" |
| Download method: file type and per-side buttons, free or priced | Choose Download (Flyers are free, Postcards priced) |
| Total quantity and total price | Sticky bar and "Price for this product" |
| Informed Delivery: toggle, explanation, Display Name with counter, Ride Along Image with See All (13), Redirect URL or Xpress Links with preview, live email preview | Postcards, Mail, "Extras" |

### E. Social Media
| Feature | Where |
|---|---|
| Preview and editing | Same preview card |
| Listing URL, Post Comment with copy, Include Listing Description | "What to post" |
| Platforms from connected accounts; where to connect | "Where to post" (Pinterest shows not connected) |
| Post now or schedule for a future date and time | "When" |
| Result per platform with reason; X truncation notice | After posting: LinkedIn fails with a reason and Retry; a comment over 280 characters shows the X notice |
| Sharing no longer blocks | Marked Optional; reminder at checkout and on the confirmation |

### F. Image Download
| Feature | Where |
|---|---|
| Preview and editing; file type; download each side | Product page |
| Files still being prepared; template configuration error with phone and retry | Skeleton on first open; Mockup controls, "Image template configuration error" |

### G. Facebook Ad
| Feature | Where |
|---|---|
| Title, Message, Radius Centerpoint (validated), Radius Distance 15 to 50, Start Date, Duration, Redirect URL | Ad content, Audience, Schedule (use the Sold event for 1301 NE Loop 820, where the ad is on by default) |
| Approval note about the start date | Shown when the checkout variant is "Approval required" |
| Whose page: Xpressdocs, or own page with connect, pick page, request permission, checking with resend, approved / rejected (reset or cancel) / timed out, remove account | "Whose page posts the ad?" (a small mockup dropdown chooses the outcome) |
| Generate preview, refresh, open in new tab | "Ad preview" |
| Total price | Sticky bar and price card |

### H. Cart and checkout
| Feature | Where |
|---|---|
| Cart indicator everywhere | Header cart icon with count; opens a drawer |
| Items with thumbnail, name, price, summary; full breakdown; edit (returns to cart); delete | "Products" section; Details, Edit, Delete |
| Copay available / applied / unavailable with other orders | Postcards: Apply copay; Brochures: "Why?" |
| Shipping: saved addresses, add, edit, delete, service level with delivery date | "Shipping" (shown because Brochures ship) |
| Credits: promo code, store credit, vouchers, ad budget | "Credits" (try ACME10) |
| Payment: billing accounts, saved cards (edit, remove, default), new card, split, Google Pay | "Payment" |
| Terms and conditions | "Terms and conditions" with "Read the terms" |
| Order summary always visible | Pinned card on desktop, bottom bar on phones |
| Three final actions | Mockup controls, Checkout variant; `#/approvals` opens a cart as the approver |
| Errors next to what needs fixing | Select the final button with terms unchecked; delete the selected address; choose Billing account without applying; split with amounts that do not add up |

### I. Order complete
Cart number and email note; download buttons per page; "You have n available events" with the next two; back to events and to the main site; support phone. All on `#/event/{id}/complete`.

### J. Everywhere
| Feature | Where |
|---|---|
| Navigation to events, Xpresso, help, live chat, log out | Account menu (desktop), menu drawer (below 1024px), rail, chat launcher |
| Help page | `#/help` |
| Dismissible system banner | Top of every screen; "Show banner" brings it back |
| Session expired | `#/expired` (also Log out) |
| Hide pricing | Mockup controls |
| Footer with phone and "Do Not Sell or Share My Personal Information" | Every screen |

## Left out, simplified, or unsure

- **A price mismatch in the brief.** It gives the postcard total as $61.50, the PDF add-on as $2.50, and the cart price as $63.95. Those cannot all hold. I kept $2.50 and $63.95 (so the cart subtotal is $206.05) and the base comes to $61.45.
- **The sample event's selection.** The brief's defaults turn Facebook Ad on and Brochures off, but its sample cart holds Postcards and Brochures. I treated 1301 NE Loop 820, New Listing as an event the agent already changed. Every other event starts from the stated defaults.
- **Prices are invented** beyond the figures in the brief: per-piece rates, coating and paper prices, shipping services, 8.25% tax, $6 per day for the ad, a 5-day minimum duration.
- **Downloads are simulated** with a message; no file is written.
- **The design editor canvas** is a placeholder, as asked. Editing the form fields does update the preview and the artwork check.
- **Mailing list types** other than Radius lead to a placeholder step, as asked.
- **Profile and settings, the approvals dashboard and the main site** are stubs.
- **"Order more for this listing"** reopens a completed event. I do not know whether the backend allows it; if not, drop the link and keep the rest of the confirmation page.
- **Background artwork check on the overview** assumes the scan is cheap enough to run for each selected product without being asked. If it is not, keep only the check on leaving a product.
- **Hide pricing and payment.** With prices hidden I kept card, billing account and wallet selection but removed credit amounts and split payment, since both need visible amounts. The real rule may differ per company.
- **Approval variant.** I assumed an agent who needs approval does not choose payment; the approver does.
- **"Simulate: Template no longer available"** marks every product at once, which is cruder than the real case.
- **Not verified:** I clicked through at 1280, 375 and 360px in one Chromium browser, served from a local web server. Nothing in the code needs a server (no fetch, no modules), but I did not open it from `file://` myself, and I did not test other browsers or a screen reader.
