#!/bin/sh
# 分割ファイルを1枚のHTMLにまとめる（配布・ドラッグ&ドロップ用）
# 使い方: fortune/ の中で sh build-single.sh
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
import re, os
src = open('index.html', encoding='utf-8').read()
css = re.sub(r'^@charset[^;]*;\s*', '', open('assets/css/style.css', encoding='utf-8').read())
js_files = ['assets/js/data.js','assets/js/engine.js','assets/js/writer.js','assets/js/app.js']
js = '\n'.join('/* ===== '+os.path.basename(f)+' ===== */\n'+open(f, encoding='utf-8').read() for f in js_files)
assert '</script' not in js.lower() and '</style' not in css.lower()
out = src.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n'+css+'\n</style>')
for f in js_files:
    out = out.replace('<script src="'+f+'"></script>\n', '').replace('<script src="'+f+'"></script>', '')
out = out.replace('</body>', '<script>\n'+js+'\n</script>\n</body>')
assert 'assets/' not in out
open('../uranai-1file.html','w',encoding='utf-8').write(out)
print('built ../uranai-1file.html', len(out.encode('utf-8')), 'bytes')
PY
