/**
 * The host landing page, in both languages it is read in.
 *
 * One file rather than a translation library: this is a single page with about
 * forty strings, and a library would be a dependency, a loader, and a namespace
 * convention to carry one screen. If a second page needs translating, that is
 * the moment to reach for i18next — not before.
 */

export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
]

export const directionOf = (code) => (code === 'ar' ? 'rtl' : 'ltr')

export const COPY = {
  en: {
    documentTitle: 'Run your tournament on Tourney',
    switchTo: 'العربية',
    switchLabel: 'Switch language',

    heroTitle: 'Run your tournament. We handle the rest.',
    heroBody:
      'Sign-ups, brackets, teams, prize money held until the results are in. You run the competition; the site keeps track of it.',
    heroAction: 'Email us',
    heroSecondary: 'See a live tournament',

    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Set it up',
        body: 'Brackets or points, solo or teams, open to all or by application. Six steps, about five minutes.',
      },
      {
        title: 'Pay the fee',
        body: 'Email us and we send you a payment link. We put the tournament live the same day, usually within the hour.',
      },
      {
        title: 'Share the link',
        body: 'Players sign up themselves. You see who is in, who has paid, and who is still missing.',
      },
      {
        title: 'Play it out',
        body: 'Record results round by round. The bracket advances on its own and the prizes pay out at the end.',
      },
    ],

    screenshotsTitle: 'What your players see',
    shots: [
      {
        src: '/media/tournament.png',
        caption: 'The tournament page, with the bracket and the prize pool',
      },
      { src: '/media/browse.png', caption: 'Your tournament listed alongside the rest' },
      {
        src: '/media/manage.png',
        caption: 'Your console — entries, bank, results, all in one screen',
      },
    ],

    pricingTitle: 'What it costs',
    pricingBody:
      'One fee per tournament, paid once, when you publish it. No cut of the entry fees and no monthly charge.',
    tierHeading: 'Tournament size',
    priceHeading: 'Fee',
    upTo: (players) => `Up to ${players} players`,
    free: 'Free',
    price: (amount) => amount,
    biggerTitle: 'Bigger than 64 players?',
    biggerBody: 'Email us and we will price it.',

    faqTitle: 'The questions we get',
    faq: [
      {
        q: 'Do you take a cut of the entry fees?',
        a: 'No. The fee to publish is the only thing we charge. Entry fees are held for the tournament and paid out to the winners.',
      },
      {
        q: 'What if nobody signs up?',
        a: 'Message us and we will refund the fee. It has not happened yet, but that is the answer.',
      },
      {
        q: 'Can players pay their entry fee in cash?',
        a: 'Yes — that is between you and them. The site tracks who has entered; how they paid you is your business.',
      },
      {
        q: 'Is it in Arabic for my players?',
        a: 'Not yet. This page is, and the app is in English. If that is a problem for your players, tell us and we will move it up the list.',
      },
    ],

    closingTitle: 'Running something soon?',
    closingBody: 'Send us a message. We will set the first one up with you.',
    closingAction: 'Email us',
  },

  ar: {
    documentTitle: 'نظّم بطولتك على تورني',
    switchTo: 'English',
    switchLabel: 'تغيير اللغة',

    heroTitle: 'نظّم بطولتك ونحن نتكفّل بالباقي.',
    heroBody:
      'التسجيل، جداول المباريات، الفرق، وأموال الجوائز محفوظة حتى تظهر النتائج. أنت تدير المنافسة، والموقع يتابع كل التفاصيل.',
    heroAction: 'راسلنا بالبريد',
    heroSecondary: 'شاهد بطولة جارية',

    stepsTitle: 'كيف تعمل',
    steps: [
      {
        title: 'جهّز البطولة',
        body: 'جدول إقصائي أو نقاط، فردي أو فرق، مفتوحة للجميع أو بطلب انضمام. ست خطوات، خمس دقائق تقريباً.',
      },
      {
        title: 'ادفع الرسوم',
        body: 'راسلنا ونرسل لك رابط الدفع. ننشر البطولة في اليوم نفسه، غالباً خلال ساعة.',
      },
      {
        title: 'شارك الرابط',
        body: 'اللاعبون يسجّلون بأنفسهم. ترى من انضم، ومن دفع، ومن لم يسجّل بعد.',
      },
      {
        title: 'أدِر المباريات',
        body: 'سجّل النتائج جولة بجولة. الجدول يتقدّم وحده، والجوائز تُدفع في النهاية.',
      },
    ],

    screenshotsTitle: 'ما يراه لاعبوك',
    shots: [
      { src: '/media/tournament.png', caption: 'صفحة البطولة، مع الجدول ومجموع الجوائز' },
      { src: '/media/browse.png', caption: 'بطولتك معروضة إلى جانب البطولات الأخرى' },
      { src: '/media/manage.png', caption: 'لوحتك — المشتركون والخزنة والنتائج في شاشة واحدة' },
    ],

    pricingTitle: 'الكلفة',
    pricingBody:
      'رسم واحد لكل بطولة، يُدفع مرة واحدة عند نشرها. لا نأخذ نسبة من رسوم الاشتراك ولا اشتراك شهري.',
    tierHeading: 'حجم البطولة',
    priceHeading: 'الرسوم',
    upTo: (players) => `حتى ${players} لاعباً`,
    free: 'مجاناً',
    price: (amount) => amount,
    biggerTitle: 'أكبر من ٦٤ لاعباً؟',
    biggerBody: 'راسلنا وسنحدّد لك السعر.',

    faqTitle: 'أسئلة تصلنا',
    faq: [
      {
        q: 'هل تأخذون نسبة من رسوم الاشتراك؟',
        a: 'لا. رسم النشر هو كل ما نتقاضاه. رسوم الاشتراك تُحفظ للبطولة وتُدفع للفائزين.',
      },
      {
        q: 'ماذا لو لم يسجّل أحد؟',
        a: 'راسلنا ونعيد لك الرسوم. لم يحصل هذا بعد، لكن هذا هو الجواب.',
      },
      {
        q: 'هل يمكن للّاعبين دفع الاشتراك نقداً؟',
        a: 'نعم، هذا بينك وبينهم. الموقع يتابع من سجّل، وطريقة الدفع تعود لك.',
      },
      {
        q: 'هل التطبيق بالعربية للّاعبين؟',
        a: 'ليس بعد. هذه الصفحة بالعربية، والتطبيق بالإنكليزية. إن كان هذا يعيق لاعبيك، أخبرنا ونقدّمه في الأولويات.',
      },
    ],

    closingTitle: 'عندك بطولة قريباً؟',
    closingBody: 'راسلنا وسنجهّز الأولى معك.',
    closingAction: 'راسلنا بالبريد',
  },
}
