/**
 * Room Capacity Dashboard
 * Inputs: rooms, sessions, existing doctor schedules
 * Outputs: available capacity, placement options, G/Y/R status
 * Woolloongabba Medical Centre — localhost proposal
 */
(() => {
  "use strict";

  const STORAGE_KEY = "wmc_room_capacity_dashboard_v1";

  const DAYS = [
    { id: "mon", label: "Mon", full: "Monday" },
    { id: "tue", label: "Tue", full: "Tuesday" },
    { id: "wed", label: "Wed", full: "Wednesday" },
    { id: "thu", label: "Thu", full: "Thursday" },
    { id: "fri", label: "Fri", full: "Friday" },
    { id: "sat", label: "Sat", full: "Saturday" },
  ];

  const PERIODS = [
    { id: "morning", label: "Morning", short: "AM" },
    { id: "afternoon", label: "Afternoon", short: "PM" },
    { id: "evening", label: "Evening", short: "Eve" },
  ];

  /** Default demo data for localhost */
  const DEFAULT_STATE = {
    rooms: [
      { id: "room-1", name: "Consulting Room 1", active: true },
      { id: "room-2", name: "Consulting Room 2", active: true },
      { id: "room-3", name: "Consulting Room 3", active: true },
      { id: "room-4", name: "Consulting Room 4", active: true },
    ],
    /** Which day+period slots the practice offers */
    availableSessions: {
      mon: ["morning", "afternoon", "evening"],
      tue: ["morning", "afternoon", "evening"],
      wed: ["morning", "afternoon", "evening"],
      thu: ["morning", "afternoon", "evening"],
      fri: ["morning", "afternoon", "evening"],
      sat: ["morning", "afternoon"],
    },
    /** Existing doctor schedules: { doctorName, roomId, dayId, periodId } */
    schedules: [
      { id: "s1", doctorName: "Dr Chen", roomId: "room-1", dayId: "mon", periodId: "morning" },
      { id: "s2", doctorName: "Dr Chen", roomId: "room-1", dayId: "mon", periodId: "afternoon" },
      { id: "s3", doctorName: "Dr Patel", roomId: "room-2", dayId: "mon", periodId: "morning" },
      { id: "s4", doctorName: "Dr Patel", roomId: "room-2", dayId: "wed", periodId: "afternoon" },
      { id: "s5", doctorName: "Dr Nguyen", roomId: "room-3", dayId: "tue", periodId: "morning" },
      { id: "s6", doctorName: "Dr Nguyen", roomId: "room-3", dayId: "tue", periodId: "afternoon" },
      { id: "s7", doctorName: "Dr Nguyen", roomId: "room-3", dayId: "thu", periodId: "morning" },
      { id: "s8", doctorName: "Dr Walsh", roomId: "room-1", dayId: "fri", periodId: "morning" },
      { id: "s9", doctorName: "Dr Walsh", roomId: "room-4", dayId: "sat", periodId: "morning" },
      { id: "s10", doctorName: "Dr Okonkwo", roomId: "room-2", dayId: "thu", periodId: "afternoon" },
      { id: "s11", doctorName: "Dr Okonkwo", roomId: "room-2", dayId: "thu", periodId: "evening" },
      { id: "s12", doctorName: "Dr Chen", roomId: "room-1", dayId: "wed", periodId: "morning" },
    ],
  };

  /** @type {typeof DEFAULT_STATE} */
  let state = structuredClone(DEFAULT_STATE);

  /**
   * @param {string} dayId
   * @param {string} periodId
   */
  function sessionKey(dayId, periodId) {
    return `${dayId}:${periodId}`;
  }

  function activeRooms() {
    return state.rooms.filter((r) => r.active);
  }

  /**
   * @param {string} dayId
   * @param {string} periodId
   */
  function isSessionOffered(dayId, periodId) {
    const list = state.availableSessions[dayId] || [];
    return list.includes(periodId);
  }

  /**
   * Occupancy for a day+period across rooms.
   * @param {string} dayId
   * @param {string} periodId
   */
  function occupancy(dayId, periodId) {
    const rooms = activeRooms();
    const roomCount = rooms.length;
    if (!isSessionOffered(dayId, periodId) || roomCount === 0) {
      return {
        offered: false,
        roomCount: 0,
        used: 0,
        free: 0,
        status: "closed",
        assignments: [],
      };
    }

    const assignments = state.schedules.filter(
      (s) => s.dayId === dayId && s.periodId === periodId && rooms.some((r) => r.id === s.roomId),
    );

    // Unique rooms occupied (one doctor per room per slot assumed)
    const usedRoomIds = new Set(assignments.map((s) => s.roomId));
    const used = usedRoomIds.size;
    const free = Math.max(0, roomCount - used);

    /** @type {"available"|"limited"|"full"} */
    let status = "available";
    if (free === 0) status = "full";
    else if (free === 1 || used / roomCount >= 0.67) status = "limited";

    return {
      offered: true,
      roomCount,
      used,
      free,
      status,
      assignments,
    };
  }

  /**
   * Traffic-light class helpers
   * @param {"available"|"limited"|"full"|"closed"} status
   */
  function statusMeta(status) {
    if (status === "available") {
      return {
        label: "Available",
        cell: "border-emerald-600/40 bg-emerald-50 text-emerald-900",
        badge: "bg-emerald-600 text-white",
        dot: "bg-emerald-500",
      };
    }
    if (status === "limited") {
      return {
        label: "Limited",
        cell: "border-amber-500/50 bg-amber-50 text-amber-950",
        badge: "bg-amber-500 text-ink",
        dot: "bg-amber-400",
      };
    }
    if (status === "full") {
      return {
        label: "Full",
        cell: "border-red-500/40 bg-red-50 text-red-900",
        badge: "bg-red-600 text-white",
        dot: "bg-red-500",
      };
    }
    return {
      label: "Not offered",
      cell: "border-line bg-mist/80 text-ink-soft",
      badge: "bg-ink-soft text-white",
      dot: "bg-ink-soft",
    };
  }

  function computeCapacity() {
    const rooms = activeRooms();
    /** @type {ReturnType<typeof occupancy> & { dayId: string, periodId: string, key: string }}[] */
    const slots = [];

    let totalOfferedSlots = 0;
    let totalUsed = 0;
    let totalFree = 0;
    let availableSlots = 0;
    let limitedSlots = 0;
    let fullSlots = 0;

    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const occ = occupancy(day.id, period.id);
        const row = {
          ...occ,
          dayId: day.id,
          periodId: period.id,
          key: sessionKey(day.id, period.id),
        };
        slots.push(row);
        if (!occ.offered) return;
        totalOfferedSlots += occ.roomCount;
        totalUsed += occ.used;
        totalFree += occ.free;
        if (occ.status === "available") availableSlots += 1;
        else if (occ.status === "limited") limitedSlots += 1;
        else if (occ.status === "full") fullSlots += 1;
      });
    });

    const utilisation =
      totalOfferedSlots === 0 ? 0 : Math.round((totalUsed / totalOfferedSlots) * 100);

    return {
      activeRoomCount: rooms.length,
      totalOfferedSlots,
      totalUsed,
      totalFree,
      utilisation,
      availableSlots,
      limitedSlots,
      fullSlots,
      slots,
    };
  }

  /**
   * Suggest placement options for a new GP (free room+session pairs).
   * Prefers contiguous same-day free rooms, then green slots, then yellow.
   */
  function placementOptions() {
    const rooms = activeRooms();
    /** @type {{ dayId: string, dayLabel: string, periodId: string, periodLabel: string, roomId: string, roomName: string, status: string, score: number }[]} */
    const options = [];

    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const occ = occupancy(day.id, period.id);
        if (!occ.offered || occ.free === 0) return;

        const usedRooms = new Set(occ.assignments.map((a) => a.roomId));
        rooms.forEach((room) => {
          if (usedRooms.has(room.id)) return;
          let score = occ.status === "available" ? 30 : 15;
          // Prefer morning/afternoon slightly for continuity practices
          if (period.id === "morning") score += 3;
          if (period.id === "afternoon") score += 2;
          // Prefer mid-week
          if (["tue", "wed", "thu"].includes(day.id)) score += 2;

          options.push({
            dayId: day.id,
            dayLabel: day.full,
            periodId: period.id,
            periodLabel: period.label,
            roomId: room.id,
            roomName: room.name,
            status: occ.status,
            score,
          });
        });
      });
    });

    options.sort((a, b) => b.score - a.score || a.dayId.localeCompare(b.dayId));

    // Group into suggested bundles (same room across days) for a part-time GP
    /** @type {Map<string, typeof options>} */
    const byRoom = new Map();
    options.forEach((o) => {
      if (!byRoom.has(o.roomId)) byRoom.set(o.roomId, []);
      byRoom.get(o.roomId)?.push(o);
    });

    const bundles = [...byRoom.entries()]
      .map(([roomId, slots]) => {
        const roomName = slots[0]?.roomName || roomId;
        const top = slots.slice(0, 6);
        return {
          roomId,
          roomName,
          slotCount: slots.length,
          suggestedSessions: top.map((s) => ({
            dayId: s.dayId,
            dayLabel: s.dayLabel,
            periodId: s.periodId,
            periodLabel: s.periodLabel,
            status: s.status,
          })),
        };
      })
      .sort((a, b) => b.slotCount - a.slotCount);

    return {
      openPlacements: options.slice(0, 24),
      roomBundles: bundles,
    };
  }

  function buildExport() {
    const capacity = computeCapacity();
    const placements = placementOptions();
    return {
      formType: "room_capacity_dashboard",
      version: "1.0.0",
      clinicSlug: "woolloongabba",
      exportedAt: new Date().toISOString(),
      inputs: {
        availableRooms: state.rooms,
        availableSessions: state.availableSessions,
        existingDoctorSchedules: state.schedules,
      },
      outputs: {
        availableCapacity: {
          activeRooms: capacity.activeRoomCount,
          roomSessionSlotsOffered: capacity.totalOfferedSlots,
          roomSessionSlotsUsed: capacity.totalUsed,
          roomSessionSlotsFree: capacity.totalFree,
          utilisationPercent: capacity.utilisation,
          slotStatusCounts: {
            available: capacity.availableSlots,
            limited: capacity.limitedSlots,
            full: capacity.fullSlots,
          },
        },
        potentialPlacementOptions: placements,
        slotMatrix: capacity.slots.map((s) => ({
          dayId: s.dayId,
          periodId: s.periodId,
          status: s.status,
          used: s.used,
          free: s.free,
          roomCount: s.roomCount,
        })),
      },
      legend: {
        green: "available — 2+ free rooms (or <67% used)",
        yellow: "limited — 1 free room or ≥67% used",
        red: "full — no free rooms",
      },
    };
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.rooms && data?.availableSessions && data?.schedules) {
        state = data;
      }
    } catch {
      /* ignore */
    }
  }

  function renderInputs() {
    const roomList = document.querySelector("#room-list");
    if (roomList) {
      roomList.innerHTML = "";
      state.rooms.forEach((room) => {
        const li = document.createElement("li");
        li.className =
          "flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2";
        li.innerHTML = `
          <label class="flex min-h-10 flex-1 items-center gap-2 text-sm">
            <input type="checkbox" data-room-toggle="${room.id}" class="h-5 w-5 rounded" ${room.active ? "checked" : ""} />
            <span contenteditable="true" data-room-name="${room.id}" class="outline-none focus:ring-2 focus:ring-navy/30 rounded px-1">${escapeHtml(room.name)}</span>
          </label>
        `;
        roomList.appendChild(li);
      });
    }

    const sessionMatrix = document.querySelector("#session-offer-grid");
    if (sessionMatrix) {
      sessionMatrix.innerHTML = "";
      const corner = document.createElement("div");
      corner.className = "text-[10px] font-semibold uppercase text-ink-soft";
      corner.textContent = "Offer";
      sessionMatrix.appendChild(corner);
      DAYS.forEach((d) => {
        const h = document.createElement("div");
        h.className = "text-center text-[10px] font-semibold sm:text-xs";
        h.textContent = d.label;
        sessionMatrix.appendChild(h);
      });
      PERIODS.forEach((p) => {
        const lab = document.createElement("div");
        lab.className = "flex items-center text-[10px] font-semibold sm:text-xs";
        lab.textContent = p.short;
        sessionMatrix.appendChild(lab);
        DAYS.forEach((d) => {
          const on = isSessionOffered(d.id, p.id);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.offer = sessionKey(d.id, p.id);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          btn.setAttribute("aria-label", `Offer ${d.full} ${p.label}`);
          btn.className = `min-h-9 rounded-lg border text-[10px] font-semibold sm:min-h-10 sm:text-xs ${
            on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-soft"
          }`;
          btn.textContent = on ? "On" : "Off";
          btn.addEventListener("click", () => toggleOffer(d.id, p.id));
          sessionMatrix.appendChild(btn);
        });
      });
    }

    renderScheduleTable();
    populateScheduleSelects();
  }

  function renderScheduleTable() {
    const tbody = document.querySelector("#schedule-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.schedules.forEach((s) => {
      const day = DAYS.find((d) => d.id === s.dayId);
      const period = PERIODS.find((p) => p.id === s.periodId);
      const room = state.rooms.find((r) => r.id === s.roomId);
      const tr = document.createElement("tr");
      tr.className = "border-b border-line text-sm";
      tr.innerHTML = `
        <td class="py-2 pr-2 font-medium">${escapeHtml(s.doctorName)}</td>
        <td class="py-2 pr-2">${escapeHtml(room?.name || s.roomId)}</td>
        <td class="py-2 pr-2">${day?.label || s.dayId}</td>
        <td class="py-2 pr-2">${period?.label || s.periodId}</td>
        <td class="py-2">
          <button type="button" data-remove-schedule="${s.id}" class="text-xs font-semibold text-red-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">Remove</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * @param {string} dayId
   * @param {string} periodId
   */
  function toggleOffer(dayId, periodId) {
    const list = new Set(state.availableSessions[dayId] || []);
    if (list.has(periodId)) list.delete(periodId);
    else list.add(periodId);
    state.availableSessions[dayId] = PERIODS.map((p) => p.id).filter((id) => list.has(id));
    saveLocal();
    renderInputs();
    renderDashboard();
  }

  function renderDashboard() {
    const capacity = computeCapacity();
    const placements = placementOptions();

    const setText = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = String(val);
    };

    setText("#stat-rooms", capacity.activeRoomCount);
    setText("#stat-free", capacity.totalFree);
    setText("#stat-used", capacity.totalUsed);
    setText("#stat-util", `${capacity.utilisation}%`);
    setText("#stat-green", capacity.availableSlots);
    setText("#stat-yellow", capacity.limitedSlots);
    setText("#stat-red", capacity.fullSlots);

    const heat = document.querySelector("#capacity-heatmap");
    if (heat) {
      heat.innerHTML = "";
      const corner = document.createElement("div");
      corner.className = "text-xs font-semibold uppercase tracking-wide text-ink-soft";
      corner.textContent = "Capacity";
      heat.appendChild(corner);
      DAYS.forEach((d) => {
        const h = document.createElement("div");
        h.className = "text-center text-xs font-semibold sm:text-sm";
        h.innerHTML = `<span class="sm:hidden">${d.label}</span><span class="hidden sm:inline">${d.full}</span>`;
        heat.appendChild(h);
      });

      PERIODS.forEach((p) => {
        const lab = document.createElement("div");
        lab.className = "flex items-center text-xs font-semibold sm:text-sm";
        lab.innerHTML = `<span class="sm:hidden">${p.short}</span><span class="hidden sm:inline">${p.label}</span>`;
        heat.appendChild(lab);

        DAYS.forEach((d) => {
          const occ = occupancy(d.id, p.id);
          const meta = statusMeta(occ.status);
          const cell = document.createElement("div");
          cell.className = `min-h-14 rounded-xl border p-2 text-center ${meta.cell}`;
          cell.setAttribute(
            "role",
            "img",
          );
          cell.setAttribute(
            "aria-label",
            occ.offered
              ? `${d.full} ${p.label}: ${meta.label}, ${occ.free} of ${occ.roomCount} rooms free`
              : `${d.full} ${p.label}: not offered`,
          );
          if (occ.offered) {
            cell.innerHTML = `
              <div class="flex items-center justify-center gap-1">
                <span class="inline-block h-2.5 w-2.5 rounded-full ${meta.dot}" aria-hidden="true"></span>
                <span class="text-[10px] font-semibold uppercase sm:text-xs">${meta.label}</span>
              </div>
              <div class="mt-1 text-xs font-bold sm:text-sm">${occ.free}/${occ.roomCount} free</div>
            `;
          } else {
            cell.innerHTML = `<div class="text-[10px] font-medium sm:text-xs">—</div>`;
          }
          heat.appendChild(cell);
        });
      });
    }

    const placeList = document.querySelector("#placement-list");
    if (placeList) {
      placeList.innerHTML = "";
      if (!placements.openPlacements.length) {
        placeList.innerHTML =
          '<li class="text-sm text-ink-soft">No free room sessions — adjust rooms, offers, or schedules.</li>';
      } else {
        placements.openPlacements.slice(0, 12).forEach((o) => {
          const meta = statusMeta(/** @type {any} */ (o.status));
          const li = document.createElement("li");
          li.className =
            "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 text-sm";
          li.innerHTML = `
            <span><strong>${escapeHtml(o.dayLabel)}</strong> · ${escapeHtml(o.periodLabel)} · ${escapeHtml(o.roomName)}</span>
            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${meta.badge}">
              <span class="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true"></span>${meta.label}
            </span>
          `;
          placeList.appendChild(li);
        });
      }
    }

    const bundles = document.querySelector("#bundle-list");
    if (bundles) {
      bundles.innerHTML = "";
      placements.roomBundles.slice(0, 4).forEach((b) => {
        const li = document.createElement("li");
        li.className = "rounded-xl border border-line p-3";
        const chips = b.suggestedSessions
          .map((s) => {
            const m = statusMeta(/** @type {any} */ (s.status));
            return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${m.cell}">${s.dayLabel.slice(0, 3)} ${s.periodLabel.slice(0, 3)}</span>`;
          })
          .join(" ");
        li.innerHTML = `
          <div class="flex items-baseline justify-between gap-2">
            <strong class="text-sm">${escapeHtml(b.roomName)}</strong>
            <span class="text-xs text-ink-soft">${b.slotCount} open slots</span>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">${chips}</div>
        `;
        bundles.appendChild(li);
      });
    }

    const jsonPre = document.querySelector("#json-preview");
    const payload = buildExport();
    if (jsonPre) jsonPre.textContent = JSON.stringify(payload, null, 2);
    window.__lastCapacityExport = payload;
  }

  /**
   * @param {string} str
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid() {
    return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function bindEvents() {
    document.querySelector("#room-list")?.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement) || !t.dataset.roomToggle) return;
      const room = state.rooms.find((r) => r.id === t.dataset.roomToggle);
      if (room) {
        room.active = t.checked;
        saveLocal();
        renderDashboard();
      }
    });

    document.querySelector("#room-list")?.addEventListener("blur", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !t.dataset.roomName) return;
      const room = state.rooms.find((r) => r.id === t.dataset.roomName);
      if (room) {
        room.name = t.textContent?.trim() || room.name;
        saveLocal();
        renderInputs();
        renderDashboard();
      }
    }, true);

    document.querySelector("#btn-add-room")?.addEventListener("click", () => {
      const n = state.rooms.length + 1;
      state.rooms.push({ id: `room-${n}-${uid()}`, name: `Consulting Room ${n}`, active: true });
      saveLocal();
      renderInputs();
      renderDashboard();
    });

    document.querySelector("#schedule-body")?.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !t.dataset.removeSchedule) return;
      state.schedules = state.schedules.filter((s) => s.id !== t.dataset.removeSchedule);
      saveLocal();
      renderInputs();
      renderDashboard();
    });

    document.querySelector("#btn-add-schedule")?.addEventListener("click", () => {
      const doctor = /** @type {HTMLInputElement|null} */ (document.querySelector("#new-doctor"));
      const room = /** @type {HTMLSelectElement|null} */ (document.querySelector("#new-room"));
      const day = /** @type {HTMLSelectElement|null} */ (document.querySelector("#new-day"));
      const period = /** @type {HTMLSelectElement|null} */ (document.querySelector("#new-period"));
      const status = document.querySelector("#schedule-form-status");

      const doctorName = doctor?.value.trim() || "";
      if (!doctorName || !room?.value || !day?.value || !period?.value) {
        if (status) status.textContent = "Fill doctor, room, day and session.";
        return;
      }

      // Conflict: same room already booked
      const clash = state.schedules.find(
        (s) => s.roomId === room.value && s.dayId === day.value && s.periodId === period.value,
      );
      if (clash) {
        if (status) {
          status.textContent = `Conflict: ${clash.doctorName} already in that room session.`;
        }
        return;
      }

      if (!isSessionOffered(day.value, period.value)) {
        if (status) status.textContent = "That session is not offered. Turn it On first.";
        return;
      }

      state.schedules.push({
        id: uid(),
        doctorName,
        roomId: room.value,
        dayId: day.value,
        periodId: period.value,
      });
      if (doctor) doctor.value = "";
      if (status) status.textContent = "Schedule added.";
      saveLocal();
      renderInputs();
      renderDashboard();
    });

    document.querySelector("#btn-reset")?.addEventListener("click", () => {
      state = structuredClone(DEFAULT_STATE);
      saveLocal();
      renderInputs();
      populateScheduleSelects();
      renderDashboard();
      setSaveStatus("Reset to demo data.", null);
    });

    document.querySelector("#btn-save-json")?.addEventListener("click", async () => {
      const payload = buildExport();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wmc-room-capacity-${payload.outputs.availableCapacity.roomSessionSlotsFree}free.json`;
      a.click();
      URL.revokeObjectURL(url);

      let ok = false;
      try {
        const res = await fetch("/api/room-capacity", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      setSaveStatus(
        ok ? "JSON downloaded and saved on localhost." : "JSON downloaded (local file only).",
        ok || null,
      );
    });

    document.querySelector("#btn-copy-json")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2));
        setSaveStatus("JSON copied.", true);
      } catch {
        setSaveStatus("Copy failed.", false);
      }
    });
  }

  /**
   * @param {string} text
   * @param {boolean|null} ok
   */
  function setSaveStatus(text, ok) {
    const el = document.querySelector("#save-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("text-green", ok === true);
    el.classList.toggle("text-red-700", ok === false);
    el.classList.toggle("text-ink-soft", ok == null);
  }

  function populateScheduleSelects() {
    const roomSel = document.querySelector("#new-room");
    if (roomSel instanceof HTMLSelectElement) {
      roomSel.innerHTML = activeRooms()
        .map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`)
        .join("");
    }
    const daySel = document.querySelector("#new-day");
    if (daySel instanceof HTMLSelectElement) {
      daySel.innerHTML = DAYS.map((d) => `<option value="${d.id}">${d.full}</option>`).join("");
    }
    const periodSel = document.querySelector("#new-period");
    if (periodSel instanceof HTMLSelectElement) {
      periodSel.innerHTML = PERIODS.map((p) => `<option value="${p.id}">${p.label}</option>`).join(
        "",
      );
    }
  }

  function init() {
    loadLocal();
    populateScheduleSelects();
    renderInputs();
    renderDashboard();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.RoomCapacityDashboard = { computeCapacity, placementOptions, buildExport, occupancy };
})();
