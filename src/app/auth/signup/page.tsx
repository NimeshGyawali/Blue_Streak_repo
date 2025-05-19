import { UserAuthForm } from '@/components/auth/UserAuthForm';

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <UserAuthForm mode="signup" />
    </div>
  );
}
