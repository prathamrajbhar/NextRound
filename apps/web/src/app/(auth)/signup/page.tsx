import SignupForm from './_components/SignupForm';






export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const role = params.role;
  return <SignupForm initialRole={role === 'hr' || role === 'candidate' ? role : 'candidate'} />;
}
