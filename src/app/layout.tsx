import type { Metadata } from 'next';
import './globals.css';
import { AudioProvider } from '@/components/audio/AudioManager';

export const metadata: Metadata = {
  title: 'Café Timelapse - A Journey Through Time',
  description: 'Experience a café transforming through decades from 1945 to 2055',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}