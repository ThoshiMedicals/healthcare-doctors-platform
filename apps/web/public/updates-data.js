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
    id: "welcome-dr-golnar-mortezaei",
    title: "Welcome Dr Golnar Mortezaei to Woolloongabba Medical Centre",
    category: "Practice Updates",
    published: "2026-11-06",
    dateLabel: "6 November 2026",
    summary: "We are pleased to welcome Dr Golnar Mortezaei to Woolloongabba Medical Centre. Dr Mortezaei is now accepting new patients and appointments can be booked online or by contacting our reception team.",
    metaTitle: "Welcome Dr Golnar Mortezaei | Woolloongabba Medical Centre",
    metaDescription: "Now welcoming new patients. Learn more about Dr Golnar Mortezaei and book an appointment online with Woolloongabba Medical Centre.",
    image: "welcome-dr-golnar-mortezaei",
    imageAlt: "Welcome Dr Golnar Mortezaei to Woolloongabba Medical Centre",
    author: "Practice Team",
    featured: true,
    tags: ["New Doctor", "General Practice", "Women's Health", "Woolloongabba Medical Centre"],
    sections: [
      {
        heading: "Introducing Dr Golnar Mortezaei",
        paragraphs: [
          "Dr Golnar Mortezaei (MD, FRACGP) is a General Practitioner at Woolloongabba Medical Centre. She is an experienced General Practitioner with over 25 years of medical experience and is dedicated to providing personalised, compassionate healthcare through a collaborative, patient-centred approach.",
          "Dr Golnar speaks English and Persian (Farsi)."
        ]
      },
      {
        heading: "Areas of Interest",
        list: [
          "Veterans' health",
          "Chronic disease management and prevention",
          "Diabetes",
          "Heart disease",
          "COPD",
          "Osteoarthritis and osteoporosis"
        ]
      },
      {
        heading: "Welcoming New Patients",
        paragraphs: [
          "Dr Golnar Mortezaei is accepting new patients at Woolloongabba Medical Centre. If you are looking for a GP who can support ongoing primary care, chronic disease management or veterans' health needs, our reception team can help you book a suitable appointment."
        ]
      },
      {
        heading: "Booking Appointments",
        paragraphs: [
          "Appointments can be booked online through HotDoc or by contacting our reception team on (07) 3217 3344. Reception can also help you choose the most appropriate appointment type."
        ],
        ctas: [
          {
            href: "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox",
            label: "Book Appointment Online"
          },
          {
            href: "tel:+61732173344",
            label: "Call Reception",
            style: "text-link"
          },
          {
            href: "../contact.html",
            label: "Contact the practice",
            style: "text-link"
          }
        ]
      },
      {
        heading: "Learn More About Dr Golnar",
        paragraphs: [
          "Read Dr Golnar Mortezaei’s practitioner profile for qualifications, languages and clinical interests, or browse the full GP directory to explore the wider team."
        ],
        ctas: [
          {
            href: "../doctors/dr-golnar-mortezaei.html",
            label: "View Dr Golnar’s profile"
          },
          {
            href: "../team-general-practitioners.html",
            label: "Doctor directory",
            style: "text-link"
          }
        ]
      }
    ]
  },
  {
    id: "welcome-dr-james-chanaka",
    title: "Welcome Dr James Chanaka to Woolloongabba Medical Centre",
    category: "Practice Updates",
    published: "2026-11-06",
    dateLabel: "6 November 2026",
    summary: "We are pleased to welcome Dr James Chanaka to Woolloongabba Medical Centre. Dr Chanaka is now accepting new patients and appointments can be booked online or by contacting our reception team.",
    metaTitle: "Welcome Dr James Chanaka | Woolloongabba Medical Centre",
    metaDescription: "Now welcoming new patients. Learn more about Dr James Chanaka and book an appointment online with Woolloongabba Medical Centre.",
    image: "welcome-dr-james-chanaka",
    imageAlt: "Welcome Dr James Chanaka to Woolloongabba Medical Centre",
    author: "Practice Team",
    featured: true,
    tags: ["New Doctor", "General Practice", "Family Medicine", "Woolloongabba Medical Centre"],
    sections: [
      {
        heading: "Introducing Dr James Chanaka",
        paragraphs: [
          "Dr James is an experienced General Practitioner who holds a Bachelor of Medicine from the University of Zimbabwe and is a Fellow of the Royal Australian College of General Practitioners (FRACGP). He focuses on comprehensive, compassionate and patient-centred medical care for individuals and families.",
          "Fluent in English and Shona, Dr James is committed to providing accessible and culturally sensitive healthcare to patients from diverse backgrounds."
        ]
      },
      {
        heading: "Areas of Interest",
        list: [
          "Children's health",
          "Mental health",
          "Family medicine"
        ]
      },
      {
        heading: "Welcoming New Patients",
        paragraphs: [
          "Dr James Chanaka is accepting new patients at Woolloongabba Medical Centre. Families and individuals looking for ongoing GP care — including children’s health and mental health support — are welcome to book with our team."
        ]
      },
      {
        heading: "Booking Appointments",
        paragraphs: [
          "Appointments can be booked online through HotDoc or by contacting our reception team on (07) 3217 3344. Reception can also help you choose the most appropriate appointment type."
        ],
        ctas: [
          {
            href: "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox",
            label: "Book Appointment Online"
          },
          {
            href: "tel:+61732173344",
            label: "Call Reception",
            style: "text-link"
          },
          {
            href: "../contact.html",
            label: "Contact the practice",
            style: "text-link"
          }
        ]
      },
      {
        heading: "Learn More About Dr James",
        paragraphs: [
          "Read Dr James Chanaka’s practitioner profile for qualifications, languages and clinical interests, or browse the full GP directory to explore the wider team."
        ],
        ctas: [
          {
            href: "../doctors/dr-james.html",
            label: "View Dr James’s profile"
          },
          {
            href: "../team-general-practitioners.html",
            label: "Doctor directory",
            style: "text-link"
          }
        ]
      }
    ]
  },
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
    featured: false,
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
