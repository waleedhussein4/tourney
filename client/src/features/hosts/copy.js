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
    heroAction: 'Start hosting',
    heroSecondary: 'See a live tournament',

    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Set it up',
        body: 'Brackets or points, solo or teams, open to all or by application. Six steps, about five minutes.',
      },
      {
        title: 'Publish it',
        body: 'Publishing is free and instant. Until you do, only you can see the tournament.',
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
      'Nothing real. Tourney runs on demo credits: they are not money, cannot be cashed out, and the checkout never takes a card. Becoming a host costs 20 credits, and anyone can top up for free.',

    faqTitle: 'The questions we get',
    faq: [
      {
        q: 'Is there real money involved?',
        a: 'No. Entry fees and prizes are demo credits, held in the tournament bank and paid out to the winners. They have no cash value.',
      },
      {
        q: 'What if nobody signs up?',
        a: 'Cancel the tournament before it starts and every entry fee goes back to the player who paid it.',
      },
      {
        q: 'Is it in Arabic for my players?',
        a: 'Not yet. This page is, and the app is in English. If that is a problem for your players, tell us and we will move it up the list.',
      },
    ],

    closingTitle: 'Running something soon?',
    closingBody: 'Start hosting, or have a look at a live tournament first.',
    closingAction: 'Start hosting',
  },

  ar: {
    documentTitle: 'نظّم بطولتك على تورني',
    switchTo: 'English',
    switchLabel: 'تغيير اللغة',

    heroTitle: 'نظّم بطولتك ونحن نتكفّل بالباقي.',
    heroBody:
      'التسجيل، جداول المباريات، الفرق والترتيب. أنت تدير المنافسة، والموقع يتابع كل التفاصيل.',
    heroAction: 'ابدأ التنظيم',
    heroSecondary: 'شاهد بطولة جارية',

    stepsTitle: 'كيف تعمل',
    steps: [
      {
        title: 'جهّز البطولة',
        body: 'جدول إقصائي أو نقاط، فردي أو فرق، مفتوحة للجميع أو بطلب انضمام. ست خطوات، خمس دقائق تقريباً.',
      },
      {
        title: 'انشرها',
        body: 'النشر مجاني وفوري. إلى أن تنشرها، أنت وحدك ترى البطولة.',
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
      'لا شيء حقيقياً. يعمل تورني برصيد تجريبي: ليس مالاً ولا يمكن صرفه، والدفع عندنا لا يقبل أي بطاقة. تصبح منظّماً مقابل ٢٠ رصيداً، ويمكن لأي شخص شحن رصيده مجاناً.',

    faqTitle: 'أسئلة تصلنا',
    faq: [
      {
        q: 'هل هناك مال حقيقي؟',
        a: 'لا. رسوم الاشتراك والجوائز رصيد تجريبي، يُحفظ في خزنة البطولة ويُدفع للفائزين، وليست له قيمة نقدية.',
      },
      {
        q: 'ماذا لو لم يسجّل أحد؟',
        a: 'ألغِ البطولة قبل أن تبدأ فتعود كل رسوم الاشتراك إلى من دفعها.',
      },
      {
        q: 'هل التطبيق بالعربية للّاعبين؟',
        a: 'ليس بعد. هذه الصفحة بالعربية، والتطبيق بالإنكليزية. إن كان هذا يعيق لاعبيك، أخبرنا ونقدّمه في الأولويات.',
      },
    ],

    closingTitle: 'عندك بطولة قريباً؟',
    closingBody: 'ابدأ التنظيم، أو تفرّج على بطولة جارية أولاً.',
    closingAction: 'ابدأ التنظيم',
  },
}
