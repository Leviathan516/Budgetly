import './globals.css';

export const metadata = {
  title: 'Budgetly — your money, on paper',
  description: 'A calm budgeting app for everyday spending',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#faf7f0',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="grain">{children}</body>
    </html>
  );
}
