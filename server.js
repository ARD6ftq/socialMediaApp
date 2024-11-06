const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const db = require("./config/db"); // Ensure db is imported only once
const apiRoutes = require("./routes/api"); // Import your API routes

const app = express();
const port = 3000;

// Use body-parser middleware to handle form data (POST requests)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key", // Use environment variable in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

// Use API routes
app.use("/api", apiRoutes); // All API routes go under /api prefix

// Serve sign-in page at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signIn.html")); // Serve the sign-in page
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { Username, Password } = req.body;

  // Input validation
  if (!Username || !Password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  // Database query to verify the user
  const query = "SELECT * FROM Users WHERE username = ?";
  db.execute(query, [Username], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];

      // Directly compare passwords (not secure for production)
      if (user.password === Password) {
        req.session.user = user; // Initialize session here
        return res.redirect("/homepage");
      }
    }
    return res.status(401).json({ message: "Invalid credentials" });
  });
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // Proceed if authenticated
  }
  res.redirect("/"); // Redirect to login if not authenticated
}

// Protected route for homepage
app.get("/homepage", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "homepage.html")); // Serve the homepage
});

// Handle logout for /api/logout
app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" }); // Respond with success
  });
});

// Serve static files like CSS, JS, and images
app.use(express.static(path.join(__dirname, "public")));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
