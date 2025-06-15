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
}

module.exports = ReviewController;