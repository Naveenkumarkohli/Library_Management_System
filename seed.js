const mongoose = require("mongoose");

// ================= MONGODB CONNECTION =================
mongoose.connect("mongodb+srv://naveenkumarkohli06_db_user:I9qjQ90iGU8K3N1x@library-app.jvkn562.mongodb.net/libraryDB?retryWrites=true&w=majority")
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

const User = mongoose.model("User", userSchema);
const Book = mongoose.model("Book", bookSchema);

// ================= DATA =================
const books = [
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Fantasy" },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction" },
  { title: "Clean Code", author: "Robert C. Martin", category: "Programming" },
  { title: "Atomic Habits", author: "James Clear", category: "Self-Help" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction" },
  { title: "1984", author: "George Orwell", category: "Dystopia" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction" },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", category: "Programming" },
  { title: "Deep Work", author: "Cal Newport", category: "Self-Help" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy" },
  { title: "Think and Grow Rich", author: "Napoleon Hill", category: "Self-Help" },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", category: "Programming" },
];

const users = [
  { username: "admin", password: "admin123", role: "admin", email: "admin@example.com", approved: true },
  { username: "naveen", password: "naveen123", role: "user", email: "naveen@example.com", approved: true },
];

// ================= SEED FUNCTION =================
async function seedDB() {
  try {
    // Clear existing data
    await Book.deleteMany({});
    await User.deleteMany({});

    // Insert books and users
    await Book.insertMany(books);
    await User.insertMany(users);

    console.log("Seeded database with books, admin, and user.");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();
