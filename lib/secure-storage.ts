import { AES, enc } from 'crypto-js';

// Environment variable for storage encryption (should be in .env)
const STORAGE_SECRET = process.env.NEXT_PUBLIC_STORAGE_SECRET || 'quiz-app-secret';

export class SecureStorageService {
  /**
   * Securely store data with encryption
   */
  static setItem(key: string, data: any): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Remove any sensitive fields
      const sanitizedData = SecureStorageService.sanitizeData(data);
      
      // Encrypt the data
      const encryptedData = AES.encrypt(
        JSON.stringify(sanitizedData),
        STORAGE_SECRET
      ).toString();
      
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
    }
  }
  
  /**
   * Retrieve and decrypt data
   */
  static getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;
      
      // Decrypt the data
      const bytes = AES.decrypt(encryptedData, STORAGE_SECRET);
      const decryptedString = bytes.toString(enc.Utf8);
      
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }
  
  /**
   * Remove sensitive information before storage
   */
  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    // Deep clone to avoid modifying original
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    if (clonedData.authState) delete clonedData.authState;
    if (clonedData.token) delete clonedData.token;
    
    // Sanitize answer data to remove correctAnswer fields when storing
    // user progress (to prevent cheating)
    if (clonedData.questions) {
      clonedData.questions = clonedData.questions.map((q: any) => {
        const question = { ...q };
        
        // Only keep necessary fields for later display
        if (!clonedData.isCompleted) {
          delete question.answer;
          delete question.correctAnswer;
          delete question.correctOptionId;
        }
        
        return question;
      });
    }
    
    return clonedData;
  }
}
