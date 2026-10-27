/* Shared search alias inventory for Find a Guide and Digital Reception.
   Lead URLs are the agreed first answer for bare topic queries.
   Task phrases belong in Digital Reception, not the guide finder. */
(function (root) {
  'use strict';
  root.WMCSearchAliasInventory = {
    version: '2F',
    leads: {
      diabetes: {
        guideUrl: 'articles/living-with-diabetes.html',
        receptionUrl: 'knowledge/articles/living-with-diabetes.html',
        aliases: ['diabetes', 'diabetic', 'living with diabetes']
      },
      telehealth: {
        guideUrl: 'articles/when-can-i-use-telehealth.html',
        receptionUrl: 'knowledge/articles/when-can-i-use-telehealth.html',
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
      fees: {
        phrases: ['fees', 'fee', 'cost', 'pricing', 'billing'],
        query: 'fees'
      },
      referral: {
        phrases: ['referral', 'referrals', 'refer'],
        query: 'referral'
      },
      'repeat-script': {
        phrases: ['repeat script', 'repeat scripts', 'repeat prescription', 'repeat prescriptions', 'script renewal'],
        query: 'repeat script'
      },
      'new-patient': {
        phrases: ['new patient', 'new patients', 'i am new', 'new here', 'register', 'enrol', 'enroll'],
        query: 'new patient'
      },
      'hotdoc-message': {
        phrases: ['hotdoc message', 'hotdoc messages', 'hotdoc sms', 'hotdoc text', 'hotdoc scam'],
        query: 'hotdoc message'
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
