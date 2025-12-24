import React from 'react';
import { Send, Brain, Loader2 } from 'lucide-react';
import { AIResponse } from '../types';

interface AIAssistantProps {
  questionId: number;
  aiQuestion: string;
  aiLoading: boolean;
  aiResponse: AIResponse | undefined;
  onQuestionChange: (question: string) => void;
  onAskAI: (model: 'Openai' | 'Anthropic') => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  aiQuestion,
  aiLoading,
  aiResponse,
  onQuestionChange,
  onAskAI,
}) => {
  return (
    <div className="border-t pt-4">
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={aiQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Ask a question about this problem..."
          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && onAskAI('Openai')}
        />
        <button
          onClick={() => onAskAI('Openai')}
          disabled={aiLoading || !aiQuestion.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          OpenAI
        </button>
        <button
          onClick={() => onAskAI('Anthropic')}
          disabled={aiLoading || !aiQuestion.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Claude
        </button>
      </div>

      {aiResponse && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">
              AI Response ({aiResponse.model})
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{aiResponse.response}</p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;