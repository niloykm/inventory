const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { JWT_SECRET } = require("../middleware/auth");

// Register new user
exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      role = "employee",
    } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      full_name,
      role,
    });

    const userData = user.toObject();
    delete userData.password_hash;

    res.status(201).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, email, username } = req.body;
    const userId = req.user.user_id;

    // Check uniqueness if email or username changed
    if (email || username) {
      const existingUser = await User.findOne({
        $and: [{ _id: { $ne: userId } }, { $or: [{ email }, { username }] }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }
    }

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;
    if (username) updates.username = username;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password_hash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log("[Auth Controller] Login attempt:", {
      username: req.body?.username,
      hasPassword: !!req.body?.password,
    });
    const rawUsername = req.body?.username;
    const password = req.body?.password;
    const username = typeof rawUsername === "string" ? rawUsername.trim() : "";

    if (!username || !password) {
      console.log("[Auth Controller] Missing credentials");
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Get user with password hash and security fields
    const user = await User.findOne({ username }).select(
      "+password_hash +failed_login_attempts +account_locked_until +last_failed_login"
    );

    if (!user) {
      console.log("[Auth Controller] User not found:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    const now = new Date();
    if (user.account_locked_until && user.account_locked_until > now) {
      const remainingMinutes = Math.ceil(
        (user.account_locked_until - now) / (1000 * 60)
      );
      console.log(
        `[Auth Controller] Account locked for user: ${username}, remaining: ${remainingMinutes} minutes`
      );
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      });
    }

    // Reset failed attempts if lock period has expired
    if (user.account_locked_until && user.account_locked_until <= now) {
      user.failed_login_attempts = 0;
      user.account_locked_until = null;
      await user.save();
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log("[Auth Controller] Invalid password for user:", username);

      // Increment failed login attempts
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      user.last_failed_login = now;

      // Lock account after 5 failed attempts
      const MAX_FAILED_ATTEMPTS = 5;
      const LOCKOUT_DURATION_MINUTES = 30;

      if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        user.account_locked_until = new Date(
          now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
        await user.save();

        console.log(
          `[Auth Controller] Account locked for user: ${username} after ${MAX_FAILED_ATTEMPTS} failed attempts`
        );
        return res.status(423).json({
          success: false,
          message: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
        });
      }

      await user.save();

      const attemptsRemaining =
        MAX_FAILED_ATTEMPTS - user.failed_login_attempts;
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before account lockout.`,
      });
    }

    console.log("[Auth Controller] Password verified for user:", username);

    // Reset failed login attempts on successful login
    user.failed_login_attempts = 0;
    user.account_locked_until = null;
    user.last_login = now;
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    // Generate token
    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set httpOnly cookie for security
    // Use sameSite: "lax" for same-origin requests in production (Vercel uses same domain)
    // Using "none" is only for cross-origin and requires Secure=true
    res.cookie("inventory_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Remove password from user object
    const userData = user.toObject();
    delete userData.password_hash;

    console.log(
      "[Auth Controller] Login successful, sending response with token"
    );
    res.json({
      success: true,
      data: {
        access_token: token,
        user: userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id).select("-password_hash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    console.log("[Auth Controller] Logout request");

    // Clear the httpOnly cookie
    res.clearCookie("inventory_auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      path: "/",
    });

    // Set cache-control headers to prevent caching
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    console.log("[Auth Controller] Logout successful");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id).select(
      "_id username role"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      data: { access_token: token },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};
