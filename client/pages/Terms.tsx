import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-lg font-semibold">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Terms of Service</h2>
          <p className="text-sm text-muted-foreground">Effective: January 2025</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h3 className="font-bold text-lg mb-3">1. Acceptance of Terms</h3>
            <p className="text-muted-foreground mb-3">
              By creating an account, accessing, or using Iris ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>
            <p className="text-muted-foreground">
              These Terms constitute a legally binding agreement between you and Iris. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">2. Eligibility</h3>
            <p className="text-muted-foreground mb-3">
              You must be at least 13 years old to use Iris. If you are under 18, you represent that you have your parent or guardian's permission to use the Service.
            </p>
            <p className="text-muted-foreground">
              By using Iris, you represent and warrant that you have the right, authority, and capacity to enter into these Terms and to abide by all terms and conditions set forth herein.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">3. User Accounts</h3>
            <p className="text-muted-foreground mb-3">
              When you create an account, you must provide accurate and complete information. You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Maintaining the confidentiality of your account password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is current and accurate</li>
            </ul>
            <p className="text-muted-foreground">
              You may not transfer or share your account with anyone else. We are not liable for any loss or damage arising from unauthorized use of your account.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">4. User Content and Rights</h3>
            <p className="text-muted-foreground mb-3">
              You retain all ownership rights to content you post on Iris ("User Content"). However, by posting User Content, you grant Iris a worldwide, non-exclusive, royalty-free license to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Use, copy, reproduce, process, adapt, modify, and publish your content</li>
              <li>Display and distribute your content on and through the Service</li>
              <li>Allow other users to view, access, and share your content</li>
              <li>Create derivative works for purposes of operating the Service</li>
            </ul>
            <p className="text-muted-foreground">
              You represent that you own or have necessary rights to all User Content you post, and that your content does not violate any third-party rights.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">5. Prohibited Conduct</h3>
            <p className="text-muted-foreground mb-3">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Posting hate speech, harassment, bullying, or threatening content</li>
              <li>Creating fake accounts, spam, or engaging in deceptive practices</li>
              <li>Sharing illegal content or promoting illegal activities</li>
              <li>Impersonating others or misrepresenting your identity</li>
              <li>Infringing on intellectual property rights or copyrights</li>
              <li>Sharing sexually explicit content involving minors</li>
              <li>Attempting to hack, disrupt, or compromise the Service</li>
              <li>Scraping, data mining, or automated data collection</li>
              <li>Selling or transferring your account to others</li>
              <li>Using the Service for commercial purposes without authorization</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">6. Content Moderation</h3>
            <p className="text-muted-foreground mb-3">
              Iris reserves the right to review, monitor, and remove User Content that violates these Terms or is otherwise objectionable. We may:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Remove content without prior notice</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Cooperate with law enforcement when required</li>
              <li>Preserve content for legal investigations</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">7. Intellectual Property</h3>
            <p className="text-muted-foreground mb-3">
              The Service, including its design, logos, graphics, and software, is owned by Iris and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              You may not copy, modify, distribute, sell, or reverse engineer any part of the Service without our express written permission.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">8. Third-Party Links and Services</h3>
            <p className="text-muted-foreground">
              Iris may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of third-party sites. Your use of third-party services is at your own risk.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">9. Disclaimers and Limitations</h3>
            <p className="text-muted-foreground mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Guarantees of uninterrupted, secure, or error-free operation</li>
              <li>Accuracy or completeness of content</li>
            </ul>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IRIS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">10. Indemnification</h3>
            <p className="text-muted-foreground">
              You agree to indemnify and hold Iris harmless from any claims, damages, losses, and expenses (including attorney fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">11. Termination</h3>
            <p className="text-muted-foreground mb-3">
              We may suspend or terminate your account at any time, with or without notice, for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Extended periods of inactivity</li>
              <li>Any reason at our sole discretion</li>
            </ul>
            <p className="text-muted-foreground">
              Upon termination, you lose access to your account and content. You may also terminate your account at any time through Settings.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">12. Governing Law</h3>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">13. Changes to Terms</h3>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or Service notification. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-3">14. Contact Information</h3>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at: legal@iris.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
