const express = require('express');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

// قراءة الكوكيز من الملف
let agent;
try {
    const cookies = JSON.parse(fs.readFileSync('cookies.json'));
    agent = ytdl.createAgent(cookies);
    console.log('Cookies loaded successfully!');
} catch (error) {
    console.error('Error loading cookies:', error.message);
}

app.get('/', (req, res) => res.send('Server with Cookies is ON! 🍪'));

app.get('/play', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('No ID');

        const url = 'https://www.youtube.com/watch?v=' + id;
        console.log('Requesting:', url);

        // استخدام الـ agent (الكوكيز) في الطلب
        if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

        const info = await ytdl.getInfo(url, { agent });
        
        res.header('Content-Type', 'audio/mpeg');
        
        ytdl.downloadFromInfo(info, {
            agent: agent, // تمرير الكوكيز هنا مهم جداً
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error: ' + err.message);
    }
});

app.listen(port, () => console.log(`Listening on ${port}`));
