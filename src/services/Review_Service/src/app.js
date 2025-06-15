const express = require('express');
const reviewRoutes = require('./routes/review-route');

const app = express();
const PORT = 3003;

app.use(express.json());
app.use('/', reviewRoutes);

app.listen(PORT, () => {
  console.log(`Review service running at http://localhost:${PORT}`);
});