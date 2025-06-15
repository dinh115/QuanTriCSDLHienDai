const express = require('express');
const ReviewController = require('../controllers/review-controller');

const router = express.Router();

router.get('/product/:productId/reviews', ReviewController.getProductReviews);

module.exports = router;