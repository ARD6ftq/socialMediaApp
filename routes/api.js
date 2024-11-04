const express = require("express");
const db = require("../config/db"); // Import the database connection
const router = express.Router();

// Get all users
router.get("/users", (req, res) => {
  const query = "SELECT username FROM Users"; // Only fetch the 'username' column
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching usernames." });
    }
    res.json(result); // Return the result containing usernames
  });
});

// Create a new user (sign-up)
router.post("/users", (req, res) => {
  const { FirstName, LastName, Email, Username, Password, ConfirmPassword } =
    req.body;

  // Validate input
  if (
    !FirstName ||
    !LastName ||
    !Email ||
    !Username ||
    !Password ||
    !ConfirmPassword
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Check if passwords match
  if (Password !== ConfirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  // Insert user into the database
  const query =
    "INSERT INTO Users (firstname, lastname, email, username, password) VALUES (?, ?, ?, ?, ?)";
  db.execute(
    query,
    [FirstName, LastName, Email, Username, Password],
    (err, results) => {
      if (err) {
        console.error("Error inserting user into database:", err);
        return res.status(500).json({ message: "Database insertion failed." });
      }
      res.status(201).json({
        message: "User added successfully",
        userId: results.insertId,
      });
    }
  );
});

// Create a new post
router.post("/posts", (req, res) => {
  const { content } = req.body; // Expecting content to be sent

  // Validate input
  if (!content) {
    return res.status(400).json({ message: "Post content is required." });
  }

  const query =
    "INSERT INTO Posts (content, username, createdAt) VALUES (?, ?, ?)";
  const createdAt = new Date();

  db.execute(query, [content, req.session.user.username, createdAt], (err) => {
    if (err) {
      console.error("Error inserting post into database:", err);
      return res.status(500).json({ message: "Database insertion failed." });
    }

    res.status(201).json({ message: "Post created successfully." });
  });
});

// Get current user
router.get("/current_user", (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(404).json({ message: "User not found." });
  }
});

// Get all posts
router.get("/posts", (req, res) => {
  const query = `
    SELECT Posts.*, Users.username 
    FROM Posts 
    INNER JOIN Users ON Posts.username = Users.username 
    ORDER BY createdAt DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching posts." });
    }
    res.json(result); // Send posts back to frontend
  });
});

// Like a post
router.post("/posts/:id/like", (req, res) => {
  const postId = req.params.id;

  const query = "UPDATE Posts SET likes = likes + 1 WHERE id = ?";
  db.execute(query, [postId], (err, results) => {
    if (err) {
      console.error("Error updating like count:", err);
      return res.status(500).json({ message: "Failed to like post." });
    }

    res.status(200).json({ message: "Post liked successfully." });
  });
});

// Unlike a post
router.delete("/posts/:id/like", (req, res) => {
  const postId = req.params.id;

  const query = "UPDATE Posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?"; // Ensure likes don't go negative
  db.execute(query, [postId], (err, results) => {
    if (err) {
      console.error("Error updating like count:", err);
      return res.status(500).json({ message: "Failed to unlike post." });
    }

    res.status(200).json({ message: "Post unliked successfully." });
  });
});

// Export the router
module.exports = router;