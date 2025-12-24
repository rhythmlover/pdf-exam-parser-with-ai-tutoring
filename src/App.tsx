import React, { useState } from 'react';
import { ExamPaper, AnswerResult, AIResponse } from './types';
import { uploadExamPaper, submitAnswer, askAI } from './services/api';
import UploadScreen from './components/UploadScreen';
import ExamHeader from './components/ExamHeader';
import ReferenceImages from './components/ReferenceImages';
import QuestionCard from './components/QuestionCard';

const ExamApp = () => {
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Map<number | string, string>>(new Map());
  const [answerResults, setAnswerResults] = useState<Map<number | string, AnswerResult>>(new Map());
  const [aiResponses, setAiResponses] = useState<Map<number, AIResponse>>(new Map());
  const [activeAI, setActiveAI] = useState<number | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | string | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await uploadExamPaper(file);
      setExamPaper(data);
      resetState();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setAnswers(new Map());
    setAnswerResults(new Map());
    setTotalScore(0);
    setTotalPossible(0);
    setAiResponses(new Map());
    setActiveAI(null);
  };

  const handleAnswerChange = (questionId: number | string, answer: string) => {
    if (answerResults.has(questionId)) return;
    
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    setAnswers(newAnswers);
  };

  const handleSubmitAnswer = async (questionId: number | string) => {
    const answer = answers.get(questionId);
    const question = examPaper?.questions.find(
      q => q.id === (typeof questionId === 'string' ? parseInt(questionId.split('-')[0]) : questionId)
    );
    
    if (!answer || !question || answerResults.has(questionId)) return;

    setSubmitting(questionId);

    try {
      const result = await submitAnswer(questionId, answer, question.text, examPaper?.exam_id);
      const newResults = new Map(answerResults);
      newResults.set(questionId, result);
      setAnswerResults(newResults);
      
      setTotalScore(prev => prev + result.points_awarded);
      setTotalPossible(prev => prev + result.points_possible);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Error submitting answer. Check console for details.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleAskAI = async (questionId: number, model: 'Openai' | 'Anthropic') => {
    if (!aiQuestion.trim() || !examPaper) return;

    const question = examPaper.questions.find(q => q.id === questionId);
    if (!question) return;

    setAiLoading(true);

    try {
      const data = await askAI(
        question.text,
        aiQuestion,
        model,
        answers.get(questionId) || ''
      );
      const newResponses = new Map(aiResponses);
      newResponses.set(questionId, { model: data.model, response: data.response });
      setAiResponses(newResponses);
      setAiQuestion('');
    } catch (error) {
      console.error('Error asking AI:', error);
      alert('Error getting AI response. Check console for details.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleAI = (questionId: number) => {
    setActiveAI(activeAI === questionId ? null : questionId);
  };

  const handleUploadNew = () => {
    setExamPaper(null);
    resetState();
  };

  if (!examPaper) {
    return <UploadScreen loading={loading} onFileUpload={handleFileUpload} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamHeader
        examPaper={examPaper}
        totalScore={totalScore}
        totalPossible={totalPossible}
        onUploadNew={handleUploadNew}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ReferenceImages images={examPaper.images} />

        <div className="space-y-6">
          {examPaper.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answer={answers.get(question.id) || ''}
              answerResults={answerResults}
              submitting={submitting}
              activeAI={activeAI}
              aiQuestion={aiQuestion}
              aiLoading={aiLoading}
              aiResponse={aiResponses.get(question.id)}
              onAnswerChange={handleAnswerChange}
              onSubmitAnswer={handleSubmitAnswer}
              onToggleAI={handleToggleAI}
              onAIQuestionChange={setAiQuestion}
              onAskAI={handleAskAI}
              getAnswer={(id) => answers.get(id) || ''}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ExamApp;