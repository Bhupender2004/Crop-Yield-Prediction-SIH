# Configuration file for CropCast Agricultural AI Assistant

# OpenAI API Configuration
# To enable OpenAI integration:
# 1. Get your API key from https://platform.openai.com/account/api-keys
# 2. Replace the OPENAI_API_KEY below with your actual key
# 3. Valid OpenAI API keys start with "sk-"

OPENAI_API_KEY = "your-openai-api-key-here"  # Replace with your actual OpenAI API key

# OpenAI Model Configuration
OPENAI_MODEL = "gpt-4"  # Options: "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"
MAX_TOKENS = 800
TEMPERATURE = 0.3  # Lower = more consistent, Higher = more creative

# Database Configuration
DATABASE_PATH = "crop_data.db"

# Flask Configuration
DEBUG_MODE = True
HOST = "127.0.0.1"
PORT = 5000

# CORS Configuration
CORS_ORIGINS = "*"  # Allow all origins for development

# Agricultural AI System Prompt
SYSTEM_PROMPT = """You are an expert agricultural advisor and farming consultant with decades of experience in sustainable agriculture. 

Your expertise includes:
- Crop cultivation and variety selection
- Soil health and fertility management
- Integrated pest and disease management
- Water management and irrigation systems
- Sustainable farming practices
- Agricultural economics and market trends
- Climate-smart agriculture
- Precision farming technologies

Provide detailed, practical, and actionable farming advice. Always include:
- Specific recommendations with measurements when possible
- Regional considerations and timing
- Sustainable and environmentally friendly practices
- Cost-effective solutions for small and large farms
- Safety considerations for pesticide and fertilizer use

Format your responses with clear headings, bullet points, and emojis for easy reading.
Prioritize evidence-based recommendations and mention when farmers should consult local extension services."""
