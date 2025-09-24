import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/toaster";
import { urls } from "@/constants/constants";
import { SessionProvider } from "next-auth/react";
import { GitHubProvider } from "@/contexts/github-context";
import { SalesforceProvider } from "@/contexts/salesforce-context";
import { GlobalFeedbackButton } from "@/components/global-feedback-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISC CodeConnect",
  description:
    "ISC Code Connect is an AI-powered development assistant designed to enhance productivity for Salesforce developers. It leverages advanced AI models to generate, complete, and explain code, automate unit test creation, and facilitate learning of business logic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className="dark"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader showSpinner={false} />
          <Toaster />
          <SessionProvider basePath={urls.authBasePath}>
            <GitHubProvider>
              <SalesforceProvider>
                {children}
                <GlobalFeedbackButton />
              </SalesforceProvider>
            </GitHubProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
