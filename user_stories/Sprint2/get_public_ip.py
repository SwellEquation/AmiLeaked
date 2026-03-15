import requests

response = requests.get("https://api.ipify.org")
public_ip = response.text

print("Public IPv4 Address:", public_ip)
