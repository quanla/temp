# MissySalon — operations dashboard mockup

A clickable UI/UX concept for receptionists and managers. It covers one busy afternoon at **Cơ sở 3** (Friday, 30/10/2026, now = 14:05). It's plain HTML/CSS/JS with local fictional data, no build step, and no backend.

```
python3 -m http.server 4719 --directory mini-apps/test-ai/mockup-ms
# open http://localhost:4719
```

Files: `index.html` (shell), `styles.css`, `data.js` (fictional data), `app.js` (state, timeline, side panel, drag/keyboard), `flows.js` (booking, assignment, checkout, search, profile, secondary screens).

---

## 1. Three directions considered

| | Direction | Strength | Weakness |
|---|---|---|---|
| **A** ✅ | **Timeline + contextual workspace.** A room × time grid fills the centre and a right-hand panel changes with context: *Cần xử lý → visit detail → checkout*. | The receptionist never leaves the calendar. Room and staff pressure stay visible while acting. | Needs care to stay readable when the grid is dense. |
| B | **Guest-flow board.** Kanban columns *Sắp đến / Đã đến / Đang làm / Chờ thanh toán*, with a mini room strip on top. | Excellent for arrival/checkout progress. | Weak for room allocation, rescheduling, and "can we fit a party at 15:00?". |
| C | **Command console.** A search/command bar is the centre, and results and actions appear as cards ("check in Tanaka", "4 guests 15:30?"). | Very fast for expert, keyboard-heavy staff. | Low discoverability for new or shared-workstation staff. |

A is developed. It borrows B's progress states (in the panel's *Sắp đến* tab and the three-track status) and C's quick lookup (`/` search, the *Còn chỗ?* answer box).

## 2. Key interaction decisions

**Calendar (horizontal time, rooms as rows)**
- Time runs left→right 07:00–23:00, with 15-minute grid lines and three zoom levels. Rows are grouped by room; each bed/seat is its own row (18 rows). The room column shows the room type, capacity, and how many beds are free right now. Each bed shows "trống → 15:00" or "bận → 15:15".
- **Block anatomy:** time + status pill / guest name + party size + small flags (VIP, requested therapist, deposit, pickup, preference) / treatment + therapists. Full details are in the tooltip and the panel, never squeezed into one long abbreviated title.
- **Visual state = shape + text, not colour alone:** dashed outline = appointment not arrived; tinted fill = arrived; deeper fill + progress bar = in service; amber border + "Chờ thanh toán" = done and unpaid; grey = paid. Party identity is a coloured edge, and hovering a block outlines the whole party.
- **Room availability and staff availability are separate**, in two sticky rows at the bottom of the grid. *Giường/ghế trống* counts free beds/seats per 15 minutes. *KTV còn rảnh* counts therapists on shift minus those busy minus services that still have no therapist. A red **"Thiếu 2 KTV"** band also appears in the time header over 15:00–15:30, so a future shortage is visible before it happens.
- **Operational notes** (Room 5 equipment check 16:00, stone heating before Kenji's VIP slot) use striped amber "sticky-note" blocks with a wrench icon. They block the bed/room for drag-and-drop but never look like guests.
- **Uncertain duration** shows as a dotted, fading tail ("?"); bathing before/after shows as a hatched segment with a droplet.
- **Rescheduling:** drag a block, or ⇧-click several and drag them together, or press ←/→ (15 min) and ↑/↓ (bed). A live tooltip shows the new time/bed, and the drop is refused if it collides. Every move toasts with **Hoàn tác** (undo) and warns when a therapist becomes double-booked. The visit panel also has *Dời cả nhóm −15'/+15'/+30'* and *Chọn cả nhóm để kéo* buttons, so nothing depends on drag skill.
- Double-click an empty cell to book that bed and time. Right-click a block for a context menu. All of these duplicate visible buttons; shortcuts (`N`, `W`, `/`, `T`, `[` `]`, `?`) are extras.

**Side panel (default tabs)**
- **Cần xử lý** — grouped *Ngay bây giờ / Trong 1–2 giờ tới / Trước khi đóng ngày / Ghi chú vận hành*. Each item has a direct action (*Đánh dấu đã đến*, *Phân công KTV*, *Thanh toán*, *Xác nhận*, *Bổ sung*). Clicking the item opens the record and scrolls the grid to it. Only red items use strong colour; the rest stay calm.
- **Sắp đến** — next arrivals with countdown/overdue, confirmation, deposit, VIP, missing-therapist and pickup chips.
- **KTV** — therapists grouped *Rảnh / Sắp xong / Chờ khách / Đang làm / Ở cơ sở khác / Ngoài ca*, plus the rotation queue. A **"Xem tình trạng lúc"** time picker answers "who is free at 16:30?".
- **Còn chỗ?** — party size + time + duration → "Nhận được / Đủ giường nhưng thiếu KTV / Không đủ giường". If the answer is no, it suggests the next workable time and offers *Ghi nhận từ chối* (logs to the rejection log).

**Visit detail** — three separate tracks, **Lịch hẹn** (confirmation), **Tiến trình** (arrival/service), and **Thanh toán**, then one contextual primary button (*Cả nhóm đã đến → Bắt đầu N dịch vụ → Thanh toán*). Guests appear as cards: loyalty chip (VIP / visit count, opens the profile), preferences tagged "từ hồ sơ khách", and per-service rows with therapist chips you can click to reassign. Below that: notes, contact/channel/deposit/pickup, a mini bill, and an 8-action grid (edit, add guest, add service/product, change therapist, history, feedback, follow-up, cancel).

**Booking flow** — a large modal with the form on the left and a live **feasibility column** on the right: verdict, checks (errors / warnings / OK), a mini timeline preview, and an estimate. Steps: ① party & contacts ② guests & services (each guest has their own sequential services, with start, service, duration, "chưa chắc" range, bath, room/bed with ✓ free / — busy markers, and requested therapist(s); four-hands shows two selectors) ③ deposit & notes ④ **Thông tin thêm**, collapsed (pickup, drop-off, luggage, source, nationality, promo, partner, commission). Typing a known name or phone offers *"Khách quen — dùng hồ sơ"*, which carries preferences and the favourite therapist. *Tự xếp phòng* fills free beds and keeps a party in the same room. Validation stays neutral until you try to save, then marks the fields in red. A walk-in uses the same form, with "now" as the time and *Nhận khách & bắt đầu*.

**Therapist assignment** — a requirement bar ("Cần 2 KTV · Hương + trống"), then candidates grouped *rảnh suốt dịch vụ* (sorted by rotation, with "Đến lượt", "Khách yêu cầu", "Mượn từ Cơ sở 1" and skill tags), *rảnh một phần*, *rảnh muộn*, *đang có lịch*, *cơ sở khác*, and *ngoài ca*. Choosing a busy therapist shows a conflict warning. Skipping the person whose turn it is asks for a reason, which is written to the skipped-rotation log (*Ca & lượt KTV*).

**Checkout** — line items per guest (original price / discount / net), add product or gift card, then a totals ladder: *giá gốc → giảm 10% → tổng sau giảm → đã cọc → Còn phải trả*. On the right are payment-method tiles (cash, card, transfer, Alipay, partner debt, gift card). Rows combine freely; the big "còn phải trả" card has a progress bar, the remaining amount, and cash change. *Hoàn tất* stays disabled until the remainder is exactly 0. The gift card row validates the code, its lock state, and its balance. **Tách hóa đơn theo khách** splits the bill into per-guest invoices, with the deposit applied to invoice 1. Commission/pay overrides sit in a collapsed *Nâng cao* section.

**States** — empty (other days: an empty calendar card and an empty attention list), loading (skeleton when changing day), warning (amber), urgent (red, used sparingly), validation (inline red after the save attempt), and success/undo toasts.

## 3. Scenario coverage

| Scenario | Where to look |
|---|---|
| 1. Mai Nguyen & Daniel Lee, 14:00, Room 2, 300k deposit, strong pressure | P-2041. It's 5 min overdue at 14:05, so it's the first item in *Cần xử lý*; open it → *Cả nhóm đã đến* → *Bắt đầu*. |
| 2. Sofia Chen four-hands 14:15, Room 3, one therapist missing | P-2042. Red "thiếu 1 KTV" on the block and in the attention list → *Phân công KTV*. |
| 3. Tanaka party of 3 at 15:00, same-room request, VIP, pickup | P-2043. Kenji & Yuki in Room 4, Emma in Room 6. Unconfirmed, VIP crown, car flag; edit it to see the multi-guest form and the staffing warning. |
| 4. Becker visit ready for checkout: 1,900,000 → −10% → −300k → 1,410,000 = 600k cash + 810k card | V-1187 → *Thanh toán*. Cash 600k is prefilled; tap *Thẻ* and it fills 810k. |
| 5. Returning guest, massage then facial, preference carried over | Hannah Weber, P-2045: 16:30 Room 7 (Lan) → 17:30 Room 8 (Vy), "từ hồ sơ khách" preferences, gift card note. |
| 6. Room 5 equipment check 16:00 | Striped note block across both Room 5 beds, also listed under *Ghi chú vận hành*. |

## 4. New ideas vs. capabilities from the brief

**Capabilities the brief says already exist (re-presented here):** branch/day navigation; a room calendar; create/edit/confirm/cancel bookings; guests and services per party; uncertain duration and bathing; deposit; optional booking details; arrival and starting service; walk-ins; therapist assignment with several therapists; shifts, shift import, and skipped-rotation tracking; visit detail; invoices with discounts, deposits, gift cards, split payments, split invoices, and printing; commission adjustments; the attention list; search; customer history/VIP; gift cards; the daily overview with revenue by method, income/expense, and payroll; the rejection log; operational notes; reports, setup, language, and account switching.

**New design ideas in this mockup:**
1. **Separate room-capacity and staff-capacity rows** under the grid, plus a **"Thiếu N KTV" band** in the time header for future shortages.
2. **Three-track status** (Lịch hẹn / Tiến trình / Thanh toán) instead of one combined status.
3. **Live feasibility column** in the booking form: verdict, conflicts, staffing check, preview, and estimate as you type.
4. **"Còn chỗ?" quick answer** for phone enquiries, with a suggested alternative time and a one-click rejection log.
5. **Per-bed "trống → / bận →" hints** in the row labels, and a "free now" count per room.
6. **Party-aware selection:** hover to highlight a party, *Chọn cả nhóm* for group moves, keyboard nudging, and undo on every move.
7. **Rotation-aware assignment:** the "Đến lượt" tag, plus a skip reason required inline, which feeds the skip log automatically.
8. **Contextual primary action** in the visit panel, which changes with progress (arrive → start → pay).
9. **"Xem tình trạng lúc" time-travel** for therapist availability at a requested time.
10. **Badges + tooltips + progressive disclosure** in place of long abbreviated block titles; optional booking fields collapse and summarise as chips.

## 5. Not in scope

The data is fictional and resets on reload. Branch switching, English UI, reports, settings, payroll detail, and shift import are shown as navigation and menus only, and say so when clicked. The layout targets desktop widths of about 1280px and up.
