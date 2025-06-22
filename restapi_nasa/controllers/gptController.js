const { spawn } = require('child_process');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const getNasaPredictions = (lat, lng, predictionYear, predictionMonth) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['./nasa_predictions.py']);

        const inputData = `${predictionYear},${predictionMonth},${lat},${lng}`;
        pythonProcess.stdin.write(inputData);
        pythonProcess.stdin.end();

        let pythonResponse = "";

        pythonProcess.stdout.on('data', (data) => {
            pythonResponse += data.toString();
        });

        pythonProcess.stdout.on('end', () => {
            try {
                const result = JSON.parse(pythonResponse);
                resolve(result);
            } catch (error) {
                reject("Error parsing JSON response from Python script");
            }
        });

        pythonProcess.on('error', (error) => {
            reject(`Error executing the Python script: ${error.message}`);
        });
    });
};

exports.generateContent = async (req, res) => {
    const { crop, cultivationA, agriculturalP, lat, lng, predictionYear, predictionMonth, context } = req.body;

    let nasaData;
    try {
        nasaData = await getNasaPredictions(lat, lng, predictionYear, predictionMonth);
    } catch (error) {
        console.error("Error fetching NASA predictions:", error);
        return res.status(500).json({ error: "Error fetching NASA predictions" });
    }

    if (nasaData.error) {
        return res.status(500).json({ error: nasaData.error });
    }

    let prompt = `You are an expert in agriculture. You have the following information about the crop of ${crop}.`;

    if (context === "Droughts") {
        prompt += `
        - Cultivation area: ${cultivationA}
        - Agricultural practice used: ${agriculturalP}
        - Drought risk prediction: ${nasaData.PRECTOTCORR} mm
        - Minimum temperature: ${nasaData.T2M_MIN}°C
        - Maximum temperature: ${nasaData.T2M_MAX}°C
        
        Provide detailed and practical recommendations to mitigate the effects of drought, and don't forget to show the prediction values.
        `;
    } else if (context === "Precipitation") {
        prompt += `
        - Precipitation prediction: ${nasaData.PRECTOTCORR} mm
        
        Provide recommendations on how to manage the crop based on the rainfall predictions, and don't forget to show the prediction values.
        `;
    }

    try {
        const result = await model.generateContent(prompt);
        res.json({ content: result.response.text() });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: "Error generating content" });
    }
};
