export default async function handler(req, res) {
    // CORS error ko hamesha ke liye khatam karne ke headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "URL is missing!" });

    // Video ID extract karna
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].substring(0, 11);
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].substring(0, 11);
    else if (url.length === 11) videoId = url;

    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    // Piped APIs ki list (Server-to-Server mein CORS error nahi aata!)
    const apis = [
        `https://pipedapi.kavin.rocks/streams/${videoId}`,
        `https://pipedapi.tokhmi.xyz/streams/${videoId}`,
        `https://pipedapi.smnz.de/streams/${videoId}`,
        `https://api.piped.projectsegfau.lt/streams/${videoId}`
    ];

    let audioUrl = "";

    // Har server ko chupke se check karega
    for (let apiUrl of apis) {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) continue;
            
            const data = await response.json();
            if (data.audioStreams && data.audioStreams.length > 0) {
                audioUrl = data.audioStreams[0].url;
                break; // Aawaz milte hi loop tod do
            }
        } catch (error) {
            continue; // Fail hone par agla server try karo
        }
    }

    // Agar audio mil gaya toh phone ko bhej do
    if (audioUrl) {
        res.status(200).json({ audioUrl: audioUrl });
    } else {
        res.status(500).json({ error: "Saare server down hain, Audio nahi mila!" });
    }
}
