import { createClient } from '@supabase/supabase-js'
import opencage from 'opencage-api-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
const opencageApiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// A cache for geocoding results to avoid multiple API calls for the same coordinates
const geocodeCache: Record<string, string> = {};

// Helper function to convert coordinates to location name
export const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
  const cacheKey = `${latitude},${longitude}`;
  
  // Check cache first
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }
  
  try {
    if (!opencageApiKey) {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    
    const response = await opencage.geocode({
      q: `${latitude},${longitude}`,
      key: opencageApiKey,
      no_annotations: 1,
      language: 'en'
    });
    
    if (response && response.results && response.results.length > 0) {
      const result = response.results[0];
      const locationName = result.formatted || 
        `${result.components.city || result.components.town || result.components.state || ''}, ${result.components.country || ''}`;
      
      // Cache the result
      geocodeCache[cacheKey] = locationName;
      return locationName;
    }
    
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Geocoding error:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}