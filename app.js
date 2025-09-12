const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const os = require("os");

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

const passwordResetSchema = new mongoose.Schema({
  email: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 hour expiry
});

const suspendedUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  suspendedAt: { type: Date, default: Date.now },
  reason: { type: String, default: "Account deleted by admin" }
});

const userActivitySchema = new mongoose.Schema({
  username: String,
  bookId: mongoose.Schema.Types.ObjectId,
  bookTitle: String,
  action: String, // 'issued' or 'returned'
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Book = mongoose.model("Book", bookSchema);
const Request = mongoose.model("Request", requestSchema);
const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
const SuspendedUser = mongoose.model("SuspendedUser", suspendedUserSchema);
const UserActivity = mongoose.model("UserActivity", userActivitySchema);

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
    user: process.env.EMAIL_USER || "naveenkumarkohli06@gmail.com",
    pass: process.env.EMAIL_PASS || "hqzj xjhp wtca hbis", // app password
  },
});

function sendMail(to, subject, html) {
  const fromEmail = process.env.EMAIL_USER || "naveenkumarkohli06@gmail.com";
  transporter.sendMail({ from: fromEmail, to, subject, html }, (err, info) => {
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
  
  // Check if user is suspended first
  const suspendedUser = await SuspendedUser.findOne({ username });
  if (suspendedUser) {
    req.flash("error", "Your account has been suspended by admin. Contact administrator for assistance.");
    return res.redirect("/login");
  }
  
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
  
  if (req.session.user.role === "admin") {
    // Admin stats
    const stats = {
      totalBooks: await Book.countDocuments({}),
      availableBooks: await Book.countDocuments({ state: "Available" }),
      issuedBooks: await Book.countDocuments({ state: "Issued" }),
      totalUsers: await User.countDocuments({}),
      pendingRequests: await Request.countDocuments({})
    };
    res.render("home", { user: req.session.user, books, stats });
  } else {
    // Regular user stats
    const username = req.session.user.username;
    const currentlyIssued = await Book.countDocuments({ issuedTo: username });
    const totalIssued = await UserActivity.countDocuments({ username, action: 'issued' });
    const totalReturned = await UserActivity.countDocuments({ username, action: 'returned' });
    const returnRate = totalIssued > 0 ? Math.round((totalReturned / totalIssued) * 100) : 0;
    
    const userStats = {
      currentlyIssued,
      totalIssued,
      totalReturned,
      returnRate
    };
    
    res.render("home", { user: req.session.user, books, userStats });
  }
});

// Registration
app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  
  // Check if user is suspended
  const suspendedUser = await SuspendedUser.findOne({ 
    $or: [{ username }, { email }] 
  });
  if (suspendedUser) {
    req.flash("error", "Account suspended by admin. Contact administrator for assistance.");
    return res.redirect("/register");
  }
  
  if (await User.findOne({ username }) || await Request.findOne({ username })) {
    req.flash("error", "Username already taken or pending approval.");
    return res.redirect("/register");
  }
  const newRequest = new Request({ username, password, email });
  await newRequest.save();

  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://${getLocalIp()}:${process.env.PORT || 3000}`;
  const adminEmail = process.env.EMAIL_USER || "naveenkumarkohli06@gmail.com";
  sendMail(adminEmail, "New Registration Request", `
    <p>New registration request:</p>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Email:</strong> ${email}</p>
    <a href="${serverUrl}/approve/${newRequest._id}">✅ Approve</a> |
    <a href="${serverUrl}/reject/${newRequest._id}">❌ Reject</a>
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
  try {
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
      req.flash("success", `User "${request.username}" approved successfully.`);
    } else {
      req.flash("error", "Request not found or already processed.");
    }
  } catch (error) {
    console.error("Approval error:", error);
    req.flash("error", "An error occurred while processing the approval.");
  }
  res.redirect("/approval-success");
});

app.get("/reject/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (request) {
      sendMail(request.email, "Library Rejection", "❌ Your account request has been rejected.");
      await Request.findByIdAndDelete(req.params.id);
      req.flash("success", `User "${request.username}" rejected successfully.`);
    } else {
      req.flash("error", "Request not found or already processed.");
    }
  } catch (error) {
    console.error("Rejection error:", error);
    req.flash("error", "An error occurred while processing the rejection.");
  }
  res.redirect("/approval-success");
});

// Success page for approvals/rejections
app.get("/approval-success", (req, res) => {
  res.send(`
    <html>
      <head><title>Library Management - Action Complete</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Action Completed Successfully</h2>
        <p>The user registration request has been processed.</p>
        <p>An email notification has been sent to the user.</p>
        <a href="/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
      </body>
    </html>
  `);
});

// Issue & Return Books
app.post("/issue", isAuthenticated, async (req, res) => {
  const book = await Book.findById(req.body.id);
  if (book && book.state === "Available") {
    book.state = "Issued";
    book.issuedTo = req.session.user.username;
    await book.save();
    
    // Log activity
    const activity = new UserActivity({
      username: req.session.user.username,
      bookId: book._id,
      bookTitle: book.title,
      action: 'issued'
    });
    await activity.save();
    
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
    
    // Log activity
    const activity = new UserActivity({
      username: req.session.user.username,
      bookId: book._id,
      bookTitle: book.title,
      action: 'returned'
    });
    await activity.save();
    
    req.flash("success", `"${book.title}" has been returned successfully.`);
  } else req.flash("error", "Book cannot be returned.");
  res.redirect("/home");
});

// Admin Books Management
app.get("/admin/books", isAuthenticated, isAdmin, async (req, res) => {
  const books = await Book.find({});
  const totalBooks = await Book.countDocuments();
  const issuedBooks = await Book.countDocuments({ state: "Issued" });
  const availableBooks = await Book.countDocuments({ state: "Available" });
  
  const stats = { totalBooks, issuedBooks, availableBooks };
  res.render("books", { user: req.session.user, books, stats });
});

app.post("/admin/addBook", isAuthenticated, isAdmin, async (req, res) => {
  const { title, author, category } = req.body;
  try {
    const newBook = new Book({ title, author, category });
    await newBook.save();
    req.flash("success", `Book "${title}" added successfully.`);
  } catch (error) {
    req.flash("error", "Error adding book.");
  }
  res.redirect("/admin/books");
});

app.post("/admin/deleteBook", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.body.id);
    if (book) {
      req.flash("success", `Book "${book.title}" deleted successfully.`);
    } else {
      req.flash("error", "Book not found.");
    }
  } catch (error) {
    req.flash("error", "Error deleting book.");
  }
  res.redirect("/admin/books");
});

// Admin Users Management
app.get("/admin/users", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find({});
  const pendingRequests = await Request.find({});
  const totalUsers = await User.countDocuments({ role: "user" });
  const totalAdmins = await User.countDocuments({ role: "admin" });
  
  const stats = { totalUsers, totalAdmins, pendingRequests: pendingRequests.length };
  res.render("users", { user: req.session.user, users, pendingRequests, stats });
});

app.post("/admin/addUser", isAuthenticated, isAdmin, async (req, res) => {
  const { username, password, role, email } = req.body;
  try {
    if (await User.findOne({ username })) {
      req.flash("error", "Username already exists.");
    } else {
      const newUser = new User({ username, password, role, email: email || "", approved: true });
      await newUser.save();
      req.flash("success", `User "${username}" added successfully.`);
    }
  } catch (error) {
    req.flash("error", "Error adding user.");
  }
  res.redirect("/admin/users");
});

app.post("/admin/deleteUser", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        req.flash("error", "Cannot delete the last administrator.");
        return res.redirect("/admin/users");
      }
    }

    // Add to suspended users list
    const suspendedUser = new SuspendedUser({
      username: user.username,
      email: user.email,
      reason: "Account deleted by admin"
    });
    await suspendedUser.save();

    // Delete the user
    await User.findByIdAndDelete(req.body.id);
    
    req.flash("success", `User "${user.username}" has been deleted and suspended from rejoining.`);
  } catch (error) {
    console.error("Delete user error:", error);
    req.flash("error", "Error deleting user.");
  }
  res.redirect("/admin/users");
});

// User Stats Page
app.get("/admin/user-stats", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find({ role: "user" });
  
  // Get user activity stats
  const userStats = await Promise.all(
    users.map(async (user) => {
      const issuedBooks = await Book.countDocuments({ issuedTo: user.username });
      const totalIssued = await UserActivity.countDocuments({ username: user.username, action: 'issued' });
      const totalReturned = await UserActivity.countDocuments({ username: user.username, action: 'returned' });
      
      // Get recent activity
      const recentActivity = await UserActivity.find({ username: user.username })
        .sort({ timestamp: -1 })
        .limit(5)
        .populate('bookId');
      
      return {
        ...user.toObject(),
        currentlyIssued: issuedBooks,
        totalIssued,
        totalReturned,
        recentActivity
      };
    })
  );
  
  res.render("user-stats", { user: req.session.user, userStats });
});

// Forgot Password Routes
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "No account found with that email address.");
      return res.redirect("/forgot-password");
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save reset token
    await PasswordReset.findOneAndDelete({ email }); // Remove any existing tokens
    const passwordReset = new PasswordReset({ email, token: resetToken });
    await passwordReset.save();

    // Send reset email
    const getServerUrl = () => {
      if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
      }
      
      // For local development, use the network IP instead of localhost
      const networkInterfaces = os.networkInterfaces();
      let networkIP = 'localhost';
      
      // Find the first non-internal IPv4 address
      for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const address of addresses) {
          if (address.family === 'IPv4' && !address.internal) {
            networkIP = address.address;
            break;
          }
        }
        if (networkIP !== 'localhost') break;
      }
      
      return `http://${networkIP}:${process.env.PORT || 3000}`;
    };
    
    const serverUrl = getServerUrl();
    const resetLink = `${serverUrl}/reset-password/${resetToken}`;
    
    console.log(`Password reset requested for ${email}, reset link: ${resetLink}`); // Debug log
    
    sendMail(email, "Password Reset Request", `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your library account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `);

    req.flash("success", "Password reset email sent. Check your inbox and spam folder.");
    res.redirect("/login");
  } catch (error) {
    console.error("Forgot password error:", error);
    req.flash("error", "An error occurred while sending the reset email. Please try again.");
    res.redirect("/forgot-password");
  }
});

app.get("/reset-password/:token", async (req, res) => {
  try {
    const resetRequest = await PasswordReset.findOne({ token: req.params.token });
    if (!resetRequest) {
      req.flash("error", "Invalid or expired reset token.");
      return res.redirect("/login");
    }
    res.render("reset-password", { token: req.params.token });
  } catch (error) {
    req.flash("error", "An error occurred.");
    res.redirect("/login");
  }
});

app.post("/reset-password/:token", async (req, res) => {
  const { password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect(`/reset-password/${req.params.token}`);
  }

  try {
    const resetRequest = await PasswordReset.findOne({ token: req.params.token });
    if (!resetRequest) {
      req.flash("error", "Invalid or expired reset token.");
      return res.redirect("/login");
    }

    // Update user password
    await User.findOneAndUpdate({ email: resetRequest.email }, { password });
    
    // Delete the reset token
    await PasswordReset.findByIdAndDelete(resetRequest._id);

    req.flash("success", "Password updated successfully. Please login with your new password.");
    res.redirect("/login");
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/reset-password/${req.params.token}`);
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://${getLocalIp()}:${PORT}`));
