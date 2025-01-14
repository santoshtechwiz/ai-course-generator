'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchResponse } from '../types';



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
        onResultClick(selected.type === 'course' ? `/dashboard/course/${selected.slug}` : `/dashboard/mcq/${selected.id}`);
      }
    }
  };

  const renderSearchResult = (result: SearchResult, index: number) => (
    <motion.li
      key={result.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`bg-muted rounded-md p-2 hover:bg-muted/80 transition-colors ${
        index === selectedIndex ? 'bg-primary/20' : ''
      }`}
    >
      <button
        onClick={() => onResultClick(result.type === 'course' ? `/dashboard/course/${result.slug}` : `/dashboard/mcq/${result.id}`)}
        className="w-full text-left hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {result.name}
      </button>
    </motion.li>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses and quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchResults && (searchResults?.courses?.length > 0 || searchResults?.quizzes?.length > 0) ? (
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              <AnimatePresence>
                {searchResults.courses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="text-lg font-semibold mb-2">Courses</h3>
                    <ul className="space-y-2">
                      {searchResults.courses.map((course, index) => renderSearchResult(course, index))}
                    </ul>
                  </motion.div>
                )}
                {searchResults?.quizzes?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="text-lg font-semibold mb-2">Quizzes</h3>
                    <ul className="space-y-2">
                      {searchResults.quizzes.map((quiz, index) => renderSearchResult(quiz, searchResults.courses.length + index))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : searchTerm.trim() !== '' ? (
            <p className="text-center text-muted-foreground">
              No results found.
            </p>
          ) : null}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Press ↑↓ to navigate, Enter to select</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

