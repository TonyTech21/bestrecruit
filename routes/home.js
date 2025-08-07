const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const Update = require("../models/Update");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, and images are allowed."
        )
      );
    }
  },
});

// Home page
router.get("/", (req, res) => {
  try {
    res.render("home", {
      title: "Advanze Travels - Land Your Dream Job Abroad",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Something went wrong loading the homepage.",
    });
  }
});

// About page
router.get("/about", (req, res) => {
  try {
    res.render("about", {
      title: "About Us - Advanze Travels",
      user: req.session.user,
    });
  } catch (error) {
    console.error("About page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Something went wrong loading the about page.",
    });
  }
});

// Extended registration page
router.get("/extended-registration", (req, res) => {
  try {
    if (!req.session.tempUser) {
      return res.redirect("/");
    }

    res.render("extended-registration", {
      title: "Complete Registration - Advanze Travels",
      user: req.session.tempUser,
    });
  } catch (error) {
    console.error("Extended registration page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Something went wrong loading the registration page.",
    });
  }
});

// API endpoint for latest updates
router.get("/api/updates", async (req, res) => {
  try {
    const updates = await Update.find({ isPublished: true })
      .sort({ publishDate: -1 })
      .limit(6)
      .select("title excerpt image publishDate");

    res.json({ success: true, updates });
  } catch (error) {
    console.error("Get updates error:", error);
    res.status(500).json({ success: false, message: "Failed to load updates" });
  }
});
// Initial application submission
router.post(
  "/apply",
  upload.single("resume"),
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("phone")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Please provide a valid phone number"),
    body("preferredCountry")
      .notEmpty()
      .withMessage("Please select a preferred country")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, phone, preferredCountry } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        // Store user in session for extended registration
        req.session.tempUser = {
          id: user._id,
          name: user.name,
          email: user.email,
        };

        return res.json({
          success: true,
          message: "Welcome back! Please complete your registration...",
        });
      }

      // Store initial data in session for extended registration
      const sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      req.session.tempUser = {
        name,
        email,
        phone,
        preferredCountry,
        sessionId,
      };

      // Handle resume upload
      if (req.file) {
        req.session.tempUser.resume = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        };
      }

      res.json({
        success: true,
        message:
          "Initial application received! Please complete your registration...",
      });
    } catch (error) {
      console.error("Application submission error:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

// Complete registration submission
router.post(
  "/complete-registration",
  upload.single("profilePicture"),
  [
  
    body("experience")
      .notEmpty()
      .withMessage("Please select your experience level"),
    body("education")
      .notEmpty()
      .withMessage("Please select your education level"),
    body("profession")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Please enter your profession"),
    body("relocationReadiness")
      .notEmpty()
      .withMessage("Please select your relocation readiness"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  
  async (req, res) => {
    try {
      if (!req.session.tempUser) {
        return res
          .status(401)
          .json({ success: false, message: "Session expired" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        experience,
        education,
        profession,
        linkedin,
        relocationReadiness,
        password,
      } = req.body;
      const tempUser = req.session.tempUser;

      // Create new user with all data
      const user = new User({
        name: tempUser.name,
        email: tempUser.email,
        phone: tempUser.phone,
        preferredCountry: tempUser.preferredCountry,
        sessionId: tempUser.sessionId,
        experience,
        education,
        profession,
        linkedin,
        relocationReadiness,
        password,
        applicationStatus: "In Review",
      });

      // Add resume if uploaded initially
      if (tempUser.resume) {
        user.documents.push(tempUser.resume);
      }

      // Handle profile picture upload
      if (req.file) {
        user.profilePicture = req.file.filename;
      }

      // Add status history
      user.statusHistory.push({
        status: "In Review",
        notes: "Registration completed and submitted for review",
      });

      await user.save();

      // Clear temp user and set actual user session
      delete req.session.tempUser;
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        sessionId: user.sessionId,
      };

      res.json({
        success: true,
        message: "Registration completed successfully!",
        redirect: "/dashboard",
      });
    } catch (error) {
      console.error("Complete registration error:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

module.exports = router;
