# api/features/common/user_agent.py
"""
User agent parsing utilities.
"""

from user_agents import parse as ua_parse


def parse_user_agent(user_agent_string: str) -> dict:
    """
    Parse user-agent string into human-readable device info.
    Returns: dict with device_type, device_name, browser, os
    """
    if not user_agent_string:
        return {
            'device_type': 'unknown',
            'device_icon': '💻',
            'device_name': 'Unknown Device',
            'browser': 'Unknown',
            'os': 'Unknown'
        }
    
    try:
        ua = ua_parse(user_agent_string)
        
        # Determine device type and icon
        if ua.is_mobile:
            device_type = 'mobile'
            device_icon = '📱'
        elif ua.is_tablet:
            device_type = 'tablet'
            device_icon = '📱'
        elif ua.is_pc:
            device_type = 'desktop'
            device_icon = '💻'
        else:
            device_type = 'unknown'
            device_icon = '💻'
        
        # Build device name
        browser_name = ua.browser.family if ua.browser.family != 'Other' else 'Unknown'
        os_name = ua.os.family if ua.os.family != 'Other' else 'Unknown'
        
        # Create clean device name
        parts = []
        if browser_name:
            parts.append(browser_name)
        if os_name:
            parts.append(f"on {os_name}")
        
        device_name = ' '.join(parts) if parts else 'Unknown Device'
        
        return {
            'device_type': device_type,
            'device_icon': device_icon,
            'device_name': device_name,
            'browser': browser_name,
            'os': os_name
        }
    except Exception as e:
        return {
            'device_type': 'unknown',
            'device_icon': '💻',
            'device_name': 'Unknown Device',
            'browser': 'Unknown',
            'os': 'Unknown'
        }


def parse_user_agent_basic(user_agent_str: str) -> dict:
    """
    Parse user agent string to extract device type, browser, and OS information.
    Basic implementation without external library.
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
    if 'windows nt 11' in user_agent_lower or 'windows 11' in user_agent_lower:
        os_name = 'Windows 11'
    elif 'windows nt 10.0' in user_agent_lower:
        os_name = 'Windows 11'  # Many Windows 11 builds report NT 10.0
    elif 'windows nt 10' in user_agent_lower:
        os_name = 'Windows 10'
    elif 'windows nt' in user_agent_lower:
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
            if 'OS ' in user_agent_str:
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
