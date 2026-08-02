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
      <body>
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-amber-400/10">
          <nav className="flex items-center gap-8 px-6 py-4 max-w-5xl mx-auto">
            <a href="/" className="flex items-center gap-2 text-amber-300 font-bold text-xl tracking-tight">
              <span>⚡</span>
           <span className={orbitron.className}>Voltcast</span>
            </a>
            <div className="flex gap-6 ml-4 text-sm font-medium">
              <a href="/" className="text-gray-300 hover:text-amber-300 transition">Home</a>
              <a href="/forecast" className="text-gray-300 hover:text-amber-300 transition">Forecast</a>
              <a href="/health" className="text-gray-300 hover:text-amber-300 transition">Health</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}