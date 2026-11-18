/* MissySalon mockup — fictional data for Cơ sở 3 · Thứ Sáu 30/10/2026 (now = 14:05) */

const T = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

const BRANCHES = [
  { id: 'CS1', name: 'Cơ sở 1', area: 'Lý Tự Trọng · Quận 1' },
  { id: 'CS2', name: 'Cơ sở 2', area: 'Thảo Điền · TP Thủ Đức' },
  { id: 'CS3', name: 'Cơ sở 3', area: 'Bùi Viện · Quận 1' },
];

const ROOMS = [
  { id: 'R1', name: 'Phòng 1', kind: 'Massage đôi', beds: ['Giường A', 'Giường B'] },
  { id: 'R2', name: 'Phòng 2', kind: 'Phòng cặp đôi', beds: ['Giường A', 'Giường B'] },
  { id: 'R3', name: 'Phòng 3', kind: 'VIP · 4 tay', beds: ['Giường lớn'] },
  { id: 'R4', name: 'Phòng 4', kind: 'Massage nhóm', beds: ['Giường A', 'Giường B', 'Giường C'] },
  { id: 'R5', name: 'Phòng 5', kind: 'Xông hơi + massage', beds: ['Giường A', 'Giường B'] },
  { id: 'R6', name: 'Phòng 6', kind: 'Ghế massage chân', beds: ['Ghế 1', 'Ghế 2', 'Ghế 3', 'Ghế 4'] },
  { id: 'R7', name: 'Phòng 7', kind: 'Massage', beds: ['Giường A', 'Giường B'] },
  { id: 'R8', name: 'Phòng 8', kind: 'Chăm sóc da', beds: ['Giường A', 'Giường B'] },
];

const CATALOG = {
  swed60: { name: 'Massage Thụy Điển', short: 'Thụy Điển', dur: 60, price: 500000 },
  thai90: { name: 'Massage Thái', short: 'Thái', dur: 90, price: 650000 },
  deep90: { name: 'Massage mô sâu', short: 'Mô sâu', dur: 90, price: 750000 },
  aroma90: { name: 'Massage tinh dầu', short: 'Tinh dầu', dur: 90, price: 850000 },
  stone90: { name: 'Massage đá nóng', short: 'Đá nóng', dur: 90, price: 1050000 },
  stone120: { name: 'Massage đá nóng', short: 'Đá nóng', dur: 120, price: 1250000 },
  four90: { name: 'Massage 4 tay', short: '4 tay', dur: 90, price: 1600000, staff: 2, skill: '4tay' },
  foot60: { name: 'Massage chân', short: 'Chân', dur: 60, price: 350000 },
  scrub60: { name: 'Tẩy tế bào chết toàn thân', short: 'Tẩy TBC', dur: 60, price: 550000 },
  facial60: { name: 'Chăm sóc da mặt', short: 'Da mặt', dur: 60, price: 700000, skill: 'da' },
  hair45: { name: 'Gội đầu dưỡng sinh', short: 'Gội đầu', dur: 45, price: 250000 },
};

const PRODUCTS = [
  { id: 'oil', name: 'Dầu massage sả chanh 100ml', price: 180000 },
  { id: 'salt', name: 'Muối tắm thảo mộc', price: 120000 },
  { id: 'balm', name: 'Cao xoa bóp gừng', price: 95000 },
  { id: 'tea', name: 'Trà gừng mật ong (hộp)', price: 150000 },
];

const THERAPISTS = [
  { id: 'T01', code: '01', name: 'Lan', shift: [T('09:00'), T('18:00')], rot: 4, skills: ['4tay'] },
  { id: 'T02', code: '02', name: 'Hương', shift: [T('10:00'), T('19:00')], rot: 5, skills: ['4tay'] },
  { id: 'T03', code: '03', name: 'Thảo', shift: [T('12:00'), T('21:00')], rot: 6, skills: [] },
  { id: 'T04', code: '04', name: 'Ngọc', shift: [T('12:00'), T('21:00')], rot: 7, skills: ['4tay'] },
  { id: 'T05', code: '05', name: 'Trang', shift: [T('09:00'), T('17:00')], rot: 8, skills: [] },
  { id: 'T06', code: '06', name: 'Vy', shift: [T('10:00'), T('19:00')], rot: 9, skills: ['da'] },
  { id: 'T07', code: '07', name: 'Hà', shift: [T('13:00'), T('22:00')], rot: 1, skills: ['4tay'] },
  { id: 'T08', code: '08', name: 'Linh', shift: [T('12:00'), T('21:00')], rot: 3, skills: ['4tay'] },
  { id: 'T09', code: '09', name: 'Phương', shift: [T('08:00'), T('15:00')], rot: 10, skills: [] },
  { id: 'T10', code: '10', name: 'Tâm', shift: [T('12:00'), T('21:00')], rot: 11, skills: [] },
  { id: 'T11', code: '11', name: 'My', shift: [T('08:00'), T('15:00')], rot: 12, skills: [] },
  { id: 'T12', code: '12', name: 'Duyên', shift: [T('08:00'), T('15:00')], rot: 13, skills: ['da'] },
  { id: 'T13', code: '13', name: 'Quỳnh', shift: [T('13:00'), T('22:00')], rot: 14, skills: [] },
  { id: 'T14', code: '21', name: 'Hạnh', shift: [T('14:00'), T('18:00')], rot: 2, skills: ['4tay'], from: 'Cơ sở 1' },
  { id: 'T15', code: '15', name: 'Nhung', shift: [T('09:00'), T('18:00')], rot: 15, skills: [], away: { branch: 'Cơ sở 2', from: T('12:00'), to: T('16:00') } },
  { id: 'T16', code: '16', name: 'Bích', shift: [T('09:00'), T('18:00')], rot: 16, skills: [], off: true },
  { id: 'T17', code: '17', name: 'Đào', shift: [T('17:00'), T('23:00')], rot: 17, skills: ['da'] },
];

let seqId = 0;
const S = (svc, start, seat, therapists = [], o = {}) => ({
  id: `s${++seqId}`, svc, start: T(start), seat, therapists, request: [], status: 'booked', ...o,
});
const G = (name, services, o = {}) => ({ id: `g${++seqId}`, name, services, arrived: false, prefs: '', ...o });
const P = (o) => ({
  confirmed: true, kind: 'appt', payment: 'unpaid', deposit: 0, depositMethod: '', discountPct: 0, promo: '',
  products: [], extra: {}, notes: '', phone: '', email: '', channel: 'Điện thoại', source: '', ...o,
});
const done = { status: 'done' };
const active = { status: 'active' };
const here = { arrived: true };

const PARTIES = [
  P({ id: 'P-2031', name: 'Park Ji-woo', kind: 'visit', payment: 'paid', channel: 'Walk-in', guests: [G('Park Ji-woo', [S('thai90', '09:00', 'R1-0', ['T05'], done)], here)] }),
  P({ id: 'P-2034', name: 'Nhóm Sato', kind: 'visit', payment: 'paid', channel: 'Đối tác KS', extra: { partner: 'KS Liberty Central' }, guests: [G('Haruto Sato', [S('foot60', '09:30', 'R6-0', ['T11'], done)], here), G('Aoi Sato', [S('foot60', '09:30', 'R6-1', ['T12'], done)], here)] }),
  P({ id: 'P-2032', name: 'Lucas & Chloé Martin', kind: 'visit', payment: 'paid', channel: 'Website', guests: [G('Lucas Martin', [S('aroma90', '10:00', 'R2-0', ['T01'], done)], here), G('Chloé Martin', [S('swed60', '10:00', 'R2-1', ['T09'], done)], here)] }),
  P({ id: 'P-2035', name: 'Trần Bảo Ngọc', kind: 'visit', payment: 'paid', channel: 'Zalo', guests: [G('Trần Bảo Ngọc', [S('swed60', '10:30', 'R7-0', ['T06'], done)], here)] }),
  P({ id: 'P-2033', name: 'Elena Volkova', kind: 'visit', payment: 'paid', channel: 'Website', guests: [G('Elena Volkova', [S('swed60', '11:00', 'R3-0', ['T02'], done)], here)] }),
  P({ id: 'P-2036', name: 'Lisa Wong', kind: 'visit', payment: 'paid', channel: 'WeChat', guests: [G('Lisa Wong', [S('facial60', '11:00', 'R8-0', ['T12'], done)], here)] }),
  P({ id: 'P-2038', name: 'Ana Silva', kind: 'visit', payment: 'draft', channel: 'Walk-in', notes: 'Khách đã về — hóa đơn lưu tạm, chờ xác nhận chuyển khoản.', guests: [G('Ana Silva', [S('swed60', '11:30', 'R5-1', ['T11'], done)], here)] }),
  P({ id: 'P-2037', name: 'Noah Brown', kind: 'visit', payment: 'paid', channel: 'Điện thoại', guests: [G('Noah Brown', [S('thai90', '12:00', 'R5-0', ['T03'], done)], here)] }),
  P({
    id: 'V-1187', name: 'Lukas & Anna Becker', kind: 'visit', deposit: 300000, depositMethod: 'Chuyển khoản', discountPct: 10, promo: 'Khách quay lại',
    phone: '+49 151 2234 8890', channel: 'WhatsApp', source: 'Khách quen',
    guests: [
      G('Lukas Becker', [S('aroma90', '12:30', 'R1-0', ['T08'], done)], { ...here, customerId: 'C-LB' }),
      G('Anna Becker', [S('stone90', '12:30', 'R1-1', ['T01'], done)], here),
    ],
  }),
  P({ id: 'V-1190', name: 'Nhóm Wilson', kind: 'visit', channel: 'Website', phone: '+44 7700 900 412', guests: [G('Tom Wilson', [S('thai90', '13:00', 'R4-0', ['T05'], active)], here), G('Grace Wilson', [S('swed60', '13:15', 'R4-1', ['T09'], active)], here)] }),
  P({ id: 'V-1192', name: 'Nhóm Kim', kind: 'visit', channel: 'Klook', phone: '+82 10 2231 0098', extra: { partner: 'Klook' }, guests: [G('Kim Min-jun', [S('foot60', '13:15', 'R6-0', ['T11'], active)], here), G('Kim Seo-yeon', [S('foot60', '13:30', 'R6-1', ['T12'], active)], here)] }),
  P({ id: 'V-1191', name: 'Phạm Minh Anh', kind: 'visit', walkin: true, channel: 'Walk-in', phone: '+84 903 221 774', guests: [G('Phạm Minh Anh', [S('deep90', '13:45', 'R4-2', ['T10'], active)], here)] }),
  P({ id: 'V-1193', name: "Ryan O'Connor", kind: 'visit', walkin: true, channel: 'Walk-in', phone: '+353 87 220 1145', guests: [G("Ryan O'Connor", [S('foot60', '14:00', 'R6-3', ['T13'], active)], here)] }),
  P({ id: 'V-1194', name: 'Nguyễn Thu Hà', kind: 'visit', channel: 'Zalo', phone: '+84 938 004 512', guests: [G('Nguyễn Thu Hà', [S('facial60', '14:00', 'R8-1', ['T06'], active)], here)] }),
  P({
    id: 'P-2041', name: 'Mai & Daniel', deposit: 300000, depositMethod: 'Chuyển khoản', phone: '+84 908 112 456', email: 'mai.nguyen@gmail.com',
    channel: 'Website', source: 'Khách quen', notes: 'Kỷ niệm 5 năm — chuẩn bị trà gừng và hoa trên giường.',
    guests: [
      G('Mai Nguyen', [S('thai90', '14:00', 'R2-0', ['T03'])], { customerId: 'C-MN', prefs: 'Áp lực vừa' }),
      G('Daniel Lee', [S('deep90', '14:00', 'R2-1', ['T04'])], { prefs: 'Áp lực mạnh, tập trung vai gáy' }),
    ],
  }),
  P({
    id: 'P-2042', name: 'Sofia Chen', phone: '+886 912 334 778', channel: 'Instagram', deposit: 500000, depositMethod: 'Thẻ',
    guests: [G('Sofia Chen', [S('four90', '14:15', 'R3-0', ['T02', null], { request: ['T02'] })], { prefs: 'Ưu tiên KTV nữ' })],
  }),
  P({ id: 'P-2044', name: 'Chloe Dubois', phone: '+33 6 12 44 89 10', channel: 'Zalo', guests: [G('Chloe Dubois', [S('swed60', '14:30', 'R7-0', ['T01'], { request: ['T01'] })])] }),
  P({
    id: 'P-2043', name: 'Gia đình Tanaka', confirmed: false, phone: '+81 90 3344 2210', email: 'k.tanaka@outlook.jp', channel: 'Email', source: 'Khách quen',
    notes: 'Kenji & Yuki muốn chung Phòng 4. Emma (12 tuổi) làm chân cùng giờ ở Phòng 6.',
    extra: { pickup: 'Đón tại KS Rex lúc 14:30', dropoff: 'Trả về KS Rex khoảng 17:15', luggage: 'Không', nationality: 'Nhật Bản' },
    guests: [
      G('Kenji Tanaka', [S('stone120', '15:00', 'R4-0', ['T05'], { request: ['T05'], bath: 'after' })], { customerId: 'C-KT', prefs: 'Đá nóng vùng lưng – vai · Trà gừng sau liệu trình', prefsFrom: 'profile' }),
      G('Yuki Tanaka', [S('scrub60', '15:00', 'R4-1', [], { durMax: 75 })], { prefs: 'Muốn chung phòng với Kenji' }),
      G('Emma Tanaka', [S('foot60', '15:00', 'R6-2', [])], { prefs: '12 tuổi · có người lớn đi kèm' }),
    ],
  }),
  P({ id: 'P-2046', name: 'Lucas Meyer', phone: '+41 79 555 0192', channel: 'Điện thoại', guests: [G('Lucas Meyer', [S('swed60', '15:00', 'R7-1', [])])] }),
  P({
    id: 'P-2047', name: 'Nhóm bạn Seoul', phone: '+82 10 4421 7788', channel: 'Klook', extra: { partner: 'Klook', commission: '15%' },
    guests: [G('Lee Ji-eun', [S('foot60', '15:00', 'R6-0', [])]), G('Choi Min-seo', [S('foot60', '15:00', 'R6-1', [])]), G('Han Bo-ra', [S('foot60', '15:00', 'R6-3', [])])],
  }),
  P({ id: 'P-2050', name: 'Priya Sharma', phone: '+91 98200 11223', channel: 'Walk-in hẹn trước', guests: [G('Priya Sharma', [S('hair45', '15:15', 'R8-1', [])])] }),
  P({ id: 'P-2057', name: 'Chen Wei', phone: '+86 139 1022 3344', channel: 'WeChat', guests: [G('Chen Wei', [S('aroma90', '16:00', 'R1-1', [])])] }),
  P({
    id: 'P-2045', name: 'Hannah Weber', phone: '+49 170 889 2231', email: 'hannah.w@web.de', channel: 'Zalo', source: 'Khách quen',
    notes: 'Có thẻ quà tặng GC-5521 — hỏi khách có muốn dùng khi thanh toán.',
    guests: [G('Hannah Weber', [
      S('swed60', '16:30', 'R7-0', ['T01'], { request: ['T01'], bath: 'before' }),
      S('facial60', '17:30', 'R8-0', ['T06']),
    ], { customerId: 'C-HW', prefs: 'Áp lực nhẹ vùng cổ · Không dùng tinh dầu bạc hà', prefsFrom: 'profile' })],
  }),
  P({ id: 'P-2051', name: 'Ivan Petrov', confirmed: false, phone: '+7 916 220 1188', channel: 'Điện thoại', guests: [G('Ivan Petrov', [S('thai90', '16:30', 'R5-0', [], { dur: 60, durMax: 90 })], { prefs: 'Chưa chắc 60 hay 90 phút — hỏi lại khi đến' })] }),
  P({ id: 'P-2056', name: 'Nhóm Lê', phone: '+84 912 778 003', channel: 'Điện thoại', guests: [G('Lê Hoàng', [S('foot60', '17:00', 'R6-0', [])]), G('Lê Thu', [S('foot60', '17:00', 'R6-1', [])])] }),
  P({ id: 'P-2052', name: 'Isabella Rossi', phone: '+39 333 120 4567', channel: 'Website', deposit: 500000, depositMethod: 'Thẻ', guests: [G('Isabella Rossi', [S('four90', '17:00', 'R3-0', ['T07', 'T08'])])] }),
  P({ id: 'P-2053', name: 'Nhóm Ahmed', confirmed: false, phone: '+971 50 778 2210', channel: '', guests: [G('Omar Ahmed', [S('deep90', '18:30', 'R2-0', [])]), G('Layla Ahmed', [S('deep90', '18:30', 'R2-1', [])])] }),
  P({ id: 'P-2048', name: 'Oliver Grant', phone: '', email: '', channel: 'Đối tác KS', extra: { partner: 'KS Liberty Central' }, guests: [G('Oliver Grant', [S('deep90', '19:00', 'R1-0', [])])] }),
  P({ id: 'P-2054', name: 'Sven Larsen', phone: '+47 912 33 456', channel: 'Website', guests: [G('Sven Larsen', [S('thai90', '19:30', 'R4-0', [])])] }),
  P({ id: 'P-2055', name: 'Mia Johnson', phone: '+1 415 220 9981', channel: 'Zalo', guests: [G('Mia Johnson', [S('swed60', '20:00', 'R7-1', [])])] }),
];

const NOTES = [
  { id: 'N1', room: 'R5', start: T('16:00'), end: T('16:30'), title: 'Kiểm tra máy xông hơi', body: 'Kỹ thuật viên bảo trì đến kiểm tra van hơi. Không xếp khách vào Phòng 5 trong khung này.', by: 'Hòa · Quản lý' },
  { id: 'N2', room: 'R4', seat: 'R4-0', start: T('14:30'), end: T('15:00'), title: 'Hâm đá nóng', body: 'Chuẩn bị đá nóng và khăn ấm cho Kenji Tanaka (VIP) lúc 15:00.', by: 'Thu · Lễ tân' },
];

const CUSTOMERS = {
  'C-KT': {
    id: 'C-KT', name: 'Kenji Tanaka', vip: true, visits: 11, last: '12/09/2026', since: '03/2023', phone: '+81 90 3344 2210', email: 'k.tanaka@outlook.jp',
    birthday: '14/11', nationality: 'Nhật Bản', spend: 14850000, fav: 'T05',
    notes: 'Thích phòng yên tĩnh, điều hòa 26°C. Thường đặt cho cả gia đình qua email.',
    prefs: ['Đá nóng vùng lưng – vai', 'KTV quen: Trang (05)', 'Trà gừng sau liệu trình'],
    history: [
      { date: '12/09/2026', branch: 'Cơ sở 3', svc: "Massage đá nóng 120'", ther: 'Trang', amt: 1250000, fb: 5 },
      { date: '02/06/2026', branch: 'Cơ sở 3', svc: "Massage đá nóng 90'", ther: 'Trang', amt: 1050000, fb: 5 },
      { date: '14/02/2026', branch: 'Cơ sở 1', svc: "Massage Thái 90'", ther: 'Hương', amt: 650000, fb: 4 },
    ],
  },
  'C-HW': {
    id: 'C-HW', name: 'Hannah Weber', vip: false, visits: 6, last: '02/10/2026', since: '11/2024', phone: '+49 170 889 2231', email: 'hannah.w@web.de',
    birthday: '03/02', nationality: 'Đức', spend: 5400000, fav: 'T01',
    notes: 'Đang có thẻ quà tặng GC-5521 (còn 1,150,000 ₫).',
    prefs: ['Áp lực nhẹ vùng cổ', 'Không dùng tinh dầu bạc hà', 'Thích KTV Lan (01)'],
    history: [
      { date: '02/10/2026', branch: 'Cơ sở 3', svc: "Massage tinh dầu 60'", ther: 'Lan', amt: 650000, fb: 5 },
      { date: '21/08/2026', branch: 'Cơ sở 3', svc: "Chăm sóc da mặt 60'", ther: 'Vy', amt: 700000, fb: 4 },
      { date: '18/06/2026', branch: 'Cơ sở 2', svc: 'Gội đầu + massage chân', ther: 'Duyên', amt: 600000, fb: 5 },
    ],
  },
  'C-MN': {
    id: 'C-MN', name: 'Mai Nguyen', vip: false, visits: 3, last: '15/08/2026', since: '01/2025', phone: '+84 908 112 456', email: 'mai.nguyen@gmail.com',
    birthday: '22/07', nationality: 'Việt Nam / Úc', spend: 2100000, fav: 'T03',
    notes: 'Thường đi cùng chồng (Daniel Lee).',
    prefs: ['Massage Thái, áp lực vừa', 'Phòng đôi'],
    history: [
      { date: '15/08/2026', branch: 'Cơ sở 3', svc: "Massage Thái 90'", ther: 'Thảo', amt: 650000, fb: 5 },
      { date: '02/03/2026', branch: 'Cơ sở 1', svc: "Massage Thụy Điển 60'", ther: 'Lan', amt: 500000, fb: 4 },
    ],
  },
  'C-LB': {
    id: 'C-LB', name: 'Lukas Becker', vip: false, visits: 2, last: '18/04/2026', since: '04/2026', phone: '+49 151 2234 8890', email: '',
    birthday: '09/12', nationality: 'Đức', spend: 1600000, fav: 'T08',
    notes: '',
    prefs: ['Tinh dầu oải hương'],
    history: [{ date: '18/04/2026', branch: 'Cơ sở 3', svc: "Massage tinh dầu 90'", ther: 'Linh', amt: 850000, fb: 5 }],
  },
};

const GIFTCARDS = [
  { code: 'GC-5521', owner: 'Hannah Weber', phone: '+49 170 889 2231', value: 2000000, bonus: 200000, remaining: 1150000, promo: 'Tặng thêm 10%', issued: '14/02/2026', expiry: '31/03/2027', state: 'active', usage: [{ date: '02/10/2026', amt: 650000, note: "Massage tinh dầu 60'" }, { date: '18/06/2026', amt: 400000, note: 'Gội đầu + chân' }] },
  { code: 'GC-5615', owner: 'Nguyễn Hải Yến', phone: '+84 909 556 201', value: 1000000, bonus: 0, remaining: 1000000, promo: '—', issued: '30/10/2026', expiry: '30/10/2027', state: 'active', usage: [] },
  { code: 'GC-5602', owner: 'Nguyễn Thanh Tâm', phone: '+84 977 120 334', value: 1000000, bonus: 0, remaining: 1000000, promo: '—', issued: '20/10/2026', expiry: '20/10/2027', state: 'active', usage: [] },
  { code: 'GC-5410', owner: 'Sarah Kim', phone: '+82 10 9988 1200', value: 1500000, bonus: 150000, remaining: 900000, promo: 'Tặng thêm 10%', issued: '01/05/2026', expiry: '30/11/2026', state: 'locked', lockReason: 'Khách báo mất thẻ 21/10', usage: [{ date: '12/07/2026', amt: 750000, note: "Massage mô sâu 90'" }] },
  { code: 'GC-5377', owner: 'Marco Bianchi', phone: '+39 347 220 1190', value: 3000000, bonus: 0, remaining: 0, promo: 'Combo cặp đôi', issued: '10/01/2026', expiry: '10/01/2027', state: 'used', usage: [{ date: '22/03/2026', amt: 1700000, note: 'Massage cặp đôi' }, { date: '14/04/2026', amt: 1300000, note: 'Đá nóng + da mặt' }] },
];

const LEDGER = [
  { party: 'P-2031', m: 'cash', amt: 650000, t: '10:35', kind: 'service' },
  { party: 'P-2031', m: 'cash', amt: 180000, t: '10:36', kind: 'product', note: 'Dầu massage sả chanh' },
  { party: 'P-2034', m: 'partner', amt: 700000, t: '10:40', kind: 'service', note: 'KS Liberty Central' },
  { party: 'GC-5615', m: 'card', amt: 1000000, t: '11:20', kind: 'giftcard', note: 'Bán thẻ GC-5615' },
  { party: 'P-2032', m: 'card', amt: 1350000, t: '11:38', kind: 'service' },
  { party: 'P-2035', m: 'bank', amt: 500000, t: '11:40', kind: 'service' },
  { party: 'P-2033', m: 'card', amt: 500000, t: '12:05', kind: 'service' },
  { party: 'P-2036', m: 'alipay', amt: 700000, t: '12:08', kind: 'service' },
  { party: 'P-2037', m: 'cash', amt: 650000, t: '13:35', kind: 'service' },
  { party: 'V-1187', m: 'bank', amt: 300000, t: '09:12', kind: 'deposit' },
  { party: 'P-2041', m: 'bank', amt: 300000, t: '08:47', kind: 'deposit' },
  { party: 'P-2042', m: 'card', amt: 500000, t: '10:02', kind: 'deposit' },
  { party: 'P-2052', m: 'card', amt: 500000, t: '12:51', kind: 'deposit' },
];

const CASHBOOK = [
  { t: '08:05', type: 'in', cat: 'Quỹ đầu ca', note: 'Tiền lẻ đầu ca', amt: 2000000, by: 'Thu' },
  { t: '08:15', type: 'out', cat: 'Vật tư', note: 'Khăn, dầu massage', amt: 850000, by: 'Thu' },
  { t: '12:40', type: 'out', cat: 'Đưa đón', note: 'Grab đón nhóm Sato', amt: 120000, by: 'Thu' },
  { t: '13:10', type: 'out', cat: 'Ăn trưa KTV', note: '14 suất', amt: 450000, by: 'Hòa' },
];

const REJECTIONS = [
  { t: '10:12', branch: 'Cơ sở 3', req: '30/10 · 15:00', size: 4, channel: 'Điện thoại', reason: 'Không đủ KTV' },
  { t: '11:48', branch: 'Cơ sở 3', req: '30/10 · 19:00', size: 2, channel: 'Zalo', reason: 'Hết phòng đôi' },
  { t: '13:20', branch: 'Cơ sở 3', req: '31/10 · 10:00', size: 6, channel: 'Klook', reason: 'Nhóm quá lớn cho một khung giờ' },
];

const SKIPS = [
  { t: '11:05', th: 'T07', reason: 'Khách yêu cầu KTV Trang', by: 'Thu' },
  { t: '13:40', th: 'T14', reason: 'KTV mượn chưa đến cơ sở', by: 'Thu' },
];

const CHANNELS = ['Điện thoại', 'Zalo', 'WhatsApp', 'Email', 'Website', 'Instagram', 'WeChat', 'Klook', 'Đối tác KS', 'Walk-in', 'Walk-in hẹn trước'];
const SOURCES = ['Khách quen', 'Google Maps', 'TripAdvisor', 'Giới thiệu', 'Khách sạn', 'Mạng xã hội', 'Đi ngang qua'];
const PARTNERS = ['Klook', 'KS Liberty Central', 'KS Rex', 'Traveloka'];
const ACCOUNTS = [
  { id: 'thu', name: 'Thu', role: 'Lễ tân · ca chiều' },
  { id: 'nam', name: 'Nam', role: 'Lễ tân · ca tối' },
  { id: 'hoa', name: 'Hòa', role: 'Quản lý chi nhánh' },
];
