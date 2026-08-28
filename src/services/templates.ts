export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  badge: string;
  html: string;
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a clean sheet, standard margins, and modern typography.',
    badge: 'Empty',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Untitled Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      background-color: #ffffff;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }
    p {
      font-size: 1rem;
      margin-bottom: 1rem;
      color: #334155;
    }
  </style>
</head>
<body>
  <h1>Document Title</h1>
  <p>Start typing your content here. Click anywhere to edit, format text with the top toolbar, or drag and drop images directly onto this page.</p>
</body>
</html>`
  },
  {
    id: 'branded_report',
    name: 'Executive Business Report',
    description: 'A formal executive summary with brand header, summary metrics, styled tables, and signature section.',
    badge: 'Business',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Q3 Performance & Strategy Report</title>
  <style>
    body {
      font-family: "Georgia", Cambria, serif;
      line-height: 1.7;
      color: #1e293b;
      margin: 0;
      padding: 48px;
      max-width: 850px;
      margin-left: auto;
      margin-right: auto;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .company-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }
    .doc-meta {
      text-align: right;
      font-size: 0.875rem;
      color: #64748b;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-top: 0;
      margin-bottom: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .lead {
      font-size: 1.125rem;
      color: #475569;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 4px;
    }
    .kpi-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 36px;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    p {
      margin-bottom: 16px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 0.9375rem;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 12px 16px;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .callout {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
      font-style: italic;
      color: #166534;
    }
    .signature-section {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .sign-block {
      width: 45%;
    }
    .sign-line {
      border-bottom: 1px solid #94a3b8;
      margin-top: 40px;
      margin-bottom: 8px;
    }
    .sign-name {
      font-weight: 600;
      color: #0f172a;
    }
    .sign-title {
      font-size: 0.875rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">ACME ENTERPRISES</div>
    <div class="doc-meta">
      <strong>Confidential Briefing</strong><br>
      Date: October 24, 2026<br>
      Doc Ref: ACME-Q3-094
    </div>
  </div>

  <h1>Quarterly Executive Summary & Strategic Outlook</h1>
  <p class="lead">This briefing provides key operational milestones, revenue distribution across core divisions, and forward-looking strategic initiatives for the upcoming fiscal cycle.</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">$14.2M</div>
      <div class="kpi-label">Total Revenue (+28%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">94.8%</div>
      <div class="kpi-label">Client Retention</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">4.9 / 5.0</div>
      <div class="kpi-label">Satisfaction Score</div>
    </div>
  </div>

  <h2>1. Revenue Breakdown by Market Segment</h2>
  <p>Strong enterprise adoption and expansion in international cloud deployments fueled significant quarter-over-quarter expansion.</p>

  <table>
    <thead>
      <tr>
        <th>Division</th>
        <th>Target (USD)</th>
        <th>Actual (USD)</th>
        <th>Variance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Enterprise Software</td>
        <td>$6,500,000</td>
        <td>$7,840,000</td>
        <td>+20.6%</td>
      </tr>
      <tr>
        <td>Managed Services</td>
        <td>$3,200,000</td>
        <td>$3,450,000</td>
        <td>+7.8%</td>
      </tr>
      <tr>
        <td>Developer Tools & APIs</td>
        <td>$2,500,000</td>
        <td>$2,910,000</td>
        <td>+16.4%</td>
      </tr>
    </tbody>
  </table>

  <div class="callout">
    "Our deliberate pivot toward customer lifetime value and automated onboarding reduced sales friction by 34 days."
  </div>

  <h2>2. Next Steps & Recommendations</h2>
  <p>We recommend approving the expansion budget for the EMEA engineering hub and accelerating automated compliance workflows prior to the Q4 audit.</p>

  <div class="signature-section">
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-name">Eleanor Vance</div>
      <div class="sign-title">Chief Executive Officer</div>
    </div>
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-name">Marcus Sterling</div>
      <div class="sign-title">Chief Financial Officer</div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'newsletter',
    name: 'Modern Email Newsletter',
    description: 'Clean responsive newsletter layout with hero image, featured articles, buttons, and social footer.',
    badge: 'Marketing',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Weekly Digest — Issue #42</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      margin: 0;
      padding: 32px 16px;
      background-color: #f1f5f9;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .banner {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 36px 32px;
      text-align: center;
    }
    .banner h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .banner p {
      margin: 8px 0 0;
      font-size: 0.9375rem;
      opacity: 0.9;
    }
    .content {
      padding: 32px;
    }
    .article-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 10px;
    }
    .article-img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9375rem;
      padding: 10px 22px;
      border-radius: 6px;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      font-size: 0.8125rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>🚀 The Weekly Digest</h1>
      <p>Issue #42 &bull; Curated trends in design, code & creative technology</p>
    </div>

    <div class="content">
      <img class="article-img" src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80" alt="Laptop and coffee coding setup">
      
      <h2 class="article-title">The Evolution of Visual Web Builders</h2>
      <p>Modern browser capabilities like Shadow DOM, WebAssembly, and high-performance Canvas rendering are transforming how engineers build content-rich web applications without losing code fidelity.</p>
      
      <a href="#" class="btn">Read Full Story &rarr;</a>

      <hr>

      <h2 class="article-title">💡 Top Curated Reads of the Week</h2>
      <ul>
        <li><strong>Zero-Database Architectures:</strong> Leveraging IndexedDB and client storage for lightning-fast offline applications.</li>
        <li><strong>CSS Container Queries in Production:</strong> Practical layout patterns for components in 2026.</li>
        <li><strong>Fluid Typography Systems:</strong> Optical hierarchy and font pairing principles for web typography.</li>
      </ul>
    </div>

    <div class="footer">
      <p>You received this newsletter because you are a valued subscriber.<br>
      © 2026 HTML Live Editor Publications &bull; <a href="#" style="color:#64748b;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'resume',
    name: 'Clean Professional Resume',
    description: 'Two-column resume layout with skills badges, experience timeline, and contact information.',
    badge: 'Career',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Alex Rivera — Senior Software Engineer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .name {
      font-size: 2.2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .job-title {
      font-size: 1.125rem;
      color: #0284c7;
      font-weight: 600;
      margin-top: 4px;
      margin-bottom: 12px;
    }
    .contacts {
      font-size: 0.875rem;
      color: #64748b;
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
    }
    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 16px;
    }
    .exp-item {
      margin-bottom: 20px;
    }
    .exp-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .exp-role {
      font-weight: 700;
      color: #0f172a;
      font-size: 1rem;
    }
    .exp-date {
      font-size: 0.875rem;
      color: #64748b;
    }
    .exp-company {
      font-size: 0.9375rem;
      color: #475569;
      font-style: italic;
      margin-bottom: 6px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      color: #334155;
      font-size: 0.9375rem;
    }
    li {
      margin-bottom: 4px;
    }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-badge {
      background: #f1f5f9;
      color: #334155;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name">Alex Rivera</h1>
    <div class="job-title">Senior Full-Stack Software Engineer</div>
    <div class="contacts">
      <span>📍 San Francisco, CA</span>
      <span>📧 alex.rivera@example.com</span>
      <span>🌐 github.com/alexrivera</span>
      <span>📞 +1 (555) 234-5678</span>
    </div>
  </div>

  <div class="section-title">Summary</div>
  <p style="margin:0; font-size:0.95rem; color:#334155;">
    Accomplished software engineer with 7+ years of experience architecting resilient, accessible web platforms. Proven track record in frontend optimization, real-time collaboration engines, and developer tooling.
  </p>

  <div class="section-title">Professional Experience</div>

  <div class="exp-item">
    <div class="exp-head">
      <div class="exp-role">Lead Frontend Engineer</div>
      <div class="exp-date">2022 &ndash; Present</div>
    </div>
    <div class="exp-company">Vanguard Cloud Systems, San Francisco</div>
    <ul>
      <li>Architected next-generation browser IDE serving 250,000+ monthly active developers.</li>
      <li>Reduced initial document rendering time by 45% using virtualized DOM and Web Workers.</li>
      <li>Mentored 8 junior and mid-level engineers across product feature teams.</li>
    </ul>
  </div>

  <div class="exp-item">
    <div class="exp-head">
      <div class="exp-role">Software Engineer</div>
      <div class="exp-date">2019 &ndash; 2022</div>
    </div>
    <div class="exp-company">Nexus Interactive, Seattle</div>
    <ul>
      <li>Built rich WYSIWYG document authoring tools with full offline persistence.</li>
      <li>Implemented automated end-to-end test suites improving test coverage to 92%.</li>
    </ul>
  </div>

  <div class="section-title">Skills & Technologies</div>
  <div class="skills-grid">
    <span class="skill-badge">TypeScript</span>
    <span class="skill-badge">React & Next.js</span>
    <span class="skill-badge">Tailwind CSS</span>
    <span class="skill-badge">WebSockets</span>
    <span class="skill-badge">IndexedDB</span>
    <span class="skill-badge">Node.js</span>
    <span class="skill-badge">GraphQL</span>
    <span class="skill-badge">Performance Tuning</span>
  </div>
</body>
</html>`
  },
  {
    id: 'invoice',
    name: 'Print-Ready Invoice',
    description: 'Clean invoice with itemized pricing, subtotal calculations, tax breakdown, and bank details.',
    badge: 'Finance',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #INV-2026-88</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      padding: 48px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      background: #ffffff;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .logo-text {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }
    .inv-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0284c7;
      text-align: right;
      margin: 0;
    }
    .inv-num {
      font-size: 0.875rem;
      color: #64748b;
      text-align: right;
    }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }
    .party-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .party-name {
      font-weight: 700;
      color: #0f172a;
    }
    .party-details {
      font-size: 0.875rem;
      color: #475569;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9375rem;
      color: #334155;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      width: 320px;
      margin-left: auto;
      margin-bottom: 40px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.9375rem;
      color: #475569;
    }
    .grand-total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 10px;
      font-weight: 800;
      font-size: 1.25rem;
      color: #0f172a;
    }
    .payment-info {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px 20px;
      font-size: 0.875rem;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div>
      <div class="logo-text">STUDIO APEX</div>
      <div style="color:#64748b; font-size:0.875rem; margin-top:4px;">Digital Design & Engineering</div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-num">#INV-2026-088<br>Due Date: Nov 15, 2026</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-title">Billed By:</div>
      <div class="party-name">Studio Apex LLC</div>
      <div class="party-details">
        100 Market Street, Suite 400<br>
        San Francisco, CA 94105<br>
        billing@studioapex.design
      </div>
    </div>
    <div>
      <div class="party-title">Billed To:</div>
      <div class="party-name">Horizon Labs Inc.</div>
      <div class="party-details">
        Attn: Accounts Payable<br>
        450 Lexington Ave, New York, NY 10017<br>
        ap@horizonlabs.io
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty / Hrs</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>UX/UI Design Sprint</strong><br>
          <span style="font-size:0.8125rem; color:#64748b;">Interactive prototyping & design system library</span>
        </td>
        <td class="text-right">40 hrs</td>
        <td class="text-right">$150.00</td>
        <td class="text-right">$6,000.00</td>
      </tr>
      <tr>
        <td>
          <strong>Frontend Web Development</strong><br>
          <span style="font-size:0.8125rem; color:#64748b;">TypeScript, responsive layout, component testing</span>
        </td>
        <td class="text-right">60 hrs</td>
        <td class="text-right">$160.00</td>
        <td class="text-right">$9,600.00</td>
      </tr>
      <tr>
        <td>
          <strong>Performance Audit & Optimization</strong><br>
          <span style="font-size:0.8125rem; color:#64748b;">Core Web Vitals tuning and accessibility audit</span>
        </td>
        <td class="text-right">1</td>
        <td class="text-right">$1,800.00</td>
        <td class="text-right">$1,800.00</td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span>Subtotal</span>
      <span>$17,400.00</span>
    </div>
    <div class="total-row">
      <span>Tax (0%)</span>
      <span>$0.00</span>
    </div>
    <div class="total-row grand-total">
      <span>Total Due</span>
      <span>$17,400.00</span>
    </div>
  </div>

  <div class="payment-info">
    <strong>Payment Instructions:</strong><br>
    Wire Transfer: Apex Bank N.A. &bull; Routing: 121000358 &bull; Account: 987654321<br>
    Please include Invoice #INV-2026-088 in the transfer memo.
  </div>
</body>
</html>`
  }
];
