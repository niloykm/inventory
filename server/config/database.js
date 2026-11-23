const mongoose = require("mongoose");

// Persist cache on globalThis so Next.js/Vercel hot reloads and warm serverless
// invocations reuse the exact same connection & in-flight promise.
let cached = globalThis.__mongooseCache;
if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  bufferCommands: false,
};

let listenersAttached = false;

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
    cached.conn = null;
    cached.promise = null;
  });
};

const connectWithRetry = async (uri, retries = 1) => {
  try {
    const conn = await mongoose.connect(uri, MONGO_OPTIONS);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    attachConnectionListeners();
    return conn;
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `⚠️ MongoDB initial connect failed (${error.message}), retrying once...`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      return connectWithRetry(uri, retries - 1);
    }
    throw error;
  }
};

const connectDB = async () => {
  // Fast path: already connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset stale cache if connection is disconnected or disconnecting
  if (
    mongoose.connection.readyState === 0 ||
    mongoose.connection.readyState === 3
  ) {
    cached.conn = null;
    if (mongoose.connection.readyState === 3) {
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db";

    cached.promise = connectWithRetry(uri, 1).catch((error) => {
      console.error(`❌ MongoDB connection error: ${error.message}`);
      cached.promise = null;
      cached.conn = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
};

module.exports = connectDB;
