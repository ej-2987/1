
import React from 'react';

interface ComplaintDisplayProps {
  complaint: string;
  className?: string;
}

export const ComplaintDisplay: React.FC<ComplaintDisplayProps> = ({ complaint, className }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold text-brand-dark mb-4 text-center">AI 생성 고소장 (모의)</h2>
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg shadow prose prose-sm max-w-none">
        <p className="text-neutral-dark whitespace-pre-line leading-relaxed">{complaint}</p>
      </div>
       <p className="text-xs text-neutral-medium mt-1 text-center">
          이 고소장은 AI가 생성한 모의 내용으로, 감정적이고 비논리적인 특징을 가집니다.
        </p>
    </div>
  );
};
