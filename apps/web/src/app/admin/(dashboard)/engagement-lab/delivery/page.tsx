import { requireAction } from "@/cms/context";
import { DEMO_DELIVERY, findDemoAnnouncement } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "../lab-chrome";

export default async function EngagementLabDeliveryPage() {
  await requireAction("edit");
  return (
    <EngagementLabChrome title="Delivery & engagement reporting">
      <p className="text-sm text-slate-600">
        Funnel stages use honest labels. Push accepted is not proof a person read the notice.
      </p>
      <div className="space-y-4">
        {DEMO_DELIVERY.map((funnel) => {
          const ann = findDemoAnnouncement(funnel.announcementId);
          return (
            <article key={funnel.announcementId} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">{ann?.title ?? funnel.announcementId}</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Queued</dt>
                  <dd className="text-xl font-semibold">{funnel.queued}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Attempted</dt>
                  <dd className="text-xl font-semibold">{funnel.attempted}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Push accepted (not read)</dt>
                  <dd className="text-xl font-semibold">{funnel.pushAccepted}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Push rejected</dt>
                  <dd className="text-xl font-semibold">{funnel.pushRejected}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Notification clicked</dt>
                  <dd className="text-xl font-semibold">{funnel.notificationClicked}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Inbox opened</dt>
                  <dd className="text-xl font-semibold">{funnel.inboxOpened}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Acknowledged</dt>
                  <dd className="text-xl font-semibold">{funnel.acknowledged}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </EngagementLabChrome>
  );
}
