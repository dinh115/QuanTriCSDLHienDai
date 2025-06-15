const ReviewModel = require('../models/review-model');

class ReviewController {
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await ReviewModel.getReviewsByProductId(productId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async createReview(req, res) {
    try {
      // Ensure productId is taken from the URL params
      const { productId } = req.params;
      const reviewData = {
        ...req.body,
        masp: productId  // Override or set the productId from URL params
      };
      const result = await ReviewModel.createReview(reviewData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ReviewController;