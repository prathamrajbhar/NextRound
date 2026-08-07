import SignupForm from './_components/SignupForm';

/**
 * Server wrapper that resolves the `?role=` query param (e.g. the landing
 * page links `/signup?role=hr`) and hands it to the client form as the
 * initial account type — avoiding a client-side effect / hydration mismatch.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const role = params.role;
  return <SignupForm initialRole={role === 'hr' || role === 'candidate' ? role : 'candidate'} />;
}
