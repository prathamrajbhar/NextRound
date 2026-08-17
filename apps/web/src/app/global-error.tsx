'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>HireOS — Something went wrong</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #020617;
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
          }
          .card {
            text-align: center;
            max-width: 420px;
          }
          .icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 20px;
            border-radius: 16px;
            background: rgba(127, 29, 29, 0.35);
            border: 1px solid rgba(248, 113, 113, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fca5a5;
            font-size: 26px;
            font-weight: 700;
          }
          h1 {
            font-size: 17px;
            font-weight: 800;
            letter-spacing: -0.01em;
            color: #f1f5f9;
          }
          p {
            margin-top: 8px;
            font-size: 13px;
            font-weight: 500;
            line-height: 1.5;
            color: #94a3b8;
          }
          code {
            display: block;
            margin-top: 12px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11px;
            color: #64748b;
          }
          .actions {
            margin-top: 24px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
          }
          button {
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            font-weight: 800;
            padding: 10px 16px;
            border-radius: 12px;
            border: none;
            background: #ea580c;
            color: #fff;
            transition: background 0.15s ease;
          }
          button:hover { background: #c2410c; }
        `}</style>
      </head>
      <body>
        <div className="card" role="alert">
          <div className="icon">!</div>
          <h1>Something went wrong</h1>
          <p>An unexpected error interrupted this page. You can try again, or head back to the home page.</p>
          {error.digest && <code>Reference: {error.digest}</code>}
          <div className="actions">
            <button type="button" onClick={() => retry()}>
              Try Again
            </button>
            <button type="button" onClick={() => { window.location.href = new URL('/', window.location.origin).href; }}>
              Back to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
