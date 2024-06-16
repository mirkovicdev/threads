import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
    //publicRoutes: ['/', '/api/webhook/clerk'],
    //ignoredRoutes: ['/api/webbook/clerk']
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};