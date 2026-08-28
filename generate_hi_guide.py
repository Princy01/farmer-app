# Hindi Guide Builder
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
