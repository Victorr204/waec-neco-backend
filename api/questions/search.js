import { db } from '../../lib/firebase.js';
import cors from 'cors';

const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS']
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 3 characters'
      });
    }

    const searchTerm = q.toLowerCase();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startAt = (pageNum - 1) * limitNum;

    // Get all questions (Firestore doesn't support full-text search natively)
    // For production, consider using Algolia or similar
    const snapshot = await db.collection('questions').get();
    const allQuestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Simple client-side search
    const results = allQuestions.filter(q => 
      q.question?.toLowerCase().includes(searchTerm) ||
      q.explanation?.toLowerCase().includes(searchTerm) ||
      q.subject?.toLowerCase().includes(searchTerm) ||
      q.topic?.toLowerCase().includes(searchTerm)
    );

    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(startAt, startAt + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
}