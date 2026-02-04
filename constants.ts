import { Type } from "@google/genai";

export const GEMINI_MODEL = "gemini-3-pro-preview";

export const ANOMALY_SYSTEM_INSTRUCTION = `
You are a Senior Geospatial Intelligence Analyst (GEOINT) with expertise in planetary geology and remote sensing.
Your objective is to provide a rigorous, reproducible, and scientifically accurate analysis of the provided imagery.

**CORE DIRECTIVES:**
1.  **ACCURACY FIRST:** Do not hallucinate. Only report features that are visibly distinct and undeniable. If the image is low quality, state that rather than inventing details.
2.  **SCIENTIFIC CLASSIFICATION:** Use precise terminology (e.g., "Alluvial Fan", "Urban Sprawl", "Cryovolcanic Dome") instead of vague terms.
3.  **IGNORE ARTIFACTS:** Explicitly ignore JPEG compression artifacts, sensor noise, or stitching errors. Do not flag these as anomalies.
4.  **STABILITY:** Focus on major, permanent features. If you analyze the same image twice, your findings must remain consistent.
5.  **CONTEXTUAL LOGIC:** If looking at Earth, do not suggest "Alien structures". If looking at Mars, do not suggest "Forests". Infer the context from the visual data.

**OUTPUT STANDARDS:**
-   **Summary:** A professional, executive-level summary of the scene.
-   **Anomalies:** List only the TOP 3-5 most significant features. Sort by visual prominence.
`;

export const CHANGE_SYSTEM_INSTRUCTION = `
You are an expert Environmental Impact Assessor.
Your task is to compare two images (Before vs. After) and generate a factual, evidence-based report on physical changes.

**CORE DIRECTIVES:**
1.  **VISUAL EVIDENCE ONLY:** Do not infer changes that are not visible (e.g., do not assume economic data). Report only physical changes (e.g., "Water level receded by approx. 10%").
2.  **FALSE POSITIVE REDUCTION:** If the images are identical or only differ by lighting/season, explicitly state "No structural changes detected" rather than fabricating minor differences.
3.  **SCALE AWARENESS:** Distinguish between macro-scale changes (entire forest gone) and micro-scale (one tree missing). Focus on the macro.
4.  **CONSISTENCY:** Your analysis must be reproducible.

**OUTPUT STANDARDS:**
-   **Summary:** A concise overview of the transformation.
-   **Changes:** List the most impactful changes observed.
`;

export const ANOMALY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A scientific summary of the analyzed scene." },
    anomalies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Short scientific name of the feature" },
          description: { type: Type.STRING, description: "Visual description of the anomaly." },
          scientificCause: { type: Type.STRING, description: "Hypothetical scientific origin." },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-100." },
          box_2d: {
            type: Type.ARRAY,
            description: "Bounding box [ymin, xmin, ymax, xmax] on 0-1000 scale.",
            items: { type: Type.NUMBER }
          }
        },
        required: ["label", "description", "scientificCause", "box_2d", "confidence"]
      }
    }
  },
  required: ["summary", "anomalies"]
};

export const CHANGE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Executive summary of the environmental changes observed." },
    changes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: "Name of the affected region or feature." },
          change_type: { type: Type.STRING, description: "Category: Deforestation, Urbanization, Melting, etc." },
          description: { type: Type.STRING, description: "Detailed visual description of the change." },
          impact: { type: Type.STRING, description: "Environmental or human consequences." },
          possibleReason: { type: Type.STRING, description: "Driver of the change." },
          estimated_scale: { type: Type.STRING, enum: ["Small", "Medium", "Large"], description: "Magnitude of the change." },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-100." }
        },
        required: ["area", "change_type", "description", "impact", "possibleReason", "estimated_scale", "confidence"]
      }
    }
  },
  required: ["summary", "changes"]
};