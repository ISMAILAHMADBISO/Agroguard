const fs = require('fs');
const path = 'artifacts/agroguard/src/context/language.tsx';
let content = fs.readFileSync(path, 'utf8');

const missingEn = `
    "Welcome back": "Welcome back",
    "Sign in with your staff or farmer credentials to access the platform.": "Sign in with your staff or farmer credentials to access the platform.",
    "Email Address": "Email Address",
    "Password": "Password",
    "Sign In": "Sign In",
    "Signing in...": "Signing in...",
    "Don't have an account?": "Don't have an account?",
    "Sign up as a farmer": "Sign up as a farmer",
    "Back to homepage": "Back to homepage",
    "Create your farmer account": "Create your farmer account",
    "Register to monitor your farm, receive alerts and get AI guidance.": "Register to monitor your farm, receive alerts and get AI guidance.",
    "Full Name": "Full Name",
    "Phone Number": "Phone Number",
    "Location (State / LGA)": "Location (State / LGA)",
    "Farm Name": "Farm Name",
    "Farm Size (ha)": "Farm Size (ha)",
    "Crops": "Crops",
    "WhatsApp": "WhatsApp",
    "Create Account": "Create Account",
    "Creating account...": "Creating account...",
    "Already have an account?": "Already have an account?",
    "Sign in": "Sign in",
`;

const missingHa = `
    "Welcome back": "Barka da dawowa",
    "Sign in with your staff or farmer credentials to access the platform.": "Shiga don samun damar dandalin.",
    "Email Address": "Adireshin Imel",
    "Password": "Kalmar Sirri",
    "Sign In": "Shiga",
    "Signing in...": "Ana shiga...",
    "Don't have an account?": "Ba ka da asusu?",
    "Sign up as a farmer": "Yi rajista a matsayin manomi",
    "Back to homepage": "Koma shafin farko",
    "Create your farmer account": "Ƙirƙiri asusun manomi",
    "Register to monitor your farm, receive alerts and get AI guidance.": "Yi rajista don lura da gonarka da samun shawarwari.",
    "Full Name": "Cikakken Suna",
    "Phone Number": "Lambar Waya",
    "Location (State / LGA)": "Wuri (Jiha / Ƙaramar Hukuma)",
    "Farm Name": "Sunan Gona",
    "Farm Size (ha)": "Girman Gona (ha)",
    "Crops": "Amfanin Gona",
    "WhatsApp": "WhatsApp",
    "Create Account": "Ƙirƙiri Asusu",
    "Creating account...": "Ana ƙirƙirar asusu...",
    "Already have an account?": "Kina da asusu?",
    "Sign in": "Shiga",
`;

const missingFr = `
    "Welcome back": "Bon retour",
    "Sign in with your staff or farmer credentials to access the platform.": "Connectez-vous pour accéder à la plateforme.",
    "Email Address": "Adresse e-mail",
    "Password": "Mot de passe",
    "Sign In": "Se connecter",
    "Signing in...": "Connexion...",
    "Don't have an account?": "Vous n'avez pas de compte ?",
    "Sign up as a farmer": "S'inscrire comme agriculteur",
    "Back to homepage": "Retour à l'accueil",
    "Create your farmer account": "Créez votre compte agriculteur",
    "Register to monitor your farm, receive alerts and get AI guidance.": "Inscrivez-vous pour surveiller votre ferme.",
    "Full Name": "Nom complet",
    "Phone Number": "Numéro de téléphone",
    "Location (State / LGA)": "Emplacement",
    "Farm Name": "Nom de la ferme",
    "Farm Size (ha)": "Taille de la ferme (ha)",
    "Crops": "Cultures",
    "WhatsApp": "WhatsApp",
    "Create Account": "Créer un compte",
    "Creating account...": "Création du compte...",
    "Already have an account?": "Vous avez déjà un compte ?",
    "Sign in": "Se connecter",
`;

const missingAr = `
    "Welcome back": "مرحباً بعودتك",
    "Sign in with your staff or farmer credentials to access the platform.": "قم بتسجيل الدخول للوصول إلى المنصة.",
    "Email Address": "البريد الإلكتروني",
    "Password": "كلمة المرور",
    "Sign In": "تسجيل الدخول",
    "Signing in...": "جاري تسجيل الدخول...",
    "Don't have an account?": "ليس لديك حساب؟",
    "Sign up as a farmer": "سجل كمزارع",
    "Back to homepage": "العودة للصفحة الرئيسية",
    "Create your farmer account": "أنشئ حساب المزارع الخاص بك",
    "Register to monitor your farm, receive alerts and get AI guidance.": "سجل لمراقبة مزرعتك وتلقي الإشعارات.",
    "Full Name": "الاسم الكامل",
    "Phone Number": "رقم الهاتف",
    "Location (State / LGA)": "الموقع",
    "Farm Name": "اسم المزرعة",
    "Farm Size (ha)": "حجم المزرعة (هكتار)",
    "Crops": "المحاصيل",
    "WhatsApp": "واتساب",
    "Create Account": "إنشاء حساب",
    "Creating account...": "جاري إنشاء الحساب...",
    "Already have an account?": "هل لديك حساب بالفعل؟",
    "Sign in": "تسجيل الدخول",
`;

const missingSw = `
    "Welcome back": "Karibu tena",
    "Sign in with your staff or farmer credentials to access the platform.": "Ingia ili kufikia jukwaa.",
    "Email Address": "Barua pepe",
    "Password": "Nenosiri",
    "Sign In": "Ingia",
    "Signing in...": "Inaingia...",
    "Don't have an account?": "Huna akaunti?",
    "Sign up as a farmer": "Jisajili kama mkulima",
    "Back to homepage": "Rudi kwenye ukurasa wa nyumbani",
    "Create your farmer account": "Fungua akaunti yako ya mkulima",
    "Register to monitor your farm, receive alerts and get AI guidance.": "Jisajili ili kufuatilia shamba lako na kupata ushauri.",
    "Full Name": "Jina Kamili",
    "Phone Number": "Nambari ya Simu",
    "Location (State / LGA)": "Eneo",
    "Farm Name": "Jina la Shamba",
    "Farm Size (ha)": "Ukubwa wa Shamba (ha)",
    "Crops": "Mazao",
    "WhatsApp": "WhatsApp",
    "Create Account": "Fungua Akaunti",
    "Creating account...": "Inafungua akaunti...",
    "Already have an account?": "Tayari una akaunti?",
    "Sign in": "Ingia",
`;

content = content.replace(/(en: \\{[\\s\\S]*?)("Admin Actions": "Admin Actions",\\n)(  \\},)/, "$1$2" + missingEn + "$3");
content = content.replace(/(ha: \\{[\\s\\S]*?)("Admin Actions": "Ayyukan Gudanarwa",\\n)(  \\},)/, "$1$2" + missingHa + "$3");
content = content.replace(/(fr: \\{[\\s\\S]*?)("Admin Actions": "Actions Administratives",\\n)(  \\},)/, "$1$2" + missingFr + "$3");
content = content.replace(/(ar: \\{[\\s\\S]*?)("Admin Actions": "إجراءات الإدارة",\\n)(  \\},)/, "$1$2" + missingAr + "$3");
content = content.replace(/(sw: \\{[\\s\\S]*?)("Admin Actions": "Vitendo vya Msimamizi",\\n)(  \\},)/, "$1$2" + missingSw + "$3");

fs.writeFileSync(path, content, 'utf8');
console.log('Language dictionary updated successfully');
