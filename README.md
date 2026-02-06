# 🎯 PrepWise

**PrepWise** is an intelligent, adaptive interview preparation platform that provides personalized technical interview practice with real-time AI evaluation, dynamic difficulty adjustment, and comprehensive performance analytics. Master your interview skills with AI-powered practice sessions.

![Login Page](./img/loginpage.png)

## ✨ Key Features

### 🤖 AI-Powered Interview System
- **Dynamic Question Generation**: Leverages Groq AI to generate contextually relevant technical questions
- **Real-time Answer Evaluation**: Strict quality-based scoring system (0-10 scale) that detects copied answers and superficial responses
- **Adaptive Difficulty**: Automatically adjusts question difficulty based on performance
- **Smart Follow-up Questions**: Generates follow-up questions when answers need clarification

### 📊 Dashboard & Analytics
![Dashboard](./img/dashboard.png)

- **Performance Overview**: Track average scores across all completed interviews
- **Statistics**: Total interviews, completed count, and performance trends
- **Quick Actions**: Start new interviews, view history, and access bookmarks
- **Progress Tracking**: Monitor improvement over time

### 🎭 Custom Role Creation
![Adding New Role](./img/addingnewrole.png)

- **Role Builder**: Create custom interview roles with specific skills and requirements
- **Skill Selection**: Choose from technical, behavioral, and domain-specific skills
- **Difficulty Levels**: Easy, Medium, Hard
- **Question Count**: Configurable number of questions (5-20)
- **Visibility Control**: Public or Private role sharing
- **Category System**: Technical, HR, Behavioral interviews

### 🌐 Public Role Marketplace
![Public Roles](./img/publicrole.png)

- **Popular Roles**: Browse trending interview templates
- **Recent Additions**: Discover newly created roles
- **My Roles Management**: 
  - Toggle between Public/Private visibility
  - Delete custom roles
  - Track usage statistics
- **Role Usage Counter**: See how many times a role has been used

### 💬 Interactive Interview Interface
![Question Sample](./img/questionsample.png)

- **Voice Recording**: Record answers via microphone
- **Text Input**: Type responses directly
- **Audio Transcription**: Automatic speech-to-text conversion
- **Timer Tracking**: Monitor time spent per question
- **Pause/Resume**: Flexible interview pacing
- **Bookmark Questions**: Save important questions for later review
- **Progress Indicator**: Visual progress through interview

### 📚 Interview History
![History](./img/history.png)

- **Complete Archive**: Access all past interviews
- **Score Display**: View performance scores for each interview
- **Date Tracking**: Organized chronologically
- **Detailed Reports**: Link to comprehensive feedback
- **Filter & Search**: Find specific interviews quickly

### 🔖 Bookmark System
![Bookmarks](./img/bookmark.png)

- **Save Questions**: Bookmark challenging questions during interviews
- **Review Later**: Access all bookmarked questions in one place
- **Question Details**: View full question text and metadata
- **Remove Bookmarks**: Manage saved questions

### 📄 Comprehensive Reports
![Report](./img/report.png)

- **Overall Performance Score**: Out of 10 rating
- **Time Analytics**: 
  - Total interview duration
  - Average time per question
  - Pause statistics
- **Detailed Breakdown**:
  - Correctness, Clarity, Depth, Relevance scores
  - Question-by-question analysis
  - Your answers vs ideal answers
  - Improvement tips
- **Strengths & Weaknesses**: AI-identified areas of excellence and improvement
- **Skill Assessment**: Performance breakdown by skill category
- **Recommendations**: Personalized learning suggestions
- **Multiple Export Formats**:
  - 📥 PDF Download (detailed, formatted report)
  - 📄 Text Export (plain text version)
  - 📊 JSON Export (structured data)

### 🔐 Authentication & Security
- **Email Verification**: Secure signup with email confirmation
- **Password Reset**: Forgot password flow with verification codes
- **JWT Authentication**: Secure session management
- **Protected Routes**: Login required for interview features

### 🎨 Modern UI/UX
- **Dark Mode**: Full dark theme support
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Clean Interface**: Intuitive navigation and layouts
- **Semantic Colors**: Consistent color system across the platform
- **Accessibility**: Keyboard navigation and screen reader support

### ⚡ Performance Features
- **Quality-Based Scoring**: 
  - 0-2: No effort/completely wrong
  - 3-4: Poor quality
  - 5-7: Average (normal range)
  - 8-9: Good with depth
  - 10: Exceptional (rare)
- **Word Count Penalties**: Encourages comprehensive answers
- **Copied Answer Detection**: Identifies lazy or plagiarized responses
- **Technical Depth Analysis**: Evaluates substance and examples

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.4**: React framework with App Router and Turbopack
- **React 19**: Latest React with server components
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Modern utility-first styling
- **Radix UI**: Accessible component primitives

### Backend
- **MongoDB**: NoSQL database for flexible data storage
- **Node.js**: Server-side runtime
- **Groq AI**: Advanced language model for question generation and evaluation
- **Nodemailer**: Email service integration

### Authentication & Security
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Email Verification**: Secure signup process

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Groq API key

### Setup

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd prepwise
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env.local` file in the root directory:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=yourapp

# Groq AI API
GROQ_API_Key=your_groq_api_key_here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here

# Email SMTP Settings (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Set up MongoDB:**
   - Create a MongoDB Atlas account at https://cloud.mongodb.com
   - Create a new cluster
   - Add a database user (Database Access)
   - Whitelist your IP (Network Access → Allow access from anywhere for development)
   - Get your connection string

5. **Get Groq API Key:**
   - Visit https://console.groq.com/keys
   - Create a free account
   - Generate an API key

6. **Configure Gmail (for email features):**
   - Enable 2-Step Verification on your Google Account
   - Generate an App Password at https://myaccount.google.com/apppasswords
   - Use the app password in `EMAIL_PASS`

7. **Run the development server:**
```bash
npm run dev
```

8. **Open your browser:**
Navigate to http://localhost:3000

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Add environment variables to Vercel:**
```bash
vercel env add MONGODB_URI
vercel env add GROQ_API_Key
vercel env add JWT_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add NEXT_PUBLIC_API_URL
```

3. **Deploy:**
```bash
vercel --prod
```

## 📖 Usage Guide

### For Interviewees

1. **Sign Up**: Create an account with email verification
2. **Browse Roles**: Explore public roles or create your own
3. **Start Interview**: Select a role and begin
4. **Answer Questions**: Type or voice record your responses
5. **Get Feedback**: Receive detailed AI evaluation
6. **View Report**: Access comprehensive performance analytics
7. **Track Progress**: Monitor improvement in dashboard

### For Role Creators

1. **Create Role**: Define interview parameters
2. **Select Skills**: Choose relevant technical skills
3. **Set Difficulty**: Pick appropriate challenge level
4. **Configure Questions**: Decide number of questions
5. **Share**: Make public or keep private
6. **Manage**: Edit visibility or delete roles

## 🎯 Scoring System

The platform uses an **extremely strict, quality-focused scoring system**:

### Evaluation Criteria (0-10 scale)

**Immediate Disqualifiers (0-1 points):**
- Copied or paraphrased questions
- Generic filler with no substance
- < 5 words
- Completely off-topic

**Quality Metrics:**
- **Correctness** (0-5): Technical accuracy
- **Clarity** (0-5): Communication quality
- **Depth** (0-5): Examples and details
- **Relevance** (0-5): Alignment with question

**Word Count Guidelines:**
- < 10 words → max 1 point
- 10-20 words → max 3 points
- 20-30 words → max 5 points
- 30-50 words → up to 7 points
- 50+ words → judged on quality

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq AI**: For providing the powerful language model
- **Next.js Team**: For the amazing framework
- **Vercel**: For hosting and deployment
- **MongoDB**: For database services
- **Radix UI**: For accessible components

## 📧 Support

For support, email adarsh.224386101@vcet.edu.in or open an issue in the GitHub repository.

## 🔮 Future Enhancements

- [ ] Video interview support
- [ ] Mock interview with AI interviewer
- [ ] Peer-to-peer practice sessions
- [ ] Interview scheduling
- [ ] Integration with job boards
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Company-specific interview prep
- [ ] Resume analysis and tips
- [ ] LinkedIn integration

---

**Built with ❤️ using Next.js, MongoDB, and Groq AI**
