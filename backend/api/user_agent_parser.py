# api/user_agent_parser.py

def parse_user_agent(user_agent_str):
    """
    Parse user agent string to extract device type, browser, and OS information.
    Returns a dictionary with device_type, browser, and os.
    """
    if not user_agent_str:
        return {
            'device_type': 'unknown',
            'browser': 'Unknown',
            'os': 'Unknown'
        }
    
    user_agent_lower = user_agent_str.lower()
    
    # Detect device type
    if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
        device_type = 'mobile'
    elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
        device_type = 'tablet'
    else:
        device_type = 'desktop'
    
    # Detect browser
    browser = 'Unknown'
    if 'edg' in user_agent_lower:
        browser = 'Edge'
        # Extract version
        try:
            version = user_agent_str.split('Edg/')[1].split('.')[0]
            browser = f'Edge {version}'
        except:
            pass
    elif 'chrome' in user_agent_lower and 'edg' not in user_agent_lower:
        browser = 'Chrome'
        try:
            version = user_agent_str.split('Chrome/')[1].split('.')[0]
            browser = f'Chrome {version}'
        except:
            pass
    elif 'firefox' in user_agent_lower:
        browser = 'Firefox'
        try:
            version = user_agent_str.split('Firefox/')[1].split('.')[0]
            browser = f'Firefox {version}'
        except:
            pass
    elif 'safari' in user_agent_lower and 'chrome' not in user_agent_lower:
        browser = 'Safari'
        try:
            version = user_agent_str.split('Version/')[1].split('.')[0]
            browser = f'Safari {version}'
        except:
            pass
    elif 'opera' in user_agent_lower or 'opr' in user_agent_lower:
        browser = 'Opera'
    
    # Detect OS
    os_name = 'Unknown'
    # Prefer more specific checks first. Some Windows 11 user-agents report
    # "Windows NT 10.0" (same as Windows 10), so we check for explicit
    # Windows 11 tokens and the 10.0 case before matching a generic "windows nt 10".
    if 'windows nt 11' in user_agent_lower or 'windows 11' in user_agent_lower:
        os_name = 'Windows 11'
    elif 'windows nt 10.0' in user_agent_lower:
        # Many Windows 11 builds still report NT 10.0 — treat as Windows 11
        os_name = 'Windows 11'
    elif 'windows nt 10' in user_agent_lower:
        os_name = 'Windows 10'
    elif 'windows nt' in user_agent_lower:
        # Fallback: try to extract NT version and return it explicitly
        try:
            nt_version = user_agent_lower.split('windows nt ')[1].split(';')[0].split(')')[0].strip()
            os_name = f'Windows NT {nt_version}'
        except Exception:
            os_name = 'Windows'
    elif 'mac os x' in user_agent_lower or 'macos' in user_agent_lower:
        os_name = 'macOS'
        try:
            version = user_agent_str.split('Mac OS X ')[1].split(')')[0].replace('_', '.')
            os_name = f'macOS {version}'
        except:
            pass
    elif 'android' in user_agent_lower:
        os_name = 'Android'
        try:
            # Try multiple patterns for Android version extraction
            if 'Android ' in user_agent_str:
                version = user_agent_str.split('Android ')[1].split(';')[0].split(')')[0].strip()
                os_name = f'Android {version}'
        except:
            pass
    elif 'iphone' in user_agent_lower or 'ipad' in user_agent_lower:
        if 'ipad' in user_agent_lower:
            os_name = 'iPadOS'
        else:
            os_name = 'iOS'
        try:
            # Try to extract iOS/iPadOS version
            if 'OS ' in user_agent_str:
                # Pattern: "OS 15_0" or "OS 15_0_1"
                version_part = user_agent_str.split('OS ')[1].split(' ')[0].replace('_', '.')
                os_name = f'{os_name} {version_part}'
            elif 'iPhone OS ' in user_agent_str:
                version_part = user_agent_str.split('iPhone OS ')[1].split(' ')[0].replace('_', '.')
                os_name = f'iOS {version_part}'
        except:
            pass
    elif 'linux' in user_agent_lower:
        os_name = 'Linux'
    
    return {
        'device_type': device_type,
        'browser': browser,
        'os': os_name
    }
