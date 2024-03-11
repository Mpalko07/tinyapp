const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  res.render("urls_new", { user: user });
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (longURL) {
    const templateVars = { id: id, longURL: longURL, user: user };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase.hasOwnProperty(shortURL)) {
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase.hasOwnProperty(id)) {
    delete urlDatabase[id];
    res.redirect("/urls");
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email/password are empty
  if (!email || !password) {
    res.status(400).send('Please enter both email and passowrd');
    return;
  }

  // Check if email already exists
  for (let userId in users) {
    if (users[userId].email === email) {
     res.status(400).send('Email already exists');
      return;
    }
  }

  // Proceed with registration
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password
  };
  users[userId] = newUser;
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
