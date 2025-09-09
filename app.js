const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Enhanced book data with more realistic information
let books = [
    {
        id: 1,
        Name: "The Rudest Book Ever",
        author: "Shwetabh Gangwar",
        pages: 200,
        price: 240,
        state: "Available",
        category: "Self-Help",
        isbn: "978-0143441151",
        publishYear: 2019,
        description: "A brutally honest guide to life",
        issueDate: null,
        returnDate: null,
        issuedTo: null
    },
    {
        id: 2,
        Name: "Do Epic Shit",
        author: "Ankur Warikoo",
        pages: 250,
        price: 300,
        state: "Available",
        category: "Business",
        isbn: "978-9391165239",
        publishYear: 2021,
        description: "Entrepreneurial wisdom and life lessons",
        issueDate: null,
        returnDate: null,
        issuedTo: null
    },
    {
        id: 3,
        Name: "Atomic Habits",
        author: "James Clear",
        pages: 320,
        price: 450,
        state: "Issued",
        category: "Self-Help",
        isbn: "978-0735211292",
        publishYear: 2018,
        description: "Tiny changes, remarkable results",
        issueDate: "2024-01-15",
        returnDate: null,
        issuedTo: "John Doe"
    },
    {
        id: 4,
        Name: "The Psychology of Money",
        author: "Morgan Housel",
        pages: 256,
        price: 399,
        state: "Available",
        category: "Finance",
        isbn: "978-0857197689",
        publishYear: 2020,
        description: "Timeless lessons on wealth, greed, and happiness",
        issueDate: null,
        returnDate: null,
        issuedTo: null
    }
];

let nextId = 5;

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers for API endpoints
app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Helper function to get statistics
function getStatistics() {
    const total = books.length;
    const available = books.filter(book => book.state === "Available").length;
    const issued = books.filter(book => book.state === "Issued").length;
    const categories = [...new Set(books.map(book => book.category))];
    
    return {
        total,
        available,
        issued,
        categories: categories.length
    };
}

// Home route - display books with search and filter
app.get("/", (req, res) => {
    console.log("DEBUG: Home route called with enhanced version");
    const { search, category, status } = req.query;
    let filteredBooks = books;

    // Apply search filter
    if (search) {
        filteredBooks = filteredBooks.filter(book => 
            book.Name.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase()) ||
            book.isbn.includes(search)
        );
    }

    // Apply category filter
    if (category && category !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.category === category);
    }

    // Apply status filter
    if (status && status !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.state === status);
    }

    const stats = getStatistics();
    const categories = [...new Set(books.map(book => book.category))];
    
    console.log("DEBUG: Stats object:", stats);
    console.log("DEBUG: Categories:", categories);

    res.render("home", { 
        data: filteredBooks, 
        stats,
        categories,
        currentSearch: search || '',
        currentCategory: category || 'all',
        currentStatus: status || 'all'
    });
});

// Add new book
app.post("/", (req, res) => {
    const newbook = {
        id: nextId++,
        Name: req.body.Name,
        author: req.body.author,
        pages: Number(req.body.pages),
        price: Number(req.body.price),
        category: req.body.category || 'General',
        isbn: req.body.isbn || '',
        publishYear: Number(req.body.publishYear) || new Date().getFullYear(),
        description: req.body.description || '',
        state: "Available",
        issueDate: null,
        returnDate: null,
        issuedTo: null
    };
    books.push(newbook);
    res.redirect("/");
});

// Issue book
app.post("/issue", (req, res) => {
    const bookId = Number(req.body.id);
    const issuedTo = req.body.issuedTo || 'Unknown User';
    
    const book = books.find(book => book.id === bookId);
    if (book && book.state === "Available") {
        book.state = "Issued";
        book.issueDate = new Date().toISOString().split('T')[0];
        book.issuedTo = issuedTo;
    }
    res.redirect("/");
});

// Return book
app.post("/return", (req, res) => {
    const bookId = Number(req.body.id);
    
    const book = books.find(book => book.id === bookId);
    if (book && book.state === "Issued") {
        book.state = "Available";
        book.returnDate = new Date().toISOString().split('T')[0];
        book.issuedTo = null;
    }
    res.redirect("/");
});

// Delete book
app.post("/delete", (req, res) => {
    const bookId = Number(req.body.id);
    books = books.filter(book => book.id !== bookId);
    res.redirect("/");
});

// API endpoint for statistics (for future AJAX calls)
app.get("/api/stats", (req, res) => {
    res.json(getStatistics());
});

// API endpoint for filtered books (AJAX)
app.get("/api/books", (req, res) => {
    const { search, category, status } = req.query;
    let filteredBooks = books;

    // Apply search filter
    if (search) {
        filteredBooks = filteredBooks.filter(book => 
            book.Name.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase()) ||
            book.isbn.includes(search)
        );
    }

    // Apply category filter
    if (category && category !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.category === category);
    }

    // Apply status filter
    if (status && status !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.state === status);
    }

    const stats = getStatistics();
    const categories = [...new Set(books.map(book => book.category))];

    res.json({
        books: filteredBooks,
        stats,
        categories,
        totalFound: filteredBooks.length
    });
});

app.listen(port, () => {
    console.log(`🚀 Library Management System running on http://localhost:${port}`);
    console.log(`📚 Managing ${books.length} books across ${[...new Set(books.map(b => b.category))].length} categories`);
});
