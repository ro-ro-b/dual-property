import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SSEProvider } from "@/components/SSEProvider";

export const metadata = {
  title: "DUAL Property | Tokenised Real Estate Investment",
  description: "Fractional real estate investment powered by the DUAL network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="font-display antialiased">
        <AuthProvider>
          <SSEProvider>
            {children}
          </SSEProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
