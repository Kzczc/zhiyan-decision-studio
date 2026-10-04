"""Build honest, complete font subsets. Run with fonttools[brotli] installed."""
from pathlib import Path
import argparse, json, re
from fontTools.ttLib import TTFont
from fontTools import subset
p=argparse.ArgumentParser()
p.add_argument("--sources",type=Path,required=True)
args=p.parse_args()
root=Path(__file__).resolve().parents[1]; assets=root/"docs/assets"
points=set(range(32,127))|set(range(0x3000,0x3040))|set(range(0xff01,0xff65))|{0x2192,0x2190,0x2212,0x2014,0x2013,0x00b7}
for high in range(0xa1,0xf8):
 for low in range(0xa1,0xff):
  try:points.update(map(ord,bytes([high,low]).decode("gb2312")))
  except UnicodeDecodeError:pass
for path in (root/"docs").rglob("*"):
 if path.suffix in {".html",".js",".css"} and path.name!="lucide.min.js":
  points.update(ord(c) for c in path.read_text(encoding="utf-8") if '\u3400'<=c<='\u9fff')
rules=[];report={}
for source,target,family in [("NotoSansSC.ttf","zhiyan-sans-v2.woff2","Noto Sans SC"),("NotoSerifSC.ttf","zhiyan-serif-v2.woff2","Noto Serif SC")]:
 font=TTFont(args.sources/source); cmap=font.getBestCmap()
 assert all(ord(c) in cmap for c in "智演决策预演")
 options=subset.Options();options.flavor="woff2";options.layout_features=["*"];options.recalc_timestamp=False
 sub=subset.Subsetter(options);sub.populate(unicodes=points & set(cmap));sub.subset(font)
 font.flavor="woff2";font.save(assets/target)
 report[family]={"glyphs":len(font.getBestCmap()),"bytes":(assets/target).stat().st_size,"brand":"智演决策预演"}
 rules.append('@font-face{font-family:"'+family+'";font-style:normal;font-weight:100 900;font-display:swap;src:url("'+target+'") format("woff2");}')
rules.extend(['@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url("inter-latin.woff2") format("woff2");}',
'@font-face{font-family:"Yance Screen";font-style:normal;font-weight:400;font-display:swap;src:url("yance-screen.woff2") format("woff2");}'])
(assets/"fonts.css").write_text("\n".join(rules)+"\n",encoding="utf-8")
(assets/"font-coverage.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False))
