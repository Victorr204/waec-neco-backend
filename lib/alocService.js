import axios from 'axios';
import { db } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

class AlocService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.ALOC_BASE_URL || 'https://questions.aloc.ng/api/v2',
      headers: {
        'Authorization': `Bearer ${process.env.ALOC_API_KEY}`,
        'Application-ID': process.env.ALOC_API_ID || '',
        'Application-Secret': process.env.ALOC_API_SECRET || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000, // 30 seconds timeout
      params: {
        type: 'api' // Some ALOC APIs require this
      }
    });

    // Common exam mappings
    this.examTypes = {
      'WAEC': 'waec',
      'JAMB': 'jamb', 
      'NECO': 'neco',
      'POST-UTME': 'post-utme',
      'NABTEB': 'nabteb'
    };
  }

  async fetchQuestionsFromAloc(params = {}) {
    try {
      console.log('Fetching from ALOC API:', params);
      
      // Transform params for ALOC API
      const alocParams = {
        subject: params.subject?.toLowerCase(),
        year: params.year,
        exam: params.exam_type ? this.examTypes[params.exam_type.toUpperCase()] : 'waec',
        limit: params.limit || 50,
        page: params.page || 1
      };

      // Remove undefined params
      Object.keys(alocParams).forEach(key => 
        alocParams[key] === undefined && delete alocParams[key]
      );

      const response = await this.api.get('/questions', { 
        params: alocParams 
      });

      console.log('ALOC API Response status:', response.status);
      
      // Handle different ALOC API response formats
      let questions = [];
      
      if (response.data.data && Array.isArray(response.data.data.questions)) {
        // Format 1: { data: { questions: [] } }
        questions = response.data.data.questions;
      } else if (response.data.questions && Array.isArray(response.data.questions)) {
        // Format 2: { questions: [] }
        questions = response.data.questions;
      } else if (Array.isArray(response.data)) {
        // Format 3: Direct array
        questions = response.data;
      } else {
        console.warn('Unexpected ALOC API format:', response.data);
        throw new Error('Unexpected ALOC API response format');
      }

      console.log(`Fetched ${questions.length} questions from ALOC`);
      return this.transformQuestions(questions);
      
    } catch (error) {
      console.error('ALOC API Error Details:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
        
        if (error.response.status === 401) {
          throw new Error('Invalid ALOC API credentials');
        } else if (error.response.status === 429) {
          throw new Error('ALOC API rate limit exceeded. Try again later.');
        } else if (error.response.status === 404) {
          throw new Error('ALOC API endpoint not found. Check base URL.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response from ALOC API. Check network.');
      }
      
      throw new Error(`ALOC API request failed: ${error.message}`);
    }
  }

  transformQuestions(alocQuestions) {
    return alocQuestions.map((q, index) => {
      // Handle different ALOC question formats
      const questionId = q.id || q.questionId || `aloc_${Date.now()}_${index}`;
      const questionText = q.question || q.questionText || q.question_body || '';
      const subject = (q.subject || q.subject_name || 'general').toLowerCase();
      
      // Parse options from different formats
      let options = [];
      if (q.options && typeof q.options === 'object') {
        // Format: { A: "text", B: "text", ... }
        options = Object.entries(q.options).map(([letter, text]) => ({
          id: uuidv4(),
          text: String(text),
          letter: letter.toUpperCase(),
          isCorrect: letter.toUpperCase() === (q.answer || q.correct_answer || '').toUpperCase()
        }));
      } else if (Array.isArray(q.options)) {
        // Format: [{text: "", isCorrect: false}, ...]
        options = q.options.map((opt, idx) => ({
          id: uuidv4(),
          text: opt.text || opt.option || '',
          letter: ['A', 'B', 'C', 'D', 'E'][idx] || String.fromCharCode(65 + idx),
          isCorrect: opt.isCorrect || opt.is_correct || false
        }));
      }

      return {
        id: uuidv4(),
        alocId: questionId,
        question: questionText,
        subject: subject,
        examType: (q.examType || q.exam_type || q.exam || 'WAEC').toUpperCase(),
        year: parseInt(q.year || q.exam_year || new Date().getFullYear()),
        options: options,
        correctAnswer: q.answer || q.correct_answer || q.correctAnswer || '',
        explanation: q.explanation || q.solution || '',
        difficulty: (q.difficulty || 'medium').toLowerCase(),
        topic: q.topic || q.chapter || '',
        imageUrl: q.imageUrl || q.image_url || q.image || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'ALOC API',
        metadata: {
          alocFormat: true,
          importedAt: new Date().toISOString()
        },
        stats: {
          views: 0,
          attempts: 0,
          correctAttempts: 0,
          popularity: 0
        }
      };
    });
  }

  async getAvailableSubjects() {
    try {
      const response = await this.api.get('/subjects');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return ['mathematics', 'english', 'physics', 'chemistry', 'biology'];
    }
  }

  async getAvailableYears(subject) {
    try {
      const response = await this.api.get('/years', {
        params: { subject: subject?.toLowerCase() }
      });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching years:', error);
      return [2023, 2022, 2021, 2020, 2019];
    }
  }

  async testConnection() {
    try {
      const response = await this.api.get('/', { timeout: 10000 });
      return {
        connected: true,
        message: 'Successfully connected to ALOC API',
        data: response.data
      };
    } catch (error) {
      return {
        connected: false,
        message: error.message,
        error: error.response?.data
      };
    }
  }
}

export default new AlocService();