# AI Website Builder

An intelligent AI-powered website builder that generates complete, interactive websites from simple text descriptions. Built with Node.js, Express, SQLite, and powered by OpenRouter's GPT-4o-mini model.

## Features

- 🤖 **AI-Powered Generation**: Generate complete websites from text descriptions using advanced AI
- 🎨 **Modern UI/UX**: Beautiful, responsive interface with animated backgrounds and glassmorphism effects
- 👁️ **Live Preview**: Real-time preview of generated websites in an iframe
- 📋 **Code View**: View and copy the generated HTML/CSS/JS code
- 🔐 **User Authentication**: Secure login/signup system with session management
- 💾 **Project Management**: Save and manage your generated websites
- 🎯 **Interactive Elements**: Generated websites include working buttons, forms, animations, and more
- 📱 **Responsive Design**: Works perfectly on both desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **SQLite** - Database for user data and projects
- **OpenRouter API** - AI model integration (GPT-4o-mini)
- **bcrypt** - Password hashing
- **crypto** - Session token generation

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with custom animations and glassmorphism
- **Bootstrap 5** - UI components
- **JavaScript (Vanilla)** - Interactivity
- **Tailwind CSS** - Generated website styling (via CDN)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenRouter API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/KrishnaParalkar-5034/Ai_Website_Builder.git
   cd Ai_Website_Builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=5500
   ```

4. **Get an OpenRouter API Key**
   - Visit [OpenRouter.ai](https://openrouter.ai/keys)
   - Sign up for an account
   - Generate an API key
   - Add it to your `.env` file

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:5500`

## Usage

### Creating an Account
1. Navigate to the login page
2. Click "Sign up" to create a new account
3. Enter your name, email, and password
4. Your account will be created and you'll be logged in automatically

### Generating a Website
1. Enter a description of the website you want to create
   - Example: "Create a modern landing page for a coffee shop with a hero section, menu, and contact form"
2. Click "Generate Website"
3. Wait for the AI to generate the code (usually 5-15 seconds)
4. View the live preview in the preview section
5. Switch to the "Code" tab to see the generated source code
6. Click "📋 Copy Code" to copy the code to your clipboard

### Managing Projects
1. Click "My Projects" in the navigation
2. View all your previously generated websites
3. Click "Open project" to edit or view a previous generation

## Project Structure

```
ai-website-builder/
├── server.js              # Main backend server
├── auth.js                # Authentication utilities
├── index.html             # Main website builder interface
├── projects.html          # Project management page
├── login.html             # Login page
├── signup.html            # Signup page
├── landingpage.html       # Landing page
├── Aboutus.html           # About us page
├── community.html         # Community page
├── pricing.html           # Pricing page
├── style.css              # Global styles
├── login.css              # Login page styles
├── signup.css             # Signup page styles
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── websites.db            # SQLite database (auto-generated)
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/me` - Get current user info

### Projects
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/generate` - Generate a new website

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI generation | Yes |
| `PORT` | Port number for the server (default: 5500) | No |

## AI Model Configuration

The application uses **GPT-4o-mini** via OpenRouter API for optimal performance and cost-effectiveness. The model is configured with:
- Temperature: 0.7 (balanced creativity)
- Max tokens: 8192 (sufficient for complete websites)
- Enhanced prompts for interactive elements

## Troubleshooting

### API Key Issues
- Ensure your `.env` file contains a valid OpenRouter API key
- Check that the API key has sufficient credits
- Verify the API key is correctly formatted

### Server Won't Start
- Check if port 5500 is already in use
- Ensure all dependencies are installed (`npm install`)
- Check Node.js version (v14 or higher required)

### Generation Failures
- Verify your OpenRouter API key is valid
- Check your API credits balance
- Ensure stable internet connection
- Check server logs for specific error messages

### Preview Not Showing
- Check browser console for JavaScript errors
- Ensure the generated code is valid HTML
- Try refreshing the page
- Check if browser blocks iframe content

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

**Krishna Paralkar**
- GitHub: [@KrishnaParalkar-5034](https://github.com/KrishnaParalkar-5034)

## Acknowledgments

- OpenRouter for providing AI model access
- Google Fonts for typography
- Tailwind CSS for styling framework
- Bootstrap for UI components

## Future Enhancements

- [ ] Add more AI model options
- [ ] Implement project export/download
- [ ] Add collaborative editing features
- [ ] Create template library
- [ ] Add custom domain support
- [ ] Implement version history for projects
- [ ] Add dark mode toggle
- [ ] Create mobile app version

## Support

For support, please open an issue on GitHub or contact the author directly.

---

**Note**: This project uses the OpenRouter API which requires a valid API key. Make sure to keep your API key secure and never commit it to version control.
