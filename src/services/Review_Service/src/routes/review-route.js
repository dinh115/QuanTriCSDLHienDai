const express = require('express');
const ReviewController = require('../controllers/review-controller');

const router = express.Router();

router.get('/product/:productId/reviews', ReviewController.getProductReviews);
router.get('/product/:productId/reviews/rating/:rating', ReviewController.getReviewsByRating);
router.get('/product/:productId/reviews/images', ReviewController.getReviewsWithImages);
router.get('/product/:productId/reviews/summary', ReviewController.getReviewSummary);
router.post('/product/:productId/reviews', ReviewController.createReview);
router.post('/product/:productId/reviews/:userId/reply', ReviewController.addReplyToReview);

module.exports = router;