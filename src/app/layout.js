import './globals.css';

export const metadata = {
  title: 'PainterPro',
  description: 'Professional paint quotation and client management for Nippon Paint dealers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
