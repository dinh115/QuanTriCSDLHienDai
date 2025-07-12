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
    //const query = 'SELECT * FROM product_review_summary WHERE masp = ?';
    //const query = 'SELECT * FROM product_review_summary_test WHERE masp = ?';
    const query = 'SELECT * FROM productReviewsSummary WHERE masp = ?';
    try {
      const result = await client.execute(query, [productId], { prepare: true });
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
  static async getReviewsByProductId(productId, pageState) {
    //const query = 'SELECT * FROM product_reviews_new WHERE masp = ?';
    //const query = 'SELECT * FROM product_reviews_test WHERE masp = ?';
    const query = 'SELECT * FROM productReviews WHERE masp = ?';
    const options = {
      prepare: true,
      fetchSize: 6 // Number of results per page
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
    //const query = 'SELECT * FROM product_reviews_new WHERE masp = ? AND rating = ? ALLOW FILTERING';
    //const query = 'SELECT * FROM product_reviews_test WHERE masp = ? AND rating = ? ALLOW FILTERING';
    const query = 'SELECT * FROM productReviews WHERE masp = ? AND rating = ? ALLOW FILTERING';
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
    //const query = 'SELECT * FROM product_reviews_test WHERE masp = ? AND has_images = true ALLOW FILTERING';
    const query = 'SELECT * FROM productReviews WHERE masp = ? AND has_images = true ALLOW FILTERING';
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
      query = `
        INSERT INTO productReviews (
          masp, mauser, username, rating, review_date,
          phanloai, chatluong, mota_dung, noidung,
          images, has_images, has_reply
        )
        VALUES (?, ?, ?, ?, toTimestamp(now()), ?, ?, ?, ?, ?, ?, ?)
        IF NOT EXISTS
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
      query = `
        INSERT INTO productReviews (
          masp, mauser, username, rating, review_date,
          phanloai, chatluong, mota_dung, noidung,
          has_images, has_reply
        )
        VALUES (?, ?, ?, ?, toTimestamp(now()), ?, ?, ?, ?, ?, ?)
        IF NOT EXISTS
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

      // Check the [applied] status
      if (result.rows && result.rows.length > 0 && result.rows[0]['[applied]'] === true) {
        // Only update counters if the insertion was applied (i.e., it was a new review)
        await ReviewModel.updateReviewSummaryCounters(masp, rating, hasImages);
        return { success: true, message: 'Review created successfully.' };
      } else {
        // The review already existed, so do not increment counters
        return { success: false, message: 'Review with this primary key already exists. No new review created.' };
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  static async updateReviewSummaryCounters(masp, rating, hasImages) {
    try {
      // Update total_reviews
      await client.execute(
        'UPDATE productReviewsSummary SET total_reviews = total_reviews + 1 WHERE masp = ?',
        [masp],
        { prepare: true }
      );

      // Update rating_X (e.g., rating_5)
      const ratingColumn = `rating_${rating}`;
      await client.execute(
        `UPDATE productReviewsSummary SET ${ratingColumn} = ${ratingColumn} + 1 WHERE masp = ?`,
        [masp],
        { prepare: true }
      );

      // Update has_images (only if applicable)
      if (hasImages) {
        await client.execute(
          'UPDATE productReviewsSummary SET has_images = has_images + 1 WHERE masp = ?',
          [masp],
          { prepare: true }
        );
      }
    } catch (error) {
      console.error('Error updating review summary counters:', error);
      throw error;
    }
  }

  static async addReplyToReview(productId, userId, replyContent) {
    try {
      // You need to decide how you identify a specific review to add a reply to.
      // Based on your controller, you're passing productId and userId.
      // This implies that a review is uniquely identified by these two,
      // or perhaps there's a primary key/unique identifier for each review.
      // For this example, let's assume review is identified by masp (productId) and mauser (userId).
      // You might also have a review_id or review_date as part of the primary key.

      // First, check if the review exists (optional but good practice)
      const checkQuery = 'SELECT * FROM productReviews WHERE masp = ? AND mauser = ?';
      const checkResult = await client.execute(checkQuery, [productId, userId], { prepare: true });

      if (checkResult.rows.length === 0) {
        return { success: false, message: 'Review not found' };
      }

      // Define the update query to add the reply
      // Assuming you have a 'reply_content' column and 'has_reply' boolean column in your productReviews table
      const updateQuery = `
        UPDATE productReviews
        SET reply_content = ?, has_reply = true, reply_date = toTimestamp(now())
        WHERE masp = ? AND mauser = ?
      `;
      // Note: You might need to include other primary key components in the WHERE clause
      // depending on your Cassandra table schema for productReviews.
      // For example, if review_date is part of your primary key:
      // WHERE masp = ? AND mauser = ? AND review_date = ?

      const params = [replyContent, productId, userId];
      await client.execute(updateQuery, params, { prepare: true });

      return { success: true, message: 'Reply added successfully' };
    } catch (error) {
      console.error('Database error adding reply:', error);
      throw error;
    }
  }
}

module.exports = ReviewModel;