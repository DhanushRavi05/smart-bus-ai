import sys

with open('public/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('new_css.txt', 'r', encoding='utf-8') as f:
    new_css = f.read()

with open('new_html.txt', 'r', encoding='utf-8') as f:
    new_html = f.read()

start_css = -1
end_css = -1
start_html = -1
end_html = -1

for i, l in enumerate(lines):
    if '/* ── SPLASH ROOT' in l: start_css = i
    if '</style>' in l: end_css = i
    if '<div id="splash-screen">' in l: start_html = i
    if '<div id="app-root" style="display: none;">' in l: end_html = i

if start_css >= 0 and end_css >= 0 and start_html >= 0 and end_html >= 0:
    final_lines = lines[:start_css] + [new_css + '\n'] + lines[end_css:start_html] + [new_html + '\n'] + lines[end_html:]
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("Successfully updated index.html!")
else:
    print(f"Failed to find markers: css {start_css}-{end_css}, html {start_html}-{end_html}")
