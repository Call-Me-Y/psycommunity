"""Download the pinned community ONNX sentiment model into a chosen directory."""
import argparse
import hashlib
import os
from pathlib import Path
import tempfile
import urllib.parse
import urllib.request

REPO = "onnx-community/Erlangshen-Roberta-110M-Sentiment-ONNX"
REVISION = "8cbfb8bfc81a8f5afa6a84b50d3a04a88f483d9f"
FILES = {
    "onnx/model_quantized.onnx": ("model.onnx", "5e0e07161a093d7134f0a3293ae6c3c6e9bae2d73c6bfbba65ae26e3a512f466"),
    "tokenizer.json": ("tokenizer.json", "15df791881f91e7963c9e0d704de2f2037baa002"),
    "tokenizer_config.json": ("tokenizer_config.json", "f10ebbb60eb4fd940ceaae54ccc075f2ef009b9f"),
    "special_tokens_map.json": ("special_tokens_map.json", "a8b3208c2884c4efb86e49300fdd3dc877220cdf"),
    "vocab.txt": ("vocab.txt", "ca4f9781030019ab9b253c6dcb8c7878b6dc87a5"),
    "config.json": ("config.json", "e32e48f6b38bacacc490d1cc8c71e649e71d005f"),
}


def checksum(path, expected):
    digest = hashlib.sha256() if len(expected) == 64 else hashlib.sha1()
    if len(expected) == 40:
        digest.update(f"blob {path.stat().st_size}\0".encode())
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="Model directory")
    args = parser.parse_args()
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    for remote, (local, expected) in FILES.items():
        destination = output / local
        if destination.exists():
            if checksum(destination, expected) == expected:
                print(f"Already present and verified: {local}", flush=True)
                continue
            raise SystemExit(f"Refusing to overwrite existing file: {destination}")
        url = f"https://huggingface.co/{REPO}/resolve/{REVISION}/{urllib.parse.quote(remote)}"
        temp_path = None
        try:
            with urllib.request.urlopen(url, timeout=120) as response, tempfile.NamedTemporaryFile(dir=output, prefix=".download-", delete=False) as temp:
                temp_path = Path(temp.name)
                while True:
                    block = response.read(1024 * 1024)
                    if not block:
                        break
                    temp.write(block)
            if checksum(temp_path, expected) != expected:
                raise ValueError(f"Checksum mismatch: {local}")
            os.replace(temp_path, destination)
            print(f"Downloaded: {local} ({destination.stat().st_size} bytes)", flush=True)
        finally:
            if temp_path is not None and temp_path.exists():
                temp_path.unlink()


if __name__ == "__main__":
    main()
