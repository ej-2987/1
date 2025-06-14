
import React, { useState, useCallback } from 'react';
import { CaseInputForm } from './components/CaseInputForm';
import { CaseDetailsDisplay } from './components/CaseDetailsDisplay';
import { ComplaintDisplay } from './components/ComplaintDisplay';
import { InterrogationPanel } from './components/InterrogationPanel';
import { ChatLogView } from './components/ChatLogView';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AlertMessage } from './components/common/AlertMessage';
import { Button } from './components/common/Button';
import { generateCaseDetails, generateComplaint, summarizeChatLog, sendMessageToCharacter } from './services/geminiService';
import type { CaseDetails, CharacterRole, Message, ChatHistories, SummarizedLogs, GeminiChats } from './types';
import { CHARACTER_ROLES } from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>(''); // For API key input field
  
  const [precedentText, setPrecedentText] = useState<string>('');
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [complaintText, setComplaintText] = useState<string | null>(null);
  
  const [activeCharacter, setActiveCharacter] = useState<CharacterRole | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistories>({
    [CHARACTER_ROLES.COMPLAINANT]: [],
    [CHARACTER_ROLES.WITNESS]: [],
    [CHARACTER_ROLES.SUSPECT]: [],
  });
  const [summarizedLogs, setSummarizedLogs] = useState<SummarizedLogs>({
    [CHARACTER_ROLES.COMPLAINANT]: '',
    [CHARACTER_ROLES.WITNESS]: '',
    [CHARACTER_ROLES.SUSPECT]: '',
  });
  const [geminiChats, setGeminiChats] = useState<GeminiChats>({
    [CHARACTER_ROLES.COMPLAINANT]: null,
    [CHARACTER_ROLES.WITNESS]: null,
    [CHARACTER_ROLES.SUSPECT]: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setError(null); // Clear previous errors
    } else {
      setError("API 키를 입력해주세요.");
    }
  };

  const handleCaseSubmit = useCallback(async (text: string) => {
    if (!apiKey) {
        setError("API 키가 설정되지 않았습니다. 먼저 API 키를 입력해주세요.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setPrecedentText(text); // Save precedent text even if API call fails partially
    setCaseDetails(null); // Reset previous details
    setComplaintText(null); // Reset previous complaint

    try {
      const details = await generateCaseDetails(apiKey, text);
      setCaseDetails(details);
      // Only generate complaint if overview is present
      if (details?.overview) {
        const complaint = await generateComplaint(apiKey, details.overview);
        setComplaintText(complaint);
      } else {
        setComplaintText("사건 개요가 없어 고소장을 생성할 수 없습니다.");
      }
    } catch (err) {
      console.error(err);
      setError(`사건 구성 중 오류 발생: ${err instanceof Error ? err.message : String(err)}. API 키를 확인하거나 나중에 다시 시도해주세요.`);
      setCaseDetails(null);
      setComplaintText(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleSelectCharacter = useCallback((character: CharacterRole) => {
    setActiveCharacter(character);
  }, []);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!activeCharacter || !apiKey) {
      setError("API 키가 설정되지 않았거나 대상이 선택되지 않았습니다.");
      return;
    }

    setIsLoadingChat(true);
    setError(null);

    const newMessage: Message = { sender: 'user', text: messageText, timestamp: new Date() };
    
    // Optimistically update chat history for user message
    setChatHistories(prev => ({
      ...prev,
      [activeCharacter]: [...prev[activeCharacter], newMessage],
    }));
    
    try {
      const { response, updatedChat } = await sendMessageToCharacter(
          apiKey,
          activeCharacter,
          messageText,
          caseDetails?.overview || "사건 개요 정보 없음.",
          chatHistories[activeCharacter], 
          geminiChats[activeCharacter] 
        );
      
      const aiResponse: Message = { sender: 'ai', text: response, timestamp: new Date() };
      setChatHistories(prev => ({
        ...prev,
        [activeCharacter]: [...prev[activeCharacter], aiResponse],
      }));
      setGeminiChats(prev => ({ ...prev, [activeCharacter]: updatedChat }));

      // Summarize log after each AI response
      const currentRawLog = [...chatHistories[activeCharacter], aiResponse].map(m => `${m.sender === 'user' ? '수사관' : activeCharacter}: ${m.text}`).join('\n');
      const summary = await summarizeChatLog(apiKey, currentRawLog);
      setSummarizedLogs(prev => ({
        ...prev,
        [activeCharacter]: summary
      }));

    } catch (err) {
      console.error(err);
      const errorMessage = ` ${activeCharacter}에게 응답을 받아오는 중 오류 발생: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      const errorResponse: Message = { sender: 'ai', text: `오류: 응답을 받을 수 없습니다. ${errorMessage}`, timestamp: new Date() };
      // Add error message to chat history as well
      setChatHistories(prev => ({
        ...prev,
        [activeCharacter]: [...prev[activeCharacter], errorResponse],
      }));
    } finally {
      setIsLoadingChat(false);
    }
  }, [activeCharacter, apiKey, caseDetails, chatHistories, geminiChats]);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-light to-blue-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-brand-primary mb-6">API 키 설정</h1>
          <p className="text-neutral-medium mb-6">
            Gemini API를 사용하려면 API 키를 입력해주세요. API 키는 안전하게 브라우저 내에서만 사용됩니다.
          </p>
          {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} className="mb-4 text-left" />}
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKeyInput" className="block text-sm font-medium text-neutral-dark text-left mb-1">
                Gemini API 키
              </label>
              <input
                id="apiKeyInput"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full p-3 border border-neutral-medium/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                placeholder="API 키를 여기에 붙여넣으세요"
              />
            </div>
            <Button type="submit" className="w-full" variant="primary">
              API 키 저장 및 시작
            </Button>
          </form>
          <p className="text-xs text-neutral-medium mt-6">
            API 키는 Google AI Studio에서 얻을 수 있습니다. 이 앱은 API 키를 서버에 저장하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light to-blue-100 text-neutral-dark p-4 md:p-8 selection:bg-brand-secondary selection:text-white">
      <header className="mb-8 text-center">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-medium">API Key: ****{apiKey.slice(-4)}</span>
            <Button size="sm" variant="outline" onClick={() => {
                setApiKey('');
                setTempApiKey('');
                setCaseDetails(null);
                setComplaintText(null);
                setChatHistories({[CHARACTER_ROLES.COMPLAINANT]: [],[CHARACTER_ROLES.WITNESS]: [],[CHARACTER_ROLES.SUSPECT]: []});
                setSummarizedLogs({[CHARACTER_ROLES.COMPLAINANT]: '',[CHARACTER_ROLES.WITNESS]: '',[CHARACTER_ROLES.SUSPECT]: ''});
                setGeminiChats({[CHARACTER_ROLES.COMPLAINANT]: null,[CHARACTER_ROLES.WITNESS]: null,[CHARACTER_ROLES.SUSPECT]: null});
                setActiveCharacter(null);
                setError(null);
            }}>
                API 키 변경
            </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-brand-primary drop-shadow-md">
          수사 교육용 시뮬레이션
        </h1>
        <p className="text-neutral-medium mt-2 text-lg">Investigative Training Simulation</p>
      </header>

      {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} className="my-4"/>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <section className="md:col-span-1 bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CaseInputForm onSubmit={handleCaseSubmit} isLoading={isLoading} />
        </section>

        {isLoading && !caseDetails && (
          <div className="md:col-span-2 flex flex-col justify-center items-center h-64 bg-white p-6 rounded-xl shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="ml-4 text-brand-primary font-semibold mt-4">사건 구성 중...</p>
            <p className="text-sm text-neutral-medium">AI가 판례를 분석하고 사건 개요, 쟁점, 수사 계획을 만들고 있습니다.</p>
          </div>
        )}
        
        {caseDetails && (
          <CaseDetailsDisplay details={caseDetails} className="md:col-span-1 bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300" />
        )}
        {complaintText && caseDetails && ( // Only show complaint if caseDetails exist (meaning overview was likely successful)
          <ComplaintDisplay complaint={complaintText} className="md:col-span-1 bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300" />
        )}
      </div>

      {caseDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <InterrogationPanel
              activeCharacter={activeCharacter}
              onSelectCharacter={handleSelectCharacter}
              onSendMessage={handleSendMessage}
              chatHistory={activeCharacter ? chatHistories[activeCharacter] : []}
              isLoading={isLoadingChat}
              characters={[CHARACTER_ROLES.COMPLAINANT, CHARACTER_ROLES.WITNESS, CHARACTER_ROLES.SUSPECT]}
            />
          </section>
          <section className="lg:col-span-1 bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <ChatLogView
              chatHistories={chatHistories}
              summarizedLogs={summarizedLogs}
              characters={[CHARACTER_ROLES.COMPLAINANT, CHARACTER_ROLES.WITNESS, CHARACTER_ROLES.SUSPECT]}
            />
          </section>
        </div>
      )}
      <footer className="text-center mt-12 py-6 border-t border-neutral-medium/30">
        <p className="text-sm text-neutral-medium">&copy; {new Date().getFullYear()} Detective Training Simulation. For educational purposes.</p>
      </footer>
    </div>
  );
};

export default App;
