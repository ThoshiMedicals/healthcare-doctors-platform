(() => {
  const data = Array.isArray(window.PRACTICE_UPDATES) ? window.PRACTICE_UPDATES.slice() : [];
  const categories = Array.isArray(window.UPDATE_CATEGORIES) ? window.UPDATE_CATEGORIES : [];
  const base = window.UPDATES_BASE || "";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const imageUrl = image => {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    if (image === "clinic-exterior") return `${base}assets/location-storefront-polished.webp`;
    if (image === "clinic-reception") return `${base}assets/clinic-reception.png`;
    return `${base}assets/${image}`;
  };

  const articleUrl = update => `${base}updates/${encodeURIComponent(update.id)}.html`;

  data.sort((a,b) => (b.published || "").localeCompare(a.published || ""));

  const cardMarkup = update => `
    <article class="health-update-card">
      <a class="health-update-image" href="${articleUrl(update)}" aria-label="${esc(update.title)}">
        <img src="${esc(imageUrl(update.image))}" alt="${esc(update.imageAlt || "")}" loading="lazy" decoding="async">
      </a>
      <div class="health-update-copy">
        <div class="health-update-meta">
          <span>${esc(update.category)}</span>
          <time datetime="${esc(update.published)}">${esc(update.dateLabel)}</time>
        </div>
        <h3><a href="${articleUrl(update)}">${esc(update.title)}</a></h3>
        <p>${esc(update.summary)}</p>
        <a class="editorial-link" href="${articleUrl(update)}">Read update</a>
      </div>
    </article>`;

  const latest = document.querySelector("[data-latest-health-updates]");
  if (latest) {
    const latestItems = data.slice(0,3);
    if (latestItems.length) {
      latest.innerHTML = `
        <div class="latest-featured-column" aria-label="Featured update">${cardMarkup(latestItems[0])}</div>
        <div class="latest-supporting-column" aria-label="Supporting updates">${latestItems.slice(1).map(cardMarkup).join("")}</div>`;
    }
  }

  const featuredHost = document.querySelector("[data-featured-update]");
  if (featuredHost) {
    const featured = data.find(item => item.featured) || data[0];
    if (featured) {
      featuredHost.innerHTML = `
        <article class="featured-health-update" aria-label="Featured update">
          <a class="featured-update-image" href="${articleUrl(featured)}">
            <img src="${esc(imageUrl(featured.image))}" alt="${esc(featured.imageAlt || "")}" loading="eager">
          </a>
          <div class="featured-update-copy">
            <div class="health-update-meta">
              <span>${esc(featured.category)}</span>
              <time datetime="${esc(featured.published)}">${esc(featured.dateLabel)}</time>
            </div>
            <h2><a href="${articleUrl(featured)}">${esc(featured.title)}</a></h2>
            <p>${esc(featured.summary)}</p>
            <p class="update-author">By ${esc(featured.author || "Practice Team")}</p>
            <a class="button" href="${articleUrl(featured)}">Read Update</a>
          </div>
        </article>`;
    }
  }

  const archive = document.querySelector("[data-update-archive]");
  if (archive) {
    const search = document.querySelector("[data-update-search]");
    const filters = document.querySelector("[data-update-filters]");
    const count = document.querySelector("[data-update-count]");
    if(count){count.setAttribute("role","status");count.setAttribute("aria-live","polite");count.setAttribute("aria-atomic","true");}
    const empty = document.querySelector("[data-update-empty]");
    let activeCategory = "All";

    if (filters) {
      filters.setAttribute("role", "group");
      const populatedCategories = categories.filter(name => data.some(update => update.category === name));
      const filterNames = ["All", ...populatedCategories];
      filters.innerHTML = filterNames.map(name =>
        `<button type="button" class="update-filter${name === "All" ? " active" : ""}" aria-pressed="${name === "All" ? "true" : "false"}" data-category="${esc(name)}">${esc(name)}</button>`
      ).join("");

      filters.addEventListener("click", event => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        activeCategory = button.dataset.category || "All";
        filters.querySelectorAll(".update-filter").forEach(btn => { const selected=btn === button;btn.classList.toggle("active",selected);btn.setAttribute("aria-pressed",String(selected)); });
        renderArchive();
      });
    }

    const searchText = update => {
      const body = (update.sections || []).flatMap(section => [
        section.heading || "",
        ...(section.paragraphs || []),
        ...(section.list || [])
      ]).join(" ");
      return `${update.title} ${update.summary} ${update.category} ${body}`.toLowerCase();
    };

    const renderArchive = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const filtered = data.filter(update => {
        const categoryMatch = activeCategory === "All" || update.category === activeCategory;
        const searchMatch = !query || searchText(update).includes(query);
        return categoryMatch && searchMatch;
      });

      archive.innerHTML = filtered.map(cardMarkup).join("");
      if (count) count.textContent = `${filtered.length} update${filtered.length === 1 ? "" : "s"}`;
      if (empty) empty.hidden = filtered.length !== 0;
    };

    if (search) search.addEventListener("input", renderArchive);
    renderArchive();
  }

  const articleHost = document.querySelector("[data-update-article]");
  if (articleHost) {
    const id = articleHost.dataset.updateId || new URLSearchParams(window.location.search).get("id");
    const update = data.find(item => item.id === id) || data[0];

    if (!update) {
      articleHost.innerHTML = `<p>No update is available.</p>`;
      return;
    }

    const previewTitle = ({"open-seven-days":"Open 7 Days", "after-hours-care-options":"After-Hours Care Options"})[update.id] || update.title;
    document.title = `${previewTitle} | Woolloongabba Medical Centre`;
    const previewDescription = update.id === "current-billing-information"
      ? "Our Medicare bulk billing approach for eligible standard GP consultations, with clear information about separately charged services."
      : update.summary;

    const canonicalUrl = `https://gabbamedicalcentre.com.au/updates/${encodeURIComponent(update.id)}.html`;
    const ensureMeta = (selector, attrs) => {
      let node = document.head.querySelector(selector);
      if (!node) { node = document.createElement(attrs.tag || "meta"); document.head.appendChild(node); }
      Object.entries(attrs).forEach(([key,value]) => { if (key !== "tag") node.setAttribute(key,value); });
      return node;
    };
    ensureMeta('link[rel="canonical"]', {tag:"link", rel:"canonical", href:canonicalUrl});
    ensureMeta('meta[name="description"]', {name:"description", content:previewDescription});
    ensureMeta('meta[property="og:type"]', {property:"og:type", content:"article"});
    ensureMeta('meta[property="og:title"]', {property:"og:title", content:document.title});
    ensureMeta('meta[property="og:description"]', {property:"og:description", content:previewDescription});
    ensureMeta('meta[property="og:url"]', {property:"og:url", content:canonicalUrl});
    ensureMeta('meta[property="og:site_name"]', {property:"og:site_name", content:"Woolloongabba Medical Centre"});
    ensureMeta('meta[name="twitter:title"]', {name:"twitter:title", content:document.title});
    ensureMeta('meta[name="twitter:description"]', {name:"twitter:description", content:previewDescription});
    const articleSchema = {
      "@context":"https://schema.org",
      "@type":"Article",
      "@id":`${canonicalUrl}#article`,
      "headline":update.title,
      "description":update.summary,
      "datePublished":update.published,
      "dateModified":update.published,
      "author":{"@type":"Organization","name":update.author || "Practice Team"},
      "publisher":{"@id":"https://gabbamedicalcentre.com.au/#medical-clinic"},
      "mainEntityOfPage":canonicalUrl
    };
    let articleSchemaNode = document.head.querySelector('script[data-schema="update-article"]');
    if (!articleSchemaNode) { articleSchemaNode=document.createElement("script"); articleSchemaNode.type="application/ld+json"; articleSchemaNode.dataset.schema="update-article"; document.head.appendChild(articleSchemaNode); }
    articleSchemaNode.textContent=JSON.stringify(articleSchema);
    const breadcrumbSchema={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://gabbamedicalcentre.com.au/"},
      {"@type":"ListItem","position":2,"name":"Updates","item":"https://gabbamedicalcentre.com.au/updates/index.html"},
      {"@type":"ListItem","position":3,"name":update.title,"item":canonicalUrl}
    ]};
    let breadcrumbNode=document.head.querySelector('script[data-schema="update-breadcrumb"]');
    if (!breadcrumbNode) { breadcrumbNode=document.createElement("script"); breadcrumbNode.type="application/ld+json"; breadcrumbNode.dataset.schema="update-breadcrumb"; document.head.appendChild(breadcrumbNode); }
    breadcrumbNode.textContent=JSON.stringify(breadcrumbSchema);

    const sectionMarkup = (update.sections || []).map(section => {
      const paras = (section.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join("");
      const list = (section.list || []).length
        ? `<ul>${section.list.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`
        : "";
      return `<section class="update-article-section"><h2>${esc(section.heading || "")}</h2>${paras}${list}</section>`;
    }).join("");

    articleHost.innerHTML = `
      <header class="update-article-header">
        <div class="health-update-meta">
          <span>${esc(update.category)}</span>
          <time datetime="${esc(update.published)}">${esc(update.dateLabel)}</time>
        </div>
        <h1>${esc(update.title)}</h1>
        <p class="update-article-summary">${esc(update.summary)}</p>
        <p class="update-author">By ${esc(update.author || "Practice Team")}</p>
      </header>
      <figure class="update-article-image">
        <img src="${esc(imageUrl(update.image))}" alt="${esc(update.imageAlt || "")}">
      </figure>
      <div class="update-article-body">${sectionMarkup}</div>`;

    const relatedHost = document.querySelector("[data-related-updates]");
    if (relatedHost) {
      let related = data.filter(item => item.id !== update.id && item.category === update.category).slice(0,3);
      if (related.length < 3) {
        const ids = new Set(related.map(item => item.id));
        data.filter(item => item.id !== update.id && !ids.has(item.id))
          .slice(0, 3 - related.length)
          .forEach(item => related.push(item));
      }
      relatedHost.innerHTML = related.map(cardMarkup).join("");
    }
  }
})();