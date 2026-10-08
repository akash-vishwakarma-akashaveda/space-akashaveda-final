// Page copy in English and Hindi, side by side so the two stay in step. Pure data (no browser APIs), so the build's
// SEO step can read it too. Product pages live in products.ts / products.hi.ts. Console figures are illustrative.

export interface TeamMember {
  n: string;
  r: string;
  d: string;
}

const en = {
  boot: { words: ['Connecting', 'Controlling', 'Comprehending'] },
  nav: { ground: 'GROUND', vyuh: 'VYUH', chakra: 'CHAKRA', team: 'TEAM', contact: 'CONTACT US', open: 'Open menu', close: 'Close menu', menu: 'Menu', lang: 'हिंदी', langLabel: 'हिंदी में पढ़ें' },
  hero: { eyebrow: 'End-to-end ground segment as a service', l1: 'Space is far.', l2: 'We keep it close.' },
  beatDot: '.',
  beats: [
    { k: 'Connect', t: 'Every pass, from AOS to LOS.' },
    { k: 'Control', t: 'Every operation, analysed and dual-authorised.' },
    { k: 'Comprehend', t: 'Every conjunction, screened.' },
  ],
  readMore: 'Read more →',
  cards: {
    acq: { label: 'ACQUISITION · TM ↓ DOWNLINK', tag: 'STEP 01 / 05', title: 'Signal acquired.', lede: 'Aperture locks autotrack over local horizon, streaming real-time baseband telemetry.', stats: [['AUTOTRACK', 'LOCKED · 48.2° EL'], ['DOWNLINK', '2.2 GHz S-BAND'], ['CARRIER', 'SYNCED · -84 dBm']] },
    gs: { label: 'GROUND STATION · GS-01', tag: 'STEP 02 / 05', title: 'One antenna, one service chain.', console: 'GS-01 Ground Terminal', consoleSub: 'REAL-TIME RF TRACKING & BASEBAND', lede: 'India’s first commercial 7.5 m tri-band antenna, for TT&C, payload downlink and reserved capacity.', stats: [['ANTENNA', '7.5 m · S / X / Ka'], ['FIRST IN INDIA', 'COMMERCIAL 7.5 m']] },
    mcs: { label: 'CONTROL CENTRE · VYUH MCS', tag: 'STEP 03 / 05', title: 'Inside the control centre.', console: 'Vyuh Mission Control', consoleSub: 'FLEET TELEMETRY & CMD PIPELINE', lede: 'Mission control that plans, checks and routes: automation in between, the operator approving every critical action.', stats: [['AGENTS', '5 SPECIALISED'], ['GROUND GATEWAY', 'STATION-AGNOSTIC']] },
    ssa: { label: 'CONTROL CENTRE · CHAKRA SSA', tag: 'STEP 04 / 05', title: 'Orbital data to a decision you can defend.', console: 'Chakra Orbital Engine', consoleSub: 'CONJUNCTION SCREENING & AVOIDANCE', lede: 'Close approaches predicted, collision risk tiered, and every avoidance manoeuvre re-screened before the burn.', stats: [['OBJECTS · TARGET', '≥ 100,000'], ['DETECTION · TARGET', '< 10 s']] },
    up: { label: 'TC ↑ UPLINK · CLOSING THE LOOP', tag: 'STEP 05 / 05', title: 'The command goes back up.', lede: 'Chakra flags it, Vyuh checks it, the operator approves it, and GS-01 sends it up on the best pass.' },
  },
  loop: [
    { k: 'CHAKRA', t: 'Predicts the close approach and designs a re-screened avoidance burn.' },
    { k: 'VYUH', t: 'Checks the manoeuvre; the operator approves it.' },
    { k: 'GS-01', t: 'The best pass uplinks the encrypted command.' },
    { k: 'RECORD', t: 'Telemetry and tracking confirm the new orbit.' },
  ],
  modal: { gs: 'GS-01 console', mcs: 'Vyuh console', ssa: 'Chakra console', sim: 'Illustrative · simulated data', close: 'CLOSE ✕' },
  deploy: { eyebrow: 'Deployment', title: 'Runs where your mission needs it.' },
  DEPLOY: [
    { t: 'Cloud', d: 'Fully managed cloud deployment with elastic pass processing, real-time telemetry streaming, and global backhaul.' },
    { t: 'On-premise', d: 'Installed inside your operations facility on your infrastructure, complying with sovereign security standards.' },
    { t: 'Hybrid', d: 'Air-gapped mission operations core connected to the global ground station network via secure encrypted gateways.' },
  ],
  missions: { eyebrow: 'Missions', title: 'Built for the missions that depend on the ground.' },
  USES: [
    { n: '01', t: 'Earth observation', d: 'High-volume payload downlinks and automated antenna scheduling for optical and SAR constellations.' },
    { n: '02', t: 'Commercial constellations', d: 'High-cadence contact scheduling, fleet housekeeping, and automated orbit phase-in.' },
    { n: '03', t: 'Defence & security', d: 'Sovereign air-gapped deployments, hardware-signed uplinks, and strict multi-operator access controls.' },
    { n: '04', t: 'Maritime & IoT', d: 'Global data collection, AIS/ADS-B payload pipelines, and coordinated multi-station passes.' },
    { n: '05', t: 'Space safety & SSA', d: 'High-precision conjunction screening, proximity alerts, and operator-verified avoidance maneuvers.' },
  ],
  team: { eyebrow: 'Leadership', title: 'RF and space systems, from the ground up.' },
  TEAM: [
    { n: 'Dr Ashutosh Srivastava', r: 'CHIEF EXECUTIVE OFFICER', d: 'Satellite RF systems engineering, ground systems & antenna networks' },
    { n: 'Akash Vishwakarma', r: 'CHIEF TECHNOLOGY OFFICER', d: 'Distributed software architectures, space systems & mission control platforms' },
    { n: 'Dr B N Ramakrishna', r: 'ADVISOR', d: 'Former Director, ISTRAC (ISRO Telemetry, Tracking and Command Network)' },
    { n: 'Dr Alok Srivastava', r: 'ADVISOR', d: 'Former Associate Director, URSC (ISRO U R Rao Satellite Centre)' },
  ] as TeamMember[],
  faq: { eyebrow: 'Questions', title: 'Ground segment, answered.' },
  /** Shown on the home page and published as FAQ structured data. */
  HOME_FAQ: [
    { q: 'What is ground segment as a service?', a: 'Ground segment as a service gives satellite operators ground station passes, mission control and space situational awareness as a service, instead of building and running their own. Akashaveda provides all three: the GS-01 ground station, Vyuh mission control and Chakra space safety.' },
    { q: 'What does Akashaveda do?', a: 'Akashaveda connects, controls and comprehends satellite missions: GS-01 provides TT&C and payload downlink passes, Vyuh plans, checks and routes commands, and Chakra screens for collision risk and designs avoidance manoeuvres.' },
    { q: 'Where can Akashaveda run?', a: 'As a fully managed cloud deployment, on-premise inside your own operations facility, or hybrid, with an air-gapped mission core connected to the ground station network through secure encrypted gateways.' },
    { q: 'Which missions is Akashaveda built for?', a: 'Earth observation, commercial constellations, defence and security, maritime and IoT, and space safety and SSA.' },
  ],
  contact: {
    eyebrow: 'Design partners · open channel',
    title: 'Make the ground segment your advantage.',
    lede: 'Schedule a live demonstration, or talk to us about ground station passes, mission control and constellation operations.',
    name: 'Name',
    email: 'Work email',
    req: 'Requirements',
    interested: 'Interested in',
    interests: ['GROUND STATION', 'MISSION CONTROL', 'SSA'],
    submit: 'Transmit request →',
  },
  footer: {
    tagline: 'Ground segment as a service. Connect, control and comprehend every pass.',
    hq: 'HQ Bangalore, India',
    cols: [
      { h: 'Products', links: [['Ground station', '/ground-station'], ['Vyuh · mission control', '/vyuh'], ['Chakra · space safety', '/chakra']] },
      { h: 'Company', links: [['Deployment', '/#deploy'], ['Missions', '/#missions'], ['Leadership', '/#team']] },
      { h: 'Contact', links: [['Request a demo', '/#contact']] },
    ],
    copyright: '© 2024 Akashaveda. All rights reserved.',
    illustrative: 'Console figures on this site are illustrative.',
    top: 'Back to top ↑',
  },
  product: { back: '← Overview', questions: 'Questions', answered: (name: string) => `${name}, answered.`, talk: 'Talk to us →', dish: 'The GS-01 antenna in 3D', sat: 'A satellite in 3D', globe: 'Earth with satellite orbits and a flagged close approach', closeApproach: 'CLOSE APPROACH' },
};

export type Copy = typeof en;

const hi: Copy = {
  boot: { words: ['जोड़ना', 'नियंत्रण', 'समझ'] },
  nav: { ground: 'ग्राउंड', vyuh: 'व्यूह', chakra: 'चक्र', team: 'टीम', contact: 'संपर्क करें', open: 'मेनू खोलें', close: 'मेनू बंद करें', menu: 'मेनू', lang: 'EN', langLabel: 'Read in English' },
  hero: { eyebrow: 'एंड-टू-एंड ग्राउंड सेगमेंट ऐज़ ए सर्विस', l1: 'अंतरिक्ष दूर है।', l2: 'हम उसे पास रखते हैं।' },
  beatDot: '।',
  beats: [
    { k: 'जोड़ें', t: 'हर पास, AOS से LOS तक।' },
    { k: 'नियंत्रण', t: 'हर ऑपरेशन, विश्लेषित और दोहरी स्वीकृति के साथ।' },
    { k: 'समझ', t: 'हर कंजंक्शन की जाँच।' },
  ],
  readMore: 'और पढ़ें →',
  cards: {
    acq: { label: 'अधिग्रहण · TM ↓ डाउनलिंक', tag: 'चरण 01 / 05', title: 'सिग्नल प्राप्त।', lede: 'एंटीना क्षितिज के ऊपर ऑटोट्रैक पर लॉक होता है और रियल-टाइम बेसबैंड टेलीमेट्री भेजता है।', stats: [['ऑटोट्रैक', 'लॉक · 48.2° EL'], ['डाउनलिंक', '2.2 GHz S-बैंड'], ['कैरियर', 'सिंक · -84 dBm']] },
    gs: { label: 'ग्राउंड स्टेशन · GS-01', tag: 'चरण 02 / 05', title: 'एक एंटीना, एक सर्विस चेन।', console: 'GS-01 ग्राउंड टर्मिनल', consoleSub: 'रियल-टाइम RF ट्रैकिंग और बेसबैंड', lede: 'भारत का पहला व्यावसायिक 7.5 मीटर ट्राई-बैंड एंटीना — TT&C, पेलोड डाउनलिंक और आरक्षित क्षमता के लिए।', stats: [['एंटीना', '7.5 m · S / X / Ka'], ['भारत में पहला', 'व्यावसायिक 7.5 m']] },
    mcs: { label: 'कंट्रोल सेंटर · व्यूह MCS', tag: 'चरण 03 / 05', title: 'कंट्रोल सेंटर के अंदर।', console: 'व्यूह मिशन कंट्रोल', consoleSub: 'फ़्लीट टेलीमेट्री और कमांड पाइपलाइन', lede: 'मिशन कंट्रोल जो योजना बनाता है, जाँचता है और रूट करता है: बीच का काम ऑटोमेशन करता है, और हर महत्वपूर्ण कार्रवाई को ऑपरेटर स्वीकृत करता है।', stats: [['एजेंट', '5 विशेषीकृत'], ['ग्राउंड गेटवे', 'किसी भी स्टेशन के साथ']] },
    ssa: { label: 'कंट्रोल सेंटर · चक्र SSA', tag: 'चरण 04 / 05', title: 'ऑर्बिटल डेटा से ऐसा निर्णय, जिसका आप बचाव कर सकें।', console: 'चक्र ऑर्बिटल इंजन', consoleSub: 'कंजंक्शन स्क्रीनिंग और टकराव से बचाव', lede: 'नज़दीकी पहुँच का पूर्वानुमान, टकराव जोखिम के स्तर, और हर बचाव मैनूवर की बर्न से पहले दोबारा जाँच।', stats: [['ऑब्जेक्ट · लक्ष्य', '≥ 100,000'], ['पहचान · लक्ष्य', '< 10 s']] },
    up: { label: 'TC ↑ अपलिंक · लूप पूरा', tag: 'चरण 05 / 05', title: 'कमांड वापस ऊपर जाती है।', lede: 'चक्र इसे चिह्नित करता है, व्यूह इसकी जाँच करता है, ऑपरेटर इसे स्वीकृत करता है, और GS-01 सबसे अच्छे पास पर इसे ऊपर भेजता है।' },
  },
  loop: [
    { k: 'चक्र', t: 'नज़दीकी पहुँच का अनुमान लगाता है और दोबारा जाँचा गया बचाव बर्न तैयार करता है।' },
    { k: 'व्यूह', t: 'मैनूवर की जाँच करता है; ऑपरेटर उसे स्वीकृत करता है।' },
    { k: 'GS-01', t: 'सबसे अच्छा पास एन्क्रिप्टेड कमांड अपलिंक करता है।' },
    { k: 'रिकॉर्ड', t: 'टेलीमेट्री और ट्रैकिंग नई कक्षा की पुष्टि करती है।' },
  ],
  modal: { gs: 'GS-01 कंसोल', mcs: 'व्यूह कंसोल', ssa: 'चक्र कंसोल', sim: 'उदाहरण · सिम्युलेटेड डेटा', close: 'बंद करें ✕' },
  deploy: { eyebrow: 'तैनाती', title: 'वहीं चलता है, जहाँ आपके मिशन को ज़रूरत है।' },
  DEPLOY: [
    { t: 'क्लाउड', d: 'इलास्टिक पास प्रोसेसिंग, रियल-टाइम टेलीमेट्री स्ट्रीमिंग और वैश्विक बैकहॉल के साथ पूरी तरह प्रबंधित क्लाउड डिप्लॉयमेंट।' },
    { t: 'ऑन-प्रिमाइस', d: 'आपकी ऑपरेशन सुविधा में, आपके अपने इंफ्रास्ट्रक्चर पर, संप्रभु सुरक्षा मानकों के अनुरूप इंस्टॉल।' },
    { t: 'हाइब्रिड', d: 'एयर-गैप्ड मिशन ऑपरेशन कोर, जो सुरक्षित एन्क्रिप्टेड गेटवे के ज़रिए वैश्विक ग्राउंड स्टेशन नेटवर्क से जुड़ा है।' },
  ],
  missions: { eyebrow: 'मिशन', title: 'उन मिशनों के लिए बना, जो ज़मीन पर निर्भर हैं।' },
  USES: [
    { n: '01', t: 'पृथ्वी अवलोकन', d: 'ऑप्टिकल और SAR कॉन्स्टेलेशन के लिए बड़े पैमाने पर पेलोड डाउनलिंक और स्वचालित एंटीना शेड्यूलिंग।' },
    { n: '02', t: 'व्यावसायिक कॉन्स्टेलेशन', d: 'लगातार संपर्क शेड्यूलिंग, फ़्लीट हाउसकीपिंग और स्वचालित ऑर्बिट फ़ेज़-इन।' },
    { n: '03', t: 'रक्षा और सुरक्षा', d: 'संप्रभु एयर-गैप्ड डिप्लॉयमेंट, हार्डवेयर-हस्ताक्षरित अपलिंक और सख़्त बहु-ऑपरेटर एक्सेस नियंत्रण।' },
    { n: '04', t: 'समुद्री और IoT', d: 'वैश्विक डेटा संग्रह, AIS/ADS-B पेलोड पाइपलाइन और समन्वित बहु-स्टेशन पास।' },
    { n: '05', t: 'अंतरिक्ष सुरक्षा और SSA', d: 'उच्च-सटीकता कंजंक्शन स्क्रीनिंग, निकटता अलर्ट और ऑपरेटर-सत्यापित बचाव मैनूवर।' },
  ],
  team: { eyebrow: 'नेतृत्व', title: 'RF और अंतरिक्ष प्रणालियाँ, बुनियाद से।' },
  TEAM: [
    { n: 'डॉ. आशुतोष श्रीवास्तव', r: 'मुख्य कार्यकारी अधिकारी', d: 'सैटेलाइट RF सिस्टम इंजीनियरिंग, ग्राउंड सिस्टम और एंटीना नेटवर्क' },
    { n: 'आकाश विश्वकर्मा', r: 'मुख्य प्रौद्योगिकी अधिकारी', d: 'डिस्ट्रिब्यूटेड सॉफ़्टवेयर आर्किटेक्चर, अंतरिक्ष प्रणालियाँ और मिशन कंट्रोल प्लेटफ़ॉर्म' },
    { n: 'डॉ. बी. एन. रामकृष्ण', r: 'सलाहकार', d: 'पूर्व निदेशक, ISTRAC (इसरो टेलीमेट्री, ट्रैकिंग और कमांड नेटवर्क)' },
    { n: 'डॉ. आलोक श्रीवास्तव', r: 'सलाहकार', d: 'पूर्व सहयोगी निदेशक, URSC (इसरो यू. आर. राव सैटेलाइट सेंटर)' },
  ],
  faq: { eyebrow: 'प्रश्न', title: 'ग्राउंड सेगमेंट: सवाल और जवाब।' },
  HOME_FAQ: [
    { q: 'ग्राउंड सेगमेंट ऐज़ ए सर्विस क्या है?', a: 'ग्राउंड सेगमेंट ऐज़ ए सर्विस में सैटेलाइट ऑपरेटरों को ग्राउंड स्टेशन पास, मिशन कंट्रोल और अंतरिक्ष स्थितिजन्य जागरूकता एक सेवा के रूप में मिलती है, ताकि उन्हें ये सब ख़ुद बनाना और चलाना न पड़े। आकाशवेद तीनों देता है: GS-01 ग्राउंड स्टेशन, व्यूह मिशन कंट्रोल और चक्र अंतरिक्ष सुरक्षा।' },
    { q: 'आकाशवेद क्या करता है?', a: 'आकाशवेद सैटेलाइट मिशनों को जोड़ता, नियंत्रित करता और समझता है: GS-01 TT&C और पेलोड डाउनलिंक पास देता है, व्यूह कमांड की योजना बनाता, जाँचता और रूट करता है, और चक्र टकराव के जोखिम की जाँच करके बचाव मैनूवर तैयार करता है।' },
    { q: 'आकाशवेद कहाँ चल सकता है?', a: 'पूरी तरह प्रबंधित क्लाउड डिप्लॉयमेंट के रूप में, आपकी अपनी ऑपरेशन सुविधा में ऑन-प्रिमाइस, या हाइब्रिड रूप में — जिसमें एयर-गैप्ड मिशन कोर सुरक्षित एन्क्रिप्टेड गेटवे के ज़रिए ग्राउंड स्टेशन नेटवर्क से जुड़ा होता है।' },
    { q: 'आकाशवेद किन मिशनों के लिए बना है?', a: 'पृथ्वी अवलोकन, व्यावसायिक कॉन्स्टेलेशन, रक्षा और सुरक्षा, समुद्री और IoT, तथा अंतरिक्ष सुरक्षा और SSA।' },
  ],
  contact: {
    eyebrow: 'डिज़ाइन पार्टनर · खुला चैनल',
    title: 'ग्राउंड सेगमेंट को अपनी ताक़त बनाइए।',
    lede: 'लाइव डेमो शेड्यूल करें, या ग्राउंड स्टेशन पास, मिशन कंट्रोल और कॉन्स्टेलेशन ऑपरेशन के बारे में हमसे बात करें।',
    name: 'नाम',
    email: 'कार्य ईमेल',
    req: 'आवश्यकताएँ',
    interested: 'रुचि',
    interests: ['ग्राउंड स्टेशन', 'मिशन कंट्रोल', 'SSA'],
    submit: 'अनुरोध भेजें →',
  },
  footer: {
    tagline: 'ग्राउंड सेगमेंट ऐज़ ए सर्विस। हर पास को जोड़ें, नियंत्रित करें और समझें।',
    hq: 'मुख्यालय बेंगलुरु, भारत',
    cols: [
      { h: 'उत्पाद', links: [['ग्राउंड स्टेशन', '/ground-station'], ['व्यूह · मिशन कंट्रोल', '/vyuh'], ['चक्र · अंतरिक्ष सुरक्षा', '/chakra']] },
      { h: 'कंपनी', links: [['तैनाती', '/#deploy'], ['मिशन', '/#missions'], ['नेतृत्व', '/#team']] },
      { h: 'संपर्क', links: [['डेमो का अनुरोध करें', '/#contact']] },
    ],
    copyright: '© 2024 आकाशवेद। सर्वाधिकार सुरक्षित।',
    illustrative: 'इस साइट पर कंसोल के आँकड़े उदाहरण मात्र हैं।',
    top: 'ऊपर जाएँ ↑',
  },
  product: { back: '← मुखपृष्ठ', questions: 'प्रश्न', answered: (name: string) => `${name}: सवाल और जवाब।`, talk: 'हमसे बात करें →', dish: '3D में GS-01 एंटीना', sat: '3D में एक सैटेलाइट', globe: 'सैटेलाइट कक्षाओं और चिह्नित नज़दीकी पहुँच के साथ पृथ्वी', closeApproach: 'नज़दीकी पहुँच' },
};

export const COPY = { en, hi };
export type Lang = keyof typeof COPY;

export const CONTACT_EMAIL = 'contact@akashaveda.com';
