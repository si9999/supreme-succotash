const express = require('express');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

// تحميل الكوكيز
let agent;
try {
    if (fs.existsSync('cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json'));
        agent = ytdl.createAgent(cookies);
        console.log('✅ Cookies loaded!');
    }
} catch (error) {
    console.error('❌ Cookie Error:', error.message);
}

app.get('/', (req, res) => res.send('Server Active (Universal Mode) 🎵'));

app.get('/play', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('No ID');

        const url = 'https://www.youtube.com/watch?v=' + id;
        console.log('Requesting:', url);

        // 1. جلب المعلومات مع إجبار IPv4
        const info = await ytdl.getInfo(url, { 
            agent: agent,
            requestOptions: { family: 4 }
        });

        console.log(`Found ${info.formats.length} formats.`);

        // 2. اختيار الصيغة (التعديل هنا)
        // بدلاً من audioonly، سنبحث عن أي صيغة تحتوي على صوت
        let format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio', 
            filter: 'audioonly' 
        });

        // إذا لم يجد صوت فقط، ابحث عن أي فيديو فيه صوت (خطة بديلة)
        if (!format) {
            console.log('Audio-only failed, searching for any audio track...');
            format = ytdl.chooseFormat(info.formats, { 
                filter: format => format.hasAudio 
            });
        }

        if (!format) return res.status(404).send('No Playable Format Found');

        console.log('Playing format:', format.mimeType);

        // مهم: إخبار المتصفح بنوع الملف الحقيقي
        // إذا كان فيديو، MTA سيشغل الصوت فقط، لا تقلق
        res.header('Content-Type', format.mimeType.split(';')[0]); // audio/mpeg or video/mp4

        // 3. التحميل
        ytdl.downloadFromInfo(info, {
            agent: agent,
            format: format,
            requestOptions: { family: 4 },
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send(err.message);
    }
});

app.listen(port, () => console.log(`Listening on ${port}`));
