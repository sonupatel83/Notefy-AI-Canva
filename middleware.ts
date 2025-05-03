import { withClerkMiddleware, getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/api/webhook", "/sign-in", "/sign-up"]

const isPublic = (path: string) => {
  return publicPaths.find((x) => path.startsWith(x))
}

export default withClerkMiddleware((request: NextRequest) => {
  // Handle logout redirection
  if (request.nextUrl.pathname === "/sign-out") {
    const landingUrl = new URL('/', request.url)
    return NextResponse.redirect(landingUrl)
  }

  if (isPublic(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const { userId } = getAuth(request)
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
