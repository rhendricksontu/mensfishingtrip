import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "Reset Password · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Reset Password</h1>
        <p className="mt-1 text-brand-600">No email or texting needed. Just verify it&apos;s you.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
