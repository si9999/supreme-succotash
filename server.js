const express = require('express');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

// إعداد الوكيل (Agent) مع الكوكيز فقط (بدون تعقيدات)
let agent;
try {
    if (fs.existsSync('cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json'));
        // استخدام الكوكيز بالإعدادات الافتراضية لتجنب أخطاء الشبكة
        agent = ytdl.createAgent(cookies);
        console.log('✅ Cookies loaded successfully!');
    } else {
        console.log('⚠️ cookies.json not found!');
    }
} catch (error) {
    console.error('❌ Error loading cookies:', error.message);
}

app.get('/', (req, res) => res.send('Server is ON (Stable Mode) 🚀'));

app.get('/play', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('No ID');

        const url = 'https://www.youtube.com/watch?v=' + id;
        console.log('Requesting:', url);

        if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

        // خيارات الطلب (بدون إجبار IPv4 المعقد لتجنب المشاكل حالياً)
        const options = {
            agent: agent,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        };

        // 1. جلب المعلومات
        const info = await ytdl.getInfo(url, options);
        
        // 2. اختيار الصيغة
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio', 
            filter: 'audioonly' 
        });

        if (!format) {
            return res.status(404).send('Error: No playable format found');
        }

        res.header('Content-Type', 'audio/mpeg');
        
        // 3. التحميل
        ytdl.downloadFromInfo(info, {
            agent: agent,
            format: format,
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error: ' + err.message);
    }
});

app.listen(port, () => console.log(`Listening on ${port}`));
