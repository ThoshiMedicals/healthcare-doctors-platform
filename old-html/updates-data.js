/*
  LATEST HEALTH & PRACTICE UPDATES
  --------------------------------
  Add future updates to the PRACTICE_UPDATES array below.
  Required fields:
  id, title, category, published, dateLabel, summary, image, imageAlt, author, featured, sections.
  CMS-ready governance fields may also include status, reviewStatus, reviewedBy, lastReviewed, updatedAt and audience.
  The homepage, update archive and individual article template all render from this one data source.
*/
window.UPDATE_CATEGORIES = [
  "Practice Updates",
  "Patient Education",
  "Service Information",
  "Clinical Governance",
  "Community Health Information"
];

window.PRACTICE_UPDATES = [
  {
    id: "new-patients-welcome",
    title: "New patients are welcome",
    category: "Patient Education",
    published: "2026-10-01",
    dateLabel: "1 October 2026",
    summary: "A clear guide to booking your first appointment, what to bring and what to expect when you arrive.",
    image: "new-patients-welcome",
    imageAlt: "New patients are welcome at Woolloongabba Medical Centre",
    author: "Practice Team",
    featured: true,
    sections: [
      {
        heading: "Starting care with us",
        paragraphs: [
          "New patients are welcome at Woolloongabba Medical Centre. Our aim is to make the first visit straightforward, comfortable and well organised.",
          "Appointments can be booked online through HotDoc or by calling reception. Please bring your Medicare card or Medicare number and any health information that may help your practitioner understand the reason for your visit."
        ]
      },
      {
        heading: "Before you arrive",
        list: [
          "Allow a little extra time so reception can confirm your details.",
          "Bring your current Medicare information and any relevant concession card.",
          "Bring a current medication list, referral letter or recent reports if they are relevant to your care.",
          "Contact reception before attending if you have mobility or access needs."
        ]
      },
      {
        heading: "Billing",
        paragraphs: [
          "Woolloongabba Medical Centre provides 100% Medicare bulk billing for standard Medicare-eligible general practice consultations for patients with a valid Medicare card. Fees may apply to procedures, reports, employment or occupational medicals and other non-Medicare services. Where a fee applies, patients are advised in advance wherever practical."
        ]
      }
    ]
  },
  {
    id: "current-billing-information",
    title: "Current billing information",
    category: "Practice Updates",
    published: "2026-10-01",
    dateLabel: "1 October 2026",
    summary: "An overview of 100% Medicare bulk billing for standard Medicare-eligible general practice consultations and the services where separate fees may apply.",
    image: "clinic-exterior",
    imageAlt: "Woolloongabba Medical Centre on Vulture Street",
    author: "Practice Team",
    featured: false,
    sections: [
      {
        heading: "Medicare bulk billing at Woolloongabba Medical Centre",
        paragraphs: [
          "Woolloongabba Medical Centre provides 100% Medicare bulk billing for standard Medicare-eligible general practice consultations for patients with a valid Medicare card."
        ]
      },
      {
        heading: "Services where fees may apply",
        list: [
          "Procedures.",
          "Medical reports.",
          "Employment or occupational medicals.",
          "Other non-Medicare services."
        ]
      },
      {
        heading: "Before your appointment",
        paragraphs: [
          "If you are unsure whether a fee will apply, please contact reception before your appointment. Additional fees may apply to procedures, medical reports, occupational or employment medicals and other non-Medicare services."
        ]
      }
    ]
  },
  {
    id: "telehealth-appointments",
    title: "Telehealth appointments",
    category: "Service Information",
    published: "2026-10-01",
    dateLabel: "1 October 2026",
    summary: "Telehealth can support continuity when a face-to-face visit is not required and the consultation is clinically suitable.",
    image: "telehealth-poster",
    imageAlt: "Telehealth consultations at Woolloongabba Medical Centre",
    author: "Practice Team",
    featured: false,
    sections: [
      {
        heading: "When telehealth may be appropriate",
        paragraphs: [
          "Telehealth may be available where offered and clinically appropriate. A practitioner may recommend an in-person consultation if examination, testing or treatment cannot be provided safely by phone or video."
        ]
      },
      {
        heading: "Booking",
        paragraphs: [
          "Use the available HotDoc appointment options or contact reception if you are unsure whether telehealth is suitable for the reason for your appointment."
        ]
      },
      {
        heading: "Medicare eligibility",
        paragraphs: [
          "Medicare eligibility for general practice telehealth depends on current Medicare rules and your relationship with our practice. Our reception team can help clarify the billing arrangement before your appointment."
        ]
      }
    ]
  },
  {
    id: "open-seven-days",
    title: "Appointments available seven days a week",
    category: "Practice Updates",
    published: "2026-10-01",
    dateLabel: "1 October 2026",
    summary: "We are open seven days, including Saturday and Sunday appointments.",
    image: "clinic-exterior",
    imageAlt: "Woolloongabba Medical Centre on Vulture Street",
    author: "Practice Team",
    featured: false,
    sections: [
      {
        heading: "Current opening hours",
        list: [
          "Monday to Thursday: 7:00am–7:00pm",
          "Friday: 8:00am–5:00pm",
          "Saturday: 9:00am–5:00pm",
          "Sunday: 9:00am–3:00pm"
        ]
      },
      {
        heading: "Booking",
        paragraphs: [
          "Appointments can be booked through HotDoc or by speaking with reception. Availability varies by practitioner and appointment type."
        ]
      }
    ]
  },
  {
    id: "after-hours-care-options",
    title: "After-hours care when we are closed",
    category: "Patient Education",
    published: "2026-10-01",
    dateLabel: "1 October 2026",
    summary: "Know where to seek help after hours and when emergency care is required.",
    image: "clinic-exterior",
    imageAlt: "Woolloongabba Medical Centre exterior",
    author: "Practice Team",
    featured: false,
    sections: [
      {
        heading: "After-hours medical help",
        paragraphs: [
          "When we are closed, patients who need after-hours medical assistance can contact Hello Home Doctor on 134 100."
        ]
      },
      {
        heading: "Health advice in Queensland",
        paragraphs: [
          "13 HEALTH is available on 13 43 25 84 for health assessment and advice from registered nurses."
        ]
      },
      {
        heading: "Emergency care",
        paragraphs: [
          "For a life-threatening illness or injury, call Triple Zero (000) and ask for an ambulance."
        ]
      }
    ]
  }
];
