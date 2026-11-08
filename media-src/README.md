# Background loop

`public/media/bg.*` is made from a 1280x720 Midjourney clip (the source isn't kept in the repo).
Half speed, motion-interpolated back to 24 fps, then the last 2 s fade into the first 2 s so the
loop has no visible jump. Low resolution and pre-blurred on purpose: the page blurs it again.

    ffmpeg -i in.mp4 -vf "scale=640:360:flags=lanczos,setpts=2.0*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,gblur=sigma=3" -an -c:v libx264 -crf 14 slow.mp4
    # OFF = length of slow.mp4 - 4
    F="[0:v]split[a][b];[a]trim=start=2,setpts=PTS-STARTPTS[main];[b]trim=end=2,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=2:offset=$OFF,format=yuv420p[v]"
    ffmpeg -i slow.mp4 -filter_complex "$F" -map '[v]' -an -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 bg.webm
    ffmpeg -i slow.mp4 -filter_complex "$F" -map '[v]' -an -c:v libx264 -preset slow -crf 30 -movflags +faststart bg.mp4
    ffmpeg -i bg.mp4 -frames:v 1 -c:v libwebp -quality 70 bg-poster.webp
