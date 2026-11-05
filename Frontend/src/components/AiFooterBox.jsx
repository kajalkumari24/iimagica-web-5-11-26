import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../url";

// Profile keys to put in the footer, in priority order: [key, showFlag]
const FIELDS = [
    ["businessName", "showBusinessName"], ["partyname"], ["name", "visibleName"], ["designation", "showDesignation"],
    ["positionname", "showPosition"], ["businessTagline", "showBusinessTagline"], ["mobile", "showMobile"],
    ["contact", "showContact"], ["website", "showWebsite"], ["address", "showAddress"],
];
const cfg = { withCredentials: true };

export default function AiFooterBox({ profile, onSelect }) {
    const [prompt, setPrompt] = useState("");
    const [mine, setMine] = useState([]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        axios.get(`${BASE_URL}/api/footer-ai/mine`, cfg).then((r) => setMine(r.data.data || [])).catch(() => { });
    }, []);

    const generate = async (regenerate = false) => {
        const fields = FIELDS.filter(([k, flag]) => profile?.[k] && (!flag || profile[flag] !== false))
            .slice(0, 6).map(([key]) => ({ key }));
        if (!fields.length) return setMsg("Add details to your profile first.");
        setBusy(true);
        setMsg("");
        try {
            const r = await axios.post(
                `${BASE_URL}/api/footer-ai/generate`,
                { prompt, fields, hasLogo: !!profile?.file, logoUrl: profile?.file || "", regenerate },
                cfg
            );
            const frame = r.data.data.frame;
            setMine((m) => [frame, ...m].slice(0, 20));
            onSelect(frame);
        } catch (e) {
            setMsg(e.response?.data?.message || "Could not generate footer.");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/api/footer-ai/${id}`, cfg);
            setMine((m) => m.filter((f) => f._id !== id));
        } catch { /* ignore */ }
    };

    return (
        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            <h2 className="sectionTitle" style={{ margin: 0 }}>AI Footer</h2>
            <textarea
                rows={2} maxLength={200} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. curved gold footer, modern"
                style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
                <button disabled={busy} onClick={() => generate(false)}>{busy ? "Generating..." : "Generate"}</button>
                <button disabled={busy} onClick={() => generate(true)}>Try another</button>
            </div>
            {msg && <small style={{ color: "#c0392b" }}>{msg}</small>}
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {mine.map((f) => (
                    <div key={f._id} style={{ position: "relative", flex: "0 0 auto" }}>
                        <img src={f.framePath} alt="AI footer" onClick={() => onSelect(f)}
                            style={{ height: 90, background: "#ddd", borderRadius: 6, cursor: "pointer" }} />
                        <button onClick={() => remove(f._id)} aria-label="Delete footer"
                            style={{ position: "absolute", top: 2, right: 2, padding: "0 6px" }}>x</button>
                    </div>
                ))}
            </div>
        </div>
    );
}