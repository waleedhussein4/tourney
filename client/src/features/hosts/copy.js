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
      'Sign-ups, brackets, teams and standings. You run the competition; the site keeps track of it.',
    heroAction: 'Email us',
    heroSecondary: 'See a live tournament',

    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Set it up',
        body: 'Brackets or points, solo or teams, open to all or by application. Six steps, about five minutes.',
      },
      {
        title: 'Publish it',
        body: 'Your first tournament goes live for free. Running more than one at a time is a monthly subscription.',
      },
      {
        title: 'Share the link',
        body: 'Players sign up themselves. You see who is in, and who is still missing.',
      },
      {
        title: 'Play it out',
        body: 'Record results round by round. The bracket advances on its own.',
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
        caption: 'Your console — entries, results, all in one screen',
      },
    ],

    pricingTitle: 'What it costs',
    pricingBody:
      'Hosting is free. Running more than one tournament live at the same time needs a subscription — no cut of your entry fees, ever.',
    tierHeading: 'Tournament size',
    priceHeading: 'Fee',
    upTo: (count) => `${count} tournament live at a time is`,
    free: 'Free',
    price: (amount) => `then ${amount} a`,
    biggerTitle: 'Running several at once?',
    biggerBody: 'Subscribe from your billing page — no email needed.',

    faqTitle: 'The questions we get',
    faq: [
      {
        q: 'Do you take a cut of the entry fees?',
        a: 'No. Entry fees and prizes are between you and your players — the site never holds or moves that money.',
      },
      {
        q: 'What if I only run one tournament?',
        a: 'Then hosting costs nothing. The subscription only matters once you want a second tournament live at the same time.',
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
      'التسجيل، جداول المباريات، الفرق والترتيب. أنت تدير المنافسة، والموقع يتابع كل التفاصيل.',
    heroAction: 'راسلنا بالبريد',
    heroSecondary: 'شاهد بطولة جارية',

    stepsTitle: 'كيف تعمل',
    steps: [
      {
        title: 'جهّز البطولة',
        body: 'جدول إقصائي أو نقاط، فردي أو فرق، مفتوحة للجميع أو بطلب انضمام. ست خطوات، خمس دقائق تقريباً.',
      },
      {
        title: 'انشرها',
        body: 'بطولتك الأولى مجانية. تشغيل أكثر من بطولة في الوقت نفسه يحتاج اشتراكاً شهرياً.',
      },
      {
        title: 'شارك الرابط',
        body: 'اللاعبون يسجّلون بأنفسهم. ترى من انضم، ومن لم يسجّل بعد.',
      },
      {
        title: 'أدِر المباريات',
        body: 'سجّل النتائج جولة بجولة. الجدول يتقدّم وحده.',
      },
    ],

    screenshotsTitle: 'ما يراه لاعبوك',
    shots: [
      { src: '/media/tournament.png', caption: 'صفحة البطولة، مع الجدول ومجموع الجوائز' },
      { src: '/media/browse.png', caption: 'بطولتك معروضة إلى جانب البطولات الأخرى' },
      { src: '/media/manage.png', caption: 'لوحتك — المشتركون والنتائج في شاشة واحدة' },
    ],

    pricingTitle: 'الكلفة',
    pricingBody:
      'التنظيم مجاني. تشغيل أكثر من بطولة واحدة في الوقت نفسه يحتاج اشتراكاً — بلا أي نسبة من رسوم اشتراك لاعبيك.',
    tierHeading: 'حجم البطولة',
    priceHeading: 'الرسوم',
    upTo: (count) => `بطولة واحدة (${count}) في الوقت نفسه`,
    free: 'مجانية',
    price: (amount) => `ثم ${amount} في`,
    biggerTitle: 'تدير أكثر من بطولة في آن واحد؟',
    biggerBody: 'اشترك من صفحة الفوترة — بلا حاجة لمراسلتنا.',

    faqTitle: 'أسئلة تصلنا',
    faq: [
      {
        q: 'هل تأخذون نسبة من رسوم الاشتراك؟',
        a: 'لا. رسوم الاشتراك والجوائز أمر بينك وبين لاعبيك — الموقع لا يحفظ هذه الأموال ولا يحرّكها.',
      },
      {
        q: 'ماذا لو أدرت بطولة واحدة فقط؟',
        a: 'عندها التنظيم مجاني بالكامل. الاشتراك يهم فقط عندما تريد بطولة ثانية في الوقت نفسه.',
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
