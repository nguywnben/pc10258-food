-- ============================================================
-- CƠ SỞ DỮ LIỆU CHO ỨNG DỤNG ĐẶT MÓN ĂN - PC10258 FOOD
-- Thiết kế dựa trên cấu trúc frontend Angular
-- ============================================================

-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS pc10258_food
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pc10258_food;

-- ============================================================
-- 1. BẢNG users (Người dùng)
-- Dữ liệu từ: register, login, account
-- ============================================================
CREATE TABLE users (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150)  NOT NULL                        COMMENT 'Họ và tên',
  email       VARCHAR(255)  NOT NULL UNIQUE                 COMMENT 'Email đăng nhập',
  phone       VARCHAR(20)   DEFAULT NULL                    COMMENT 'Số điện thoại',
  password    VARCHAR(255)  NOT NULL                        COMMENT 'Mật khẩu đã hash',
  avatar_url  VARCHAR(500)  DEFAULT NULL                    COMMENT 'URL ảnh đại diện',
  role        ENUM('client','admin') NOT NULL DEFAULT 'client' COMMENT 'Vai trò',
  membership  ENUM('free','premium') NOT NULL DEFAULT 'free'   COMMENT 'Gói thành viên',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO users (id, full_name, email, phone, password, avatar_url, role, membership) VALUES
(1, 'Nguyễn Văn A',   'khach@example.com',      '0901234567', '$2b$10$abcdefghijklmnopqrstuv', 'assets/images/user_avatar.png', 'client', 'free'),
(2, 'Trần Thị B',     'tranthib@example.com',    '0912345678', '$2b$10$abcdefghijklmnopqrstuv', NULL,                            'client', 'premium'),
(3, 'Admin PC10258',   'admin@pc10258food.vn',    '1900001234', '$2b$10$abcdefghijklmnopqrstuv', NULL,                            'admin',  'free');


-- ============================================================
-- 2. BẢNG addresses (Địa chỉ giao hàng)
-- Dữ liệu từ: account → Địa chỉ giao hàng
-- ============================================================
CREATE TABLE addresses (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  label       VARCHAR(50)   NOT NULL DEFAULT 'Nhà riêng'   COMMENT 'Tên nhãn: Nhà riêng, Công ty…',
  full_address VARCHAR(500) NOT NULL                        COMMENT 'Địa chỉ đầy đủ',
  is_default  TINYINT(1)    NOT NULL DEFAULT 0              COMMENT '1 = địa chỉ mặc định',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO addresses (id, user_id, label, full_address, is_default) VALUES
(1, 1, 'Nhà riêng', '123 Đường ABC, P.1, Q.1, TP.HCM',   1),
(2, 1, 'Công ty',   'Tòa nhà XYZ, Quận 3, TP.HCM',       0),
(3, 2, 'Nhà riêng', '456 Đường DEF, P.2, Q.5, TP.HCM',   1);


-- ============================================================
-- 3. BẢNG categories (Danh mục món ăn)
-- Dữ liệu từ: home → Category Carousel
-- ============================================================
CREATE TABLE categories (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL                        COMMENT 'Tên danh mục',
  icon        VARCHAR(10)   DEFAULT NULL                    COMMENT 'Emoji icon',
  sort_order  INT           NOT NULL DEFAULT 0              COMMENT 'Thứ tự hiển thị',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO categories (id, name, icon, sort_order) VALUES
(1, 'Pizza',     '🍕', 1),
(2, 'Bánh rán',  '🍩', 2),
(3, 'Burger',    '🍔', 3),
(4, 'Mexico',    '🌮', 4),
(5, 'Món Á',     '🍜', 5),
(6, 'Kem',       '🍦', 6);


-- ============================================================
-- 4. BẢNG products (Sản phẩm / Món ăn)
-- Dữ liệu từ: home → Danh sách sản phẩm
-- ============================================================
CREATE TABLE products (
  id                INT             AUTO_INCREMENT PRIMARY KEY,
  category_id       INT             NOT NULL,
  name              VARCHAR(200)    NOT NULL                    COMMENT 'Tên món',
  description       TEXT            DEFAULT NULL                COMMENT 'Mô tả ngắn',
  price             INT             NOT NULL                    COMMENT 'Giá bán (VNĐ)',
  image_url         VARCHAR(500)    DEFAULT NULL                COMMENT 'Đường dẫn ảnh',
  rating            DECIMAL(2,1)    NOT NULL DEFAULT 0.0        COMMENT 'Điểm đánh giá trung bình',
  review_count      INT             NOT NULL DEFAULT 0          COMMENT 'Số lượt đánh giá',
  delivery_info     VARCHAR(100)    DEFAULT 'Giao miễn phí'     COMMENT 'Thông tin giao hàng',
  delivery_time     VARCHAR(50)     DEFAULT '10–15 phút'        COMMENT 'Thời gian giao dự kiến',
  is_available      TINYINT(1)      NOT NULL DEFAULT 1          COMMENT '1 = đang bán',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Dữ liệu mẫu (3 mẫu đại diện – đầy đủ 13 sản phẩm từ trang home)
INSERT INTO products (id, category_id, name, description, price, image_url, rating, review_count, delivery_time) VALUES
-- Pizza
(1,  1, 'Pizza Neapolitan',    'Đế mỏng Ý, sốt cà chua và phô mai tươi.',             145000, 'assets/images/neapolitan.png',       4.5, 25, '10–15 phút'),
(2,  1, 'Pizza California',    'Kiểu California, nhiều rau tươi và phô mai.',           165000, 'assets/images/california.png',       4.8, 20, '10–15 phút'),
(3,  1, 'Pizza Sicilian',      'Đế dày Sicilian, sốt đậm đà, phô mai kéo sợi.',       155000, 'assets/images/sicilian.png',         4.2, 22, '10–15 phút'),
-- Burger
(4,  3, 'Burger bò phô mai',   'Burger bò Úc, phô mai tan chảy, ăn kèm rau.',          89000, 'assets/images/burger_bo_pho_mai.png', 4.6, 30, '15–20 phút'),
(5,  3, 'Burger gà giòn',      'Gà giòn, sốt đặc biệt, ăn kèm khoai tây.',            75000, 'assets/images/burger_ga_gion.png',    4.4, 18, '12–18 phút'),
(6,  3, 'Burger đôi',          'Hai nhân bò nướng, phô mai kép, no bụng.',             129000, 'assets/images/burger_doi.png',        4.7, 24, '15–20 phút'),
-- Bánh rán
(7,  2, 'Bánh rán vòng',       'Bánh rán vòng giòn rụm, rắc đường.',                   35000, 'assets/images/banh_ran_vong.png',     4.5, 20, '10–15 phút'),
(8,  2, 'Donut socola',        'Donut phủ socola đắng, béo ngậy.',                      42000, 'assets/images/donut_socola.png',      4.8, 28, '10–15 phút'),
(9,  2, 'Bánh rán nhân kem',   'Bánh rán nhân kem lạnh, ngọt mát.',                    38000, 'assets/images/banh_ran_nhan_kem.png', 4.6, 15, '10–15 phút'),
-- Mexico
(10, 4, 'Taco thịt bò',        'Bánh taco thịt bò Mexico, rau tươi.',                  55000, 'assets/images/taco_thit_bo.png',      4.7, 22, '12–18 phút'),
(11, 4, 'Burrito gà',          'Cuộn bột mì, nhân gà, đậu, cơm.',                      65000, 'assets/images/burrito_ga.png',         4.5, 19, '15–20 phút'),
-- Món Á
(12, 5, 'Phở bò',              'Nước dùng bò hầm, bánh phở tươi, rau thơm.',           55000, 'assets/images/pho_bo.png',            4.9, 45, '15–20 phút'),
(13, 5, 'Bún bò Huế',          'Bún bò cay đậm đà kiểu Huế.',                          50000, 'assets/images/bun_bo_hue.png',        4.7, 32, '12–18 phút'),
-- Kem
(14, 6, 'Kem vani',            'Kem vani truyền thống, mát lạnh.',                      25000, 'assets/images/kem_vani.png',          4.8, 26, '10–15 phút'),
(15, 6, 'Kem socola',          'Kem socola đậm đà, béo ngậy.',                          28000, 'assets/images/kem_socola.png',        4.6, 21, '10–15 phút');


-- ============================================================
-- 5. BẢNG favorites (Món yêu thích)
-- Dữ liệu từ: favorites page
-- ============================================================
CREATE TABLE favorites (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  product_id  INT           NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id),
  CONSTRAINT fk_favorites_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu (user 1 yêu thích 6 món từ trang favorites)
INSERT INTO favorites (user_id, product_id) VALUES
(1, 1),   -- Pizza Neapolitan
(1, 2),   -- Pizza California
(1, 4),   -- Burger bò phô mai
(1, 14),  -- Kem vani
(1, 3),   -- Pizza Sicilian
(1, 7);   -- Bánh rán vòng


-- ============================================================
-- 6. BẢNG wallets (Ví điện tử)
-- Dữ liệu từ: wallet, right-sidebar → Số dư ví
-- ============================================================
CREATE TABLE wallets (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL UNIQUE,
  balance     INT           NOT NULL DEFAULT 0              COMMENT 'Số dư hiện tại (VNĐ)',
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO wallets (user_id, balance) VALUES
(1, 520000),
(2, 1200000),
(3, 0);


-- ============================================================
-- 7. BẢNG wallet_transactions (Lịch sử giao dịch ví)
-- Dữ liệu từ: wallet → Lịch sử giao dịch
-- ============================================================
CREATE TABLE wallet_transactions (
  id              INT             AUTO_INCREMENT PRIMARY KEY,
  wallet_id       INT             NOT NULL,
  type            ENUM('deposit','payment','refund') NOT NULL  COMMENT 'Loại giao dịch',
  amount          INT             NOT NULL                      COMMENT 'Số tiền (dương = cộng, âm = trừ)',
  description     VARCHAR(255)    NOT NULL                      COMMENT 'Mô tả giao dịch',
  reference_code  VARCHAR(50)     DEFAULT NULL                  COMMENT 'Mã tham chiếu (VD: mã đơn hàng)',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_code, created_at) VALUES
(1, 'deposit',  200000,  'Nạp tiền',                     NULL,       '2026-03-16 10:15:00'),
(1, 'payment',  -178000, 'Thanh toán đơn #PC-5821',      'PC-5821',  '2026-03-14 19:42:00'),
(1, 'refund',   30000,   'Hoàn mã giảm giá',             NULL,       '2026-03-12 09:05:00');


-- ============================================================
-- 8. BẢNG orders (Đơn hàng)
-- Dữ liệu từ: orders page
-- ============================================================
CREATE TABLE orders (
  id              INT             AUTO_INCREMENT PRIMARY KEY,
  user_id         INT             NOT NULL,
  order_code      VARCHAR(20)     NOT NULL UNIQUE              COMMENT 'Mã đơn hàng (VD: PC-5821)',
  status          ENUM('pending','preparing','delivering','delivered','cancelled')
                                  NOT NULL DEFAULT 'pending'   COMMENT 'Trạng thái đơn',
  payment_method  VARCHAR(100)    DEFAULT NULL                 COMMENT 'Phương thức thanh toán',
  subtotal        INT             NOT NULL DEFAULT 0           COMMENT 'Tạm tính (VNĐ)',
  discount        INT             NOT NULL DEFAULT 0           COMMENT 'Giảm giá (VNĐ)',
  delivery_fee    INT             NOT NULL DEFAULT 0           COMMENT 'Phí giao hàng (VNĐ)',
  total           INT             NOT NULL DEFAULT 0           COMMENT 'Tổng thanh toán (VNĐ)',
  address_id      INT             DEFAULT NULL                 COMMENT 'Địa chỉ giao hàng',
  note            TEXT            DEFAULT NULL                 COMMENT 'Ghi chú đơn hàng',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO orders (id, user_id, order_code, status, payment_method, subtotal, discount, delivery_fee, total, address_id, created_at) VALUES
(1, 1, 'PC-5821', 'delivering', 'Thanh toán khi nhận',  323000, 0,     0,     323000, 1, '2026-03-16 10:15:00'),
(2, 1, 'PC-5790', 'delivered',  'Ví PC10258',            95000, 0,     0,      95000, 1, '2026-03-14 19:42:00'),
(3, 1, 'PC-5601', 'delivered',  'Thanh toán khi nhận',  420000, 0,     15000, 435000, 1, '2026-03-10 12:08:00');


-- ============================================================
-- 9. BẢNG order_items (Chi tiết đơn hàng)
-- Dữ liệu từ: orders page → Danh sách món trong đơn
-- ============================================================
CREATE TABLE order_items (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           NOT NULL,
  product_id  INT           DEFAULT NULL,
  product_name VARCHAR(200) NOT NULL                        COMMENT 'Tên món (snapshot tại thời điểm đặt)',
  quantity    INT           NOT NULL DEFAULT 1,
  unit_price  INT           NOT NULL                        COMMENT 'Đơn giá tại thời điểm đặt (VNĐ)',
  subtotal    INT           NOT NULL                        COMMENT 'Thành tiền = quantity × unit_price',
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
-- Đơn PC-5821
(1, 1, 'Pizza Neapolitan',   1, 145000, 145000),
(1, 4, 'Burger bò phô mai',  2,  89000, 178000),
-- Đơn PC-5790
(2, 14, 'Kem vani',           2,  25000,  50000),
(2, 7,  'Bánh rán vòng',      3,  15000,  45000),
-- Đơn PC-5601
(3, NULL, 'Combo pizza gia đình', 1, 420000, 420000);


-- ============================================================
-- 10. BẢNG cart_items (Giỏ hàng)
-- Dữ liệu từ: right-sidebar → Giỏ hàng
-- ============================================================
CREATE TABLE cart_items (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  product_id  INT           NOT NULL,
  quantity    INT           NOT NULL DEFAULT 1              COMMENT 'Số lượng',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu (giỏ hàng user 1 từ right-sidebar)
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
(1, 1,  1),  -- Pizza Neapolitan ×1
(1, 3,  2),  -- Pizza Sicilian ×2
(1, 2,  1),  -- Pizza California ×1
(1, 4,  2),  -- Burger bò phô mai ×2
(1, 7,  3),  -- Bánh rán vòng ×3
(1, 14, 1);  -- Kem vani ×1


-- ============================================================
-- 11. BẢNG promotions (Mã giảm giá / Khuyến mãi)
-- Dữ liệu từ: right-sidebar → Mã giảm giá, upgrade
-- ============================================================
CREATE TABLE promotions (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50)   NOT NULL UNIQUE              COMMENT 'Mã giảm giá',
  description     VARCHAR(255)  NOT NULL                     COMMENT 'Mô tả',
  discount_type   ENUM('fixed','percent') NOT NULL           COMMENT 'Loại giảm: cố định / phần trăm',
  discount_value  INT           NOT NULL                     COMMENT 'Giá trị giảm (VNĐ hoặc %)',
  min_order       INT           NOT NULL DEFAULT 0           COMMENT 'Đơn tối thiểu để áp dụng',
  max_uses        INT           DEFAULT NULL                 COMMENT 'Chỉ dùng x lần (NULL = không giới hạn)',
  used_count      INT           NOT NULL DEFAULT 0,
  start_date      DATETIME      NOT NULL,
  end_date        DATETIME      NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO promotions (code, description, discount_type, discount_value, min_order, max_uses, start_date, end_date) VALUES
('CANTHO-10258',  'Mã tặng khi nâng cấp thành viên Cần Thơ',       'fixed',   45000,  100000, 1,    '2026-03-01 00:00:00', '2026-12-31 23:59:59'),
('COMBO20',       'Giảm 20% khi đặt combo gia đình',                'percent', 20,     250000, NULL, '2026-03-01 00:00:00', '2026-04-30 23:59:59'),
('WEEKEND15',     'Combo cuối tuần giảm thêm 15% cho đơn từ 250k',  'percent', 15,     250000, NULL, '2026-03-01 00:00:00', '2026-06-30 23:59:59');


-- ============================================================
-- 12. BẢNG conversations (Hội thoại / Tin nhắn)
-- Dữ liệu từ: messages page → Danh sách hội thoại
-- ============================================================
CREATE TABLE conversations (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  title         VARCHAR(200)  NOT NULL                      COMMENT 'Tiêu đề hội thoại',
  type          ENUM('support','shipper','promotion') NOT NULL DEFAULT 'support' COMMENT 'Loại hội thoại',
  avatar_text   VARCHAR(10)   DEFAULT NULL                  COMMENT 'Text hiển thị avatar (VD: CS)',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO conversations (id, user_id, title, type, avatar_text) VALUES
(1, 1, 'Hỗ trợ PC10258',   'support',   'CS'),
(2, 1, 'Shipper Minh',      'shipper',   NULL),
(3, 1, 'Khuyến mãi',        'promotion', NULL);


-- ============================================================
-- 13. BẢNG messages (Tin nhắn chi tiết)
-- Dữ liệu từ: messages page → Nội dung chat
-- ============================================================
CREATE TABLE messages (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT           NOT NULL,
  sender_id       INT           DEFAULT NULL                COMMENT 'NULL = hệ thống / bot',
  sender_type     ENUM('user','agent','system') NOT NULL DEFAULT 'user',
  content         TEXT          NOT NULL                     COMMENT 'Nội dung tin nhắn',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE SET NULL
) ENGINE=InnoDB;

-- Dữ liệu mẫu (chat trong conversation #1)
INSERT INTO messages (conversation_id, sender_id, sender_type, content, created_at) VALUES
(1, NULL, 'agent',  'Xin chào anh/chị! Đơn #PC-5821 của mình đang được bếp chuẩn bị ạ.',                                           '2026-03-16 10:20:00'),
(1, 1,    'user',   'Cho em hỏi giao khoảng mấy giờ ạ?',                                                                            '2026-03-16 10:22:00'),
(1, NULL, 'agent',  'Dự kiến shipper lấy món lúc 11:20, tới tay mình khoảng 11:45–12:00 hôm nay ạ. Cảm ơn mình đã đợi!',            '2026-03-16 10:23:00');


-- ============================================================
-- 14. BẢNG membership_plans (Gói nâng cấp thành viên)
-- Dữ liệu từ: upgrade page
-- ============================================================
CREATE TABLE membership_plans (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL                    COMMENT 'Tên gói',
  price           INT           NOT NULL                    COMMENT 'Giá / tháng (VNĐ)',
  features        JSON          DEFAULT NULL                COMMENT 'Danh sách quyền lợi',
  is_popular      TINYINT(1)    NOT NULL DEFAULT 0          COMMENT '1 = gói phổ biến',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO membership_plans (id, name, price, features, is_popular) VALUES
(1, 'Miễn phí',          0,     '["Giao hàng theo thời gian dự kiến","Xem danh mục và đặt món","Không có mã giảm thêm"]',                     0),
(2, 'Thành viên Cần Thơ', 49000, '["Tặng mã giảm giá khi nâng cấp","Ưu tiên một số ưu đãi khu vực","Xem nhanh các món gợi ý"]', 1),
(3, 'VIP',               99000, '["Miễn phí giao hàng mọi đơn","Giảm 10% toàn menu","Hỗ trợ ưu tiên 24/7"]',                                0);


-- ============================================================
-- 15. BẢNG payments (Giao dịch thanh toán)
-- Dữ liệu từ: payment page
-- ============================================================
CREATE TABLE payments (
  id              INT             AUTO_INCREMENT PRIMARY KEY,
  user_id         INT             NOT NULL,
  reference_code  VARCHAR(50)     NOT NULL UNIQUE            COMMENT 'Mã giao dịch (VD: PC-PAY-10258)',
  type            ENUM('deposit','order','upgrade') NOT NULL COMMENT 'Loại: nạp tiền / thanh toán đơn / nâng cấp',
  method          VARCHAR(100)    NOT NULL                   COMMENT 'Phương thức: bank, ewallet, cod',
  amount          INT             NOT NULL                   COMMENT 'Số tiền (VNĐ)',
  status          ENUM('pending','completed','failed','cancelled')
                                  NOT NULL DEFAULT 'pending',
  order_id        INT             DEFAULT NULL               COMMENT 'Liên kết đơn hàng (nếu type = order)',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id)  REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO payments (user_id, reference_code, type, method, amount, status, order_id, created_at) VALUES
(1, 'PC-PAY-10258', 'deposit', 'Chuyển khoản ngân hàng', 100000,  'completed', NULL, '2026-03-16 10:15:00'),
(1, 'PC-PAY-10259', 'order',   'Ví PC10258',              95000,  'completed', 2,    '2026-03-14 19:42:00'),
(1, 'PC-PAY-10260', 'order',   'Thanh toán khi nhận',    435000,  'completed', 3,    '2026-03-10 12:08:00');


-- ============================================================
-- INDEX bổ sung để tối ưu truy vấn phổ biến
-- ============================================================
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_price       ON products(price);
CREATE INDEX idx_orders_user_status   ON orders(user_id, status);
CREATE INDEX idx_orders_created       ON orders(created_at DESC);
CREATE INDEX idx_wt_wallet_created    ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_cart_user            ON cart_items(user_id);
CREATE INDEX idx_favorites_user       ON favorites(user_id);
CREATE INDEX idx_messages_conv        ON messages(conversation_id, created_at);
