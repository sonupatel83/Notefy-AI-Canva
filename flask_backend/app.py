from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os
from PIL import Image
import io
import google.generativeai as genai
import traceback

app = Flask(__name__)
# Enable CORS for all routes and all origins
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask API is running"}), 200

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        print("Received request to /analyze")
        
        # Check if request has JSON data
        if not request.is_json:
            print("Error: Request does not contain JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.json
        if not data:
            print("Error: Empty JSON data")
            return jsonify({'error': 'Empty request data'}), 400
        
        if 'image' not in data:
            print("Error: No image data in request")
            return jsonify({'error': 'Image data is required'}), 400
        
        # Get API key from request or environment
        api_key = data.get('api_key') or os.environ.get('GEMINI_API_KEY')
        if not api_key:
            print("Error: No Gemini API key provided")
            return jsonify({'error': 'Gemini API key is required'}), 400
        
        # print(f"Using API key: {api_key[:5]}...{api_key[-5:]}")
        
        # Configure the Gemini API
        genai.configure(api_key=api_key)
        
        try:
            # Decode base64 image
            image_data = base64.b64decode(data['image'])
            image = Image.open(io.BytesIO(image_data))
            print(f"Successfully decoded image: {image.size}")
            
            # Set up the model
            model = genai.GenerativeModel("models/gemini-1.5-pro-latest")
            print("Model initialized")
            
            # Create a more versatile prompt that handles various subjects
            prompt = """
            Analyze this image containing handwritten or typed notes/text. 
            
            Respond appropriately based on the content:
            
            1. If it's a question (any subject including general knowledge, science, math, history, etc.), provide a detailed answer.
            2. If it's a statement or fact, provide additional context or related information.
            3. If it's a mathematical expression or equation, explain it and provide the solution if applicable.
            4. If it's related to chemistry, biology, physics, or any other science, provide relevant explanations.
            5. If it's a simple greeting or casual text, respond conversationally.
            6. If it contains multiple topics, address each one separately.
            
            Format your response using Markdown for better readability:
            - Use headings (##) for main sections
            - Use bullet points or numbered lists where appropriate
            - Use **bold** for emphasis on important points
            - Use mathematical notation with LaTeX where appropriate (e.g., $E=mc^2$)
            - Include relevant examples to illustrate concepts
            
            If diagrams or images would help explain the concept, describe them clearly.
            """
            
            # Generate content
            print("Sending request to Gemini API...")
            response = model.generate_content([prompt, image])
            
            # Process and return the response
            formatted_response = response.text
            print(f"Received response from Gemini API: {formatted_response[:100]}...")
            
            return jsonify({
                'response': formatted_response
            })
            
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            traceback.print_exc()
            return jsonify({'error': f'Error processing image: {str(e)}'}), 500
            
    except Exception as e:
        print(f"General error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    # Make sure the server is accessible from other machines
    app.run(debug=True, host='0.0.0.0', port=5000)

