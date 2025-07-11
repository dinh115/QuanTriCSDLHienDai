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


------------------------------------------------------------------
------------------------New Version-------------------------------
------------------------------------------------------------------
CREATE TABLE product_reviews_new (
    masp uuid,
    mauser uuid,
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
    has_reply boolean,
    PRIMARY KEY (masp, mauser)
);

create table users(
    userid uuid,
    username text,
    role text,
    PRIMARY KEY (userid)
    );

create table products(
    productid uuid,
    productname text,
    description text,
    shopid uuid,
    PRIMARY KEY(productid)
);

-- Nhap danh gia san pham
-- Danh gia co hinh anh, cac truong khong bat buoc nhu phanloai, chatluong, mota_dung
INSERT INTO product_reviews_new (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, images, has_images, has_reply
)
VALUES (
    22417326-f9fd-4954-9ead-3ceafd52f3d6,
    1bda3c29-b074-4980-99fa-6554d7a6a871,
    'ndai123',
    5,
    toTimestamp(now()),
    '43 - Đen',
    'xuất sắc',
    'Chính xác',
    'Giày mang lên form đẹp...',
    ['https://down-mx.img.susercontent.com/file/sg-11134201-23020-xijaiue07env92_tn',
     'https://down-mx.img.susercontent.com/file/sg-11134201-23020-ebdkfbf07envd6_tn'],
     true,
     false
);

----Nhap lieu ko hinh anh, co mot vai truong khong bat buoc
INSERT INTO product_reviews_new (
    masp, mauser, username, rating, review_date,
    chatluong, mota_dung,
    noidung, has_images, has_reply
)
VALUES (
    86890117-a1cd-48cf-97ae-1e7cc9c1f529,
    1bda3c29-b074-4980-99fa-6554d7a6a871,
    'ndai123',
    5,
    toTimestamp(now()),
    'Tot',
    'Dung nhu trong anh',
    'Máy sấy tóc sấy rất mạnh, mau khô',
    false,
    false
);

--Truy van:
--Lay tat ca review cua mot san pham
SELECT * FROM product_reviews_new
WHERE masp = 22417326-f9fd-4954-9ead-3ceafd52f3d6;
--Them tra loi
UPDATE product_reviews_new
SET reply_date = toTimestamp(now()),
    reply_content = 'ACảm ơn bạn đã đánh giá sản phẩm, Shop rất vui khi thấy bạn thích sản phẩm này.'
    has_reply = true
WHERE masp = 22417326-f9fd-4954-9ead-3ceafd52f3d6
  AND mauser = 1bda3c29-b074-4980-99fa-6554d7a6a871;
--Lay tat ca review 5-4-3-2-1 sao (ALLOW FILTERING)

SELECT * FROM product_reviews_new
WHERE masp = 22417326-f9fd-4954-9ead-3ceafd52f3d6 AND rating = 5 ALLOW FILTERING;

SELECT * FROM product_reviews_new
WHERE masp = 22417326-f9fd-4954-9ead-3ceafd52f3d6 AND has_images = true ALLOW FILTERING;

------------------------------------------------------------------
------------------------New Version-------------------------------
------------------------------------------------------------------
CREATE TABLE product_review_summary (
    masp uuid PRIMARY KEY,
    total_reviews counter,
    rating_5 counter,
    rating_4 counter,
    rating_3 counter,
    rating_2 counter,
    rating_1 counter,
    has_images counter
);

UPDATE product_review_summary
SET total_reviews = total_reviews + 6,
    rating_5 = rating_5 + 2,
    rating_4 = rating_4 + 0,
    rating_3 = rating_3 + 1,
    rating_2 = rating_2 + 2,
    rating_1 = rating_1 + 1,
    has_images = has_images + 5
WHERE masp = 22417326-f9fd-4954-9ead-3ceafd52f3d6;

UPDATE product_review_summary
SET total_reviews = total_reviews + 2,
    rating_5 = rating_5 + 1,
    rating_4 = rating_4 + 1,
    rating_3 = rating_3 + 0,
    rating_2 = rating_2 + 0,
    rating_1 = rating_1 + 0,
    has_images = has_images + 0
WHERE masp = 86890117-a1cd-48cf-97ae-1e7cc9c1f529;


----------------------------------------FOR BIG DATA GENERATION:
CREATE TABLE product_reviews_test (
    masp uuid,
    mauser uuid,
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
    has_reply boolean,
    PRIMARY KEY (masp, mauser)
);

CREATE TABLE product_review_summary_test (
    masp uuid PRIMARY KEY,
    total_reviews counter,
    rating_5 counter,
    rating_4 counter,
    rating_3 counter,
    rating_2 counter,
    rating_1 counter,
    has_images counter
);
--cassandra
SELECT * FROM product_reviews_test
WHERE masp = DB21F0C9-F810-46A7-B42F-013B24BBA361 AND rating = 5 ALLOW FILTERING;

SELECT * FROM product_reviews_test
WHERE masp = 45E97722-A8C2-4205-AE2B-03DC4078C31E AND rating = 5 AND has_images = true ALLOW FILTERING;

SELECT rating_4 FROM product_review_summary_test
WHERE masp = 26C98559-87E2-4178-9EB9-B69F4923D1D5;

UPDATE product_reviews_new
SET reply_date = toTimestamp(now()),
    reply_content = 'ACảm ơn bạn đã đánh giá sản phẩm, Shop rất vui khi thấy bạn thích sản phẩm này.'
    has_reply = true
WHERE masp = 45E97722-A8C2-4205-AE2B-03DC4078C31E
  AND mauser = 8C59B5ED-4C91-4D7C-9068-9112377D4478;

--sql server:
SET STATISTICS TIME ON 

SELECT * FROM product_reviews_test_1
WHERE masp = 'DB21F0C9-F810-46A7-B42F-013B24BBA361' AND rating = 5;


SELECT * FROM product_reviews_test_1
WHERE masp = '45E97722-A8C2-4205-AE2B-03DC4078C31E' AND rating = 5 AND has_images = 1;

SELECT count(*) FROM product_reviews_test_1
WHERE masp = '26C98559-87E2-4178-9EB9-B69F4923D1D5' AND rating = 4;

UPDATE product_reviews_test_1
SET reply_date = GETDATE(),
    reply_content = 'ACảm ơn bạn đã đánh giá sản phẩm, Shop rất vui khi thấy bạn thích sản phẩm này.',
    has_reply = 1
WHERE masp = '45E97722-A8C2-4205-AE2B-03DC4078C31E'
  AND mauser = '8C59B5ED-4C91-4D7C-9068-9112377D4478';

SQL Server parse and compile time: 
   CPU time = 0 ms, elapsed time = 2 ms.
SQL Server parse and compile time: 
   CPU time = 0 ms, elapsed time = 0 ms.

(49 rows affected)

 SQL Server Execution Times:
   CPU time = 0 ms,  elapsed time = 24 ms.

Completion time: 2025-06-22T14:52:15.1829262+07:00