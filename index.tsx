import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Vercel/브라우저 환경에서 process 객체 미정의로 인한 에러 방지
if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || { env: {} };
  win.global = win.global || win;
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Check your index.html.");
}