// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    res.render('home.ejs', { username });
});

// Sample review data
const sampleReviews = [
    {
        id: 1,
        username: "shes00r*th",
        rating: 5,
        date: "2023-07-30 14:45",
        title: "Chất lượng sản phẩm rất chắc chắn. Nên mua mọi người à",
        content: "Tình nàng nổi bật nhờ gọn liền mang trong túi cùng máy lính. Giao hàng nhanh, giá rẻ nhất so với các shop khác. Siêu tin Eo minh hỏi giá 150 k lận. Nhỏ gọn, mở ra thu vào nhanh chóng, giá chắc chắn đúng rất ok. Dùng xong thu lại dễ vào túi đựng máy qua tiện.",
        response: {
            title: "Phản Hồi Của Người Bán",
            content: "Shop Cảm ơn bạn đã đánh giá 5* cho Shop. hãy tiếp tục ủng hộ Shop nhé 😍"
        },
        images: [
            "/images/review1-1.jpg",
            "/images/review1-2.jpg"
        ]
    },
    {
        id: 2,
        username: "minh*****94",
        rating: 5,
        date: "2023-08-15 09:22",
        title: "Sản phẩm tuyệt vời, đóng gói cẩn thận",
        content: "Mình rất hài lòng với sản phẩm này. Chất lượng tốt, giao hàng nhanh. Shop tư vấn nhiệt tình, đóng gói rất cẩn thận. Sẽ ủng hộ shop lâu dài.",
        response: {
            title: "Phản Hồi Của Người Bán",
            content: "Cảm ơn bạn đã tin tưởng shop. Chúc bạn sử dụng sản phẩm hiệu quả nhé! 🥰"
        },
        images: [
            "/images/review2-1.jpg"
        ]
    },
    {
        id: 3,
        username: "thanh***le",
        rating: 4,
        date: "2023-08-10 16:30",
        title: "Sản phẩm ok, giao hàng hơi chậm",
        content: "Sản phẩm đúng như mô tả, chất lượng tốt. Tuy nhiên giao hàng hơi chậm so với dự kiến. Nhìn chung vẫn hài lòng với sản phẩm.",
        response: null,
        images: []
    },
    {
        id: 4,
        username: "hong*****99",
        rating: 5,
        date: "2023-08-05 11:15",
        title: "Chất lượng vượt mong đợi",
        content: "Ban đầu mình còn lo lắng về chất lượng nhưng khi nhận được hàng thì thật sự bất ngờ. Sản phẩm rất chắc chắn, đẹp hơn trong hình. Giá cả hợp lý.",
        response: {
            title: "Phản Hồi Của Người Bán",
            content: "Shop rất vui khi bạn hài lòng với sản phẩm. Hẹn gặp lại bạn ở những đơn hàng tiếp theo nhé! 💕"
        },
        images: [
            "/images/review4-1.jpg",
            "/images/review4-2.jpg",
            "/images/review4-3.jpg"
        ]
    },
    {
        id: 5,
        username: "duc****08",
        rating: 5,
        date: "2023-07-28 20:45",
        title: "Rất hài lòng, sẽ mua lại",
        content: "Đây là lần thứ 2 mình mua ở shop này. Lần đầu đã rất hài lòng nên lần này tiếp tục ủng hộ. Sản phẩm chất lượng, giá cả phải chăng.",
        response: {
            title: "Phản Hồi Của Người Bán",
            content: "Cảm ơn bạn đã là khách hàng thân thiết của shop. Shop sẽ luôn mang đến những sản phẩm tốt nhất! 🌟"
        },
        images: []
    },
    {
        id: 6,
        username: "linh***03",
        rating: 4,
        date: "2023-07-25 14:20",
        title: "Sản phẩm đẹp, đóng gói kỹ càng",
        content: "Mình đặt hàng vào tối thứ 6, thứ 2 đã nhận được rồi. Giao hàng nhanh, đóng gói cẩn thận. Sản phẩm đúng như hình, chất lượng tốt.",
        response: null,
        images: [
            "/images/review6-1.jpg"
        ]
    }
];

// Review
// Reviews route
app.get('/reviews', (req, res) => {
    res.render('review.ejs', { reviews: sampleReviews });
});

// Review form route
app.get('/review-form', (req, res) => {
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    res.render('review-form.ejs',{ username });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
