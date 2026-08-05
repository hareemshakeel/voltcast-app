import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['700', '900'] });
import './globals.css';
import './app.css';
import './index.css';

export const metadata = {
  title: 'Voltcast',
  description: 'Search any city and see live current weather.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-amber-400/10">
          <nav className="flex items-center gap-3 sm:gap-8 px-3 sm:px-6 py-4 max-w-5xl mx-auto">
            <a href="/" className="flex items-center gap-2 text-amber-300 font-bold text-lg sm:text-xl tracking-tight shrink-0">
              <span>⚡</span>
              <span className={orbitron.className}>Voltcast</span>
            </a>
            <div className="flex gap-3 sm:gap-6 sm:ml-4 text-xs sm:text-sm font-medium overflow-x-auto">
              <a href="/" className="text-gray-300 hover:text-amber-300 transition whitespace-nowrap">Home</a>
              <a href="/forecast" className="text-gray-300 hover:text-amber-300 transition whitespace-nowrap">Forecast</a>
              <a href="/health" className="text-gray-300 hover:text-amber-300 transition whitespace-nowrap">Health</a>
            </div>
          </nav>
        </header>

        {children}

        <a
          href="/assistant"
          aria-label="Open weather assistant chat"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
        >
          <span className="text-2xl">💬</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#10061f] animate-pulse" />
        </a>
      </body>
    </html>
  );
}