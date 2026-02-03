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
    // Get all questions for aggregation
    const snapshot = await db.collection('questions').get();
    const questions = snapshot.docs.map(doc => doc.data());

    // Aggregate data
    const subjects = new Set();
    const years = new Set();
    const examTypes = new Set();
    const difficulties = new Set();
    const topics = new Set();

    let totalQuestions = questions.length;
    let totalViews = 0;

    questions.forEach(q => {
      if (q.subject) subjects.add(q.subject);
      if (q.year) years.add(q.year);
      if (q.examType) examTypes.add(q.examType);
      if (q.difficulty) difficulties.add(q.difficulty);
      if (q.topic) topics.add(q.topic);
      if (q.stats?.views) totalViews += q.stats.views;
    });

    // Get recent imports
    const recentImports = await db.collection('questions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recent = recentImports.docs.map(doc => ({
      id: doc.id,
      subject: doc.data().subject,
      year: doc.data().year,
      examType: doc.data().examType,
      createdAt: doc.data().createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalQuestions,
          totalViews,
          averageViews: totalQuestions > 0 ? Math.round(totalViews / totalQuestions) : 0
        },
        filters: {
          subjects: Array.from(subjects).sort(),
          years: Array.from(years).sort((a, b) => b - a),
          examTypes: Array.from(examTypes).sort(),
          difficulties: Array.from(difficulties).sort(),
          topics: Array.from(topics).filter(t => t).sort()
        },
        recentImports: recent
      }
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filters'
    });
  }
}