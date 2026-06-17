/**
 * PDF Report Service - Generates beautiful PDF reports
 */

export function generatePDFReport(lead) {
  const d = lead.analysisJson?.websiteData;
  if (!d) return;

  const scores = lead.analysisJson?.scores || {};
  const score = lead.score || 0;
  const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SEO Audit Report - ${lead.businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; }
    
    .cover { 
      background: linear-gradient(135deg, #1e40af, #7c3aed);
      color: white; padding: 60px 40px; text-align: center; min-height: 400px;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    }
    .cover h1 { font-size: 36px; margin-bottom: 10px; }
    .cover .subtitle { font-size: 18px; opacity: 0.9; margin-bottom: 30px; }
    .cover .score-circle {
      width: 150px; height: 150px; border-radius: 50%; border: 8px solid white;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.15); margin: 20px 0;
    }
    .cover .score-num { font-size: 48px; font-weight: bold; }
    .cover .score-grade { font-size: 24px; }
    
    .section { padding: 30px 40px; }
    .section-title { 
      font-size: 22px; font-weight: bold; color: #1e40af; 
      border-bottom: 3px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;
    }
    
    .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .score-card { 
      background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;
      border: 1px solid #e5e7eb;
    }
    .score-card .value { font-size: 28px; font-weight: bold; }
    .score-card .label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .score-bar { height: 6px; background: #e5e7eb; border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 3px; }
    
    .checklist { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .check-item { 
      display: flex; align-items: center; gap: 10px; padding: 12px;
      background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;
    }
    .check-item.pass { background: #f0fdf4; border-color: #bbf7d0; }
    .check-item.fail { background: #fef2f2; border-color: #fecaca; }
    
    .metric-row { 
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #f3f4f6;
    }
    .metric-label { font-size: 14px; color: #6b7280; }
    .metric-value { font-size: 14px; font-weight: 600; }
    
    .issue-box { 
      padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;
      border-left: 4px solid;
    }
    .issue-critical { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
    .issue-warning { background: #fffbeb; border-color: #d97706; color: #92400e; }
    .issue-opportunity { background: #f0fdf4; border-color: #059669; color: #065f46; }
    
    .footer { 
      background: #1f2937; color: white; padding: 30px 40px; text-align: center;
      font-size: 12px;
    }
    .footer a { color: #93c5fd; }
    
    .tech-badge {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 500; margin: 3px;
    }
    .tech-used { background: #dbeafe; color: #1e40af; }
    .tech-not { background: #f3f4f6; color: #9ca3af; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">SEO Audit Report</div>
    <h1>${lead.businessName}</h1>
    <div class="subtitle">${lead.website || ''}</div>
    <div class="score-circle">
      <span class="score-num">${score}</span>
      <span class="score-grade">Grade ${grade}</span>
    </div>
    <div style="margin-top: 20px; font-size: 14px;">
      Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <!-- OVERVIEW SECTION -->
  <div class="section">
    <h2 class="section-title">📊 Performance Overview</h2>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color: ${lead.websiteSpeedScore >= 70 ? '#059669' : lead.websiteSpeedScore >= 40 ? '#d97706' : '#dc2626'}">${lead.websiteSpeedScore || 'N/A'}</div>
        <div class="label">Speed Score</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${lead.websiteSpeedScore || 0}%; background:${lead.websiteSpeedScore >= 70 ? '#059669' : lead.websiteSpeedScore >= 40 ? '#d97706' : '#dc2626'}"></div></div>
      </div>
      <div class="score-card">
        <div class="value" style="color: ${lead.seoScore >= 70 ? '#059669' : lead.seoScore >= 40 ? '#d97706' : '#dc2626'}">${lead.seoScore || 'N/A'}</div>
        <div class="label">SEO Score</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${lead.seoScore || 0}%; background:${lead.seoScore >= 70 ? '#059669' : lead.seoScore >= 40 ? '#d97706' : '#dc2626'}"></div></div>
      </div>
      <div class="score-card">
        <div class="value">${lead.mobileFriendly ? '✅' : '❌'}</div>
        <div class="label">Mobile Friendly</div>
      </div>
      <div class="score-card">
        <div class="value">${lead.sslValid ? '✅' : '❌'}</div>
        <div class="label">SSL Secure</div>
      </div>
    </div>
    
    <div style="margin-top: 20px;">
      <div class="metric-row"><span class="metric-label">Business</span><span class="metric-value">${lead.businessName}</span></div>
      <div class="metric-row"><span class="metric-label">Industry</span><span class="metric-value">${lead.industry || 'N/A'}</span></div>
      <div class="metric-row"><span class="metric-label">Location</span><span class="metric-value">${lead.city || 'N/A'}, ${lead.state || ''}</span></div>
      <div class="metric-row"><span class="metric-label">Website</span><span class="metric-value" style="color:#2563eb;">${lead.website || 'N/A'}</span></div>
      <div class="metric-row"><span class="metric-label">Analysis Date</span><span class="metric-value">${new Date().toLocaleDateString()}</span></div>
    </div>
  </div>

  <!-- ON-PAGE SEO -->
  <div class="section">
    <h2 class="section-title">📋 On-Page SEO Analysis</h2>
    <div class="checklist">
      <div class="check-item ${(d.titleLength >= 30 && d.titleLength <= 60) ? 'pass' : 'fail'}">
        <span>${(d.titleLength >= 30 && d.titleLength <= 60) ? '✅' : '⚠️'}</span>
        <div><strong>Title Tag</strong><br><span style="font-size:12px;color:#6b7280;">${d.titleLength || 0} chars (opt: 50-60)</span></div>
      </div>
      <div class="check-item ${d.metaDescription ? 'pass' : 'fail'}">
        <span>${d.metaDescription ? '✅' : '❌'}</span>
        <div><strong>Meta Description</strong><br><span style="font-size:12px;color:#6b7280;">${d.metaDescriptionLength || 0} chars</span></div>
      </div>
      <div class="check-item ${d.h1Count === 1 ? 'pass' : 'fail'}">
        <span>${d.h1Count === 1 ? '✅' : '⚠️'}</span>
        <div><strong>H1 Tags</strong><br><span style="font-size:12px;color:#6b7280;">${d.h1Count} found (opt: 1)</span></div>
      </div>
      <div class="check-item ${d.imagesWithoutAlt === 0 ? 'pass' : 'fail'}">
        <span>${d.imagesWithoutAlt === 0 ? '✅' : '⚠️'}</span>
        <div><strong>Image Alt Text</strong><br><span style="font-size:12px;color:#6b7280;">${d.imagesWithoutAlt} missing</span></div>
      </div>
      <div class="check-item ${d.wordCount > 300 ? 'pass' : 'fail'}">
        <span>${d.wordCount > 300 ? '✅' : '⚠️'}</span>
        <div><strong>Content Length</strong><br><span style="font-size:12px;color:#6b7280;">${d.wordCount} words</span></div>
      </div>
      <div class="check-item ${d.hasSchema ? 'pass' : 'fail'}">
        <span>${d.hasSchema ? '✅' : '❌'}</span>
        <div><strong>Schema Markup</strong></div>
      </div>
      <div class="check-item ${d.canonical ? 'pass' : 'fail'}">
        <span>${d.canonical ? '✅' : '❌'}</span>
        <div><strong>Canonical URL</strong></div>
      </div>
      <div class="check-item ${d.ogTitle ? 'pass' : 'fail'}">
        <span>${d.ogTitle ? '✅' : '❌'}</span>
        <div><strong>Open Graph Tags</strong></div>
      </div>
    </div>
  </div>

  <!-- TECHNICAL SEO -->
  <div class="section">
    <h2 class="section-title">🔧 Technical SEO</h2>
    <div class="score-grid">
      <div class="score-card">
        <div class="value">${(d.htmlLength / 1024).toFixed(1)} KB</div>
        <div class="label">Page Size</div>
      </div>
      <div class="score-card">
        <div class="value">${d.scripts}</div>
        <div class="label">Scripts</div>
      </div>
      <div class="score-card">
        <div class="value">${d.cssFiles}</div>
        <div class="label">CSS Files</div>
      </div>
      <div class="score-card">
        <div class="value">${d.totalLinks}</div>
        <div class="label">Total Links</div>
      </div>
    </div>
    <div style="margin-top:15px;">
      <div class="metric-row"><span class="metric-label">SSL Certificate</span><span class="metric-value">${d.hasSSL ? '✅ Valid' : '❌ Missing'}</span></div>
      <div class="metric-row"><span class="metric-label">Mobile Viewport</span><span class="metric-value">${d.viewport ? '✅ Configured' : '❌ Missing'}</span></div>
      <div class="metric-row"><span class="metric-label">Text/HTML Ratio</span><span class="metric-value">${d.textToHTMLRatio}%</span></div>
      <div class="metric-row"><span class="metric-label">Language</span><span class="metric-value">${d.language}</span></div>
    </div>
  </div>

  <!-- TRACKING -->
  <div class="section">
    <h2 class="section-title">📈 Tracking & Analytics</h2>
    <div class="checklist">
      <div class="check-item ${d.hasGoogleAnalytics ? 'pass' : 'fail'}">
        <span>${d.hasGoogleAnalytics ? '✅' : '❌'}</span><div><strong>Google Analytics</strong></div>
      </div>
      <div class="check-item ${d.hasGoogleTagManager ? 'pass' : 'fail'}">
        <span>${d.hasGoogleTagManager ? '✅' : '❌'}</span><div><strong>Google Tag Manager</strong></div>
      </div>
      <div class="check-item ${d.hasMetaPixel ? 'pass' : 'fail'}">
        <span>${d.hasMetaPixel ? '✅' : '❌'}</span><div><strong>Meta Pixel</strong></div>
      </div>
      <div class="check-item ${d.hasGoogleAdsTracking ? 'pass' : 'fail'}">
        <span>${d.hasGoogleAdsTracking ? '✅' : '❌'}</span><div><strong>Google Ads Tracking</strong></div>
      </div>
      <div class="check-item ${d.hasHotjar ? 'pass' : 'fail'}">
        <span>${d.hasHotjar ? '✅' : '❌'}</span><div><strong>Hotjar</strong></div>
      </div>
    </div>
  </div>

  <!-- FEATURES -->
  <div class="section">
    <h2 class="section-title">⚡ Features</h2>
    <div class="checklist">
      <div class="check-item ${d.hasContactForm ? 'pass' : 'fail'}">
        <span>${d.hasContactForm ? '✅' : '❌'}</span><div><strong>Contact Form</strong></div>
      </div>
      <div class="check-item ${d.hasLiveChat ? 'pass' : 'fail'}">
        <span>${d.hasLiveChat ? '✅' : '❌'}</span><div><strong>Live Chat</strong></div>
      </div>
      <div class="check-item ${d.hasBookingSystem ? 'pass' : 'fail'}">
        <span>${d.hasBookingSystem ? '✅' : '❌'}</span><div><strong>Booking System</strong></div>
      </div>
      <div class="check-item ${d.hasCookieConsent ? 'pass' : 'fail'}">
        <span>${d.hasCookieConsent ? '✅' : '❌'}</span><div><strong>Cookie Consent</strong></div>
      </div>
      <div class="check-item ${d.hasFavicon ? 'pass' : 'fail'}">
        <span>${d.hasFavicon ? '✅' : '❌'}</span><div><strong>Favicon</strong></div>
      </div>
      <div class="check-item ${d.hasSitemap ? 'pass' : 'fail'}">
        <span>${d.hasSitemap ? '✅' : '❌'}</span><div><strong>XML Sitemap</strong></div>
      </div>
    </div>
  </div>

  <!-- TECHNOLOGY -->
  <div class="section">
    <h2 class="section-title">🔧 Technology Stack</h2>
    <div style="margin-bottom:10px;">
      <span class="tech-badge ${d.isWordPress ? 'tech-used' : 'tech-not'}">WordPress ${d.isWordPress ? '✅' : '❌'}</span>
      <span class="tech-badge ${d.isShopify ? 'tech-used' : 'tech-not'}">Shopify ${d.isShopify ? '✅' : '❌'}</span>
      <span class="tech-badge ${d.usesJQuery ? 'tech-used' : 'tech-not'}">jQuery ${d.usesJQuery ? '✅' : '❌'}</span>
      <span class="tech-badge ${d.usesBootstrap ? 'tech-used' : 'tech-not'}">Bootstrap ${d.usesBootstrap ? '✅' : '❌'}</span>
      <span class="tech-badge ${d.usesReact ? 'tech-used' : 'tech-not'}">React ${d.usesReact ? '✅' : '❌'}</span>
    </div>
  </div>

  <!-- ISSUES & RECOMMENDATIONS -->
  <div class="section">
    <h2 class="section-title">💡 Issues & Recommendations</h2>
    ${(d.issues || []).map(i => `<div class="issue-box issue-critical">🚨 ${i}</div>`).join('')}
    ${(d.opportunities || []).map(o => `<div class="issue-box issue-opportunity">💡 ${o}</div>`).join('')}
    ${(!d.issues?.length && !d.opportunities?.length) ? '<p style="color:#6b7280;">No critical issues found.</p>' : ''}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p style="font-size:16px;margin-bottom:10px;"><strong>LeadGen AI System</strong></p>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p style="margin-top:10px;"><a href="https://nuage-digital.com">nuage-digital.com</a></p>
    <p style="margin-top:15px;opacity:0.7;">This is an automated SEO audit report. For a detailed consultation, please contact our team.</p>
  </div>

</body>
</html>`;

  // Open in new window for printing
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    toast.success('🖨️ PDF ready! Save as PDF from print dialog.');
  }, 1000);
}

export function downloadHTMLReport(lead) {
  const d = lead.analysisJson?.websiteData;
  if (!d) return;
  
  // Generate the same HTML
  const html = generateReportHTML(lead);
  
  // Download as HTML file
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SEO-Audit-${lead.businessName?.replace(/\s+/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('📄 Report downloaded! Open in browser and Print → Save as PDF');
}

function generateReportHTML(lead) {
  // Same HTML as above
  const d = lead.analysisJson?.websiteData;
  const score = lead.score || 0;
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>SEO Audit - ${lead.businessName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1f2937;line-height:1.6}
.cover{background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;padding:60px 40px;text-align:center;min-height:350px;display:flex;flex-direction:column;justify-content:center;align-items:center}
.cover h1{font-size:32px;margin-bottom:10px}.cover .subtitle{font-size:16px;opacity:.9}
.score-circle{width:130px;height:130px;border-radius:50%;border:6px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.15);margin:15px 0}
.score-num{font-size:42px;font-weight:bold}.score-grade{font-size:20px}
.section{padding:25px 40px}.section-title{font-size:20px;font-weight:bold;color:#1e40af;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:15px}
.score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:15px}
.score-card{background:#f9fafb;border-radius:10px;padding:15px;text-align:center;border:1px solid #e5e7eb}
.score-card .value{font-size:24px;font-weight:bold}.score-card .label{font-size:11px;color:#6b7280;margin-top:4px}
.score-bar{height:5px;background:#e5e7eb;border-radius:3px;margin-top:6px;overflow:hidden}
.score-bar-fill{height:100%;border-radius:3px}
.checklist{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.check-item{display:flex;align-items:center;gap:8px;padding:10px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}
.check-item.pass{background:#f0fdf4;border-color:#bbf7d0}.check-item.fail{background:#fef2f2;border-color:#fecaca}
.metric-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6}
.metric-label{font-size:13px;color:#6b7280}.metric-value{font-size:13px;font-weight:600}
.issue-box{padding:10px 14px;border-radius:8px;margin-bottom:6px;border-left:4px solid}
.issue-critical{background:#fef2f2;border-color:#dc2626;color:#991b1b}
.issue-opportunity{background:#f0fdf4;border-color:#059669;color:#065f46}
.tech-badge{display:inline-block;padding:3px 10px;border-radius:15px;font-size:11px;font-weight:500;margin:2px}
.tech-used{background:#dbeafe;color:#1e40af}.tech-not{background:#f3f4f6;color:#9ca3af}
.footer{background:#1f2937;color:#fff;padding:25px 40px;text-align:center;font-size:11px}
.footer a{color:#93c5fd}
@media print{body{-webkit-print-color-adjust:exact}.section{page-break-inside:avoid}}
</style></head>
<body>
<div class="cover"><div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:15px">SEO Audit Report</div>
<h1>${lead.businessName}</h1><div class="subtitle">${lead.website||''}</div>
<div class="score-circle"><span class="score-num">${score}</span><span class="score-grade">Grade ${grade}</span></div>
<div style="margin-top:15px;font-size:12px">${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div></div>
<div class="section"><h2 class="section-title">📊 Performance</h2>
<div class="score-grid">
<div class="score-card"><div class="value" style="color:${lead.websiteSpeedScore>=70?'#059669':lead.websiteSpeedScore>=40?'#d97706':'#dc2626'}">${lead.websiteSpeedScore||'N/A'}</div><div class="label">Speed</div></div>
<div class="score-card"><div class="value" style="color:${lead.seoScore>=70?'#059669':lead.seoScore>=40?'#d97706':'#dc2626'}">${lead.seoScore||'N/A'}</div><div class="label">SEO</div></div>
<div class="score-card"><div class="value">${lead.mobileFriendly?'✅':'❌'}</div><div class="label">Mobile</div></div>
<div class="score-card"><div class="value">${lead.sslValid?'✅':'❌'}</div><div class="label">SSL</div></div></div></div>
<div class="section"><h2 class="section-title">📋 On-Page SEO</h2>
<div class="checklist">
<div class="check-item ${(d.titleLength>=30&&d.titleLength<=60)?'pass':'fail'}"><span>${(d.titleLength>=30&&d.titleLength<=60)?'✅':'⚠️'}</span><div><strong>Title</strong><br><span style="font-size:11px;color:#6b7280">${d.titleLength||0} chars</span></div></div>
<div class="check-item ${d.metaDescription?'pass':'fail'}"><span>${d.metaDescription?'✅':'❌'}</span><div><strong>Meta Desc</strong></div></div>
<div class="check-item ${d.h1Count===1?'pass':'fail'}"><span>${d.h1Count===1?'✅':'⚠️'}</span><div><strong>H1 Tags</strong><br><span style="font-size:11px;color:#6b7280">${d.h1Count} found</span></div></div>
<div class="check-item ${d.imagesWithoutAlt===0?'pass':'fail'}"><span>${d.imagesWithoutAlt===0?'✅':'⚠️'}</span><div><strong>Alt Text</strong><br><span style="font-size:11px;color:#6b7280">${d.imagesWithoutAlt} missing</span></div></div>
<div class="check-item ${d.wordCount>300?'pass':'fail'}"><span>${d.wordCount>300?'✅':'⚠️'}</span><div><strong>Content</strong><br><span style="font-size:11px;color:#6b7280">${d.wordCount} words</span></div></div>
<div class="check-item ${d.hasSchema?'pass':'fail'}"><span>${d.hasSchema?'✅':'❌'}</span><div><strong>Schema</strong></div></div>
</div></div>
<div class="section"><h2 class="section-title">📈 Tracking</h2>
<div class="checklist">
<div class="check-item ${d.hasGoogleAnalytics?'pass':'fail'}"><span>${d.hasGoogleAnalytics?'✅':'❌'}</span><div><strong>Google Analytics</strong></div></div>
<div class="check-item ${d.hasMetaPixel?'pass':'fail'}"><span>${d.hasMetaPixel?'✅':'❌'}</span><div><strong>Meta Pixel</strong></div></div>
<div class="check-item ${d.hasGoogleAdsTracking?'pass':'fail'}"><span>${d.hasGoogleAdsTracking?'✅':'❌'}</span><div><strong>Google Ads</strong></div></div>
</div></div>
<div class="section"><h2 class="section-title">💡 Recommendations</h2>
${(d.issues||[]).map(i=>`<div class="issue-box issue-critical">🚨 ${i}</div>`).join('')}
${(d.opportunities||[]).map(o=>`<div class="issue-box issue-opportunity">💡 ${o}</div>`).join('')}
</div>
<div class="footer"><p style="font-size:14px"><strong>LeadGen AI</strong></p><p>nuage-digital.com</p></div>
</body></html>`;
}

export default { generatePDFReport, downloadHTMLReport };