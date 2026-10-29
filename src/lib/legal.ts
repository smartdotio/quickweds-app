/**
 * DRAFT legal copy. Must be reviewed by the firm's lawyer before launch.
 * Bump AGREEMENT_VERSION / PRIVACY_VERSION in env.ts when wording changes.
 */
export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL: LegalDoc[] = [
  {
    slug: "advisory-agreement",
    title: "Advisory Agreement",
    summary: "What we do, what we don't, and what we both commit to.",
    sections: [
      {
        heading: "1. Services",
        body: [
          "Osagie & Co. Euro-Consulting (\"we\") provides advice and process support for study and work routes to Austria and Germany. The scope of each purchase is listed on your receipt and, for packages, in the package offer you accept.",
          "We are not lawyers and do not provide legal representation. Where a matter needs a lawyer (for example an appeal), we will tell you and may refer you to one.",
        ],
      },
      {
        heading: "2. No guarantee of outcome",
        body: [
          "Visa and residence permit decisions are made only by the relevant authorities. Our fees pay for advice and process support. They do not guarantee that any visa, permit or admission will be granted, or granted within any timeframe.",
          "The Readiness Check measures how prepared your documents and funds are against published requirements. It is not a prediction of a decision.",
        ],
      },
      {
        heading: "3. Your responsibilities",
        body: [
          "You confirm that every document and statement you give us is genuine, complete and unaltered. We will not knowingly submit, prepare or advise on false or misleading documents, and we will end our services if we believe a document is not genuine. Fees already earned are not refundable in that case.",
          "You are responsible for attending appointments, paying official fees and meeting deadlines set by authorities.",
        ],
      },
      {
        heading: "4. Fees and refunds",
        body: ["Fees, cancellations and refunds are governed by the Refund Policy in force when you pay."],
      },
      {
        heading: "5. Data",
        body: ["We process your personal data as described in our Privacy Policy, in line with the Nigeria Data Protection Act 2023."],
      },
      {
        heading: "6. Liability",
        body: [
          "To the extent permitted by law, our total liability for any claim is limited to the fees you paid for the service concerned. We are not liable for decisions, delays or fees of embassies, VFS or other authorities.",
        ],
      },
      { heading: "7. Governing law", body: ["This agreement is governed by the laws of the Federal Republic of Nigeria."] },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    summary: "Clear rules for cancelling a session or package.",
    sections: [
      {
        heading: "Strategy Sessions",
        body: [
          "Cancel 48 hours or more before your session: full refund.",
          "Cancel less than 48 hours before: 50% refund, or one free reschedule instead.",
          "After the session has taken place, or if you miss it without notice: no refund.",
        ],
      },
      {
        heading: "Full-service packages",
        body: [
          "Refunds are pro rata for milestones not yet delivered, as listed in your package scope. Work already delivered is not refundable.",
          "No refund is due because an authority refuses or delays an application.",
        ],
      },
      { heading: "How refunds are paid", body: ["Refunds go back to the original payment method via Paystack within 10 working days of approval."] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What we collect, why, where it's stored and how long we keep it.",
    sections: [
      {
        heading: "Who we are",
        body: ["Osagie & Co. Euro-Consulting is the data controller for personal data collected through this website and client portal."],
      },
      {
        heading: "What we collect",
        body: [
          "Readiness Check answers; your name, email and WhatsApp number; payment records (we never see your full card details); booking details; and documents you upload, such as passports, certificates and proof of funds.",
        ],
      },
      {
        heading: "Why",
        body: [
          "To respond to your enquiry (consent), to deliver the services you buy (contract), to keep financial records (legal obligation) and, only if you opt in, to send you updates (consent).",
        ],
      },
      {
        heading: "Who processes it for us",
        body: [
          "Supabase (database and encrypted file storage, EU region), Vercel (hosting), Paystack (payments), Cal.com (scheduling) and Resend (email). Data stored in the EU is transferred under appropriate safeguards as required by the Nigeria Data Protection Act 2023.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Uploaded documents: deleted 90 days after your case closes, unless you ask us to keep them longer or the law requires it.",
          "Enquiries that never became clients: deleted after 12 months.",
          "Payment and agreement records: kept for 6 years for tax and contract purposes, without your documents.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can access, correct, export or ask us to delete your data, and withdraw consent at any time. Use Profile → Your data in the portal, or email us. You can also complain to the Nigeria Data Protection Commission.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Use",
    summary: "Rules for using this website.",
    sections: [
      {
        heading: "Use of the site",
        body: [
          "Information on this site is general guidance and may change as authorities update their rules. Always check the official source linked on each route page.",
          "Do not misuse the site, upload malicious files or try to access other people's data.",
        ],
      },
      { heading: "Accounts", body: ["Portal access is by secure email link. Keep access to your email account secure."] },
    ],
  },
];

export const getLegal = (slug: string) => LEGAL.find((d) => d.slug === slug) ?? null;
