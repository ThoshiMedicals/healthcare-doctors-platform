/* Knowledge Centre guide finder.
   Matches article titles, headings, and the approved alias list only.
   It does not read article body text, practitioner profiles, or booking links.
   Certificate and driver-medical phrases route to the published Patient Forms
   and Medical Procedures pages. */
(function (root) {
  'use strict';
  var GUIDES = [
  {
    "title": "ADHD Assessment Pathways",
    "heading": "ADHD Assessment Pathways",
    "hub": "ADHD & Neurodiversity",
    "url": "articles/adhd-assessment-pathways.html",
    "aliases": [
      "attention deficit"
    ]
  },
  {
    "title": "Anxiety vs Stress: What Is The Difference?",
    "heading": "Anxiety vs Stress",
    "hub": "Mental Health",
    "url": "articles/anxiety-vs-stress-what-is-the-difference.html",
    "aliases": []
  },
  {
    "title": "Back Pain: When Should I See A GP?",
    "heading": "Back Pain: When to See a GP",
    "hub": "Pain & Musculoskeletal Health",
    "url": "articles/back-pain-when-should-i-see-a-gp.html",
    "aliases": []
  },
  {
    "title": "Blood Pressure Explained",
    "heading": "Blood Pressure Explained: GP Checks",
    "hub": "Chronic Disease Management",
    "url": "articles/blood-pressure-explained.html",
    "aliases": [
      "hypertension"
    ]
  },
  {
    "title": "Breast Health: Changes, Screening & When To See A GP",
    "heading": "Breast Changes & Screening: When to See a GP",
    "hub": "Women's Health",
    "url": "articles/breast-health-changes-screening-when-to-see-a-gp.html",
    "aliases": [
      "mammogram",
      "breast screening"
    ]
  },
  {
    "title": "Childhood Vaccinations Explained",
    "heading": "Childhood Vaccinations",
    "hub": "Children's Health",
    "url": "articles/childhood-vaccinations-explained.html",
    "aliases": [
      "immunisation",
      "immunization"
    ]
  },
  {
    "title": "Children's Preventive Healthcare",
    "heading": "Children's Preventive Care",
    "hub": "Children's Health",
    "url": "articles/childrens-preventive-healthcare.html",
    "aliases": []
  },
  {
    "title": "Cholesterol Explained",
    "heading": "Cholesterol Explained",
    "hub": "Blood Pressure & Heart Health",
    "url": "articles/cholesterol-explained.html",
    "aliases": [
      "lipids"
    ]
  },
  {
    "title": "Chronic Pain: When Should I Seek Help?",
    "heading": "Chronic Pain: When Should I Seek Help?",
    "hub": "Pain & Musculoskeletal Health",
    "url": "articles/chronic-pain-when-should-i-seek-help.html",
    "aliases": []
  },
  {
    "title": "Common Childhood Illnesses",
    "heading": "Childhood Illness Guide",
    "hub": "Children's Health",
    "url": "articles/common-childhood-illnesses.html",
    "aliases": []
  },
  {
    "title": "Diabetes Care Plans Explained",
    "heading": "Diabetes Care Plans Explained",
    "hub": "Diabetes & Ongoing Care",
    "url": "articles/diabetes-care-plans-explained.html",
    "aliases": []
  },
  {
    "title": "Diabetes Monitoring Explained",
    "heading": "Diabetes Monitoring Explained",
    "hub": "Diabetes & Ongoing Care",
    "url": "articles/diabetes-monitoring-explained.html",
    "aliases": []
  },
  {
    "title": "Health Assessments Explained",
    "heading": "GP Health Assessments",
    "hub": "Preventive Healthcare",
    "url": "articles/health-assessments-explained.html",
    "aliases": []
  },
  {
    "title": "Health Checks Every Man Should Consider",
    "heading": "Men’s Health Checks",
    "hub": "Men's Health",
    "url": "articles/health-checks-every-man-should-consider.html",
    "aliases": []
  },
  {
    "title": "Healthy Ageing For Men",
    "heading": "Healthy Ageing For Men",
    "hub": "Men's Health",
    "url": "articles/healthy-ageing-for-men.html",
    "aliases": []
  },
  {
    "title": "Healthy Ageing: Prevention, Falls, Vaccination & Reviews",
    "heading": "Healthy Ageing: Falls, Vaccines & GP Reviews",
    "hub": "Healthy Ageing",
    "url": "articles/healthy-ageing-prevention-falls-vaccination-reviews.html",
    "aliases": []
  },
  {
    "title": "Healthy Weight Management",
    "heading": "Healthy Weight Management",
    "hub": "Weight & Healthy Lifestyle",
    "url": "articles/healthy-weight-management.html",
    "aliases": []
  },
  {
    "title": "Heart Health Checks",
    "heading": "Heart Health Checks",
    "hub": "Blood Pressure & Heart Health",
    "url": "articles/heart-health-checks.html",
    "aliases": []
  },
  {
    "title": "Heart Health For Men",
    "heading": "Heart Health For Men",
    "hub": "Men's Health",
    "url": "articles/heart-health-for-men.html",
    "aliases": []
  },
  {
    "title": "High Blood Pressure Explained",
    "heading": "High Blood Pressure Explained",
    "hub": "Blood Pressure & Heart Health",
    "url": "articles/high-blood-pressure-explained.html",
    "aliases": [
      "hypertension"
    ]
  },
  {
    "title": "How Can A GP Help With Depression?",
    "heading": "How a GP Can Help With Depression",
    "hub": "Mental Health",
    "url": "articles/how-can-a-gp-support-depression.html",
    "aliases": []
  },
  {
    "title": "How Telehealth Works",
    "heading": "How GP Telehealth Works",
    "hub": "Telehealth & Access To Care",
    "url": "articles/how-telehealth-works.html",
    "aliases": []
  },
  {
    "title": "HRT Discussions With Your GP",
    "heading": "HRT Discussions With Your GP",
    "hub": "Menopause & Midlife Health",
    "url": "articles/hrt-discussions-with-your-gp.html",
    "aliases": [
      "hormone replacement",
      "menopausal hormone therapy"
    ]
  },
  {
    "title": "Influenza Vaccination: Who Should Consider It?",
    "heading": "Influenza Vaccination: Who Needs a Flu Shot?",
    "hub": "Vaccinations",
    "url": "articles/influenza-vaccination-who-should-consider-it.html",
    "aliases": [
      "flu shot",
      "flu vaccine"
    ]
  },
  {
    "title": "Is My Sore Throat Viral Or Bacterial?",
    "heading": "Viral or Bacterial Sore Throat?",
    "hub": "Cough & Sore Throat",
    "url": "articles/is-my-sore-throat-viral-or-bacterial.html",
    "aliases": [
      "strep throat"
    ]
  },
  {
    "title": "Living With Diabetes: GP Monitoring & Long-Term Management",
    "heading": "Living With Diabetes: GP Care & Monitoring",
    "hub": "Chronic Disease Management",
    "url": "articles/living-with-diabetes-gp-monitoring-long-term-management.html",
    "aliases": []
  },
  {
    "title": "Living With Diabetes",
    "heading": "Living With Diabetes",
    "hub": "Diabetes & Ongoing Care",
    "url": "articles/living-with-diabetes.html",
    "aliases": [
      "diabetes",
      "diabetic",
      "living with diabetes"
    ]
  },
  {
    "title": "Managing Asthma",
    "heading": "Managing Asthma: GP Reviews & Action Plans",
    "hub": "Chronic Disease Management",
    "url": "articles/managing-asthma.html",
    "aliases": []
  },
  {
    "title": "Managing Winter Respiratory Illness",
    "heading": "Managing Winter Respiratory Illness",
    "hub": "Children's Health",
    "url": "articles/managing-winter-respiratory-illness.html",
    "aliases": []
  },
  {
    "title": "Menopause Symptoms Explained",
    "heading": "Menopause Symptoms Explained",
    "hub": "Menopause & Midlife Health",
    "url": "articles/menopause-symptoms-explained.html",
    "aliases": []
  },
  {
    "title": "Mental Health & Menopause",
    "heading": "Mental Health & Menopause",
    "hub": "Menopause & Midlife Health",
    "url": "articles/mental-health-and-menopause.html",
    "aliases": []
  },
  {
    "title": "Migraine Or Headache: How Do I Tell The Difference?",
    "heading": "Migraine or Headache? How to Tell the Difference",
    "hub": "Headache & Migraine",
    "url": "articles/migraine-or-headache-how-do-i-tell-the-difference.html",
    "aliases": []
  },
  {
    "title": "Planning A Pregnancy",
    "heading": "Planning A Pregnancy",
    "hub": "Pregnancy & Antenatal Care",
    "url": "articles/planning-a-pregnancy.html",
    "aliases": [
      "preconception",
      "trying for a baby"
    ]
  },
  {
    "title": "Preparing For Your Child's First GP Appointment",
    "heading": "Your Child's First GP Visit",
    "hub": "Children's Health",
    "url": "articles/preparing-for-your-childs-first-gp-appointment.html",
    "aliases": []
  },
  {
    "title": "Preventing Diabetes Complications",
    "heading": "Preventing Diabetes Complications",
    "hub": "Diabetes & Ongoing Care",
    "url": "articles/preventing-diabetes-complications.html",
    "aliases": []
  },
  {
    "title": "Preventive Women's Healthcare",
    "heading": "Women's Preventive Care",
    "hub": "Women's Health",
    "url": "articles/preventive-womens-healthcare.html",
    "aliases": []
  },
  {
    "title": "Protecting Your Skin From The Queensland Sun",
    "heading": "Queensland Sun Protection",
    "hub": "Skin Health & Skin Cancer",
    "url": "articles/protecting-your-skin-from-the-queensland-sun.html",
    "aliases": []
  },
  {
    "title": "Sleep Problems Explained",
    "heading": "Sleep Problems Explained",
    "hub": "Sleep & Fatigue",
    "url": "articles/sleep-problems-explained.html",
    "aliases": [
      "insomnia",
      "sleep apnoea",
      "sleep apnea"
    ]
  },
  {
    "title": "Sore Throat: When Should I See A Doctor?",
    "heading": "Sore Throat: When Should I See A Doctor?",
    "hub": "Cough & Sore Throat",
    "url": "articles/sore-throat-when-should-i-see-a-doctor.html",
    "aliases": []
  },
  {
    "title": "Staying Healthy As You Age",
    "heading": "Healthy Ageing Advice",
    "hub": "Preventive Healthcare",
    "url": "articles/staying-healthy-as-you-age.html",
    "aliases": []
  },
  {
    "title": "Telehealth vs Face-To-Face Appointments",
    "heading": "Telehealth or Face-to-Face GP?",
    "hub": "Telehealth & Access To Care",
    "url": "articles/telehealth-vs-face-to-face-appointments.html",
    "aliases": []
  },
  {
    "title": "Travel Vaccinations Before Overseas Travel",
    "heading": "Travel Vaccinations Before Overseas Travel",
    "hub": "Vaccinations",
    "url": "articles/travel-vaccinations-before-overseas-travel.html",
    "aliases": []
  },
  {
    "title": "Understanding ADHD Referrals",
    "heading": "Understanding ADHD Referrals",
    "hub": "ADHD & Neurodiversity",
    "url": "articles/understanding-adhd-referrals.html",
    "aliases": [
      "attention deficit"
    ]
  },
  {
    "title": "Understanding Cholesterol",
    "heading": "Understanding Cholesterol & Heart Risk",
    "hub": "Chronic Disease Management",
    "url": "articles/understanding-cholesterol.html",
    "aliases": [
      "lipids"
    ]
  },
  {
    "title": "Understanding GP Chronic Disease Care Plans",
    "heading": "GP Chronic Care Plans Explained",
    "hub": "Chronic Disease Management",
    "url": "articles/understanding-gp-chronic-disease-care-plans.html",
    "aliases": []
  },
  {
    "title": "Understanding Healthy Lifestyle Changes",
    "heading": "Understanding Healthy Lifestyle Changes",
    "hub": "Weight & Healthy Lifestyle",
    "url": "articles/understanding-healthy-lifestyle-changes.html",
    "aliases": []
  },
  {
    "title": "Understanding Menopause",
    "heading": "Understanding Menopause",
    "hub": "Women's Health",
    "url": "articles/understanding-menopause.html",
    "aliases": []
  },
  {
    "title": "Understanding Muscle And Joint Pain",
    "heading": "Muscle & Joint Pain Explained",
    "hub": "Pain & Musculoskeletal Health",
    "url": "articles/understanding-muscle-and-joint-pain.html",
    "aliases": []
  },
  {
    "title": "Understanding Neck Pain",
    "heading": "Neck Pain: When to See a GP",
    "hub": "Pain & Musculoskeletal Health",
    "url": "articles/understanding-neck-pain.html",
    "aliases": []
  },
  {
    "title": "Understanding Perimenopause",
    "heading": "Perimenopause Guide",
    "hub": "Women's Health",
    "url": "articles/understanding-perimenopause.html",
    "aliases": [
      "perimenopause"
    ]
  },
  {
    "title": "Understanding Prostate Health",
    "heading": "Prostate Health Guide",
    "hub": "Men's Health",
    "url": "articles/understanding-prostate-health.html",
    "aliases": [
      "psa test"
    ]
  },
  {
    "title": "Understanding Skin Cancer Risks",
    "heading": "Skin Cancer Risks",
    "hub": "Skin Health & Skin Cancer",
    "url": "articles/understanding-skin-cancer-risks.html",
    "aliases": []
  },
  {
    "title": "Understanding Type 2 Diabetes",
    "heading": "Understanding Type 2 Diabetes",
    "hub": "Diabetes & Ongoing Care",
    "url": "articles/understanding-type-2-diabetes.html",
    "aliases": []
  },
  {
    "title": "Understanding Your Cardiovascular Risk",
    "heading": "Understanding Cardiovascular Risk",
    "hub": "Blood Pressure & Heart Health",
    "url": "articles/understanding-your-cardiovascular-risk.html",
    "aliases": []
  },
  {
    "title": "Vaccinations For Adults",
    "heading": "Vaccinations For Adults",
    "hub": "Preventive Healthcare",
    "url": "articles/vaccinations-for-adults.html",
    "aliases": [
      "immunisation",
      "immunization"
    ]
  },
  {
    "title": "What Causes A Persistent Cough?",
    "heading": "What Causes a Persistent Cough?",
    "hub": "Cough & Sore Throat",
    "url": "articles/what-causes-a-persistent-cough.html",
    "aliases": []
  },
  {
    "title": "What Causes Frequent Headaches?",
    "heading": "What Causes Frequent Headaches?",
    "hub": "Headache & Migraine",
    "url": "articles/what-causes-frequent-headaches.html",
    "aliases": []
  },
  {
    "title": "What Happens During A Mental Health Care Plan?",
    "heading": "Mental Health Care Plans",
    "hub": "Mental Health",
    "url": "articles/what-happens-during-a-mental-health-care-plan.html",
    "aliases": []
  },
  {
    "title": "What Happens During Antenatal Care?",
    "heading": "What Happens During Antenatal Care?",
    "hub": "Pregnancy & Antenatal Care",
    "url": "articles/what-happens-during-antenatal-care.html",
    "aliases": [
      "maternity care"
    ]
  },
  {
    "title": "What Is Preventive Healthcare?",
    "heading": "What Is Preventive Care?",
    "hub": "Preventive Healthcare",
    "url": "articles/what-is-preventive-healthcare.html",
    "aliases": []
  },
  {
    "title": "When Can I Use Telehealth?",
    "heading": "When Can I Use Telehealth?",
    "hub": "Telehealth & Access To Care",
    "url": "articles/when-can-i-use-telehealth.html",
    "aliases": [
      "telehealth",
      "video appointment",
      "video appointments",
      "phone appointment",
      "phone appointments",
      "video call",
      "video calls",
      "phone consult",
      "phone consults",
      "virtual appointment",
      "virtual appointments"
    ]
  },
  {
    "title": "When Is A Headache An Emergency?",
    "heading": "When Is a Headache an Emergency?",
    "hub": "Headache & Migraine",
    "url": "articles/when-is-a-headache-an-emergency.html",
    "aliases": []
  },
  {
    "title": "When Should A Child With A Cough See A GP?",
    "heading": "When Should A Child With A Cough See A GP?",
    "hub": "Cough & Sore Throat",
    "url": "articles/when-should-a-child-with-a-cough-see-a-gp.html",
    "aliases": [
      "child cough",
      "toddler cough"
    ]
  },
  {
    "title": "When Should I Be Concerned About A Fever?",
    "heading": "Childhood Fever Guide",
    "hub": "Children's Health",
    "url": "articles/when-should-i-be-concerned-about-a-fever.html",
    "aliases": []
  },
  {
    "title": "When Should I Be Concerned About Blood Pressure?",
    "heading": "When Should I Be Concerned About Blood Pressure?",
    "hub": "Blood Pressure & Heart Health",
    "url": "articles/when-should-i-be-concerned-about-blood-pressure.html",
    "aliases": [
      "hypertension"
    ]
  },
  {
    "title": "When Should I Be Concerned About Pain?",
    "heading": "When Should I Be Concerned About Pain?",
    "hub": "Pain & Musculoskeletal Health",
    "url": "articles/when-should-i-be-concerned-about-pain.html",
    "aliases": []
  },
  {
    "title": "When Should I Book A Skin Check?",
    "heading": "When to Book a Skin Check",
    "hub": "Skin Health & Skin Cancer",
    "url": "articles/when-should-i-book-a-skin-check.html",
    "aliases": []
  },
  {
    "title": "When Should I Have A Cervical Screening Test?",
    "heading": "Cervical Screening Guide",
    "hub": "Women's Health",
    "url": "articles/when-should-i-have-a-cervical-screening-test.html",
    "aliases": [
      "pap smear",
      "pap test"
    ]
  },
  {
    "title": "When Should I See A GP About Headaches?",
    "heading": "When Should I See A GP About Headaches?",
    "hub": "Headache & Migraine",
    "url": "articles/when-should-i-see-a-gp-about-headaches.html",
    "aliases": []
  },
  {
    "title": "When Should I Seek ADHD Assessment?",
    "heading": "When to Seek ADHD Assessment",
    "hub": "ADHD & Neurodiversity",
    "url": "articles/when-should-i-seek-adhd-assessment.html",
    "aliases": [
      "attention deficit"
    ]
  },
  {
    "title": "When Should I Seek Help For Burnout?",
    "heading": "Burnout: When to Seek Help",
    "hub": "Mental Health",
    "url": "articles/when-should-i-seek-help-for-burnout.html",
    "aliases": []
  },
  {
    "title": "When Should I Speak To A GP About Anxiety?",
    "heading": "GP Advice for Anxiety",
    "hub": "Mental Health",
    "url": "articles/when-should-i-speak-to-a-gp-about-anxiety.html",
    "aliases": []
  },
  {
    "title": "When Should I Speak To A GP About Sleep?",
    "heading": "When Should I Speak To A GP About Sleep?",
    "hub": "Sleep & Fatigue",
    "url": "articles/when-should-i-speak-to-a-gp-about-sleep.html",
    "aliases": []
  },
  {
    "title": "When Should I Speak To A GP About Weight?",
    "heading": "When Should I Speak To A GP About Weight?",
    "hub": "Weight & Healthy Lifestyle",
    "url": "articles/when-should-i-speak-to-a-gp-about-weight.html",
    "aliases": []
  },
  {
    "title": "Why Am I Always Tired?",
    "heading": "Why Am I Always Tired?",
    "hub": "Sleep & Fatigue",
    "url": "articles/why-am-i-always-tired.html",
    "aliases": [
      "fatigue",
      "tiredness"
    ]
  },
  {
    "title": "Why Preventive Healthcare Matters",
    "heading": "Why Preventive Care Matters",
    "hub": "Men's Health",
    "url": "articles/why-preventive-healthcare-matters.html",
    "aliases": []
  },
  {
    "title": "Why Regular Check-Ups Matter",
    "heading": "Why GP Check-Ups Matter",
    "hub": "Preventive Healthcare",
    "url": "articles/why-regular-check-ups-matter.html",
    "aliases": []
  },
  {
    "title": "Why Skin Checks Matter In Australia",
    "heading": "Why Skin Checks Matter",
    "hub": "Skin Health & Skin Cancer",
    "url": "articles/why-skin-checks-matter-in-australia.html",
    "aliases": []
  },
  {
    "title": "Why Won’t My Cough Go Away?",
    "heading": "Why Won’t My Cough Go Away?",
    "hub": "Cough & Sore Throat",
    "url": "articles/why-won-t-my-cough-go-away.html",
    "aliases": []
  },
  {
    "title": "Women's Health Checks At Different Stages Of Life",
    "heading": "Women's Health by Age",
    "hub": "Women's Health",
    "url": "articles/womens-health-checks-at-different-stages-of-life.html",
    "aliases": []
  },
  {
    "title": "Your First Pregnancy GP Appointment",
    "heading": "First Pregnancy GP Appointment",
    "hub": "Pregnancy & Antenatal Care",
    "url": "articles/your-first-pregnancy-gp-appointment.html",
    "aliases": []
  },
  {
    "title": "Is A Water Infection The Same As A UTI?",
    "heading": "Is A Water Infection The Same As A UTI?",
    "hub": "Symptoms & Everyday Concerns",
    "url": "articles/is-a-water-infection-the-same-as-a-uti.html",
    "aliases": ["uti", "urinary tract infection", "water infection", "wee infection", "bladder infection"]
  },
  {
    "title": "Is Hay Fever A Fever?",
    "heading": "Is Hay Fever A Fever?",
    "hub": "Symptoms & Everyday Concerns",
    "url": "articles/is-hay-fever-a-fever.html",
    "aliases": ["hay fever", "hayfever", "allergic rhinitis"]
  },
  {
    "title": "What Are School Sores?",
    "heading": "What Are School Sores?",
    "hub": "Children's Health",
    "url": "articles/what-are-school-sores.html",
    "aliases": ["school sores", "school sore", "impetigo"]
  },
  {
    "title": "Is A Tummy Bug The Same As Gastro?",
    "heading": "Is A Tummy Bug The Same As Gastro?",
    "hub": "Symptoms & Everyday Concerns",
    "url": "articles/is-a-tummy-bug-the-same-as-gastro.html",
    "aliases": ["gastro", "gastroenteritis", "stomach bug", "tummy bug", "gastro bug"]
  },
  {
    "title": "Is This Thrush?",
    "heading": "Is This Thrush?",
    "hub": "Women's Health",
    "url": "articles/is-this-thrush.html",
    "aliases": ["thrush", "vaginal thrush"]
  },
  {
    "title": "Is This Sinus?",
    "heading": "Is This Sinus?",
    "hub": "Symptoms & Everyday Concerns",
    "url": "articles/is-this-sinus.html",
    "aliases": ["sinus", "sinusitis", "sinus infection", "sinus problems", "sinus pain", "blocked sinuses"]
  }
];
  var UNPUBLISHED = [];
  var STOP = {a:1,an:1,the:1,of:1,and:1,or:1,to:1,for:1,my:1,me:1,i:1,is:1,am:1,are:1,be:1,when:1,should:1,would:1,could:1,about:1,with:1,how:1,what:1,do:1,does:1,can:1,see:1,speak:1,talk:1,your:1,from:1,have:1,has:1,this:1,that:1,why:1,who:1,not:1,health:1,guide:1,guides:1};
  var LIMIT = 8;
  /* Fallback mirrors search-alias-inventory.js when that file is not yet loaded. */
  var FALLBACK_INVENTORY = {
    leads: {
      diabetes: {
        guideUrl: 'articles/living-with-diabetes.html',
        aliases: ['diabetes', 'diabetic', 'living with diabetes']
      },
      telehealth: {
        guideUrl: 'articles/when-can-i-use-telehealth.html',
        aliases: [
          'telehealth',
          'video appointment',
          'video appointments',
          'phone appointment',
          'phone appointments',
          'video call',
          'video calls',
          'phone consult',
          'phone consults',
          'virtual appointment',
          'virtual appointments'
        ]
      }
    },
    tasks: {
      fees: { phrases: ['fees', 'fee', 'cost', 'pricing', 'billing'], query: 'fees' },
      referral: { phrases: ['referral', 'referrals', 'refer'], query: 'referral' },
      'repeat-script': { phrases: ['repeat script', 'repeat scripts', 'repeat prescription', 'repeat prescriptions', 'script renewal'], query: 'repeat script' },
      'new-patient': { phrases: ['new patient', 'new patients', 'i am new', 'new here', 'register', 'enrol', 'enroll'], query: 'new patient' },
      'hotdoc-message': { phrases: ['hotdoc message', 'hotdoc messages', 'hotdoc sms', 'hotdoc text', 'hotdoc scam'], query: 'hotdoc message' }
    }
  };

  function getInventory() {
    return root.WMCSearchAliasInventory || FALLBACK_INVENTORY;
  }
  function applyInventoryAliases() {
    var inv = getInventory();
    if (!inv || !inv.leads) return;
    Object.keys(inv.leads).forEach(function (key) {
      var lead = inv.leads[key];
      GUIDES.forEach(function (guide) {
        if (guide.url !== lead.guideUrl) return;
        (lead.aliases || []).forEach(function (alias) {
          if (guide.aliases.indexOf(alias) === -1) guide.aliases.push(alias);
        });
      });
    });
  }
  applyInventoryAliases();

  function normalise(value) {
    return String(value || '').toLowerCase().replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function hasWord(text, word) {
    return (' ' + text + ' ').indexOf(' ' + word + ' ') !== -1;
  }
  function unpublished(query) {
    for (var i = 0; i < UNPUBLISHED.length; i++) {
      if (hasWord(query, UNPUBLISHED[i])) return true;
    }
    return false;
  }
  function searchable(guide) {
    return normalise([guide.title, guide.heading].concat(guide.aliases).join(' '));
  }
  var PUBLISHED_ROUTES = [
    { phrases: ['medical certificate for work', 'medical certificates', 'medical certificate', 'sick certificates', 'sick certificate', 'sick notes', 'sick note'], title: 'Patient Forms', hub: 'Medical certificates', url: '../patient-forms.html#medical-certificates' },
    { phrases: ['commercial driver medical', 'uber medical', 'rideshare medical', 'drivers medicals', 'driver medicals', 'drivers medical', 'driver medical'], title: 'Medical Procedures', hub: 'Healthcare Services', url: '../services/medical-procedures.html' }
  ];
  function publishedRoute(query) {
    for (var i = 0; i < PUBLISHED_ROUTES.length; i++) {
      var route = PUBLISHED_ROUTES[i];
      for (var j = 0; j < route.phrases.length; j++) {
        if (hasWord(query, route.phrases[j])) return route;
      }
    }
    return null;
  }
  function leadRankBoost(query, guide) {
    var inv = getInventory();
    if (!inv || !inv.leads) return 0;
    var keys = Object.keys(inv.leads);
    for (var i = 0; i < keys.length; i++) {
      var lead = inv.leads[keys[i]];
      if (guide.url !== lead.guideUrl) continue;
      for (var j = 0; j < (lead.aliases || []).length; j++) {
        if (query === normalise(lead.aliases[j])) return 4;
      }
    }
    return 0;
  }
  function taskHandoff(query) {
    var inv = getInventory();
    if (!inv || !inv.tasks) return null;
    var keys = Object.keys(inv.tasks);
    for (var i = 0; i < keys.length; i++) {
      var task = inv.tasks[keys[i]];
      for (var j = 0; j < (task.phrases || []).length; j++) {
        var phrase = normalise(task.phrases[j]);
        if (query === phrase || hasWord(query, phrase)) return task;
      }
    }
    return null;
  }
  function matchGuides(raw) {
    var query = normalise(raw);
    if (query.length < 2) return { state: 'idle', results: [] };
    var route = publishedRoute(query);
    if (route) return { state: 'results', results: [{ title: route.title, hub: route.hub, url: route.url }] };
    if (unpublished(query)) return { state: 'unpublished', results: [] };
    /* Exact task phrases belong in Digital Reception, not the guide finder. */
    var exactTask = taskHandoff(query);
    if (exactTask) {
      var inv = getInventory();
      var exactPhrase = false;
      if (inv && inv.tasks) {
        Object.keys(inv.tasks).forEach(function (key) {
          (inv.tasks[key].phrases || []).forEach(function (phrase) {
            if (query === normalise(phrase)) exactPhrase = true;
          });
        });
      }
      if (exactPhrase) return { state: 'task', results: [], task: exactTask };
    }
    var tokens = query.split(' ').filter(function (word) { return word.length >= 3 && !STOP[word]; });
    if (!tokens.length) return { state: 'idle', results: [] };
    var results = GUIDES.filter(function (guide) {
      var text = searchable(guide);
      return tokens.every(function (token) { return hasWord(text, token); });
    }).map(function (guide) {
      var title = normalise(guide.title);
      var heading = normalise(guide.heading);
      var rank = tokens.every(function (token) { return hasWord(title, token); }) ? 3 : tokens.every(function (token) { return hasWord(heading, token); }) ? 2 : 1;
      if (query === 'fever' && guide.url === 'articles/when-should-i-be-concerned-about-a-fever.html') rank += 4;
      rank += leadRankBoost(query, guide);
      return { guide: guide, rank: rank };
    }).sort(function (a, b) {
      return b.rank - a.rank || a.guide.title.localeCompare(b.guide.title);
    }).map(function (item) { return item.guide; });
    if (!results.length) {
      var task = exactTask || taskHandoff(query);
      if (task) return { state: 'task', results: [], task: task };
      return { state: 'empty', results: [] };
    }
    return { state: 'results', results: results };
  }

  root.WMCKnowledgeGuideSearch = { matchGuides: matchGuides, guides: GUIDES, getInventory: getInventory };

  if (!root.document) return;
  var form = root.document.querySelector('[data-knowledge-guide-search]');
  if (!form || form.dataset.guideSearchReady === 'true') return;
  form.dataset.guideSearchReady = 'true';
  var input = form.querySelector('input');
  var status = form.querySelector('[data-knowledge-guide-status]');
  var results = form.querySelector('[data-knowledge-guide-results]');
  if (!input || !status || !results) return;

  var label = form.querySelector('label[for="knowledge-guide-query"]');
  if (label && /find a guide/i.test(label.textContent.trim())) label.textContent = 'Search';

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function openReception(event, query) {
    event.preventDefault();
    if (root.WMCDigitalReception && typeof root.WMCDigitalReception.open === 'function') {
      root.WMCDigitalReception.open(query || '');
      return;
    }
    var launcher = root.document.querySelector('.digital-reception-launcher');
    if (launcher) launcher.click();
  }
  function render(raw) {
    var matched = matchGuides(raw);
    if (matched.state === 'idle') {
      status.textContent = input.value.trim() ? 'Type a little more of the guide title.' : '';
      results.innerHTML = '';
      return;
    }
    if (matched.state === 'unpublished') {
      status.textContent = 'No guide published yet.';
      results.innerHTML = '<p class="knowledge-guide-search-empty">No guide published yet.</p><p><a class="knowledge-guide-search-reception" href="#digital-reception">Digital Reception</a></p>';
      return;
    }
    if (matched.state === 'task') {
      var taskQuery = matched.task && matched.task.query ? matched.task.query : normalise(raw);
      status.textContent = 'Try Digital Reception for this request.';
      results.innerHTML = '<p class="knowledge-guide-search-empty">This looks like a clinic task, not a health guide.</p><p><a class="knowledge-guide-search-reception" href="#digital-reception" data-reception-query="' + escapeText(taskQuery) + '">Open Digital Reception</a></p>';
      return;
    }
    if (matched.state === 'empty') {
      status.textContent = 'No matching guide.';
      results.innerHTML = '<p class="knowledge-guide-search-empty">No matching guide.</p>';
      return;
    }
    var shown = matched.results.slice(0, LIMIT);
    var publishedPage = shown.length === 1 && shown[0].url.indexOf('../') === 0;
    status.textContent = publishedPage
      ? '1 page.'
      : matched.results.length > shown.length
      ? 'Showing ' + shown.length + ' of ' + matched.results.length + ' guides.'
      : shown.length + (shown.length === 1 ? ' guide.' : ' guides.');
    results.innerHTML = shown.map(function (guide) {
      return '<a class="knowledge-guide-result" href="' + escapeText(guide.url) + '"><strong>' + escapeText(guide.title) + '</strong><span>' + escapeText(guide.hub) + '</span></a>';
    }).join('');
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); render(input.value); });
  input.addEventListener('input', function () { render(input.value); });
  results.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('.knowledge-guide-search-reception');
    if (!link) return;
    openReception(event, link.getAttribute('data-reception-query') || '');
  });
  input.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowDown') return;
    var first = results.querySelector('a');
    if (!first) return;
    event.preventDefault();
    first.focus();
  });
})(typeof window !== 'undefined' ? window : globalThis);
