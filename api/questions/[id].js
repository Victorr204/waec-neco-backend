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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
    }

    const doc = await db.collection('questions').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Increment view count
    await db.collection('questions').doc(id).update({
      'stats.views': (doc.data().stats?.views || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
}