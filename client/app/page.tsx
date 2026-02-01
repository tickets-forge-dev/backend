import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to tickets - AuthCheck will handle auth redirect to /login
  redirect('/tickets');
}
