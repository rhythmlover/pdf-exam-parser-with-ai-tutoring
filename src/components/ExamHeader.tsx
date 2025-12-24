import React from 'react';
import { ExamPaper } from '../types';

interface ExamHeaderProps {
  examPaper: ExamPaper;
  totalScore: number;
  totalPossible: number;
  onUploadNew: () => void;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  examPaper,
  totalScore,
  totalPossible,
  onUploadNew,
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{examPaper.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {examPaper.questions.length} Questions • {examPaper.total_points} Total Points
              {examPaper.answer_key && ` • Score: ${totalScore}/${totalPossible}`}
            </p>
          </div>
          <button
            onClick={onUploadNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload New Exam
          </button>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;