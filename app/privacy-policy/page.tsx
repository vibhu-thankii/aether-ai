import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-indigo-400">Privacy Policy</h1>
        <div className="prose prose-invert prose-lg space-y-4">
          <p>
            Your privacy is important to us. It is Aether AI's policy to respect your privacy regarding any information we may collect from you across our application.
          </p>
          <h2 className="text-2xl font-bold pt-6">1. Information We Collect</h2>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used. This includes your email address for account creation and your name for personalization.
          </p>
          <h2 className="text-2xl font-bold pt-6">2. Use of Data</h2>
          <p>
            We use the collected data for various purposes: to provide and maintain our Service, to notify you about changes to our Service, to allow you to participate in interactive features of our Service when you choose to do so, and to provide customer support.
          </p>
          <p className="pt-4">
            [...Your full Privacy Policy text here...]
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