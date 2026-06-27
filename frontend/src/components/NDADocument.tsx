import type { ReactNode } from 'react'
import { NDAFormData } from '@/types/nda'

interface Props {
  data: NDAFormData
}

function Val({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold text-blue-700 underline decoration-dotted underline-offset-2">
      {children}
    </span>
  )
}

function CoverField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="mb-1">
        <span className="font-semibold text-gray-900">{label}</span>
        {description && <span className="text-sm text-gray-400 ml-2">— {description}</span>}
      </div>
      <div className="text-gray-800 text-sm">{children}</div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '[Date]'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function NDADocument({ data }: Props) {
  const {
    purpose,
    effectiveDate,
    mndaTermType,
    mndaTermYears,
    confidentialityTermType,
    confidentialityTermYears,
    governingLaw,
    jurisdiction,
    party1,
    party2,
  } = data

  const formattedDate = formatDate(effectiveDate)

  const mndaTermText =
    mndaTermType === 'years'
      ? `${mndaTermYears} year(s) from the Effective Date`
      : 'until terminated in accordance with the terms of this MNDA'

  const confidentialityTermText =
    confidentialityTermType === 'years'
      ? `${confidentialityTermYears} year(s) from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
      : 'in perpetuity'

  const gl = governingLaw || '[State]'
  const jur = jurisdiction || '[Jurisdiction]'

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 print:py-0 print:px-0">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 space-y-10 print:shadow-none print:border-none print:rounded-none print:p-8">

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
            Mutual Non-Disclosure Agreement
          </h1>
        </div>

        {/* Cover Page */}
        <div className="space-y-4 pb-10 border-b border-gray-200">
          <p className="text-sm text-gray-500">
            This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper
            Mutual NDA Standard Terms Version 1.0 identical to those posted at{' '}
            <span className="text-blue-600">commonpaper.com/standards/mutual-nda/1.0</span>. Any modifications of the
            Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.
          </p>

          <div className="grid gap-3">
            <CoverField label="Purpose" description="How Confidential Information may be used">
              {purpose}
            </CoverField>

            <CoverField label="Effective Date">{formattedDate}</CoverField>

            <CoverField label="MNDA Term" description="The length of this MNDA">
              {mndaTermType === 'years'
                ? `Expires ${mndaTermYears} year(s) from Effective Date.`
                : 'Continues until terminated in accordance with the terms of the MNDA.'}
            </CoverField>

            <CoverField label="Term of Confidentiality" description="How long Confidential Information is protected">
              {confidentialityTermType === 'years'
                ? `${confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
                : 'In perpetuity.'}
            </CoverField>

            <CoverField label="Governing Law & Jurisdiction">
              <p>
                <span className="font-medium">Governing Law:</span> {gl}
              </p>
              <p>
                <span className="font-medium">Jurisdiction:</span> {jur}
              </p>
            </CoverField>
          </div>

          {/* Signature table */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">
              By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-3 text-left bg-gray-50 w-36"></th>
                  <th className="border border-gray-300 p-3 text-center bg-gray-50 font-semibold text-gray-700">
                    {party1.company || 'PARTY 1'}
                  </th>
                  <th className="border border-gray-300 p-3 text-center bg-gray-50 font-semibold text-gray-700">
                    {party2.company || 'PARTY 2'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Signature', p1: '', p2: '' },
                  { label: 'Print Name', p1: party1.name, p2: party2.name },
                  { label: 'Title', p1: party1.title, p2: party2.title },
                  { label: 'Company', p1: party1.company, p2: party2.company },
                  { label: 'Notice Address', p1: party1.address, p2: party2.address },
                  { label: 'Date', p1: '', p2: '' },
                ].map(({ label, p1, p2 }) => (
                  <tr key={label}>
                    <td className="border border-gray-300 p-3 font-medium text-gray-600 bg-gray-50">{label}</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-800 h-10">{p1}</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-800 h-10">{p2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Standard Terms */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Standard Terms</h2>

          <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
            <p>
              <strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard
              Terms and the Cover Page) ("<strong>MNDA</strong>") allows each party ("
              <strong>Disclosing Party</strong>") to disclose or make available information in connection with the{' '}
              <Val>{purpose}</Val> which (1) the Disclosing Party identifies to the receiving party ("
              <strong>Receiving Party</strong>") as "confidential", "proprietary", or the like or (2) should be
              reasonably understood as confidential or proprietary due to its nature and the circumstances of its
              disclosure ("<strong>Confidential Information</strong>"). Each party's Confidential Information also
              includes the existence and status of the parties' discussions and information on the Cover Page.
              Confidential Information includes technical or business information, product designs or roadmaps,
              requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use
              this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("
              <strong>Cover Page</strong>"). Each party is identified on the Cover Page and capitalized terms have the
              meanings given herein or on the Cover Page.
            </p>

            <p>
              <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use
              Confidential Information solely for the <Val>{purpose}</Val>; (b) not disclose Confidential Information to
              third parties without the Disclosing Party's prior written approval, except that the Receiving Party may
              disclose Confidential Information to its employees, agents, advisors, contractors and other representatives
              having a reasonable need to know for the <Val>{purpose}</Val>, provided these representatives are bound by
              confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this
              MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect
              Confidential Information using at least the same protections the Receiving Party uses for its own similar
              information but no less than a reasonable standard of care.
            </p>

            <p>
              <strong>3. Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information
              that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b)
              it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality
              restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it
              independently developed without using or referencing the Confidential Information.
            </p>

            <p>
              <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information
              to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to
              the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required
              disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's
              efforts to obtain confidential treatment for the Confidential Information.
            </p>

            <p>
              <strong>5. Term and Termination.</strong> This MNDA commences on the <Val>{formattedDate}</Val> and{' '}
              {mndaTermType === 'years' ? (
                <>expires at the end of the <Val>{mndaTermText}</Val></>
              ) : (
                <><Val>{mndaTermText}</Val></>
              )}. Either party may terminate this MNDA for any or no
              reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential
              Information will survive for the <Val>{confidentialityTermText}</Val>, despite any expiration or
              termination of this MNDA.
            </p>

            <p>
              <strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of
              this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using
              Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all
              Confidential Information in the Receiving Party's possession or control or return it to the Disclosing
              Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in
              writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in
              accordance with its standard backup or record retention policies or as required by law, but the terms of
              this MNDA will continue to apply to the retained Confidential Information.
            </p>

            <p>
              <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and
              other rights in its Confidential Information and its disclosure to the Receiving Party grants no license
              under such rights.
            </p>

            <p>
              <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND
              WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR
              PURPOSE.
            </p>

            <p>
              <strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed
              by, and construed in accordance with, the laws of the State of <Val>{gl}</Val>, without regard to the
              conflict of laws provisions of such <Val>{gl}</Val>. Any legal suit, action, or proceeding relating to
              this MNDA must be instituted in the federal or state courts located in <Val>{jur}</Val>. Each party
              irrevocably submits to the exclusive jurisdiction of such <Val>{jur}</Val> in any such suit, action, or
              proceeding.
            </p>

            <p>
              <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary
              damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek
              appropriate equitable relief, including an injunction, in addition to its other remedies.
            </p>

            <p>
              <strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose Confidential
              Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA
              without the prior written consent of the other party, except that either party may assign this MNDA in
              connection with a merger, reorganization, acquisition or other transfer of all or substantially all its
              assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will
              bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by
              the waiving party's authorized representative and cannot be implied from conduct. If any provision of this
              MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA
              remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties
              with respect to its subject matter, and supersedes all prior and contemporaneous understandings,
              agreements, representations, and warranties, whether written or oral, regarding such subject matter. This
              MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both
              parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal
              addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in
              counterparts, including electronic copies, each of which is deemed an original and which together form the
              same agreement.
            </p>
          </div>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under CC BY 4.0.
          </p>
        </div>
      </div>
    </div>
  )
}
