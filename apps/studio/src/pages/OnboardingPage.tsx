import {OnboardingForm} from '@/components';

export function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Play.link!</h1>
          <p className="text-gray-200">Let's create your first organization to get started.</p>
        </div>

        <OnboardingForm />

        <p className="text-center text-gray-600 text-sm mt-6">
          You can always create more organizations later.
        </p>
      </div>
    </div>
  );
}
