import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AnswerResult } from '../types';

interface AnswerFeedbackProps {
  result: AnswerResult | undefined;
}

const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ result }) => {
  if (!result) return null;

  if (result.is_correct === null) {
    return (
      <div className="mt-3 p-3 bg-gray-100 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-700 font-medium">{result.message}</p>
        </div>
      </div>
    );
  }

  if (result.is_correct) {
    return (
      <div className="mt-3 p-3 bg-green-100 rounded-lg flex items-start gap-2">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-800 font-medium">{result.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-red-100 rounded-lg flex items-start gap-2">
      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 font-medium mb-1">{result.message}</p>
        {result.correct_answer && (
          <p className="text-red-700">
            <span className="font-semibold">Correct answer:</span> {result.correct_answer}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnswerFeedback;