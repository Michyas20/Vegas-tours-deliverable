'use client';

import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        if (!mounted || !containerRef.current) return;

        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            rememberLastUsedCamera: true,
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            onScan(decodedText);
            scanner.clear().catch(() => {});
          },
          (errorMessage: string) => {
            // Ignore continuous scan errors (normal behavior)
          }
        );

        scannerRef.current = scanner;
        setIsReady(true);
      } catch (err) {
        onError?.('Failed to initialize camera. Please ensure camera permissions are granted.');
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan, onError]);

  return (
    <div className="vh-qr-scanner-container">
      <div id="qr-reader" ref={containerRef} className="vh-qr-reader" />
      {!isReady && (
        <div className="vh-qr-loading">
          <p>Initializing camera...</p>
        </div>
      )}
    </div>
  );
}
