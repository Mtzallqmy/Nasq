import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نَسَق — الأساس الهندسي',
  description: 'نَسَق: منصة عربية موحدة للإدارة والمهام والمال والعمل الجماعي',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
