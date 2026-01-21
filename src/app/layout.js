import '../styles/globals.css';
import '../styles/variables.css';
import Navigation from '../components/Navigation';

export const metadata = {
  title: '即メモ',
  description: 'Instant Memo & Review App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Navigation />
      </body>
    </html>
  );
}
