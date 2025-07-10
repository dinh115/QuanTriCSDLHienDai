const express = require('express');
const cors = require('cors');
const reviewRoutes = require('./routes/review-route');


const app = express();
const PORT = 3003;
app.use(cors({
  origin: 'http://localhost:5000' // allow only your frontend
}));

app.use(express.json());
app.use('/', reviewRoutes);

app.listen(PORT, () => {
  console.log(`Review service running at http://localhost:${PORT}`);
});