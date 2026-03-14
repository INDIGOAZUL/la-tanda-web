import requests
from bs4 import BeautifulSoup
def scrape_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(url, headers=headers)
        soup = BeautifulSoup(resp.content, 'html.parser')
        return [i.text.strip() for i in soup.find_all('h2')]
    except Exception as e:
        return f"Error: {e}"
