const mysql = require("mysql2");

// Create a connection to the database
const db = mysql.createConnection({
  host: "localhost", // Database host
  user: "root", // Database username
  password: "password", // Database password
  database: "SocialMedia", // Database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database"); // This should only print once
});

// Export the database connection
module.exports = db;