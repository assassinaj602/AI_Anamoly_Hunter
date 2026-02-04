import { GoogleGenAI, Modality } from "@google/genai";
import { ANOMALY_SCHEMA, ANOMALY_SYSTEM_INSTRUCTION, CHANGE_SCHEMA, CHANGE_SYSTEM_INSTRUCTION, GEMINI_MODEL } from "../constants";
import { AnomalyResponse, ChangeResponse, AnalysisMetadata } from "../types";

// Helper to clean JSON string if Markdown code blocks are present
const cleanJson = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

const formatMetadata = (meta?: AnalysisMetadata) => {
  if (!meta) return "No metadata provided.";
  return `
    METADATA CONTEXT:
    - Location: ${meta.regionName || 'Unknown Region'} (${meta.latitude || 'N/A'}, ${meta.longitude || 'N/A'})
    - Date: ${meta.date || 'Unknown'}
    - Sensor Type: ${meta.sensorType || 'Standard Optical'}
    
    Use this metadata to ground your analysis (e.g., if Sensor is 'Infrared', interpret red as vegetation/heat).
  `;
};

export const analyzeAnomaly = async (imageBase64: string, metadata?: AnalysisMetadata): Promise<AnomalyResponse> => {
  try {
    const ai = getAI();
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: formatMetadata(metadata) },
          { text: "Perform a high-precision GEOINT analysis. Identify the top 3-5 most distinct geological or structural features. Strictly avoid 'fictional' or 'speculative' findings. Ignore image noise. For each finding, provide a confidence score based purely on visual clarity. Return pure JSON." }
        ]
      },
      config: {
        systemInstruction: ANOMALY_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANOMALY_SCHEMA,
        temperature: 0,
        seed: 42
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(cleanJson(text)) as AnomalyResponse;
  } catch (error) {
    console.error("Anomaly Analysis Error:", error);
    throw error;
  }
};

export const verifyLocationWithMaps = async (imageBase64: string, metadata: AnalysisMetadata): Promise<string> => {
  try {
    const ai = getAI();
    // Maps grounding requires Gemini 2.5
    const model = "gemini-2.5-flash"; 
    
    if (!metadata.latitude || !metadata.longitude) {
      return "Verification failed: Coordinates required for Google Maps grounding.";
    }

    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
           { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
           { text: "Verify this location. What real-world landmarks or structures are at these coordinates that match the image?" }
        ]
      },
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: parseFloat(metadata.latitude),
              longitude: parseFloat(metadata.longitude)
            }
          }
        }
      }
    });

    // Check for grounding chunks
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let groundText = "";
    if (grounding) {
       groundText = "\n\nMap References Found: " + grounding.map(g => g.maps?.title).filter(Boolean).join(", ");
    }

    return (response.text || "No verification data found.") + groundText;

  } catch (error) {
    console.error("Grounding Error:", error);
    return "Verification unavailable.";
  }
};

export const analyzeChange = async (image1Base64: string, image2Base64: string, metadata?: AnalysisMetadata): Promise<ChangeResponse> => {
  try {
    const ai = getAI();
    const base64Data1 = image1Base64.split(',')[1] || image1Base64;
    const base64Data2 = image2Base64.split(',')[1] || image2Base64;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data1 } },
          { text: "This is the first image (older)." },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data2 } },
          { text: "This is the second image (newer)." },
          { text: formatMetadata(metadata) },
          { text: "Perform a rigorous change detection analysis. Ignore differences caused solely by camera angle, lighting, or cloud shadows. Focus on structural ground changes (construction, destruction, erosion, growth). Return pure JSON." }
        ]
      },
      config: {
        systemInstruction: CHANGE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: CHANGE_SCHEMA,
        temperature: 0,
        seed: 42
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(cleanJson(text)) as ChangeResponse;
  } catch (error) {
    console.error("Change Analysis Error:", error);
    throw error;
  }
};

export const askQuestionAboutImage = async (imageBase64: string, question: string, previousContext?: string): Promise<string> => {
  const ai = getAI();
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `Context from previous analysis: ${previousContext || 'None'}` },
        { text: `User Question: ${question}. Answer concisely and scientifically based ONLY on the visual evidence in the image.` }
      ]
    }
  });

  return response.text || "I could not generate an answer.";
};

export const askQuestionAboutChange = async (img1: string, img2: string, question: string, previousContext?: string): Promise<string> => {
  const ai = getAI();
  const b1 = img1.split(',')[1] || img1;
  const b2 = img2.split(',')[1] || img2;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: b1 } },
        { text: "Image 1 (Before)" },
        { inlineData: { mimeType: 'image/jpeg', data: b2 } },
        { text: "Image 2 (After)" },
        { text: `Context: ${previousContext}` },
        { text: `User Question: ${question}. Answer concisely regarding the changes based ONLY on visual evidence.` }
      ]
    }
  });

  return response.text || "I could not generate an answer.";
};

export const generateAudioBriefing = async (text: string): Promise<ArrayBuffer> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  // Decode Base64 to ArrayBuffer
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};