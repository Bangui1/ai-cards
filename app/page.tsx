'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PSACardData {
  isValid: boolean;
  error?: string;
  player?: string;
  year?: string;
  brand?: string;
  cardNumber?: string;
  psaGrade?: string;
  certificationNumber?: string;
  sport?: string;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState<PSACardData | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setCardData(null);
        setSavedCardId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToCollection = async () => {
    if (!selectedImage) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedCardId(data.cardId);
      } else {
        alert(data.error || 'Failed to save card');
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeCard = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setCardData(null);

    try {
      const response = await fetch('/api/analyze-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      const data = await response.json();
      setCardData(data);
    } catch (error) {
      console.error('Error analyzing card:', error);
      setCardData({
        isValid: false,
        error: 'Failed to analyze card. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">NBA PSA Card Analyzer</h1>
          <p className="text-gray-300 text-lg mb-6">Upload an image of your NBA PSA graded card to extract its details</p>
          <div className="flex gap-4 justify-center">
            <a href="/search" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20">
              Search Collection
            </a>
            <a href="/chat" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20">
              Chat with Collection
            </a>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="mb-8">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {selectedImage && (
            <div className="mb-8">
              <div className="relative w-full h-96 bg-black/20 rounded-xl overflow-hidden">
                <Image
                  src={selectedImage}
                  alt="Selected PSA Card"
                  fill
                  className="object-contain"
                />
              </div>
              <button
                onClick={analyzeCard}
                disabled={isLoading}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Card'
                )}
              </button>
            </div>
          )}

          {cardData && (
            <div className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20">
              {cardData.isValid ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <svg className="w-8 h-8 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Card Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cardData.player && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Player</p>
                        <p className="text-white text-lg font-semibold">{cardData.player}</p>
                      </div>
                    )}
                    {cardData.year && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Year</p>
                        <p className="text-white text-lg font-semibold">{cardData.year}</p>
                      </div>
                    )}
                    {cardData.brand && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Brand</p>
                        <p className="text-white text-lg font-semibold">{cardData.brand}</p>
                      </div>
                    )}
                    {cardData.cardNumber && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Card Number</p>
                        <p className="text-white text-lg font-semibold">{cardData.cardNumber}</p>
                      </div>
                    )}
                    {cardData.psaGrade && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">PSA Grade</p>
                        <p className="text-white text-lg font-semibold">{cardData.psaGrade}</p>
                      </div>
                    )}
                    {cardData.certificationNumber && (
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Certification Number</p>
                        <p className="text-white text-lg font-semibold">{cardData.certificationNumber}</p>
                      </div>
                    )}
                  </div>
                  
                  {!savedCardId && (
                    <button
                      onClick={saveToCollection}
                      disabled={isSaving}
                      className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving to Collection...
                        </span>
                      ) : (
                        'Save to Collection'
                      )}
                    </button>
                  )}

                  {savedCardId && (
                    <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                      <p className="text-green-300 font-semibold flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Card saved to collection! (ID: {savedCardId.slice(0, 8)}...)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                    <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Invalid Card
                  </h2>
                  <p className="text-gray-300">{cardData.error || 'This does not appear to be a valid NBA PSA graded card.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
