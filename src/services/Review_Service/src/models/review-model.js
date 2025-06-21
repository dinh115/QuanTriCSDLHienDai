const client = require('../config/database');

class ReviewModel {
  // static async getReviewsByProductId(productId) {
  //   const query = 'SELECT * FROM product_reviews WHERE masp = ?';
  //   try {
  //     const result = await client.execute(query, [productId], { prepare: true });
  //     return result.rows;
  //   } catch (error) {
  //     console.error('Database error:', error);
  //     throw error;
  //   }
  // }
  static async getReviewsSummaryByProductId(productId) {
    const query = 'SELECT * FROM product_review_summary WHERE masp = ?';
    try {
      const result = await client.execute(query, [productId], { prepare: true });
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async getReviewsByProductId(productId, pageState) {
    const query = 'SELECT * FROM product_reviews_new WHERE masp = ?';
    const options = { 
      prepare: true,
      fetchSize: 5 // Number of results per page
    };
    
    if (pageState) {
      options.pageState = pageState;
    }

    try {
      const result = await client.execute(query, [productId], options);
      return {
        reviews: result.rows,
        pageState: result.pageState // Token for the next page
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async getReviewsByRating(productId, rating, pageState) {
    const query = 'SELECT * FROM product_reviews_new WHERE masp = ? AND rating = ? ALLOW FILTERING';
    const options = {
      prepare: true,
      fetchSize: 5
    };

    if (pageState) {
      options.pageState = pageState;
    }

    try {
      const result = await client.execute(query, [productId, rating], options);
      return {
        reviews: result.rows,
        pageState: result.pageState
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async getReviewsWithImages(productId, pageState) {
    const query = 'SELECT * FROM product_reviews_new WHERE masp = ? AND has_images = true ALLOW FILTERING';
    const options = {
      prepare: true,
      fetchSize: 5
    };

    if (pageState) {
      options.pageState = pageState;
    }

    try {
      const result = await client.execute(query, [productId], options);
      return {
        reviews: result.rows,
        pageState: result.pageState
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async createReview(reviewData) {
    const hasImages = reviewData.images && reviewData.images.length > 0;
    const masp = reviewData.masp;
    const rating = reviewData.rating;

    let query, params;
    
    if (hasImages) {
      // Include images field when images exist
      query = `
        INSERT INTO product_reviews_new (
          masp, mauser, username, rating, review_date,
          phanloai, chatluong, mota_dung, noidung,
          images, has_images, has_reply
        )
        VALUES (?, ?, ?, ?, toTimestamp(now()), ?, ?, ?, ?, ?, ?, ?)
      `;
      
      params = [
        reviewData.masp,
        reviewData.mauser, 
        reviewData.username,
        reviewData.rating,
        reviewData.phanloai,
        reviewData.chatluong,
        reviewData.mota_dung,
        reviewData.noidung,
        reviewData.images,
        true,
        false
      ];
    } else {
      // Exclude images field when no images
      query = `
        INSERT INTO product_reviews_new (
          masp, mauser, username, rating, review_date,
          phanloai, chatluong, mota_dung, noidung,
          has_images, has_reply
        )
        VALUES (?, ?, ?, ?, toTimestamp(now()), ?, ?, ?, ?, ?, ?)
      `;
      
      params = [
        reviewData.masp,
        reviewData.mauser, 
        reviewData.username,
        reviewData.rating,
        reviewData.phanloai,
        reviewData.chatluong,
        reviewData.mota_dung,
        reviewData.noidung,
        false,
        false
      ];
    }

    try {
      const result = await client.execute(query, params, { prepare: true });
      // 🔼 Add counter updates
      await ReviewModel.updateReviewSummaryCounters(masp, rating, hasImages);
      
      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async updateReviewSummaryCounters(masp, rating, hasImages) {
  try {
    // Update total_reviews
    await client.execute(
      'UPDATE product_review_summary SET total_reviews = total_reviews + 1 WHERE masp = ?',
      [masp],
      { prepare: true }
    );

    // Update rating_X (e.g., rating_5)
    const ratingColumn = `rating_${rating}`;
    await client.execute(
      `UPDATE product_review_summary SET ${ratingColumn} = ${ratingColumn} + 1 WHERE masp = ?`,
      [masp],
      { prepare: true }
    );

    // Update has_images (only if applicable)
    if (hasImages) {
      await client.execute(
        'UPDATE product_review_summary SET has_images = has_images + 1 WHERE masp = ?',
        [masp],
        { prepare: true }
      );
    }
  } catch (error) {
    console.error('Error updating review summary counters:', error);
    throw error;
  }
  }

}

module.exports = ReviewModel;