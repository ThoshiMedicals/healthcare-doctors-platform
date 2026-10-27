import sharp from "sharp";
import path from "path";

const dir =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information/";
const out =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/crops/";
const jobs = [
  ["hotdoc-online-booking-day-night.png", "day-phone", { left: 1500, top: 60, width: 980, height: 1320 }],
  ["hotdoc-online-booking-screens.png", "screens", { left: 1100, top: 40, width: 1400, height: 1360 }],
  ["hotdoc-appointment-reminders.png", "remind", { left: 1450, top: 180, width: 1100, height: 1000 }],
  ["telehealth-consultations-poster.png", "tele", { left: 0, top: 0, width: 520, height: 900 }],
];
for (const [f, name, c] of jobs) {
  await sharp(dir + f).extract(c).png().toFile(out + name + ".png");
  console.log("wrote", name);
}
const jpgs = [
  "C:/Users/RoshanSamarawickrema/.cursor/projects/c-Users-RoshanSamarawickrema-Desktop-WMC-Master-Project/assets/c__Users_RoshanSamarawickrema_AppData_Roaming_Cursor_User_workspaceStorage_f72470ffe81ee1ab9bc9f3d6b0c2caeb_images_AOB-ef0b5396-061e-4f19-881d-cc6d935255ec.jpg",
  "C:/Users/RoshanSamarawickrema/.cursor/projects/c-Users-RoshanSamarawickrema-Desktop-WMC-Master-Project/assets/c__Users_RoshanSamarawickrema_AppData_Roaming_Cursor_User_workspaceStorage_f72470ffe81ee1ab9bc9f3d6b0c2caeb_images_Reminder_and_Recall_image-93f4fcda-517c-4d06-b132-8b2cea42a83b.jpg",
  "C:/Users/RoshanSamarawickrema/.cursor/projects/c-Users-RoshanSamarawickrema-Desktop-WMC-Master-Project/assets/c__Users_RoshanSamarawickrema_AppData_Roaming_Cursor_User_workspaceStorage_f72470ffe81ee1ab9bc9f3d6b0c2caeb_images_Identifying_scam_image-d71ba424-60d1-4605-bae7-48db30edd121.jpg",
];
for (const j of jpgs) {
  const m = await sharp(j).metadata();
  console.log(path.basename(j).slice(-48), m.width + "x" + m.height);
}
