const express = require('express');
const ReviewController = require('../controllers/review-controller');

const router = express.Router();

router.get('/product/:productId/reviews', ReviewController.getProductReviews);
router.post('/product/:productId/reviews', ReviewController.createReview);
router.post('/product/:productId/reviews/:userId/reply', ReviewController.addReplyToReview);
module.exports = router;