'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  searchTerm: string;
  onResultClick: (url: string) => void;
}

export default function SearchModal({ isOpen, setIsOpen, searchTerm, onResultClick }: SearchModalProps) {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm.trim()) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `/api/search?query=${encodeURIComponent(searchTerm)}`
          );
          const data = response.data || null;
          if (data && (data.courses?.length > 0 || data.quizzes?.length > 0)) {
            setSearchResults(data);
          } else {
            setSearchResults(null);
          }
        } catch (error) {
          console.error("Error fetching search results:", error);
          setSearchResults(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSearchResults();
  }, [searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Results</DialogTitle>
          <DialogDescription>Results for "{searchTerm}"</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchResults?.courses?.length > 0 ||
            searchResults?.games?.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {searchResults.courses?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Courses</h3>
                  <ul className="space-y-2">
                    {searchResults.courses.map((course: any) => (
                      <li
                        key={course.id}
                        className="bg-muted rounded-md p-2 hover:bg-muted/80 transition-colors"
                      >
                        <button
                          onClick={() => onResultClick(`/dashboard/course/${course.slug}`)}
                          className="w-full text-left hover:text-primary"
                        >
                          {course.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchResults.games?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Quizzes</h3>
                  <ul className="space-y-2">
                    {searchResults.games.map((quiz: any) => (
                      <li
                        key={quiz.id}
                        className="bg-muted rounded-md p-2 hover:bg-muted/80 transition-colors"
                      >
                        <button
                          onClick={() => onResultClick(`/dashboard/mcq/${quiz.id}`)}
                          className="w-full text-left hover:text-primary"
                        >
                          {quiz.topic}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No results found.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

