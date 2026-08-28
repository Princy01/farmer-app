# English Guide Builder
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
