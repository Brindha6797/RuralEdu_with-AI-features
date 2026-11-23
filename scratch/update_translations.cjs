const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'context', 'translations.js');
let content = fs.readFileSync(filePath, 'utf8');

const newKeys = {
  en: {
    phone: "Phone Number",
    confirm_password: "Confirm Password",
    continue: "Continue",
    back: "Back",
    back_to_language: "Change Language",
    select_language_title: "Choose Your Language",
    select_language_subtitle: "Welcome to RuralEdu! Select your preferred language to begin learning.",
    welcome_label: "Welcome",
    passwords_not_match: "Passwords do not match.",
    admin_secret_label: "Admin Authorization Key (Required)",
    admin_secret_desc: "Administrator registration requires an authorized key.",
    admin_secret_placeholder: "Enter administrator authorization key",
    admin_secret_required: "Admin Authorization Key is required to create an Admin account.",
    selected: "Selected",
    continue_to_login: "Continue to Login",
    new_user_register: "New student or parent? Create an account",
    english_name: "English",
    tamil_name: "தமிழ்",
    hindi_name: "हिन्दी",
    english_welcome: "Welcome",
    tamil_welcome: "வரவேற்கிறோம்",
    hindi_welcome: "स्वागत है",
    english_desc: "Learn with AI assistance in English",
    tamil_desc: "பாடங்களை தமிழில் எளிதாகக் கற்றுக்கொள்ளுங்கள்",
    hindi_desc: "गणित, विज्ञान और अन्य विषय हिन्दी में सीखें"
  },
  ta: {
    phone: "தொலைபேசி எண்",
    confirm_password: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    continue: "தொடரவும்",
    back: "பின்னே",
    back_to_language: "மொழியை மாற்றவும்",
    select_language_title: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    select_language_subtitle: "RuralEdu-க்கு நல்வரவு! கற்கத் தொடங்க உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    welcome_label: "வரவேற்கிறோம்",
    passwords_not_match: "கடவுச்சொற்கள் பொருந்தவில்லை.",
    admin_secret_label: "நிர்வாகி அங்கீகார சாவி (தேவை)",
    admin_secret_desc: "நிர்வாகி பதிவுக்கு அங்கீகரிக்கப்பட்ட சாவி தேவை.",
    admin_secret_placeholder: "நிர்வாகி அங்கீகார சாவியை உள்ளிடவும்",
    admin_secret_required: "நிர்வாகக் கணக்கை உருவாக்க அங்கீகார சாவி தேவை.",
    selected: "தேர்ந்தெடுக்கப்பட்டது",
    continue_to_login: "உள்நுழைவுக்கு தொடரவும்",
    new_user_register: "புதிய மாணவர் அல்லது பெற்றோர்? கணக்கை உருவாக்கவும்",
    english_name: "English",
    tamil_name: "தமிழ்",
    hindi_name: "हिन्दी",
    english_welcome: "Welcome",
    tamil_welcome: "வரவேற்கிறோம்",
    hindi_welcome: "स्वागत है",
    english_desc: "Learn with AI assistance in English",
    tamil_desc: "பாடங்களை தமிழில் எளிதாகக் கற்றுக்கொள்ளுங்கள்",
    hindi_desc: "गणित, विज्ञान और अन्य विषय हिन्दी में सीखें"
  },
  hi: {
    phone: "फ़ोन नंबर",
    confirm_password: "पासवर्ड की पुष्टि करें",
    continue: "आगे बढ़ें",
    back: "पीछे जाएं",
    back_to_language: "भाषा बदलें",
    select_language_title: "अपनी भाषा चुनें",
    select_language_subtitle: "RuralEdu में आपका स्वागत है! सीखना शुरू करने के लिए अपनी पसंदीदा भाषा चुनें।",
    welcome_label: "स्वागत है",
    passwords_not_match: "पासवर्ड मेल नहीं खाते।",
    admin_secret_label: "व्यवस्थापक प्राधिकरण कुंजी (आवश्यक)",
    admin_secret_desc: "व्यवस्थापक पंजीकरण के लिए एक अधिकृत कुंजी की आवश्यकता है।",
    admin_secret_placeholder: "व्यवस्थापक प्राधिकरण कुंजी दर्ज करें",
    admin_secret_required: "व्यवस्थापक खाता बनाने के लिए प्राधिकरण कुंजी आवश्यक है।",
    selected: "चयनित",
    continue_to_login: "लॉगिन के लिए आगे बढ़ें",
    new_user_register: "नए छात्र या अभिभावक? खाता बनाएं",
    english_name: "English",
    tamil_name: "தமிழ்",
    hindi_name: "हिन्दी",
    english_welcome: "Welcome",
    tamil_welcome: "வரவேற்கிறோம்",
    hindi_welcome: "स्वागत है",
    english_desc: "Learn with AI assistance in English",
    tamil_desc: "பாடங்களை தமிழில் எளிதாகக் கற்றுக்கொள்ளுங்கள்",
    hindi_desc: "गणित, विज्ञान और अन्य विषय हिन्दी में सीखें"
  },
  te: {
    phone: "ఫోన్ నంబర్",
    confirm_password: "పాస్‌వర్డ్‌ను నిర్ధారించండి",
    continue: "కొనసాగించండి",
    back: "వెనుకకు",
    back_to_language: "భాషను మార్చండి",
    select_language_title: "మీ భాషను ఎంచుకోండి",
    select_language_subtitle: "RuralEdu కు స్వాగతం! నేర్చుకోవడం ప్రారంభించడానికి మీ ప్రాధాన్య భాషను ఎంచుకోండి.",
    welcome_label: "స్వాగతం",
    passwords_not_match: "పాస్‌వర్డ్‌లు సరిపోలడం లేదు.",
    admin_secret_label: "అడ్మిన్ అధికార కీ (అవసరం)",
    admin_secret_desc: "నిర్వాహక నమోదుకు ఒక అధికృత కీ అవసరం.",
    admin_secret_placeholder: "అడ్మిన్ అధికార కీని నమోదు చేయండి",
    admin_secret_required: "అడ్మిన్ ఖాతాను సృష్టించడానికి అధికార కీ అవసరం.",
    selected: "ఎంపిక చేయబడింది",
    continue_to_login: "లాగిన్ కోసం కొనసాగించండి",
    new_user_register: "కొత్త విద్యార్థి లేదా తల్లిదండ్రులు? ఖాతాను సృష్టించండి",
    english_name: "English",
    tamil_name: "தமிழ்",
    hindi_name: "हिन्दी",
    english_welcome: "Welcome",
    tamil_welcome: "வரவேற்கிறோம்",
    hindi_welcome: "स्वागत है",
    english_desc: "Learn with AI assistance in English",
    tamil_desc: "பாடங்களை தமிழில் எளிதாகக் கற்றுக்கொள்ளுங்கள்",
    hindi_desc: "गणित, विज्ञान और अन्य विषय हिन्दी में सीखें"
  }
};

// We will evaluate the module to get the current object
import('../frontend/src/context/translations.js').then(module => {
  const current = module.translations;
  for (const lang of ['en', 'ta', 'hi', 'te']) {
    if (current[lang] && newKeys[lang]) {
      Object.assign(current[lang], newKeys[lang]);
    }
  }

  const newFileContent = `export const translations = ${JSON.stringify(current, null, 2)};\n`;
  fs.writeFileSync(filePath, newFileContent, 'utf8');
  console.log('Successfully updated translations.js with all new keys!');
});
