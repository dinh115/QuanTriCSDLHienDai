import express from 'express';
import userRoutes from './routes/users.js';
import morgan from 'morgan';

const app = express();
const PORT = 3002;
app.use(morgan('dev'));

app.use(express.json());
app.use('/', userRoutes);

app.listen(PORT, () => {
  console.log(`user-service running at http://localhost:${PORT}`);
});
