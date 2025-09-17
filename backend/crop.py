
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import sqlite3
import json
from datetime import datetime
import requests
import os


app = Flask(__name__)
CORS(app)

# Configuration and OpenAI Setup
try:
    from config import OPENAI_API_KEY, OPENAI_MODEL, MAX_TOKENS, TEMPERATURE, SYSTEM_PROMPT
    print("✅ Configuration loaded from config.py")
except ImportError:
    # Fallback configuration if config.py is not found
    OPENAI_API_KEY = "10aceb05-a64a-4475-ad96-253cf5dd71ad"
    OPENAI_MODEL = "gpt-4"
    MAX_TOKENS = 800
    TEMPERATURE = 0.3
    SYSTEM_PROMPT = "You are an expert agricultural advisor. Provide helpful, practical farming advice."
    print("⚠️  config.py not found, using default configuration")

from openai import OpenAI

# Initialize OpenAI client
try:
    if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
        client = OpenAI(api_key=OPENAI_API_KEY)
        USE_OPENAI = True
        print("✅ OpenAI client initialized successfully")
        print(f"🤖 Using {OPENAI_MODEL} for agricultural advice")
    else:
        print("⚠️  OpenAI API key not configured or invalid format.")
        print("💡 To use OpenAI API:")
        print("   1. Get your API key from https://platform.openai.com/account/api-keys")
        print("   2. Update OPENAI_API_KEY in backend/config.py with your key (starts with 'sk-')")
        print("🔄 Using intelligent fallback responses for now")
        USE_OPENAI = False
        client = None
except Exception as e:
    print(f"❌ OpenAI initialization error: {e}")
    print("🔄 Switching to intelligent fallback responses")
    USE_OPENAI = False
    client = None

# Try to load model and preprocessor, else use mock
model = None
preprocessor = None
if os.path.exists('dtr.pkl'):
    with open('dtr.pkl', 'rb') as f:
        model = pickle.load(f)
if os.path.exists('preprocesser.pkl'):
    with open('preprocesser.pkl', 'rb') as f:
        preprocessor = pickle.load(f)



# API endpoint for crop yield prediction
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # Validate input data
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Expecting: {"features": [year, rainfall, pesticides, avgTemp, country, item]}
    features = data.get('features', [])

    if len(features) != 6:
        return jsonify({'error': 'Expected 6 features: [year, rainfall, pesticides, avgTemp, country, item]'}), 400

    # Validate that we have both model and preprocessor
    if not model or not preprocessor:
        return jsonify({'error': 'Model or preprocessor not loaded'}), 500

    try:
        # Transform features using the preprocessor
        # Features order: [year, rainfall, pesticides, avgTemp, country, item]
        processed_features = preprocessor.transform([features])
        prediction = model.predict(processed_features)

        # Calculate confidence based on model performance (you can adjust this)
        confidence = 85  # You can implement a more sophisticated confidence calculation

        return jsonify({
            'prediction': float(prediction[0]),
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 400

# Database initialization
def init_db():
    conn = sqlite3.connect('predictions.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            input_data TEXT,
            prediction_result TEXT,
            location_data TEXT,
            user_id TEXT DEFAULT 'anonymous'
        )
    ''')
    conn.commit()
    conn.close()

# Weather API integration
@app.route('/weather/<lat>/<lon>', methods=['GET'])
def get_weather(lat, lon):
    try:
        # Mock weather data for demo - replace with actual API
        weather_data = {
            'temperature': 25 + (float(lat) / 10) % 15,
            'humidity': 60 + (float(lon) / 10) % 30,
            'rainfall': 800 + (float(lat) * float(lon)) % 1000,
            'location': f"Location {lat}, {lon}",
            'country': 'Unknown'
        }
        return jsonify(weather_data)
    except Exception as e:
        return jsonify({'error': f'Weather fetch failed: {str(e)}'}), 400

# Save prediction to database
@app.route('/save-prediction', methods=['POST'])
def save_prediction():
    try:
        data = request.get_json()
        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO predictions (input_data, prediction_result, location_data, user_id)
            VALUES (?, ?, ?, ?)
        ''', (
            json.dumps(data.get('input_data', {})),
            json.dumps(data.get('prediction', {})),
            json.dumps(data.get('location', {})),
            data.get('user_id', 'anonymous')
        ))

        conn.commit()
        prediction_id = cursor.lastrowid
        conn.close()

        return jsonify({'success': True, 'id': prediction_id})
    except Exception as e:
        return jsonify({'error': f'Save failed: {str(e)}'}), 400

# Get prediction history
@app.route('/history', methods=['GET'])
def get_history():
    try:
        user_id = request.args.get('user_id', 'anonymous')
        limit = int(request.args.get('limit', 50))

        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, timestamp, input_data, prediction_result, location_data
            FROM predictions
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'timestamp': row[1],
                'input_data': json.loads(row[2]),
                'prediction': json.loads(row[3]),
                'location': json.loads(row[4]) if row[4] else None
            })

        return jsonify({'history': history})
    except Exception as e:
        return jsonify({'error': f'History fetch failed: {str(e)}'}), 400

# Enhanced prediction endpoint with anomaly detection
@app.route('/predict-enhanced', methods=['POST'])
def predict_enhanced():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    features = data.get('features', [])
    if len(features) != 6:
        return jsonify({'error': 'Expected 6 features: [year, rainfall, pesticides, avgTemp, country, item]'}), 400

    if not model or not preprocessor:
        return jsonify({'error': 'Model or preprocessor not loaded'}), 500

    try:
        # Make prediction
        processed_features = preprocessor.transform([features])
        prediction = model.predict(processed_features)

        # Calculate confidence
        confidence = 85

        # Anomaly detection
        anomalies = detect_anomalies(features, float(prediction[0]))

        # Generate recommendations
        recommendations = generate_recommendations(features, float(prediction[0]))

        result = {
            'prediction': float(prediction[0]),
            'confidence': confidence,
            'anomalies': anomalies,
            'recommendations': recommendations,
            'factors': {
                'rainfall': 'High' if features[1] > 1000 else 'Medium' if features[1] > 500 else 'Low',
                'temperature': 'High' if features[3] > 25 else 'Medium' if features[3] > 15 else 'Low',
                'pesticides': 'High' if features[2] > 2 else 'Medium' if features[2] > 1 else 'Low'
            }
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Enhanced prediction failed: {str(e)}'}), 400

def detect_anomalies(features, yield_value):
    """Detect anomalies in prediction inputs and results"""
    anomalies = []
    year, rainfall, pesticides, temp, country, item = features

    # Critical yield threshold
    if yield_value < 1000:
        anomalies.append({
            'type': 'critical',
            'message': 'Critically low yield predicted',
            'reasons': ['Extreme weather conditions', 'Insufficient inputs']
        })

    # Environmental anomalies
    if rainfall < 200:
        anomalies.append({
            'type': 'warning',
            'message': 'Drought conditions detected',
            'reasons': ['Very low rainfall']
        })

    if temp > 40:
        anomalies.append({
            'type': 'critical',
            'message': 'Extreme heat conditions',
            'reasons': ['Temperature exceeds crop tolerance']
        })

    return anomalies

def generate_recommendations(features, yield_value):
    """Generate farming recommendations based on inputs"""
    recommendations = []
    year, rainfall, pesticides, temp, country, item = features

    if rainfall < 500:
        recommendations.append({
            'type': 'irrigation',
            'title': 'Irrigation Required',
            'description': 'Install drip irrigation system'
        })

    if yield_value < 3000:
        recommendations.append({
            'type': 'fertilizer',
            'title': 'Soil Enhancement',
            'description': 'Apply NPK fertilizer and organic compost'
        })

    return recommendations

# AI Chatbot endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        history = data.get('history', [])

        if not message:
            return jsonify({'error': 'No message provided'}), 400

        if USE_OPENAI:
            # Use OpenAI API
            try:
                # Prepare conversation context
                messages = [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    }
                ]

                # Add recent conversation history
                for msg in history[-5:]:  # Last 5 messages for context
                    if msg['sender'] == 'user':
                        messages.append({"role": "user", "content": msg['text']})
                    else:
                        messages.append({"role": "assistant", "content": msg['text']})

                # Add current message
                messages.append({"role": "user", "content": message})

                response = client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=messages,
                    max_tokens=MAX_TOKENS,
                    temperature=TEMPERATURE
                )

                ai_response = response.choices[0].message.content

            except Exception as e:
                print(f"OpenAI API error: {e}")
                ai_response = get_fallback_response(message)
        else:
            # Use fallback responses
            ai_response = get_fallback_response(message)

        return jsonify({'response': ai_response})

    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 400

def get_fallback_response(message):
    """Provide intelligent fallback responses based on the specific question asked"""
    message_lower = message.lower()

    # Wheat-specific questions
    if 'wheat' in message_lower:
        if any(word in message_lower for word in ['time', 'when', 'plant', 'sow']):
            return """🌾 **Best Time to Plant Wheat:**

• **Winter Wheat:** Plant in fall (September-November) for spring harvest
• **Spring Wheat:** Plant in early spring (March-May) after frost danger
• **Soil Temperature:** Plant when soil reaches 50-60°F (10-15°C)
• **Regional Timing:** Varies by climate zone and variety
• **Weather Considerations:** Avoid planting before heavy rains

**Planting Tips:**
- Prepare seedbed 2-3 weeks before planting
- Plant 1-2 inches deep in well-drained soil
- Use certified seed for best results

Would you like specific timing for your region?"""

        elif any(word in message_lower for word in ['yield', 'improve', 'increase', 'production']):
            return """� **How to Improve Wheat Yield:**

• **Variety Selection:** Choose high-yielding varieties adapted to your area
• **Soil Preparation:** Deep tillage and proper seedbed preparation
• **Seeding Rate:** 90-120 lbs/acre depending on conditions
• **Fertilization:** Apply nitrogen in split applications (base + top-dress)
• **Weed Control:** Early season weed management is critical

**Key Growth Stages:**
- Tillering: Ensure adequate nitrogen and moisture
- Jointing: Side-dress with nitrogen fertilizer
- Heading: Monitor for diseases and pests
- Grain filling: Maintain soil moisture

Expected yield: 40-80 bushels/acre with good management."""

        elif any(word in message_lower for word in ['fertilizer', 'nutrition', 'nutrients']):
            return """🌾 **Wheat Fertilizer Recommendations:**

• **Nitrogen:** 80-120 lbs/acre (split application recommended)
  - 40-60 lbs at planting
  - 40-60 lbs at tillering/jointing
• **Phosphorus:** 30-50 lbs P2O5/acre based on soil test
• **Potassium:** 40-80 lbs K2O/acre if soil levels are low
• **Sulfur:** 10-20 lbs/acre, especially on sandy soils

**Application Timing:**
- Base fertilizer at planting
- Top-dress nitrogen at tillering (4-6 weeks after emergence)
- Foliar feeding for micronutrients if needed"""

        else:
            return """🌾 **Wheat Cultivation Guide:**

• **Varieties:** Choose winter or spring wheat based on your climate
• **Soil Requirements:** Well-drained, fertile soil with pH 6.0-7.5
• **Planting:** 1-2 inch depth, 90-120 lbs seed/acre
• **Growth Period:** 120-150 days from planting to harvest
• **Water Needs:** 20-25 inches total (including rainfall)

**Common Issues:**
- Rust diseases: Use resistant varieties
- Aphids: Monitor and treat if necessary
- Lodging: Avoid over-fertilization with nitrogen

What specific aspect of wheat growing interests you?"""

    # Corn-specific questions
    elif any(word in message_lower for word in ['corn', 'maize']):
        if any(word in message_lower for word in ['fertilizer', 'nutrition']):
            return """🌽 **Corn Fertilizer Recommendations:**

• **Nitrogen:** 150-200 lbs/acre (most critical nutrient)
  - 30-50 lbs at planting
  - 100-150 lbs side-dress at V6-V8 stage
• **Phosphorus:** 40-80 lbs P2O5/acre based on soil test
• **Potassium:** 60-120 lbs K2O/acre depending on soil levels
• **Zinc:** 1-2 lbs/acre if soil is deficient

**Application Strategy:**
- Starter fertilizer (10-34-0) at planting
- Side-dress nitrogen when corn is knee-high
- Foliar micronutrients during rapid growth"""

        elif any(word in message_lower for word in ['plant', 'planting', 'when', 'time']):
            return """� **Corn Planting Guide:**

• **Timing:** Plant when soil temperature reaches 60°F (16°C)
• **Season:** Late April to early June in most regions
• **Depth:** 1.5-2 inches deep in good conditions
• **Spacing:** 30-36 inch rows, 28,000-35,000 plants/acre
• **Soil Conditions:** Well-drained, avoid wet or compacted soil

**Planting Tips:**
- Test soil temperature at 4-inch depth
- Ensure good seed-to-soil contact
- Consider treated seed for disease protection
- Plant in straight rows for easier cultivation"""

        else:
            return """� **Corn Growing Essentials:**

• **Soil:** Rich, well-drained soil with pH 6.0-6.8
• **Water:** 20-30 inches during growing season
• **Temperature:** Warm season crop, needs 2500+ heat units
• **Spacing:** 30-inch rows, 30,000 plants/acre typical
• **Growth Period:** 90-120 days depending on variety

**Key Growth Stages:**
- V6: Side-dress nitrogen application
- VT (tasseling): Critical water period begins
- R1 (silking): Pollination occurs
- R6 (maturity): Ready for harvest

What specific corn growing question do you have?"""

    # Rice-specific questions
    elif 'rice' in message_lower:
        return """🌾 **Rice Cultivation Guide:**

• **Field Preparation:** Level fields and create bunds for water control
• **Transplanting:** 20-25 day old seedlings, 20cm x 15cm spacing
• **Water Management:** Maintain 2-5cm water depth throughout season
• **Fertilization:** 120:60:40 NPK kg/ha in split applications
• **Weed Control:** Pre-emergence herbicides + hand weeding

**Growth Stages:**
- Tillering: 15-45 days after transplanting
- Panicle initiation: 45-65 days
- Flowering: 65-75 days
- Maturity: 110-130 days

**Water Requirements:**
- Continuous flooding from transplanting to 2 weeks before harvest
- Drain field for harvest operations"""

    # Tomato-specific questions
    elif 'tomato' in message_lower:
        if any(word in message_lower for word in ['plant', 'when', 'time']):
            return """🍅 **When to Plant Tomatoes:**

• **Indoor Start:** 6-8 weeks before last frost date
• **Transplant:** 2-3 weeks after last frost when soil is 60°F+
• **Direct Seed:** Only in warm climates with long seasons
• **Soil Temperature:** Wait until soil reaches 60-65°F (16-18°C)

**Regional Timing:**
- Northern regions: May-June transplanting
- Southern regions: March-April and August-September
- Greenhouse: Year-round with climate control

**Transplanting Tips:**
- Harden off seedlings for 7-10 days
- Plant deep, burying 2/3 of stem
- Space 18-36 inches apart depending on variety"""

        else:
            return """🍅 **Tomato Growing Guide:**

• **Varieties:** Determinate (bush) or indeterminate (vining)
• **Soil:** Well-drained, pH 6.0-6.8, rich in organic matter
• **Support:** Stakes, cages, or trellises for most varieties
• **Water:** 1-2 inches per week, consistent moisture
• **Fertilization:** Balanced fertilizer, avoid excess nitrogen

**Common Problems:**
- Blossom end rot: Consistent watering + calcium
- Cracking: Avoid irregular watering
- Diseases: Good air circulation and crop rotation

**Harvest:** Pick when fruits show color but are still firm."""

    # General farming questions
    elif any(word in message_lower for word in ['soil', 'fertilizer', 'nutrients']):
        return """🌱 **Soil & Fertilizer Management:**

• **Soil Testing:** Test pH and nutrients every 2-3 years
• **pH Management:** Most crops prefer 6.0-7.0 pH range
• **Organic Matter:** Add compost to improve soil structure
• **NPK Balance:** Nitrogen for growth, Phosphorus for roots, Potassium for disease resistance
• **Micronutrients:** Iron, zinc, manganese often deficient

**Fertilizer Application:**
- Apply based on soil test recommendations
- Split nitrogen applications for better efficiency
- Consider slow-release fertilizers for consistent feeding"""

    elif any(word in message_lower for word in ['pest', 'disease', 'insect']):
        return """🐛 **Pest & Disease Management:**

• **Integrated Pest Management (IPM):** Combine multiple control methods
• **Prevention:** Crop rotation, resistant varieties, sanitation
• **Monitoring:** Regular scouting for early detection
• **Biological Control:** Beneficial insects, parasites, predators
• **Chemical Control:** Use pesticides as last resort

**Common Pests:**
- Aphids: Use beneficial insects or insecticidal soap
- Caterpillars: Bt (Bacillus thuringiensis) spray
- Fungal diseases: Improve air circulation, fungicides if severe"""

    elif any(word in message_lower for word in ['water', 'irrigation', 'drought']):
        return """💧 **Water Management:**

• **Irrigation Systems:** Drip irrigation most efficient (90-95% efficiency)
• **Timing:** Water early morning to reduce evaporation
• **Soil Moisture:** Check 6-8 inches deep before watering
• **Mulching:** Reduces water loss by 50-70%
• **Drought Tolerance:** Deep, infrequent watering builds strong roots

**Water Requirements by Crop:**
- Vegetables: 1-2 inches per week
- Grains: 20-30 inches per season
- Fruit trees: Deep watering 1-2 times per week"""

    elif any(word in message_lower for word in ['organic', 'sustainable']):
        return """🌿 **Sustainable Farming Practices:**

• **Crop Rotation:** 3-4 year rotation prevents soil depletion
• **Cover Crops:** Legumes fix nitrogen, grasses prevent erosion
• **Composting:** Recycle organic matter into valuable fertilizer
• **Beneficial Insects:** Plant flowers to attract pollinators
• **Reduced Tillage:** Preserves soil structure and organic matter

**Organic Certification:**
- 3-year transition period required
- No synthetic pesticides or fertilizers
- Detailed record keeping mandatory
- Annual inspections required"""

    else:
        # Default response for unrecognized questions
        return f"""🌾 **Agricultural AI Assistant**

I understand you're asking about: "{message}"

I can provide specific guidance on:

• **Crop-Specific Advice:** Wheat, corn, rice, tomatoes, vegetables
• **Soil Management:** Testing, fertilization, pH adjustment
• **Pest Control:** Integrated pest management strategies
• **Water Management:** Irrigation systems and scheduling
• **Sustainable Practices:** Organic farming and conservation
• **Timing:** When to plant, fertilize, and harvest

Could you be more specific about what aspect you'd like to know? For example:
- "When to plant wheat in my area?"
- "Best fertilizer for corn?"
- "How to control tomato diseases?"

I'm here to help with your farming questions!"""

if __name__ == '__main__':
    init_db()
    app.run(debug=True)