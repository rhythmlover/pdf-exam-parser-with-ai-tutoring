import React from 'react';
import { AnswerResult } from '../types';
import AnswerFeedback from './AnswerFeedback';

interface MultipleChoiceQuestionProps {
  questionId: number;
  options: string[];
  selectedAnswer: string;
  isSubmitted: boolean;
  result: AnswerResult | undefined;
  onAnswerChange: (id: number, answer: string) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  questionId,
  options,
  selectedAnswer,
  isSubmitted,
  result,
  onAnswerChange,
}) => {
  return (
    <>
      <div className="space-y-2 mb-4">
        {options.map((option, idx) => (
          <label
            key={idx}
            className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
              isSubmitted ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="radio"
              name={`question-${questionId}`}
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => onAnswerChange(questionId, e.target.value)}
              disabled={isSubmitted}
              className="w-4 h-4 text-indigo-600 disabled:cursor-not-allowed"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
      <AnswerFeedback result={result} />
    </>
  );
};

export default MultipleChoiceQuestion;