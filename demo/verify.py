from pathlib import Path
import os,json,re,subprocess,shutil
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parents[1];video=root/"docs/media/zhiyan-demo.mp4";out=root/"demo/output";ff=os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg")
if not ff:
 import imageio_ffmpeg
 ff=imageio_ffmpeg.get_ffmpeg_exe()
p=subprocess.run([ff,"-hide_banner","-i",str(video)],capture_output=True,text=True)
match=re.search(r"Duration: (\d+):(\d+):([\d.]+)",p.stderr);duration=int(match[1])*3600+int(match[2])*60+float(match[3])
data=json.loads((out/"chapters.json").read_text());contentEnd=data["chapters"][-1]["endMs"]
offset=round(duration*1000-contentEnd)
assert 0<=offset<8000,(duration,contentEnd)
def stamp(ms):
 ms=max(0,round(ms));return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}"
vtt=["WEBVTT",""]
for c in data["chapters"]:vtt.append(stamp(c["startMs"]+offset)+" --> "+stamp(c["endMs"]+offset)+"\n"+c["cn"]+"\n"+c["en"]+"\n")
(root/"docs/media/zhiyan-demo.vtt").write_text("\n".join(vtt),encoding="utf-8")
data["videoDurationMs"]=round(duration*1000);data["subtitleOffsetMs"]=offset
(out/"chapters.json").write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
times=[1,18,35,54,66,84,105,int(duration-3)]
tiles=[]
for i,t in enumerate(times):
 target=out/f"frame-{i}.png"
 r=subprocess.run([ff,"-y","-ss",str(t),"-i",str(video),"-frames:v","1",str(target)],capture_output=True)
 assert r.returncode==0,r.stderr[-500:]
 im=Image.open(target).convert("RGB");assert im.size==(1920,1080)
 tile=Image.new("RGB",(640,390),"#102a2a");tile.paste(im.resize((640,360)),(0,25));ImageDraw.Draw(tile).text((12,5),f"{t}s",fill="white");tiles.append(tile)
sheet=Image.new("RGB",(1280,1560),"#102a2a")
for i,t in enumerate(tiles):sheet.paste(t,((i%2)*640,(i//2)*390))
sheet.save(out/"contact-sheet.jpg",quality=90)
# Decode the entire stream; missing/corrupt frames are a release failure.
r=subprocess.run([ff,"-v","error","-i",str(video),"-f","null","-"],capture_output=True)
assert r.returncode==0 and not r.stderr,r.stderr[:1000]
print(json.dumps({"duration":duration,"resolution":"1920x1080","sizeMB":round(video.stat().st_size/1048576,2),"decodeErrors":0,"subtitleOffsetMs":offset}))
