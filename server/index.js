require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

app.post('/api/extract-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { mimetype, buffer, originalname } = req.file;

  try {
    let text = '';

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname?.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimetype === 'text/plain' || originalname?.toLowerCase().endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.' });
    }

    const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!cleaned) return res.status(422).json({ error: 'Could not extract any text from the file.' });

    res.json({ text: cleaned });
  } catch (err) {
    console.error('Extract error:', err.message);
    res.status(500).json({ error: 'Failed to extract text from file.' });
  }
});

app.post('/api/analyze-match', async (req, res) => {
  const { jobTitle, company, jobNotes, resumeText } = req.body;

  if (!resumeText?.trim()) {
    return res.status(400).json({ error: 'Resume text is required' });
  }
  if (!jobTitle || !company) {
    return res.status(400).json({ error: 'Job title and company are required' });
  }

  const jobContext = [
    `Title: ${jobTitle}`,
    `Company: ${company}`,
    jobNotes ? `Job Description / Notes:\n${jobNotes}` : ''
  ].filter(Boolean).join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `You are a career coach and ATS expert. Analyze how well this resume matches the job posting.

JOB DETAILS:
${jobContext}

RESUME:
${resumeText}

Respond ONLY with valid JSON — no markdown, no extra text:
{
  "match_percentage": <integer 0-100>,
  "strengths": [<up to 3 short strings of what aligns well>],
  "missing_skills": [<up to 5 skills or keywords the resume lacks>],
  "suggestions": [<up to 4 concrete resume improvement tips>]
}`
      }]
    });

    const text = completion.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model did not return valid JSON');

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: err.message || 'Analysis failed. Check your API key and try again.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI proxy server running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set in server/.env');
  }
});
