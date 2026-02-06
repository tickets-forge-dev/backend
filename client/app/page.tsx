import { redirect } from 'next/navigation';

export default async function RootPage() {
  // Redirect to tickets - AuthCheck will handle auth redirect to /login
  redirect('/tickets');
}
