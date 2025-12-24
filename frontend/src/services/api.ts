import { ExamPaper, AnswerResult } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const uploadExamPaper = async (file: File): Promise<ExamPaper> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to upload');
  return response.json();
};

export const submitAnswer = async (
  questionId: number | string,
  answer: string,
  questionText: string,
  examId?: string
): Promise<AnswerResult> => {
  const response = await fetch(`${API_BASE_URL}/api/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      answer: answer,
      question_text: questionText,
      exam_id: examId,
    }),
  });

  if (!response.ok) throw new Error('Failed to submit answer');
  return response.json();
};

export const askAI = async (
  questionText: string,
  userQuestion: string,
  model: 'Openai' | 'Anthropic',
  questionContext: string
): Promise<{ response: string; model: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/ask-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_text: questionText,
      user_question: userQuestion,
      model: model,
      question_context: questionContext,
    }),
  });

  if (!response.ok) throw new Error('Failed to get AI response');
  return response.json();
};