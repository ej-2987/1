import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Chat, GenerateContentResponse } from "@google/genai";
import type { CaseDetails, CharacterRole, Message } from '../types';
import { GEMINI_TEXT_MODEL, INITIAL_SYSTEM_INSTRUCTIONS } from '../constants'; // Removed PERSONA_PROMPTS as it's not used here anymore for chat message

const parseJsonFromMarkdown = (text: string): any => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    throw new Error(`Invalid JSON response from AI. Could not parse: ${text.substring(0,100)}...`);
  }
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const getGoogleGenAIInstance = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key is not provided to GoogleGenAI constructor.");
    }
    return new GoogleGenAI({ apiKey });
}

export const generateCaseDetails = async (apiKey: string, precedentText: string): Promise<CaseDetails> => {
  const ai = getGoogleGenAIInstance(apiKey);
  const model = GEMINI_TEXT_MODEL;
  
  const prompt = `다음 판례는 이미 결론이 난 사건에 대한 것입니다. 이 판례 내용을 바탕으로, 이제 막 수사가 시작되는 시점이라고 가정하고, 수사관이 초기에 파악할 수 있는 "사건 개요"를 작성해주십시오. 이 "사건 개요"는 수사 초기 단계의 시점에서 작성된 것처럼 표현되어야 합니다. 또한, 이 초기 단계에서 예상되는 "중요 쟁점 사항 (3-5개)"과 기본적인 "수사 계획"도 함께 제안해주십시오. 결과는 다음 JSON 형식으로 반환해주세요: {"overview": "수사 초기 단계의 사건 요약...", "issues": ["...", "..."], "plan": ["...", "..."]}\n\n판례:\n${precedentText}`;

  try {
    const apiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            temperature: 0.5,
            safetySettings,
        },
    });
    
    if (!apiResponse) {
        console.error("AI response object for case details is undefined.");
        throw new Error("AI 응답 객체가 정의되지 않았습니다 (case details).");
    }
    if (typeof apiResponse.text !== 'string' || apiResponse.text.trim() === '') {
        console.error("AI response .text for case details is not a valid string or is empty. Response object:", JSON.stringify(apiResponse, null, 2));
        throw new Error("AI 응답에 유효한 텍스트가 없거나 비어 있습니다 (case details).");
    }

    const rawJson = apiResponse.text;
    const parsedDetails = parseJsonFromMarkdown(rawJson);
    
    if (!parsedDetails.overview || !Array.isArray(parsedDetails.issues) || !Array.isArray(parsedDetails.plan)) {
        console.error("Parsed case details missing required fields. Parsed object:", JSON.stringify(parsedDetails, null, 2));
        throw new Error("AI response for case details is missing required fields (overview, issues, plan) after parsing.");
    }
    return parsedDetails as CaseDetails;

  } catch (error) {
    console.error("Error generating case details:", error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.");
    }
    if (error instanceof Error && (error.message.startsWith("AI 응답 객체가 정의되지 않았습니다") || error.message.startsWith("AI 응답에 유효한 텍스트가 없거나 비어 있습니다") || error.message.startsWith("AI response for case details is missing required fields"))) {
        throw error;
    }
    throw new Error(`Gemini로부터 사건 상세 정보를 생성하는 데 실패했습니다. ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateComplaint = async (apiKey: string, caseOverview: string): Promise<string> => {
  const ai = getGoogleGenAIInstance(apiKey);
  const model = GEMINI_TEXT_MODEL;

  const prompt = `다음 사건 개요를 바탕으로 고소장 초안을 작성해주세요. 고소인 입장에서 겪은 상황과 감정을 중심으로 서술하되, 형식적인 법률 용어는 피해주세요. 고소 내용은 상세하게 작성해주세요.\n\n사건 개요:\n${caseOverview}`;
  
  try {
    const apiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
            temperature: 0.8,
            safetySettings,
            responseMimeType: "text/plain",
        },
    });

    if (!apiResponse) {
        console.error("AI response object for complaint is undefined.");
        throw new Error("AI 응답 객체가 정의되지 않았습니다 (complaint).");
    }
    if (typeof apiResponse.text !== 'string' || apiResponse.text.trim() === '') {
        console.error("AI response .text for complaint is not a valid string or is empty. Response object:", JSON.stringify(apiResponse, null, 2));
        throw new Error("AI 응답에 유효한 텍스트가 없거나 비어 있습니다 (complaint).");
    }
    return apiResponse.text;
  } catch (error) {
    console.error("Error generating complaint:", error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.");
    }
    if (error instanceof Error && (error.message.startsWith("AI 응답 객체가 정의되지 않았습니다") || error.message.startsWith("AI 응답에 유효한 텍스트가 없거나 비어 있습니다"))) {
        throw error;
    }
    throw new Error(`Gemini로부터 고소장을 생성하는 데 실패했습니다. ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const sendMessageToCharacter = async (
  apiKey: string,
  characterRole: CharacterRole,
  message: string, // This is the current user's raw message text
  caseOverview: string,
  previousMessages: Message[], // Full history including current user message (last item) for context
  existingChatInstance: Chat | null
): Promise<{response: string; updatedChat: Chat}> => {
  const ai = getGoogleGenAIInstance(apiKey);
  const model = GEMINI_TEXT_MODEL;

  // History for Gemini should be all messages *before* the current user's input.
  // previousMessages from App.tsx includes the current user's message as the last item due to optimistic update.
  const chatHistoryForAPI = previousMessages.slice(0, -1).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
  }));

  let chat: Chat;
  if (existingChatInstance) {
    chat = existingChatInstance;
    // Note: If history was passed to existingChatInstance.sendMessageStream previously,
    // the instance might already have history. The API handles merging.
    // However, if creating new for each turn, this new history is critical.
  } else {
     // Construct system instruction with case overview
     const systemInstructionContent = `${INITIAL_SYSTEM_INSTRUCTIONS[characterRole]}\n\n현재 사건 개요는 다음과 같습니다:\n${caseOverview}`;
     
     chat = ai.chats.create({
        model: model,
        config: { 
            systemInstruction: systemInstructionContent,
            temperature: 0.75, 
            safetySettings, 
        },
        history: chatHistoryForAPI 
    });
  }
  
  try {
    // Send only the user's current message text.
    const result: GenerateContentResponse = await chat.sendMessage({ message: message }); 
    
    if (!result) {
        console.error(`AI response object for ${characterRole} is undefined.`);
        throw new Error(`AI 응답 객체가 정의되지 않았습니다 (${characterRole}).`);
    }
    if (typeof result.text !== 'string' || result.text.trim() === '') {
        console.error(`AI response .text for ${characterRole} is not a valid string or is empty. Response object:`, JSON.stringify(result, null, 2));
        throw new Error(`AI 응답에 유효한 텍스트가 없거나 비어 있습니다 (${characterRole}).`);
    }
    return { response: result.text, updatedChat: chat };
  } catch (error) {
    console.error(`Error sending message to ${characterRole}:`, error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.");
    }
    if (error instanceof Error && (error.message.startsWith("AI 응답 객체가 정의되지 않았습니다") || error.message.startsWith("AI 응답에 유효한 텍스트가 없거나 비어 있습니다"))) {
        throw error;
    }
    throw new Error(`${characterRole}에게 메시지 전송 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const summarizeChatLog = async (apiKey: string, rawLog: string): Promise<string> => {
  const ai = getGoogleGenAIInstance(apiKey);
  const model = GEMINI_TEXT_MODEL;

  const prompt = `다음은 수사관과 조사 대상자 간의 대화 기록입니다. 이 대화 내용을 간결하고 전문적인 요약 로그로 정리해주세요. 주요 사실, 진술의 일관성 여부, 모순점, 감정적 반응 등을 중심으로 요약합니다.\n\n대화 기록:\n${rawLog}`;
  
  try {
    const apiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
            temperature: 0.3,
            safetySettings, 
        },
    });

    if (!apiResponse) {
        console.error("AI response object for summary is undefined.");
        throw new Error("AI 응답 객체가 정의되지 않았습니다 (summary).");
    }
    if (typeof apiResponse.text !== 'string' || apiResponse.text.trim() === '') {
        console.error("AI response .text for summary is not a valid string or is empty. Response object:", JSON.stringify(apiResponse, null, 2));
        throw new Error("AI 응답에 유효한 텍스트가 없거나 비어 있습니다 (summary).");
    }
    return apiResponse.text;
  } catch (error) {
    console.error("Error summarizing chat log:", error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.");
    }
     if (error instanceof Error && (error.message.startsWith("AI 응답 객체가 정의되지 않았습니다") || error.message.startsWith("AI 응답에 유효한 텍스트가 없거나 비어 있습니다"))) {
        throw error;
    }
    throw new Error(`대화 요약 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
};