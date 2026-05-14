import requests

def send_expo_push_notification(token, title, body, data=None):
    if not token:
        return
    
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
    }
    if data:
        payload["data"] = data
        
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
    except Exception as e:
        # Silently fail to prevent breaking the API if Expo servers are down
        print(f"Error sending push notification to {token}: {e}")
