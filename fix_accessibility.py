import os
import re

# Add alt to images without it
def fix_images(content):
    content = re.sub(
        r'<img([^>]*?)>',
        lambda m: f'<img{m.group(1)} alt="">' if 'alt=' not in m.group(1) else m.group(0),
        content
    )
    return content

# Add aria-label to icon buttons
def fix_buttons(content):
    # Add aria-label to buttons without text or aria-label
    content = re.sub(
        r'<button([^>]*?)>(\s*<i[^>]*></i>\s*)</button>',
        lambda m: f'<button{m.group(1)} aria-label="Button">{m.group(2)}</button>' if 'aria-label' not in m.group(1) else m.group(0),
        content
    )
    return content

# Add skip link
def add_skip_link(content):
    skip_link = '<a href="#main-content" class="skip-link">Skip to content</a>'
    if 'skip-link' not in content and '<body' in content:
        content = re.sub(r'(<body[^>]*>)', f'\\1\n{skip_link}', content)
    if 'id="main-content"' not in content:
        content = re.sub(r'(<main[^>]*?)>', r'\1 id="main-content">', content)
    return content

# Process main pages
pages = [
    'index.html',
    'auth-enhanced.html',
    'home-dashboard.html',
    'groups-advanced-system.html',
    'marketplace-social.html'
]

for page in pages:
    if os.path.exists(page):
        try:
            with open(page, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            original = content
            content = fix_images(content)
            content = fix_buttons(content)
            content = add_skip_link(content)
            
            if content != original:
                with open(page, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed: {page}")
            else:
                print(f"No changes: {page}")
        except Exception as e:
            print(f"Error {page}: {e}")
    else:
        print(f"Not found: {page}")

print("Done!")
