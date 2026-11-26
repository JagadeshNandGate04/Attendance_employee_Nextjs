This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Session refresh

Authenticated API requests retry once after a `401` response. Concurrent requests
in the same browser tab share a refresh request to `/api/v1/auth/refresh`.
The new access token, and a rotated refresh token if returned, are saved for
later requests. If the refresh token is rejected, the session is cleared and
the request reports that the user should sign in again. Network or server
errors are reported without clearing the session.

The original `401` may still appear in the browser's Network tab even when
the refresh and retry succeed.

## Personal details requests

On the Profile page, use the pencil icon under Personal details to submit
changes for admin approval. The displayed profile remains unchanged until the
backend returns approved values. The Pending requests tab shows outstanding
personal requests and can refresh their status; approved and rejected history
is not available from the current employee profile API.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
