import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries
    },
    role: {
      type: String,
      enum: ["user", "merchant", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    upiId: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/,
        "Please provide a valid UPI ID",
      ],
    },
    upiPin: {
      type: String,
      select: false, // Don't return PIN in queries
    },
    hasSetupUpi: {
      type: Boolean,
      default: false,
    },
    
    verificationToken: {
      type: String,
      default: undefined
    },
    otp: String,
    otpExpires: Date,
  },
  {
    timestamps: true,
  }
);


// Encrypt password and UPI PIN before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Hash password with strength of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Only hash the UPI PIN if it's modified (or new)
  if (this.isModified("upiPin")) {
    // Hash UPI PIN with strength of 10
    const salt = await bcrypt.genSalt(10);
    this.upiPin = await bcrypt.hash(this.upiPin, salt);
  }

  console.log("Saving user, modified fields:", this.modifiedPaths());
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Match user entered UPI PIN to hashed PIN in database
userSchema.methods.matchUpiPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.upiPin);
};

// Generate UPI ID based on user's email or phone
userSchema.methods.generateUpiId = function () {
  // Use email username or phone as base
  const base = this.email.split("@")[0] || this.phone || "user";
  // Add a random suffix to ensure uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  // Format as UPI ID with default handle
  return `${base}${randomSuffix}@paygateway`;
};

const User = mongoose.model("User", userSchema);

export default User;
