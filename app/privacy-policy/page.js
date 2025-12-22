import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: December 22, 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="mb-2">
          {/* Fixed: Replaced " with &quot; */}
          Welcome to <strong>NITC Marketplace</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, and share information when you use our web application.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Information:</strong> When you register via Google Login, we collect your name, email address, and profile picture.</li>
          <li><strong>User Content:</strong> Information you voluntarily post, such as items for sale, lost & found listings, and events.</li>
          <li><strong>Usage Data:</strong> We automatically collect information about your device, browser, and IP address for security and analytics.</li>
        </ul>
      </section>

      {/* 🚨 CRITICAL FOR ADSENSE APPROVAL 🚨 */}
      <section className="mb-8 border-l-4 border-blue-600 pl-4 bg-blue-50 p-4 rounded-r">
        <h2 className="text-xl font-semibold mb-3 text-blue-900">3. Advertising and Cookies</h2>
        <p className="mb-3">
          We display advertisements on our website to support our services. These ads are served by <strong>Google AdSense</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            {/* Fixed: Replaced ' with &apos; */}
            <strong>Third-Party Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to our website or other websites.
          </li>
          <li>
            {/* Fixed: Replaced ' with &apos; */}
            <strong>DoubleClick Cookie:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
          </li>
          <li>
            {/* Fixed: Replaced ' with &apos; */}
            <strong>Opt-Out:</strong> Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Ads Settings</a>. Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting <a href="http://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-blue-600 underline">www.aboutads.info</a>.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Provide and maintain our Service.</li>
          <li>Allow you to post listings and communicate with other users.</li>
          <li>Detect and prevent fraud or abuse.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: <br />
          <span className="font-medium">support@unyfy.in</span>
        </p>
      </section>
    </div>
  );
}