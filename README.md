# Traffic Congestion Dashboard

A web application for monitoring traffic congestion and air quality in different locations.

## Setup Instructions

### API Keys

This application requires two API keys to function properly:

1. **TomTom API Key**: Used for location search and traffic data
   - Sign up for a free account at [TomTom Developer Portal](https://developer.tomtom.com/)
   - Create a new project and get your API key
   - Make sure to enable the "Search API" service in your project
   - Update the `REACT_APP_TOMTOM_API_KEY` in the `backend/.env` file
   - If you encounter a 403 error, verify that your API key is valid and has the necessary permissions
   - **Important**: After creating your API key, wait a few minutes for it to become active before using it
   - **Note**: Free tier API keys have usage limits. If you exceed these limits, you may need to upgrade your plan

2. **Weather API Key**: Used for weather and air quality data
   - Sign up for a free account at [WeatherAPI](https://www.weatherapi.com/)
   - Get your API key from your account dashboard
   - Update the `REACT_APP_WEATHER_API_KEY` in the `backend/.env` file

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Troubleshooting

If you encounter a "Failed to fetch location data: 403" error, it means there's an issue with your TomTom API key. Please check:

1. That you've updated the API key in the `backend/.env` file
2. That your API key is valid and not expired
3. That your TomTom account has sufficient credits/quota
4. That you've enabled the "Search API" service in your TomTom project
5. That your API key has the necessary permissions
6. That you've waited a few minutes after creating the API key for it to become active

To verify your API key, you can test it directly with a curl command:
```
curl -X GET "https://api.tomtom.com/search/2/search/New%20York?key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual TomTom API key. If the request succeeds, your API key is valid.

If you're still having issues, try these additional steps:
1. Check the TomTom Developer Portal for any error messages or notifications
2. Verify that your project is properly set up with the correct services enabled
3. Try creating a new API key if the current one isn't working
4. Check if your IP address is whitelisted if you've set up IP restrictions

## Features

- Search for locations and view traffic congestion data
- View air quality information for different areas
- Interactive map with traffic and air quality visualization
- Responsive design for desktop and mobile devices 