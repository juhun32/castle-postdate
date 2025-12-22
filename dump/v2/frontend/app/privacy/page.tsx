import React from "react";

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-8 py-32">
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Introduction</h2>
                <p className="mb-4 text-sm">
                    Welcome to Calple. I, as sole developer, respect your
                    privacy and am committed to protecting your personal data.
                    This privacy policy explains how I collect, use, and
                    safeguard your information when you use Calple.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                    Information I Collect
                </h2>
                <p className="mb-4 text-sm">
                    I collect information that you provide directly, including:
                </p>
                <ul className="list-disc ml-6 mb-4 text-sm">
                    <li>Your Google account information (email, name)</li>
                    <li>Any data you choose to add to the app</li>
                    <li>Device information and usage statistics</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                    How I Use Your Information
                </h2>
                <p className="mb-4 text-sm">I use your information to:</p>
                <ul className="list-disc ml-6 mb-4 text-sm">
                    <li>Provide, improve and maintain Calple</li>
                    <li>Develop upcoming features</li>
                    <li>
                        Respond to your requests, feedback and support needs
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Your Rights</h2>
                <p className="mb-4 text-sm">You have the right to:</p>
                <ul className="list-disc ml-6 mb-4 text-sm">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and associated data</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                    Updates to This Policy
                </h2>
                <p className="mb-4 text-sm">
                    I may update this privacy policy from time to time,
                    according to the additional features I may add.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Contact Me</h2>
                <p className="mb-4 text-sm">
                    If you have any questions about this Privacy Policy, please
                    contact me at:
                    <br />
                    <a
                        href="mailto:riann3207@gmail.com"
                        className="text-cyan-800 hover:underline"
                    >
                        riann3207@gmail.com
                    </a>
                </p>
            </section>

            <footer className="text-sm text-muted-foreground">
                Juhun &copy; 2025
            </footer>
        </div>
    );
}
