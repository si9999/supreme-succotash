const express = require('express');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

// تحميل الكوكيز (للهوية)
let agent;
try {
    if (fs.existsSync('cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json'));
        agent = ytdl.createAgent(cookies);
        console.log('✅ Cookies loaded successfully!');
    } else {
        console.log('⚠️ cookies.json not found!');
    }
} catch (error) {
    console.error('❌ Error loading cookies:', error.message);
}

app.get('/', (req, res) => res.send('IPv4 Music Server is ON 🎵'));

app.get('/play', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('No ID');

        const url = 'https://www.youtube.com/watch?v=' + id;
        console.log('Requesting:', url);

        if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

        // إعدادات الاتصال: إجبار IPv4 (family: 4)
        // هذا هو الحل السحري لأغلب مشاكل Render
        const networkOptions = {
            agent: agent,
            requestOptions: {
                family: 4, 
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        };

        // 1. جلب المعلومات باستخدام IPv4
        const info = await ytdl.getInfo(url, networkOptions);
        
        // 2. اختيار الصيغة
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio', 
            filter: 'audioonly' 
        });

        if (!format) {
            console.log('Formats found but filtered out:', info.formats.length);
            return res.status(404).send('Error: No playable format found (Try another song)');
        }

        console.log('Playing format:', format.mimeType);

        res.header('Content-Type', 'audio/mpeg');
        
        // 3. التحميل
        ytdl.downloadFromInfo(info, {
            ...networkOptions, // استخدام نفس إعدادات الشبكة
            format: format,
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error: ' + err.message);
    }
});

app.listen(port, () => console.log(`Listening on ${port}`));
