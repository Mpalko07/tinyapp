const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

//Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database of short URLs
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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

// Function to generate random string
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

// Function to get user by email
const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

// Function to associate URLs with specific users
const associateURLsWithUsers = (userID) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// Route to handle displaying URLs specific to the logged-in user
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.send("<html><body><h1>Please <a href='/login'>login</a> or <a href='/register'>register</a> to view URLs</h1></body></html>");
    return;
  }
  const userURLs = associateURLsWithUsers(userID);
  const templateVars = {
    user: users[userID],
    urls: userURLs
  };
  res.render("urls_index", templateVars);
});

// Route to handle editing URLs
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.status(401).send("You must be logged in to edit this URL.");
    return;
  }
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  if (url.userID !== userID) {
    res.status(403).send("You do not have permission to edit this URL.");
    return;
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Route to handle deleting URLs
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.status(401).send("You must be logged in to delete this URL.");
    return;
  }
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  if (url.userID !== userID) {
    res.status(403).send("You do not have permission to delete this URL.");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Setting the view engine
app.set("view engine", "ejs");

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(403).send("Invalid email or password");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Login page route
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

// Registration page route
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

// New url page route
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", { user: users[req.cookies.user_id] });
  }
});

// Route to handle creating new urls
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.status(401).send("You must be logged in to create a new URL.");
    return;
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: longURL, userID: req.cookies.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// Route to handle displaying a specific url
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.status(401).send("You must be logged in to view this URL.");
    return;
  }
  const url = urlDatabase[id];
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  if (url.userID !== userID) {
    res.status(403).send("You do not have permission to view this URL.");
    return;
  }
  const templateVars = {
    user: users[userID],
    shortURL: id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    return res.status(400).send("User already exists");
  }
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
  users[userId] = { id: userId, email: email, password: hashedPassword }; // Store hashed password
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// Start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
