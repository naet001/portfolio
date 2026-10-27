#!/usr/bin/env bash
# Encode the rem screen recordings for the portfolio demo band.
#
#   tools/encode-rem.sh sheets     # contact sheets for picking poster frames
#   tools/encode-rem.sh encode     # the 8 web files (VP9 + H.264 x 4 clips)
#   tools/encode-rem.sh sizes      # report what the current outputs weigh
#
# The originals in images/rem/masters/ are 1920x1080@60 with no audio track.
# Everything here is 1280x720@30 silent.
#
# vercel.json serves /images/(.*) as `max-age=31536000, immutable`, so a
# published file can never be replaced in place: bump VER (v1 -> v2) and
# update the references in index.html whenever you re-encode.
#
# Tunables: VER, VP9_CRF, H264_CRF, e.g.
#   H264_CRF=28 VER=v2 tools/encode-rem.sh encode

set -euo pipefail
cd "$(dirname "$0")/.."

MASTERS="images/rem/masters"
WEB="images/rem/web"
CLIPS=(rem-showcase-001 rem-one rem-sessions rem-permissions-and-guardrails)

VER=${VER:-v1}
VP9_CRF=${VP9_CRF:-32}
H264_CRF=${H264_CRF:-27}

# 1080p60 -> 720p30 softens small monospace glyphs, so a light unsharp claws the
# edges back. The masters are limited-range; declaring the range both ways stops
# ffmpeg expanding tv -> full, which would crush or wash out terminal contrast.
VF="scale=1280:720:flags=lanczos:in_range=limited:out_range=limited,unsharp=5:5:0.5:5:5:0.0,fps=30,format=yuv420p"
TAGS=(-colorspace smpte170m -color_primaries smpte170m -color_trc smpte170m -color_range tv)

mkdir -p "$WEB"

report() {
  local f=$1
  printf '  %-4s %6s  %s bps\n' "${f##*.$VER.}" "$(du -h "$f" | cut -f1)" \
    "$(ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of csv=p=0 "$f")"
}

case "${1:-encode}" in
sheets)
  # One thumbnail every 3 seconds, tiled, so a poster frame can be chosen from
  # content instead of guessed at. Written to /tmp, never committed.
  for base in "${CLIPS[@]}"; do
    ffmpeg -hide_banner -loglevel error -y -i "$MASTERS/$base.mp4" \
      -vf "fps=1/3,scale=240:135,tile=5x5" -frames:v 1 "/tmp/$base.sheet.png"
    echo "/tmp/$base.sheet.png"
  done
  ;;

encode)
  for base in "${CLIPS[@]}"; do
    src="$MASTERS/$base.mp4"
    out="$WEB/$base.$VER"
    echo "== $base"

    # VP9 — the webm path, served to Chromium, Firefox and modern Safari.
    # -b:v 0 is required or the CRF is ignored in favour of a default bitrate cap.
    ffmpeg -hide_banner -loglevel error -y -i "$src" -an -dn -vf "$VF" \
      -c:v libvpx-vp9 -crf "$VP9_CRF" -b:v 0 -deadline good -cpu-used 2 \
      -row-mt 1 -tile-columns 2 -g 150 \
      "${TAGS[@]}" "$out.vp9.webm"

    # H.264 — the universal fallback (Safari, older devices). +faststart moves
    # the moov atom ahead of the media so playback starts before the file lands.
    # -sc_threshold 0: scene cuts fire on every text scroll in terminal footage,
    # which buys nothing and costs a third of the bitrate.
    ffmpeg -hide_banner -loglevel error -y -i "$src" -an -dn -vf "$VF" \
      -c:v libx264 -preset slow -crf "$H264_CRF" -profile:v high -level 4.0 \
      -g 150 -keyint_min 150 -sc_threshold 0 -movflags +faststart \
      "${TAGS[@]}" "$out.mp4"

    report "$out.vp9.webm"
    report "$out.mp4"
  done
  echo "== totals"
  for ext in vp9.webm mp4; do
    printf '  %-10s %s\n' "$ext" "$(du -ch "$WEB"/*."$VER".$ext | tail -1 | cut -f1)"
  done
  ;;

sizes)
  for ext in vp9.webm mp4; do
    printf '  %-10s %s\n' "$ext" "$(du -ch "$WEB"/*."$VER".$ext 2>/dev/null | tail -1 | cut -f1 || echo '-')"
  done
  ;;

*)
  echo "usage: tools/encode-rem.sh [encode|sheets|sizes]" >&2
  exit 2
  ;;
esac
