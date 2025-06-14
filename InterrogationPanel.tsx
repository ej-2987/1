
import React, { useState, useRef, useEffect } from 'react';
import type { CharacterRole, Message } from '../types';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';

interface InterrogationPanelProps {
  activeCharacter: CharacterRole | null;
  onSelectCharacter: (character: CharacterRole) => void;
  onSendMessage: (message: string) => void;
  chatHistory: Message[];
  isLoading: boolean;
  characters: CharacterRole[];
}

export const InterrogationPanel: React.FC<InterrogationPanelProps> = ({
  activeCharacter,
  onSelectCharacter,
  onSendMessage,
  chatHistory,
  isLoading,
  characters,
}) => {
  const [messageText, setMessageText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = () => {
    if (messageText.trim() && activeCharacter) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const getCharacterKoreanName = (role: CharacterRole) => {
    if (role.includes('Complainant')) return '고소인';
    if (role.includes('Witness')) return '참고인';
    if (role.includes('Suspect')) return '피의자';
    return role;
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-brand-dark mb-4 text-center">조사 대상자 심문</h2>
      
      <div className="mb-4 flex flex-wrap justify-center gap-2 p-3 bg-brand-light/60 rounded-lg shadow-sm">
        {characters.map((char) => (
          <Button
            key={char}
            onClick={() => onSelectCharacter(char)}
            variant={activeCharacter === char ? 'primary' : 'secondary'}
            className={`px-4 py-2 text-sm md:text-base ${activeCharacter === char ? 'ring-2 ring-offset-2 ring-brand-accent' : ''}`}
          >
            {char} 호출
          </Button>
        ))}
      </div>

      {activeCharacter ? (
        <>
          <div className="flex-grow bg-white border border-neutral-medium/30 rounded-lg p-4 overflow-y-auto mb-4 min-h-[300px] max-h-[50vh] shadow-inner">
            {chatHistory.length === 0 && (
              <p className="text-neutral-medium text-center py-10">
                {getCharacterKoreanName(activeCharacter)}에게 질문을 시작하세요.
              </p>
            )}
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-xl max-w-[80%] clear-both ${
                  msg.sender === 'user'
                    ? 'bg-brand-secondary text-white float-right ml-auto rounded-br-none'
                    : 'bg-neutral-light text-neutral-dark float-left mr-auto rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm break-words whitespace-pre-line">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-neutral-medium'}`}>
                  {msg.sender === 'user' ? '수사관' : getCharacterKoreanName(activeCharacter)} - {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center p-3">
                <LoadingSpinner size="sm" />
                <p className="ml-2 text-neutral-medium text-sm italic">{getCharacterKoreanName(activeCharacter)} 응답 생성 중...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder={`${getCharacterKoreanName(activeCharacter)}에게 질문 입력...`}
              className="flex-grow p-3 border border-neutral-medium/50 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !messageText.trim()} className="px-6">
              전송
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center bg-white border border-neutral-medium/30 rounded-lg p-4 text-neutral-medium text-center shadow-inner min-h-[300px]">
          조사할 대상자를 선택해주세요.
        </div>
      )}
    </div>
  );
};
