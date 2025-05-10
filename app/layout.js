import './globals.css';

export const metadata = {
  title: 'Propensia.ai MVP',
  description: 'Dashboard for Propensia.ai',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}