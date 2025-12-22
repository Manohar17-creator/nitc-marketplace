import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: December 22, 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="mb-2">
          By accessing and using <strong>NITC Marketplace</strong> (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. 
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
        <p className="mb-2">
          The Service is a platform designed for the students of NIT Calicut to buy, sell, and exchange items, find lost belongings, and share campus events.
        </p>
      </section>

      {/* 🛡️ CRITICAL FOR MARKETPLACES */}
      <section className="mb-8 border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r">
        <h2 className="text-xl font-semibold mb-3 text-red-900">3. Disclaimer of Warranties (Marketplace Transactions)</h2>
        <p className="mb-3">
          <strong>NITC Marketplace</strong> acts solely as a venue for users to connect. We are not a party to any transaction between buyers and sellers.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            We do not verify the quality, safety, or legality of items advertised.
          </li>
          <li>
            You agree that any transaction you enter into is at your own risk. We are not liable for any loss or damage arising from your interactions with other users.
          </li>
          <li>
            Please use caution and common sense when meeting others for transactions.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
        <p>You agree not to post content that is:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Unlawful, harmful, threatening, or abusive.</li>
          <li>False, misleading, or deceptive.</li>
          <li>In violation of any third-party rights (copyright, trademark, privacy).</li>
          <li>Contains viruses or malicious code.</li>
        </ul>
        <p className="mt-2">
          We reserve the right to terminate accounts and remove content at our sole discretion.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
        <p>
          In no event shall <strong>NITC Marketplace</strong> or its developers be liable for any indirect, incidental, special, consequential or punitive damages arising out of your use of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at: <br />
          <span className="font-medium">support@unyfy.in</span>
        </p>
      </section>
    </div>
  );
}