export default async function handler(req, res) {
    // Ye 3 lines CORS error ko hamesha ke liye khatam kar dengi!
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Browser ki pre-flight request ko pass karna
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Frontend se YouTube URL lena
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "URL is missing!" });

    try {
        // Humara server backend se chupke se audio nikalega
        const response = await fetch("https://api.cobalt.tools/api/json", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: videoUrl,
                aFormat: "mp3",
                isAudioOnly: true
            })
        });

        const data = await response.json();
        
        // Agar audio ka link mil gaya, toh frontend (aapke phone) ko bhej do
        if (data.url) {
            res.status(200).json({ audioUrl: data.url });
        } else {
            res.status(500).json({ error: "Audio nahi mila!" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server fail ho gaya!" });
    }
}
