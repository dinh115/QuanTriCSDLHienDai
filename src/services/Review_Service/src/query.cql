--tao keyspace
Create keyspace Review_data with replication = {'class': 'SimpleStrategy', 'replication_factor': 1}; 
use Review_data;
DROP TABLE product_reviews;
--tao column family:
CREATE TABLE product_reviews (
    masp text,
    mauser text,
    username text,
    rating int,
    review_date timestamp,
    phanloai text,
    chatluong text,
    mota_dung text,
    noidung text,
    images list<text>,
    has_images boolean,
    reply_date timestamp,
    reply_content text,
    PRIMARY KEY (masp, mauser)
);

CREATE INDEX IF NOT EXISTS rating_idx on product_reviews(rating);
CREATE INDEX IF NOT EXISTS has_images_idx on product_reviews(has_images);

--Nhap lieu
----Nhap lieu co hinh anh, co cac truong khong bat buoc
INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, images, has_images
)
VALUES (
    '684ad7d68f60ecc151354d24',
    '6849a57d0a19543941aa3598',
    'ndai123',
    5,
    toTimestamp(now()),
    '43 - Đen',
    'xuất sắc',
    'Chính xác',
    'Giày mang lên form đẹp...',
    ['https://down-mx.img.susercontent.com/file/sg-11134201-23020-xijaiue07env92_tn',
     'https://down-mx.img.susercontent.com/file/sg-11134201-23020-ebdkfbf07envd6_tn'],
    true
);
----Nhap lieu ko hinh anh, co mot vai truong khong bat buoc
INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    chatluong, mota_dung,
    noidung, has_images
)
VALUES (
    '684ad7d68f60ecc151354d25',
    '6849a57d0a19543941aa3598',
    'ndai123',
    4,
    toTimestamp(now()),
    'xuất sắc',
    'Chính xác',
    'Bé nhà mình rất thích loại sữa này. Giao hàng nhanh chóng, đóng gói chắc chắn.',
    false
);

INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, has_images
)
VALUES (
    '684ad7d68f60ecc151354d24',
    '684b003e8f60ecc151354d30',
    'qdinh123',
    5,
    toTimestamp(now()),
    '43 - Trắng',
    'tốt',
    'Chính xác',
    'Sản phẩm rất tốt',
    false
);

--insert null:
INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, has_images
)
VALUES (
    '684ad7d68f60ecc151354d24',
    '684b003e8f60ecc151354d30',
    'qdinh123',
    5,
    toTimestamp(now()),
    null,
    null,
    null,
    'Sản phẩm rất tốt',
    false
);

--Truy van:
--Lay tat ca review cua mot san pham
SELECT * FROM product_reviews
WHERE masp = '684ad7d68f60ecc151354d25';
--Them tra loi
UPDATE product_reviews
SET reply_date = toTimestamp(now()),
    reply_content = 'ACảm ơn bạn đã đánh giá sản phẩm, Shop rất vui khi thấy bạn thích sản phẩm này.'
WHERE masp = '684ad7d68f60ecc151354d25'
  AND mauser = '6849a57d0a19543941aa3598';
--Lay tat ca review 5-4-3-2-1 sao (ALLOW FILTERING)
SELECT * FROM product_reviews
WHERE masp = '684ad7d68f60ecc151354d25' AND rating = 5;
--Lay tat ca review co hinh anh (ALLOW FILTERING)
SELECT * FROM product_reviews
WHERE masp = '684ad7d68f60ecc151354d25' AND has_images = true;