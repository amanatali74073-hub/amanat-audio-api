import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
    // CORS errors ko khatam karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    try {
        // YouTube video ki details direct fetch karo
        const info = await ytdl.getInfo(fullUrl);
        
        // Sirf audio formats filter karo
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        if (audioFormats.length > 0) {
            // Sabse acchi quality ka audio URL nikalo
            const audioUrl = audioFormats[0].url;
            return res.status(200).json({ audioUrl: audioUrl });
        } else {
            return res.status(500).json({ error: "Audio format nahi mila!" });
        }
    } catch (error) {
        console.error("YouTube Fetch Error:", error);
        return res.status(500).json({ error: "YouTube se audio nikalne mein problem hui!" });
    }
}
