import React from 'react';
import { AnswerResult } from '../types';
import AnswerFeedback from './AnswerFeedback';

interface TextAnswerQuestionProps {
  questionId: number;
  answer: string;
  isSubmitted: boolean;
  result: AnswerResult | undefined;
  onAnswerChange: (id: number, answer: string) => void;
}

const TextAnswerQuestion: React.FC<TextAnswerQuestionProps> = ({
  questionId,
  answer,
  isSubmitted,
  result,
  onAnswerChange,
}) => {
  return (
    <>
      <textarea
        value={answer}
        onChange={(e) => onAnswerChange(questionId, e.target.value)}
        placeholder="Type your answer here..."
        disabled={isSubmitted}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 ${
          isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        rows={4}
      />
      <AnswerFeedback result={result} />
    </>
  );
};

export default TextAnswerQuestion;