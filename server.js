const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('MTA Music Server is Running on Render! 🚀');
});

app.get('/play', async (req, res) => {
    try {
        const videoId = req.query.id;
        if (!videoId) return res.status(400).send('No Video ID');

        const url = 'https://www.youtube.com/watch?v=' + videoId;
        console.log('Streaming:', videoId);

        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        // إجبار المتصفح/اللعبة على التعامل معه كملف صوتي
        res.header('Content-Type', 'audio/mpeg');

        // تحويل البث
        ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25 
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});