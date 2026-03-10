#!/usr/bin/env python3
import re
import os
from pathlib import Path

def fix_broken_links(file_path):
    """Fix href='#' and href='javascript:void(0)' in HTML files"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = []
    
    # Pattern 1: <a href="#" data-action="..."> → <button data-action="...">
    pattern1 = r'<a\s+([^>]*?)href=["\'](#|javascript:void\(0\))["\']\s+([^>]*?data-action=["\'][^"\']+["\'][^>]*?)>([^<]+)</a>'
    def replace_with_button(match):
        attrs_before = match.group(1).strip()
        attrs_after = match.group(3).strip()
        text = match.group(4)
        all_attrs = f"{attrs_before} {attrs_after}".strip()
        changes.append(f"Converted <a href='#' {all_attrs}> to <button>")
        return f'<button {all_attrs}>{text}</button>'
    
    content = re.sub(pattern1, replace_with_button, content)
    
    # Pattern 2: <a href="#"> without data-action → remove href or point to #top
    pattern2 = r'<a\s+([^>]*?)href=["\'](#|javascript:void\(0\))["\']\s*([^>]*?)>'
    def fix_plain_link(match):
        attrs_before = match.group(1).strip()
        attrs_after = match.group(3).strip()
        all_attrs = f"{attrs_before} {attrs_after}".strip()
        
        # If it's a navigation link (has class with "nav" or "menu"), keep as <a> but fix href
        if 'nav' in all_attrs.lower() or 'menu' in all_attrs.lower():
            changes.append(f"Removed placeholder href from nav link")
            return f'<a {all_attrs}>'
        else:
            changes.append(f"Fixed placeholder href")
            return f'<a {all_attrs}>'
    
    content = re.sub(pattern2, fix_plain_link, content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return []

# Process all HTML files
html_files = list(Path('.').glob('*.html'))
total_changes = 0

print(f"Processing {len(html_files)} HTML files...")
for html_file in html_files:
    changes = fix_broken_links(html_file)
    if changes:
        total_changes += len(changes)
        print(f"\n{html_file.name}: {len(changes)} fixes")

print(f"\n✅ Total fixes: {total_changes}")
