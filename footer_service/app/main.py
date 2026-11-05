import base64, hmac, os
from typing import Annotated, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, StringConstraints

from .footer import H, S, W, palette_from_logo, render
from .llm import generate

app = FastAPI(title="Imagica footer service")
Key = Annotated[str, StringConstraints(pattern=r"^[a-zA-Z_]{1,30}$")]


class FooterRequest(BaseModel):
    prompt: str = Field("", max_length=200)
    fields: list[Key] = Field(min_length=1, max_length=12)
    has_logo: bool = False
    logo_url: Optional[str] = Field(None, max_length=500)
    regenerate: bool = False


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/footer")
async def footer(req: FooterRequest, x_internal_key: str = Header(default="")):
    secret = os.getenv("INTERNAL_KEY", "")
    if not secret or not hmac.compare_digest(x_internal_key, secret):
        raise HTTPException(401, "unauthorized")
    keys = list(dict.fromkeys(req.fields))
    palette = await palette_from_logo(req.logo_url) if req.logo_url else []
    spec, source = await generate(req.prompt, keys, palette, req.has_logo, req.regenerate)
    png, layout = render(spec)
    return {"source": source, "layout": layout, "width": W * S, "height": H * S,
            "frame_png_b64": base64.b64encode(png).decode()}