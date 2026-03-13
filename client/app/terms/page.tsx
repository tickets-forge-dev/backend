import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Forge',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8]">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link href="/login" className="text-sm text-[#71717a] hover:text-[#a1a1aa]">
            &larr; Back to login
          </Link>
          <h1 className="text-2xl font-semibold text-white mt-6">Terms of Service</h1>
          <p className="text-sm text-[#71717a] mt-2">Last updated: March 13, 2026</p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-[#a1a1aa]">
          <h2 className="text-base font-medium text-white">1. About Forge</h2>
          <p>
            Forge is an AI-powered ticket engineering tool that helps teams transform product ideas
            into detailed, execution-ready technical specifications. Forge is currently in{' '}
            <strong className="text-white">public alpha</strong> and is provided free of charge
            during this period.
          </p>
          <p>
            Alpha access is subject to usage limits including monthly token allowances and daily
            ticket creation caps. These limits may change at any time without prior notice. Forge
            reserves the right to introduce paid plans, modify features, or discontinue the alpha
            program at its sole discretion.
          </p>

          <h2 className="text-base font-medium text-white mt-8">2. How Forge Works</h2>
          <p>
            When you connect a GitHub repository, Forge reads repository metadata, file trees, and
            select source files <strong className="text-white">via the GitHub API</strong> to
            provide context-aware specifications. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">Forge never clones your repository.</strong> All code
              access happens through GitHub&apos;s REST API using the OAuth token you authorize.
            </li>
            <li>
              Forge reads file trees, configuration files, and select source files to understand
              your project&apos;s stack, architecture, and conventions.
            </li>
            <li>
              File contents are sent to third-party AI providers (currently Anthropic) for
              analysis. These contents are not stored after processing completes.
            </li>
            <li>
              Generated specifications, questions, and analysis results are stored in your
              team&apos;s workspace on our infrastructure.
            </li>
          </ul>

          <h2 className="text-base font-medium text-white mt-8">3. AI-Generated Content</h2>
          <p>
            All technical specifications, analyses, and suggestions produced by Forge are{' '}
            <strong className="text-white">AI-generated and provided &ldquo;as is.&rdquo;</strong>{' '}
            You are solely responsible for reviewing, validating, and approving any output before
            using it in your projects. Forge does not guarantee the accuracy, completeness,
            security, or fitness of generated content for any particular purpose.
          </p>

          <h2 className="text-base font-medium text-white mt-8">4. Repository Access</h2>
          <p>
            Connecting a GitHub repository is optional. Forge works without repository access —
            tickets will simply have less codebase context, and the developer refinement step
            becomes more important. Even with full repository access, developer refinement
            always produces the best results.
          </p>
          <p>
            If you do choose to connect a repository, you must have authorization to grant
            Forge read access to it.
          </p>

          <h2 className="text-base font-medium text-white mt-8">5. Your Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You are responsible for reviewing and validating all generated specifications before implementation — developer refinement is always recommended.</li>
            <li>If you connect a repository, you must not grant access to repositories containing secrets, credentials, or sensitive data that should not be sent to third-party AI providers.</li>
            <li>You agree not to abuse the service, circumvent usage limits, or use Forge for any unlawful purpose.</li>
          </ul>

          <h2 className="text-base font-medium text-white mt-8">6. Alpha Limitations</h2>
          <p>During the alpha period:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>The service is provided free of charge with no guaranteed uptime or SLA.</li>
            <li>Features may be added, changed, or removed without notice.</li>
            <li>Usage limits (token allowances, daily ticket caps) are enforced per team and may be adjusted.</li>
            <li>Data created during alpha may or may not be preserved when the service transitions to general availability.</li>
            <li>We may restrict or terminate access at any time for any reason.</li>
          </ul>

          <h2 className="text-base font-medium text-white mt-8">7. Intellectual Property</h2>
          <p>
            Your code remains yours. Forge does not claim any ownership or rights over your source
            code, repositories, or any intellectual property you provide access to. Generated
            specifications belong to you and your team.
          </p>

          <h2 className="text-base font-medium text-white mt-8">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Forge and its operators shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, including but
            not limited to loss of profits, data, business opportunities, or goodwill, arising from
            your use of the service.
          </p>
          <p>
            Forge is provided <strong className="text-white">&ldquo;as is&rdquo;</strong> and{' '}
            <strong className="text-white">&ldquo;as available&rdquo;</strong> without warranties
            of any kind, whether express or implied, including but not limited to implied
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            You acknowledge that AI-generated output may contain errors, omissions, or
            inaccuracies, and that reliance on such output is at your own risk.
          </p>

          <h2 className="text-base font-medium text-white mt-8">9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Forge and its operators from any claims,
            damages, or expenses arising from your use of the service, your violation of these
            terms, or your violation of any third-party rights.
          </p>

          <h2 className="text-base font-medium text-white mt-8">10. Changes to These Terms</h2>
          <p>
            We may update these terms at any time. Continued use of Forge after changes are posted
            constitutes acceptance of the updated terms. We will make reasonable efforts to notify
            users of material changes.
          </p>

          <h2 className="text-base font-medium text-white mt-8">11. Contact</h2>
          <p>
            For questions about these terms, reach out to us at{' '}
            <a href="mailto:ticketsforge@gmail.com" className="text-white underline underline-offset-2 hover:text-[#e8e8e8]">
              ticketsforge@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
