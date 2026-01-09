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
        // إنشاء الوكيل
        agent = ytdl.createAgent(cookies);
        console.log('✅ Cookies loaded!');
    } else {
        console.log('⚠️ No cookies found!');
    }
} catch (error) {
    console.error('❌ Cookie Error:', error.message);
}

app.get('/', (req, res) => res.send('Server Active 🎵'));

app.get('/play', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('No ID');

        const url = 'https://www.youtube.com/watch?v=' + id;
        console.log('Requesting:', url);

        // 1. جلب المعلومات (لاحظ أن agent أصبح خارج requestOptions)
        const info = await ytdl.getInfo(url, { 
            agent: agent,
            requestOptions: {
                // إجبار IPv4 لأن Render يستخدم IPv6 المحظور
                family: 4 
            }
        });

        // 2. اختيار الصيغة
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio', 
            filter: 'audioonly' 
        });

        if (!format) return res.status(404).send('No Format Found');

        res.header('Content-Type', 'audio/mpeg');

        // 3. التحميل
        ytdl.downloadFromInfo(info, {
            agent: agent,
            format: format,
            requestOptions: {
                family: 4 // إجبار IPv4 أثناء التحميل أيضاً
            },
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send(err.message);
    }
});

app.listen(port, () => console.log(`Listening on ${port}`));
