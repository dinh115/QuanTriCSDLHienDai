const express = require('express');
const ProductController = require('../controllers/ProductController'); // Adjust path if necessary

const router = express.Router();

// POST API to fetch productname and image
router.post('/products/details', ProductController.getProductDetails);

module.exports = router;