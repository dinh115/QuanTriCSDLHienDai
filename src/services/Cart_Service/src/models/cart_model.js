import { v4 as uuidv4 } from 'uuid';

export function createNewCart(cartId = uuidv4(), userId = uuidv4()) {
  return {
    id: cartId,
    userId,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createNewCartItem({ shopId, productId, quantity }) {
  return {
    id: uuidv4(),
    shopId,
    productId,
    quantity,
    addedAt: new Date().toISOString()
  };
}
