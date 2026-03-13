# This script checks and updates broken or placeholder links across HTML pages

import os
from bs4 import BeautifulSoup

# Directory to scan for HTML files
HTML_DIR = './'

# List of placeholder or broken links to identify and replace
PLACEHOLDER_LINKS = ['#', 'http://example.com', 'https://example.com']
VALID_LINK = 'https://latanda.online'

# Function to fix broken links in an HTML file
def fix_broken_links(file_path):
    with open(file_path, 'r') as f:
        soup = BeautifulSoup(f, 'html.parser')

    updated = False

    # Loop through all the links in the HTML
    for link in soup.find_all('a', href=True):
        href = link['href']
        # Check if the link is a placeholder or broken
        if href in PLACEHOLDER_LINKS:
            link['href'] = VALID_LINK  # Replace with valid link
            updated = True

    if updated:
        # Save the updated HTML file
        with open(file_path, 'w') as f:
            f.write(str(soup))
        print(f'Updated: {file_path}')
    else:
        print(f'No updates needed for {file_path}')

# Main function to traverse the directory and fix links
def main():
    for root, dirs, files in os.walk(HTML_DIR):
        for file in files:
            if file.endswith('.html'):  # Only process HTML files
                file_path = os.path.join(root, file)
                fix_broken_links(file_path)

if __name__ == '__main__':
    main()