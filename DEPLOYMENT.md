# Deploying Library Management System to Render

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to a GitHub repository
2. **MongoDB Atlas**: Your database is already configured with MongoDB Atlas
3. **Gmail App Password**: You'll need a Gmail app password for email notifications

## Step-by-Step Deployment Guide

### 1. Prepare Your Repository

Make sure all the updated files are committed and pushed to GitHub:
- `render.yaml` - Render configuration
- `app.js` - Updated with environment variables
- `package.json` - Updated scripts
- `.env.example` - Environment variables template

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in with your GitHub account
3. Connect your GitHub account to Render

### 3. Deploy Your Application

1. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `Library-Management_System` repository

2. **Configure Deployment Settings**:
   - **Name**: `library-management-system` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" for testing

### 4. Set Environment Variables

In the Render dashboard, go to your service → Environment tab and add:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NODE_ENV` | `production` | |
| `MONGODB_URI` | `your-mongodb-atlas-connection-string` | Copy from MongoDB Atlas |
| `SESSION_SECRET` | `generate-random-secret` | Use a strong random string |
| `EMAIL_USER` | `your-email@gmail.com` | Your Gmail address |
| `EMAIL_PASS` | `your-gmail-app-password` | Gmail app password (not regular password) |

### 5. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new app password
4. Select "Mail" and "Other" → Enter "Library Management"
5. Copy the generated 16-character password
6. Use this password for `EMAIL_PASS` environment variable

### 6. MongoDB Atlas Network Access

1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (Allow access from anywhere) for Render deployment
4. Or add Render's IP ranges if you prefer more security

### 7. Deploy and Test

1. Click "Deploy" in Render dashboard
2. Monitor the build logs for any errors
3. Once deployed, test your application:
   - Registration functionality
   - Email notifications
   - Database operations
   - Admin approval workflow

## Important Security Notes

- Never commit `.env` files with real credentials
- Use strong, unique passwords for production
- Regularly rotate your Gmail app password
- Monitor your MongoDB Atlas usage and security

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify MongoDB URI and network access
3. **Email Not Working**: Confirm Gmail app password and 2FA is enabled
4. **Session Issues**: Ensure `SESSION_SECRET` is set

### Logs and Debugging:

- Check Render logs in the dashboard
- Monitor MongoDB Atlas logs
- Test email functionality with a simple registration

## Post-Deployment

1. **Custom Domain** (Optional): Add your custom domain in Render settings
2. **SSL Certificate**: Automatically provided by Render
3. **Monitoring**: Set up health checks and alerts
4. **Backup**: Regular MongoDB Atlas backups

Your Library Management System should now be live at: `https://your-app-name.onrender.com`
