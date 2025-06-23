import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(cors({
   origin:"https://frontend-eosin-three-pm5edn61o0.vercel.app"
  }));

const SONGS_DIR = path.join(__dirname, 'song');

// Serve static files (songs)
app.use('/songs', express.static(SONGS_DIR));

// Search for a song by name (case-insensitive, without extension)
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'No search query provided.' });

  const files = fs.readdirSync(SONGS_DIR);
  const found = files.find(f => path.parse(f).name.toLowerCase() === query.toLowerCase());

  if (!found) {
    return res.status(404).json({ message: 'Song not found.' });
  }

  // Get song duration
  const filePath = path.join(SONGS_DIR, found);
  let duration = 0;
  try {
    const metadata = await parseFile(filePath);
    duration = metadata.format.duration;
  } catch (e) {
    duration = 0;
  }

  res.json({
    song: found,
    url: `/songs/${encodeURIComponent(found)}`,
    duration
  });
});

// Get song duration by filename
app.get('/api/song-duration', async (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ message: 'No filename provided.' });
  const filePath = path.join(SONGS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Song not found.' });
  try {
    const metadata = await parseFile(filePath);
    res.json({ duration: metadata.format.duration });
  } catch (e) {
    res.status(500).json({ message: 'Could not read song metadata.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
