import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-indigo-400">Terms of Service</h1>
        <div className="prose prose-invert prose-lg space-y-4">
          <p>
            Welcome to Aether AI! These terms and conditions outline the rules and regulations for the use of our application.
          </p>
          <h2 className="text-2xl font-bold pt-6">1. Acceptance of Terms</h2>
          <p>
            By accessing this application, we assume you accept these terms and conditions. Do not continue to use Aether AI if you do not agree to all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-2xl font-bold pt-6">2. Prohibited Activities</h2>
          <p>
            You are specifically restricted from all of the following: publishing any application material in any other media; selling, sublicensing and/or otherwise commercializing any application material; using this application in any way that is or may be damaging to this application...
          </p>
          <p className="pt-4">
            [...Your full Terms of Service text here...]
          </p>
        </div>
        <div className="mt-12">
          <Link href="/" className="text-indigo-400 hover:underline">
            &larr; Back to Aether AI
          </Link>
        </div>
      </div>
    </div>
  );
}