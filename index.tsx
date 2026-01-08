
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Vercel/브라우저 환경에서 process.env 접근 시 에러 방지용 심(Shim)
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
