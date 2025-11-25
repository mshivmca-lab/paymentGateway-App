import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import transporter from "../config/email.js";
// import path from "path";

const createRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_COOKIE_EXPIRE || "7d" }
  );
};


//register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const token = crypto.randomBytes(32).toString("hex");

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Validate role if provided
    if (role && !["user", "merchant", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
      phone,
      isEmailVerified: false,
      verificationToken: token,
    });

    //email
    const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email - Payment Gateway",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Payment Gateway!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6B7280;">${link}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px;">Payment Gateway Team</p>
          </div>`,
    })
    .then(() => console.log("✅ Verification email sent to:", email))
    .catch((emailError) => console.error("❌ Email sending failed:", emailError.message));

      // Generate JWT token for immediate login (optional)
    const jwtToken = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: "Registration successful! Please verify your email.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

//verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    // console.log("Token received:", token);

    const user = await User.findOne({ verificationToken: token });
    // console.log("User found:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
      });
    }

    // user.isVerified = true;
    user.isEmailVerified = true;
    user.verificationToken = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
// export const logout = (req, res) => {
//   // Clear the cookie by setting it to expire immediately
//   res.cookie("token", "none", {
//     expires: new Date(Date.now()), // Expire immediately
//     httpOnly: true,
//     sameSite: "strict",
//     path: "/",
//   });

//     // Clear the refresh token cookie
//   res.cookie("refreshToken", "", {
//     httpOnly: true,
//     expires: new Date(0),
//     sameSite: "lax",
//     path: "/",
//   });

//   res.status(200).json({
//     success: true,
//     message: "Logged out successfully",
//     data: {},
//   });
// };
export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Clear the token cookie
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    path: "/",
  });

  // Clear the refresh token cookie
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current and new password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Refresh JWT token
// @route   GET /api/auth/refresh-token
// @access  Private
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No refresh token provided",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Invalid refresh token:", err.message);
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    // Generate new token and send response
    sendTokenResponse(user, 200, res);
    console.log("Token refresh completed successfully");
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Helper function to get token from model, create cookie and send response
// const sendTokenResponse = (user, statusCode, res) => {
//   // Create access token (existing helper on model)
//   const token = user.getSignedJwtToken();

//   // Access cookie options (keeps original behavior)
//   const accessOptions = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     sameSite: "strict",
//   };

//   if (process.env.NODE_ENV === "production") {
//     accessOptions.secure = true;
//   }

//   // Create refresh token and cookie options (long-lived)
//   const refreshToken = createRefreshToken(user);
//   const refreshOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     maxAge:
//       parseInt(process.env.JWT_COOKIE_EXPIRE, 10) ||
//       7 * 24 * 60 * 60 * 1000, // default 7 days
//   };

//   // Remove password before sending
//   user.password = undefined;

//   // Set both cookies (access token cookie kept for backwards compatibility)
//   // and return access token in JSON as before
//   res
//     .status(statusCode)
//     .cookie("token", token, accessOptions)
//     .cookie("refreshToken", refreshToken, refreshOptions)
//     .json({
//       success: true,
//       token,
//       user,
//     });
// };
// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create access token (existing helper on model)
  const token = user.getSignedJwtToken();

  // Create refresh token
  const refreshToken = createRefreshToken(user);

  // ✅ PRODUCTION-READY COOKIE OPTIONS
  const isProduction = process.env.NODE_ENV === "production";
  
  // Access token cookie options
  const accessOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,  // ✅ HTTPS only in production
    sameSite: isProduction ? "none" : "strict",  // ✅ 'none' allows cross-origin
    path: "/",
  };

  // Refresh token cookie options
  const refreshOptions = {
    httpOnly: true,
    secure: isProduction,  // ✅ HTTPS only in production
    sameSite: isProduction ? "none" : "lax",  // ✅ 'none' allows cross-origin
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Remove password before sending
  user.password = undefined;

  // Set both cookies and return access token in JSON
  res
    .status(statusCode)
    .cookie("token", token, accessOptions)
    .cookie("refreshToken", refreshToken, refreshOptions)
    .json({
      success: true,
      token,
      user,
    });
};