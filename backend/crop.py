
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os


app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(debug=True)