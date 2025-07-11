-- Create a keyspace
CREATE KEYSPACE IF NOT EXISTS Review_data
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}; 

-- Use the newly created keyspace
USE Review_data;

CREATE TABLE IF NOT EXISTS users(
    userid uuid,
    username text,
    role text,
    created_at TIMESTAMP,
    PRIMARY KEY (userid)
    );
INSERT INTO users (userid, username, role, created_at) VALUES (11111111-1111-1111-1111-111111111111, 'ndai123', 'customer', toTimestamp(now()));
INSERT INTO users (userid, username, role, created_at) VALUES (21111111-1111-1111-1111-111111111111, 'shop123', 'shop_owner', toTimestamp(now()));
INSERT INTO users (userid, username, role, created_at) VALUES (31111111-1111-1111-1111-111111111111, 'admin123', 'admin', toTimestamp(now()));
INSERT INTO users (userid, username, role, created_at) VALUES (c8543155-ee6d-58a9-90d8-e8947f83515e, 'shop234', 'shop_owner', toTimestamp(now()));
CREATE TABLE IF NOT EXISTS products(
    productid uuid,
    productname text,
    description text,
    shopid uuid,
    image text,
    created_at TIMESTAMP,
    PRIMARY KEY(productid)
);
INSERT INTO products (productid, productname, description, shopid, images, created_at) VALUES (10000000-0000-0000-0000-000000000000, 'Sữa tiệt trùng TH True Milk', 'Thùng 36 hộp', 21111111-1111-1111-1111-111111111111, 'https://shopsuatramanh.com/upload/product/sua-tuoi-tiet-trung-co-duong-th-true-milk-hop-180ml-thung-8340.jpg', toTimestamp(now()));
INSERT INTO products (productid, productname, description, shopid, image, created_at) 
VALUES (f47ac10b-58cc-4372-a567-0e02b2c3d479, 
        'Sony WH-1000XM5 Wireless Headphones', 
        'Industry-leading noise canceling wireless headphones with premium sound quality and all-day comfort', 21111111-1111-1111-1111-111111111111, 
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 
        toTimestamp(now())
        );


CREATE TABLE IF NOT EXISTS productReviews (
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
INSERT INTO productReviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, images, has_images
)
VALUES (
    10000000-0000-0000-0000-000000000000,
    11111111-1111-1111-1111-111111111111,
    'ndai123',
    5,
    toTimestamp(now()),
    'Sữa dâu',
    'Ngon, bổ dưỡng',
    'Chính xác',
    'Giao hàng nhanh, vừa rẻ và chất lượng lại tốt, nên mua!',
    ['https://down-mx.img.susercontent.com/file/sg-11134201-23020-xijaiue07env92_tn',
     'https://down-mx.img.susercontent.com/file/sg-11134201-23020-ebdkfbf07envd6_tn'],
    true
);


CREATE TABLE productReviewsSummary (
    masp uuid PRIMARY KEY,
    total_reviews counter,
    rating_5 counter,
    rating_4 counter,
    rating_3 counter,
    rating_2 counter,
    rating_1 counter,
    has_images counter
);

UPDATE productReviewsSummary
SET total_reviews = total_reviews + 1,
    rating_5 = rating_5 + 1,
    rating_4 = rating_4 + 0,
    rating_3 = rating_3 + 0,
    rating_2 = rating_2 + 0,
    rating_1 = rating_1 + 0,
    has_images = has_images + 1
WHERE masp = 10000000-0000-0000-0000-000000000000;
