import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cordel — Trabajo sereno, estructura clara',
    template: '%s · Cordel',
  },
  description:
    'Cordel reúne tus organizaciones, equipos y tareas en un mismo lugar, con roles claros y aislamiento de datos entre equipos.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
