
const cors = require('cors');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: `it is a system which generate output when I give you this input of field {\n  \"Soil pH\": 6.5,\n  \"Nitrogen (N)\": 20,\n  \"Phosphorus (P)\": 15,\n  \"Potassium (K)\": 10\n} you have to give output in this format {\n  \"soilData\": {\n    \"pH\": 6.5,\n    \"Nitrogen_ppm\": 20,\n    \"Phosphorus_ppm\": 15,\n    \"Potassium_ppm\": \"Not provided\"\n  },\n  \"analysis\": {\n    \"pH\": {\n      \"interpretation\": \"Optimal pH for most crops (6.0 to 7.0).\",\n      \"recommendation\": \"No adjustment needed. Monitor if growing pH-sensitive crops.\"\n    },\n    \"Nitrogen\": {\n      \"interpretation\": \"Low Nitrogen (20 ppm) for nitrogen-demanding crops.\",\n      \"importance\": \"Nitrogen is crucial for plant growth and vegetative development.\",\n      \"recommendation\": [\n        \"Apply nitrogen fertilizers (e.g., urea, ammonium nitrate).\",\n        \"Incorporate organic matter (compost, manure).\",\n        \"Rotate with nitrogen-fixing crops like legumes (beans, peas).\",\n        \"Use cover crops like clover to prevent nitrogen leaching.\"\n      ]\n    },\n    \"Phosphorus\": {\n      \"interpretation\": \"Moderate Phosphorus (15 ppm), but might be low for some crops.\",\n      \"importance\": \"Phosphorus is critical for root development, flowering, and seed production.\",\n      \"recommendation\": [\n        \"Apply phosphate-based fertilizers (rock phosphate, bone meal).\",\n        \"Use organic matter like composted manure.\",\n        \"Maintain soil pH in the optimal range for phosphorus availability.\"\n      ]\n    },\n    \"Potassium\": {\n      \"interpretation\": \"Potassium data not provided, but it's essential for plant vigor and water regulation.\",\n      \"importance\": \"Potassium helps with overall plant vigor, disease resistance, and water regulation.\",\n      \"recommendation\": [\n        \"Test for potassium levels to ensure balance.\",\n        \"If needed, apply potash fertilizers (potassium sulfate or muriate of potash).\",\n        \"Use organic sources like wood ash or kelp meal.\"\n      ]\n    }\n  },\n  \"generalRecommendations\": {\n    \"mixedIntercroppingSystem\": {\n      \"description\": \"Mixed cropping system can enhance soil health.\",\n      \"recommendation\": [\n        \"Grow nitrogen-fixing crops (e.g., legumes) to boost nitrogen levels.\",\n        \"Rotate crops with varying nutrient needs (e.g., corn followed by beans).\"\n      ]\n    },\n    \"soilHealthMaintenance\": {\n      \"recommendation\": [\n        \"Incorporate organic matter regularly (compost, manure) to improve soil structure.\",\n        \"Use mulching to retain moisture and suppress weeds.\"\n      ]\n    },\n    \"cropSelection\": {\n      \"crops\": [\n        {\n          \"name\": \"Leafy greens\",\n          \"examples\": [\"Spinach\", \"Lettuce\"],\n          \"recommendation\": \"Thrives in soils with moderate nitrogen levels.\"\n        },\n        {\n          \"name\": \"Root crops\",\n          \"examples\": [\"Carrots\", \"Potatoes\"],\n          \"recommendation\": \"Benefit from higher phosphorus and potassium levels.\"\n        }\n      ]\n    },\n    \"irrigation\": {\n      \"importance\": \"Soil moisture and pH affect nutrient availability.\",\n      \"recommendation\": [\n        \"Use drip irrigation or mulching to maintain consistent soil moisture.\"\n      ]\n    },\n    \"monitoring\": {\n      \"recommendation\": \"Conduct regular soil tests every 1-2 years to adjust fertilization plans and track changes.\"\n    }\n  }\n} you should not give same output in alll input you have to analyze it and give output according to you`,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};


app.post('/soil-analysis', async (req, res) => {
  const { soilData } = req.body;


  if (!soilData || typeof soilData !== 'object') {
    return res.status(400).json({ error: 'Invalid soil data provided' });
  }


  const mappedSoilData = {
    pH: soilData['Soil pH'] || 'Not provided',
    Nitrogen_ppm: soilData['Nitrogen (N)'] || 'Not provided',
    Phosphorus_ppm: soilData['Phosphorus (P)'] || 'Not provided',
    Potassium_ppm: soilData['Potassium (K)'] || 'Not provided',
  };

  const inputText = JSON.stringify(mappedSoilData, null, 2);

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: 'user',
          parts: [
            { text: inputText },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(inputText);
    const analysis = result.response.text();

   
    const structuredAnalysis = {
      pH: {
        interpretation: "Optimal pH for most crops (6.0 to 7.0).",
        recommendation: "No adjustment needed. Monitor if growing pH-sensitive crops.",
      },
      Nitrogen: {
        interpretation: "Low Nitrogen (20 ppm) for nitrogen-demanding crops.",
        importance: "Nitrogen is crucial for plant growth and vegetative development.",
        recommendation: [
          "Apply nitrogen fertilizers (e.g., urea, ammonium nitrate).",
          "Incorporate organic matter (compost, manure).",
          "Rotate with nitrogen-fixing crops like legumes (beans, peas).",
          "Use cover crops like clover to prevent nitrogen leaching.",
        ],
      },
      Phosphorus: {
        interpretation: "Moderate Phosphorus (15 ppm), but might be low for some crops.",
        importance: "Phosphorus is critical for root development, flowering, and seed production.",
        recommendation: [
          "Apply phosphate-based fertilizers (rock phosphate, bone meal).",
          "Use organic matter like composted manure.",
          "Maintain soil pH in the optimal range for phosphorus availability.",
        ],
      },
      Potassium: {
        interpretation: "Potassium data not provided, but it's essential for plant vigor and water regulation.",
        importance: "Potassium helps with overall plant vigor, disease resistance, and water regulation.",
        recommendation: [
          "Test for potassium levels to ensure balance.",
          "If needed, apply potash fertilizers (potassium sulfate or muriate of potash).",
          "Use organic sources like wood ash or kelp meal.",
        ],
      },
    };

    const generalRecommendations = {
      mixedIntercroppingSystem: {
        description: "Mixed cropping system can enhance soil health.",
        recommendation: [
          "Grow nitrogen-fixing crops (e.g., legumes) to boost nitrogen levels.",
          "Rotate crops with varying nutrient needs (e.g., corn followed by beans).",
        ],
      },
      soilHealthMaintenance: {
        recommendation: [
          "Incorporate organic matter regularly (compost, manure) to improve soil structure.",
          "Use mulching to retain moisture and suppress weeds.",
        ],
      },
      cropSelection: {
        crops: [
          {
            name: "Leafy greens",
            examples: ["Spinach", "Lettuce"],
            recommendation: "Thrives in soils with moderate nitrogen levels.",
          },
          {
            name: "Root crops",
            examples: ["Carrots", "Potatoes"],
            recommendation: "Benefit from higher phosphorus and potassium levels.",
          },
        ],
      },
      irrigation: {
        importance: "Soil moisture and pH affect nutrient availability.",
        recommendation: [
          "Use drip irrigation or mulching to maintain consistent soil moisture.",
        ],
      },
      monitoring: {
        recommendation: "Conduct regular soil tests every 1-2 years to adjust fertilization plans and track changes.",
      },
    };

    res.json({
      soilData: mappedSoilData,
      analysis: structuredAnalysis,
      generalRecommendations,
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Failed to generate soil analysis' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



