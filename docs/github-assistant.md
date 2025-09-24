# GitHub Repository Insights Feature

The GitHub Repository Insights is a feature within ISC Code Connect that allows users to interact with GitHub repositories from the IBMSC organization with a focus on repository analysis, pull request insights, and commit intelligence. It provides a comprehensive interface where users can gain deep insights about repositories, development patterns, and team collaboration metrics.

## Features

1. **Repository Intelligence Platform**

   - Deep repository analysis with metrics, health indicators, and development patterns
   - AI-powered repository insights and trend analysis
   - Comprehensive repository health assessments

2. **Pull Request Analysis**

   - Advanced PR pattern analysis and merge insights
   - File change analysis with detailed diff examination
   - Review pattern analysis and approval workflows
   - PR performance metrics and optimization suggestions

3. **Commit Intelligence**

   - Commit pattern analysis and developer behavior insights
   - Contributor activity mapping and collaboration patterns
   - Development workflow analysis and optimization recommendations
   - Time-based analysis of development activities

4. **Developer Insights**
   - Contributor behavior analysis and specialization tracking
   - Team collaboration metrics and cross-functional analysis
   - Code quality patterns and improvement suggestions
   - Development velocity and productivity insights

## Setup

1. Create a `.env` file based on `.env.example`
2. Add your GitHub OAuth credentials
3. Add WatsonX API credentials:
   - `WATSONX_API_KEY`: Your IBM WatsonX API key
   - `WATSONX_API_URL`: The WatsonX API endpoint (usually https://us-south.ml.cloud.ibm.com/ml/v1/generations)
   - `WATSONX_PROJECT_ID`: Your WatsonX project ID

## How It Works

1. **Authentication**: The feature integrates with the existing GitHub authentication flow
2. **Repository Access**: It fetches repositories from the IBMSC organization that the user has access to
3. **Repository Analytics**: Uses advanced GitHub API integration to gather comprehensive repository data
4. **AI-Powered Insights**: Uses IBM WatsonX and Granite models to generate deep insights and pattern analysis
5. **Interactive Interface**: Provides a conversational interface to explore repository insights and analytics

## Usage Examples

### Repository Analysis
- "Analyze the health and development patterns of the global-schema repository"
- "What are the key metrics and insights for the PRM repository?"
- "Show me repository trends and development velocity for sirion-schema"

### Pull Request Insights
- "Analyze recent PR patterns and merge trends in the Sales repository"
- "What are the common file types and change patterns in recent PRs?"
- "Show me PR review efficiency and approval workflows"

### Commit Intelligence  
- "Analyze commit patterns and developer behavior in global-core"
- "What are the peak development hours and commit trends?"
- "Show me contributor collaboration patterns and specializations"

### Developer Analytics
- "Who are the most active contributors and what are their specializations?"
- "Analyze team collaboration patterns and cross-functional work"
- "Show me development workflow efficiency and optimization opportunities"

## Technical Details

- Built with Next.js and React with TypeScript
- Uses enhanced GitHub API integration for comprehensive data gathering
- Integrates with IBM WatsonX and LangGraph for sophisticated AI analysis
- Leverages server-side actions and advanced caching for optimal performance
- Features real-time repository insights and pattern analysis
- Supports complex multi-step analysis workflows with progress tracking
