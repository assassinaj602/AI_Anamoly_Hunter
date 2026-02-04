# AI Anomaly Hunter & Earth Change Tracker - Technical Documentation

## 1. Executive Summary
This application is a professional-grade geospatial intelligence (GEOINT) tool designed to analyze satellite imagery and detect anomalies or track environmental changes. It leverages **Google's Gemini 3 Pro** model to provide deterministic, scientifically accurate analysis rather than generative creativity.

## 2. Core Architecture

### Tech Stack
-   **Frontend Engine**: React 19 (via ESM modules).
-   **AI Core**: Google GenAI SDK (`@google/genai`).
-   **Styling**: TailwindCSS with a custom "Glassmorphism" UI design system.
-   **Audio Engine**: Web Audio API + Gemini Text-to-Speech (TTS).

### Data Flow
1.  **Ingestion**: Images are converted to Base64 strings client-side.
2.  **Metadata Injection**: Users provide Context, Coordinates, and Sensor Data.
3.  **AI Processing**: The request is sent to `gemini-3-pro-preview` with strict instruction sets.
4.  **Verification**: Optional call to `gemini-2.5-flash` for Google Maps Grounding.
5.  **Visualization**: The React UI overlays bounding boxes, heatmaps, and textual reports.

---

## 3. AI Mechanism & "Real" Detection Logic

To ensure the detection is "real" (deterministic and scientifically valid) rather than "fake" (random/hallucinated), the application employs several hardening techniques:

### A. The Deterministic Engine
-   **Model**: `gemini-3-pro-preview` (Reasoning), `gemini-2.5-flash` (Maps).
-   **Temperature**: `0.0` (Removes randomness).
-   **Seed**: `42` (Ensures consistency).

### B. Metadata Contextualization
The prompt now accepts a structured metadata object. If the user inputs "Infrared Sensor", the AI knows to interpret red pixels as heat or vegetation rather than paint. This drastically reduces false positives.

### C. Google Maps Grounding (Verification)
If coordinates (Lat/Lng) are provided, the user can trigger a "Verify Location" routine. This uses the Gemini 2.5 `googleMaps` tool to fetch real-world place data (e.g., "This coordinate matches 'Nellis Air Force Base'") to cross-reference with the visual analysis.

---

## 4. Operational Modes

### Mode 1: Anomaly Hunter
**Objective**: Identify geological or structural oddities in a single image.
-   **Input**: Satellite Image + Metadata.
-   **Visualization**: HUD overlay with toggleable Heatmaps.
-   **Output**: Exportable JSON Dossier.

### Mode 2: Earth Change Tracker
**Objective**: Quantify physical changes between two timeframes.
-   **Input**: Image A (Historical) + Image B (Current).
-   **Tools**:
    -   **Slider**: Manual drag comparison.
    -   **Blink Comparator (Flicker)**: Rapidly toggles images to make small changes "pop" visually (Industry standard for astronomy).
-   **Visualization**: Interactive "Before/After" slider.

---

## 5. Directory Structure

-   `App.tsx`: Main controller and state machine.
-   `services/geminiService.ts`: The bridge to Google's API. Contains logic for Gemini 3 (Analysis) and Gemini 2.5 (Maps).
-   `components/MetadataPanel.tsx`: Input form for geospatial context.
-   `components/ComparisonSlider.tsx`: Handles Slider and Flicker visualization.
-   `components/ReportModal.tsx`: Generates the "Printable Dossier".

## 6. Future Roadmap
-   **GIS Integration**: Direct GeoTIFF support.
-   **Tile Processing**: Breaking large 4K satellite images into smaller chunks for higher resolution analysis.
