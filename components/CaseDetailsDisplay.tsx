
import React from 'react';
import type { CaseDetails } from '../types';

interface CaseDetailsDisplayProps {
  details: CaseDetails;
  className?: string;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 p-4 bg-brand-light/50 rounded-lg shadow">
    <h3 className="text-xl font-semibold text-brand-primary mb-2 border-b-2 border-brand-secondary/50 pb-1">{title}</h3>
    {children}
  </div>
);

export const CaseDetailsDisplay: React.FC<CaseDetailsDisplayProps> = ({ details, className }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold text-brand-dark mb-4 text-center">AI 생성 사건 정보</h2>
      
      <DetailSection title="사건 개요 (Case Overview)">
        <p className="text-neutral-dark whitespace-pre-line leading-relaxed">{details.overview}</p>
      </DetailSection>

      <DetailSection title="중요 쟁점 사항 (Key Issues)">
        {details.issues && details.issues.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-neutral-dark pl-2">
            {details.issues.map((issue, index) => (
              <li key={index} className="leading-relaxed">{issue}</li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-medium">정보 없음</p>
        )}
      </DetailSection>

      <DetailSection title="수사 계획 (Investigation Plan)">
        {details.plan && details.plan.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-neutral-dark pl-2">
            {details.plan.map((step, index) => (
              <li key={index} className="leading-relaxed">{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-medium">정보 없음</p>
        )}
      </DetailSection>
    </div>
  );
};
