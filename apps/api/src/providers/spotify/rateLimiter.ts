export class TokenBucketRateLimiter {
  private tokens = 50
  async acquire() { if (this.tokens > 0) this.tokens--; return true }
}
