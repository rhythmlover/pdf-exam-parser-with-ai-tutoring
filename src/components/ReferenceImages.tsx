import React, { useState } from 'react';

interface ReferenceImagesProps {
  images: string[];
}

const ReferenceImages: React.FC<ReferenceImagesProps> = ({ images }) => {
  const [isMinimized, setIsMinimized] = useState(true);

  if (images.length === 0) return null;

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Reference Images ({images.length})</h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          {isMinimized ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Minimize
            </>
          )}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt={`Page ${idx + 1}`} className="rounded border" />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceImages;