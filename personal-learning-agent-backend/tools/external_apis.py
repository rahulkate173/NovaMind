"""Misc external API helpers."""

from __future__ import annotations

from typing import Any, Dict

import httpx


def health_ping(url: str, timeout: float = 2.0) -> Dict[str, Any]:
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.get(url)
            return {"ok": resp.status_code < 400, "status_code": resp.status_code, "url": url}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "url": url}
