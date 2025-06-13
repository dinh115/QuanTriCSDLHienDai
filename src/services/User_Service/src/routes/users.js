import express from 'express';

const router = express.Router();

// Mock data
const users = [
  { id: '1', name: 'Alice', favoriteProductId: '66502d62dd1fa7c0b9672b31' },
  { id: '2', name: 'Bob', favoriteProductId: '66502d62dd1fa7c0b9672b32' }
];

router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export default router;
