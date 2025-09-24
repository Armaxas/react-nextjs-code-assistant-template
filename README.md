# ISC CodeConnect

**ISC CodeConnect** is an AI-powered development assistant designed to enhance productivity for Salesforce developers. It leverages advanced AI models and multi-agent systems to generate, complete, and explain code, automate unit test creation, and facilitate learning of business logic.

## 🚀 Key Features

### MVP2 Release Highlights (11 New Features)

#### 🤖 **Repository Intelligence Hub**
AI-powered repository analysis with PR insights, commit summaries, and development workflow intelligence.

#### 📋 **Requirement Blueprint**
Transform Salesforce ideas into structured blueprints with AI-powered analysis and implementation planning.

#### 🧠 **Multi-Agent System**
Advanced multi-agent architecture with specialized agents for routing, analysis, retrieval, and generation tasks.

#### 💬 **Agent Scratchpad**
Interactive workspace for real-time collaboration between multiple AI agents during development.

#### 🔄 **Enhanced Feedback System**
Comprehensive feedback collection and analysis system for continuous improvement.

#### 🏗️ **Architecture Visualization**
Interactive architecture diagrams showing the multi-agent system and data flow.

#### 📊 **Analytics & Monitoring**
User analytics, application feedback monitoring, and performance tracking.

#### 🔗 **JIRA Integration**
Seamless integration with JIRA for issue tracking and workflow management.

#### 🎨 **Modern UI Experience**
Beautiful, responsive interface built with Tailwind CSS and Radix UI components.

#### 🔐 **IBM W3ID Authentication**
Secure authentication using IBM's W3ID system.

#### 📈 **Chat Sharing & Collaboration**
Share chat sessions and collaborate with team members on development tasks.

## 🏗️ Architecture

ISC CodeConnect uses a sophisticated multi-agent architecture:

- **Router Agents**: Query analysis, validation, and intelligent routing
- **Analysis Agents**: Context analysis, modification planning, and test needs assessment
- **Retrieval Agents**: Code and context retrieval from vector stores
- **Generation Agents**: Code generation, documentation, and testing
- **Evaluation Agents**: Response quality assessment and improvement

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Tailwind CSS, Radix UI, Framer Motion
- **AI/ML**: LangChain, IBM Granite Models, WatsonX
- **Database**: MongoDB with authentication adapter
- **Authentication**: NextAuth.js with IBM W3ID
- **Integrations**: GitHub API, JIRA API, Salesforce APIs

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance
- IBM W3ID credentials (for authentication)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/KirtiJha/react-nextjs-code-assistant-template.git
   cd react-nextjs-code-assistant-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file with required environment variables for:
   - MongoDB connection
   - IBM W3ID authentication
   - GitHub API tokens
   - JIRA API credentials
   - WatsonX AI service credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run prettier:write` - Format code with Prettier

## 🎯 Core Capabilities

### Code Intelligence
- **Context-Aware Generation**: Repository-aware code generation for Apex and Lightning Web Components
- **Intelligent Completion**: Smart code completion with Salesforce-specific patterns
- **Code Analysis**: Quality metrics, maintainability scoring, and performance optimization

### Development Workflow
- **Test Automation**: Automated unit test generation for Apex classes
- **Documentation**: AI-generated documentation and code comments
- **Code Review**: Automated code review with improvement suggestions

### Integration Features
- **GitHub Integration**: Repository analysis, PR insights, and commit tracking
- **JIRA Integration**: Issue linking, workflow management, and progress tracking
- **Salesforce Integration**: Direct connection to Salesforce orgs and metadata

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Chat interface
│   ├── (github)/          # GitHub integration pages
│   └── (salesforce)/      # Salesforce integration pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix UI)
│   ├── github/           # GitHub-specific components
│   ├── salesforce/       # Salesforce-specific components
│   └── ...               # Feature-specific components
├── contexts/             # React contexts for state management
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # External service integrations
├── types/                # TypeScript type definitions
└── constants/            # Application constants
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [IBM Granite Models](https://www.ibm.com/granite)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review release notes in `/public/release-notes-mvp2.html`

---

**ISC CodeConnect** - Revolutionizing Salesforce development with AI-powered assistance.
