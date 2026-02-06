# 🎯 PrepWise

**PrepWise** is an intelligent, adaptive interview preparation platform that provides personalized technical interview practice with real-time AI evaluation, dynamic difficulty adjustment, and comprehensive performance analytics. Master your interview skills with AI-powered practice sessions.

## 🔄 Application Workflow

```mermaid
graph TD
    A[User] -->|Sign Up / Login| B[Dashboard]
    B -->|Create/Select Role| C[Interview Setup]
    C -->|Start Session| D[Interview Interface]
    D -->|Voice/Text Answer| E[AI Processing]
    E -->|Evaluate & Score| F[Real-time Feedback]
    F -->|Next Question| D
    D -->|Complete Interview| G[Comprehensive Report]
    G -->|Analytics & History| B
```

## ✨ Key Features

### 🤖 AI-Powered Interview System
- **Dynamic Question Generation**: Leverages Groq AI to generate contextually relevant technical questions
- **Real-time Answer Evaluation**: Strict quality-based scoring system (0-10 scale) that detects copied answers and superficial responses
- **Adaptive Difficulty**: Automatically adjusts question difficulty based on performance
- **Smart Follow-up Questions**: Generates follow-up questions when answers need clarification

### 📊 Dashboard & Analytics
- **Performance Overview**: Track average scores across all completed interviews
- **Statistics**: Total interviews, completed count, and performance trends
- **Quick Actions**: Start new interviews, view history, and access bookmarks
- **Progress Tracking**: Monitor improvement over time

### 🎭 Custom Role Creation
- **Role Builder**: Create custom interview roles with specific skills and requirements
- **Skill Selection**: Choose from technical, behavioral, and domain-specific skills
- **Difficulty Levels**: Easy, Medium, Hard
- **Question Count**: Configurable number of questions (5-20)
- **Visibility Control**: Public or Private role sharing
- **Category System**: Technical, HR, Behavioral interviews

### 🌐 Public Role Marketplace
- **Popular Roles**: Browse trending interview templates
- **Recent Additions**: Discover newly created roles
- **My Roles Management**: 
  - Toggle between Public/Private visibility
  - Delete custom roles
  - Track usage statistics
- **Role Usage Counter**: See how many times a role has been used

### 💬 Interactive Interview Interface
- **Voice Recording**: Record answers via microphone
- **Text Input**: Type responses directly
- **Audio Transcription**: Automatic speech-to-text conversion
- **Timer Tracking**: Monitor time spent per question
- **Pause/Resume**: Flexible interview pacing
- **Bookmark Questions**: Save important questions for later review
- **Progress Indicator**: Visual progress through interview

### 📚 Interview History
- **Complete Archive**: Access all past interviews
- **Score Display**: View performance scores for each interview
- **Date Tracking**: Organized chronologically
- **Detailed Reports**: Link to comprehensive feedback
- **Filter & Search**: Find specific interviews quickly

### 🔖 Bookmark System
- **Save Questions**: Bookmark challenging questions during interviews
- **Review Later**: Access all bookmarked questions in one place
- **Question Details**: View full question text and metadata
- **Remove Bookmarks**: Manage saved questions

### 📄 Comprehensive Reports
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
git clone https://github.com/vaibhav1881/PrepWise.git
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

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to http://localhost:3000

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
