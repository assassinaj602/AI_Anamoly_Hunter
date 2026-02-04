/**
 * Fetches an image from a URL and converts it to a Base64 string.
 * Used for loading demo data.
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'force-cache'
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Demo image load error:", error);
    throw error;
  }
};

// Reliable Wikimedia Commons URLs for Demo
export const DEMO_DATA = {
  MARS_URL: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Mars_surface.jpg/800px-Mars_surface.jpg", // Spirit Rover
  GLACIER_OLD_URL: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Muir_Glacier_1941.jpg/640px-Muir_Glacier_1941.jpg", // Muir Glacier 1941
  GLACIER_NEW_URL: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Muir_Glacier_2004.jpg/640px-Muir_Glacier_2004.jpg" // Muir Glacier 2004
};
