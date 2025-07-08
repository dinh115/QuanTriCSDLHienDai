// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import multer from 'multer'; // Import multer

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();



// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to the 'public/images' directory
    cb(null, path.join(__dirname, 'public', 'images'));
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwriting
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    const exampleProductId = "22417326-f9fd-4954-9ead-3ceafd52f3d6";
    res.render('home.ejs', { username, exampleProductId });
});

// Reviews route - initial load
app.get('/reviews', async (req, res) => {
    const apiUrl = 'http://localhost:3003/product/c28d7705-5e0f-482a-8bbb-416780e42c1d/reviews';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.render('review.ejs', { 
            reviews, 
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// API endpoint for pagination with filters
app.get('/reviews/:productId', async (req, res) => {
    const { productId } = req.params; // Get productId from URL
    const apiUrl = `http://localhost:3003/product/${productId}/reviews`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format (this logic remains the same)
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        // Pass productId to the template
        res.render('review.ejs', {
            productId, // Pass the ID to the view
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// API endpoint for pagination with filters (MODIFIED)
app.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params; // Get productId from URL
    const pageState = req.query.pageState;
    const filter = req.query.filter;

    let apiUrl = `http://localhost:3003/product/${productId}/reviews`;

    // Apply filter to URL (this logic remains the same)
    if (filter && filter !== 'all') {
        if (filter.startsWith('rating-')) {
            const rating = filter.split('-')[1];
            apiUrl += `/rating/${rating}`;
        } else if (filter === 'images') {
            apiUrl += '/images';
        }
    }

    // Add pagination if provided
    if (pageState) {
        apiUrl += `?pageState=${pageState}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format (this logic remains the same)
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.json({
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage,
            filter: filter || 'all'
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: "Lỗi khi tải đánh giá" });
    }
});

// Review form route
// app.get('/review-form', (req, res) => {
//     const username = "User #" + Math.floor(Math.random() * 100) + 1;
//     res.render('review-form.ejs', { username });
// });

// MODIFIED: Review form route is now dynamic to get the product ID
app.get('/product/:productId/review-form', (req, res) => {
    const { productId } = req.params;
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    // Pass the productId to the form template
    res.render('review-form.ejs', { username, productId });
});


// NEW: Route to handle the review form submission with file uploads
app.post('/product/:productId/reviews', upload.array('images', 5), async (req, res) => {
    const { productId } = req.params;
    
    // Extract text data from the form body
    const { rating, phanloai, chatluong, mota_dung, noidung } = req.body;
    
    // Get the relative paths of uploaded images provided by multer
    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];

    // Construct the payload for your backend API
    const payload = {
        mauser: "dda14db3-f64e-4c66-bc60-e02b061761b2", // session dummy
        username: "username", // session dummy
        rating: parseInt(rating, 10), // Ensure rating is a number
        phanloai,
        chatluong,
        mota_dung,
        noidung,
        images: imagePaths
    };

    try {
        // Send the composed data to your backend API
        const apiResponse = await fetch(`http://localhost:3003/product/${productId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Backend API Error: ${apiResponse.status} - ${errorText}`);
        }
        
        // After successful submission, redirect the user to see their new review
        console.log('Review submitted successfully!');
        res.redirect(`/reviews/${productId}`);

    } catch (error) {
        console.error('Error submitting review to backend:', error);
        res.status(500).send("Lỗi khi gửi đánh giá.");
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});