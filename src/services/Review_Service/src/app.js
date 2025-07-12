const express = require('express');
const cors = require('cors');
const reviewRoutes = require('./routes/review-route');
const productRoutes = require('./routes/product-route'); // <<< ADD THIS LINE


const app = express();
const PORT = 3009;

app.use(cors({
    origin: 'http://localhost:5000' // allow only your frontend
}));

app.use(express.json()); // This is already correctly handling JSON body parsing

app.use('/', reviewRoutes);
app.use('/', productRoutes); // <<< ADD THIS LINE TO USE YOUR NEW PRODUCT ROUTES

app.listen(PORT, () => {
    console.log(`Review service running at http://localhost:${PORT}`);
});