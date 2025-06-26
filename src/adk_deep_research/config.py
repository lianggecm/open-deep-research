# ADK - Deep Research Configuration

# Placeholder for MODEL_CONFIG from TypeScript
MODEL_CONFIG = {
    "planningModel": "Qwen/Qwen2.5-72B-Instruct-Turbo",
    "jsonModel": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "summaryModel": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "summaryModelLongPages": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "answerModel": "deepseek-ai/DeepSeek-V3",
}

# Placeholder for RESEARCH_CONFIG from TypeScript
RESEARCH_CONFIG = {
    "budget": 2,
    "maxQueries": 2,
    "maxSources": 5,
    "maxTokens": 8192,
}

# Placeholder for PROMPTS from TypeScript
# These will be loaded or defined here
PROMPTS = {
    "planningPrompt": """You are a strategic research planner...""", # Truncated for brevity
    "planParsingPrompt": """You are a research assistant...""",
    "rawContentSummarizerPrompt": """You are a research extraction specialist...""",
    "evaluationPrompt": """You are a research query optimizer...""",
    "evaluationParsingPrompt": """Extract follow-up search queries...""",
    "answerPrompt": """You are a senior research analyst...""",
    "dataVisualizerPrompt": """You are an expert graphic designer...""",
    "planSummaryPrompt": """You are a research assistant. Given a detailed research plan...""",
}

# Function to get current date context (ported from TypeScript)
import datetime

def get_current_date_context():
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    day = now.day
    month_name = now.strftime("%B")
    return f"Current date is {year}-{str(month).zfill(2)}-{str(day).zfill(2)} ({month_name} {day}, {year})..."
# Simplified for brevity, full prompt context should be included

# Environment variables (placeholders, should be loaded securely)
TOGETHER_API_KEY = "YOUR_TOGETHER_API_KEY"
BRAVE_API_KEY = "YOUR_BRAVE_API_KEY"
FIRECRAWL_API_KEY = "YOUR_FIRECRAWL_API_KEY"
S3_UPLOAD_BUCKET = "YOUR_S3_BUCKET"
S3_UPLOAD_REGION = "YOUR_S3_REGION"
REDIS_URL = "YOUR_REDIS_URL"
REDIS_TOKEN = "YOUR_REDIS_TOKEN"
