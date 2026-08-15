export default async function handler(req, res) {
    // CORS errors ko khatam karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const fullUrl = req.query.url;
    if (!fullUrl) return res.status(400).json({ error: "URL is missing!" });

    let audioUrl = "";

    // Nakli Pehchan (User-Agent) taaki API isey Bot na samjhe!
    const fakeHeaders = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    // 🔴 PHASE 1: Try Cobalt APIs (Sabse powerful aur direct stream)
    const cobaltServers = [
        "https://api.cobalt.tools/api/json",
        "https://co.wuk.sh/api/json",
        "https://cobalt.q0.wtf/api/json",
        "https://cobalt.kwiateks.com/api/json"
    ];

    for (let api of cobaltServers) {
        try {
            const response = await fetch(api, {
                method: "POST",
                headers: fakeHeaders,
                body: JSON.stringify({
                    url: fullUrl,
                    aFormat: "mp3",
                    isAudioOnly: true
                })
            });

            if (!response.ok) continue;
            const data = await response.json();
            
            if (data && data.url) {
                audioUrl = data.url;
                break; // Aawaz milte hi loop tod do
            }
        } catch (e) { continue; } // Fail ho toh chupchap agla try karo
    }

    // 🟢 PHASE 2: Agar Cobalt fail ho jaye, toh Piped APIs ko try karo
    if (!audioUrl) {
        let videoId = "";
        if (fullUrl.includes("v=")) videoId = fullUrl.split("v=")[1].substring(0, 11);
        else if (fullUrl.includes("youtu.be/")) videoId = fullUrl.split("youtu.be/")[1].substring(0, 11);

        if (videoId) {
            const pipedServers = [
                `https://pipedapi.kavin.rocks/streams/${videoId}`,
                `https://pipedapi.tokhmi.xyz/streams/${videoId}`,
                `https://pipedapi.smnz.de/streams/${videoId}`
            ];

            for (let api of pipedServers) {
                try {
                    // Piped ko bhi nakli pehchan bhejo
                    const response = await fetch(api, {
                        headers: { "User-Agent": fakeHeaders["User-Agent"] }
                    });
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    if (data.audioStreams && data.audioStreams.length > 0) {
                        audioUrl = data.audioStreams[0].url;
                        break; // Aawaz milte hi loop tod do
                    }
                } catch (e) { continue; }
            }
        }
    }

    // 🎯 FINAL RESULT: Frontend (Phone) ko aawaz bhej do
    if (audioUrl) {
        res.status(200).json({ audioUrl: audioUrl });
    } else {
        res.status(500).json({ error: "Saare server down hain, Audio nahi mila!" });
    }
}
