module.exports = async function handler(req, res) {
    // CORS errors ko rokne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    // 1. YouTube URL se Video ID nikalo
    let videoId = "";
    if (fullUrl.includes("v=")) videoId = fullUrl.split("v=")[1].substring(0, 11);
    else if (fullUrl.includes("youtu.be/")) videoId = fullUrl.split("youtu.be/")[1].substring(0, 11);

    // Agar link se ID nahi nikli toh seedha error dedo
    if (!videoId || videoId.length !== 11) {
        return res.status(400).json({ error: "Sahi YouTube URL nahi hai!" });
    }

    let audioUrl = null;

    // ==========================================
    // TACTIC: Invidious API (No Cloudflare Block)
    // ==========================================
    const invidiousInstances = [
        "https://vid.puffyan.us",
        "https://invidious.nerdvpn.de",
        "https://inv.tux.pizza",
        "https://invidious.incogniweb.net",
        "https://invidious.lunar.icu"
    ];

    for (let instance of invidiousInstances) {
        try {
            // Invidious API se video ki details maango
            const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // adaptiveFormats mein audio check karo
                if (data.adaptiveFormats && data.adaptiveFormats.length > 0) {
                    
                    // Audio stream milte hi, proxy link bana do (itag 140 = high quality audio, local=true = Bypass YouTube Block)
                    audioUrl = `${instance}/latest_version?id=${videoId}&itag=140&local=true`;
                    break; // Link mil gaya, ab baaki servers check karne ki zaroorat nahi
                }
            }
        } catch (e) {
            continue; // Agar ek server down ho toh agla check karo
        }
    }

    // ==========================================
    // FINAL RESULT FRONTEND KO BHEJNA
    // ==========================================
    if (audioUrl) {
        return res.status(200).json({ audioUrl: audioUrl });
    } else {
        return res.status(500).json({ error: "Saare Invidious servers down hain ya audio nahi mila. Baad mein try karein!" });
    }
};
