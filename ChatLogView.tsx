
import React, { useState } from 'react';
import type { CharacterRole, ChatHistories, SummarizedLogs, Message } from '../types';
import { Button } from './common/Button';
import jsPDF from 'jspdf';
// It's highly recommended to embed a proper Korean font for consistent PDF output.
// For now, we'll try with a standard font, but this might not render Korean characters correctly on all systems or within jspdf without font embedding.
// Example of what would be needed for a custom font:
// import { NanumGothicBase64 } from './NanumGothicBase64'; // Assume this file exports the base64 string

interface ChatLogViewProps {
  chatHistories: ChatHistories;
  summarizedLogs: SummarizedLogs;
  characters: CharacterRole[];
}

type LogViewMode = 'raw' | 'summarized';

export const ChatLogView: React.FC<ChatLogViewProps> = ({ chatHistories, summarizedLogs, characters }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRole | null>(characters[0] || null);
  const [viewMode, setViewMode] = useState<LogViewMode>('raw');

  const getCharacterKoreanName = (role: CharacterRole | null) => {
    if (!role) return '';
    if (role.includes('Complainant')) return '고소인';
    if (role.includes('Witness')) return '참고인';
    if (role.includes('Suspect')) return '피의자';
    return role;
  };

  const generatePdf = (title: string, contentLines: string[]) => {
    const pdf = new jsPDF();

    // Attempt to use a font that might support Korean.
    // For reliable Korean, you'd typically embed a font like Noto Sans KR or Nanum Gothic:
    // 1. Get the .ttf font file.
    // 2. Convert it to a base64 string.
    // 3. Add it to VFS: pdf.addFileToVFS('MyFont.ttf', base64FontString);
    // 4. Add font: pdf.addFont('MyFont.ttf', 'MyFont', 'normal');
    // 5. Set font: pdf.setFont('MyFont');
    // For now, using a standard font and hoping for the best with Unicode.
    // Common fonts like 'Helvetica', 'Arial' are often aliased.
    // 'Noto Sans JP' is available in some jspdf builds and has wide Unicode, including Korean.
    // Let's try 'Helvetica' as a default and note this limitation.
    try {
      pdf.setFont('Helvetica', 'normal'); // Default, may not support Korean well.
    } catch (e) {
      console.warn("Standard font 'Helvetica' might not be available or support all characters. Consider embedding a font for full Unicode support.", e);
      // Fallback or just proceed
    }


    pdf.text(title, 10, 10);
    let yPos = 20;
    const lineHeight = 7; // Adjust as needed
    const pageHeight = pdf.internal.pageSize.height - 20; // Margin for footer/header

    contentLines.forEach(line => {
      if (yPos + lineHeight > pageHeight) {
        pdf.addPage();
        yPos = 10; // Reset Y position for new page
      }
      // Split text to fit width
      const splitText = pdf.splitTextToSize(line, pdf.internal.pageSize.width - 20);
      splitText.forEach((textLine: string) => {
        if (yPos + lineHeight > pageHeight) {
          pdf.addPage();
          yPos = 10;
        }
        pdf.text(textLine, 10, yPos);
        yPos += lineHeight;
      });
    });

    pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportRawPdf = () => {
    if (!selectedCharacter || !chatHistories[selectedCharacter] || chatHistories[selectedCharacter].length === 0) {
      alert('내보낼 원본 대화 내용이 없습니다.');
      return;
    }

    const characterName = getCharacterKoreanName(selectedCharacter);
    const title = `${characterName} 원본 대화록`;
    const lines: string[] = [];

    chatHistories[selectedCharacter].forEach(msg => {
      const sender = msg.sender === 'user' ? '수사관' : characterName;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      lines.push(`${sender} (${time}):`);
      // Add message text, splitting by newlines if present
      msg.text.split('\n').forEach(subLine => lines.push(`  ${subLine}`));
      lines.push("--------------------");
    });
    generatePdf(title, lines);
  };

  const handleExportSummaryPdf = () => {
    if (!selectedCharacter || !summarizedLogs[selectedCharacter]) {
      alert('내보낼 요약 내용이 없습니다.');
      return;
    }
    const characterName = getCharacterKoreanName(selectedCharacter);
    const title = `${characterName} 대화 요약본`;
    const lines = summarizedLogs[selectedCharacter].split('\n');
    generatePdf(title, lines);
  };
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-brand-dark mb-4 text-center">조사 기록</h2>
      
      <div className="mb-4 flex flex-wrap justify-center gap-2 p-2 bg-brand-light/60 rounded-lg shadow-sm">
        {characters.map((char) => (
          <Button
            key={`select-${char}`}
            onClick={() => setSelectedCharacter(char)}
            variant={selectedCharacter === char ? 'primary' : 'secondary'}
            size="sm"
            className={`${selectedCharacter === char ? 'ring-1 ring-offset-1 ring-brand-accent' : ''}`}
          >
            {getCharacterKoreanName(char)} 기록
          </Button>
        ))}
      </div>

      {selectedCharacter && (
        <>
          <div className="mb-4 flex justify-center gap-2">
            <Button
              onClick={() => setViewMode('raw')}
              variant={viewMode === 'raw' ? 'primary' : 'outline'}
              size="sm"
            >
              원본 대화
            </Button>
            <Button
              onClick={() => setViewMode('summarized')}
              variant={viewMode === 'summarized' ? 'primary' : 'outline'}
              size="sm"
            >
              요약본
            </Button>
          </div>
           <div className="mb-4 flex justify-center gap-2">
            <Button
                onClick={handleExportRawPdf}
                variant="outline"
                size="sm"
                disabled={!selectedCharacter || viewMode !== 'raw' || !chatHistories[selectedCharacter] || chatHistories[selectedCharacter].length === 0}
              >
              원본 PDF로 내보내기
            </Button>
            <Button
                onClick={handleExportSummaryPdf}
                variant="outline"
                size="sm"
                disabled={!selectedCharacter || viewMode !== 'summarized' || !summarizedLogs[selectedCharacter]}
              >
              요약본 PDF로 내보내기
            </Button>
          </div>
        </>
      )}

      <div className="flex-grow bg-white border border-neutral-medium/30 rounded-lg p-4 overflow-y-auto shadow-inner min-h-[300px] max-h-[calc(50vh+20px)]"> {/* Adjusted max-height */}
        {selectedCharacter ? (
          viewMode === 'raw' ? (
            chatHistories[selectedCharacter].length > 0 ? (
              chatHistories[selectedCharacter].map((msg: Message, index: number) => (
                <div key={index} className={`mb-2 p-2 rounded-md text-sm ${msg.sender === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <span className={`font-semibold ${msg.sender === 'user' ? 'text-brand-secondary' : 'text-neutral-dark'}`}>
                    {msg.sender === 'user' ? '수사관' : getCharacterKoreanName(selectedCharacter)}:
                  </span>
                  <span className="ml-1 whitespace-pre-line">{msg.text}</span>
                  <p className="text-xs text-neutral-medium text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
            ) : (
              <p className="text-neutral-medium text-center py-10">{getCharacterKoreanName(selectedCharacter)}와의 대화 기록이 없습니다.</p>
            )
          ) : ( // Summarized view
            summarizedLogs[selectedCharacter] ? (
              <div className="prose prose-sm max-w-none whitespace-pre-line p-2">
                {summarizedLogs[selectedCharacter]}
              </div>
            ) : (
              <p className="text-neutral-medium text-center py-10">{getCharacterKoreanName(selectedCharacter)} 대화 요약본이 아직 없습니다.</p>
            )
          )
        ) : (
          <p className="text-neutral-medium text-center py-10">조회할 대상자의 기록을 선택해주세요.</p>
        )}
      </div>
    </div>
  );
};
