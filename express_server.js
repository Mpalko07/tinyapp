const express = require("express"); // Import the Express.js library
const cookieParser = require("cookie-parser"); // Import the cookie-parser middleware
const app = express(); // Create an Express application
const PORT = 8080; // Define the port number

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Middleware to parse cookies

// Database of short URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Database of users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Function to generate a random string for short URLs
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

// Function to get a user by their email
const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

// Set EJS as the template engine
app.set("view engine", "ejs");

// Route to handle user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(403).send("Invalid email or password");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Route to handle user logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Route to render the login page
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls"); // Redirect to /urls if user is already logged in
  } else {
    res.render("login"); // Render the login page if user is not logged in
  }
});

// Route to render the register page
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls"); // Redirect to /urls if user is already logged in
  } else {
    res.render("register"); // Render the register page if user is not logged in
  }
});

// Route to render the form for creating a new URL
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login"); // Redirect to login page if user is not logged in
  } else {
    res.render("urls_new", { user: users[req.cookies.user_id] });
  }
});

// Route to handle creation of new URLs
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.status(401).send("You must be logged in to create a new URL."); // Unauthorized if user is not logged in
    return;
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Route to render the URLs page
app.get("/urls", (req, res) => {
  const templateVars = {
    user: null, // User data will be populated if logged in
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Route to render details of a specific URL
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (longURL) {
    const templateVars = { id: id, longURL: longURL, user: null };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("Short URL not found");
  }
});

// Route to handle invalid URL creation attempt
app.post("/urls", (req, res) => {
  res.status(403).send("You are not authorized to create a new URL.");
});

// Route to handle redirection to the original URL
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if (longURL) {
    res.redirect(longURL); // Redirect to the original URL if it exists
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 Not Found</title>
      </head>
      <body>
        <h1>404 Not Found</h1>
        <p>The requested URL does not exist.</p>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
