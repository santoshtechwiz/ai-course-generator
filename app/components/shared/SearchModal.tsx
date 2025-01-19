'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Search, X, Book, FileQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: number;
  name?: string;
  topic?: string;
  slug?: string;
  questionPreview?: string | null;
  quizType: string;
}

interface SearchResponse {
  courses: SearchResult[];
  quizzes: SearchResult[];
}

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onResultClick: (url: string) => void;
}

export default function SearchModal({ isOpen, setIsOpen, onResultClick }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const fetchSearchResults = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const response = await axios.get<SearchResponse>(
            `/api/search?query=${encodeURIComponent(query)}`
          );
          setSearchResults(response.data);
        } catch (error) {
          console.error("Error fetching search results:", error);
          setSearchResults(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSearchResults(searchTerm);
  }, [searchTerm, fetchSearchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        Math.min(prev + 1, (searchResults?.courses.length || 0) + (searchResults?.quizzes.length || 0) - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
      e.preventDefault();
      const allResults = [...(searchResults?.courses || []), ...(searchResults?.quizzes || [])];
      const selected = allResults[selectedIndex];
      if (selected) {
        handleResultClick(selected);
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log(result);
    const url = result.topic
      ? `/dashboard/${result.quizType === 'mcq' ? 'mcq' : 'openended'}/${result.slug}`
      : `/dashboard/course/${result.slug}`

    onResultClick(url);
    setIsOpen(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ?
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</span> : part
    );
  };

  const renderSearchResult = (result: SearchResult, index: number, type: 'course' | 'quiz') => (
    <motion.li
      key={result.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg p-3 transition-colors ${index === selectedIndex ? 'bg-primary/20' : 'hover:bg-muted/80'
        }`}
    >
      <button
        onClick={() => handleResultClick(result)}
        className="w-full text-left hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary flex items-start space-x-3"
      >
        {type === 'course' ? (
          <Book className="h-5 w-5 flex-shrink-0 mt-1" />
        ) : (
          <FileQuestion className="h-5 w-5 flex-shrink-0 mt-1" />
        )}
        <div className="flex-grow">
          <p className="font-medium text-base">
            {highlightMatch(result.name || result.topic || '', searchTerm)}
          </p>
          {type === 'quiz' && result.questionPreview && (
            <p className="text-sm text-muted-foreground mt-1">
              {highlightMatch(result.questionPreview, searchTerm)}
            </p>
          )}
        </div>
      </button>
    </motion.li>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Search Courses and Quizzes</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 flex-grow overflow-hidden flex flex-col">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-lg py-2"
              autoFocus
            />
            {searchTerm && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSearchTerm('')}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults && (searchResults?.courses?.length > 0 || searchResults?.quizzes?.length > 0) ? (
              <div className="space-y-6">
                <AnimatePresence>
                  {searchResults.courses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h3 className="text-xl font-semibold mb-3">Courses</h3>
                      <ul className="space-y-2">
                        {searchResults.courses.map((course, index) => renderSearchResult(course, index, 'course'))}
                      </ul>
                    </motion.div>
                  )}
                  {searchResults.quizzes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h3 className="text-xl font-semibold mb-3">Quizzes</h3>
                      <ul className="space-y-2">
                        {searchResults.quizzes.map((quiz, index) => renderSearchResult(quiz, searchResults.courses.length + index, 'quiz'))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : searchTerm.trim() !== '' ? (
              <p className="text-center text-muted-foreground text-lg py-8">
                No results found.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Press ↑↓ to navigate, Enter to select</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

