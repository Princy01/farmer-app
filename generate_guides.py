import os
import subprocess
import sys

BASE_DIR = r"c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

@page {
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
    @bottom-right {
        content: counter(page);
    }
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Plus Jakarta Sans', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 13.5px;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}

.page {
    page-break-after: always;
    break-after: page;
    position: relative;
    padding-bottom: 20px;
}

.page:last-child {
    page-break-after: auto;
    break-after: auto;
}

/* Typography */
h1, h2, h3, h4, h5 {
    color: #0f172a;
    font-weight: 700;
    line-height: 1.25;
}

h1 { font-size: 26px; }
h2 { font-size: 19px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 18px; margin-bottom: 12px; }
h3 { font-size: 15px; margin-top: 14px; margin-bottom: 8px; }
h4 { font-size: 13.5px; margin-top: 10px; margin-bottom: 4px; }
p { margin-bottom: 10px; color: #334155; }
strong { font-weight: 700; color: #0f172a; }
ul, ol { margin-left: 20px; margin-bottom: 12px; color: #334155; }
li { margin-bottom: 4px; }

/* Cover Page */
.cover-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 255mm;
    background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
    color: #ffffff;
    padding: 35px 30px;
    border-radius: 12px;
}

.cover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding-bottom: 18px;
}

.cover-brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cover-logo-circle {
    width: 48px;
    height: 48px;
    background: #ffffff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 24px;
    color: #065f46;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.cover-brand-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
}

.cover-tagline {
    font-size: 12px;
    color: #a7f3d0;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.cover-badge {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    color: #ffffff;
}

.cover-body {
    margin: 40px 0;
}

.cover-kicker {
    font-size: 13px;
    font-weight: 700;
    color: #34d399;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 10px;
}

.cover-title {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.15;
    color: #ffffff;
    margin-bottom: 14px;
    letter-spacing: -0.5px;
}

.cover-subtitle {
    font-size: 15px;
    color: #e2e8f0;
    line-height: 1.5;
    max-width: 90%;
    margin-bottom: 25px;
}

.cover-roles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 25px;
}

.cover-role-card {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
}

.cover-role-card .role-icon {
    font-size: 22px;
    margin-bottom: 4px;
}

.cover-role-card .role-name {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
}

.cover-role-card .role-desc {
    font-size: 10px;
    color: #a7f3d0;
    margin-top: 2px;
}

.cover-footer {
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #cbd5e1;
}

/* Header & Running Bar */
.section-header-band {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border-left: 4px solid #059669;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 14px;
}

.section-header-band.buyer { border-left-color: #d97706; }
.section-header-band.wholesaler { border-left-color: #2563eb; }
.section-header-band.transport { border-left-color: #0d9488; }
.section-header-band.warehouse { border-left-color: #7c3aed; }
.section-header-band.support { border-left-color: #e11d48; }

.section-header-band h2 {
    border-bottom: none;
    margin: 0;
    padding: 0;
    font-size: 17px;
}

.section-tag {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 8px;
    border-radius: 4px;
    background: #e2e8f0;
    color: #334155;
}

/* Cards & Containers */
.card-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

.card-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
}

.card-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
}

.ui-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    page-break-inside: avoid;
    break-inside: avoid;
}

.ui-card.highlight {
    border-color: #cbd5e1;
    background: #f8fafc;
}

.ui-card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
}

.step-card {
    border-left: 3px solid #059669;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0 6px 6px 0;
    padding: 10px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
}

.step-card.amber { border-left-color: #d97706; }
.step-card.blue { border-left-color: #2563eb; }
.step-card.teal { border-left-color: #0d9488; }
.step-card.purple { border-left-color: #7c3aed; }
.step-card.rose { border-left-color: #e11d48; }

.step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.step-number {
    width: 22px;
    height: 22px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
}

.step-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
}

.step-route {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    background: #f1f5f9;
    color: #475569;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}

/* Callout Alerts */
.callout {
    padding: 10px 12px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 12.5px;
    line-height: 1.45;
    page-break-inside: avoid;
    break-inside: avoid;
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.callout-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 1px;
}

.callout-content {
    flex: 1;
}

.callout.tip { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.callout.important { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
.callout.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.callout.caution { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

/* Tables */
.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
}

.custom-table th, .custom-table td {
    border: 1px solid #cbd5e1;
    padding: 7px 10px;
    text-align: left;
}

.custom-table th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
}

.custom-table tr:nth-child(even) {
    background-color: #f8fafc;
}

/* Workflow Flowchart */
.flow-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 12px;
    border-radius: 8px;
    margin: 12px 0;
    page-break-inside: avoid;
    break-inside: avoid;
}

.flow-node {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 10px;
    flex: 1;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.flow-node .fn-title {
    font-size: 11.5px;
    font-weight: 700;
    color: #0f172a;
}

.flow-node .fn-sub {
    font-size: 9.5px;
    color: #64748b;
    margin-top: 2px;
}

.flow-arrow {
    font-size: 14px;
    color: #94a3b8;
    font-weight: bold;
}

/* Badges */
.badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
}

.badge-green { background: #dcfce7; color: #166534; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-amber { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-purple { background: #f3e8ff; color: #6b21a8; }

.key-metric {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    text-align: center;
}

.key-metric .val {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
}

.key-metric .lbl {
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
}

.footer-nav {
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-top: 15px;
}
"""

print("Writing English HTML guide...")
with open(os.path.join(BASE_DIR, "generate_en_guide.py"), "w", encoding="utf-8") as f:
    f.write('''# English Guide Builder
import os
import sys

def build_english_html():
    from generate_guides import COMMON_CSS

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Melato Agri Platform - Official User Guide (English)</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE -->
<div class="page">
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-brand">
        <div class="cover-logo-circle">M</div>
        <div>
          <div class="cover-brand-name">Melato</div>
          <div class="cover-tagline">Indian Agri Supply Chain Platform</div>
        </div>
      </div>
      <div class="cover-badge">Official Standard Operating Manual • v2.4</div>
    </div>

    <div class="cover-body">
      <div class="cover-kicker">Complete Operational Manual</div>
      <h1 class="cover-title">How to Use the Melato App</h1>
      <p class="cover-subtitle">
        A comprehensive, step-by-step practical guide for Buyers (Retailers), Wholesalers (Suppliers), Transport Partners (Drivers), and Warehouse Operators to manage procurement, inventory, logistics, and dispute resolution.
      </p>

      <div class="cover-roles-grid">
        <div class="cover-role-card">
          <div class="role-icon">🛒</div>
          <div class="role-name">Buyer / Retailer</div>
          <div class="role-desc">Procure fresh produce, track deliveries & manage spends</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🏢</div>
          <div class="role-name">Wholesaler</div>
          <div class="role-desc">Manage stock, fulfill orders & leverage AI demand trends</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🚚</div>
          <div class="role-name">Transport / Driver</div>
          <div class="role-desc">Accept loads, optimize routes & confirm digital POD</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🏭</div>
          <div class="role-name">Warehouse & QA</div>
          <div class="role-desc">Grading, batch tracking & storage inventory control</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Published by Melato Product & Operations Team</div>
      <div>Supported Languages: English • हिन्दी (Hindi)</div>
      <div>Confidential & Proprietary</div>
    </div>
  </div>
</div>

<!-- PAGE 2: TABLE OF CONTENTS & ARCHITECTURE -->
<div class="page">
  <div class="section-header-band">
    <h2>1. Platform Overview & Ecosystem Architecture</h2>
    <span class="section-tag">System Map</span>
  </div>

  <p>
    <strong>Melato</strong> connects India's agricultural ecosystem into a single digital ledger. By eliminating fragmented phone calls, physical paper registers, and untracked cash handoffs, Melato synchronizes real-time mandi prices, live inventory availability, geo-tracked transport routes, and transparent digital settlements.
  </p>

  <div class="card-grid-3">
    <div class="key-metric">
      <span class="val">100%</span>
      <span class="lbl">Verified KYC Partners</span>
    </div>
    <div class="key-metric">
      <span class="val">Live GPS</span>
      <span class="lbl">Trip & Load Tracking</span>
    </div>
    <div class="key-metric">
      <span class="val">T+1</span>
      <span class="lbl">Direct Bank Settlement</span>
    </div>
  </div>

  <h3>End-to-End Agri Trade Workflow</h3>
  <div class="flow-container">
    <div class="flow-node">
      <div class="fn-title">1. Wholesaler</div>
      <div class="fn-sub">Adds Stock & Batch Pricing</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">2. Retailer</div>
      <div class="fn-sub">Browses, Carts & Places Order</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">3. Transporter</div>
      <div class="fn-sub">Picks up from Mandi Bay</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">4. Delivery</div>
      <div class="fn-sub">OTP Verified POD & Payout</div>
    </div>
  </div>

  <h2>Table of Contents</h2>
  <table class="custom-table">
    <thead>
      <tr>
        <th style="width: 10%;">Sec</th>
        <th style="width: 35%;">Module / Role</th>
        <th style="width: 40%;">Key Capabilities Covered</th>
        <th style="width: 15%;">Primary Route</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>02</strong></td>
        <td><strong>Account & KYC Setup</strong></td>
        <td>Sign Up, OTP, Business Profile, GST/PAN, Mandi Locations</td>
        <td><code>/login</code></td>
      </tr>
      <tr>
        <td><strong>03</strong></td>
        <td><strong>Buyer / Retailer Guide</strong></td>
        <td>Catalog Discovery, Carts, Multi-payment, Order Tracking, Spends</td>
        <td><code>/buyer/*</code></td>
      </tr>
      <tr>
        <td><strong>04</strong></td>
        <td><strong>Wholesaler Guide</strong></td>
        <td>Stock Dashboard, Orders Received, AI Restocking, Market Trends</td>
        <td><code>/wholesaler/*</code></td>
      </tr>
      <tr>
        <td><strong>05</strong></td>
        <td><strong>Transport & Driver Guide</strong></td>
        <td>Vehicle Registration, Rate Cards, Pickup, GPS Route, Digital POD</td>
        <td><code>/transport/*</code></td>
      </tr>
      <tr>
        <td><strong>06</strong></td>
        <td><strong>Warehouse & QA Guide</strong></td>
        <td>Inward Grading, Storage Bins, Picking/Dispatch, Spoilage Audit</td>
        <td><code>/warehouse/*</code></td>
      </tr>
      <tr>
        <td><strong>07</strong></td>
        <td><strong>Help & Support Centers</strong></td>
        <td>Interactive Walkthrough Cards, Dispute Filing, 24/7 Helpline</td>
        <td><code>/shared/*</code></td>
      </tr>
    </tbody>
  </table>

  <div class="callout tip">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <strong>Language Switching:</strong> Users can toggle seamlessly between English and Hindi at any time by tapping the top-right Language toggle (<strong>EN / हिं</strong>) on the landing page or through <strong>Settings &gt; Language Preference</strong>.
    </div>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 2</span>
  </div>
</div>

<!-- PAGE 3: ONBOARDING & BUSINESS REGISTRATION -->
<div class="page">
  <div class="section-header-band">
    <h2>2. Onboarding, KYC Verification & Location Setup</h2>
    <span class="section-tag">Account Setup</span>
  </div>

  <p>
    To maintain trust and security, all partners on Melato undergo a swift, automated KYC verification process before transactions can be initiated.
  </p>

  <div class="step-card">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">Account Creation & Authentication</div>
      <span class="step-route">/login</span>
    </div>
    <ul>
      <li>Open the Melato App and choose your primary role (<strong>Wholesaler, Retailer, or Transport Driver</strong>).</li>
      <li>Enter your <strong>10-digit Mobile Number</strong> or Business Email.</li>
      <li>Enter the <strong>6-digit OTP</strong> received via SMS/Email to verify your identity.</li>
      <li>Set a secure 6-digit PIN or password for subsequent quick logins.</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">Business Profile & Legal Verification</div>
      <span class="step-route">/buyer/business-registration or /wholesaler/business-registration</span>
    </div>
    <ul>
      <li><strong>Legal Business Details:</strong> Enter Registered Business Name, Owner Name, Business Category (Vegetables, Fruits, Grains, Mixed), and Establishment Year.</li>
      <li><strong>Tax & Mandi License:</strong> Provide your 15-digit <strong>GSTIN</strong> (optional for small micro-farmers, mandatory for wholesalers) and 10-character <strong>PAN</strong> (e.g., <code>ABCDE1234F</code>).</li>
      <li><strong>Aadhaar / Mandi Trade License:</strong> Input your Aadhaar number and APMC Mandi License number for instant verification.</li>
      <li><strong>Bank Details:</strong> Add Bank Account Number & IFSC code for direct payout settlements.</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">Configuring Business Locations & Delivery Points</div>
      <span class="step-route">/wholesaler/business-locations & /buyer/business-locations</span>
    </div>
    <ul>
      <li>Tap <strong>Business Locations</strong> in the side menu and click <strong>Add New Location</strong>.</li>
      <li>Enter State, City, APMC Mandi / Local Area, Pin Code, and full street address.</li>
      <li>Pin your exact warehouse gate or retail storefront location on Google Maps for precise driver navigation.</li>
      <li>Assign specific branch managers or on-site contact persons with their mobile numbers.</li>
    </ul>
  </div>

  <div class="callout important">
    <div class="callout-icon">ℹ️</div>
    <div class="callout-content">
      <strong>Branch Verification:</strong> Adding multiple branch locations allows wholesalers to dispatch goods from distinct regional cold-rooms and enables multi-store retailers to choose specific drop-off storefronts during checkout.
    </div>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 3</span>
  </div>
</div>

<!-- PAGE 4: BUYER / RETAILER GUIDE -->
<div class="page">
  <div class="section-header-band buyer">
    <h2>3. Buyer & Retailer User Guide: Procurement to Delivery</h2>
    <span class="section-tag">Retailer Role</span>
  </div>

  <p>
    Retailers use Melato to purchase grade-inspected fresh vegetables, fruits, and agri-commodities directly from vetted mandi wholesalers at wholesale prices.
  </p>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">Discovering Commodities & Category Navigation</div>
      <span class="step-route">/buyer/buyer-home</span>
    </div>
    <p>
      The home screen displays live daily mandi price highlights, trending commodities, and categories (Vegetables, Fruits, Staples, Leafy Greens).
    </p>
    <ul>
      <li>Use the <strong>Live Search Bar</strong> to quickly search for specific produce (e.g., "Nashik Red Onion", "Hybrid Tomato").</li>
      <li>Filter by <strong>Commodity Grade (Grade A / Premium, Grade B / Standard)</strong>, Minimum Order Quantity (MOQ), and Distance from Mandi.</li>
      <li>Tap the <strong>Heart Icon</strong> on any item to save it to your <strong>Wishlist</strong> (<code>/buyer/wishlist</code>) for quick daily re-ordering.</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">Managing Cart & Customizing Units</div>
      <span class="step-route">/buyer/cart</span>
    </div>
    <ul>
      <li>Select procurement units: <strong>Kilograms (KG), Quintals (100 KG), Tonnes, or Standard Crates (25 KG)</strong>.</li>
      <li>Adjust quantity steppers. The cart will automatically calculate bulk volume discounts, applicable APMC mandi cess, and estimated freight charges.</li>
      <li>Select the designated <strong>Delivery Branch Location</strong> where the shipment should be unloaded.</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">Checkout, Payment & Delivery Slot Scheduling</div>
      <span class="step-route">/buyer/checkout & /buyer/payment</span>
    </div>
    <ul>
      <li><strong>Select Delivery Slot:</strong> Choose between Early Morning Delivery (4:00 AM - 7:00 AM) or Standard Day Slot.</li>
      <li><strong>Payment Gateways:</strong> Pay seamlessly via <strong>Instant UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit Cards</strong>, or approved <strong>Trade Credit / Pay on Delivery (COD)</strong> terms.</li>
      <li>Once confirmed, you will receive an instant <strong>Order Confirmation</strong> with Order ID and Live Tracking PIN.</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">Live Tracking, Receiving Goods & Proof-of-Delivery</div>
      <span class="step-route">/buyer/retailer-order-history</span>
    </div>
    <ul>
      <li>Track real-time order stages: <span class="badge badge-amber">Placed</span> ➔ <span class="badge badge-blue">Packed</span> ➔ <span class="badge badge-purple">In Transit</span> ➔ <span class="badge badge-green">Delivered</span>.</li>
      <li>When the transport driver arrives, perform a quick physical inspection of crates.</li>
      <li>Share the <strong>4-digit Receiving OTP</strong> shown on your screen with the driver to authenticate delivery completion.</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 4</span>
  </div>
</div>

<!-- PAGE 5: BUYER ANALYTICS & DISPUTES -->
<div class="page">
  <div class="section-header-band buyer">
    <h2>3.1 Retailer Spend Analytics & Dispute Resolution</h2>
    <span class="section-tag">Spend & Quality Control</span>
  </div>

  <div class="card-grid-2">
    <div class="ui-card">
      <div class="ui-card-title">📊 Spend Analytics & Price Intelligence</div>
      <p style="font-size:12px; margin-bottom:6px;">Navigate to <code>/buyer/spends</code> & <code>/buyer/RetailerTrends</code></p>
      <ul style="font-size:12px;">
        <li><strong>Expense Breakdown:</strong> View weekly, monthly, and quarterly procurement budgets segmented by vegetable and fruit categories.</li>
        <li><strong>Price Trend Predictor:</strong> AI forecasts indicating whether onion, potato, or tomato prices are expected to rise or fall over the next 7 days.</li>
        <li><strong>Re-order Recommendations:</strong> Automated notifications for staple items running low based on previous purchase frequency.</li>
      </ul>
    </div>

    <div class="ui-card">
      <div class="ui-card-title">🛡️ Quality Guarantee & Refund Policy</div>
      <p style="font-size:12px; margin-bottom:6px;">Melato provides 100% replacement / credit protection:</p>
      <ul style="font-size:12px;">
        <li><strong>Shortage:</strong> Weight received is less than invoiced amount.</li>
        <li><strong>Transit Spoilage / Rot:</strong> Damaged produce during logistics.</li>
        <li><strong>Grade Mismatch:</strong> Delivered Grade B instead of Grade A.</li>
        <li><strong>Resolution Window:</strong> Automatic credit notes issued within 24 hours of ticket approval.</li>
      </ul>
    </div>
  </div>

  <h3>How to Report an Issue / Raise a Dispute</h3>
  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">!</div>
      <div class="step-title">Filing a Dispute Ticket</div>
      <span class="step-route">/buyer/report-issue/:orderId</span>
    </div>
    <ol>
      <li>Go to <strong>Order History</strong>, select the specific order, and tap <strong>Report Issue / Dispute</strong>.</li>
      <li>Select the issue category: <em>"Damaged/Spoiled Goods", "Quantity Shortage", "Wrong Item", or "Delivery Delay"</em>.</li>
      <li>Enter affected quantity (e.g., "15 KG damaged out of 100 KG").</li>
      <li>Take clear photographs of the damaged produce or weighing scale reading and attach them directly in the app.</li>
      <li>Submit the ticket. Track resolution progress in real-time under <strong>My Issues</strong> (<code>/buyer/my-issues</code>).</li>
    </ol>
  </div>

  <table class="custom-table">
    <thead>
      <tr>
        <th>Dispute Status</th>
        <th>Meaning</th>
        <th>Expected Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-amber">Open / Under Review</span></td>
        <td>Melato QA team is inspecting submitted photos and weighing records.</td>
        <td>No action needed; response within 2 hours.</td>
      </tr>
      <tr>
        <td><span class="badge badge-blue">Wholesaler Review</span></td>
        <td>Claim forwarded to mandi supplier for verification.</td>
        <td>Wholesaler validates batch dispatch logs.</td>
      </tr>
      <tr>
        <td><span class="badge badge-green">Resolved & Refunded</span></td>
        <td>Dispute accepted; credit note or bank refund initiated.</td>
        <td>Amount credited to Melato Wallet / Bank within 24h.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 5</span>
  </div>
</div>

<!-- PAGE 6: WHOLESALER / SUPPLIER GUIDE -->
<div class="page">
  <div class="section-header-band wholesaler">
    <h2>4. Wholesaler & Supplier Guide: Inventory & Fulfillment</h2>
    <span class="section-tag">Wholesaler Role</span>
  </div>

  <p>
    Wholesalers and Mandi Commission Agents use Melato to list daily fresh arrivals, manage bulk inventories across cold-rooms, receive purchase orders from hundreds of retailers, and coordinate prompt dispatches.
  </p>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">Mastering the Wholesaler Home Dashboard</div>
      <span class="step-route">/wholesaler/home</span>
    </div>
    <ul>
      <li><strong>Live Metrics:</strong> Real-time overview of Today's Earnings, Pending Payouts, Total Active Orders, and Total In-Stock volume.</li>
      <li><strong>Alert Banner - "Items Needed for Tomorrow":</strong> Instant calculation showing upcoming next-day retailer demand vs. current warehouse stock.</li>
      <li><strong>Low Stock & Shortage Warnings:</strong> Highlights commodities where inventory is below the safety threshold.</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">Managing Inventory & Adding New Stock</div>
      <span class="step-route">/wholesaler/stock-dashboard & /wholesaler/add-stock</span>
    </div>
    <ul>
      <li>Tap <strong>Add New Stock</strong> to list freshly arrived farm lots.</li>
      <li>Select Commodity Name, Variety (e.g., "Desi Tomato", "Sharbati Wheat"), Harvest Date, and Storage Mandi Location.</li>
      <li>Specify Pricing Structure: Base rate per KG / Quintal / Crate, minimum order quantity, and bulk discount brackets.</li>
      <li>Update stock levels in real time using <strong>Update Stock</strong> (<code>/wholesaler/update-stock</code>) as produce is sold.</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">Processing Orders Received & Packaging</div>
      <span class="step-route">/wholesaler/orders</span>
    </div>
    <ul>
      <li>When a retailer places an order, it appears in <strong>Orders Received</strong> under the <span class="badge badge-amber">New</span> tab.</li>
      <li>Review buyer details, requested quantities, and delivery timeframe. Tap <strong>Accept Order</strong>.</li>
      <li>Direct warehouse staff to weigh, grade, and package crates. Mark status as <span class="badge badge-blue">Packed & Ready</span>.</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">Pickup Bay Staging & Transporter Hand-off</div>
      <span class="step-route">/wholesaler/pickup-orders</span>
    </div>
    <ul>
      <li>Orders marked ready move to the <strong>Pickup Orders</strong> screen.</li>
      <li>When the assigned logistics driver arrives at your mandi bay, verify the driver's vehicle registration number in the app.</li>
      <li>Hand over crates and obtain digital pickup confirmation to transition the order to <span class="badge badge-purple">In Transit</span>.</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 6</span>
  </div>
</div>

<!-- PAGE 7: WHOLESALER AI INSIGHTS & EARNINGS -->
<div class="page">
  <div class="section-header-band wholesaler">
    <h2>4.1 Wholesaler AI Demand Intelligence & Settlement</h2>
    <span class="section-tag">Market Intelligence</span>
  </div>

  <div class="card-grid-2">
    <div class="ui-card highlight">
      <div class="ui-card-title">📈 AI Demand Forecasting</div>
      <p style="font-size:12px; margin-bottom:6px;">Routes: <code>/wholesaler/next-day-demand</code> & <code>/wholesaler/past-demand</code></p>
      <ul style="font-size:12px;">
        <li><strong>Predictive Demand Models:</strong> Melato's algorithms analyze regional retailer purchase patterns, local weather, and festival trends to predict exact metric tonnes required for tomorrow.</li>
        <li><strong>Restocking Recommendations (<code>/wholesaler/restocking-recommendations</code>):</strong> Recommends ideal procurement quantities from farmers today to capture peak morning prices without overstocking.</li>
      </ul>
    </div>

    <div class="ui-card highlight">
      <div class="ui-card-title">🌍 Market Opportunities & APMC Trends</div>
      <p style="font-size:12px; margin-bottom:6px;">Route: <code>/wholesaler/trends/market-comparison</code></p>
      <ul style="font-size:12px;">
        <li><strong>Multi-Mandi Rate Comparison:</strong> Compare live arrival rates between Azadpur, Vashi, Lasalgaon, and local APMCs.</li>
        <li><strong>High-Margin Crop Alerts:</strong> Identifies commodities with high buyer search demand but limited supplier stock in your area.</li>
        <li><strong>Stock Insights:</strong> Tracks inventory shelf-life to prevent produce spoilage through targeted price discounts.</li>
      </ul>
    </div>
  </div>

  <h3>Earnings, Bank Settlements & Payouts</h3>
  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">₹</div>
      <div class="step-title">Viewing Earnings & Payout Statements</div>
      <span class="step-route">/wholesaler/earnings</span>
    </div>
    <ul>
      <li><strong>Total Revenue:</strong> View gross sales, net earnings after platform fees, and pending payout balances.</li>
      <li><strong>Settlement Schedule:</strong> All delivered orders are settled directly into your registered bank account on a guaranteed <strong>T+1 settlement cycle</strong>.</li>
      <li><strong>Download Invoices:</strong> Download GST-compliant tax invoices and mandi cess statements with one tap for accounting.</li>
    </ul>
  </div>

  <div class="callout tip">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <strong>Pro Tip for Wholesalers:</strong> Keeping your stock dashboard updated by 6:00 PM every evening boosts your listing visibility to early-morning buyers by 40%, ensuring faster inventory turnover.
    </div>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 7</span>
  </div>
</div>

<!-- PAGE 8: TRANSPORT & DRIVER GUIDE -->
<div class="page">
  <div class="section-header-band transport">
    <h2>5. Transport & Driver Partner Guide: Logistics Execution</h2>
    <span class="section-tag">Transport Role</span>
  </div>

  <p>
    Transport partners, fleet owners, and individual commercial drivers use Melato to receive high-paying agri-freight trips, optimize delivery routes, and receive guaranteed digital trip payouts.
  </p>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">Driver Onboarding & Fleet Registration</div>
      <span class="step-route">/transport/driver-registration & /transport/manage-vehicles</span>
    </div>
    <ul>
      <li>Upload <strong>Commercial Driving License (DL)</strong>, Vehicle RC, Fitness Certificate, and Commercial Insurance.</li>
      <li>Select Vehicle Category: <em>3-Wheeler (500 KG), Tata Ace / Mini Truck (1.5 Ton), Pickup / Bolero (2.5 Ton), or Heavy Truck (10+ Ton)</em>.</li>
      <li>Configure Custom Freight Rate Cards (<code>/transport/transport-update-rates</code>) with base per-KM charges and loading/unloading fees.</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">Accepting Transport Requests & Trip Allocation</div>
      <span class="step-route">/transport/transport-requests</span>
    </div>
    <ul>
      <li>Live delivery requests appear with pickup mandi location, drop destination, load weight (KG), and estimated trip fare.</li>
      <li>Individual drivers tap <strong>Accept Trip</strong>; Fleet Managers can assign specific registered drivers and vehicles from their fleet using <strong>Assign Driver Modal</strong> (<code>/transport/assign-driver-modal</code>).</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">Warehouse Pickup, Route Optimization & Navigation</div>
      <span class="step-route">/transport/pickup-orders & /transport/route-optimization</span>
    </div>
    <ul>
      <li>Follow in-app GPS navigation to the wholesaler's warehouse bay.</li>
      <li>Verify crate counts and load safety. Mark status as <strong>Picked Up</strong> in the app.</li>
      <li>Use <strong>Route Optimization</strong> for multi-stop delivery sequences, saving up to 25% on fuel and transit time.</li>
      <li>Communicate with buyers or wholesalers directly via built-in <strong>Customer Chat</strong> (<code>/transport/customer-chat</code>).</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">Proof of Delivery (POD) & Instant Fare Credit</div>
      <span class="step-route">/transport/delivery-confirmation/:jobId</span>
    </div>
    <ul>
      <li>Upon reaching the retailer's shop, tap <strong>Arrived at Destination</strong>.</li>
      <li>Ask the retailer for their <strong>4-digit Delivery OTP</strong> and enter it into the app.</li>
      <li>Capture a clear photo of the unloaded crates at the storefront as digital Proof of Delivery (POD).</li>
      <li>Trip fare is immediately credited to your <strong>Earnings Dashboard</strong> (<code>/transport/earnings-dashboard</code>).</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 8</span>
  </div>
</div>

<!-- PAGE 9: WAREHOUSE QA & APP HELP CENTER -->
<div class="page">
  <div class="section-header-band warehouse">
    <h2>6. Warehouse Operations & Interactive Help Center</h2>
    <span class="section-tag">Operations & Support</span>
  </div>

  <h3>Warehouse Inventory & Quality Assurance Operations</h3>
  <div class="card-grid-2">
    <div class="ui-card">
      <div class="ui-card-title">🔬 Inward Quality & Inspection</div>
      <p style="font-size:11.5px; margin-bottom:4px;">Route: <code>/warehouse/receiving-inspection</code></p>
      <ul style="font-size:11.5px;">
        <li>Record inward truck weight and conduct random sample testing for moisture, size uniformity, and defects.</li>
        <li>Assign quality grades: <strong>Grade A (Premium Retail), Grade B (Standard), or Grade C (Processing)</strong>.</li>
        <li>Generate batch barcode tags for seamless traceability across cold storage chambers.</li>
      </ul>
    </div>

    <div class="ui-card">
      <div class="ui-card-title">📦 Storage & Spoilage Audits</div>
      <p style="font-size:11.5px; margin-bottom:4px;">Route: <code>/warehouse/stock-movement-audit</code></p>
      <ul style="font-size:11.5px;">
        <li>Manage bin and cold-room rack allocations (<code>/warehouse/storage-management</code>).</li>
        <li>Log spoiled or damaged produce under <strong>Wastage & Spoilage</strong> (<code>/warehouse/wastage-spoilage</code>) with mandatory photo evidence and supervisor sign-off.</li>
      </ul>
    </div>
  </div>

  <div class="section-header-band support" style="margin-top:14px;">
    <h2>7. In-App Help Center & Support Center</h2>
    <span class="section-tag">Customer Care</span>
  </div>

  <p>
    Melato features a built-in, role-specific <strong>Help Center</strong> (<code>/shared/help-center</code>) that provides interactive visual guides directly on your mobile screen.
  </p>

  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">?</div>
      <div class="step-title">How the Interactive Help Center Operates</div>
      <span class="step-route">Accessible via Menu &gt; Help Center</span>
    </div>
    <ul>
      <li><strong>Guided Walkthroughs:</strong> On first login, an automated multi-step tutorial introduces key buttons and workflows. Tap <strong>Replay Walkthrough</strong> anytime to view it again.</li>
      <li><strong>Direct Screen Deep-Links:</strong> Tapping any help card (e.g., <em>"How to update stock", "How to manage cart", "How to confirm delivery"</em>) opens that exact screen in the app with contextual tooltips.</li>
      <li><strong>Category Filtering:</strong> Filter help topics by <em>Shopping, Orders, Stock, Insights, Deliveries, or Earnings</em>.</li>
    </ul>
  </div>

  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">📞</div>
      <div class="step-title">Support Center & Emergency Escalations</div>
      <span class="step-route">/shared/support-center</span>
    </div>
    <ul>
      <li><strong>Category-Based Ticketing:</strong> Select specific issue types (Payment, Dispatch, Damaged Goods, Vehicle Breakdown) for rapid routing to dedicated support specialists.</li>
      <li><strong>Urgent Helpline:</strong> Tap <strong>Call Support</strong> for instant voice assistance during emergency transit breakdowns or high-priority payment disputes.</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure</span>
    <span>Page 9</span>
  </div>
</div>

<!-- PAGE 10: QUICK REFERENCE SUMMARY & BEST PRACTICES -->
<div class="page">
  <div class="section-header-band">
    <h2>8. Quick Reference Sheet & Best Practice Guidelines</h2>
    <span class="section-tag">Cheat Sheet</span>
  </div>

  <table class="custom-table">
    <thead>
      <tr>
        <th>Role</th>
        <th>Daily Core Action</th>
        <th>Best Practice for Maximum Profit</th>
        <th>Common Mistake to Avoid</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Wholesaler</strong></td>
        <td>Update stock inventory by 6:00 PM daily</td>
        <td>Review Next-Day Demand predictions to replenish before price spikes</td>
        <td>Failing to update stock, leading to cancelled retailer orders</td>
      </tr>
      <tr>
        <td><strong>Buyer (Retailer)</strong></td>
        <td>Place procurement orders before 9:00 PM for 5:00 AM delivery</td>
        <td>Inspect goods upon arrival & submit dispute photos within 12 hours</td>
        <td>Sharing delivery verification OTP before physically checking crates</td>
      </tr>
      <tr>
        <td><strong>Transport Driver</strong></td>
        <td>Accept morning mandi dispatch requests</td>
        <td>Use Route Optimization to combine multiple drops in one trip</td>
        <td>Neglecting to capture photo Proof of Delivery (POD) at destination</td>
      </tr>
      <tr>
        <td><strong>Warehouse</strong></td>
        <td>Conduct inward grading & cold-room logging</td>
        <td>Maintain strict FIFO (First-In, First-Out) batch rotation</td>
        <td>Delaying spoilage logging, distorting inventory reconciliation</td>
      </tr>
    </tbody>
  </table>

  <h3>Frequently Asked Questions (FAQ)</h3>
  <div class="card-grid-2">
    <div class="ui-card">
      <strong>Q: How long do bank payouts take?</strong>
      <p style="font-size:11.5px; margin-top:2px;">A: All completed orders and trips are settled on a guaranteed T+1 business day timeline directly into your registered bank account.</p>
    </div>
    <div class="ui-card">
      <strong>Q: What if the delivery driver is delayed?</strong>
      <p style="font-size:11.5px; margin-top:2px;">A: Track the live GPS location under Order Details or tap 'Customer Chat' to speak with the driver. Urgent delays can be escalated to Support.</p>
    </div>
    <div class="ui-card">
      <strong>Q: How do I change my registered phone or bank?</strong>
      <p style="font-size:11.5px; margin-top:2px;">A: Go to Settings &gt; Profile &gt; Business Info and submit an update request with updated verification documents.</p>
    </div>
    <div class="ui-card">
      <strong>Q: What happens if an item is out of stock?</strong>
      <p style="font-size:11.5px; margin-top:2px;">A: The retailer is instantly notified with an option to select an alternative supplier or receive an instant wallet refund.</p>
    </div>
  </div>

  <div class="callout tip" style="margin-top:14px;">
    <div class="callout-icon">⭐</div>
    <div class="callout-content">
      <strong>Need Further Assistance?</strong><br>
      Access the in-app <strong>Help Center</strong> anytime via <code>Settings &gt; Help Center</code> or contact the Melato National Support Desk at <strong>support@melato.in</strong> / <strong>1800-MELATO-AGRI</strong>.
    </div>
  </div>

  <div class="footer-nav">
    <span>Melato Standard Operating Procedure • End of Manual</span>
    <span>Page 10</span>
  </div>
</div>

</body>
</html>
"""
    return html

if __name__ == "__main__":
    content = build_english_html()
    with open("Melato_User_Guide_English.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("Melato_User_Guide_English.html created successfully.")
''')

print("Writing Hindi HTML guide builder...")
with open(os.path.join(BASE_DIR, "generate_hi_guide.py"), "w", encoding="utf-8") as f:
    f.write('''# Hindi Guide Builder
import os
import sys

def build_hindi_html():
    from generate_guides import COMMON_CSS

    html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<title>मेलाटो कृषि प्लेटफॉर्म - आधिकारिक ऐप उपयोग गाइड (हिन्दी)</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE (HINDI) -->
<div class="page">
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-brand">
        <div class="cover-logo-circle">M</div>
        <div>
          <div class="cover-brand-name">Melato (मेलाटो)</div>
          <div class="cover-tagline">भारतीय कृषि आपूर्ति श्रृंखला प्लेटफॉर्म</div>
        </div>
      </div>
      <div class="cover-badge">आधिकारिक संचालन नियमावली • संस्करण 2.4</div>
    </div>

    <div class="cover-body">
      <div class="cover-kicker">संपूर्ण परिचालन मार्गदर्शिका</div>
      <h1 class="cover-title">मेलाटो ऐप का उपयोग कैसे करें?</h1>
      <p class="cover-subtitle">
        खरीदारों (खुदरा विक्रेताओं/रिटेलर्स), थोक विक्रेताओं (मंडी व्यापारियों), परिवहन भागीदारों (ड्राइवरों) और गोदाम प्रबंधकों के लिए खरीद, स्टॉक, लॉजिस्टिक्स और विवाद समाधान की चरण-दर-चरण संपूर्ण गाइड।
      </p>

      <div class="cover-roles-grid">
        <div class="cover-role-card">
          <div class="role-icon">🛒</div>
          <div class="role-name">खरीदार (रिटेलर)</div>
          <div class="role-desc">ताजा उपज खरीदें, लाइव डिलीवरी ट्रैक करें व खर्च देखें</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🏢</div>
          <div class="role-name">थोक विक्रेता (सप्लायर)</div>
          <div class="role-desc">स्टॉक प्रबंधित करें, ऑर्डर पूरे करें व AI मांग देखें</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🚚</div>
          <div class="role-name">परिवहन (ड्राइवर)</div>
          <div class="role-desc">ट्रिप स्वीकार करें, रूट अनुकूलित करें व डिजिटल POD दें</div>
        </div>
        <div class="cover-role-card">
          <div class="role-icon">🏭</div>
          <div class="role-name">गोदाम व गुणवत्ता</div>
          <div class="role-desc">ग्रेडिंग, बैच ट्रैकिंग व इन्वेंट्री नियंत्रण</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>मेलाटो उत्पाद एवं परिचालन टीम द्वारा प्रकाशित</div>
      <div>उपलब्ध भाषाएँ: हिन्दी • English</div>
      <div>गोपनीय एवं सर्वाधिकार सुरक्षित</div>
    </div>
  </div>
</div>

<!-- PAGE 2: TABLE OF CONTENTS & ARCHITECTURE (HINDI) -->
<div class="page">
  <div class="section-header-band">
    <h2>1. प्लेटफॉर्म परिचय एवं कार्यप्रणाली</h2>
    <span class="section-tag">सिस्टम रूपरेखा</span>
  </div>

  <p>
    <strong>मेलाटो (Melato)</strong> भारत के संपूर्ण कृषि व्यापार को एक सुरक्षित डिजिटल प्लेटफॉर्म से जोड़ता है। बार-बार के फोन कॉल, कच्ची पर्चियों और अपुष्ट नकद लेन-देन को समाप्त करके, मेलाटो वास्तविक समय में मंडी भाव, लाइव स्टॉक, जीपीएस वाहन ट्रैकिंग और पारदर्शी बैंक भुगतान की सुविधा देता है।
  </p>

  <div class="card-grid-3">
    <div class="key-metric">
      <span class="val">100%</span>
      <span class="lbl">सत्यापित KYC भागीदार</span>
    </div>
    <div class="key-metric">
      <span class="val">लाइव GPS</span>
      <span class="lbl">ट्रिप एवं वाहन ट्रैकिंग</span>
    </div>
    <div class="key-metric">
      <span class="val">T+1</span>
      <span class="lbl">सीधा बैंक खाता भुगतान</span>
    </div>
  </div>

  <h3>एंड-टू-एंड कृषि व्यापार प्रक्रिया</h3>
  <div class="flow-container">
    <div class="flow-node">
      <div class="fn-title">1. थोक विक्रेता</div>
      <div class="fn-sub">स्टॉक व भाव अपडेट करते हैं</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">2. खुदरा खरीदार</div>
      <div class="fn-sub">कार्ट में जोड़कर ऑर्डर देते हैं</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">3. ट्रांसपोर्टर</div>
      <div class="fn-sub">मंडी से माल पिकअप करते हैं</div>
    </div>
    <div class="flow-arrow">➔</div>
    <div class="flow-node">
      <div class="fn-title">4. डिलीवरी</div>
      <div class="fn-sub">OTP सत्यापन व तुरंत भुगतान</div>
    </div>
  </div>

  <h2>विषय सूची (Table of Contents)</h2>
  <table class="custom-table">
    <thead>
      <tr>
        <th style="width: 10%;">खंड</th>
        <th style="width: 35%;">मॉड्यूल / भूमिका</th>
        <th style="width: 40%;">मुख्य विशेषताएं एवं कार्य</th>
        <th style="width: 15%;">ऐप रूट</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>02</strong></td>
        <td><strong>पंजीकरण एवं KYC सत्यापन</strong></td>
        <td>साइन अप, OTP, व्यवसाय विवरण, GST/PAN, मंडी स्थान</td>
        <td><code>/login</code></td>
      </tr>
      <tr>
        <td><strong>03</strong></td>
        <td><strong>खरीदार (रिटेलर) गाइड</strong></td>
        <td>उत्पाद खोज, कार्ट, ऑनलाइन भुगतान, ट्रैकिंग, खर्च विश्लेषण</td>
        <td><code>/buyer/*</code></td>
      </tr>
      <tr>
        <td><strong>04</strong></td>
        <td><strong>थोक विक्रेता गाइड</strong></td>
        <td>स्टॉक डैशबोर्ड, प्राप्त ऑर्डर, AI रीस्टॉक सुझाव, मंडी रुझान</td>
        <td><code>/wholesaler/*</code></td>
      </tr>
      <tr>
        <td><strong>05</strong></td>
        <td><strong>परिवहन एवं ड्राइवर गाइड</strong></td>
        <td>वाहन पंजीकरण, दरें, पिकअप, GPS रूट, डिजिटल POD</td>
        <td><code>/transport/*</code></td>
      </tr>
      <tr>
        <td><strong>06</strong></td>
        <td><strong>गोदाम एवं गुणवत्ता नियंत्रण</strong></td>
        <td>आवक जांच (Grading), स्टोरेज बिन, डिस्पैच, नुकसान ऑडिट</td>
        <td><code>/warehouse/*</code></td>
      </tr>
      <tr>
        <td><strong>07</strong></td>
        <td><strong>सहायता केंद्र (Help Center)</strong></td>
        <td>इंटरैक्टिव वॉकथ्रू, समस्या रिपोर्टिंग, 24/7 हेल्पलाइन</td>
        <td><code>/shared/*</code></td>
      </tr>
    </tbody>
  </table>

  <div class="callout tip">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <strong>भाषा बदलना:</strong> उपयोगकर्ता किसी भी समय स्क्रीन के ऊपर दाईं ओर दिए गए भाषा बटन (<strong>EN / हिं</strong>) या <strong>सेटिंग्स &gt; भाषा प्राथमिकता</strong> में जाकर ऐप की भाषा बदल सकते हैं।
    </div>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 2</span>
  </div>
</div>

<!-- PAGE 3: ONBOARDING & BUSINESS REGISTRATION (HINDI) -->
<div class="page">
  <div class="section-header-band">
    <h2>2. पंजीकरण, KYC सत्यापन एवं व्यावसायिक स्थान सेटअप</h2>
    <span class="section-tag">खाता सेटअप</span>
  </div>

  <p>
    व्यापार में उच्च सुरक्षा और विश्वसनीयता बनाए रखने के लिए, मेलाटो पर सभी भागीदारों का तुरंत डिजिटल KYC सत्यापन किया जाता है।
  </p>

  <div class="step-card">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">खाता बनाना एवं लॉगिन (Login & Authentication)</div>
      <span class="step-route">/login</span>
    </div>
    <ul>
      <li>मेलाटो ऐप खोलें और अपनी मुख्य भूमिका चुनें (<strong>थोक विक्रेता, खुदरा खरीदार या ट्रांसपोर्ट ड्राइवर</strong>)।</li>
      <li>अपना <strong>10-अंकों का मोबाइल नंबर</strong> या व्यावसायिक ईमेल दर्ज करें।</li>
      <li>SMS या ईमेल पर प्राप्त <strong>6-अंकों का OTP</strong> दर्ज करके सत्यापित करें।</li>
      <li>भविष्य में तुरंत लॉगिन करने के लिए अपना सुरक्षित 6-अंकों का पिन या पासवर्ड सेट करें।</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">व्यवसाय विवरण एवं कानूनी सत्यापन (KYC Setup)</div>
      <span class="step-route">/buyer/business-registration या /wholesaler/business-registration</span>
    </div>
    <ul>
      <li><strong>व्यावसायिक जानकारी:</strong> पंजीकृत फर्म/दुकान का नाम, मालिक का नाम, व्यवसाय की श्रेणी (सब्जियां, फल, अनाज) और स्थापना वर्ष दर्ज करें।</li>
      <li><strong>टैक्स एवं लाइसेंस विवरण:</strong> अपना 15-अंकों का <strong>GSTIN</strong> (छोटे खुदरा खरीदारों के लिए वैकल्पिक, थोक विक्रेताओं के लिए अनिवार्य) और 10-अक्षरों का <strong>PAN नंबर</strong> दर्ज करें।</li>
      <li><strong>आधार / मंडी ट्रेड लाइसेंस:</strong> तत्काल सत्यापन के लिए आधार नंबर और APMC मंडी लाइसेंस नंबर दर्ज करें।</li>
      <li><strong>बैंक विवरण:</strong> सीधी बैंक भुगतान प्राप्त करने हेतु बैंक खाता संख्या और IFSC कोड जोड़ें।</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">दुकान/गोदाम के स्थान जोड़ना (Business Locations)</div>
      <span class="step-route">/wholesaler/business-locations व /buyer/business-locations</span>
    </div>
    <ul>
      <li>मेनू में <strong>व्यावसायिक स्थान (Business Locations)</strong> पर जाएं और <strong>नया स्थान जोड़ें (Add Location)</strong> पर टैप करें।</li>
      <li>राज्य, शहर, स्थानीय मंडी/इलाका, पिन कोड और पूरा पता दर्ज करें।</li>
      <li>सटीक डिलीवरी के लिए गूगल मैप्स पर अपने गोदाम या दुकान का पिन सेट करें।</li>
      <li>संबंधित स्थान के प्रबंधक या संपर्क व्यक्ति का नाम और फोन नंबर दर्ज करें।</li>
    </ul>
  </div>

  <div class="callout important">
    <div class="callout-icon">ℹ️</div>
    <div class="callout-content">
      <strong>शाखा प्रबंधन:</strong> एक से अधिक व्यावसायिक स्थान जोड़ने से थोक विक्रेता अपने विभिन्न गोदामों से माल भेज सकते हैं और कई दुकानों वाले रिटेलर चेकआउट के समय इच्छित डिलीवरी स्थान चुन सकते हैं।
    </div>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 3</span>
  </div>
</div>

<!-- PAGE 4: BUYER / RETAILER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header-band buyer">
    <h2>3. खरीदार (रिटेलर) गाइड: खरीद से डिलीवरी तक</h2>
    <span class="section-tag">खरीदार भूमिका</span>
  </div>

  <p>
    खुदरा खरीदार और व्यापारी मेलाटो का उपयोग सीधे सत्यापित थोक विक्रेताओं से थोक भाव पर गुणवत्ता-जांची गई ताजा उपज खरीदने के लिए करते हैं।
  </p>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">उत्पाद खोजना एवं श्रेणियां देखना (Browsing & Search)</div>
      <span class="step-route">/buyer/buyer-home</span>
    </div>
    <p>
      होम स्क्रीन पर दैनिक मंडी भाव, लोकप्रिय उत्पाद और श्रेणियां (सब्जियां, फल, अनाज, पत्तेदार सब्जियां) दिखाई देती हैं।
    </p>
    <ul>
      <li>विशिष्ट वस्तुएं खोजने के लिए <strong>सर्च बार</strong> का उपयोग करें (जैसे "नासिक प्याज", "हाइब्रिड टमाटर")।</li>
      <li><strong>उत्पाद ग्रेड (ग्रेड A / प्रीमियम, ग्रेड B / सामान्य)</strong>, न्यूनतम मात्रा (MOQ) और मंडी दूरी के आधार पर फ़िल्टर करें।</li>
      <li>दैनिक रूप से बार-बार खरीदी जाने वाली वस्तुओं को <strong>विशलिस्ट (Wishlist)</strong> में सहेजने के लिए दिल (Heart) आइकन दबाएं।</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">कार्ट प्रबंधन एवं मात्रा चयन (Cart Management)</div>
      <span class="step-route">/buyer/cart</span>
    </div>
    <ul>
      <li>खरीद इकाई चुनें: <strong>किलोग्राम (KG), क्विंटल (100 KG), टन या मानक क्रेट (25 KG)</strong>।</li>
      <li>मात्रा निर्धारित करें; ऐप स्वचालित रूप से थोक छूट, लागू मंडी शुल्क और अनुमानित भाड़े की गणना करता है।</li>
      <li>ड्रॉप-डाउन से अपनी वह <strong>दुकान/शाखा</strong> चुनें जहाँ माल डिलीवर कराना है।</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">चेकआउट, डिलीवरी समय एवं भुगतान (Checkout & Payment)</div>
      <span class="step-route">/buyer/checkout व /buyer/payment</span>
    </div>
    <ul>
      <li><strong>डिलीवरी स्लॉट चुनें:</strong> सुबह जल्दी डिलीवरी (सुबह 4:00 से 7:00 बजे) या दिन का सामान्य स्लॉट चुनें।</li>
      <li><strong>भुगतान विकल्प:</strong> <strong>UPI (Google Pay, PhonePe, Paytm), नेट बैंकिंग, कार्ड</strong> या स्वीकृत <strong>उधार/डिलीवरी पर भुगतान (COD)</strong> चुनें।</li>
      <li>ऑर्डर सफल होने पर आपको ऑर्डर आईडी और लाइव ट्रैकिंग कोड के साथ <strong>ऑर्डर पुष्टि</strong> स्क्रीन दिखेगी।</li>
    </ul>
  </div>

  <div class="step-card amber">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">लाइव ट्रैकिंग, माल प्राप्ति एवं डिलीवरी सत्यापन</div>
      <span class="step-route">/buyer/retailer-order-history</span>
    </div>
    <ul>
      <li>ऑर्डर की स्थिति ट्रैक करें: <span class="badge badge-amber">दर्ज हुआ</span> ➔ <span class="badge badge-blue">पैक हुआ</span> ➔ <span class="badge badge-purple">रास्ते में</span> ➔ <span class="badge badge-green">डि डिलीवर हुआ</span>।</li>
      <li>डिलीवरी वाहन आने पर सामान और क्रेटों की भौतिक जांच करें।</li>
      <li>डिलीवरी पूरी करने के लिए ड्राइवर को अपनी स्क्रीन पर दिखने वाला <strong>4-अंकों का डिलीवरी OTP</strong> बताएं।</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 4</span>
  </div>
</div>

<!-- PAGE 5: BUYER ANALYTICS & DISPUTES (HINDI) -->
<div class="page">
  <div class="section-header-band buyer">
    <h2>3.1 रिटेलर खर्च विश्लेषण एवं विवाद समाधान (Disputes)</h2>
    <span class="section-tag">खर्च एवं गुणवत्ता सुरक्षा</span>
  </div>

  <div class="card-grid-2">
    <div class="ui-card">
      <div class="ui-card-title">📊 खर्च विश्लेषण एवं मूल्य रुझान</div>
      <p style="font-size:12px; margin-bottom:6px;">रूट: <code>/buyer/spends</code> व <code>/buyer/RetailerTrends</code></p>
      <ul style="font-size:12px;">
        <li><strong>खर्च रिपोर्ट:</strong> साप्ताहिक व मासिक आधार पर सब्जी और फल खरीद का विस्तृत विवरण देखें।</li>
        <li><strong>मूल्य पूर्वानुमान (AI Forecast):</strong> अगले 7 दिनों में प्याज, आलू या टमाटर के भाव बढ़ने या घटने का सटीक संकेत।</li>
        <li><strong>स्मार्ट री-ऑर्डर:</strong> पिछले खरीद चक्र के अनुसार आवश्यक वस्तुओं के लिए समय पर स्वचालित सूचना।</li>
      </ul>
    </div>

    <div class="ui-card">
      <div class="ui-card-title">🛡️ गुणवत्ता गारंटी एवं रिफंड नीति</div>
      <p style="font-size:12px; margin-bottom:6px;">मेलाटो देता है 100% सुरक्षा एवं रिफंड सुरक्षा:</p>
      <ul style="font-size:12px;">
        <li><strong>मात्रा में कमी (Shortage):</strong> प्राप्त वजन बिल से कम होना।</li>
        <li><strong>सड़ा/खराब माल (Spoilage):</strong> रास्ते में खराब हुआ माल।</li>
        <li><strong>गलत ग्रेड:</strong> ग्रेड A के स्थान पर ग्रेड B डिलीवर होना।</li>
        <li><strong>त्वरित समाधान:</strong> टिकट स्वीकृत होने के 24 घंटे के भीतर रिफंड या क्रेडिट नोट जारी।</li>
      </ul>
    </div>
  </div>

  <h3>समस्या रिपोर्ट करने एवं विवाद दर्ज करने की विधि</h3>
  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">!</div>
      <div class="step-title">विवाद टिकट दर्ज करना (Report an Issue)</div>
      <span class="step-route">/buyer/report-issue/:orderId</span>
    </div>
    <ol>
      <li><strong>ऑर्डर इतिहास</strong> में जाएं, संबंधित ऑर्डर चुनें और <strong>समस्या बताएं (Report Issue)</strong> पर टैप करें।</li>
      <li>समस्या का कारण चुनें: <em>"सामान खराब/सड़ा हुआ है", "वजन/मात्रा कम है", "गलत उत्पाद मिला", या "डिलीवरी में भारी देरी"</em>।</li>
      <li>प्रभावित मात्रा दर्ज करें (जैसे "100 KG में से 15 KG खराब")।</li>
      <li>खराब माल या कांटे के वजन की स्पष्ट फोटो खींचकर ऐप में अपलोड करें।</li>
      <li>सबमिट करें। अपनी शिकायत की स्थिति <strong>मेरी समस्याएं (My Issues)</strong> (<code>/buyer/my-issues</code>) में देखें।</li>
    </ol>
  </div>

  <table class="custom-table">
    <thead>
      <tr>
        <th>शिकायत की स्थिति</th>
        <th>विवरण</th>
        <th>अपेक्षित कार्रवाई</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-amber">प्रक्रियाधीन (Under Review)</span></td>
        <td>मेलाटो सपोर्ट टीम फोटो और बिल रिकॉर्ड की जांच कर रही है।</td>
        <td>कुछ करने की आवश्यकता नहीं; 2 घंटे में अपडेट।</td>
      </tr>
      <tr>
        <td><span class="badge badge-blue">विक्रेता सत्यापन</span></td>
        <td>शिकायत सत्यापन के लिए मंडी थोक विक्रेता को भेजी गई है।</td>
        <td>थोक विक्रेता अपने डिस्पैच रिकॉर्ड की पुष्टि करता है।</td>
      </tr>
      <tr>
        <td><span class="badge badge-green">समाधान एवं रिफंड</span></td>
        <td>शिकायत स्वीकृत; रिफंड या क्रेडिट नोट जारी किया गया।</td>
        <td>राशि 24 घंटे में आपके बैंक/वॉलेट में आ जाएगी।</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 5</span>
  </div>
</div>

<!-- PAGE 6: WHOLESALER / SUPPLIER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header-band wholesaler">
    <h2>4. थोक विक्रेता गाइड: स्टॉक प्रबंधन एवं ऑर्डर पूर्ति</h2>
    <span class="section-tag">थोक विक्रेता भूमिका</span>
  </div>

  <p>
    थोक व्यापारी और आढ़ती अपनी दैनिक आवक सूचीबद्ध करने, कई गोदामों का स्टॉक संभालने, सैकड़ों रिटेलरों से ऑर्डर प्राप्त करने और समय पर माल भेजने के लिए मेलाटो का उपयोग करते हैं।
  </p>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">थोक विक्रेता होम डैशबोर्ड की समझ</div>
      <span class="step-route">/wholesaler/home</span>
    </div>
    <ul>
      <li><strong>लाइव आंकड़े:</strong> आज की कुल बिक्री, लंबित भुगतान, सक्रिय ऑर्डर और कुल उपलब्ध स्टॉक की स्थिति देखें।</li>
      <li><strong>अलर्ट बैनर - "कल के लिए आवश्यक वस्तुएं":</strong> कल की अनुमानित रिटेलर मांग बनाम आपके वर्तमान स्टॉक की लाइव तुलना।</li>
      <li><strong>स्टॉक कमी चेतावनी (Low Stock):</strong> उन वस्तुओं की सूची जहां स्टॉक सुरक्षा सीमा से नीचे चला गया है।</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">इन्वेंट्री प्रबंधन एवं नया स्टॉक जोड़ना (Stock Management)</div>
      <span class="step-route">/wholesaler/stock-dashboard व /wholesaler/add-stock</span>
    </div>
    <ul>
      <li>मंडी में आए नए लॉट जोड़ने के लिए <strong>नया स्टॉक जोड़ें (Add Stock)</strong> पर टैप करें।</li>
      <li>उपज का नाम, किस्म (जैसे "देसी टमाटर", "शरबती गेहूं"), तुड़ाई की तारीख और मंडी गोदाम चुनें।</li>
      <li>मूल्य संरचना निर्धारित करें: प्रति KG / क्विंटल / क्रेट की दर, न्यूनतम ऑर्डर मात्रा और थोक छूट की शर्तें।</li>
      <li>माल बिकने पर <strong>स्टॉक अपडेट करें (Update Stock)</strong> में जाकर बची हुई मात्रा अपडेट रखें।</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">प्राप्त ऑर्डर संसाधित करना एवं पैकिंग (Orders Received)</div>
      <span class="step-route">/wholesaler/orders</span>
    </div>
    <ul>
      <li>जब कोई खरीदार ऑर्डर देता है, तो वह <strong>प्राप्त ऑर्डर</strong> में <span class="badge badge-amber">नया (New)</span> दिखेगा।</li>
      <li>खरीदार का विवरण और मात्रा देखकर <strong>ऑर्डर स्वीकार करें (Accept Order)</strong> पर टैप करें।</li>
      <li>गोदाम स्टाफ को माल तौलने और पैक करने का निर्देश दें। पैकिंग पूरी होने पर <strong>पैक हो गया (Packed)</strong> मार्क करें।</li>
    </ul>
  </div>

  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">पिकअप बे पर माल तैयार रखना एवं ड्राइवर को सौंपना</div>
      <span class="step-route">/wholesaler/pickup-orders</span>
    </div>
    <ul>
      <li>तैयार ऑर्डर स्वतः <strong>पिकअप ऑर्डर (Pickup Orders)</strong> सूची में आ जाते हैं।</li>
      <li>जब ट्रांसपोर्ट ड्राइवर आपकी मंडी दुकान पर पहुंचे, तो ऐप में उसके वाहन नंबर की पुष्टि करें।</li>
      <li>क्रेट सौंपें और ड्राइवर के ऐप से पिकअप पुष्टि लेकर ऑर्डर को <span class="badge badge-purple">रास्ते में (In Transit)</span> मार्क करें।</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 6</span>
  </div>
</div>

<!-- PAGE 7: WHOLESALER AI INSIGHTS & SETTLEMENTS (HINDI) -->
<div class="page">
  <div class="section-header-band wholesaler">
    <h2>4.1 थोक विक्रेता AI मांग पूर्वानुमान एवं बैंक भुगतान</h2>
    <span class="section-tag">मंडी एवं आय विश्लेषण</span>
  </div>

  <div class="card-grid-2">
    <div class="ui-card highlight">
      <div class="ui-card-title">📈 AI मांग पूर्वानुमान (Demand Intelligence)</div>
      <p style="font-size:12px; margin-bottom:6px;">रूट: <code>/wholesaler/next-day-demand</code> व <code>/wholesaler/past-demand</code></p>
      <ul style="font-size:12px;">
        <li><strong>सटीक मांग अनुमान:</strong> मेलाटो का एल्गोरिदम स्थानीय रिटेलरों की खरीद आदतों, मौसम और त्योहारों का विश्लेषण करके कल की संभावित मांग बताता है।</li>
        <li><strong>रीस्टॉकिंग सुझाव (<code>/wholesaler/restocking-recommendations</code>):</strong> बिना अतिरिक्त माल रोके, अधिकतम लाभ कमाने के लिए आज ही किसानों से कितनी खरीद करनी चाहिए, इसका सुझाव।</li>
      </ul>
    </div>

    <div class="ui-card highlight">
      <div class="ui-card-title">🌍 बाजार अवसर एवं मंडी तुलना (Market Comparison)</div>
      <p style="font-size:12px; margin-bottom:6px;">रूट: <code>/wholesaler/trends/market-comparison</code></p>
      <ul style="font-size:12px;">
        <li><strong>मंडी भाव तुलना:</strong> आज़ादपुर, वाशी, लासलगांव और स्थानीय मंडियों के लाइव भावों की तुलना।</li>
        <li><strong>उच्च-लाभ फसल अलर्ट:</strong> उन फसलों की जानकारी जिनकी मांग अधिक है लेकिन स्थानीय स्तर पर आपूर्ति कम है।</li>
        <li><strong>स्टॉक शेल्फ-लाइफ:</strong> जल्दी खराब होने वाले माल को समय पर विशेष छूट देकर तुरंत बेचने के अलर्ट।</li>
      </ul>
    </div>
  </div>

  <h3>आय, बैंक निपटान एवं भुगतान विवरण</h3>
  <div class="step-card blue">
    <div class="step-header">
      <div class="step-number">₹</div>
      <div class="step-title">कमाई देखना एवं बैंक ट्रांसफर (Earnings)</div>
      <span class="step-route">/wholesaler/earnings</span>
    </div>
    <ul>
      <li><strong>कुल आय डैशबोर्ड:</strong> कुल बिक्री, प्लेटफॉर्म शुल्क कटौती के बाद की शुद्ध आय और बकाया भुगतान देखें।</li>
      <li><strong>T+1 बैंक ट्रांसफर:</strong> डिलीवर हुए सभी ऑर्डरों का भुगतान अगले कार्यदिवस (T+1) सीधे आपके बैंक खाते में जमा हो जाता है।</li>
      <li><strong>चालान व बिल डाउनलोड:</strong> टैक्स व मंडी शुल्क रिपोर्ट एक क्लिक में PDF/Excel में डाउनलोड करें।</li>
    </ul>
  </div>

  <div class="callout tip">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <strong>थोक विक्रेताओं के लिए टिप:</strong> प्रतिदिन शाम 6:00 बजे तक अपना स्टॉक अपडेट रखने से सुबह के खरीदारों को आपकी दुकान सबसे ऊपर दिखाई देती है, जिससे बिक्री 40% तक बढ़ जाती है।
    </div>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 7</span>
  </div>
</div>

<!-- PAGE 8: TRANSPORT & DRIVER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header-band transport">
    <h2>5. परिवहन एवं ड्राइवर पार्टनर गाइड: लॉजिस्टिक्स संचालन</h2>
    <span class="section-tag">परिवहन भूमिका</span>
  </div>

  <p>
    ट्रांसपोर्ट ऑपरेटर, फ्लीट मालिक और कमर्शियल ड्राइवर कृषि माल ढुलाई के ट्रिप प्राप्त करने, कम ईंधन में रूट पूरा करने और गारंटीकृत भुगतान पाने के लिए मेलाटो का उपयोग करते हैं।
  </p>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">1</div>
      <div class="step-title">ड्राइवर ऑनबोर्डिंग एवं वाहन जोड़ना (Registration)</div>
      <span class="step-route">/transport/driver-registration व /transport/manage-vehicles</span>
    </div>
    <ul>
      <li><strong>कमर्शियल ड्राइविंग लाइसेंस (DL)</strong>, वाहन की RC, फिटनेस प्रमाण पत्र और बीमा अपलोड करें।</li>
      <li>वाहन प्रकार चुनें: <em>3-व्हीलर (500 KG), छोटा हाथी/टाटा ऐस (1.5 टन), पिकअप/बोलेरो (2.5 टन) या भारी ट्रक</em>।</li>
      <li>अपनी भाड़ा दरें सेट करें (<code>/transport/transport-update-rates</code>) जैसे आधार किराया, प्रति किमी दर और लोडिंग शुल्क।</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">2</div>
      <div class="step-title">परिवहन अनुरोध स्वीकार करना (Transport Requests)</div>
      <span class="step-route">/transport/transport-requests</span>
    </div>
    <ul>
      <li>उपलब्ध ट्रिप स्क्रीन पर दिखेंगी, जिसमें पिकअप मंडी, ड्रॉप स्थान, वजन (KG) और अनुमानित किराया दिखेगा।</li>
      <li>एकल ड्राइवर <strong>ट्रिप स्वीकार करें (Accept Trip)</strong> पर टैप करें; फ्लीट मालिक अपने ड्राइवरों और वाहनों को ट्रिप सौंप सकते हैं।</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">3</div>
      <div class="step-title">गोदाम से पिकअप, रूट अनुकूलन एवं नेविगेशन</div>
      <span class="step-route">/transport/pickup-orders व /transport/route-optimization</span>
    </div>
    <ul>
      <li>ऐप के जीपीएस नेविगेशन का उपयोग करके थोक विक्रेता के गोदाम पर पहुंचें।</li>
      <li>सामान और क्रेटों की संख्या गिनकर ऐप में <strong>पिकअप पूरा (Picked Up)</strong> मार्क करें।</li>
      <li>एक से अधिक दुकानों की डिलीवरी के लिए <strong>रूट ऑप्टिमाइजेशन</strong> का उपयोग करें जिससे समय और ईंधन बचता है।</li>
      <li>दुकानदार या थोक व्यापारी से संपर्क के लिए इन-ऐप <strong>ग्राहक चैट (Customer Chat)</strong> का उपयोग करें।</li>
    </ul>
  </div>

  <div class="step-card teal">
    <div class="step-header">
      <div class="step-number">4</div>
      <div class="step-title">डिलीवरी पुष्टि (POD) एवं तत्काल किराया भुगतान</div>
      <span class="step-route">/transport/delivery-confirmation/:jobId</span>
    </div>
    <ul>
      <li>खरीदार की दुकान पर पहुंचकर <strong>गंतव्य पर पहुंचे (Arrived)</strong> दबाएं।</li>
      <li>दुकानदार से उसका <strong>4-अंकों का डिलीवरी OTP</strong> पूछकर अपने ऐप में दर्ज करें।</li>
      <li>उतरे हुए सामान की एक स्पष्ट फोटो खींचकर डिजिटल प्रूफ-ऑफ-डिलीवरी (POD) अपलोड करें।</li>
      <li>ट्रिप का किराया तुरंत आपके <strong>कमाई डैशबोर्ड (Earnings Dashboard)</strong> में जुड़ जाएगा।</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 8</span>
  </div>
</div>

<!-- PAGE 9: WAREHOUSE QA & HELP CENTER (HINDI) -->
<div class="page">
  <div class="section-header-band warehouse">
    <h2>6. गोदाम संचालन एवं इन-ऐप सहायता केंद्र (Help Center)</h2>
    <span class="section-tag">गोदाम एवं सहायता</span>
  </div>

  <h3>गोदाम इन्वेंट्री एवं गुणवत्ता नियंत्रण संचालन</h3>
  <div class="card-grid-2">
    <div class="ui-card">
      <div class="ui-card-title">🔬 आवक गुणवत्ता जांच (Grading)</div>
      <p style="font-size:11.5px; margin-bottom:4px;">रूट: <code>/warehouse/receiving-inspection</code></p>
      <ul style="font-size:11.5px;">
        <li>आवक ट्रकों का वजन दर्ज करना और नमी, आकार व खराबी की सैंपलिंग जांच करना।</li>
        <li>गुणवत्ता ग्रेड देना: <strong>ग्रेड A (प्रीमियम रिटेल), ग्रेड B (सामान्य) या ग्रेड C (प्रोसेसिंग)</strong>।</li>
        <li>कोल्ड स्टोरेज में बैच ट्रैकिंग के लिए बारकोड टैग जारी करना।</li>
      </ul>
    </div>

    <div class="ui-card">
      <div class="ui-card-title">📦 भंडारण एवं नुकसान ऑडिट</div>
      <p style="font-size:11.5px; margin-bottom:4px;">रूट: <code>/warehouse/stock-movement-audit</code></p>
      <ul style="font-size:11.5px;">
        <li>गोदाम के विभिन्न चैंबरों और रैक में स्टॉक आवंटन प्रबंधित करना।</li>
        <li>खराब माल को <strong>नुकसान व अपशिष्ट (Wastage & Spoilage)</strong> में फोटो और सुपरवाइजर अनुमति के साथ दर्ज करना।</li>
      </ul>
    </div>
  </div>

  <div class="section-header-band support" style="margin-top:14px;">
    <h2>7. इन-ऐप सहायता केंद्र (Help Center) का उपयोग</h2>
    <span class="section-tag">ग्राहक सहायता</span>
  </div>

  <p>
    मेलाटो ऐप में प्रत्येक भूमिका के लिए समर्पित <strong>सहायता केंद्र (Help Center)</strong> (<code>/shared/help-center</code>) उपलब्ध है जो आपको सीधे स्क्रीन पर गाइड करता है।
  </p>

  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">?</div>
      <div class="step-title">इंटरैक्टिव सहायता केंद्र कैसे काम करता है?</div>
      <span class="step-route">मेनू &gt; सहायता केंद्र (Help Center)</span>
    </div>
    <ul>
      <li><strong>वॉकथ्रू ट्यूटोरियल:</strong> पहली बार ऐप खोलने पर मुख्य बटन समझाने वाला गाइड दिखता है। इसे कभी भी दोबारा देखने के लिए <strong>वॉकथ्रू फिर से देखें (Replay Walkthrough)</strong> दबाएं।</li>
      <li><strong>सीधे स्क्रीन पर जाना (Deep-Links):</strong> किसी भी कार्ड पर टैप करने से (जैसे <em>"स्टॉक कैसे अपडेट करें", "कार्ट कैसे देखें", "डिलीवरी की पुष्टि कैसे करें"</em>) ऐप सीधे उस स्क्रीन पर ले जाता है।</li>
      <li><strong>श्रेणी अनुसार फ़िल्टर:</strong> <em>खरीदारी, ऑर्डर, स्टॉक, जानकारी, डिलीवरी या आय</em> के अनुसार सहायता विषय चुनें।</li>
    </ul>
  </div>

  <div class="step-card rose">
    <div class="step-header">
      <div class="step-number">📞</div>
      <div class="step-title">सपोर्ट सेंटर एवं आपातकालीन सहायता (Support Center)</div>
      <span class="step-route">/shared/support-center</span>
    </div>
    <ul>
      <li><strong>श्रेणीबद्ध शिकायतें:</strong> भुगतान, पिकअप, खराब सामान या वाहन खराबी की शिकायत सीधे संबंधित टीम को भेजें।</li>
      <li><strong>आपातकालीन हेल्पलाइन:</strong> रास्ते में वाहन खराब होने या भुगतान संबंधी तत्काल सहायता के लिए सीधे <strong>कॉल करें (Call Support)</strong> पर टैप करें।</li>
    </ul>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली</span>
    <span>पृष्ठ 9</span>
  </div>
</div>

<!-- PAGE 10: QUICK REFERENCE SUMMARY & BEST PRACTICES (HINDI) -->
<div class="page">
  <div class="section-header-band">
    <h2>8. त्वरित संदर्भ सूची एवं सर्वोत्तम कार्यप्रणाली</h2>
    <span class="section-tag">त्वरित सारांश</span>
  </div>

  <table class="custom-table">
    <thead>
      <tr>
        <th>भूमिका</th>
        <th>दैनिक मुख्य कार्य</th>
        <th>अधिकतम लाभ हेतु सर्वोत्तम सुझाव</th>
        <th>सामान्य गलतियाँ जिनसे बचें</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>थोक विक्रेता</strong></td>
        <td>प्रतिदिन शाम 6:00 बजे तक स्टॉक अपडेट करना</td>
        <td>मूल्य बढ़ने से पहले AI मांग पूर्वानुमान देखकर माल मंगवाना</td>
        <td>स्टॉक अपडेट न रखना, जिससे ऑर्डर रद्द हो सकते हैं</td>
      </tr>
      <tr>
        <td><strong>खरीदार (रिटेलर)</strong></td>
        <td>सुबह 5:00 बजे डिलीवरी हेतु रात 9:00 बजे तक ऑर्डर देना</td>
        <td>माल प्राप्त होते ही जांचना व खराबी की फोटो 12 घंटे में डालना</td>
        <td>सामान गिने/जांचे बिना डिलीवरी OTP साझा करना</td>
      </tr>
      <tr>
        <td><strong>परिवहन ड्राइवर</strong></td>
        <td>सुबह की मंडी पिकअप ट्रिप स्वीकार करना</td>
        <td>एक ही फेरे में कई डिलीवरी हेतु रूट ऑप्टिमाइज़र का उपयोग</td>
        <td>डिलीवरी पते पर सामान की फोटो (POD) लेना भूलना</td>
      </tr>
      <tr>
        <td><strong>गोदाम स्टाफ</strong></td>
        <td>आवक माल की ग्रेडिंग व वजन दर्ज करना</td>
        <td>FIFO (पहले आया माल पहले निकालें) का कड़ाई से पालन</td>
        <td>खराब माल का रिकॉर्ड देर से दर्ज करना</td>
      </tr>
    </tbody>
  </table>

  <h3>अक्सर पूछे जाने वाले प्रश्न (FAQ)</h3>
  <div class="card-grid-2">
    <div class="ui-card">
      <strong>प्र: बैंक खाते में भुगतान आने में कितना समय लगता है?</strong>
      <p style="font-size:11.5px; margin-top:2px;">उत्तर: पूरी हुई सभी डिलीवरी और ट्रिप्स का भुगतान T+1 कार्यदिवस में सीधे पंजीकृत बैंक खाते में आ जाता है।</p>
    </div>
    <div class="ui-card">
      <strong>प्र: यदि डिलीवरी ड्राइवर देर से आए तो क्या करें?</strong>
      <p style="font-size:11.5px; margin-top:2px;">उत्तर: ऑर्डर विवरण में लाइव जीपीएस देखें या ड्राइवर से चैट करें। अधिक देरी होने पर सपोर्ट हेल्पलाइन पर कॉल करें।</p>
    </div>
    <div class="ui-card">
      <strong>प्र: पंजीकृत बैंक खाता या फोन नंबर कैसे बदलें?</strong>
      <p style="font-size:11.5px; margin-top:2px;">उत्तर: सेटिंग्स &gt; प्रोफ़ाइल &gt; व्यवसाय विवरण में जाकर दस्तावेज अपलोड कर बदलाव का अनुरोध सबमिट करें।</p>
    </div>
    <div class="ui-card">
      <strong>प्र: यदि कोई सामान आउट-ऑफ-स्टॉक हो जाए तो?</strong>
      <p style="font-size:11.5px; margin-top:2px;">उत्तर: खरीदार को तुरंत सूचना मिलती है जिससे वह वैकल्पिक विक्रेता चुन सकता है या तुरंत रिफंड पा सकता है।</p>
    </div>
  </div>

  <div class="callout tip" style="margin-top:14px;">
    <div class="callout-icon">⭐</div>
    <div class="callout-content">
      <strong>अतिरिक्त सहायता चाहिए?</strong><br>
      ऐप में <code>सेटिंग्स &gt; सहायता केंद्र</code> पर जाएं या मेलाटो राष्ट्रीय सहायता डेस्क से <strong>support@melato.in</strong> / <strong>1800-MELATO-AGRI</strong> पर संपर्क करें।
    </div>
  </div>

  <div class="footer-nav">
    <span>मेलाटो मानक संचालन नियमावली • मार्गदर्शिका समाप्त</span>
    <span>पृष्ठ 10</span>
  </div>
</div>

</body>
</html>
"""
    return html

if __name__ == "__main__":
    content = build_hindi_html()
    with open("Melato_User_Guide_Hindi.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("Melato_User_Guide_Hindi.html created successfully.")
''')
