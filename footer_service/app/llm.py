"""Free-tier LLM chain: Gemini -> Groq -> OpenRouter. Falls back to rules."""
import hashlib, json, logging, os, re

import httpx

from .footer import fallback, sanitize

log = logging.getLogger("footer-ai")

SYSTEM = """You design poster footer layouts. Reply with ONLY one JSON object, no text.
All x,y,w are fractions (0-1) of the poster width / footer height. size = font height as fraction of footer height.
Schema: {"height":0.08-0.2,"shape":"flat|curve-top|slant-top","bg":{"type":"solid|gradient","colors":["#hex","#hex"]},"textColor":"#hex","logo":{"x":0-0.8,"y":0-0.5,"size":0.3-0.9}|null,"items":[{"key":"<given key>","x":0-0.95,"y":0-0.9,"w":0.15-0.9,"size":0.08-0.4,"weight":400|700,"align":"left|center|right"}]}
Rules: include every given key exactly once; no overlaps; if a logo exists keep text x>=0.2; use the brand palette; text must contrast with the background."""


async def gemini(c, system, user):
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    r = await c.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                     headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
                     json={"systemInstruction": {"parts": [{"text": system}]},
                           "contents": [{"role": "user", "parts": [{"text": user}]}],
                           "generationConfig": {"responseMimeType": "application/json", "temperature": 0.7}})
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def openai_style(url, key_env, model_env, default_model, json_mode):
    async def call(c, system, user):
        body = {"model": os.getenv(model_env, default_model), "temperature": 0.7,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        r = await c.post(url, headers={"Authorization": f"Bearer {os.environ[key_env]}"}, json=body)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    return call


PROVIDERS = [
    ("gemini", "GEMINI_API_KEY", gemini),
    ("groq", "GROQ_API_KEY", openai_style("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY",
                                          "GROQ_MODEL", "llama-3.3-70b-versatile", True)),
    ("openrouter", "OPENROUTER_API_KEY", openai_style("https://openrouter.ai/api/v1/chat/completions",
                                                      "OPENROUTER_API_KEY", "OPENROUTER_MODEL",
                                                      "meta-llama/llama-3.3-70b-instruct:free", False)),
]
_cache = {}


def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", str(text))
        try:
            return json.loads(m.group(0)) if m else None
        except Exception:
            return None


async def generate(prompt, keys, palette, has_logo, regenerate=False):
    cid = hashlib.sha1(json.dumps([prompt, keys, palette, has_logo]).encode()).hexdigest()
    if not regenerate and cid in _cache:
        return _cache[cid], "cache"
    user = (f"Keys: {json.dumps(keys)}\nHas logo: {has_logo}\nBrand palette: {', '.join(palette) or 'none'}\n"
            f"Poster: portrait 330x415\nUser wish: {prompt or 'clean modern footer'}")
    async with httpx.AsyncClient(timeout=12) as c:
        for name, env, call in PROVIDERS:
            if not os.getenv(env):
                continue
            try:
                raw = parse_json(await call(c, SYSTEM, user))
                if raw is None:
                    continue
                spec = sanitize(raw, keys, has_logo, palette)
                if len(_cache) > 500:
                    _cache.pop(next(iter(_cache)))
                _cache[cid] = spec
                return spec, name
            except Exception as e:
                log.warning("%s failed: %s", name, e)
    return fallback(keys, has_logo, palette), "rules"