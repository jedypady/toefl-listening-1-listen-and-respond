import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TestQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

export const generateTestData = async (): Promise<TestQuestion[]> => {
  const prompt = `
    Generate a set of 8 diverse multiple-choice questions for an English listening comprehension test suitable for a B1/B2 CEFR level.
    The topic should be related to campus life or short social interactions. Ensure the scenarios are varied and not repetitive.
    Each question should consist of a spoken part (the 'question' field), four text options, the index of the correct option, and an explanation.
    The 'question' field is what the user will hear. It should be a single question or statement.
    The 'options' should be plausible responses to the spoken part.
    The 'explanation' field should briefly explain why the correct option is the most appropriate response.
    The entire output must be a valid JSON array of objects. Do not include any markdown formatting like \`\`\`json.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The question or statement that will be spoken to the user.",
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of four possible text responses.",
            },
            correctOptionIndex: {
              type: Type.INTEGER,
              description: "The 0-based index of the correct option in the 'options' array.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of why the correct option is the right answer."
            }
          },
          required: ["question", "options", "correctOptionIndex", "explanation"],
        },
      },
    },
  });
  
  const jsonText = response.text.trim();
  try {
    const questions = JSON.parse(jsonText) as Omit<TestQuestion, 'voice'>[];
    return questions.map(q => ({
      ...q,
      voice: VOICES[Math.floor(Math.random() * VOICES.length)],
    }));

  } catch(e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("The AI returned an invalid data format.");
  }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio from text.");
    }
    return base64Audio;
};