export interface Question {
  id: number;
  text: string;
  type: string;
  options?: string[];
  points?: number;
  image?: string;
}

export interface ExamPaper {
  title: string;
  questions: Question[];
  total_points: number;
  images: string[];
  answer_key?: { [key: string]: string };
  exam_id?: string;
}

export interface Answer {
  questionId: number | string;
  answer: string;
}

export interface AnswerResult {
  question_id: number | string;
  submitted: boolean;
  is_correct: boolean | null;
  message: string;
  correct_answer: string | null;
  points_awarded: number;
  points_possible: number;
}

export interface AIResponse {
  model: string;
  response: string;
}