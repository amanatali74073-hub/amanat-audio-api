module.exports = async function handler(req, res) {
    // CORS Errors ko khatam karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    try {
        // 1. YouTube URL se Video ID nikalo (Chahe link kaisa bhi ho)
        let videoId = "";
        if (fullUrl.includes("v=")) {
            videoId = fullUrl.split("v=")[1].substring(0, 11);
        } else if (fullUrl.includes("youtu.be/")) {
            videoId = fullUrl.split("youtu.be/")[1].substring(0, 11);
        }

        if (!videoId || videoId.length !== 11) {
            return res.status(400).json({ error: "Sahi YouTube URL nahi hai!" });
        }

        // 2. Duniya ke best aur working Piped Servers ki list
        const pipedServers = [
            "https://pipedapi.kavin.rocks",
            "https://pipedapi.tokhmi.xyz",
            "https://pipedapi.smnz.de",
            "https://piped-api.garudalinux.org"
        ];

        let audioUrl = null;

        // 3. Ek-ek karke server check karo (Agar ek down ho toh dusra try karega)
        for (let api of pipedServers) {
            try {
                // Vercel (Node 18+) mein by default 'fetch' kaam karta hai
                const response = await fetch(`${api}/streams/${videoId}`);
                
                if (!response.ok) continue; // Agar ye server down hai toh agla try karo
                
                const data = await response.json();
                
                // Audio streams filter karo aur link nikal lo
                if (data.audioStreams && data.audioStreams.length > 0) {
                    audioUrl = data.audioStreams[0].url;
                    break; // Link milte hi loop (searching) band kar do
                }
            } catch (e) {
                continue; // Error aaye toh chup-chap agla server try karo
            }
        }

        // 4. Final Result Admin Panel ko bhejo
        if (audioUrl) {
            return res.status(200).json({ audioUrl: audioUrl });
        } else {
            return res.status(500).json({ error: "Saare Piped servers fail ho gaye! Baad mein try karein." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Vercel Error: " + error.message });
    }
};
