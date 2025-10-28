import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import registerWAImg from '../assets/RegisterWAimage.png'
import { BASE_URL } from '../api';
const WhatsappSetupGuide = () => {
  const [expandedSections, setExpandedSections] = useState<any>({
    meta: true,
    api: false,
    webhook: false,
    permissions: false,
    test: false
  });

  const [copiedField, setCopiedField] = useState('');

  const toggleSection = (section: any) => {
    setExpandedSections((prev: any) => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = (text: any, field: any) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const Section = ({ id, title, icon, children }: any) => (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {expandedSections[id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {expandedSections[id] && (
        <div className="px-6 py-5 bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  const Step = ({ number, title, children }: any) => (
    <div className="mb-6 last:mb-0">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
          <div className="text-gray-600 text-sm space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );

  const CodeBlock = ({ code, label }: any) => (
    <div className="bg-gray-900 rounded-lg p-4 my-3 relative group">
      <button
        onClick={() => copyToClipboard(code, label)}
        className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
      >
        {copiedField === label ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
      </button>
      <pre className="text-sm text-gray-100 overflow-x-auto pr-12">
        <code>{code}</code>
      </pre>
    </div>
  );

  const InfoBox = ({ type = "info", children }: any) => {
    const styles: any = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      success: "bg-green-50 border-green-200 text-green-800"
    };

    return (
      <div className={`border rounded-lg p-4 my-3 ${styles[type]}`}>
        <div className="flex gap-3">
          {type === "info" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {type === "warning" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Business API Setup Guide</h1>
          <p className="text-gray-600">Complete documentation for integrating WhatsApp Business API</p>
        </div>

        {/* Meta Configuration Section */}
        <Section
          id="meta"
          title="Meta Developer Setup"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        >
          <Step number="1" title="Create Meta App">
            <p>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Meta for Developers <ExternalLink className="w-3 h-3" /></a></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Click on "My Apps" in the top right</li>
              <li>Select "Create App"</li>
              <li>Choose "Business" as the app type</li>
              <li>Fill in your app details and create</li>
            </ul>
          </Step>

          <Step number="2" title="Add WhatsApp Product">
            <p>In your app dashboard:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Scroll to "Add Products to Your App"</li>
              <li>Find "WhatsApp" and click "Set up"</li>
              <li>Select or create a Business Account</li>
            </ul>
            <InfoBox type="info">
              This will take you to the WhatsApp Business Platform getting started page.
            </InfoBox>
          </Step>

          <Step number="3" title="Get App Credentials">
            <p>Navigate to Settings → Basic to find:</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div><strong>App ID:</strong> Your application identifier</div>
              <div><strong>App Secret:</strong> Used for secure API calls</div>
            </div>
            <CodeBlock code="App ID: 1234567890123456" label="app-id" />
          </Step>

          <Step number="4" title="Get Access Token">
            <p>Go to WhatsApp → Getting Started or API Setup:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Find the "Temporary Access Token" section</li>
              <li>Copy the temporary token (valid for 24 hours)</li>
              <li>For production, generate a System User Token (permanent)</li>
            </ul>
            <CodeBlock code="EAABsbCS1iHgBO..." label="token" />
            <InfoBox type="warning">
              Temporary tokens expire in 24 hours. Use System User Access Tokens for production.
            </InfoBox>
          </Step>

          <Step number="5" title="Get Phone Number ID">
            <p>In WhatsApp → API Setup:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Look for "Phone number ID" under your test number</li>
              <li>This is different from your actual phone number</li>
              <li>Copy the Phone Number ID</li>
            </ul>
            <CodeBlock code="Phone Number ID: 109876543210987" label="phone-id" />
          </Step>

          <Step number="6" title="Get Business Account ID">
            <p>Navigate to WhatsApp → Getting Started:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Find "WhatsApp Business Account ID" at the top</li>
              <li>Or go to Business Settings → Accounts → WhatsApp Accounts</li>
              <li>Copy the Account ID</li>
            </ul>
            <CodeBlock code="Business Account ID: 123456789012345" label="business-id" />
          </Step>
        </Section>

        {/* API Configuration Section */}
        <Section
          id="api"
          title="API Configuration"
          icon={<AlertCircle className="w-5 h-5 text-blue-500" />}
        >
          <Step number="1" title="Required Configuration Parameters">
            <div className="space-y-4">
              <div>
                <strong className="text-gray-800">phone_number</strong>
                <p className="text-sm mt-1">Your WhatsApp Business phone number in E.164 format</p>
                <CodeBlock code='"+1234567890"' label="phone-format" />
              </div>

              <div>
                <strong className="text-gray-800">display_name</strong>
                <p className="text-sm mt-1">Name shown to users (2-50 characters)</p>
                <CodeBlock code='"My Business"' label="display-name" />
              </div>

              <div>
                <strong className="text-gray-800">business_name</strong>
                <p className="text-sm mt-1">Official business name (2-100 characters)</p>
                <CodeBlock code='"My Business Inc."' label="business-name" />
              </div>

              <div>
                <strong className="text-gray-800">phone_number_id</strong>
                <p className="text-sm mt-1">The Phone Number ID from Meta dashboard</p>
                <CodeBlock code='"109876543210987"' label="phone-id-param" />
              </div>

              <div>
                <strong className="text-gray-800">business_account_id</strong>
                <p className="text-sm mt-1">WhatsApp Business Account ID</p>
                <CodeBlock code='"123456789012345"' label="business-id-param" />
              </div>

              <div>
                <strong className="text-gray-800">token</strong>
                <p className="text-sm mt-1">Access token for API authentication</p>
                <CodeBlock code='"EAABsbCS1iHgBO..."' label="token-param" />
              </div>

              <div>
                <strong className="text-gray-800">api_key</strong>
                <p className="text-sm mt-1">Your application's API key</p>
                <CodeBlock code='"your_app_secret_key"' label="api-key" />
              </div>
            </div>
          </Step>

          <Step number="3" title="Register WhatsApp Account">
            <p>Connect WhatsApp</p>
            <img src={registerWAImg} alt='registerWAImg' />
          </Step>
        </Section>

        {/* Permissions Section */}
        <Section
          id="permissions"
          title="Required Permissions"
          icon={<CheckCircle className="w-5 h-5 text-purple-500" />}
        >
          <Step number="1" title="App Permissions">
            <p>Go to App Dashboard → App Review → Permissions and Features:</p>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <strong>whatsapp_business_messaging</strong> - Send messages
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <strong>whatsapp_business_management</strong> - Manage account
              </div>
            </div>
            <InfoBox type="warning">
              Some permissions require App Review for production use.
            </InfoBox>
          </Step>

          <Step number="2" title="Business Verification">
            <p>For production and higher messaging limits:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Complete Meta Business Verification</li>
              <li>Verify your WhatsApp Business Account</li>
              <li>Submit your app for App Review</li>
            </ul>
            <InfoBox type="info">
              Unverified businesses are limited to 250 conversations per day.
            </InfoBox>
          </Step>
        </Section>

        {/* Webhook Configuration */}
        <Section
          id="webhook"
          title="Webhook Setup"
          icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
        >
          <Step number="1" title="Enable Webhooks">
            <p>In Meta App → WhatsApp → Configuration → Webhook:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Click "Edit" on the Callback URL field</li>
              <li>Enter your webhook URL (must be HTTPS)</li>
              <li>Enter a Verify Token (create your own secure string)</li>
              <li>Click "Verify and Save"</li>
            </ul>
            <CodeBlock
              code="http://localhost:3001/api/whatsapp/webhook-verify"
              label="webhook-url"
            />
            <CodeBlock
              code="WH_VERIFY_2025_aSdF7gHjKl9pQ2wE4rTyU6iO8pAsDfGhJkL"
              label="Token"
            />
          </Step>

          <Step number="2" title="Subscribe to Webhook Fields">
            <p>Select which events to receive:</p>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <strong>messages</strong> - Incoming messages
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <strong>message_status</strong> - Delivery, read receipts
              </div>
            </div>
          </Step>

          <Step number="4" title="Webhook Message Handler">
  <p className="mb-2">
    Handle incoming WhatsApp messages by setting up a POST endpoint:
  </p>

  <div className="bg-gray-100 rounded-lg p-3 mb-2 font-mono text-sm text-gray-800 overflow-x-auto">
    {`${BASE_URL}/whatsapp/webhook-verify`}
  </div>

  <p className="text-gray-600 text-sm">
    To verify the webhook, use the token:{" "}
    <span className="font-semibold text-gray-800">
      WH_VERIFY_2025_aSdF7gHjKl9pQ2wE4rTyU6iO8pAsDfGhJkL
    </span>
  </p>

  <p className="text-gray-600 text-sm mt-2">
    This token ensures that incoming messages are authenticated and prevents unauthorized requests.
  </p>
</Step>
        </Section>

        {/* Enable Messaging Groups */}
        <Section
          id="test"
          title="Enable Messaging & Test"
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        >
          <Step number="1" title="Add Test Phone Numbers">
            <p>In WhatsApp → API Setup → To:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Click "Add phone number"</li>
              <li>Enter the number you want to test with</li>
              <li>Verify via SMS code</li>
            </ul>
            <InfoBox type="info">
              You can add up to 5 test numbers before business verification.
            </InfoBox>
          </Step>

          <Step number="2" title="Disable Group Messaging (Optional)">
            <p>By default, WhatsApp Business API doesn't support group messaging for most use cases.</p>
            <InfoBox type="warning">
              The WhatsApp Business API is designed for 1:1 customer conversations. Group messaging requires special permissions and is typically not available for standard business use cases.
            </InfoBox>
          </Step>

          <Step number="3" title="Send Test Message">
            <p>Use the API Setup page to send a test message:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Select a test recipient</li>
              <li>Click "Send message"</li>
              <li>Check your phone for the message</li>
            </ul>
            <InfoBox type="success">
              If you receive the message, your setup is working correctly!
            </InfoBox>
          </Step>

          <Step number="4" title="Production Checklist">
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>Business verification completed</span>
              </div>
              <div className="flex items-center gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>System User Access Token created</span>
              </div>
              <div className="flex items-center gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>Webhook configured and tested</span>
              </div>
              <div className="flex items-center gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>Message templates created and approved</span>
              </div>
              <div className="flex items-center gap-2 p-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>App permissions reviewed and approved</span>
              </div>
            </div>
          </Step>
        </Section>

        {/* Footer */}
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 text-center">
          <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Check out the official documentation for more details
          </p>
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            WhatsApp Cloud API Documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WhatsappSetupGuide;