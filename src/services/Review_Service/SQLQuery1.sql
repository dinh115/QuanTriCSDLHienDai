create database Review_Service_DB
go
use Review_Service_DB
go

CREATE TABLE ProductReviews (
    masp UNIQUEIDENTIFIER,
    mauser UNIQUEIDENTIFIER,
    chatluong NVARCHAR(255) NULL,
    has_images BIT NULL,
    has_reply BIT NULL,
    images NVARCHAR(MAX) NULL,
    mota_dung NVARCHAR(MAX) NULL,
    noidung NVARCHAR(MAX) NULL,
    phanloai NVARCHAR(255) NULL,
    rating TINYINT NULL,
    reply_content NVARCHAR(MAX) NULL,
    reply_date DATETIMEOFFSET NULL,
    review_date DATETIMEOFFSET NULL,
    username NVARCHAR(255) NULL

	constraint PK_ProductReviews primary key(masp, mauser)
);
go

SELECT * FROM product_reviews_test
WHERE masp = '01f47974-1d2a-41ef-82eb-5f391ca8cef5' AND rating = 5;

SELECT COUNT(*)
FROM [dbo].[product_reviews_test]
WHERE masp = '01f47974-1d2a-41ef-82eb-5f391ca8cef5' AND rating = 5;