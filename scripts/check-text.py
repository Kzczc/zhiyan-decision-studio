from pathlib import Path
import re
root=Path(__file__).resolve().parents[1];errors=[]
for p in root.rglob("*"):
 if any(x in p.parts for x in (".git","node_modules","output")):continue
 if p.suffix in {".md",".js",".cjs",".css",".html",".json",".py",".svg"}:
  s=p.read_text(encoding="utf-8-sig")
  if "\ufffd" in s:errors.append(str(p.relative_to(root))+": replacement character")
  if p.suffix==".md" and "yance-decision-studio" in s:errors.append(str(p.relative_to(root))+": old link")
  p.write_bytes(("\n".join(line.rstrip() for line in s.splitlines()).rstrip()+"\n").encode("utf-8"))
for name in ["README.md","README.en.md"]:
 s=(root/name).read_text(encoding="utf-8")
 for dest in re.findall(r'(?:\]\(|src=")([^)" ]+)',s):
  if "://" not in dest and not dest.startswith("#") and not (root/dest.split("#")[0]).exists():errors.append(name+": missing "+dest)
assert not errors,errors
print("UTF-8, no replacement characters, README links and local assets checked")
