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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database and deployment

PolyHub currently uses PostgreSQL through Prisma. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in the environment. Google sign-in also requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
The scheduled BTEB notice sync also requires a private `CRON_SECRET`; configure the same value in the deployment environment so Vercel Cron can authenticate requests.

For a new or local database, sync the Prisma schema before starting the app:

```bash
npx prisma db push
```

The Higher-Study Community feed at `/dashboard/my-higher-study` is publicly readable. Signed-in users can submit resources, like or dislike approved posts, and comment; new posts appear publicly after moderator approval. Apply the Prisma schema with `npx prisma db push` before using submissions and interactions.

For production, provision PostgreSQL and apply the reviewed Prisma schema changes to that database before deploying the application. Do not copy local `.env` values into deployment settings. The production build and lint checks are:

```bash
npm run lint
npm run build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# polyHub
