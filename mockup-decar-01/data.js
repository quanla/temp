// Content mirrored from https://decar.com.vn (Di tích Xuân Đỉnh). Images are hot-linked from the source site.
const S = "https://decar.com.vn/storage/";

window.DECAR = {
    heroImages: [
        {src: S + "381/01M4CP41STSZEPFZZ886V35XHP.jpg", name: "Đình Giàn"},
        {src: S + "382/01M4CP8EA1WRHBSE4FE6EADF2F.jpg", name: "Đền Sóc"},
        {src: S + "386/01M4DDBJYHWNY2S6PB0E2FHYHT.jpg", name: "Đình Xuân Tảo"},
    ],

    ranks: {
        qg: "Di tích Quốc gia",
        tp: "Di tích Cấp Thành phố",
    },

    kinds: {
        dinh: "Đình",
        den: "Đền · Miếu · Phủ",
        chua: "Chùa",
        tho: "Nhà thờ · Lăng mộ",
    },

    // x/y are positions on a schematic (not geographic) sketch of the ward, 0–100.
    relics: [
        {
            id: "den-soc", name: "Đền Sóc", rank: "tp", kind: "den", village: "Xuân Đỉnh",
            img: S + "391/conversions/01M4DG5SVJJK3BAGR599JBS6D2-thumb.jpg", vr: true, x: 30, y: 30,
            short: "Chốn linh thiêng bậc nhất vùng cửa ngõ thủ đô, gắn liền với truyền thuyết Thánh Gióng (Phù Đổng Thiên Vương).",
            history: "Đền Sóc là một trong những chốn linh thiêng bậc nhất vùng cửa ngõ thủ đô, gắn liền với truyền thuyết Thánh Gióng (Phù Đổng Thiên Vương) – một trong tứ bất tử của tín ngưỡng dân gian Việt Nam. Theo sử sách, nơi đây là không gian thiêng ghi dấu tích vị anh hùng dân tộc dừng chân, cởi giáp áo bay về trời sau khi đánh thắng giặc Ân xâm lược.",
            culture: "Ngôi đền không chỉ là trung tâm tín ngưỡng thờ phụng Đức Thánh Gióng mà còn lưu giữ những giá trị văn hóa phi vật thể đặc sắc, tiêu biểu là Lễ hội Gióng đền Sóc – Di sản văn hóa phi vật thể đại diện của nhân loại được UNESCO ghi danh, thu hút hàng vạn du khách mỗi dịp đầu xuân.",
        },
        {
            id: "dinh-gian", name: "Đình Giàn", rank: "qg", kind: "dinh", village: "Cáo Đỉnh",
            img: S + "408/conversions/01M4DJD941W24W30MAEWBQMH4P-thumb.jpg", vr: true, x: 52, y: 42,
            short: "Tên Nôm là đình Cáo Đỉnh, tọa lạc tại làng cổ Cáo Đỉnh, nay thuộc phường Xuân Đỉnh.",
        },
        {
            id: "dinh-xuan-tao", name: "Đình Xuân Tảo", rank: "qg", kind: "dinh", village: "Xuân Tảo",
            img: S + "289/conversions/01M4BPGRDV0MN461PYT91VX36E-thumb.jpg", vr: true, x: 22, y: 70,
            short: "Tọa lạc tại làng cổ Xuân Tảo (tên Nôm cổ là làng Cáo Tảo). Nơi lưu giữ nghệ thuật Ca trù.",
        },
        {
            id: "dinh-hoang", name: "Đình Hoàng", rank: "tp", kind: "dinh", village: "Xuân Đỉnh",
            img: S + "237/conversions/01M392SNGKTXYP6CEKJ8Q5QW40-thumb.jpg", vr: false, x: 40, y: 18,
            short: "Được xây dựng bởi Đông Chinh Vương (hoàng tử con vua Lý Thái Tổ) và công chúa Tả Minh Hiến.",
        },
        {
            id: "chua-thien-loc", name: "Chùa Thiên Lộc", rank: "tp", kind: "chua", village: "Khu phố Lộc",
            img: S + "316/conversions/01M4BQ2VP2GMZEM6ZDHDVJTWJD-thumb.jpg", vr: false, x: 72, y: 26,
            short: "Tên chữ là Thiên Lộc Tự, dân gian quen gọi là Chùa Lộc, tọa lạc tại khu phố Lộc.",
        },
        {
            id: "phu-chua", name: "Phủ Chúa", rank: "tp", kind: "den", village: "Khu phố Lộc",
            img: S + "400/conversions/01M4DJ7JN1KEEZF7TKBKYVTCT5-thumb.jpg", vr: false, x: 80, y: 34,
            short: "Tên cổ là Quế Phủ hay Chiêu Nghi Phủ, tọa lạc tại khu phố Lộc.",
        },
        {
            id: "mieu-vu", name: "Miếu Vũ", rank: "qg", kind: "den", village: "Thôn Nhang",
            img: S + "409/conversions/01M4DJFMM7GBS2RAYYTA3RWD4P-thumb.jpg", vr: false, x: 60, y: 56,
            short: "Tọa lạc tại thôn Nhang (khu Nhang), làng Cáo Đỉnh xưa.",
        },
        {
            id: "ho-duong", name: "Nhà thờ họ Dương", rank: "tp", kind: "tho", village: "Cáo Đỉnh",
            img: S + "413/conversions/01M4DK0NZ2MA90D5CSSAKV9Y3J-thumb.jpg", vr: false, x: 46, y: 54,
            short: "Tọa lạc tại xóm Đình Thượng, làng Cáo Đỉnh xưa.",
        },
        {
            id: "den-thanh-van", name: "Đền Thanh Vân", rank: "tp", kind: "den", village: "Cáo Đỉnh",
            img: S + "343/conversions/01M4BRENBCXZZPAT5RSJVAR1ZB-thumb.jpg", vr: false, x: 58, y: 36,
            short: "Số 403 đường Xuân Đỉnh, thôn Cáo Đỉnh (làng Giàn xưa).",
        },
        {
            id: "nguyen-cong-co", name: "Nhà thờ và lăng mộ Quận công Nguyễn Công Cơ", rank: "qg", kind: "tho", village: "Xuân Đỉnh",
            img: S + "379/conversions/01M4BS78V7T7XDDQDGQR58XEE8-thumb.jpg", vr: false, x: 34, y: 48,
            short: "Nơi thờ và an táng Quận công Nguyễn Công Cơ (1675–1733).",
        },
        {
            id: "ho-do", name: "Nhà thờ họ Đỗ Đại Tôn Tam Chi", rank: "tp", kind: "tho", village: "Xuân Lộc",
            img: S + "368/conversions/01M4BS5VH7JTG7F4F6P1JA9WDH-thumb.jpg", vr: false, x: 68, y: 46,
            short: "Số 100 ngõ 205 đường Xuân Đỉnh, tổ dân phố Xuân Lộc (làng Cảo Đỉnh xưa).",
        },
        {
            id: "chua-khai-nguyen", name: "Chùa Khai Nguyên", rank: "qg", kind: "chua", village: "Quán La",
            img: S + "424/conversions/01M4SMC4RPBGNYQN6ZQ313JX33-thumb.jpg", vr: false, x: 78, y: 74,
            short: "Khai Nguyên Tự 開元寺, tổ dân phố số 2 (làng Quán La Xã xưa), ngõ 38 đường Xuân La.",
        },
        {
            id: "dinh-quan-la", name: "Đình Quán La", rank: "qg", kind: "dinh", village: "Quán La",
            img: S + "432/conversions/01M4SMDETGXKASAVB8DBJET6K9-thumb.jpg", vr: false, x: 70, y: 82,
            short: "Quán La Đình 觀羅亭, tọa lạc trên đỉnh gò Thất Diệu lịch sử.",
        },
    ],

    gallery: [
        {src: S + "392/conversions/01M4DG5T0F9P0P84PTFYZGE7YM-thumb.jpg", name: "Đền Sóc"},
        {src: S + "301/conversions/01M4BPW691HJT0D2CY1N0BA0KT-thumb.jpg", name: "Đình Giàn"},
        {src: S + "290/conversions/01M4BPGRG5EDZDYWXB4S9Y9JJP-thumb.jpg", name: "Đình Xuân Tảo"},
        {src: S + "208/conversions/01M38RVV5DJFNH74NP8ZZ77E5T-thumb.jpg", name: "Đình Hoàng"},
        {src: S + "316/conversions/01M4BQ2VP2GMZEM6ZDHDVJTWJD-thumb.jpg", name: "Chùa Thiên Lộc"},
        {src: S + "432/conversions/01M4SMDETGXKASAVB8DBJET6K9-thumb.jpg", name: "Đình Quán La"},
    ],

    news: [
        {
            date: "2026-09-24", tag: "Sự kiện",
            img: S + "181/conversions/01M38DY93F6XTB26ZZE7MCWSWG-thumb.jpg",
            title: "Phường Xuân Đỉnh tổ chức Đêm hội Trăng rằm năm 2026 với nhiều hoạt động ý nghĩa dành cho thiếu nhi",
            body: "Tối 22/9/2026, tại Trường THCS Xuân Đỉnh, Đảng ủy – HĐND – UBND – Ủy ban MTTQ Việt Nam phường Xuân Đỉnh tổ chức chương trình “Đêm hội Trăng rằm”.",
        },
        {
            date: "2026-09-22", tag: "Cộng đồng",
            img: S + "242/conversions/01M3A53DMDEJB1R5WS23X8HHZK-thumb.jpg",
            title: "Xuân Đỉnh: triển khai kế hoạch khám sức khỏe miễn phí cho người dân",
            body: "Sáng ngày 21/9, phường Xuân Đỉnh tổ chức Hội nghị triển khai kế hoạch khám sức khỏe, khám sàng lọc miễn phí cho người dân từ đủ 18 tuổi trở lên.",
        },
        {
            date: "2026-09-20", tag: "Di sản số",
            img: S + "200/conversions/01M38M28CHHN41M7HG9G266FTD-thumb.jpg",
            title: "Đưa di sản Xuân Đỉnh lên không gian số: Lan tỏa giá trị Đình Xuân Tảo và nghệ thuật Ca trù",
            body: "Tối ngày 19/9/2026, tại Di tích lịch sử cấp quốc gia Đình Xuân Tảo (TDP Trung 3), UBND phường Xuân Đỉnh tổ chức phiên livestream giới thiệu di tích.",
        },
    ],
};
