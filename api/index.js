module.exports = async function handler(req, res) {
    // CORS errors ko rokne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    // 🔴 MAGIC TRICK: Cloudflare ko bewakoof banane ke liye Fake Browser Identity
    const fakeHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json"
    };

    let audioUrl = null;

    // ==========================================
    // PHASE 1: Cobalt API (Sabse Fast aur Direct)
    // ==========================================
    try {
        const cobalt = await fetch("https://co.wuk.sh/api/json", {
            method: "POST",
            headers: {
                ...fakeHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: fullUrl,
                isAudioOnly: true,
                aFormat: "mp3"
            })
        });

        if (cobalt.ok) {
            const data = await cobalt.json();
            if (data.url) audioUrl = data.url;
        }
    } catch (e) {
        console.log("Cobalt failed, trying Piped...");
    }

    // ==========================================
    // PHASE 2: Piped APIs (Agar Cobalt fail ho jaye)
    // ==========================================
    if (!audioUrl) {
        let videoId = "";
        if (fullUrl.includes("v=")) videoId = fullUrl.split("v=")[1].substring(0, 11);
        else if (fullUrl.includes("youtu.be/")) videoId = fullUrl.split("youtu.be/")[1].substring(0, 11);

        if (videoId) {
            // Naye aur fast Piped Servers ki list
            const pipedServers = [
                "https://pipedapi.kavin.rocks",
                "https://api.piped.projectsegfau.lt",
                "https://pipedapi.smnz.de",
                "https://pipedapi.tokhmi.xyz"
            ];

            for (let api of pipedServers) {
                try {
                    // Yahan Fake Headers bhejna sabse zaroori hai
                    const response = await fetch(`${api}/streams/${videoId}`, { 
                        method: 'GET',
                        headers: fakeHeaders 
                    });
                    
                    if (!response.ok) continue;
                    const data = await response.json();
                    
                    if (data.audioStreams && data.audioStreams.length > 0) {
                        audioUrl = data.audioStreams[0].url;
                        break; // Gaana milte hi dhundna band karo
                    }
                } catch (e) {
                    continue;
                }
            }
        }
    }

    // ==========================================
    // FINAL RESULT FRONTEND KO BHEJNA
    // ==========================================
    if (audioUrl) {
        return res.status(200).json({ audioUrl: audioUrl });
    } else {
        return res.status(500).json({ error: "Cloudflare ne Vercel ko block kar diya hai. Audio nahi mil saka!" });
    }
};
