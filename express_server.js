const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Sample users database (in reality, this should be a persistent database)
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

// Helper functions
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};

const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

const authenticateUser = (email, password) => {
  const user = getUserByEmail(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return null;
};

// Routes

// Homepage
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = authenticateUser(email, password);
  if (user) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password");
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Registration route
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }
  if (getUserByEmail(email)) {
    res.status(400).send("User already exists");
    return;
  }
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = userId;
  res.redirect("/urls");
});

// Login page route
app.get("/login", (req, res) => {
  res.render("login");
});

// Registration page route
app.get("/register", (req, res) => {
  res.render("register");
});

// Sample URLs database (in reality, this should be a persistent database)
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// URL Index route
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("You must be logged in to view this page.");
    return;
  }
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  const templateVars = { urls: userURLs, user: users[userId] };
  res.render("urls_index", templateVars);
});

// URL Creation route
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("You must be logged in to create a new URL.");
    return;
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
  res.redirect(`/urls/${shortURL}`);
});

// URL New route
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: users[userId] };
  res.render("urls_new", templateVars);
});

// Individual URL page route
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).send("Short URL not found");
    return;
  }
  if (userId !== url.userID) {
    res.status(403).send("You do not have permission to edit this URL");
    return;
  }
  const templateVars = { shortURL: shortURL, longURL: url.longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

// Update URL route
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  if (!userId) {
    res.status(401).send("You must be logged in to edit URLs.");
    return;
  }
  if (urlDatabase[shortURL].userID !== userId) {
    res.status(403).send("You do not have permission to edit this URL");
    return;
  }
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// Delete URL route
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    res.status(401).send("You must be logged in to delete URLs.");
    return;
  }
  if (urlDatabase[shortURL].userID !== userId) {
    res.status(403).send("You do not have permission to delete this URL");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
