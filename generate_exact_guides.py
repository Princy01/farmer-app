"""
Generate Clean, Exact, Concise User Guides (English & Hindi) for Melato.
Updates:
- Theme color updated to Melato purple gradient (#667eea to #764ba2)
- Replaced "Melato App" with just "Melato"
- All dashes are standard small hyphens (-)
- All URLs removed
"""
import os
import subprocess
import sys

BASE_DIR = r"c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');

@page {
    size: A4 portrait;
    margin: 12mm 12mm 12mm 12mm;
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
    line-height: 1.45;
    font-size: 13px;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}

.page {
    page-break-after: always;
    break-after: page;
    position: relative;
    padding-bottom: 10px;
}

.page:last-child {
    page-break-after: auto;
    break-after: auto;
}

/* Purple Header & Banner */
.doc-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    padding: 18px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.doc-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.25);
    padding-bottom: 6px;
    margin-bottom: 8px;
}

.doc-title-main {
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.3px;
}

.doc-desc {
    font-size: 13px;
    color: #f1f3fd;
    line-height: 1.4;
}

/* Section Header */
.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border-left: 4px solid #764ba2;
    padding: 7px 12px;
    border-radius: 0 6px 6px 0;
    margin-top: 14px;
    margin-bottom: 10px;
}

.section-header.retailer { border-left-color: #d97706; }
.section-header.wholesaler { border-left-color: #667eea; }
.section-header.driver { border-left-color: #0d9488; }
.section-header.help { border-left-color: #e11d48; }

.section-header h2 {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
}

.section-badge {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    background: #e2e8f0;
    color: #334155;
    padding: 2px 7px;
    border-radius: 4px;
}

/* Feature Block */
.feature-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 9px 12px;
    margin-bottom: 9px;
    page-break-inside: avoid;
    break-inside: avoid;
}

.feature-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
}

.feature-name {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
}

.feature-box ul, .feature-box ol {
    margin-left: 18px;
    color: #334155;
    font-size: 12.5px;
}

.feature-box li {
    margin-bottom: 3px;
}

.feature-box p {
    font-size: 12.5px;
    color: #334155;
    margin-bottom: 4px;
}

/* Grid layout */
.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 9px;
}

.grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 9px;
}

.role-pill-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
}

.role-pill-card h3 {
    font-size: 13px;
    color: #0f172a;
    margin-bottom: 3px;
}

.role-pill-card p {
    font-size: 11.5px;
    color: #64748b;
    margin: 0;
}

/* Tables */
.guide-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 10px 0;
    font-size: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
}

.guide-table th, .guide-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 9px;
    text-align: left;
}

.guide-table th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
}

.guide-table tr:nth-child(even) {
    background: #f8fafc;
}

/* Note box */
.note-box {
    background: #fbf9ff;
    border-left: 3.5px solid #764ba2;
    padding: 7px 10px;
    border-radius: 0 4px 4px 0;
    font-size: 12px;
    color: #4c2d77;
    margin: 8px 0;
    page-break-inside: avoid;
    break-inside: avoid;
}

.footer {
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 12px;
}
"""

def generate_english_html():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Melato - How to Use Guide</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- PAGE 1: GETTING STARTED & ACCOUNT SETUP -->
<div class="page">
  <div class="doc-header">
    <div class="doc-header-top">
      <div class="doc-title-main">Melato - How to Use Guide</div>
    </div>
    <div class="doc-desc">
      A simple, step-by-step guide explaining the features available in Melato for <strong>Wholesalers</strong>, <strong>Retailers</strong>, and <strong>Drivers</strong>, and how to access and use them.
    </div>
  </div>

  <div class="grid-3">
    <div class="role-pill-card">
      <h3>🛒 Retailer (Buyer)</h3>
      <p>Browse fresh produce, place bulk orders, track order history & manage spends.</p>
    </div>
    <div class="role-pill-card">
      <h3>🏢 Wholesaler</h3>
      <p>Manage stock, process incoming retailer orders, view demand & track earnings.</p>
    </div>
    <div class="role-pill-card">
      <h3>🚚 Driver</h3>
      <p>Accept delivery requests, manage pickups, confirm deliveries & check trip earnings.</p>
    </div>
  </div>

  <div class="section-header">
    <h2>1. Getting Started & Account Setup (All Users)</h2>
    <span class="section-badge">Setup</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🔑 Login & Sign Up</span>
    </div>
    <ul>
      <li>Open the app and select your role: <strong>Wholesaler</strong>, <strong>Retailer</strong>, or <strong>Driver</strong>.</li>
      <li>Enter your registered <strong>Mobile Number</strong> or Email Address.</li>
      <li>Enter the <strong>OTP</strong> received on your phone/email to log in securely.</li>
      <li>New users can switch to the "Register" tab to create an account.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📋 Business Registration & KYC Info</span>
    </div>
    <ul>
      <li><strong>Business Details:</strong> Enter Business Name, Owner Name, Business Category, Business Type, and Established Year.</li>
      <li><strong>Legal & Tax Details:</strong> Enter Mobile Number, Email, GST Number, PAN Number, Aadhaar Number, and Government License Number.</li>
      <li><strong>Update Business Info:</strong> Update contact info, business status (Active/Inactive), and address anytime under Business Info.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📍 Business Locations</span>
    </div>
    <ul>
      <li>View all registered shop or warehouse locations.</li>
      <li>Tap <strong>Add New Location</strong> to add branch addresses (City, State, Full Address, Contact, Email, GST, PAN).</li>
      <li>Retailers can select which location orders should be delivered to, and Wholesalers can manage where stock is stored.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚙️ Settings & Language Selection</span>
    </div>
    <ul>
      <li><strong>Language:</strong> Switch between <strong>English</strong> and <strong>Hindi (हिन्दी)</strong> anytime.</li>
      <li><strong>Profile & Security:</strong> Manage profile information and log out securely.</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato User Guide</span>
    <span>Page 1</span>
  </div>
</div>

<!-- PAGE 2: RETAILER (BUYER) GUIDE -->
<div class="page">
  <div class="section-header retailer">
    <h2>2. Retailer (Buyer) Guide</h2>
    <span class="section-badge">Retailer</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🔍 Home Dashboard & Product Search</span>
    </div>
    <ul>
      <li><strong>Browse Categories:</strong> View products grouped by categories (Vegetables, Fruits, etc.).</li>
      <li><strong>Search Items:</strong> Use the search bar to find items quickly by name.</li>
      <li><strong>Product Details:</strong> View unit pricing, available stock quantity, and minimum order requirements.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🛒 Cart & Units Management</span>
    </div>
    <ul>
      <li>Add items to cart and adjust required quantities.</li>
      <li>Supports standard agri units (<strong>KG, Quintal, Ton, gm</strong>).</li>
      <li>Review subtotal, taxes, delivery charges, and total order cost.</li>
      <li>Select the delivery <strong>Business Location</strong> where goods should be sent.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">💳 Checkout & Payment</span>
    </div>
    <ul>
      <li>Review your order summary and delivery address.</li>
      <li>Choose your preferred payment method (Online Payment / UPI / Cards / Cash or Credit terms as available).</li>
      <li>Tap <strong>Place Order</strong> to receive an instant order confirmation screen with Order ID.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 Retailer Order History & Order Details</span>
    </div>
    <ul>
      <li><strong>Track Active Orders:</strong> View the current status of placed orders (Pending, Confirmed, Ready, In Transit, Delivered, Cancelled).</li>
      <li><strong>Order Details:</strong> Open any order to view full line-item details, pricing breakdown, supplier info, and order date/time.</li>
      <li><strong>Past Orders:</strong> Access complete history of previous purchases.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📊 Spends & Retailer Trends</span>
    </div>
    <ul>
      <li><strong>Spends:</strong> View total expenditure summary over time to track your procurement budget.</li>
      <li><strong>Retailer Trends:</strong> Check price and purchase trends to make smarter buying decisions.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚠️ Report an Issue / Disputes</span>
    </div>
    <ul>
      <li>If there is an issue with your order (damaged goods, wrong item, quantity shortage, or delivery issue), tap <strong>Report Issue</strong> on the order.</li>
      <li>Select the issue category, describe the problem, and submit the ticket.</li>
      <li>Track the status and resolution of your ticket in <strong>My Issues</strong>.</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato User Guide</span>
    <span>Page 2</span>
  </div>
</div>

<!-- PAGE 3: WHOLESALER GUIDE -->
<div class="page">
  <div class="section-header wholesaler">
    <h2>3. Wholesaler Guide</h2>
    <span class="section-badge">Wholesaler</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🏠 Wholesaler Home Dashboard</span>
    </div>
    <ul>
      <li><strong>Quick Stats:</strong> View Today's Earnings, This Week's Revenue, Pending Payouts, Total Stock, and Active Orders.</li>
      <li><strong>Stock Deduction on Order:</strong> When a buyer places an order, the stock automatically gets deducted from your total available stock in real time.</li>
      <li><strong>Recently in Demand:</strong> View trending products frequently ordered by retailers.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 Stock Dashboard & Add / Update Stock</span>
    </div>
    <ul>
      <li><strong>Stock Dashboard:</strong> View all products in your inventory with current quantities (In Stock, Needs Attention, Out of Stock).</li>
      <li><strong>Add Stock:</strong> Add new commodities, set product name, category, unit (KG, gm, Quintal, Ton), price per unit, and available quantity.</li>
      <li><strong>Update Stock:</strong> Quickly adjust available quantities or prices as stock changes.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📑 Orders Received & Order Details</span>
    </div>
    <ul>
      <li><strong>Orders Received:</strong> View list of orders placed by retailers, review ordered items, quantities, buyer details, and accept/prepare orders for dispatch.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🚚 Pickup Orders</span>
    </div>
    <ul>
      <li>View orders that are packed and ready for driver collection.</li>
      <li>Coordinate hand-off with the driver when they arrive for pickup.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📈 Demand Insights, Trends & Earnings</span>
    </div>
    <ul>
      <li><strong>Next-Day Demand & Past Demand:</strong> View predicted demand for tomorrow to prepare stock in advance.</li>
      <li><strong>Restocking Recommendations:</strong> Check recommendations on which items need restocking.</li>
      <li><strong>Trends & Market Opportunities:</strong> View sales trends, demand trends, stock insights, and market price comparisons.</li>
      <li><strong>Earnings Dashboard:</strong> Monitor gross earnings, completed payouts, and pending balances.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚠️ Wholesaler Disputes & Issues</span>
    </div>
    <ul>
      <li>Report any order or pickup problem directly from the order screen.</li>
      <li>Track investigation status and resolution history under <strong>My Issues</strong>.</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato User Guide</span>
    <span>Page 3</span>
  </div>
</div>

<!-- PAGE 4: DRIVER GUIDE -->
<div class="page">
  <div class="section-header driver">
    <h2>4. Driver Guide</h2>
    <span class="section-badge">Driver</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📝 Driver & Vehicle Registration</span>
    </div>
    <ul>
      <li>Enter Driver Basic Information (Name, Mobile Number, Experience).</li>
      <li>Upload required documents (Driving License, ID Proof).</li>
      <li>Enter Vehicle Details (Vehicle Type, Registration Number, Capacity).</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📊 Driver Dashboard & Transport Requests</span>
    </div>
    <ul>
      <li><strong>Dashboard:</strong> View active delivery tasks, completed trips, and today's summary.</li>
      <li><strong>Transport Requests:</strong> View incoming delivery job requests with pickup location, drop location, load details, and estimated fare.</li>
      <li><strong>Accept Requests:</strong> Drivers can directly accept available delivery requests to take up the job.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 Pickup Orders</span>
    </div>
    <ul>
      <li>View the list of accepted orders waiting for pickup at wholesaler locations.</li>
      <li>Navigate to the wholesaler address, verify package count, and confirm pickup in the app.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">✅ Delivery Confirmation</span>
    </div>
    <ul>
      <li>Navigate to the retailer's delivery location with the shipment.</li>
      <li>Confirm order hand-off and complete delivery in the app.</li>
      <li>The delivery status is updated to completed immediately for all parties.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">💰 Earnings Dashboard & Delivery History</span>
    </div>
    <ul>
      <li><strong>Earnings Dashboard:</strong> Track earnings for all completed trips and view payout summaries.</li>
      <li><strong>Delivery History:</strong> View log of all past completed deliveries with date, route, and fare.</li>
      <li><strong>Disputes:</strong> Report any trip or pickup problems under Report Issue and track them in <strong>My Issues</strong>.</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato User Guide</span>
    <span>Page 4</span>
  </div>
</div>

<!-- PAGE 5: HELP CENTER & SUPPORT CENTER -->
<div class="page">
  <div class="section-header help">
    <h2>5. In-App Help Center & Support Center</h2>
    <span class="section-badge">Help & Support</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📖 Interactive Help Center</span>
    </div>
    <p>The Help Center is built into the app for every role (Wholesaler, Retailer, Driver) under Settings to provide instant step-by-step guidance:</p>
    <ul>
      <li><strong>Visual Walkthrough:</strong> Shows an introductory step-by-step tutorial explaining core app tasks. Tap <strong>Replay Walkthrough</strong> to view it again anytime.</li>
      <li><strong>Category Filters:</strong> Filter guides by category:
        <ul>
          <li><strong>Retailer:</strong> Shopping, Orders, Support, Account</li>
          <li><strong>Wholesaler:</strong> Stock, Orders, Insights, Support</li>
          <li><strong>Driver:</strong> Getting Started, Deliveries, Earnings, Support</li>
        </ul>
      </li>
      <li><strong>Direct Screen Navigation:</strong> Tapping any Help Card (e.g. <em>"Browse and search", "Manage your cart", "Update stock", "Review transport requests", "Confirm delivery"</em>) directly opens that screen in the app so you can perform the task immediately.</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📞 Support Center</span>
    </div>
    <p>When you need assistance from the support team, open the Support Center under Settings:</p>
    <ul>
      <li><strong>Choose Issue Category:</strong> Select from categories such as <em>Payment Issues, Order Issues, Incoming Order Issues, Delivery Issues, Dispatch & Pickup, Trip & Assignment, Goods / Product Issues, Seller Issues, Account Issues, Technical Issues, or Safety</em>.</li>
      <li><strong>Select Specific Problem & Contact Directly:</strong> Choose the specific problem description from the list, add any optional details, and contact the support team directly for assistance and quick resolution.</li>
    </ul>
  </div>

  <div class="section-header">
    <h2>Quick Reference Summary</h2>
    <span class="section-badge">Summary</span>
  </div>

  <table class="guide-table">
    <thead>
      <tr>
        <th>Role</th>
        <th>Main Daily Features</th>
        <th>How to Access</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Retailer</strong></td>
        <td>Browse products, Add to Cart, Checkout, Order Tracking, Spends & Issues</td>
        <td>Home Screen &gt; Cart &gt; Order History &gt; Menu</td>
      </tr>
      <tr>
        <td><strong>Wholesaler</strong></td>
        <td>Stock Dashboard, Add/Update Stock, Orders Received, Pickup Orders, Demand & Earnings</td>
        <td>Home Dashboard &gt; Stock &gt; Orders &gt; Menu</td>
      </tr>
      <tr>
        <td><strong>Driver</strong></td>
        <td>Transport Requests (Accept Jobs), Pickup Orders, Delivery Confirmation, Earnings Dashboard</td>
        <td>Transport Dashboard &gt; Requests &gt; Menu</td>
      </tr>
      <tr>
        <td><strong>All Users</strong></td>
        <td>Business Locations, Help Center walkthroughs, Support Center, Language toggle</td>
        <td>Settings &gt; Help Center / Support Center / Language</td>
      </tr>
    </tbody>
  </table>

  <div class="note-box">
    <strong>Need Help inside the app?</strong> Go to <strong>Settings &gt; Help Center</strong> to see interactive guides for any screen, or tap <strong>Support Center</strong> to contact support anytime.
  </div>

  <div class="footer">
    <span>Melato User Guide - End of Guide</span>
    <span>Page 5</span>
  </div>
</div>

</body>
</html>
"""

def generate_hindi_html():
    return f"""<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<title>Melato - उपयोग गाइड</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- PAGE 1: GETTING STARTED & ACCOUNT SETUP (HINDI) -->
<div class="page">
  <div class="doc-header">
    <div class="doc-header-top">
      <div class="doc-title-main">Melato (मेलाटो) - उपयोग गाइड</div>
    </div>
    <div class="doc-desc">
      <strong>थोक विक्रेता (Wholesaler)</strong>, <strong>खुदरा विक्रेता (Retailer)</strong> और <strong>ड्राइवर (Driver)</strong> के लिए मेलाटो की सभी सुविधाओं और उनके उपयोग की सरल, चरण-दर-चरण गाइड।
    </div>
  </div>

  <div class="grid-3">
    <div class="role-pill-card">
      <h3>🛒 रिटेलर (खरीदार)</h3>
      <p>ताजा उपज देखें, ऑर्डर दें, ऑर्डर स्थिति ट्रैक करें और खर्च देखें।</p>
    </div>
    <div class="role-pill-card">
      <h3>🏢 थोक विक्रेता</h3>
      <p>स्टॉक प्रबंधित करें, प्राप्त ऑर्डर प्रोसेस करें, मांग व आय देखें।</p>
    </div>
    <div class="role-pill-card">
      <h3>🚚 ड्राइवर</h3>
      <p>डिलीवरी अनुरोध स्वीकार करें, पिकअप संभालें व डिलीवरी पूरी करें।</p>
    </div>
  </div>

  <div class="section-header">
    <h2>1. शुरुआत एवं खाता सेटअप (सभी उपयोगकर्ताओं के लिए)</h2>
    <span class="section-badge">सेटअप</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🔑 लॉगिन एवं साइन अप (Login & Sign Up)</span>
    </div>
    <ul>
      <li>ऐप खोलें और अपनी भूमिका चुनें: <strong>थोक विक्रेता (Wholesaler)</strong>, <strong>रिटेलर (Retailer)</strong> या <strong>ड्राइवर (Driver)</strong>।</li>
      <li>अपना पंजीकृत <strong>मोबाइल नंबर</strong> या ईमेल दर्ज करें।</li>
      <li>मोबाइल/ईमेल पर प्राप्त <strong>OTP</strong> दर्ज करके सुरक्षित रूप से लॉगिन करें।</li>
      <li>नए उपयोगकर्ता "पंजीकरण (Register)" विकल्प से नया खाता बना सकते हैं।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📋 व्यवसाय पंजीकरण एवं KYC विवरण</span>
    </div>
    <ul>
      <li><strong>व्यावसायिक जानकारी:</strong> व्यवसाय का नाम, मालिक का नाम, श्रेणी, व्यवसाय प्रकार और स्थापना वर्ष दर्ज करें।</li>
      <li><strong>कानूनी एवं टैक्स विवरण:</strong> मोबाइल नंबर, ईमेल, GST नंबर, PAN नंबर, आधार नंबर और सरकारी लाइसेंस नंबर दर्ज करें।</li>
      <li><strong>व्यवसाय जानकारी अपडेट:</strong> संपर्क विवरण, पता और व्यवसाय की स्थिति (सक्रिय/निष्क्रिय) को कभी भी अपडेट कर सकते हैं।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📍 व्यावसायिक स्थान (Business Locations)</span>
    </div>
    <ul>
      <li>अपनी पंजीकृत दुकानों या गोदामों की सूची देखें।</li>
      <li><strong>नया स्थान जोड़ें (Add Location)</strong> दबाकर शाखा का पता (शहर, राज्य, पूरा पता, GST, PAN, संपर्क) जोड़ें।</li>
      <li>रिटेलर चुन सकते हैं कि सामान किस दुकान पर चाहिए, और थोक विक्रेता अपने स्टॉक के स्थान प्रबंधित कर सकते हैं।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚙️ सेटिंग्स एवं भाषा चयन</span>
    </div>
    <ul>
      <li><strong>भाषा:</strong> ऐप में कभी भी <strong>हिन्दी (Hindi)</strong> या <strong>English</strong> भाषा चुनें।</li>
      <li><strong>प्रोफ़ाइल एवं सुरक्षा:</strong> अपनी प्रोफ़ाइल देखें और सुरक्षित रूप से लॉगआउट करें।</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato उपयोग गाइड</span>
    <span>पृष्ठ 1</span>
  </div>
</div>

<!-- PAGE 2: RETAILER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header retailer">
    <h2>2. रिटेलर (खरीदार) गाइड</h2>
    <span class="section-badge">रिटेलर</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🔍 होम डैशबोर्ड एवं उत्पाद खोज</span>
    </div>
    <ul>
      <li><strong>श्रेणियां देखें:</strong> सब्जियों और फलों की विभिन्न श्रेणियों के अनुसार उत्पाद देखें।</li>
      <li><strong>उत्पाद खोजें:</strong> नाम लिखकर तुरंत सामान खोजने के लिए सर्च बार का उपयोग करें।</li>
      <li><strong>उत्पाद विवरण:</strong> प्रति इकाई मूल्य, उपलब्ध स्टॉक मात्रा और न्यूनतम ऑर्डर मात्रा देखें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🛒 कार्ट एवं मात्रा प्रबंधन</span>
    </div>
    <ul>
      <li>आइटम कार्ट में जोड़ें और जरूरत के अनुसार मात्रा बढ़ाएं या घटाएं।</li>
      <li>कृषि इकाइयां उपलब्ध: <strong>किलोग्राम (KG), क्विंटल, टन, ग्राम</strong>।</li>
      <li>कुल राशि, टैक्स, डिलीवरी शुल्क और कुल बिल की समीक्षा करें।</li>
      <li>ड्रॉप-डाउन से वह <strong>व्यावसायिक स्थान</strong> चुनें जहां डिलीवरी प्राप्त करनी है।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">💳 चेकआउट एवं भुगतान</span>
    </div>
    <ul>
      <li>ऑर्डर सारांश और डिलीवरी पते की जांच करें।</li>
      <li>भुगतान विकल्प चुनें (ऑनलाइन भुगतान / UPI / कार्ड / उपलब्ध शर्तों के अनुसार डिलीवरी पर भुगतान)।</li>
      <li><strong>ऑर्डर दें (Place Order)</strong> पर टैप करें; ऑर्डर आईडी के साथ ऑर्डर पुष्टि स्क्रीन दिखाई देगी।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 ऑर्डर इतिहास एवं विवरण</span>
    </div>
    <ul>
      <li><strong>सक्रिय ऑर्डर स्थिति:</strong> वर्तमान ऑर्डर की स्थिति देखें (लंबित, पुष्ट, तैयार, रास्ते में, डिलीवर, रद्द)।</li>
      <li><strong>ऑर्डर विवरण:</strong> उत्पाद सूची, मूल्य, विक्रेता जानकारी और ऑर्डर का समय देखने के लिए किसी भी ऑर्डर को खोलें।</li>
      <li><strong>पुराने ऑर्डर:</strong> अपनी पिछली सभी खरीदारियों का पूरा इतिहास देखें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📊 खर्च एवं खरीद रुझान</span>
    </div>
    <ul>
      <li><strong>खर्च (Spends):</strong> अपने कुल खर्च का सारांश देखें ताकि बजट का सही प्रबंधन हो सके।</li>
      <li><strong>रुझान (Trends):</strong> बेहतर खरीद निर्णय लेने के लिए बाजार मूल्य और खरीद रुझान देखें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚠️ समस्या रिपोर्ट करना एवं विवाद</span>
    </div>
    <ul>
      <li>यदि ऑर्डर में कोई समस्या है (खराब माल, गलत आइटम, मात्रा में कमी या डिलीवरी समस्या), तो ऑर्डर पर <strong>समस्या बताएं (Report Issue)</strong> दबाएं।</li>
      <li>समस्या का कारण चुनें, विवरण लिखें और सबमिट करें।</li>
      <li>अपनी दर्ज शिकायत की स्थिति <strong>मेरी समस्याएं (My Issues)</strong> में ट्रैक करें।</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato उपयोग गाइड</span>
    <span>पृष्ठ 2</span>
  </div>
</div>

<!-- PAGE 3: WHOLESALER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header wholesaler">
    <h2>3. थोक विक्रेता गाइड</h2>
    <span class="section-badge">थोक विक्रेता</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🏠 थोक विक्रेता होम डैशबोर्ड</span>
    </div>
    <ul>
      <li><strong>त्वरित आंकड़े:</strong> आज की आय, इस सप्ताह की बिक्री, लंबित भुगतान, कुल स्टॉक और सक्रिय ऑर्डर देखें।</li>
      <li><strong>ऑर्डर पर स्टॉक कटौती:</strong> जब कोई खरीदार ऑर्डर देता है, तो आपके उपलब्ध स्टॉक में से उतनी मात्रा तुरंत अपने आप कम हो जाती है।</li>
      <li><strong>हालिया मांग (Recently in Demand):</strong> रिटेलरों द्वारा बार-बार मांगे जा रहे उत्पादों की सूची।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 स्टॉक डैशबोर्ड एवं स्टॉक जोड़ना / अपडेट करना</span>
    </div>
    <ul>
      <li><strong>स्टॉक डैशबोर्ड:</strong> इन्वेंट्री में उपलब्ध सभी उत्पाद और उनकी स्थिति देखें (स्टॉक में, ध्यान देने योग्य, समाप्त)।</li>
      <li><strong>स्टॉक जोड़ें (Add Stock):</strong> नए उत्पाद जोड़ें, नाम, श्रेणी, इकाई (KG, ग्राम, क्विंटल, टन), दर और मात्रा दर्ज करें।</li>
      <li><strong>स्टॉक अपडेट करें (Update Stock):</strong> माल बिकने पर बची हुई मात्रा या भाव तुरंत बदलें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📑 प्राप्त ऑर्डर एवं विवरण</span>
    </div>
    <ul>
      <li><strong>प्राप्त ऑर्डर:</strong> रिटेलरों द्वारा दिए गए नए ऑर्डरों को देखें, उत्पाद, मात्रा व खरीदार विवरण की समीक्षा करें और माल पैक करके तैयार करें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">🚚 पिकअप ऑर्डर (Pickup Orders)</span>
    </div>
    <ul>
      <li>ड्राइवर पिकअप के लिए तैयार ऑर्डरों की सूची देखें।</li>
      <li>जब ड्राइवर आपकी दुकान पर पहुंचे, तो माल सौंपकर पिकअप की पुष्टि करें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📈 मांग जानकारी, रुझान एवं आय</span>
    </div>
    <ul>
      <li><strong>कल की मांग एवं पिछली मांग:</strong> पहले से तैयारी के लिए कल की अनुमानित मांग देखें।</li>
      <li><strong>रीस्टॉक सुझाव (Restocking):</strong> कौन सा सामान दोबारा मंगाने की जरूरत है, उसके सुझाव देखें।</li>
      <li><strong>रुझान एवं बाजार अवसर:</strong> बिक्री रुझान, मांग रुझान, स्टॉक जानकारी और बाजार मूल्य तुलना देखें।</li>
      <li><strong>कमाई डैशबोर्ड (Earnings):</strong> कुल आय, पूरे हुए भुगतान और बकाया राशि देखें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">⚠️ थोक विक्रेता विवाद एवं समस्याएं</span>
    </div>
    <ul>
      <li>ऑर्डर या पिकअप संबंधी कोई भी समस्या सीधे दर्ज करें।</li>
      <li><strong>मेरी समस्याएं (My Issues)</strong> में समाधान की प्रगति देखें।</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato उपयोग गाइड</span>
    <span>पृष्ठ 3</span>
  </div>
</div>

<!-- PAGE 4: DRIVER GUIDE (HINDI) -->
<div class="page">
  <div class="section-header driver">
    <h2>4. ड्राइवर गाइड</h2>
    <span class="section-badge">ड्राइवर</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📝 ड्राइवर एवं वाहन पंजीकरण</span>
    </div>
    <ul>
      <li>ड्राइवर की बुनियादी जानकारी दर्ज करें (नाम, मोबाइल नंबर, अनुभव)।</li>
      <li>आवश्यक दस्तावेज अपलोड करें (ड्राइविंग लाइसेंस, पहचान पत्र)।</li>
      <li>वाहन विवरण दर्ज करें (वाहन प्रकार, रजिस्ट्रेशन नंबर, क्षमता)।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📊 ड्राइवर डैशबोर्ड एवं परिवहन अनुरोध</span>
    </div>
    <ul>
      <li><strong>डैशबोर्ड:</strong> सक्रिय डिलीवरी कार्य, पूरे हुए ट्रिप और आज का सारांश देखें।</li>
      <li><strong>परिवहन अनुरोध:</strong> पिकअप स्थान, ड्रॉप स्थान, वजन और अनुमानित किराये के साथ आने वाले काम देखें।</li>
      <li><strong>अनुरोध स्वीकार करें (Accept Requests):</strong> ड्राइवर उपलब्ध डिलीवरी अनुरोधों को सीधे स्वीकार कर सकते हैं।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📦 पिकअप ऑर्डर (Pickup Orders)</span>
    </div>
    <ul>
      <li>थोक विक्रेता के पास पिकअप के लिए तैयार ऑर्डरों की सूची देखें।</li>
      <li>थोक विक्रेता के पते पर पहुंचें, माल की गिनती जांचें और ऐप में पिकअप कन्फर्म करें।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">✅ डिलीवरी पुष्टि (Delivery Confirmation)</span>
    </div>
    <ul>
      <li>माल लेकर खुदरा खरीदार (रिटेलर) के पते पर पहुंचें।</li>
      <li>खरीदार को माल सौंपें और ऐप में डिलीवरी की पुष्टि दर्ज करें।</li>
      <li>डिलीवरी पूरी होते ही सभी पक्षों को ऐप में डिलीवरी की स्थिति अपडेट दिखती है।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">💰 कमाई डैशबोर्ड एवं डिलीवरी इतिहास</span>
    </div>
    <ul>
      <li><strong>कमाई डैशबोर्ड (Earnings):</strong> पूरी हुई ट्रिप्स की कमाई और भुगतान रिपोर्ट देखें।</li>
      <li><strong>डिलीवरी इतिहास (History):</strong> पिछली सभी पूरी हुई डिलीवरी की सूची मार्ग व किराये के साथ देखें।</li>
      <li><strong>विवाद:</strong> ट्रिप में किसी भी समस्या के लिए <strong>मेरी समस्याएं (My Issues)</strong> में रिपोर्ट करें।</li>
    </ul>
  </div>

  <div class="footer">
    <span>Melato उपयोग गाइड</span>
    <span>पृष्ठ 4</span>
  </div>
</div>

<!-- PAGE 5: HELP CENTER & SUPPORT CENTER (HINDI) -->
<div class="page">
  <div class="section-header help">
    <h2>5. इन-ऐप सहायता केंद्र (Help Center) एवं सपोर्ट</h2>
    <span class="section-badge">सहायता एवं सपोर्ट</span>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📖 इंटरैक्टिव सहायता केंद्र (Help Center)</span>
    </div>
    <p>ऐप में हर भूमिका (थोक विक्रेता, रिटेलर, ड्राइवर) के लिए सेटिंग्स में सहायता केंद्र उपलब्ध है:</p>
    <ul>
      <li><strong>वॉकथ्रू ट्यूटोरियल:</strong> ऐप के मुख्य कार्यों का चरण-दर-चरण गाइड। इसे कभी भी दोबारा देखने के लिए <strong>वॉकथ्रू फिर से देखें (Replay Walkthrough)</strong> दबाएं।</li>
      <li><strong>श्रेणी अनुसार फ़िल्टर:</strong>
        <ul>
          <li><strong>रिटेलर:</strong> खरीदारी, ऑर्डर, सहायता, खाता</li>
          <li><strong>थोक विक्रेता:</strong> स्टॉक, ऑर्डर, जानकारी, सहायता</li>
          <li><strong>ड्राइवर:</strong> शुरुआत, डिलीवरी, आय, सहायता</li>
        </ul>
      </li>
      <li><strong>सीधे स्क्रीन खोलना:</strong> किसी भी हेल्प कार्ड पर टैप करने से (जैसे <em>"उत्पाद खोजें", "कार्ट प्रबंधित करें", "स्टॉक अपडेट करें", "अनुरोध देखें", "डिलीवरी पुष्टि"</em>) ऐप तुरंत वही स्क्रीन खोल देता है।</li>
    </ul>
  </div>

  <div class="feature-box">
    <div class="feature-header">
      <span class="feature-name">📞 सपोर्ट सेंटर (Support Center)</span>
    </div>
    <p>जब आपको सपोर्ट टीम से सहायता की आवश्यकता हो, तो सेटिंग्स में सपोर्ट सेंटर खोलें:</p>
    <ul>
      <li><strong>समस्या की श्रेणी चुनें:</strong> अपनी आवश्यकतानुसार श्रेणी चुनें (जैसे <em>भुगतान, ऑर्डर, इनकमिंग ऑर्डर, डिलीवरी, डिस्पैच व पिकअप, ट्रिप, उत्पाद/सामान, विक्रेता, खाता, तकनीकी समस्या या सुरक्षा</em>)।</li>
      <li><strong>विशिष्ट समस्या चुनें एवं सीधे संपर्क करें:</strong> सूची में से अपनी सटीक समस्या चुनें, आवश्यक विवरण जोड़ें और अपनी समस्या के त्वरित समाधान के लिए सपोर्ट टीम से सीधे संपर्क करें।</li>
    </ul>
  </div>

  <div class="section-header">
    <h2>त्वरित संदर्भ सारांश (Quick Reference)</h2>
    <span class="section-badge">सारांश</span>
  </div>

  <table class="guide-table">
    <thead>
      <tr>
        <th>भूमिका</th>
        <th>दैनिक मुख्य कार्य</th>
        <th>ऐप में कैसे पहुंचें</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>रिटेलर</strong></td>
        <td>उत्पाद खोजना, कार्ट, चेकआउट, ऑर्डर ट्रैकिंग, खर्च व समस्याएं</td>
        <td>होम स्क्रीन &gt; कार्ट &gt; ऑर्डर इतिहास &gt; मेनू</td>
      </tr>
      <tr>
        <td><strong>थोक विक्रेता</strong></td>
        <td>स्टॉक डैशबोर्ड, स्टॉक जोड़ना/अपडेट, प्राप्त ऑर्डर, पिकअप, मांग व आय</td>
        <td>होम डैशबोर्ड &gt; स्टॉक &gt; ऑर्डर &gt; मेनू</td>
      </tr>
      <tr>
        <td><strong>ड्राइवर</strong></td>
        <td>परिवहन अनुरोध (स्वीकार करना), पिकअप ऑर्डर, डिलीवरी पुष्टि, कमाई डैशबोर्ड</td>
        <td>डैशबोर्ड &gt; अनुरोध &gt; मेनू</td>
      </tr>
      <tr>
        <td><strong>सभी उपयोगकर्ता</strong></td>
        <td>व्यावसायिक स्थान, हेल्प सेंटर वॉकथ्रू, सपोर्ट सेंटर, भाषा चयन</td>
        <td>सेटिंग्स &gt; सहायता केंद्र / सपोर्ट सेंटर / भाषा</td>
      </tr>
    </tbody>
  </table>

  <div class="note-box">
    <strong>ऐप के अंदर सहायता:</strong> किसी भी स्क्रीन पर मदद के लिए <strong>सेटिंग्स &gt; सहायता केंद्र</strong> खोलें, या सहायता टीम से बात करने के लिए <strong>सपोर्ट सेंटर</strong> पर जाएं।
  </div>

  <div class="footer">
    <span>Melato उपयोग गाइड - संपूर्ण</span>
    <span>पृष्ठ 5</span>
  </div>
</div>

</body>
</html>
"""

def run():
    print("1. Generating updated English and Hindi HTML files (Melato Purple, Hyphens)...")
    en_html = generate_english_html()
    hi_html = generate_hindi_html()

    en_html_path = os.path.join(BASE_DIR, "Melato_User_Guide_English.html")
    hi_html_path = os.path.join(BASE_DIR, "Melato_User_Guide_Hindi.html")

    with open(en_html_path, "w", encoding="utf-8") as f:
        f.write(en_html)
    with open(hi_html_path, "w", encoding="utf-8") as f:
        f.write(hi_html)

    en_pdf_path = os.path.join(BASE_DIR, "Melato_App_User_Guide_English.pdf")
    hi_pdf_path = os.path.join(BASE_DIR, "Melato_App_User_Guide_Hindi.pdf")

    print(f"2. Rendering {en_pdf_path}...")
    subprocess.run([
        EDGE_EXE,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={en_pdf_path}",
        f"file:///{os.path.abspath(en_html_path).replace(os.sep, '/')}"
    ], check=True)

    print(f"3. Rendering {hi_pdf_path}...")
    subprocess.run([
        EDGE_EXE,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={hi_pdf_path}",
        f"file:///{os.path.abspath(hi_html_path).replace(os.sep, '/')}"
    ], check=True)

    print("Done! Both Standard PDFs updated successfully with Melato Purple theme.")

if __name__ == "__main__":
    run()
