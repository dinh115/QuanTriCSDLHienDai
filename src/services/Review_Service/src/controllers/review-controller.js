const ReviewModel = require('../models/review-model');

class ReviewController {
  // static async getProductReviews(req, res) {
  //   try {
  //     const { productId } = req.params;
  //     const reviews = await ReviewModel.getReviewsByProductId(productId);
  //     res.json(reviews);
  //   } catch (error) {
  //     console.error('Error fetching reviews:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // }
  static async getReviewSummary(req, res) {
    try {
      const { productId } = req.params;
      const summary = await ReviewModel.getReviewsSummaryByProductId(productId);
      
      if (summary.length === 0) {
        return res.status(404).json({ error: 'No review summary found for this product.' });
      }

      res.json(summary[0]); // return the single row
    } catch (error) {
      console.error('Error fetching review summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { pageState } = req.query;
      
      const result = await ReviewModel.getReviewsByProductId(productId, pageState);
      res.json({
        reviews: result.reviews,
        nextPage: result.pageState
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async getReviewsByRating(req, res) {
    try {
      const { productId, rating } = req.params;
      const { pageState } = req.query;
      
      const result = await ReviewModel.getReviewsByRating(productId, parseInt(rating), pageState);
      res.json({
        reviews: result.reviews,
        nextPage: result.pageState
      });
    } catch (error) {
      console.error('Error fetching reviews by rating:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async getReviewsWithImages(req, res) {
    try {
      const { productId } = req.params;
      const { pageState } = req.query;
      
      const result = await ReviewModel.getReviewsWithImages(productId, pageState);
      res.json({
        reviews: result.reviews,
        nextPage: result.pageState
      });
    } catch (error) {
      console.error('Error fetching reviews with images:', error);
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
  static async addReplyToReview(req, res) {
    try {
      const { productId, userId } = req.params;
      const { reply_content } = req.body;

      const result = await ReviewModel.addReplyToReview(productId, userId, reply_content);
      
      if (result.success) {
        res.json({ message: 'Reply added successfully' });
      } else {
        res.status(404).json({ error: 'Review not found' });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ReviewController;