
import React, { useState } from 'react';
import { Button } from './common/Button';

interface CaseInputFormProps {
  onSubmit: (precedentText: string) => void;
  isLoading: boolean;
}

export const CaseInputForm: React.FC<CaseInputFormProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="precedentText" className="block text-lg font-semibold text-brand-primary mb-2">
          판례 입력 (Case Precedent Input)
        </label>
        <textarea
          id="precedentText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full p-3 border border-neutral-medium/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors duration-200"
          placeholder="여기에 판례 내용을 입력하세요..."
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-medium mt-1">
          판례를 입력하면 AI가 사건 개요, 쟁점, 수사 계획을 생성합니다.
        </p>
      </div>
      <Button type="submit" disabled={isLoading || !text.trim()} className="w-full">
        {isLoading ? '생성 중...' : '사건 구성 요청'}
      </Button>
    </form>
  );
};
