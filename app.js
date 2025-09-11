const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const os = require("os");
const mongoose = require("mongoose");

const app = express();

// ================= MONGODB ATLAS CONNECTION =================
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://naveenkumarkohli06_db_user:I9qjQ90iGU8K3N1x@library-app.jvkn562.mongodb.net/libraryDB?retryWrites=true&w=majority";
mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

// ================= SCHEMAS =================
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  email: String,
  approved: Boolean,
});

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  state: { type: String, default: "Available" },
  issuedTo: { type: String, default: null },
});

const requestSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

const User = mongoose.model("User", userSchema);
const Book = mongoose.model("Book", bookSchema);
const Request = mongoose.model("Request", requestSchema);

// ================= MIDDLEWARE =================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ 
  secret: process.env.SESSION_SECRET || "library-secret", 
  resave: false, 
  saveUninitialized: true 
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success") || [];
  res.locals.error = req.flash("error") || [];
  next();
});

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// ================= AUTH FUNCTIONS =================
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.status(403).send("Forbidden: Admins only");
}

// ================= MAIL CONFIG =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "naveenkumarkohli06@gmail.com",
    pass: "hqzj xjhp wtca hbis", // app password
  },
});

function sendMail(to, subject, html) {
  transporter.sendMail({ from: "naveenkumarkohli06@gmail.com", to, subject, html }, (err, info) => {
    if (err) console.error("Error sending email:", err);
    else console.log("Email sent:", info.response);
  });
}

// ================= LAN IP =================
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

// ================= ROUTES =================

// Root route - redirect to login
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "admin" ? "/admin" : "/home");
  }
  res.redirect("/login");
});

// Login
app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) {
    req.flash("error", "Invalid credentials.");
    return res.redirect("/login");
  }
  if (!user.approved) {
    req.flash("error", "Account not approved yet.");
    return res.redirect("/login");
  }
  req.session.user = user;
  res.redirect(user.role === "admin" ? "/admin" : "/home");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Home page
app.get("/home", isAuthenticated, async (req, res) => {
  const books = await Book.find({});
  res.render("home", { user: req.session.user, books });
});

// Registration
app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (await User.findOne({ username }) || await Request.findOne({ username })) {
    req.flash("error", "Username already taken or pending approval.");
    return res.redirect("/register");
  }
  const newRequest = new Request({ username, password, email });
  await newRequest.save();

  const serverIp = getLocalIp();
  sendMail("naveenkumarkohli06@gmail.com", "New Registration Request", `
    <p>New registration request:</p>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Email:</strong> ${email}</p>
    <a href="http://${serverIp}:3000/approve/${newRequest._id}">✅ Approve</a> |
    <a href="http://${serverIp}:3000/reject/${newRequest._id}">❌ Reject</a>
  `);

  req.flash("success", "Registration request sent. Wait for admin approval.");
  res.redirect("/login");
});

// Admin dashboard
app.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  const books = await Book.find({});
  const users = await User.find({});
  const pendingRequests = await Request.find({});
  res.render("admin", { user: req.session.user, books, users, pendingRequests });
});

// Approve / Reject requests
app.get("/approve/:id", async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (request) {
    await new User({
      username: request.username,
      password: request.password,
      role: "user",
      email: request.email,
      approved: true
    }).save();
    await Request.findByIdAndDelete(req.params.id);
    sendMail(request.email, "Library Approval", "✅ Your account has been approved. You can now log in.");
    req.flash("success", `User "${request.username}" approved.`);
  } else req.flash("error", "Request not found.");
  res.redirect("/login");
});

app.get("/reject/:id", async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (request) {
    sendMail(request.email, "Library Rejection", "❌ Your account request has been rejected.");
    await Request.findByIdAndDelete(req.params.id);
    req.flash("error", `User "${request.username}" rejected.`);
  }
  res.redirect("/login");
});

// Issue & Return Books
app.post("/issue", isAuthenticated, async (req, res) => {
  const book = await Book.findById(req.body.id);
  if (book && book.state === "Available") {
    book.state = "Issued";
    book.issuedTo = req.session.user.username;
    await book.save();
    req.flash("success", `"${book.title}" has been issued to you.`);
  } else req.flash("error", "Book cannot be issued.");
  res.redirect("/home");
});

app.post("/return", isAuthenticated, async (req, res) => {
  const book = await Book.findById(req.body.id);
  if (book && book.state === "Issued" && book.issuedTo === req.session.user.username) {
    book.state = "Available";
    book.issuedTo = null;
    await book.save();
    req.flash("success", `"${book.title}" has been returned successfully.`);
  } else req.flash("error", "Book cannot be returned.");
  res.redirect("/home");
});

// ================= SERVER =================
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://${getLocalIp()}:${PORT}`));
