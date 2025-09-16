
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import sqlite3
import json
from datetime import datetime
import requests
# import openai
# import os


app = Flask(__name__)
CORS(app)

# OpenAI Configuration (commented out for now)
# openai.api_key = os.getenv('OPENAI_API_KEY', 'your-openai-api-key-here')

# If no OpenAI key, use fallback responses
USE_OPENAI = False  # Set to False for now

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
                        "content": """You are an expert agricultural AI assistant specializing in farming, crop cultivation, and agricultural practices.

                        Your expertise includes:
                        - Crop cultivation techniques and best practices
                        - Soil management, fertilization, and nutrient management
                        - Pest and disease identification and control
                        - Weather patterns and irrigation strategies
                        - Sustainable and organic farming methods
                        - Market trends and crop economics
                        - Agricultural technology and equipment

                        Provide practical, actionable advice that farmers can implement. Use emojis appropriately and keep responses concise but informative. Always prioritize sustainable and environmentally friendly practices."""
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

                # response = openai.ChatCompletion.create(
                #     model="gpt-3.5-turbo",
                #     messages=messages,
                #     max_tokens=500,
                #     temperature=0.7
                # )
                #
                # ai_response = response.choices[0].message.content
                ai_response = get_fallback_response(message)

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
    """Provide fallback responses when OpenAI is not available"""
    message_lower = message.lower()

    # Crop-specific responses
    if any(word in message_lower for word in ['wheat', 'rice', 'corn', 'maize']):
        return """🌾 **Crop Cultivation Tips:**

• **Soil Preparation:** Ensure well-drained, fertile soil with pH 6.0-7.5
• **Planting:** Plant during optimal season for your region
• **Fertilization:** Apply balanced NPK fertilizer (10-10-10) at planting
• **Irrigation:** Maintain consistent moisture, avoid waterlogging
• **Pest Control:** Monitor regularly and use integrated pest management

Would you like specific advice for your crop type?"""

    elif any(word in message_lower for word in ['soil', 'fertilizer', 'nutrient']):
        return """🌱 **Soil & Fertilizer Management:**

• **Soil Testing:** Test pH and nutrient levels annually
• **Organic Matter:** Add compost or manure to improve soil structure
• **NPK Balance:** Use 4-2-1 ratio (Nitrogen-Phosphorus-Potassium) for most crops
• **Micronutrients:** Ensure adequate zinc, iron, and magnesium
• **Timing:** Apply fertilizers during active growing periods

Need help with specific soil issues?"""

    elif any(word in message_lower for word in ['pest', 'disease', 'insect']):
        return """🐛 **Pest & Disease Control:**

• **Prevention:** Use crop rotation and resistant varieties
• **Monitoring:** Regular field inspections for early detection
• **Biological Control:** Encourage beneficial insects and predators
• **Organic Options:** Neem oil, diatomaceous earth, companion planting
• **Chemical Control:** Use pesticides as last resort, follow label instructions

What specific pest problem are you facing?"""

    elif any(word in message_lower for word in ['water', 'irrigation', 'drought']):
        return """💧 **Water Management:**

• **Drip Irrigation:** Most efficient water delivery system
• **Mulching:** Reduces water evaporation by 50-70%
• **Timing:** Water early morning or evening to minimize evaporation
• **Soil Moisture:** Monitor with sensors or simple finger test
• **Drought Strategies:** Use drought-resistant varieties, improve soil organic matter

How can I help with your specific water challenges?"""

    elif any(word in message_lower for word in ['yield', 'production', 'harvest']):
        return """📈 **Yield Optimization:**

• **Variety Selection:** Choose high-yielding, disease-resistant varieties
• **Plant Density:** Optimize spacing for maximum light and nutrient access
• **Nutrition:** Balanced fertilization throughout growing season
• **Timing:** Plant and harvest at optimal times
• **Post-Harvest:** Proper storage and handling to minimize losses

What's your current yield challenge?"""

    elif any(word in message_lower for word in ['organic', 'sustainable', 'natural']):
        return """🌿 **Sustainable Farming Practices:**

• **Crop Rotation:** 3-4 year rotation to break pest cycles
• **Cover Crops:** Improve soil health and prevent erosion
• **Composting:** Create nutrient-rich organic matter
• **Beneficial Insects:** Plant flowers to attract pollinators and predators
• **Reduced Tillage:** Preserve soil structure and microbial life

Interested in transitioning to organic methods?"""

    else:
        return """🌾 **Agricultural AI Assistant**

I can help you with:

• **Crop Cultivation:** Planting, growing, and harvesting techniques
• **Soil Management:** Testing, fertilization, and improvement
• **Pest Control:** Identification and treatment strategies
• **Water Management:** Irrigation and drought mitigation
• **Sustainable Practices:** Organic and eco-friendly methods
• **Yield Optimization:** Maximizing production efficiency

What specific farming question can I help you with today?"""

if __name__ == '__main__':
    init_db()
    app.run(debug=True)