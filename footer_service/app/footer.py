"""Footer logic: rules, validation, palette, PNG frame + layout in Imagica's frame format."""
import io, os, re
from urllib.parse import urlparse

import httpx
from PIL import Image, ImageDraw

W, H, S = 330, 415, 4  # poster units used by ImageView / admin editor; S = PNG scale
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
LABELS = {"businessName": "Business Name", "partyname": "Party Name", "name": "Name", "designation": "Designation",
          "positionname": "Position", "businessTagline": "Tagline", "mobile": "Mobile", "contact": "Contact",
          "website": "Website", "address": "Address"}


def clamp(v, lo, hi, d):
    try:
        return min(hi, max(lo, float(v)))
    except (TypeError, ValueError):
        return d


def hexc(v, d):
    return v if isinstance(v, str) and HEX.match(v) else d


def _lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    hi, lo = sorted((_lum(a), _lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def readable(bg):
    return "#ffffff" if contrast("#ffffff", bg) >= contrast("#111111", bg) else "#111111"


# ---------- rules (also the fallback) ----------
def fallback(keys, has_logo, palette):
    n = len(keys)
    bg = hexc(palette[0] if palette else None, "#1f2937")
    rows, cols = (-(-n // 2), 2) if n > 4 else (n, 1)
    tx = 0.2 if has_logo else 0.04
    col_w = (0.97 - tx) / cols
    return {
        "height": 0.09 if n <= 2 else 0.13 if n <= 4 else 0.17,
        "shape": "flat",
        "bg": {"type": "solid", "colors": [bg]},
        "textColor": readable(bg),
        "logo": {"x": 0.03, "y": 0.15, "size": 0.7} if has_logo else None,
        "items": [{"key": k, "x": tx + (i % cols) * col_w, "y": 0.1 + (i // cols) * (0.8 / rows),
                   "size": min(0.26, 0.62 / rows), "w": col_w - 0.01, "weight": 700 if i == 0 else 400,
                   "align": "left"} for i, k in enumerate(keys)],
    }


# ---------- validate whatever the LLM returned ----------
def sanitize(raw, keys, has_logo, palette):
    fb = fallback(keys, has_logo, palette)
    if not isinstance(raw, dict):
        return fb
    seen, items = set(), []
    for i in raw.get("items") if isinstance(raw.get("items"), list) else []:
        k = i.get("key") if isinstance(i, dict) else None
        if k in keys and k not in seen:
            seen.add(k)
            items.append({"key": k, "x": clamp(i.get("x"), 0, 0.95, 0.2), "y": clamp(i.get("y"), 0, 0.9, 0.1),
                          "size": clamp(i.get("size"), 0.08, 0.4, 0.2), "w": clamp(i.get("w"), 0.15, 0.9, 0.5),
                          "weight": 700 if clamp(i.get("weight"), 0, 1000, 400) >= 600 else 400,
                          "align": i.get("align") if i.get("align") in ("left", "center", "right") else "left"})
    if len(items) != len(keys):
        return fb  # LLM dropped a field -> rules
    bg = raw.get("bg") if isinstance(raw.get("bg"), dict) else {}
    colors = [c for c in (hexc(c, None) for c in (bg.get("colors") or [])[:2]) if c] or [fb["bg"]["colors"][0]]
    text = hexc(raw.get("textColor"), None)
    lg = raw.get("logo") if isinstance(raw.get("logo"), dict) else {}
    return {
        "height": max(fb["height"], clamp(raw.get("height"), 0.08, 0.2, fb["height"])),
        "shape": raw.get("shape") if raw.get("shape") in ("flat", "curve-top", "slant-top") else "flat",
        "bg": {"type": "gradient" if len(colors) > 1 and bg.get("type") == "gradient" else "solid", "colors": colors},
        "textColor": text if text and contrast(text, colors[0]) >= 4.5 else readable(colors[0]),
        "logo": {"x": clamp(lg.get("x"), 0, 0.8, 0.03), "y": clamp(lg.get("y"), 0, 0.5, 0.15),
                 "size": clamp(lg.get("size"), 0.3, 0.9, 0.7)} if has_logo else None,
        "items": items,
    }


# ---------- brand palette from the logo ----------
async def palette_from_logo(url, n=3):
    try:
        u = urlparse(url)
        allowed = {h.strip() for h in os.getenv("LOGO_HOSTS", "res.cloudinary.com,ik.imagekit.io").split(",")}
        if u.scheme != "https" or u.hostname not in allowed:
            return []
        async with httpx.AsyncClient(timeout=6) as c:  # no redirects: blocks SSRF hops
            r = await c.get(url)
        if r.status_code != 200 or len(r.content) > 3_000_000:
            return []
        im = Image.open(io.BytesIO(r.content)).convert("RGBA").resize((48, 48))
        bins = {}
        for r_, g, b, a in im.getdata():
            if a < 200 or min(r_, g, b) > 225:
                continue
            e = bins.setdefault((r_ >> 5, g >> 5, b >> 5), [0, 0, 0, 0])
            e[0] += 1; e[1] += r_; e[2] += g; e[3] += b
        cols = [tuple(round(v / e[0]) for v in e[1:]) for e in sorted(bins.values(), key=lambda e: -e[0])]
        out = []
        for c1 in cols:
            if all(sum((x - y) ** 2 for x, y in zip(p, c1)) ** 0.5 > 70 for p in out):
                out.append(c1)
            if len(out) == n:
                break
        return ["#%02x%02x%02x" % c for c in out]
    except Exception:
        return []


# ---------- render PNG frame + layout (Imagica frame format) ----------
def render(spec):
    fh = spec["height"] * H
    top = H - fh
    d = 0 if spec["shape"] == "flat" else fh * 0.15
    ut, uh = top + d, fh - d

    if spec["shape"] == "curve-top":
        pts = [(W * t, (1 - t) ** 2 * (top + d) + 2 * (1 - t) * t * (top - d) + t * t * (top + d))
               for t in (i / 64 for i in range(65))]
    elif spec["shape"] == "slant-top":
        pts = [(0, top + d), (W, top)]
    else:
        pts = [(0, top), (W, top)]
    pts = [(x * S, y * S) for x, y in pts + [(W, H), (0, H)]]

    size = (W * S, H * S)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    c1, c2 = (spec["bg"]["colors"] + spec["bg"]["colors"])[:2]
    if spec["bg"]["type"] == "gradient":
        a, b = [tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in (c1, c2)]
        row = Image.new("RGB", (size[0], 1))
        row.putdata([tuple(round(a[j] + (b[j] - a[j]) * x / (size[0] - 1)) for j in range(3)) for x in range(size[0])])
        layer = row.resize(size).convert("RGBA")
    else:
        layer = Image.new("RGBA", size, c1)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    img.paste(layer, (0, 0), mask)
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)

    layout = {}
    for it in spec["items"]:
        fs = max(8, round(it["size"] * uh))
        layout[it["key"]] = {"left": round(it["x"] * W), "top": round(ut + it["y"] * uh), "width": round(it["w"] * W),
                             "height": round(fs * 1.3), "fontSize": fs, "fontFamily": "Poppins, sans-serif",
                             "fontWeight": "bold" if it["weight"] >= 600 else "normal", "fontColour": spec["textColor"],
                             "textAlign": it["align"], "angle": 0, "sampleText": LABELS.get(it["key"], it["key"])}
    if spec["logo"]:
        box = round(min(spec["logo"]["size"] * uh, W * 0.18))
        layout["photo"] = {"left": round(spec["logo"]["x"] * W), "top": round(ut + spec["logo"]["y"] * uh),
                           "width": box, "height": box}
    return buf.getvalue(), layout