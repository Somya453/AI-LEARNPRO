require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

const app = express();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// Config endpoint for client-side Supabase initialization
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_ANON_KEY
    });
});

// AI Tutor endpoint
app.post('/api/ai', async (req, res) => {
    const { message } = req.body;
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an AI tutor specializing in artificial intelligence, machine learning, and data science. Provide helpful, accurate explanations.' },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        const data = await response.json();
        
        if (!response.ok) {
            console.error('OpenAI API error response:', data);
            
            // Handle specific OpenAI errors
            if (data.error?.code === 'insufficient_quota') {
                return res.status(402).json({ 
                    error: 'AI service quota exceeded', 
                    details: 'Please add credits to your OpenAI account or use a different API key.' 
                });
            }
            
            return res.status(500).json({ error: 'AI service unavailable', details: data.error?.message || 'Unknown error' });
        }
        
        if (!data.choices || !data.choices[0]) {
            console.error('Unexpected OpenAI response structure:', data);
            return res.status(500).json({ error: 'Invalid AI response format' });
        }
        
        res.json({ response: data.choices[0].message.content.trim() });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'AI service unavailable' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));