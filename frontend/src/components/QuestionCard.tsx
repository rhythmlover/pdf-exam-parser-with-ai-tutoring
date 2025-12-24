import React from 'react';
import { Brain, CheckCircle, Loader2 } from 'lucide-react';
import { Question, AnswerResult, AIResponse } from '../types';
import SubquestionInput from './SubquestionInput';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TextAnswerQuestion from './TextAnswerQuestion';
import AIAssistant from './AIAssistant';

interface QuestionCardProps {
  question: Question;
  answer: string;
  answerResults: Map<number | string, AnswerResult>;
  submitting: number | string | null;
  activeAI: number | null;
  aiQuestion: string;
  aiLoading: boolean;
  aiResponse: AIResponse | undefined;
  onAnswerChange: (questionId: number | string, answer: string) => void;
  onSubmitAnswer: (questionId: number | string) => void;
  onToggleAI: (questionId: number) => void;
  onAIQuestionChange: (question: string) => void;
  onAskAI: (questionId: number, model: 'Openai' | 'Anthropic') => void;
  getAnswer: (questionId: number | string) => string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  answerResults,
  submitting,
  activeAI,
  aiQuestion,
  aiLoading,
  aiResponse,
  onAnswerChange,
  onSubmitAnswer,
  onToggleAI,
  onAIQuestionChange,
  onAskAI,
  getAnswer,
}) => {
  const hasSubsections = question.text.includes('\n\na)') || question.text.includes('\n\nb)');
  const isSubmitted = answerResults.has(question.id);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Question {question.id}
          {question.points && <span className="text-sm text-gray-500 ml-2">({question.points} points)</span>}
        </h3>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
          {question.type.replace('_', ' ')}
        </span>
      </div>

      <div className="text-gray-700 mb-4">
        {question.text.split('\n\n').map((part, idx) => {
          const subsectionMatch = part.match(/^([a-z]\))\s*(.*)/s);
          
          if (subsectionMatch) {
            const [, label, content] = subsectionMatch;
            const subsectionId = `${question.id}-${label}`;
            return (
              <SubquestionInput
                key={idx}
                subsectionId={subsectionId}
                label={label}
                content={content}
                answer={getAnswer(subsectionId)}
                isSubmitted={answerResults.has(subsectionId)}
                isSubmitting={submitting === subsectionId}
                result={answerResults.get(subsectionId)}
                onAnswerChange={onAnswerChange}
                onSubmit={onSubmitAnswer}
              />
            );
          } else {
            return <p key={idx} className="whitespace-pre-wrap mb-2">{part}</p>;
          }
        })}
      </div>

      {question.image && (
        <img src={question.image} alt="Question diagram" className="mb-4 rounded border max-w-md" />
      )}

      {question.type === 'multiple_choice' && question.options ? (
        <MultipleChoiceQuestion
          questionId={question.id}
          options={question.options}
          selectedAnswer={answer}
          isSubmitted={isSubmitted}
          result={answerResults.get(question.id)}
          onAnswerChange={onAnswerChange}
        />
      ) : !hasSubsections ? (
        <TextAnswerQuestion
          questionId={question.id}
          answer={answer}
          isSubmitted={isSubmitted}
          result={answerResults.get(question.id)}
          onAnswerChange={onAnswerChange}
        />
      ) : null}

      <div className="flex gap-2 mb-4">
        {!hasSubsections && (
          <button
            onClick={() => onSubmitAnswer(question.id)}
            disabled={!answer || submitting === question.id || isSubmitted}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting === question.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {isSubmitted ? 'Submitted' : 'Check Answer'}
          </button>
        )}
        <button
          onClick={() => onToggleAI(question.id)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Ask AI
        </button>
      </div>

      {activeAI === question.id && (
        <AIAssistant
          questionId={question.id}
          aiQuestion={aiQuestion}
          aiLoading={aiLoading}
          aiResponse={aiResponse}
          onQuestionChange={onAIQuestionChange}
          onAskAI={(model) => onAskAI(question.id, model)}
        />
      )}
    </div>
  );
};

export default QuestionCard;