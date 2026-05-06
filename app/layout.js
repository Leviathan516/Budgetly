import './globals.css';

export const metadata = {
  title: 'Budgetly — your money, on paper',
  description: 'A calm budgeting app for everyday spending',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="grain">{children}</body>
    </html>
  );
}
