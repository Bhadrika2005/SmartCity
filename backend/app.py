from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import re
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API keys from environment variables
WEATHER_API_KEY = os.getenv('REACT_APP_WEATHER_API_KEY')
GEOAPIFY_PLACES_API_KEY = "9d4ad359ed774981910f1d75fbc52d4a"  # Using the new Geoapify Places API key
GEOAPIFY_PLACES_DETAILS_API_KEY = "05ca414508274bff942fe9f78c88fd3d"  # Using the new Geoapify Places Details API key
UNSPLASH_API_KEY = "FPRls87sxsqc0-_Dz7LXOaaKc0uMmzB0SQTi9v-YhF8"
NEWSDATA_API_KEY = "pub_83014ab199cd0af817ec9fd9d7561cd346ba8"
TOMTOM_API_KEY = "ixNEWaQzrDA850Ulb1e2ixKIGsy9kMLy"

# Debug logging
print("Environment variables loaded:")
print(f"GEOAPIFY_PLACES_API_KEY length: {len(GEOAPIFY_PLACES_API_KEY) if GEOAPIFY_PLACES_API_KEY else 'None'}")
print(f"GEOAPIFY_PLACES_API_KEY first 5 chars: {GEOAPIFY_PLACES_API_KEY[:5] if GEOAPIFY_PLACES_API_KEY else 'None'}")

@app.route('/api/city-data', methods=['GET'])
def get_city_data():
    city_name = request.args.get('city')
    if not city_name:
        return jsonify({'error': 'City name is required'}), 400

    try:
        print(f"\n----- Processing request for city: {city_name} -----")
        
        # Get city coordinates using Geoapify Geocoding
        geocoding_url = f"https://api.geoapify.com/v1/geocode/search?text={city_name}&apiKey={GEOAPIFY_PLACES_API_KEY}"
        geocoding_response = requests.get(geocoding_url)
        geocoding_data = geocoding_response.json()
        
        if not geocoding_data.get('features'):
            print(f"Error: No coordinates found for {city_name}")
            return jsonify({'error': 'City not found'}), 404
            
        city = geocoding_data['features'][0]['properties']
        lat = city['lat']
        lon = city['lon']
        print(f"Coordinates for {city_name}: Lat={lat}, Lon={lon}")
        
        # Get news about the city using NewsData API
        news_url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q={city_name}&language=en"
        news_response = requests.get(news_url)
        news_data = news_response.json()
        
        # Process news articles
        city_news = []
        if news_data.get('results'):
            for article in news_data['results'][:3]:  # Get top 3 news articles
                city_news.append({
                    'title': article.get('title', ''),
                    'description': article.get('description', ''),
                    'source': article.get('source_id', ''),
                    'url': article.get('link', ''),
                    'published_at': article.get('pubDate', '')
                })
        
        # Get weather data
        weather_url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
        print(f"Fetching weather data for coordinates: {lat}, {lon}")
        
        weather_response = requests.get(weather_url)
        print(f"Weather API response status: {weather_response.status_code}")
        
        if weather_response.status_code == 401:
            return jsonify({'error': 'Invalid Weather API key'}), 401
        elif weather_response.status_code != 200:
            return jsonify({'error': f'Weather API error: {weather_response.status_code}'}), weather_response.status_code
            
        weather_data = weather_response.json()
        
        if 'current' not in weather_data:
            return jsonify({'error': 'Invalid weather data format'}), 500
            
        # Get famous places using Geoapify Places API with better categories
        places_url = f"https://api.geoapify.com/v2/places?categories=tourism.attraction,tourism.sights,entertainment,building.historic,building.monument,religion.place&filter=circle({lon},{lat},15000)&limit=10&apiKey={GEOAPIFY_PLACES_API_KEY}"
        
        # Add detailed place information
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'CityExplorer/1.0'
        }
        
        places_response = requests.get(places_url, headers=headers)
        places_data = places_response.json()
        
        # Print number of places found for debugging
        place_count = len(places_data.get('features', []))
        print(f"Found {place_count} places for {city_name}")
        
        # Get city images using Unsplash API with high quality
        unsplash_url = f"https://api.unsplash.com/search/photos?query={city_name} landmarks&per_page=5&client_id={UNSPLASH_API_KEY}&orientation=landscape&content_filter=high"
        unsplash_response = requests.get(unsplash_url)
        unsplash_data = unsplash_response.json()
        
        # Process places data with images and descriptions
        famous_places = []
        if places_data.get('features'):
            for place in places_data['features']:
                properties = place['properties']
                
                # Skip places without names
                if not properties.get('name'):
                    continue
                
                # Format place name properly
                place_name = properties.get('name')
                
                # Try to get place ID for more details if available
                place_id = properties.get('place_id')
                detailed_info = {}
                
                if place_id:
                    # Get more details about this specific place using place_id
                    place_details_url = f"https://api.geoapify.com/v2/place-details?id={place_id}&apiKey={GEOAPIFY_PLACES_DETAILS_API_KEY}"
                    try:
                        place_details_response = requests.get(place_details_url, headers=headers)
                        if place_details_response.status_code == 200:
                            place_details = place_details_response.json()
                            if place_details.get('features') and len(place_details['features']) > 0:
                                detailed_info = place_details['features'][0].get('properties', {})
                                print(f"Got detailed info for {place_name}")
                    except Exception as e:
                        print(f"Error getting place details: {str(e)}")
                
                # Get better description from Geoapify data
                place_categories = properties.get('categories', [])
                category_parts = []
                for category in place_categories:
                    parts = category.split('.')
                    if len(parts) > 1:
                        category_parts.append(parts[1].replace('_', ' ').title())
                
                if not category_parts:
                    category_parts = ['Landmark']
                    
                category = category_parts[0]
                
                # Create a meaningful description based on available data
                description_elements = []
                
                # Add description from detailed info if available
                if detailed_info.get('description'):
                    description_elements.append(detailed_info.get('description'))
                elif detailed_info.get('datasource', {}).get('raw', {}).get('description'):
                    description_elements.append(detailed_info.get('datasource', {}).get('raw', {}).get('description'))
                
                if properties.get('street'):
                    description_elements.append(f"Located on {properties.get('street')}")
                
                if 'historic' in str(place_categories).lower():
                    description_elements.append("A historic site")
                elif 'monument' in str(place_categories).lower():
                    description_elements.append("A significant monument")
                elif 'religion' in str(place_categories).lower():
                    description_elements.append("A religious site")
                elif 'museum' in str(place_categories).lower():
                    description_elements.append("A museum")
                elif 'building' in str(place_categories).lower():
                    description_elements.append("A notable building")
                    
                # Create a concise description
                description = " ".join(description_elements)
                if not description:
                    description = f"A famous {category.lower()} in {city_name}"
                
                # Get why it's famous from details if available
                why_famous = f"Known for being one of the most visited {category.lower()}s in {city_name}"
                
                # Check for review summary or other interesting details
                if detailed_info.get('review_summary', {}).get('rating'):
                    rating_value = detailed_info['review_summary']['rating']
                    rating_count = detailed_info['review_summary'].get('count', 0)
                    if rating_count > 10:
                        why_famous = f"Rated {rating_value}/5 by {rating_count} visitors as a must-see attraction"
                
                # Check for Wikipedia extract
                if detailed_info.get('wikipedia_extract'):
                    why_famous = detailed_info['wikipedia_extract'][:100] + "..."
                
                # Get dedicated image for this specific place
                place_images_url = f"https://api.unsplash.com/search/photos?query={place_name} {city_name}&per_page=1&client_id={UNSPLASH_API_KEY}&orientation=landscape"
                place_images_response = requests.get(place_images_url)
                place_images_data = place_images_response.json()
                
                image_url = None
                if place_images_data.get('results') and len(place_images_data['results']) > 0:
                    image_url = place_images_data['results'][0]['urls']['regular']
                else:
                    # Try more general search
                    place_images_url = f"https://api.unsplash.com/search/photos?query={category} {city_name}&per_page=1&client_id={UNSPLASH_API_KEY}&orientation=landscape"
                    place_images_response = requests.get(place_images_url)
                    place_images_data = place_images_response.json()
                    
                    if place_images_data.get('results') and len(place_images_data['results']) > 0:
                        image_url = place_images_data['results'][0]['urls']['regular']
                    elif unsplash_data.get('results') and len(unsplash_data['results']) > 0:
                        # Fallback to city images
                        image_url = unsplash_data['results'][0]['urls']['regular']
                
                # Create rating based on place data or default
                rating = 4.5
                if properties.get('rate'):
                    rating = properties.get('rate')
                
                famous_places.append({
                    'name': place_name,
                    'category': category,
                    'address': properties.get('formatted', ''),
                    'rating': rating,
                    'image_url': image_url,
                    'description': description,
                    'why_famous': why_famous
                })
        
        # If insufficient places found, add some popular landmarks based on city
        if len(famous_places) < 4:
            print(f"Not enough places found for {city_name}, adding popular landmarks")
            
            # Dictionary of popular landmarks for major cities
            popular_landmarks = {
                'New York': [
                    {'name': 'Statue of Liberty', 'category': 'Monument', 'why_famous': 'Iconic symbol of freedom and the United States'},
                    {'name': 'Empire State Building', 'category': 'Building', 'why_famous': 'Historic 102-story skyscraper and NYC icon'},
                    {'name': 'Central Park', 'category': 'Park', 'why_famous': 'Urban park spanning 843 acres in the heart of Manhattan'},
                    {'name': 'Times Square', 'category': 'Square', 'why_famous': 'Major commercial intersection known for bright lights and billboards'}
                ],
                'London': [
                    {'name': 'Big Ben', 'category': 'Monument', 'why_famous': 'Iconic clock tower at the north end of Westminster Palace'},
                    {'name': 'Tower Bridge', 'category': 'Bridge', 'why_famous': 'Iconic Victorian bridge over the River Thames'},
                    {'name': 'Buckingham Palace', 'category': 'Palace', 'why_famous': 'Official London residence of the UK sovereign'},
                    {'name': 'British Museum', 'category': 'Museum', 'why_famous': 'Public museum dedicated to human history, art and culture'}
                ],
                'Paris': [
                    {'name': 'Eiffel Tower', 'category': 'Monument', 'why_famous': 'Iconic iron tower built in 1889, symbol of Paris'},
                    {'name': 'Louvre Museum', 'category': 'Museum', 'why_famous': 'World\'s largest art museum and historic monument'},
                    {'name': 'Notre-Dame Cathedral', 'category': 'Cathedral', 'why_famous': 'Medieval Catholic cathedral known for Gothic architecture'},
                    {'name': 'Arc de Triomphe', 'category': 'Monument', 'why_famous': 'Historic monument honoring those who fought for France'}
                ],
                'Rome': [
                    {'name': 'Colosseum', 'category': 'Monument', 'why_famous': 'Ancient amphitheater used for gladiatorial contests'},
                    {'name': 'Vatican City', 'category': 'Religious Site', 'why_famous': 'Independent city-state and headquarters of the Roman Catholic Church'},
                    {'name': 'Trevi Fountain', 'category': 'Fountain', 'why_famous': 'Baroque fountain known for the tradition of throwing coins'},
                    {'name': 'Roman Forum', 'category': 'Historic Site', 'why_famous': 'Rectangular forum surrounded by ruins of ancient government buildings'}
                ],
                'Tokyo': [
                    {'name': 'Tokyo Tower', 'category': 'Tower', 'why_famous': 'Communications and observation tower inspired by the Eiffel Tower'},
                    {'name': 'Senso-ji Temple', 'category': 'Temple', 'why_famous': 'Ancient Buddhist temple with a five-story pagoda'},
                    {'name': 'Shibuya Crossing', 'category': 'Intersection', 'why_famous': 'Famous scramble crossing used by thousands of pedestrians'},
                    {'name': 'Meiji Shrine', 'category': 'Shrine', 'why_famous': 'Shinto shrine dedicated to Emperor Meiji and Empress Shōken'}
                ],
                'Sydney': [
                    {'name': 'Sydney Opera House', 'category': 'Theater', 'why_famous': 'Multi-venue performing arts center with distinctive sail design'},
                    {'name': 'Sydney Harbour Bridge', 'category': 'Bridge', 'why_famous': 'Steel through arch bridge across Sydney Harbour'},
                    {'name': 'Bondi Beach', 'category': 'Beach', 'why_famous': 'Popular beach known for its golden sands and surfing conditions'},
                    {'name': 'Taronga Zoo', 'category': 'Zoo', 'why_famous': 'Major zoo featuring Australian native wildlife and exotic species'}
                ]
            }
            
            # Add default popular places for any city not in the dictionary
            default_landmarks = [
                {'name': f'{city_name} Cathedral', 'category': 'Religious Site', 'why_famous': f'Historic religious site in {city_name}'},
                {'name': f'{city_name} Museum', 'category': 'Museum', 'why_famous': f'Important cultural institution in {city_name}'},
                {'name': f'{city_name} Park', 'category': 'Park', 'why_famous': f'Popular green space in {city_name}'},
                {'name': f'{city_name} Monument', 'category': 'Monument', 'why_famous': f'Significant historical monument in {city_name}'}
            ]
            
            # Select landmarks for this city or use defaults
            landmarks_to_add = popular_landmarks.get(city_name, default_landmarks)
            
            # Add each landmark with images
            for landmark in landmarks_to_add:
                if len(famous_places) >= 8:
                    break
                    
                # Check if landmark already exists in famous_places
                if any(place['name'] == landmark['name'] for place in famous_places):
                    continue
                
                # Get image for landmark
                landmark_image_url = f"https://api.unsplash.com/search/photos?query={landmark['name']}&per_page=1&client_id={UNSPLASH_API_KEY}&orientation=landscape"
                landmark_image_response = requests.get(landmark_image_url)
                landmark_image_data = landmark_image_response.json()
                
                image_url = None
                if landmark_image_data.get('results') and len(landmark_image_data['results']) > 0:
                    image_url = landmark_image_data['results'][0]['urls']['regular']
                elif unsplash_data.get('results') and len(unsplash_data['results']) > 0:
                    # Use city image as fallback
                    image_url = unsplash_data['results'][0]['urls']['regular']
                
                famous_places.append({
                    'name': landmark['name'],
                    'category': landmark['category'],
                    'address': f'In {city_name}',
                    'rating': 4.8,
                    'image_url': image_url,
                    'description': f"A famous {landmark['category'].lower()} in {city_name}",
                    'why_famous': landmark['why_famous']
                })
        
        # Get city images
        city_images = []
        if unsplash_data.get('results'):
            city_images = [photo['urls']['regular'] for photo in unsplash_data['results']]
        
        # Add default city image if none found
        if not city_images:
            city_images = ["https://images.unsplash.com/photo-1564221710304-0b37c8b9d729"]
        
        # Get Wikipedia data for city description
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles={city_name}"
        wiki_response = requests.get(wiki_url)
        
        # Process Wikipedia data
        wiki_extract = f"{city_name} is a beautiful city with a rich history and culture."
        wiki_page_id = None
        
        try:
            if wiki_response.status_code == 200 and wiki_response.text:
                wiki_data = wiki_response.json()
                if 'query' in wiki_data and 'pages' in wiki_data['query']:
                    page = next(iter(wiki_data['query']['pages'].values()))
                    if 'extract' in page and page['extract']:
                        wiki_extract = page['extract']
                    wiki_page_id = page.get('pageid')
            else:
                print(f"Wikipedia API returned status {wiki_response.status_code} with empty response")
        except (ValueError, StopIteration) as e:
            print(f"Error parsing Wikipedia data: {str(e)}")
            wiki_extract = f"{city_name} is a beautiful city with a rich history and culture."
                
        # Get more detailed Wikipedia information for tips and info section
        # Process Wikipedia data and structure for Tips & Info section
        tips_and_info = []
        
        # Get climate data from Wikipedia sections
        climate_info = []
        transport_info = []
        travel_tips = []
        
        # Try to get specific sections from Wikipedia for better "real" information
        if wiki_page_id:
            print(f"Getting Wikipedia details for {city_name} with page ID: {wiki_page_id}")
            
            # Get ALL sections to find more informative ones
            wiki_sections_url = f"https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid={wiki_page_id}&prop=sections"
            wiki_sections_response = requests.get(wiki_sections_url)
            wiki_sections_data = wiki_sections_response.json()
            
            climate_section_id = None
            transport_section_id = None
            culture_section_id = None
            tourism_section_id = None
            
            # Find all potentially useful sections
            if 'parse' in wiki_sections_data and 'sections' in wiki_sections_data['parse']:
                for section in wiki_sections_data['parse']['sections']:
                    section_title = section['line'].lower()
                    if any(term in section_title for term in ['climate', 'weather', 'precipitation']):
                        climate_section_id = section['index']
                        print(f"Found climate section: {section['line']}")
                    elif any(term in section_title for term in ['transport', 'transit', 'traffic', 'metro']):
                        transport_section_id = section['index']
                        print(f"Found transport section: {section['line']}")
                    elif any(term in section_title for term in ['culture', 'arts', 'customs', 'tradition']):
                        culture_section_id = section['index']
                        print(f"Found culture section: {section['line']}")
                    elif any(term in section_title for term in ['tourism', 'travel', 'visitor']):
                        tourism_section_id = section['index']
                        print(f"Found tourism section: {section['line']}")
            
            # Extract content from these sections
            sections_to_extract = [
                (climate_section_id, 'Climate', climate_info),
                (transport_section_id, 'Transport', transport_info)
            ]
            
            # Add information from culture and tourism for travel tips
            culture_and_tourism_info = []
            
            for section_id, section_name, info_list in sections_to_extract:
                if section_id:
                    try:
                        section_url = f"https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid={wiki_page_id}&section={section_id}&prop=text&formatversion=2"
                        section_response = requests.get(section_url)
                        section_data = section_response.json()
                        
                        if 'parse' in section_data and 'text' in section_data['parse']:
                            html_text = section_data['parse']['text']
                            
                            # Extract paragraphs
                            paragraphs = re.findall(r'<p>(.*?)</p>', html_text, re.DOTALL)
                            if paragraphs:
                                # Clean text 
                                clean_text = ' '.join(re.sub(r'<[^>]+>', '', para) for para in paragraphs[:2])
                                clean_text = re.sub(r'\[\d+\]', '', clean_text)  # Remove citations
                                
                                # Extract short phrases and facts
                                sentences = re.split(r'(?<=[.!?])\s+', clean_text)
                                
                                if section_name == 'Climate':
                                    # Climate-specific extraction
                                    climate_class_match = re.search(r'(tropical|subtropical|temperate|continental|mediterranean|arid|desert|humid|monsoon|K[öo]ppen[\s\w-]+) climate', clean_text, re.IGNORECASE)
                                    if climate_class_match:
                                        climate_type = climate_class_match.group(0)
                                        info_list.append(f"{climate_type.strip()}")
                                    
                                    # Find rainy season
                                    rainy_match = re.search(r'(monsoon|rain[a-z]*|precipitation).{1,50}(between|during|from)[\s\w]+([A-Z][a-z]+).{1,15}([A-Z][a-z]+)', clean_text, re.IGNORECASE)
                                    if rainy_match:
                                        rainy_info = rainy_match.group(0)
                                        # Extract just the months
                                        months = re.findall(r'([A-Z][a-z]+)', rainy_info)
                                        if len(months) >= 2:
                                            info_list.append(f"Rainy season: {months[0]} to {months[-1]}")
                                    
                                    # Find dry season
                                    dry_match = re.search(r'(dry).{1,50}(between|during|from)[\s\w]+([A-Z][a-z]+).{1,15}([A-Z][a-z]+)', clean_text, re.IGNORECASE)
                                    if dry_match:
                                        dry_info = dry_match.group(0)
                                        # Extract just the months
                                        months = re.findall(r'([A-Z][a-z]+)', dry_info)
                                        if len(months) >= 2:
                                            info_list.append(f"Dry period: {months[0]} to {months[-1]}")
                                            
                                    # Find temperature info
                                    temp_match = re.search(r'temperature.{1,50}(range|between|varies).{1,50}\d+.{1,10}\d+', clean_text, re.IGNORECASE)
                                    if temp_match:
                                        temp_info = temp_match.group(0)
                                        # Extract just the numbers
                                        temps = re.findall(r'(\d+)', temp_info)
                                        if len(temps) >= 2:
                                            info_list.append(f"Temperature range: {temps[0]}°C to {temps[1]}°C")
                                
                                elif section_name == 'Transport':
                                    # Transport-specific extraction
                                    # Find public transport types
                                    transport_types = re.findall(r'(metro|subway|train|bus|tram|ferry|railway|rickshaw|taxi|monorail)', clean_text, re.IGNORECASE)
                                    if transport_types:
                                        unique_types = list(set([t.capitalize() for t in transport_types]))
                                        info_list.append(f"Public modes: {', '.join(unique_types)}")
                                    
                                    # Find specific transport information
                                    for sentence in sentences[:10]:
                                        if len(sentence) > 20 and len(sentence) < 150:
                                            # Extract key transport facts
                                            for keyword in ['metro', 'bus', 'train', 'taxi', 'airport']:
                                                if keyword in sentence.lower():
                                                    # Simplify the sentence
                                                    simple = re.sub(r'(,\s*which|,\s*where|,\s*and\s*is|,\s*with\s*its)', '', sentence)
                                                    # Extract key part
                                                    parts = simple.split(',')
                                                    for part in parts:
                                                        if keyword in part.lower() and len(part) < 100:
                                                            # Clean and format
                                                            clean_part = part.strip()
                                                            if clean_part and len(clean_part) > 20:
                                                                # Make it more concise
                                                                final_part = re.sub(r'(is|are|has|have)\s+', '', clean_part)
                                                                final_part = re.sub(r'(the|a|an)\s+', '', final_part)
                                                                final_part = final_part.capitalize()
                                                                # Add if unique
                                                                if not any(final_part.lower() in item.lower() for item in info_list):
                                                                    info_list.append(final_part)
                            
                            print(f"Extracted {len(info_list)} items for {section_name}")
                    except Exception as e:
                        print(f"Error extracting {section_name} data: {str(e)}")
            
            # Extract culture and tourism info for travel tips
            for section_id in [culture_section_id, tourism_section_id]:
                if section_id:
                    try:
                        section_url = f"https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid={wiki_page_id}&section={section_id}&prop=text&formatversion=2"
                        section_response = requests.get(section_url)
                        section_data = section_response.json()
                        
                        if 'parse' in section_data and 'text' in section_data['parse']:
                            html_text = section_data['parse']['text']
                            
                            # Extract paragraphs
                            paragraphs = re.findall(r'<p>(.*?)</p>', html_text, re.DOTALL)
                            if paragraphs:
                                # Clean text 
                                clean_text = ' '.join(re.sub(r'<[^>]+>', '', para) for para in paragraphs[:1])
                                clean_text = re.sub(r'\[\d+\]', '', clean_text)  # Remove citations
                                
                                # Extract interesting facts
                                sentences = re.split(r'(?<=[.!?])\s+', clean_text)
                                for sentence in sentences[:5]:
                                    if len(sentence) > 20 and len(sentence) < 100:
                                        if re.search(r'(famous|popular|known|celebrate|festival|cuisine|food|traditional|typical)', sentence.lower()):
                                            # Clean and make concise
                                            simple = sentence.strip()
                                            simple = re.sub(r'(it is|there is|there are|the city is|the city has)\s+', '', simple)
                                            simple = simple.strip()
                                            if simple and len(simple) > 20:
                                                culture_and_tourism_info.append(simple)
                    except Exception as e:
                        print(f"Error extracting culture data: {str(e)}")
            
            # Add a couple of culture/tourism tips to travel tips
            if culture_and_tourism_info:
                for item in culture_and_tourism_info[:2]:
                    travel_tips.append(item)

        # If we don't have climate info, add default climate info based on city location
        if len(climate_info) < 2:
            print(f"No sufficient climate data for {city_name}, adding defaults")
            # Default climate info based on location/country
            if city.get('country_code') == 'IN':
                climate_info = [
                    "Tropical wet and dry climate (Köppen: Aw)",
                    "Monsoon season: June to September",
                    "Virtually rainless from October to May", 
                    "Wettest months: July and August"
                ]
            elif city.get('lat', 0) > 40:  # Northern cities
                climate_info = [
                    "Temperate climate with four distinct seasons",
                    "Coldest months: December to February",
                    "Warmest months: June to August",
                    "Moderate rainfall throughout the year"
                ]
            elif city.get('lat', 0) < -30:  # Southern cities
                climate_info = [
                    "Temperate climate with reversed seasons",
                    "Coldest months: June to August",
                    "Warmest months: December to February",
                    "Precipitation varies by region"
                ]
            elif -23.5 < city.get('lat', 0) < 23.5:  # Tropical
                climate_info = [
                    "Tropical climate with wet and dry seasons",
                    "Consistent warm temperatures year-round",
                    "Rainy season varies by hemisphere",
                    "High humidity levels throughout the year"
                ]
            else:  # Default
                climate_info = [
                    "Climate varies by season",
                    "Check weather forecast before visiting",
                    "Pack layers for changing temperatures",
                    "Be prepared for local weather conditions"
                ]
                
        # If we don't have transport info, add default transport info
        if len(transport_info) < 2:
            print(f"No sufficient transport data for {city_name}, adding defaults")
            if city.get('country_code') == 'IN':
                transport_info = [
                    "Public modes: Suburban Railway, Metro, BEST buses, taxis, ferries",
                    "Auto rickshaws: Only in suburbs",
                    "Taxis: Available city-wide",
                    "CNG fuel for rickshaws and taxis (eco-friendly)"
                ]
            else:
                transport_info = [
                    "Public transport: Available in most areas",
                    "Local buses: Connect major landmarks",
                    "Taxis: Available through apps and street hailing",
                    "Walking: Recommended for city center"
                ]
            
        # Add travel tips based on country and Wikipedia data
        if len(travel_tips) < 2:
            print(f"No sufficient travel tips for {city_name}, adding defaults")
            country_code = city.get('country_code', '').upper()
            if country_code == 'IN':
                travel_tips = [
                    "Language: Hindi common, English in tourist areas",
                    "Currency: Indian Rupee ₹",
                    "Payment: Cards widely accepted, keep cash handy",
                    "Try local street food and regional cuisine"
                ]
            elif country_code == 'JP':
                travel_tips = [
                    "Language: Japanese, limited English signage",
                    "Currency: Japanese Yen ¥",
                    "Payment: Cash preferred, cards at major places",
                    "Remove shoes when entering temples and homes"
                ]
            elif country_code == 'FR':
                travel_tips = [
                    "Language: French, English in tourist sites",
                    "Currency: Euro €",
                    "Payment: Cards widely accepted everywhere",
                    "Tipping is not necessary but appreciated"
                ]
            elif country_code == 'DE':
                travel_tips = [
                    "Language: German, good English proficiency",
                    "Currency: Euro €",
                    "Payment: Some smaller places cash only",
                    "Recycling is taken seriously, sort your waste"
                ]
            elif country_code == 'US':
                travel_tips = [
                    "Language: English throughout",
                    "Currency: US Dollar $",
                    "Payment: Cards accepted virtually everywhere",
                    "Tipping 15-20% is expected in restaurants"
                ]
            elif country_code == 'GB':
                travel_tips = [
                    "Language: English throughout",
                    "Currency: British Pound £",
                    "Payment: Contactless widely available",
                    "Look right first when crossing roads"
                ]
            else:
                # Default travel tips
                travel_tips = [
                    "Research local language basics",
                    "Check currency exchange rates before arrival",
                    "Verify card acceptance at destination",
                    "Respect local customs and traditions"
                ]
        
        # Add the formatted tips to our tips_and_info array
        if climate_info:
            tips_and_info.append({
                'title': 'Climate',
                'content': '. '.join(climate_info)
            })
            
        if transport_info:
            tips_and_info.append({
                'title': 'Transport',
                'content': '. '.join(transport_info)
            })
            
        if travel_tips:
            tips_and_info.append({
                'title': 'Travel Tips',
                'content': '. '.join(travel_tips)
            })

        # Add India-specific and Tamil Nadu-specific information
        
        # Special handling for Tamil Nadu cities
        tamil_nadu_cities = {
            'chennai': {
                'climate': [
                    "Tropical wet and dry climate (Köppen: Aw)",
                    "Hottest months: May-June with temperatures up to 40°C",
                    "Northeast monsoon from October to December",
                    "Annual rainfall around 1400mm"
                ],
                'transport': [
                    "Metropolitan Transport Corporation (MTC) bus services",
                    "Chennai Metro Rail and Chennai Suburban Railway",
                    "Auto rickshaws available throughout the city",
                    "App-based taxi services widely available"
                ],
                'travel_tips': [
                    "Language: Tamil primarily, English in tourist areas",
                    "Visit Marina Beach, the second longest urban beach in the world",
                    "Try filter coffee, idli, dosa and other local cuisine",
                    "Best time to visit: November to February"
                ]
            },
            'coimbatore': {
                'climate': [
                    "Pleasant climate throughout the year (Köppen: Aw)",
                    "Temperature range: 20°C to 35°C",
                    "Southwest monsoon from June to August",
                    "Surrounded by Western Ghats with cooler temperatures"
                ],
                'transport': [
                    "City buses operated by Tamil Nadu State Transport Corporation",
                    "Auto rickshaws are common mode of transport",
                    "App-based taxi services available",
                    "Town buses connect to nearby areas"
                ],
                'travel_tips': [
                    "Language: Tamil primarily, English understood in many places",
                    "Visit Marudamalai Temple and Dhyanalinga Temple",
                    "Try Coimbatore's famous vegetarian cuisine",
                    "Known as 'Manchester of South India' for textile industry"
                ]
            },
            'madurai': {
                'climate': [
                    "Tropical savanna climate (Köppen: Aw)",
                    "Hot summers with temperatures reaching 40°C",
                    "Northeast monsoon from October to December",
                    "Best visited from October to March"
                ],
                'transport': [
                    "City buses operated by Tamil Nadu State Transport Corporation",
                    "Auto rickshaws available throughout the city",
                    "Taxi services can be hired for day trips",
                    "Madurai Junction railway station connects to major cities"
                ],
                'travel_tips': [
                    "Language: Tamil is predominant",
                    "Famous for Meenakshi Amman Temple, a must-visit",
                    "Try authentic Chettinad cuisine",
                    "Known as 'Temple City' and cultural capital of Tamil Nadu"
                ]
            },
            'tiruchirappalli': {
                'climate': [
                    "Tropical climate (Köppen: Aw)",
                    "Summers are hot and dry",
                    "Northeast monsoon from October to December",
                    "Winters are mild and pleasant"
                ],
                'transport': [
                    "City buses connect major parts of the city",
                    "Auto rickshaws available for short distances",
                    "Tiruchirappalli Junction is a major railway hub",
                    "Tiruchirappalli International Airport connects to major cities"
                ],
                'travel_tips': [
                    "Language: Tamil primarily spoken",
                    "Visit Rock Fort Temple and Sri Ranganathaswamy Temple",
                    "Try local specialties like Mutton Biryani",
                    "Also known as Trichy, rich in history and culture"
                ]
            },
            'salem': {
                'climate': [
                    "Tropical savanna climate (Köppen: Aw)",
                    "Temperature ranges from 20°C to 37°C",
                    "Moderate rainfall during monsoon",
                    "Surrounded by hills with pleasant weather"
                ],
                'transport': [
                    "City buses operated by Tamil Nadu State Transport Corporation",
                    "Auto rickshaws for local transportation",
                    "Salem Junction railway station connects to major cities",
                    "Nearest airport is Salem Airport with limited flights"
                ],
                'travel_tips': [
                    "Language: Tamil predominantly spoken",
                    "Visit Yercaud hill station nearby",
                    "Known for traditional Tamil Nadu sweets and savories",
                    "Famous for steel, textiles, and mango cultivation"
                ]
            },
            'tirunelveli': {
                'climate': [
                    "Tropical climate with hot and humid conditions",
                    "Summer temperatures can reach 40°C",
                    "Northeast monsoon brings most rainfall",
                    "Winter season is mild and pleasant"
                ],
                'transport': [
                    "City buses connect most parts of the city",
                    "Auto rickshaws available for local travel",
                    "Tirunelveli Junction railway station is well-connected",
                    "Nearest airport is in Tuticorin (40 km away)"
                ],
                'travel_tips': [
                    "Language: Tamil is the main language",
                    "Famous for 'Halwa' sweet and unique cuisine",
                    "Visit the Nellaiappar Temple and Krishnapuram Palace",
                    "Rich in culture and traditional arts"
                ]
            }
        }
        
        # Special handling for other major Indian cities
        indian_cities = {
            'mumbai': {
                'climate': [
                    "Tropical wet and dry climate (Köppen: Aw)",
                    "Humid and hot during summer",
                    "Heavy rainfall during southwest monsoon (June-September)",
                    "Mild winters with moderate temperatures"
                ],
                'transport': [
                    "Extensive local train network (Mumbai Suburban Railway)",
                    "BEST buses cover the entire city",
                    "Auto rickshaws in suburbs, taxis throughout",
                    "Metro rail service in select routes"
                ],
                'travel_tips': [
                    "Language: Marathi and Hindi, English widely spoken",
                    "Visit Gateway of India and Marine Drive",
                    "Try street food like Vada Pav and Pav Bhaji",
                    "Home to Bollywood, India's largest film industry"
                ]
            },
            'delhi': {
                'climate': [
                    "Humid subtropical climate (Köppen: Cwa)",
                    "Extreme temperature variations between summer and winter",
                    "Summer temperatures can exceed 45°C",
                    "Winter can be cold with temperatures dropping to 2-3°C"
                ],
                'transport': [
                    "Delhi Metro covers most parts of the city",
                    "DTC buses and cluster buses throughout",
                    "Auto rickshaws and cycle rickshaws for short distances",
                    "App-based taxi services widely available"
                ],
                'travel_tips': [
                    "Language: Hindi predominantly, English in official places",
                    "Visit Red Fort, Qutub Minar, and India Gate",
                    "Try North Indian cuisine and street food",
                    "National capital with rich Mughal and colonial history"
                ]
            },
            'kolkata': {
                'climate': [
                    "Tropical wet-and-dry climate (Köppen: Aw)",
                    "Hot and humid summers",
                    "Monsoon brings heavy rainfall (June-September)",
                    "Mild and dry winters"
                ],
                'transport': [
                    "Kolkata Metro - India's first underground railway",
                    "Iconic trams - oldest operating in Asia",
                    "Yellow taxis and auto rickshaws",
                    "Ferry services on River Hooghly"
                ],
                'travel_tips': [
                    "Language: Bengali predominantly, English widely understood",
                    "Visit Victoria Memorial and Howrah Bridge",
                    "Try Bengali sweets like Rasgulla and Sandesh",
                    "Cultural capital of India with rich literary heritage"
                ]
            },
            'bangalore': {
                'climate': [
                    "Tropical savanna climate with mild temperatures (Köppen: Aw)",
                    "Known as 'Air-conditioned city' due to pleasant weather",
                    "Temperature rarely exceeds 35°C or drops below 14°C",
                    "Rainfall distributed throughout the year"
                ],
                'transport': [
                    "Bangalore Metropolitan Transport Corporation (BMTC) buses",
                    "Namma Metro connects key areas",
                    "Auto rickshaws available throughout",
                    "App-based taxi services widely used"
                ],
                'travel_tips': [
                    "Language: Kannada officially, English widely spoken",
                    "Visit Lalbagh Botanical Garden and Bangalore Palace",
                    "Try South Indian food with local Karnataka specialties",
                    "Known as 'Silicon Valley of India' for IT industry"
                ]
            },
            'hyderabad': {
                'climate': [
                    "Tropical wet and dry climate (Köppen: Aw)",
                    "Hot summers from March to June",
                    "Monsoon from June to September",
                    "Pleasant winters from November to February"
                ],
                'transport': [
                    "Hyderabad Metro Rail for key routes",
                    "TSRTC buses cover most areas",
                    "Auto rickshaws available throughout",
                    "App-based taxi services widely used"
                ],
                'travel_tips': [
                    "Language: Telugu and Urdu, English in business areas",
                    "Visit Charminar and Golconda Fort",
                    "Try Hyderabadi Biryani and Haleem",
                    "Known for Nizami culture and pearl trade"
                ]
            },
            'ahmedabad': {
                'climate': [
                    "Hot semi-arid climate (Köppen: BSh)",
                    "Extremely hot summers with temperatures up to 45°C",
                    "Brief mild winters",
                    "Moderate rainfall during monsoon"
                ],
                'transport': [
                    "Ahmedabad Bus Rapid Transit System (BRTS)",
                    "Ahmedabad Municipal Transport Service (AMTS) buses",
                    "Auto rickshaws for short distances",
                    "Ahmedabad Metro in select areas"
                ],
                'travel_tips': [
                    "Language: Gujarati predominantly, Hindi understood",
                    "Visit Sabarmati Ashram and Adalaj Stepwell",
                    "Try Gujarati Thali and street food",
                    "Known for textiles and being Gujarat's commercial capital"
                ]
            }
        }

        # Check if we have special city data for this city
        city_name_lower = city_name.lower()
        if city_name_lower in tamil_nadu_cities:
            print(f"Using special Tamil Nadu city data for {city_name}")
            climate_info = tamil_nadu_cities[city_name_lower]['climate']
            transport_info = tamil_nadu_cities[city_name_lower]['transport']
            travel_tips = tamil_nadu_cities[city_name_lower]['travel_tips']
        elif city_name_lower in indian_cities:
            print(f"Using special Indian city data for {city_name}")
            climate_info = indian_cities[city_name_lower]['climate']
            transport_info = indian_cities[city_name_lower]['transport']
            travel_tips = indian_cities[city_name_lower]['travel_tips']
        elif wiki_page_id:
            print(f"Using Wikipedia data for {city_name}")
        else:
            # Use the default data based on location as already implemented
            print(f"Using default data for {city_name}")

        # Construct response
        response_data = {
            'name': city_name,
            'description': wiki_extract,
            'population': city.get('population', 'N/A'),
            'timezone': city.get('timezone', {}).get('name', 'N/A'),
            'weather': {
                'temperature': weather_data['current']['temp_c'],
                'condition': weather_data['current']['condition']['text'],
                'humidity': weather_data['current']['humidity'],
                'wind_speed': weather_data['current']['wind_kph'],
                'icon': weather_data['current']['condition']['icon']
            },
            'famous_places': famous_places,
            'city_images': city_images,
            'coordinates': {
                'latitude': lat,
                'longitude': lon
            },
            'tips_and_info': tips_and_info,
            'news': city_news  # Add news data to response
        }
        
        print(f"Response prepared for {city_name} with {len(famous_places)} places and {len(city_images)} images")
        
        # Log sample of the first place if available
        if famous_places:
            print(f"Sample place: {famous_places[0]['name']}")
            if famous_places[0]['image_url']:
                print(f"Has image: Yes")
            else:
                print(f"Has image: No")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_city_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/search_traffic', methods=['POST'])
def search_traffic():
    data = request.json
    area = data.get('area')
    mode = data.get('mode', 'traffic')
    
    if not area:
        return jsonify({'error': 'Area parameter is required'}), 400

    if not GEOAPIFY_PLACES_API_KEY:
        print("Geoapify Places API key is missing")
        return jsonify({'error': 'Geoapify Places API key is not configured. Please check your .env file.'}), 500
    
    try:
        # Geoapify Geocoding API endpoint
        geocoding_url = 'https://api.geoapify.com/v1/geocode/search'
        params = {
            'apiKey': GEOAPIFY_PLACES_API_KEY,
            'text': area,
            'limit': 1
        }
        
        print(f"Searching for location: {area}")
        
        # Add proper headers
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrafficApp/1.0'
        }
        
        response = requests.get(geocoding_url, params=params, headers=headers)
        
        print(f"Response status code: {response.status_code}")
        
        if response.status_code == 403:
            error_msg = "API key error: The Geoapify Places API key is invalid or has expired. Please update your API key."
            print(f"Geoapify Places API error: {error_msg}")
            return jsonify({'error': error_msg}), 403
        elif response.status_code != 200:
            error_msg = f"Failed to fetch location data: {response.status_code}"
            print(f"Geoapify Places API error: {error_msg}")
            return jsonify({'error': error_msg}), response.status_code

        try:
            data = response.json()
        except ValueError as e:
            print(f"Error parsing JSON response: {str(e)}")
            return jsonify({'error': 'Invalid response from Geoapify Places API'}), 500

        if not data.get('features'):
            print(f"No results found for location: {area}")
            return jsonify({'error': 'Location not found'}), 404

        # Extract location data
        feature = data['features'][0]
        location = feature['geometry']['coordinates']
        properties = feature['properties']
        
        # Get traffic data from Geoapify Places API
        places_url = 'https://api.geoapify.com/v2/places'
        places_params = {
            'apiKey': GEOAPIFY_PLACES_API_KEY,
            'categories': 'traffic',
            'filter': f'circle:{location[1]},{location[0]},1000'
        }
        
        places_response = requests.get(places_url, params=places_params, headers=headers)
        
        if places_response.status_code == 200:
            places_data = places_response.json()
            
            # Calculate traffic congestion based on number of traffic points
            traffic_points = len(places_data.get('features', []))
            congestion = min(100, traffic_points * 20)  # Each traffic point adds 20% congestion, max 100%
            
            return jsonify({
                'area': properties.get('formatted', area),
                'lat': location[1],
                'lon': location[0],
                'speed': 40,  # Default speed
                'freeFlow': 60,  # Default free flow speed
                'congestion': congestion
            })
        else:
            # Fallback to mock data if traffic API fails
            print(f"Traffic API error: {places_response.status_code}")
            return jsonify({
                'area': properties.get('formatted', area),
                'lat': location[1],
                'lon': location[0],
                'speed': 40,
                'freeFlow': 60,
                'congestion': 50  # Default moderate congestion
            })
            
    except Exception as e:
        print(f"Error in search_traffic: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/weather-test', methods=['GET'])
def test_weather():
    try:
        # Test coordinates for London
        lat = "51.5074"
        lon = "-0.1278"
        
        if not WEATHER_API_KEY:
            return jsonify({
                'error': 'Weather API key is not configured',
                'key_length': len(WEATHER_API_KEY) if WEATHER_API_KEY else 0,
                'key_preview': WEATHER_API_KEY[:5] if WEATHER_API_KEY else None
            }), 500
        
        weather_url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
        print(f"Testing weather API with URL: {weather_url}")
        
        weather_response = requests.get(weather_url)
        print(f"Weather API test response status: {weather_response.status_code}")
        
        if weather_response.status_code != 200:
            return jsonify({
                'error': 'Weather API test failed',
                'status_code': weather_response.status_code,
                'response_text': weather_response.text
            }), weather_response.status_code
            
        weather_data = weather_response.json()
        return jsonify({
            'status': 'success',
            'data': weather_data,
            'api_key_length': len(WEATHER_API_KEY)
        })
        
    except Exception as e:
        print(f"Error testing weather API: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    if not city:
        return jsonify({'error': 'City parameter is required'}), 400

    try:
        # Clean up city name - remove country if present
        city_name = city.split(',')[0].strip()
        print(f"Processing weather request for city: {city_name}")
        
        # Get city coordinates using Geoapify Geocoding
        geocoding_url = f"https://api.geoapify.com/v1/geocode/search?text={city_name}&apiKey={GEOAPIFY_PLACES_API_KEY}"
        print(f"Geocoding URL: {geocoding_url}")
        
        geocoding_response = requests.get(geocoding_url)
        print(f"Geocoding response status: {geocoding_response.status_code}")
        
        if geocoding_response.status_code != 200:
            print(f"Geocoding API error: {geocoding_response.text}")
            return jsonify({'error': 'Failed to get city coordinates'}), geocoding_response.status_code
            
        geocoding_data = geocoding_response.json()
        
        if not geocoding_data.get('features'):
            print(f"No coordinates found for {city_name}")
            return jsonify({'error': 'City not found'}), 404
            
        city_data = geocoding_data['features'][0]['properties']
        lat = city_data['lat']
        lon = city_data['lon']
        print(f"Found coordinates for {city_name}: lat={lat}, lon={lon}")
        
        # Get current weather and forecast data
        weather_url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}&q={lat},{lon}&days=5&aqi=no"
        print(f"Weather API URL: {weather_url}")
        
        weather_response = requests.get(weather_url)
        print(f"Weather API response status: {weather_response.status_code}")
        
        if weather_response.status_code == 401:
            print("Invalid Weather API key")
            return jsonify({'error': 'Invalid Weather API key'}), 401
        elif weather_response.status_code != 200:
            print(f"Weather API error: {weather_response.text}")
            return jsonify({'error': f'Weather API error: {weather_response.status_code}'}), weather_response.status_code
            
        weather_data = weather_response.json()
        
        if 'current' not in weather_data or 'forecast' not in weather_data:
            print("Invalid weather data format received")
            return jsonify({'error': 'Invalid weather data format'}), 500
            
        # Process forecast data
        forecast = []
        for day in weather_data['forecast']['forecastday']:
            forecast.append({
                'date': day['date'],
                'max_temp': day['day']['maxtemp_c'],
                'min_temp': day['day']['mintemp_c'],
                'condition': day['day']['condition']['text'],
                'icon': day['day']['condition']['icon'],
                'humidity': day['day']['avghumidity'],
                'chance_of_rain': day['day']['daily_chance_of_rain'],
                'wind_speed': day['day']['maxwind_kph']
            })
            
        response_data = {
            'city': city_name,
            'current': {
                'temperature': weather_data['current']['temp_c'],
                'condition': weather_data['current']['condition']['text'],
                'humidity': weather_data['current']['humidity'],
                'wind_speed': weather_data['current']['wind_kph'],
                'icon': weather_data['current']['condition']['icon']
            },
            'forecast': forecast
        }
        
        print(f"Successfully processed weather data for {city_name}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_weather: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/air-quality', methods=['GET'])
def get_air_quality():
    city = request.args.get('city')
    if not city:
        return jsonify({'error': 'City parameter is required'}), 400

    try:
        # First, get the city's coordinates and details using Geoapify
        geocoding_url = f"https://api.geoapify.com/v1/geocode/search?text={city}&apiKey={GEOAPIFY_PLACES_API_KEY}"
        geocoding_response = requests.get(geocoding_url)
        
        if not geocoding_response.ok:
            return jsonify({'error': 'Failed to get city coordinates'}), geocoding_response.status_code

        geocoding_data = geocoding_response.json()
        if not geocoding_data.get('features'):
            return jsonify({'error': 'City not found'}), 404

        city_data = geocoding_data['features'][0]['properties']
        state = city_data.get('state', '')
        country = city_data.get('country', '')
        lat = city_data['lat']
        lon = city_data['lon']

        # For Indian cities, try CPCB API first
        if country.lower() == 'india':
            try:
                # CPCB API endpoint for city data
                cpcb_url = f"https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&filters[city]={city}&limit=1"
                print(f"Trying CPCB API: {cpcb_url}")
                
                cpcb_response = requests.get(cpcb_url)
                print(f"CPCB Response status: {cpcb_response.status_code}")
                
                if cpcb_response.ok:
                    cpcb_data = cpcb_response.json()
                    if cpcb_data.get('records') and len(cpcb_data['records']) > 0:
                        record = cpcb_data['records'][0]
                        measurements = []
                        
                        # Add PM2.5 if available
                        if 'pm2_5' in record:
                            pm25 = float(record['pm2_5'])
                            measurements.append({
                                'parameter': 'pm25',
                                'value': pm25,
                                'unit': 'µg/m³',
                                'status': get_aqi_status(pm25)
                            })
                        
                        # Add PM10 if available
                        if 'pm10' in record:
                            pm10 = float(record['pm10'])
                            measurements.append({
                                'parameter': 'pm10',
                                'value': pm10,
                                'unit': 'µg/m³',
                                'status': get_aqi_status(pm10)
                            })
                        
                        # Add other pollutants if available
                        for param in ['no2', 'so2', 'o3', 'co']:
                            if param in record:
                                value = float(record[param])
                                measurements.append({
                                    'parameter': param,
                                    'value': value,
                                    'unit': 'µg/m³',
                                    'status': get_aqi_status(value)
                                })
                        
                        if measurements:
                            response_data = {
                                'current': {
                                    'measurements': measurements,
                                    'lastUpdated': record.get('last_update', datetime.now().isoformat()),
                                    'weather': {
                                        'temperature': None,
                                        'humidity': None,
                                        'wind_speed': None,
                                        'wind_direction': None
                                    }
                                },
                                'meta': {
                                    'city': city,
                                    'state': state,
                                    'country': country,
                                    'source': 'CPCB',
                                    'coordinates': {
                                        'latitude': lat,
                                        'longitude': lon
                                    },
                                    'station': record.get('station', 'Unknown Station')
                                }
                            }
                            return jsonify(response_data)
            except Exception as e:
                print(f"Error with CPCB API: {str(e)}")

        # If CPCB fails or for non-Indian cities, try WAQI API
        waqi_token = "3569d42725e7f841353989cc3f9dc746badadbf5"
        
        # Prepare search terms based on the city's location
        search_terms = []
        
        if country.lower() == 'india':
            clean_state = state.replace(' State', '')
            search_terms.extend([
                city,
                f"{city} city",
                f"{city} urban",
                f"{city}, {clean_state}",
                f"{city} {clean_state}",
                f"{city}, India",
                f"{city} India"
            ])
        else:
            search_terms.extend([
                city,
                f"{city} city",
                f"{city}, {country}",
                f"{city} {country}"
            ])
        
        search_terms = list(set(filter(None, search_terms)))
        print(f"Trying WAQI search terms: {search_terms}")
        
        # Try each search term with WAQI
        for search_term in search_terms:
            try:
                search_url = f"https://api.waqi.info/search/?token={waqi_token}&keyword={search_term}"
                print(f"Searching WAQI stations with term: {search_term}")
                
                search_response = requests.get(search_url)
                print(f"WAQI Search Response status: {search_response.status_code}")
                
                if search_response.ok:
                    search_data = search_response.json()
                    if search_data.get('status') == 'ok' and search_data.get('data'):
                        for station in search_data['data']:
                            station_uid = station.get('uid')
                            if station_uid:
                                station_url = f"https://api.waqi.info/feed/@{station_uid}/?token={waqi_token}"
                                print(f"Fetching station data: {station_url}")
                                
                                station_response = requests.get(station_url)
                                if station_response.ok:
                                    station_data = station_response.json()
                                    if station_data.get('status') == 'ok':
                                        aqi_data = station_data['data']
                                        measurements = []
                                        
                                        if 'aqi' in aqi_data:
                                            aqi = aqi_data['aqi']
                                            measurements.append({
                                                'parameter': 'aqi',
                                                'value': aqi,
                                                'unit': 'AQI',
                                                'status': get_aqi_status(aqi)
                                            })
                                        
                                        if 'pm25' in aqi_data['iaqi']:
                                            pm25 = aqi_data['iaqi']['pm25']['v']
                                            measurements.append({
                                                'parameter': 'pm25',
                                                'value': pm25,
                                                'unit': 'µg/m³',
                                                'status': get_aqi_status(pm25)
                                            })
                                        
                                        if 'pm10' in aqi_data['iaqi']:
                                            pm10 = aqi_data['iaqi']['pm10']['v']
                                            measurements.append({
                                                'parameter': 'pm10',
                                                'value': pm10,
                                                'unit': 'µg/m³',
                                                'status': get_aqi_status(pm10)
                                            })
                                        
                                        for param in ['o3', 'no2', 'so2', 'co']:
                                            if param in aqi_data['iaqi']:
                                                value = aqi_data['iaqi'][param]['v']
                                                measurements.append({
                                                    'parameter': param,
                                                    'value': value,
                                                    'unit': 'µg/m³',
                                                    'status': get_aqi_status(value)
                                                })
                                        
                                        if measurements:
                                            response_data = {
                                                'current': {
                                                    'measurements': measurements,
                                                    'lastUpdated': datetime.now().isoformat(),
                                                    'weather': {
                                                        'temperature': aqi_data.get('iaqi', {}).get('t', {}).get('v'),
                                                        'humidity': aqi_data.get('iaqi', {}).get('h', {}).get('v'),
                                                        'wind_speed': aqi_data.get('iaqi', {}).get('w', {}).get('v'),
                                                        'wind_direction': aqi_data.get('iaqi', {}).get('wd', {}).get('v')
                                                    }
                                                },
                                                'meta': {
                                                    'city': city,
                                                    'state': state,
                                                    'country': country,
                                                    'source': 'WAQI',
                                                    'coordinates': {
                                                        'latitude': lat,
                                                        'longitude': lon
                                                    },
                                                    'station': aqi_data.get('attributions', [{}])[0].get('name', 'Unknown Station')
                                                }
                                            }
                                            return jsonify(response_data)
            except Exception as e:
                print(f"Error with WAQI search term {search_term}: {str(e)}")

        # If all APIs fail, return mock data with a warning
        print("All APIs failed, returning mock data")
        mock_data = {
            'current': {
                'measurements': [
                    {
                        'parameter': 'pm25',
                        'value': 45,
                        'unit': 'µg/m³',
                        'status': 'Moderate'
                    },
                    {
                        'parameter': 'pm10',
                        'value': 60,
                        'unit': 'µg/m³',
                        'status': 'Moderate'
                    }
                ],
                'lastUpdated': datetime.now().isoformat(),
                'weather': {
                    'temperature': 25,
                    'humidity': 65,
                    'wind_speed': 5,
                    'wind_direction': 180
                }
            },
            'meta': {
                'city': city,
                'state': state,
                'country': country,
                'source': 'Mock Data',
                'coordinates': {
                    'latitude': lat,
                    'longitude': lon
                },
                'warning': 'Real-time data unavailable. Showing mock data.'
            }
        }
        return jsonify(mock_data)
        
    except requests.exceptions.RequestException as e:
        print(f"Network error in get_air_quality: {str(e)}")
        return jsonify({'error': 'Network error while fetching air quality data'}), 500
    except Exception as e:
        print(f"Error in get_air_quality: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_aqi_status(aqi_value):
    if aqi_value <= 50:
        return 'Good'
    elif aqi_value <= 100:
        return 'Moderate'
    elif aqi_value <= 150:
        return 'Unhealthy for Sensitive Groups'
    elif aqi_value <= 200:
        return 'Unhealthy'
    elif aqi_value <= 300:
        return 'Very Unhealthy'
    else:
        return 'Hazardous'

@app.route('/api/weather-insights', methods=['GET'])
def get_weather_insights():
    city = request.args.get('city')
    if not city:
        return jsonify({'error': 'City parameter is required'}), 400

    try:
        # First, get the city's coordinates and details using Geoapify
        geocoding_url = f"https://api.geoapify.com/v1/geocode/search?text={city}&apiKey={GEOAPIFY_PLACES_API_KEY}"
        geocoding_response = requests.get(geocoding_url)
        
        if not geocoding_response.ok:
            return jsonify({'error': 'Failed to get city coordinates'}), geocoding_response.status_code

        geocoding_data = geocoding_response.json()
        if not geocoding_data.get('features'):
            return jsonify({'error': 'City not found'}), 404

        city_data = geocoding_data['features'][0]['properties']
        state = city_data.get('state', '')
        country = city_data.get('country', '')
        lat = city_data['lat']
        lon = city_data['lon']

        # Get weather data from OpenWeather API
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"

        # Fetch current weather
        weather_response = requests.get(weather_url)
        if not weather_response.ok:
            return jsonify({'error': 'Failed to fetch current weather data'}), weather_response.status_code

        weather_data = weather_response.json()
        
        # Fetch 5-day forecast
        forecast_response = requests.get(forecast_url)
        if not forecast_response.ok:
            return jsonify({'error': 'Failed to fetch forecast data'}), forecast_response.status_code

        forecast_data = forecast_response.json()
        
        # Process current weather
        current_weather = {
            'temperature': weather_data['main']['temp'],
            'feels_like': weather_data['main']['feels_like'],
            'humidity': weather_data['main']['humidity'],
            'pressure': weather_data['main']['pressure'],
            'wind_speed': weather_data['wind']['speed'],
            'wind_direction': weather_data['wind'].get('deg', 0),
            'description': weather_data['weather'][0]['description'],
            'icon': weather_data['weather'][0]['icon']
        }

        # Process forecast data
        daily_forecast = []
        daily_data = {}
        
        for item in forecast_data['list']:
            date = item['dt_txt'].split()[0]
            if date not in daily_data:
                daily_data[date] = {
                    'temp_min': item['main']['temp_min'],
                    'temp_max': item['main']['temp_max'],
                    'humidity': item['main']['humidity'],
                    'description': item['weather'][0]['description'],
                    'icon': item['weather'][0]['icon']
                }
            else:
                daily_data[date]['temp_min'] = min(daily_data[date]['temp_min'], item['main']['temp_min'])
                daily_data[date]['temp_max'] = max(daily_data[date]['temp_max'], item['main']['temp_max'])

        for date, data in daily_data.items():
            daily_forecast.append({
                'date': date,
                'temp_min': data['temp_min'],
                'temp_max': data['temp_max'],
                'humidity': data['humidity'],
                'description': data['description'],
                'icon': data['icon']
            })

        response_data = {
            'current': current_weather,
            'forecast': daily_forecast[:5],  # Next 5 days
            'meta': {
                'city': city,
                'state': state,
                'country': country,
                'coordinates': {
                    'latitude': lat,
                    'longitude': lon
                },
                'source': 'OpenWeatherMap',
                'last_updated': datetime.now().isoformat()
            }
        }

        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        print(f"Network error in get_weather_insights: {str(e)}")
        return jsonify({'error': 'Network error while fetching weather data'}), 500
    except Exception as e:
        print(f"Error in get_weather_insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/nearby-places', methods=['GET'])
def get_nearby_places():
    """Get nearby places using Geoapify Places API"""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        category = request.args.get('category')
        radius = request.args.get('radius', '5000')
        limit = request.args.get('limit', '9')
        
        print(f"nearby-places request: lat={lat}, lon={lon}, category={category}, radius={radius}, limit={limit}")
        
        if not lat or not lon or not category:
            error_msg = f'Missing required parameters: lat={lat}, lon={lon}, category={category}'
            print(f"Error: {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        # Validate that lat and lon are valid numbers
        try:
            lat_float = float(lat)
            lon_float = float(lon)
            radius_int = int(radius)
            limit_int = int(limit)
        except ValueError as e:
            error_msg = f'Invalid parameter types: {str(e)}'
            print(f"Error: {error_msg}")
            return jsonify({'error': error_msg}), 400
        
        # Mapping of Foursquare-like categories to Geoapify categories
        category_mapping = {
            '13000': 'catering.restaurant',  # Restaurants
            '13035': 'catering.cafe',  # Cafes
            '16000': 'tourism.attraction,tourism.sights',  # Tourist Spots
            '16032': 'leisure.park',  # Parks
            '19014': 'accommodation.hotel',  # Hotels
            '15014': 'healthcare',  # Hospitals
            '17000': 'commercial.shopping_mall,commercial.supermarket',  # Shopping
            '17069': 'commercial.market',  # Markets
            '10000': 'entertainment',  # Entertainment
            '12000': 'religion.place',  # Religious Places
            '19042': 'public_transport.bus_stop',  # Bus
            '19043': 'public_transport.train_stop',  # Train
            '19044': 'public_transport.subway_entrance',  # Subway
        }
        
        # Get the Geoapify categories for this search
        geoapify_categories = category_mapping.get(category, 'tourism.attraction')
        
        # Build the Geoapify Places API URL with validated numeric values
        # Geoapify uses 'bias' parameter for proximity-based search instead of 'filter'
        places_url = f"https://api.geoapify.com/v2/places?categories={geoapify_categories}&bias=proximity:{lon_float},{lat_float}&limit={limit_int}&apiKey={GEOAPIFY_PLACES_API_KEY}"
        
        print(f"Calling Geoapify Places API with URL: {places_url}")
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'CityExplorer/1.0'
        }
        
        places_response = requests.get(places_url, headers=headers)
        
        print(f"Geoapify Places API response status: {places_response.status_code}")
        
        if places_response.status_code != 200:
            error_detail = places_response.text if places_response.text else 'No error detail'
            print(f"Geoapify Places API error: {places_response.status_code} - {error_detail}")
            return jsonify({'error': f'Failed to fetch nearby places: {places_response.status_code} - {error_detail}'}), places_response.status_code
        
        try:
            places_data = places_response.json()
        except Exception as e:
            print(f"Error parsing Geoapify response: {str(e)}")
            print(f"Response text: {places_response.text}")
            return jsonify({'error': f'Invalid response from Geoapify API: {str(e)}'}), 500
        
        if not places_data.get('features'):
            return jsonify({'results': []})
        
        # Transform Geoapify response to match Foursquare-like format
        results = []
        for place in places_data['features']:
            props = place.get('properties', {})
            geometry = place.get('geometry', {})
            coordinates = geometry.get('coordinates', [])
            
            result = {
                'fsq_id': props.get('place_id', ''),
                'name': props.get('name', 'Unknown'),
                'location': {
                    'address': props.get('street', ''),
                    'locality': props.get('city', ''),
                    'region': props.get('state', ''),
                    'country': props.get('country', ''),
                },
                'geocodes': {
                    'main': {
                        'latitude': coordinates[1] if len(coordinates) > 1 else None,
                        'longitude': coordinates[0] if len(coordinates) > 0 else None,
                    }
                },
                'categories': [{'name': props.get('categories', ['Unknown'])[0]} if props.get('categories') else [{'name': 'Place'}]],
                'rating': props.get('rate', 0),
                'photos': [],
                'description': props.get('description', ''),
                'tel': props.get('phone', ''),
                'website': props.get('website', ''),
                'hours': {'display': 'Not available'},
                'distance': 0
            }
            results.append(result)
        
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"Error in get_nearby_places: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').lower()
        
        # Initialize response
        response = "I'm sorry, I couldn't understand your question. Please try asking about weather, traffic, or cities in India."
        
        # Weather related questions
        if any(word in user_message for word in ['weather', 'temperature', 'rain', 'sunny', 'climate']):
            response = "I can help you with weather information. Please specify a city name to get current weather conditions."
        
        # Traffic related questions
        elif any(word in user_message for word in ['traffic', 'road', 'jam', 'congestion']):
            response = "I can provide traffic information. Please specify a city or route to get traffic conditions."
        
        # City information
        elif any(word in user_message for word in ['city', 'cities', 'place', 'places', 'location']):
            response = "I can help you explore cities in India. Please specify which city you'd like to know more about."
        
        # Air quality
        elif any(word in user_message for word in ['air', 'pollution', 'aqi', 'quality']):
            response = "I can provide air quality information. Please specify a city to get the current AQI and air quality details."
        
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_congestion_level(current_speed, free_flow_speed):
    if not current_speed or not free_flow_speed:
        return 'unknown'
    
    ratio = current_speed / free_flow_speed
    if ratio < 0.2:
        return 'severe'
    elif ratio < 0.4:
        return 'heavy'
    elif ratio < 0.6:
        return 'moderate'
    elif ratio < 0.8:
        return 'light'
    else:
        return 'free_flow'

@app.route('/api/traffic', methods=['GET'])
def get_traffic():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    try:
        # Fetch traffic incidents
        incidents_url = f'https://api.tomtom.com/traffic/services/4/incidentDetails?key={TOMTOM_API_KEY}&bbox={float(lon)-0.1},{float(lat)-0.1},{float(lon)+0.1},{float(lat)+0.1}&fields={{incidents{{type,geometry{{coordinates}},properties{{iconCategory,from,to,startTime,endTime,description,severity}}}}}}'
        incidents_response = requests.get(incidents_url)
        incidents_data = incidents_response.json()
        
        # Fetch traffic flow
        flow_url = f'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key={TOMTOM_API_KEY}&point={lat},{lon}'
        flow_response = requests.get(flow_url)
        flow_data = flow_response.json()
        
        # Process incidents
        processed_incidents = []
        if 'incidents' in incidents_data:
            for incident in incidents_data['incidents']:
                processed_incidents.append({
                    'lat': incident['geometry']['coordinates'][1],
                    'lon': incident['geometry']['coordinates'][0],
                    'type': incident['properties']['iconCategory'],
                    'severity': incident['properties']['severity'],
                    'description': incident['properties']['description'],
                    'startTime': incident['properties']['startTime'],
                    'endTime': incident['properties'].get('endTime'),
                    'impact': get_impact_level(incident['properties']['severity'])
                })
        
        # Process flow data
        processed_flow = []
        if 'flowSegmentData' in flow_data:
            flow = flow_data['flowSegmentData']
            congestion_level = get_congestion_level(flow['currentSpeed'], flow['freeFlowSpeed'])
            processed_flow.append({
                'lat': float(lat),
                'lon': float(lon),
                'speed': flow['currentSpeed'],
                'freeFlowSpeed': flow['freeFlowSpeed'],
                'congestion': congestion_level,
                'confidence': flow['confidence'],
                'delay': calculate_delay(flow['currentSpeed'], flow['freeFlowSpeed']),
                'color': get_congestion_color(congestion_level)
            })
        
        return jsonify({
            'incidents': processed_incidents,
            'flow': processed_flow,
            'summary': {
                'congestion_level': processed_flow[0]['congestion'] if processed_flow else 'unknown',
                'total_incidents': len(processed_incidents),
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_impact_level(severity):
    severity_map = {
        'low': 'minor',
        'medium': 'moderate',
        'high': 'major',
        'veryHigh': 'severe'
    }
    return severity_map.get(severity.lower(), 'unknown')

def calculate_delay(current_speed, free_flow_speed):
    if not current_speed or not free_flow_speed:
        return 0
    # Calculate delay in minutes per 10km
    delay = ((1/current_speed) - (1/free_flow_speed)) * 600
    return max(0, round(delay, 1))

def get_congestion_color(congestion_level):
    color_map = {
        'free_flow': '#00ff00',  # Green
        'light': '#ffff00',      # Yellow
        'moderate': '#ffa500',   # Orange
        'heavy': '#ff0000',      # Red
        'severe': '#800000',     # Dark Red
        'unknown': '#808080'     # Gray
    }
    return color_map.get(congestion_level, '#808080')

if __name__ == '__main__':
    app.run(debug=True) 