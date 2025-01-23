import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      if (req.nextUrl.pathname.startsWith("/api/emails")) {
        return token !== null;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/api/emails/:path*"],
};
