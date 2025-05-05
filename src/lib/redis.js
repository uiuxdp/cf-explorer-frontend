// lib/redis.js
import Redis from 'redis'

// Create a Redis client
const redisClient = Redis.createClient({
  url: 'redis://localhost:6379', // Adjust URL for your Redis instance
})

redisClient.connect()

// Set a value in Redis
export async function setDocumentInRedis(key, value) {
  await redisClient.set(key, JSON.stringify(value))
}

// Get a value from Redis
export async function getDocumentFromRedis(key) {
  const value = await redisClient.get(key)
  return value ? JSON.parse(value) : null
}
