const express = require('express');

const router = express.Router();

// Mock courses data
const mockCourses = [
  {
    id: '1',
    title: 'AI Fundamentals',
    description: 'Learn the basics of AI and machine learning',
    instructor: 'Dr. Smith',
    lessons: ['What is AI?', 'Machine Learning Basics', 'Neural Networks'],
    enrolled: false
  },
  {
    id: '2',
    title: 'Deep Learning Mastery',
    description: 'Advanced deep learning techniques and applications',
    instructor: 'Prof. Johnson',
    lessons: ['CNNs', 'RNNs', 'Transformers', 'Attention Mechanisms'],
    enrolled: false
  },
  {
    id: '3',
    title: 'Natural Language Processing',
    description: 'NLP with Python and modern techniques',
    instructor: 'Dr. Lee',
    lessons: ['Text Processing', 'Word Embeddings', 'Transformers for NLP'],
    enrolled: false
  },
  {
    id: '4',
    title: 'Computer Vision',
    description: 'Image processing and computer vision applications',
    instructor: 'Prof. Chen',
    lessons: ['Image Basics', 'Feature Detection', 'Object Detection'],
    enrolled: false
  }
];

// Get all courses
router.get('/', (req, res) => {
  res.json(mockCourses);
});

// Get enrolled courses for user
router.get('/enrolled', (req, res) => {
  res.json(mockCourses.filter(c => c.enrolled));
});

// Create course (mock)
router.post('/', (req, res) => {
  const { title, description, lessons } = req.body;
  const newCourse = {
    id: Date.now().toString(),
    title: title || 'New Course',
    description: description || '',
    instructor: 'You',
    lessons: lessons || [],
    enrolled: false
  };
  res.json(newCourse);
});

// Enroll in course
router.post('/:id/enroll', (req, res) => {
  const course = mockCourses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }
  course.enrolled = true;
  res.json({ message: 'Enrolled successfully', course });
});

module.exports = router;