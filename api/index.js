const ytdl = require('@distube/ytdl-core');

module.exports = async function handler(req, res) {
    // CORS errors ko khatam karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    try {
        // 🛠️ FIX 1: YouTube URL se '?si=' wale extra share codes hata do
        const cleanUrl = fullUrl.split('?si=')[0].split('&')[0];
        
        // Video ki details nikalo
        const info = await ytdl.getInfo(cleanUrl);
        
        // 🛠️ FIX 2: Sabse best audio format select karo
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        
        if (format && format.url) {
            return res.status(200).json({ audioUrl: format.url });
        } else {
            return res.status(500).json({ error: "Is video ka audio format nahi mil raha!" });
        }
    } catch (error) {
        console.error("YouTube Fetch Error:", error.message);
        
        // 🛠️ FIX 3: Ab error message seedha aapke admin panel ke popup (alert) mein dikhega!
        return res.status(500).json({ 
            error: "YouTube Error: " + error.message 
        });
    }
};
