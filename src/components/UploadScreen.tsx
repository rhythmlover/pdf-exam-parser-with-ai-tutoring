import React from 'react';
import { Upload, BookOpen, Loader2 } from 'lucide-react';

interface UploadScreenProps {
  loading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ loading, onFileUpload }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <BookOpen className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Paper AI Assistant</h1>
          <p className="text-gray-600">Upload a PDF exam paper to get started</p>
        </div>

        <label className="block">
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
            <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <span className="text-gray-700 font-medium">
              {loading ? 'Processing...' : 'Click to upload PDF'}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={onFileUpload}
              disabled={loading}
              className="hidden"
            />
          </div>
        </label>

        {loading && (
          <div className="mt-4 flex items-center justify-center text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Parsing exam paper and extracting answers...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadScreen;