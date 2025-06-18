export default class CartModel {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async addToCart(userId, productId, quantity) {
    const key = `cart:${userId}`;
    await this.redis.hSet(key, productId, quantity);
    return this.getCart(userId);
  }

  async getCart(userId) {
    const key = `cart:${userId}`;
    return await this.redis.hGetAll(key);
  }

  async removeFromCart(userId, productId) {
    const key = `cart:${userId}`;
    await this.redis.hDel(key, productId);
    return this.getCart(userId);
  }
}export default class CartModel {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async addToCart(userId, productId, quantity) {
    const key = `cart:${userId}`;
    await this.redis.hSet(key, productId, quantity);
    return this.getCart(userId);
  }

  async getCart(userId) {
    const key = `cart:${userId}`;
    return await this.redis.hGetAll(key);
  }

  async removeFromCart(userId, productId) {
    const key = `cart:${userId}`;
    await this.redis.hDel(key, productId);
    return this.getCart(userId);
  }
}