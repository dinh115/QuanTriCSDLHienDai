--tao keyspace
Create keyspace Review_data with replication = {'class': 'SimpleStrategy', 'replication_factor': 1}; 
use Review_data;
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
    reply_date timestamp,
    reply_content text,
    PRIMARY KEY (masp, mauser)
);
--Nhap lieu
INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, images
)
VALUES (
    '684ad7d68f60ecc151354d25',
    '6849a57d0a19543941aa3598',
    'ndai123',
    5,
    toTimestamp(now()),
    '43 - Đen',
    'xuất sắc',
    'Chính xác',
    'Giày mang lên form đẹp...',
    ['https://down-mx.img.susercontent.com/file/sg-11134201-23020-xijaiue07env92_tn',
     'https://down-mx.img.susercontent.com/file/sg-11134201-23020-ebdkfbf07envd6_tn']
);

INSERT INTO product_reviews (
    masp, mauser, username, rating, review_date,
    phanloai, chatluong, mota_dung,
    noidung, images
)
VALUES (
    '684ad7d68f60ecc151354d25',
    '6849a57d0a19543941aa3598',
    'ndai123',
    5,
    toTimestamp(now()),
    '43 - Đen',
    'xuất sắc',
    'Chính xác',
    'Giày mang lên form đẹp...',
    ['https://down-mx.img.susercontent.com/file/sg-11134201-23020-xijaiue07env92_tn',
     'https://down-mx.img.susercontent.com/file/sg-11134201-23020-ebdkfbf07envd6_tn']
);