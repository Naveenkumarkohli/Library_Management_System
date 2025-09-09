# 📚 Library Management System

A modern, responsive web application for managing library books with advanced search, filtering, and user management capabilities.

![Library Management System](https://img.shields.io/badge/Node.js-v14+-green.svg)
![Express](https://img.shields.io/badge/Express-v4.18+-blue.svg)
![EJS](https://img.shields.io/badge/EJS-Template-orange.svg)

## ✨ Features

### 📊 **Dashboard & Statistics**
- Real-time statistics dashboard
- Total books, available, issued, and categories count
- Visual cards with modern glassmorphism design

### 🔍 **Advanced Search & Filtering**
- Real-time AJAX search (no page reloads)
- Search by title, author, or ISBN
- Filter by category and status
- Debounced search for optimal performance

### 📖 **Book Management**
- Add new books with comprehensive details
- Issue books to users with tracking
- Return books with automatic status updates
- Delete books with confirmation dialogs
- Support for ISBN, categories, descriptions, and publish years

### 🎨 **Modern UI/UX**
- Responsive design with CSS Grid and Flexbox
- Smooth animations and hover effects
- Mobile-friendly interface
- Gradient backgrounds with glassmorphism effects
- Font Awesome icons and Inter font

### 👥 **User Management**
- Track who books are issued to
- Issue and return history
- User-friendly modal dialogs

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/library-management-system.git
   cd library-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
Library-Management_System/
├── views/
│   └── home.ejs          # Main template file
├── node_modules/         # Dependencies (auto-generated)
├── app.js               # Main server file
├── package.json         # Project configuration
├── package-lock.json    # Dependency lock file
├── README.md           # Project documentation
└── .gitignore          # Git ignore rules
```

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating, HTML5, CSS3, JavaScript
- **Styling**: CSS Grid, Flexbox, Glassmorphism design
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Inter (Google Fonts)
- **AJAX**: Fetch API for real-time updates

## 📚 Sample Data

The application comes with pre-loaded sample books including:
- Rich Dad Poor Dad by Robert Kiyosaki
- The Lean Startup by Eric Ries
- Atomic Habits by James Clear
- The Psychology of Money by Morgan Housel

## 🎯 Key Features Explained

### Real-time Search
- Type in the search box to instantly filter books
- No page reloads - smooth AJAX updates
- Search across title, author, and ISBN fields

### Book Categories
- Fiction, Non-Fiction, Science, Technology
- Business, Self-Help, Biography, History, Finance
- Easy filtering by category

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Adaptive grid layout
- Touch-friendly interface

### Modern Animations
- Smooth card hover effects
- Fade-in animations for new content
- Loading indicators for better UX

## 🔧 Configuration

### Port Configuration
The application runs on port 3000 by default. To change:

```javascript
const port = process.env.PORT || 3000;
```

### Adding New Categories
Edit the category options in `views/home.ejs`:

```html
<option value="YourCategory">Your Category</option>
```

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment
1. Set environment variables
2. Use process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up SSL certificate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Data is stored in memory (resets on server restart)
- No user authentication system
- No data persistence to database

## 🔮 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication and authorization
- [ ] Book reservation system
- [ ] Email notifications
- [ ] Barcode scanning
- [ ] Advanced reporting
- [ ] Multi-library support

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/library-management-system/issues) page
2. Create a new issue with detailed description
3. Include screenshots if applicable

## 🙏 Acknowledgments

- Font Awesome for beautiful icons
- Google Fonts for the Inter font family
- Express.js community for excellent documentation
- EJS templating engine for simplicity

---

**Made with ❤️ for efficient library management**
