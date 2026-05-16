export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/accounting/:path*"]
};
