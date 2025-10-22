'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SearchResult } from '@/types';

export default function SearchPage() {
  const [textQuery, setTextQuery] = useState('');
  const [imageQuery, setImageQuery] = useState<string | null>(null);
  const [playerFilter, setPlayerFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [gradeMin, setGradeMin] = useState('');
  const [gradeMax, setGradeMax] = useState('');
  const [textWeight, setTextWeight] = useState(0.5);
  const [imageWeight, setImageWeight] = useState(0.5);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageQuery(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textQuery: textQuery || undefined,
          imageQuery: imageQuery || undefined,
          filters: {
            player: playerFilter || undefined,
            year: yearFilter || undefined,
            brand: brandFilter || undefined,
            gradeMin: gradeMin ? parseFloat(gradeMin) : undefined,
            gradeMax: gradeMax ? parseFloat(gradeMax) : undefined,
          },
          weights: {
            text: textWeight,
            image: imageWeight,
          },
          limit: 20,
        }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Upload
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">Search Collection</h1>
          <p className="text-gray-300 text-lg">Find cards using text, images, and filters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Search Options</h2>

              {/* Text Query */}
              <div className="mb-4">
                <label className="text-white text-sm mb-2 block">Text Search</label>
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="e.g., LeBron James rookie"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="text-white text-sm mb-2 block">Image Search</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                  {imageQuery ? (
                    <div className="relative w-full h-full">
                      <Image src={imageQuery} alt="Query" fill className="object-contain rounded-lg" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Upload similar card</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                {imageQuery && (
                  <button
                    onClick={() => setImageQuery(null)}
                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Weights */}
              {textQuery && imageQuery && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <label className="text-white text-sm mb-2 block">Search Weights</label>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Text</span>
                      <span>{(textWeight * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={textWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTextWeight(val);
                        setImageWeight(1 - val);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Image</span>
                      <span>{(imageWeight * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={imageWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setImageWeight(val);
                        setTextWeight(1 - val);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="border-t border-white/20 pt-4 mb-4">
                <h3 className="text-white text-sm font-semibold mb-3">Filters</h3>
                
                <input
                  type="text"
                  value={playerFilter}
                  onChange={(e) => setPlayerFilter(e.target.value)}
                  placeholder="Player name"
                  className="w-full px-3 py-2 mb-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                
                <input
                  type="text"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="Year"
                  className="w-full px-3 py-2 mb-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                
                <input
                  type="text"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  placeholder="Brand"
                  className="w-full px-3 py-2 mb-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={gradeMin}
                    onChange={(e) => setGradeMin(e.target.value)}
                    placeholder="Min grade"
                    step="0.5"
                    className="px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="number"
                    value={gradeMax}
                    onChange={(e) => setGradeMax(e.target.value)}
                    placeholder="Max grade"
                    step="0.5"
                    className="px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {results.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Results ({results.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:border-purple-500/50 transition-all"
                    >
                      <div className="relative w-full h-64 bg-black/20 rounded-lg mb-3 overflow-hidden">
                        <Image
                          src={card.imageUrl}
                          alt={card.player || 'Card'}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-bold text-lg">{card.player || 'Unknown Player'}</h3>
                          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded">
                            {(card.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {card.year && (
                            <div>
                              <span className="text-gray-400">Year:</span>
                              <span className="text-white ml-1">{card.year}</span>
                            </div>
                          )}
                          {card.brand && (
                            <div>
                              <span className="text-gray-400">Brand:</span>
                              <span className="text-white ml-1">{card.brand}</span>
                            </div>
                          )}
                          {card.psaGrade && (
                            <div>
                              <span className="text-gray-400">Grade:</span>
                              <span className="text-white ml-1">{card.psaGrade}</span>
                            </div>
                          )}
                          {card.cardNumber && (
                            <div>
                              <span className="text-gray-400">Number:</span>
                              <span className="text-white ml-1">{card.cardNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-300 text-lg">
                  {isSearching ? 'Searching...' : 'Enter a search query to find cards'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


