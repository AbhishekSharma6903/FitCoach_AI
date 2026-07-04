import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">FitCoach AI</h1>
          <p className="text-gray-500 text-sm mt-2">Create your account to get started</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-gray-900 border border-gray-800 shadow-card rounded-2xl",
              headerTitle: "text-gray-100",
              headerSubtitle: "text-gray-500",
              socialButtonsBlockButton:
                "bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700",
              dividerLine: "bg-gray-800",
              dividerText: "text-gray-600",
              formFieldLabel: "text-gray-300",
              formFieldInput:
                "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-brand-500",
              formButtonPrimary:
                "bg-brand-500 hover:bg-brand-600 text-white font-semibold",
              footerActionLink: "text-brand-400 hover:text-brand-300",
            },
          }}
        />
      </div>
    </div>
  );
}
