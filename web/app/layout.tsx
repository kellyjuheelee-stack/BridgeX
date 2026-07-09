import type { ReactNode } from "react";

export const metadata = {
  title: "BridgeX",
  description: "K-뷰티 유럽 수출 지원",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
