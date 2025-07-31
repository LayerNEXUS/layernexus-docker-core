// HelpAndSupportPage.jsx
import React, { useState } from "react";
import { LifeBuoy, Info, Bug, Mail, Sparkles, ChevronDown, Copy, BookOpen, AlertTriangle } from "lucide-react";

export default function HelpAndSupportPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500 p-6">
      {/* Header with decorative gradient */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight ">
            Help & Support
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Everything you need to master the platform
        </p>
      </div>

      {/* Enhanced scroll area with dynamic height */}
      <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-700 dark:hover:scrollbar-thumb-gray-700">
        <HelpCard 
          icon={Sparkles} 
          title="Quick Start Guide"
          isExpanded={expandedSection === 'quickStart'}
          onToggle={() => toggleSection('quickStart')}
        >
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                What file formats are supported?
              </strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                We currently support <code>.csv</code> and <code>.json</code> files. Excel and SQL parsing are on our roadmap.
                <br />
                For best performance, we recommend uploading sample files under <strong>10MB</strong> (maximum size: <strong>100MB</strong>).
              </p>
            </li>

            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                Upload Single / Multiple Files
              </strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                The system supports both single-file and multi-file uploads, with automatic detection of relationships across files.
              </p>
            </li>

              <li className="space-y-1">
                <strong className="font-medium text-gray-900 dark:text-white">
                  AI Enhancement
                </strong>
                <p className="text-gray-600 dark:text-gray-400 pl-4">
                  Use the <strong>AI Review</strong> button to normalize your data and receive smart schema suggestions — powered by your own OpenAI API key.
                  <br />
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    How to generate an OpenAI key
                  </a>
                </p>
              </li>

            <li className="space-y-1">
              <strong className="font-medium">Export Options</strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                Choose between SQL exports (multiple dialects) or PNG diagrams
              </p>
            </li>

          <li className="space-y-1">
            <strong className="font-medium text-gray-900 dark:text-white">
              What data do you send out?
            </strong>
            <p className="text-gray-600 dark:text-gray-400 pl-4">
              We never collect or store your uploaded files or generated schemas, everything remains fully under your control.
              The only outbound request we make is to verify your license with Keygen.sh, once during login and once every 24 hours.
            </p>
          </li>
            
            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                  Does OpenAI collect my data or use my data for training purposes?
                </strong>
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300">
                  "At OpenAI, protecting user data is fundamental to our mission. We do not train our models on inputs and outputs through our API."
                </blockquote>
                <p className="text-gray-600 dark:text-gray-400 pl-4">
                  According to OpenAI, the short answer is <strong>No</strong>. You can learn more on their{" "}
                  <a
                    href="https://openai.com/enterprise-privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    API data privacy page
                  </a>.
                </p>
            </li>
          </ol>
        </HelpCard>

        <HelpCard 
          icon={Bug} 
          title="Troubleshooting"
          isExpanded={expandedSection === 'troubleshooting'}
          onToggle={() => toggleSection('troubleshooting')}
        >
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                Upload Failed
              </strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                If an upload fails, the error message will appear in the bottom-left panel with the reason. The system attempts basic cleanup before processing,
                but we highly recommend reviewing your file for structural issues before uploading.
              </p>
            </li>

            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                "Fix with AI" button is grayed out
              </strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                This usually means either your OpenAI API key is not configured or your license has expired. Please contact your admin to verify the license status and ensure an OpenAI key is added in the admin portal.
              </p>
            </li>

            <li className="space-y-1">
              <strong className="font-medium text-gray-900 dark:text-white">
                ERD is not displaying correctly
              </strong>
              <p className="text-gray-600 dark:text-gray-400 pl-4">
                Occasionally, Mermaid may fail to render the diagram due to missing anchor points in the schema. If this happens, try switching to another tab and then back to trigger a re-render.
                <br />
                (We're aware of this issue and actively working on a fix.)
              </p>
            </li>
          </ol>

        </HelpCard>

        <HelpCard 
          icon={Mail} 
          title="Contact Support"
          isExpanded={expandedSection === 'contact'}
          onToggle={() => toggleSection('contact')}
        >
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              If you have any questions, please visit our{" "}
              <a
                href="https://layernexus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-nexus-blue dark:text-blue-400 underline hover:text-blue-800"
              >
                documentation
              </a>{" "}
              or contact us at{" "}
              <button
                onClick={() => navigator.clipboard.writeText("support@layernexus.com")}
                className="text-nexus-blue dark:text-blue-400 underline hover:text-blue-800"
                title="Click to copy"
              >
                support@layernexus.com
              </button>.
            </p>
          </div>
        </HelpCard>
      </div>
    </main>
  );
}

function HelpCard({ title, icon: Icon, children, isExpanded, onToggle }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all duration-300">
      <button 
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-nexus-purple" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-left">{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}

function IssueItem({ title, icon: Icon, solution }) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 mt-1 flex-shrink-0 text-amber-500" />
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{solution}</p>
      </div>
    </div>
  );
}

function DocumentationLink({ title, href, description }) {
  return (
    <a 
      href={href}
      className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
    >
      <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
    </a>
  );
}