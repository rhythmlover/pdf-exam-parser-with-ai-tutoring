import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { AnswerResult } from '../types';
import AnswerFeedback from './AnswerFeedback';

interface SubquestionInputProps {
  subsectionId: string;
  label: string;
  content: string;
  answer: string;
  isSubmitted: boolean;
  isSubmitting: boolean;
  result: AnswerResult | undefined;
  onAnswerChange: (id: string, answer: string) => void;
  onSubmit: (id: string) => void;
}

const SubquestionInput: React.FC<SubquestionInputProps> = ({
  subsectionId,
  label,
  content,
  answer,
  isSubmitted,
  isSubmitting,
  result,
  onAnswerChange,
  onSubmit,
}) => {
  return (
    <div className="mb-4">
      <p className="whitespace-pre-wrap mb-2">
        <span className="font-bold">{label}</span> {content}
      </p>
      <input
        type="text"
        value={answer}
        onChange={(e) => onAnswerChange(subsectionId, e.target.value)}
        placeholder="Your answer..."
        disabled={isSubmitted}
        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      <AnswerFeedback result={result} />
      <button
        onClick={() => onSubmit(subsectionId)}
        disabled={!answer || isSubmitting || isSubmitted}
        className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle className="w-3 h-3" />
        )}
        {isSubmitted ? 'Submitted' : 'Check Answer'}
      </button>
    </div>
  );
};

export default SubquestionInput;