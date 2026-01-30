import '../styles/globals.css';
import '../styles/variables.css';
import Navigation from '../components/Navigation';

export const metadata = {
  title: '即メモ',
  description: 'Instant Memo & Review App',
};

import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="ja" suppressHydrationWarning>
        <body>
          {children}
          <Navigation />
        </body>
      </html>
    </ClerkProvider>
  );
}
