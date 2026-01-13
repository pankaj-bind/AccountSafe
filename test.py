import requests

def get_ip_location_and_isp():
    try:
        response = requests.get("https://ipinfo.io/json", timeout=5)
        data = response.json()

        ip_address = data.get("ip")
        city = data.get("city")
        region = data.get("region")
        country = data.get("country")
        location = data.get("loc")  # latitude,longitude
        isp = data.get("org")

        latitude, longitude = location.split(",")

        print("📍 IP Address :", ip_address)
        print("🌍 Location   :", city, region, country)
        print("🧭 Latitude   :", latitude)
        print("🧭 Longitude  :", longitude)
        print("🏢 ISP        :", isp)

    except Exception as e:
        print("Error:", e)

get_ip_location_and_isp()
