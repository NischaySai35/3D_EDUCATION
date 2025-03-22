const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const generateGeminiResponse = async (prompt) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const requestData = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        };

        const response = await axios.post(url, requestData);

        console.log('Gemini API response:', response.data); // Debugging Log
        
        // Check if response is correct
        if (response.data && response.data.candidates) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response from Gemini API');
        }
    } catch (error) {
        console.error('Gemini API error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate explanation');
    }
};

module.exports = { generateGeminiResponse };
