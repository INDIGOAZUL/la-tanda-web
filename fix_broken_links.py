#!/usr/bin/env python3
"""
Fix broken/placeholder links in la-tanda-web
- Convert <a href="#"> with data-action to <button>
- Convert <a href="#"> with onclick JS actions to <button>
- Fix other placeholder hrefs

Copyright (c) 2026 思捷娅科技 (SJYKJ) — MIT License
"""
import re
import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    fixes = []
    
    # Pattern 1: <a ... data-action="..." ... href="#" ...>
    # Convert to <button data-action="..." ...>
    pattern1 = r'<a(\s+[^>]*?)href="#"([^>]*?)>'
    
    def replace_with_button(m):
        attrs1 = m.group(1)
        attrs2 = m.group(2)
        all_attrs = attrs1 + ' ' + attrs2
        
        # Extract key attributes
        data_action = re.search(r'data-action="([^"]*)"', all_attrs)
        onclick = re.search(r'onclick="([^"]*)"', all_attrs)
        cls = re.search(r'class="([^"]*)"', all_attrs)
        id_attr = re.search(r'id="([^"]*)"', all_attrs)
        
        # Build button tag
        parts = ['<button']
        if data_action:
            parts.append(f'data-action="{data_action.group(1)}"')
        if cls:
            parts.append(f'class="{cls.group(1)}"')
        if onclick:
            parts.append(f'onclick="{onclick.group(1)}"')
        if id_attr:
            parts.append(f'id="{id_attr.group(1)}"')
        parts.append('</button>')
        
        return ''.join(parts)
    
    content = re.sub(pattern1, replace_with_button, content)
    
    # Pattern 2: <a href="#" class="more-menu-item" ... onclick="...">
    # These are menu items - convert to button
    pattern2 = r'<a\s+([^>]*?)class="more-menu-item"([^>]*?)href="#"([^>]*?)>'
    
    def replace_menu_item(m):
        before = m.group(1)
        after = m.group(2)
        after_href = m.group(3)
        all_attrs = before + 'class="more-menu-item" ' + after + ' ' + after_href
        
        onclick = re.search(r'onclick="([^"]*)"', all_attrs)
        cls = re.search(r'class="([^"]*)"', all_attrs)
        id_attr = re.search(r'id="([^"]*)"', all_attrs)
        
        parts = ['<button']
        if cls:
            parts.append(f'class="{cls.group(1)}"')
        if onclick:
            parts.append(f'onclick="{onclick.group(1)}"')
        if id_attr:
            parts.append(f'id="{id_attr.group(1)}"')
        parts.append('</button>')
        
        return ''.join(parts)
    
    content = re.sub(pattern2, replace_menu_item, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all HTML files
html_files = [f for f in os.listdir('.') if f.endswith('.html')]
fixed_count = 0

for fname in sorted(html_files):
    try:
        if fix_file(fname):
            print(f"Fixed: {fname}")
            fixed_count += 1
    except Exception as e:
        print(f"Error in {fname}: {e}")

print(f"\nTotal files fixed: {fixed_count}")
