import os
import re

# Add loading="lazy" to images
def optimize_images(content):
    # Add loading="lazy" to img tags without it
    content = re.sub(
        r'<img([^>]*?)>',
        lambda m: f'<img{m.group(1)} loading="lazy">' if 'loading=' not in m.group(1) else m.group(0),
        content
    )
    return content

# Add defer to scripts
def defer_scripts(content):
    # Add defer to external scripts without async/defer
    content = re.sub(
        r'<script src="([^"]+)"([^>]*)></script>',
        lambda m: f'<script src="{m.group(1)}" defer></script>' if 'defer' not in m.group(2) and 'async' not in m.group(2) else m.group(0),
        content
    )
    return content

# Add preconnect
def add_preconnect(content):
    preconnect = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'''
    if 'preconnect' not in content:
        content = content.replace('<head>', f'<head>\n{preconnect}')
    return content

# Process HTML files
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                original = content
                content = optimize_images(content)
                content = defer_scripts(content)
                content = add_preconnect(content)
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Optimized: {filepath}")
            except Exception as e:
                print(f"Error {filepath}: {e}")

print("Done!")
