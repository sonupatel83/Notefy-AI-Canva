from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import base64
from io import BytesIO
from PIL import Image

# Load environment variables from .env.local file
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('models/gemini-1.5-pro-latest')

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(BytesIO(image_data))

        # Generate content using Gemini with a more comprehensive prompt
        response = model.generate_content([
            """Analyze this handwritten content and provide a detailed explanation. Consider the following aspects:

1. If it's a mathematical expression or equation:
   - Explain the mathematical concepts involved
   - Break down the steps if it's a calculation
   - Provide the solution if applicable
   - Explain any formulas or theorems used

2. If it's a chemical formula or equation:
   - Identify the elements and compounds
   - Explain the chemical reaction if present
   - Describe the properties and significance
   - Explain any chemical principles involved

3. If it's a physics formula or concept:
   - Explain the physical principles
   - Describe the variables and their meanings
   - Explain the applications and significance
   - Provide relevant examples

4. If it's a general note or text:
   - Summarize the main points
   - Explain key concepts
   - Provide context and significance
   - Suggest related topics or further reading

Provide a clear, detailed explanation that would help someone understand the content thoroughly.""",
            image
        ])

        return jsonify({'response': response.text})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 