import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Dynamically set favicon and apple-touch-icon from env var (build-time)
const logoUrl = process.env.REACT_APP_LOGO_URL || '/account-safe-logo.png';
function setFavicon(href: string) {
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;

    let apple: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = href;
  } catch (e) {
    // ignore in non-browser environments
  }
}

setFavicon(logoUrl);
// Set document title from env var if provided
try { document.title = process.env.REACT_APP_PROJECT_NAME || document.title; } catch (e) { }
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
