import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/welcome');
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your Privacy Matters</h2>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h3 className="font-bold text-lg mb-3">1. Information We Collect</h3>
            <p className="text-muted-foreground mb-3">
              We collect several types of information to provide and improve our services:
            </p>
            <h4 className="font-semibold mb-2">Information You Provide:</h4>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Account information (name, username, email, phone number)</li>
              <li>Profile information (bio, profile picture, website)</li>
              <li>Content you create (posts, glimpses, stories, comments, messages)</li>
              <li>Connections (followers, following, close friends, blocked users)</li>
              <li>Payment information (for premium features)</li>
            </ul>
            <h4 className="font-semibold mb-2">Automatically Collected Information:</h4>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information (device type, OS, browser, unique identifiers)</li>
              <li>Usage data (features used, actions taken, time spent)</li>
              <li>Location data (IP address, approximate location)</li>
              <li>Log data (access times, pages viewed, crashes, errors)</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">2. How We Use Your Information</h3>
            <p className="text-muted-foreground mb-3">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve Iris services</li>
              <li>Personalize your experience and show relevant content</li>
              <li>Process transactions and send related information</li>
              <li>Send notifications, updates, and marketing communications</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address security issues and fraud</li>
              <li>Comply with legal obligations and enforce our Terms</li>
              <li>Develop new features and improve existing ones</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">3. Information Sharing and Disclosure</h3>
            <p className="text-muted-foreground mb-3">
              We do NOT sell your personal information. We may share your information in the following circumstances:
            </p>
            <h4 className="font-semibold mb-2">With Your Consent:</h4>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>When you explicitly authorize us to share information</li>
              <li>When you share content publicly or with other users</li>
            </ul>
            <h4 className="font-semibold mb-2">Service Providers:</h4>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Cloud storage providers (Firebase, Supabase)</li>
              <li>Analytics services</li>
              <li>Payment processors</li>
              <li>Content delivery networks</li>
            </ul>
            <h4 className="font-semibold mb-2">Legal Requirements:</h4>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>To comply with laws, regulations, or legal processes</li>
              <li>To protect rights, property, or safety of Iris and users</li>
              <li>In connection with legal investigations</li>
            </ul>
            <h4 className="font-semibold mb-2">Business Transfers:</h4>
            <p className="text-muted-foreground pl-6">
              In connection with mergers, acquisitions, or sale of assets, your information may be transferred.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">4. Your Privacy Rights and Choices</h3>
            <p className="text-muted-foreground mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Privacy Controls:</strong> Manage who can see your content and interact with you</li>
              <li><strong>Cookie Settings:</strong> Control cookie preferences in your browser</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">5. Data Security</h3>
            <p className="text-muted-foreground mb-3">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Secure authentication with password hashing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and monitoring</li>
              <li>Firewall protection and intrusion detection</li>
            </ul>
            <p className="text-muted-foreground">
              However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but continuously work to protect your data.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">6. Data Retention</h3>
            <p className="text-muted-foreground mb-3">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p className="text-muted-foreground">
              When you delete your account, we delete your personal data within 30 days, except where retention is required by law or legitimate business purposes.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">7. Children's Privacy</h3>
            <p className="text-muted-foreground mb-3">
              Iris is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
            <p className="text-muted-foreground">
              If we learn that we have collected information from a child under 13, we will delete it immediately. If you believe a child under 13 has provided us with personal information, please contact us at privacy@iris.app.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">8. International Data Transfers</h3>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">9. Third-Party Services and Links</h3>
            <p className="text-muted-foreground mb-3">
              Iris may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to third-party services.
            </p>
            <p className="text-muted-foreground">
              We recommend reviewing the privacy policies of any third-party services you access through Iris.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">10. Cookies and Tracking Technologies</h3>
            <p className="text-muted-foreground mb-3">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Keep you logged in</li>
              <li>Understand how you use our Service</li>
              <li>Improve performance and user experience</li>
              <li>Deliver relevant content and advertisements</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">11. Changes to This Privacy Policy</h3>
            <p className="text-muted-foreground mb-3">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Posting the updated policy with a new "Last Updated" date</li>
              <li>Sending an email notification to registered users</li>
              <li>Displaying an in-app notification</li>
            </ul>
            <p className="text-muted-foreground">
              Your continued use of Iris after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">12. Contact Us</h3>
            <p className="text-muted-foreground mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:
            </p>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Email:</strong> privacy@iris.app</li>
              <li><strong>Legal:</strong> legal@iris.app</li>
              <li><strong>Support:</strong> support@iris.app</li>
            </ul>
          </section>

          <section className="border-t pt-6">
            <p className="text-muted-foreground text-sm italic">
              This Privacy Policy is effective as of January 2025 and applies to all users of Iris. By using our Service, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
