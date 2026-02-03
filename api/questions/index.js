import { db } from '../../lib/firebase.js';
import cors from 'cors';

const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
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
    const {
      subject,
      year,
      examType,
      difficulty,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db.collection('questions');

    // Apply filters
    if (subject) query = query.where('subject', '==', subject.toLowerCase());
    if (year) query = query.where('year', '==', parseInt(year));
    if (examType) query = query.where('examType', '==', examType);
    if (difficulty) query = query.where('difficulty', '==', difficulty);

    // Get total count first
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startAt = (pageNum - 1) * limitNum;

    // Apply sorting and pagination
    query = query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
                .offset(startAt)
                .limit(limitNum);

    const snapshot = await query.get();
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions',
      message: error.message
    });
  }
}