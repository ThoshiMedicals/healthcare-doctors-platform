(() => {
  let searchable = null;
  let indexPromise = null;
  let searchSerial = 0;
  if (document.querySelector('.digital-reception-launcher') || /404\.html$/.test(location.pathname)) return;
  const SCRIPT_NODE=document.currentScript||[...document.scripts].find(node=>/digital-reception\.js(?:[?#].*)?$/.test(node.src||''));
  const SCRIPT_URL=(SCRIPT_NODE&&SCRIPT_NODE.src)?SCRIPT_NODE.src:location.href;
  const SITE_ROOT=new URL('.',SCRIPT_URL);
  const localHref=path=>new URL(String(path||'index.html').replace(/^\/+/,''),SITE_ROOT).href;
  const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  // Synonyms enrich genuine page content; they do not promise an unavailable service.
  const synonyms = {
    dr:['doctor','gp','clinician','practitioner'], doctor:['doctor','gp','clinician','practitioner'], doctors:['doctor','gp','practitioner'], gp:['doctor','general practitioner'],
    book:['booking','appointment','hotdoc'], booking:['book','appointment','hotdoc'], appointment:['book','booking','hotdoc'], hotdoc:['book','appointment'],
    parking:['parking','arrival','car park'], wheelchair:['accessibility','mobility','disability'], disabled:['accessibility','wheelchair'], access:['accessibility','parking'],
    script:['prescription','repeat','medication'], scripts:['prescription','repeat'], prescription:['script','repeat'], refill:['repeat','prescription'],
    result:['results','test','follow up'], results:['test','results','follow up'], pathology:['blood','test','pathology'], blood:['test','pathology'],
    fee:['fees','billing','cost','medicare'], fees:['cost','billing','medicare'], cost:['fees','billing'], bulk:['bulk billing','medicare'],
    agpal:['accreditation','quality'], accredited:['agpal','accreditation'], accreditation:['agpal','quality'],
    after:['after hours','clinic closed'], emergency:['000','after hours'], urgent:['after hours'],
    smear:['pap smear','cervical screening'], pap:['cervical screening'], cervix:['cervical screening'],
    contraception:['iud','implanon','womens health'], mirena:['iud','contraception'], implant:['implanon','contraception'],
    pregnancy:['antenatal','postnatal','pre pregnancy'], pregnant:['antenatal','pregnancy'],
    mental:['mental health','anxiety','depression'], stress:['anxiety','mental health'],
    scan:['radiology','imaging'], xray:['radiology','x ray'], ultrasound:['radiology','imaging'], chemist:['pharmacy','medications'],
    vaccination:['immunisation','vaccines'], vaccines:['vaccination','immunisation'], immunisation:['vaccinations'],
    pain:[], age:['ageing','senior'], aging:['ageing','older adults'],
    phone:['contact','reception','call'], location:['address','parking','contact'], hours:['opening hours','contact'],
    complaint:['feedback','complaints'], form:['patient forms','new patients'], privacy:['confidentiality','policy'],
    hearing:['ear care','accessibility'], earwax:['ear care','ear syringing'], ecg:['electrocardiogram','heart'],
    nebulizer:['nebulising'], nebuliser:['nebulising'],
  };
  const stopwords = new Set(['a','an','the','i','is','are','in','at','to','for','from','my','me','can','how','do','does','of','with','about','what','where','when','and','or','we','your','you','our','on','please','have','get','find','need']);
  const expand = q => { const raw=norm(q).split(' ').filter(w=>w&&!stopwords.has(w));const terms=new Set(raw); for(const w of raw){for(const extra of (synonyms[w]||[])){for(const t of norm(extra).split(' ')){if(t&&!stopwords.has(t))terms.add(t)}}}return [...terms]; };
  const emergency = q => { const text=String(q||""), riskOnly=/\b(stroke risk|risk of stroke)\b/i.test(text) && !/\b(chest pain|difficulty breathing|breathing difficulty|cannot breathe|can.t breathe|worst headache|thunderclap|seizure|severe bleeding|unconscious|suicide|suicidal|self-harm|self harm|harm myself|kill myself|end my life|overdose|life threatening|stroke symptoms|face droop|arm weakness|slurred speech|emergency)\b/i.test(text); return /\b(severe shortness of breath|struggling to breathe|gasping for air|blue lips|can t catch my breath|swollen tongue with breathing problems)\b/i.test(text) || (!riskOnly && /\b(emergency|chest pain|difficulty breathing|breathing difficulty|cannot breathe|can.t breathe|worst headache|thunderclap|stroke|seizure|severe bleeding|unconscious|suicide|suicidal|self-harm|self harm|harm myself|kill myself|end my life|overdose|life threatening)\b/i.test(text)); };
  // Load only the small routing manifest when Digital Reception opens.
  // Verified topic files load at first relevant search, not on every page visit.
  let manifest = null;
  let legacyMode = false;
  const shardCache = new Map();
  const normalizedEntry=x=>({entry:x,title:norm(x.title+' '+x.h1),head:norm((x.headings||[]).join(' ')),keywords:norm((x.keywords||[]).join(' ')),description:norm(x.description),content:norm(x.text),relationships:norm((x.related||[]).join(' ')),category:x.category});
  const loadLegacyIndex = () => new Promise((resolve,reject)=>{
    const element=document.createElement('script');
    element.src=localHref('digital-reception-index.js?v=5db5db0a5fe6');
    element.async=true;
    element.onload=()=>{
      const entries=window.WMC_DIGITAL_RECEPTION_INDEX;
      if(!Array.isArray(entries)||!entries.length){reject(new Error('Compatibility index unavailable'));return;}
      searchable=entries.map(normalizedEntry);
      delete window.WMC_DIGITAL_RECEPTION_INDEX;
      legacyMode=true;
      resolve();
    };
    element.onerror=()=>reject(new Error('Digital Reception compatibility index failed to load'));
    document.head.appendChild(element);
  });
  const loadIndex = () => {
    if(manifest || legacyMode) return Promise.resolve();
    if(indexPromise) return indexPromise;
    indexPromise=fetch(localHref('search-index/manifest.json?v=83804fa8c180'),{cache:'force-cache'})
      .then(response=>{if(!response.ok)throw new Error('Search manifest failed');return response.json();})
      .then(data=>{
        if(data.schema!==1||!data.catalog||data.count!==data.catalog.length||!Array.isArray(data.shards))throw new Error('Invalid search manifest');
        manifest=data;
        searchable=[];
      })
      // Offline ZIP previews (file://) are allowed to use the certified JS
      // compatibility corpus. Normal HTTPS sessions never fetch that file.
      .catch(()=>loadLegacyIndex())
      .catch(error=>{indexPromise=null;throw error;});
    return indexPromise;
  };
  const getCatalogEntry=path=>manifest?.catalog.find(entry=>entry.url===path)||searchable?.find(record=>record.entry.url===path)?.entry;
  const loadShardsForQuery=async(query,hints,direct)=>{
    if(legacyMode)return;
    // Approved administrative intents are resolved directly from the lightweight
    // verified catalog; clinical content bundles are unnecessary for these tasks.
    if(direct){searchable=[];return;}
    // Where the clinic has no dedicated guide, do not download every topic to
    // manufacture a clinical match. Preserve the honest Family Health fallback.
    if(!hints.length && /\b(rash|rashes|hives|skin eruption|breathing issues?|breathing problems?|breathless|shortness of breath|short of breath|trouble breathing|wheezing|wheeze)\b/.test(norm(query))){searchable=[];return;}
    const words=norm(query).split(' ').filter(w=>w&&!stopwords.has(w)&&!GENERIC_QUESTION_WORDS.has(w));
    let mask=0;
    for(const term of words){
      mask|=(manifest.strong[term]||0);
      // Normalise only grammatical variants; the original scoring/ranking is
      // still applied to full source records after the shards load.
      if(term.endsWith('s')&&term.length>4)mask|=(manifest.strong[term.slice(0,-1)]||0);
    }
    const targets=[...(hints||[]),...(direct?[direct[1]]:[])];
    for(const url of targets){
      const name=manifest.routes[url],idx=manifest.shards.indexOf(name);
      if(idx>=0)mask|=(1<<idx);
    }
    // Unknown or very broad language requires full coverage, not false confidence.
    if(!mask)mask=(1<<manifest.shards.length)-1;
    const required=manifest.shards.filter((_,i)=>(mask&(1<<i))!==0);
    try { await Promise.all(required.map(name=>{
      if(!shardCache.has(name)){
        const path=localHref('search-index/'+name+'.json?v=83804fa8c180');
        const request=fetch(path,{cache:'force-cache'}).then(response=>{
          if(!response.ok)throw new Error('Search topic unavailable: '+name);
          return response.json();
        }).then(rows=>{
          if(!Array.isArray(rows)||rows.some(x=>manifest.routes[x.url]!==name))throw new Error('Invalid search topic: '+name);
          return rows.map(normalizedEntry);
        });
        shardCache.set(name,request);
        request.catch(()=>{if(shardCache.get(name)===request)shardCache.delete(name);});
      }
      return shardCache.get(name);
    })); }
    catch(error){
      // A failed topic request must not strand a patient with an empty result.
      // The certified compatibility index is only downloaded on failure.
      await loadLegacyIndex();
      return;
    }
    // Restrict ranking to this query's relevant topic shards, preserving every
    // sourced match within them. Full source entries, scores and URLs unchanged.
    const chunks=await Promise.all(required.map(name=>shardCache.get(name)));
    searchable=chunks.flat();
  };
  const indexUnavailable = () => {
    searchAnnouncement.textContent='Search information is temporarily unavailable. Online booking and the clinic phone remain available.';
    results.innerHTML='<div class="digital-reception-result"><strong>Search is temporarily unavailable.</strong><span>Please use our booking page or call reception for assistance.</span></div><a class="digital-reception-result" href="'+esc(localHref('book-appointment.html'))+'">Book Appointment</a><a class="digital-reception-result" href="tel:+61732173344">Call Clinic: (07) 3217 3344</a>';
  };
  const score = (record, tokens, query) => {
    const x=record, words=tokens.length?tokens:[query]; let sum=0;
    if(query.length>2){if(norm(x.entry.title)===query)sum+=180;else if(norm(x.entry.h1)===query)sum+=125;else if(x.title.includes(query))sum+=62;
      if(x.keywords.includes(query))sum+=32;
      if(x.head.includes(query))sum+=18;
      if(x.description.includes(query))sum+=11;
    }
    for (const word of words){
      const exact=word.length>2 ? new RegExp('(?:^| )'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?: |$)') : null;
      const has=field=>exact?exact.test(field):field.split(' ').includes(word);
      if(has(x.title))sum+=16;
      if(has(x.keywords))sum+=8;
      if(has(x.head))sum+=4;
      if(has(x.description))sum+=3;
      if(has(x.content))sum+=1;
    }
    if(x.category==='service' && norm(x.entry.title)===query)sum+=6;
    // A precise service/doctor/policy page outranks a broad hub for the same clinical query.
    if(x.category==='service' && /\b(procedure|treatment|infusion|iud|implanon|ecg|spirometry|vaccine|skin check)\b/.test(query))sum+=8;
    if(x.category==='doctor' && /\b(dr|doctor|gp|practitioner)\b/.test(query))sum+=8;
    if(x.entry.url==='book-appointment.html' && /\b(book|booking|appointment|hotdoc)\b/.test(query))sum+=30;
    return sum;
  };
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const launcher=document.createElement('button'); launcher.type='button'; launcher.className='digital-reception-launcher'; launcher.setAttribute('aria-expanded','false'); launcher.setAttribute('aria-controls','digital-reception-panel'); launcher.setAttribute('aria-label','Open Digital Reception'); launcher.setAttribute('aria-haspopup','dialog'); launcher.innerHTML='<span class="digital-reception-launcher-full">Digital Reception</span><span class="digital-reception-launcher-compact" aria-hidden="true">Reception</span>';
  const panel=document.createElement('section'); panel.id='digital-reception-panel'; panel.className='digital-reception-panel'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-labelledby','digital-reception-title'); panel.setAttribute('aria-describedby','digital-reception-disclosure'); panel.setAttribute('aria-hidden','true'); panel.setAttribute('tabindex','-1');
  panel.innerHTML=`<div class="digital-reception-head"><div><h2 class="digital-reception-title" id="digital-reception-title">Digital Reception</h2><p>Find information and the next step</p></div><button type="button" class="digital-reception-close" aria-label="Close Digital Reception">Close</button></div><div class="digital-reception-body"><p class="digital-reception-disclosure" id="digital-reception-disclosure">I use information published on this website only. I do not access medical records or search the public internet, and I cannot provide medical advice. Please do not enter personal or health information.</p><label class="digital-reception-label" for="digital-reception-query">How can we help you today?</label><div class="digital-reception-search-row"><input class="digital-reception-input" id="digital-reception-query" type="search" autocomplete="off" placeholder="e.g. headache, referral, appointment"><button class="digital-reception-search" type="button">Find</button></div><div class="digital-reception-quick" aria-label="Common topics"><button type="button">Book appointment</button><button type="button">Parking</button><button type="button">Test results</button><button type="button">Fees</button><button type="button">After hours</button><button type="button">AI transcription</button></div><div class="digital-reception-results" aria-live="polite"></div><p class="digital-reception-status">If you cannot find what you need, reception can help.</p><div class="digital-reception-actions"><a class="wmc-book-appointment" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox" data-hotdoc-widget="lightbox" data-hotdoc-button>Book Appointment</a><a href="tel:+61732173344">Call Reception</a></div></div>`;
  const dock=document.querySelector('.persistent-care-actions');
  const dockInner=dock&&dock.querySelector('.persistent-care-actions-inner');
  if(dockInner){
    launcher.classList.add('digital-reception-dock-action');
    dockInner.append(launcher);
    dock.setAttribute('aria-label','Book, call, and reception');
    document.body.classList.add('has-action-dock');
    document.body.append(panel);
  }else{
    document.body.append(launcher,panel);
  }
  const close=panel.querySelector('.digital-reception-close'), input=panel.querySelector('.digital-reception-input'), find=panel.querySelector('.digital-reception-search'), results=panel.querySelector('.digital-reception-results');
  let returnFocus=null;
  let inertSnapshot=[];
  // Prevent keyboard/screen-reader traversal behind the modal while preserving
  // pre-existing inert state, so nothing unrelated becomes interactive on close.
  const setPageInactive=()=>{
    const keepHeader=window.innerWidth<=767;
    inertSnapshot=[...document.body.children].filter(el=>el!==panel&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
    inertSnapshot.forEach(([el])=>{
      if(keepHeader && el.tagName==='HEADER')return;
      el.inert=true;
    });
  };
  const restorePage=()=>{inertSnapshot.forEach(([el,wasInert])=>{if(el.isConnected)el.inert=wasInert;});inertSnapshot=[];};
  const focusable=()=>[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length);
  const open=()=>{
    if(panel.classList.contains('is-open'))return;
    if(window.innerWidth<=767 && window.WMCNavigation) window.WMCNavigation.closeCompact();
    returnFocus=(document.activeElement && document.activeElement!==document.body && typeof document.activeElement.focus==='function') ? document.activeElement : launcher;
    panel.classList.add('is-open');panel.setAttribute('aria-hidden','false');launcher.setAttribute('aria-expanded','true');
    document.body.classList.add('digital-reception-open');
    setPageInactive();
    // Focus immediately after inert is applied, with a frame retry for browsers
    // that defer focus during style/layout work. Prevents a transient body-focus state.
    input.focus({preventScroll:true});
    requestAnimationFrame(()=>{if(panel.classList.contains('is-open')&&document.activeElement!==input)input.focus({preventScroll:true});});
    // A late fallback handles assistive technology / browser inert focus timing.
    setTimeout(()=>{if(panel.classList.contains('is-open')&&!panel.contains(document.activeElement))input.focus({preventScroll:true});},90);
    results.innerHTML='<span class="digital-reception-status">Preparing search information…</span>';
    loadIndex().then(() => {
      if (panel.classList.contains('is-open') && !input.value.trim()) {
        results.innerHTML='<span class="digital-reception-status">Enter a topic or question to search this website.</span>';
      }
    }).catch(() => { if(panel.classList.contains('is-open')) indexUnavailable(); });
  };
  const shut=(restore=true)=>{
    panel.classList.remove('is-open');panel.setAttribute('aria-hidden','true');launcher.setAttribute('aria-expanded','false');
    document.body.classList.remove('digital-reception-open');
    document.body.classList.remove('booking-journey-held');
    restorePage();
    if(window.WMCBookingArchitecture)window.WMCBookingArchitecture.sync();
    if(restore){const target=(returnFocus&&typeof returnFocus.focus==='function'&&document.contains(returnFocus))?returnFocus:launcher;target.focus({preventScroll:true});}
    returnFocus=null;
  };
  window.WMCDigitalReception={close(){if(panel.classList.contains('is-open'))shut(false);}};
  const trapFocus=e=>{if(e.key!=='Tab'||!panel.classList.contains('is-open'))return;const items=focusable();if(!items.length){e.preventDefault();panel.focus({preventScroll:true});return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
  launcher.addEventListener('click',open); close.addEventListener('click',()=>shut(true));
  document.addEventListener('keydown',e=>{if(!panel.classList.contains('is-open'))return;if(e.key==='Escape'){e.preventDefault();shut(true);return;}trapFocus(e);});
  document.addEventListener('focusin',e=>{
    if(!panel.classList.contains('is-open')||panel.contains(e.target))return;
    const toggle=document.querySelector('.menu-toggle');
    if(window.innerWidth<=767 && toggle && (e.target===toggle || toggle.contains(e.target)))return;
    input.focus({preventScroll:true});
  });
  panel.querySelectorAll('[data-hotdoc-button]').forEach(link=>link.addEventListener('click',()=>shut(false)));
  const searchAnnouncement=document.createElement('p');
  searchAnnouncement.className='wmc-visually-hidden';
  searchAnnouncement.setAttribute('role','status');
  searchAnnouncement.setAttribute('aria-live','polite');
  searchAnnouncement.setAttribute('aria-atomic','true');
  results.setAttribute('aria-live','off');
  results.parentNode.insertBefore(searchAnnouncement,results);
  // Intent detection prioritises real patient information. Care options are
  // offered only when linked from a published guide; never claim a diagnosis.
  const TOPIC_SIGNALS = [
    [/\b(cardiovascular risk|cvd risk|heart attack risk|five year risk|5 year risk|aus cvd)\b/, 'knowledge/articles/understanding-your-cardiovascular-risk.html'],
    [/\b(neck pain|stiff neck|neck stiffness|neck strain|neck and shoulder pain)\b/, 'knowledge/articles/understanding-neck-pain.html'],
    [/\b(sudden|worst|emergency|thunderclap)\b.{0,30}\bheadache\b/, 'knowledge/articles/when-is-a-headache-an-emergency.html'],
    [/\bheadache\b.{0,20}\b(emergency|sudden|worst)\b/, 'knowledge/articles/when-is-a-headache-an-emergency.html'],
    [/\b(migraine|aura)\b/, 'knowledge/articles/migraine-or-headache-how-do-i-tell-the-difference.html'],
    [/\b(frequent|regular|repeated|recurring|recurrent|keep getting|often get)\b.{0,25}\bheadaches?\b/, 'knowledge/articles/what-causes-frequent-headaches.html'],
    [/\bheadaches?\b/, 'knowledge/articles/when-should-i-see-a-gp-about-headaches.html'],
    // Exact patient/life-stage intentions take precedence over broad text ranking.
    [/\b(children s|childrens|children|child|kids|kid|baby|paediatric|pediatric)\s+health\b/, 'knowledge/articles/common-childhood-illnesses.html'],
    [/\b(women s|womens|woman s|female)\s+health\b/, 'knowledge/articles/womens-health-checks-at-different-stages-of-life.html'],
    [/\b(men s|mens|male)\s+health\b/, 'knowledge/articles/health-checks-every-man-should-consider.html'],
    [/\b(healthy ageing|healthy aging|ageing well|aging well|older adults health|senior health)\b/, 'knowledge/articles/healthy-ageing-prevention-falls-vaccination-reviews.html'],
    [/\b(child|toddler|baby|kid|infant)\b.{0,25}\b(rash|hives|skin spots)\b|\b(rash|hives|skin spots)\b.{0,25}\b(child|toddler|baby|kid|infant)\b/, 'knowledge/articles/common-childhood-illnesses.html'],
    [/\b(child|toddler|baby|kid)\b.{0,25}\bcough\b/, 'knowledge/articles/when-should-a-child-with-a-cough-see-a-gp.html'],
    [/\b(sore throat|strep|tonsil)\b.{0,35}\b(viral|bacterial|antibiotic)\b|\b(viral|bacterial|antibiotic)\b.{0,35}\b(sore throat|strep|tonsil)\b/, 'knowledge/articles/is-my-sore-throat-viral-or-bacterial.html'],
    [/\b(sore throat|strep throat|tonsillitis)\b/, 'knowledge/articles/sore-throat-when-should-i-see-a-doctor.html'],
    [/\b(persistent|chronic|long lasting|lingering|8 weeks)\b.{0,25}\bcough\b|\bcough\b.{0,25}\b(persistent|chronic|long lasting|lingering|weeks|months)\b/, 'knowledge/articles/what-causes-a-persistent-cough.html'],
    [/\bcough\b/, 'knowledge/articles/why-won-t-my-cough-go-away.html'],
    [/\b(back pain|sciatica)\b/, 'knowledge/articles/back-pain-when-should-i-see-a-gp.html'],
    [/\b(chronic pain|persistent pain)\b/, 'knowledge/articles/chronic-pain-when-should-i-seek-help.html'],
    [/\b(muscle pain|joint pain|joint stiffness|arthritis|osteoarthritis|osteo arthritis|sore joints?)\b/, 'knowledge/articles/understanding-muscle-and-joint-pain.html'],
    [/\bpain\b/, 'knowledge/articles/when-should-i-be-concerned-about-pain.html'],
    [/\b(diabetes|diabetic)\b.{0,30}\b(care plan|management plan|allied health)\b/, 'knowledge/articles/diabetes-care-plans-explained.html'],
    [/\b(diabetes|diabetic)\b.{0,25}\b(monitor|hba1c|check|blood test)\b/, 'knowledge/articles/diabetes-monitoring-explained.html'],
    [/\b(diabetes|diabetic)\b.{0,25}\b(complication|prevent|foot|eye|kidney)\b/, 'knowledge/articles/preventing-diabetes-complications.html'],
    [/\btype 2 diabetes\b/, 'knowledge/articles/understanding-type-2-diabetes.html'],
    [/\b(diabetes|diabetic)\b/, 'knowledge/articles/living-with-diabetes.html'],
    [/\b(blood pressure|hypertension)\b.{0,30}\b(high|worried|concerned|dangerous|low)\b/, 'knowledge/articles/when-should-i-be-concerned-about-blood-pressure.html'],
    [/\b(heart health check|heart check|heart health)\b/, 'knowledge/articles/heart-health-checks.html'],
    [/\b(blood pressure|hypertension)\b/, 'knowledge/articles/high-blood-pressure-explained.html'],
    [/\b(cholesterol|lipids|ldl|hdl)\b/, 'knowledge/articles/cholesterol-explained.html'],
    [/\b(first|initial)\b.{0,25}\b(pregnan|antenatal)\b/, 'knowledge/articles/your-first-pregnancy-gp-appointment.html'],
    [/\b(antenatal|maternity care)\b/, 'knowledge/articles/what-happens-during-antenatal-care.html'],
    [/\b(pregnant|pregnancy|conception|preconception|trying for a baby)\b/, 'knowledge/articles/planning-a-pregnancy.html'],
    [/\b(weight|weight management|obesity)\b.{0,25}\b(gp|doctor|talk|speak)\b/, 'knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html'],
    [/\b(weight|weight management|obesity)\b/, 'knowledge/articles/healthy-weight-management.html'],
    [/\b(lifestyle|healthy habit|healthy eating)\b/, 'knowledge/articles/understanding-healthy-lifestyle-changes.html'],
    [/\b(always tired|tiredness|tired all the time|feeling tired|constantly tired|fatigue|fatigued|exhausted|exhaustion|no energy|low energy|daytime sleepiness)\b/, 'knowledge/articles/why-am-i-always-tired.html'],
    [/\b(sleep|insomnia|snor|sleep apnea|sleep apnoea)\b.{0,25}\b(gp|doctor|talk|speak)\b/, 'knowledge/articles/when-should-i-speak-to-a-gp-about-sleep.html'],
    [/\b(sleep|insomnia|snor|sleep apnea|sleep apnoea)\b/, 'knowledge/articles/sleep-problems-explained.html'],
    [/\b(adhd|add|attention deficit)\b.{0,30}\b(referral|specialist|psychiatrist)\b/, 'knowledge/articles/understanding-adhd-referrals.html'],
    [/\b(adhd|add|attention deficit)\b.{0,30}\b(assess|diagnos|test)\b/, 'knowledge/articles/when-should-i-seek-adhd-assessment.html'],
    [/\b(adhd|attention deficit|neurodivers)\b/, 'knowledge/articles/adhd-assessment-pathways.html'],
    [/\b(menopause|menopausal|hrt|mht)\b.{0,35}\b(mood|depress|anxiety|mental health)\b/, 'knowledge/articles/mental-health-and-menopause.html'],
    [/\b(hrt|mht|hormone replacement|menopausal hormone therapy)\b/, 'knowledge/articles/hrt-discussions-with-your-gp.html'],
    [/\b(menopause|menopausal|hot flushes|hot flush|night sweats|night sweat)\b/, 'knowledge/articles/menopause-symptoms-explained.html'],

    [/(?:\banxiety\b|\banxious\b|\bpanic\b)/, 'knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html'],
    [/\b(stress|stressed)\b/, 'knowledge/articles/anxiety-vs-stress-what-is-the-difference.html'],
    [/\bburnout\b/, 'knowledge/articles/when-should-i-seek-help-for-burnout.html'],
    [/\b(depression|depressed|low mood)\b/, 'knowledge/articles/how-can-a-gp-support-depression.html'],
    [/\b(mental health care plan|mental health plan)\b/, 'knowledge/articles/what-happens-during-a-mental-health-care-plan.html'],
    [/\bperimenopaus/, 'knowledge/articles/understanding-perimenopause.html'],
    [/\bmenopaus/, 'knowledge/articles/understanding-menopause.html'],
    [/\b(cervical screening|pap smear)\b/, 'knowledge/articles/when-should-i-have-a-cervical-screening-test.html'],
    [/\b(prostate|psa)\b/, 'knowledge/articles/understanding-prostate-health.html'],
    [/\b(skin cancer|melanoma)\b/, 'knowledge/articles/understanding-skin-cancer-risks.html'],
    [/\bskin check\b/, 'knowledge/articles/when-should-i-book-a-skin-check.html'],
    [/\bfever\b/, 'knowledge/articles/when-should-i-be-concerned-about-a-fever.html'],
    [/\b(diabetes|diabetic)\b/, 'knowledge/articles/living-with-diabetes-gp-monitoring-long-term-management.html'],
    [/\b(cholesterol|lipids)\b/, 'knowledge/articles/understanding-cholesterol.html'],
    [/\b(blood pressure|hypertension)\b/, 'knowledge/articles/blood-pressure-explained.html'],
    [/\basthma\b/, 'knowledge/articles/managing-asthma.html'],
    [/\b(breast health|breast lump|breast screening)\b/, 'knowledge/articles/breast-health-changes-screening-when-to-see-a-gp.html'],
    [/\b(travel vaccine|travel vaccin|overseas vaccin)\b/, 'knowledge/articles/travel-vaccinations-before-overseas-travel.html'],
    [/\bflu vaccin/, 'knowledge/articles/influenza-vaccination-who-should-consider-it.html'],
    [/\bwinter (illness|respiratory|cold)\b/, 'knowledge/articles/managing-winter-respiratory-illness.html'],
    [/\b(telehealth|video appointment|phone appointment)\b/, 'knowledge/articles/when-can-i-use-telehealth.html'],
    [/\b(childhood vaccin|kids vaccin|child immunis)\b/, 'knowledge/articles/childhood-vaccinations-explained.html'],
    [/\b(falls prevention|falls risk|healthy ageing)\b/, 'knowledge/articles/healthy-ageing-prevention-falls-vaccination-reviews.html']
  ];
  // Show only actual matching pages. Broad free-text matches inside unrelated
  // articles should never substitute for a relevant patient information guide.
  const RESULTS_PER_PAGE=5;
  const GENERIC_QUESTION_WORDS=new Set(['concerned','worried','doctor','gp','should','could','would','see','speak','help','causes','cause','frequent','often','regular','understanding','understand','explained','explain','during','happens','happen','seek','care','health','issue','issues','problem','problems','symptom','symptoms','about','much','been','long','away','always','be','being','was','were','has','had','will','would','am','it','its','why','vs','versus','won','difference','between','s','their','health']);
  // Navigational searches (rather than clinical topics) should open the matching
  // administrative page, not incidental patient articles mentioning bookings.
  const DIRECT_PAGES=[
    [/\b(?:medical certificates?(?: for work)?|sick notes?|sick certificates?)\b/,'patient-forms.html'],
    [/\b(?:commercial driver|uber|rideshare|drivers?) medicals?\b/,'services/medical-procedures.html'],
    [/\b(?:work\s*cover|work injury)\b/,'services/medical-procedures.html'],
    [/\binsurance (?:medicals?|forms?)\b/,'fees-billing.html'],
    [/\binfection (?:prevention|control)\b/,'infection-prevention-control.html'],
    [/\b(?:urinary tract infections?|bladder infections?|water infections?|wee infections?|utis?)\b/,'knowledge/articles/is-a-water-infection-the-same-as-a-uti.html'],
    [/\b(?:hay ?fever|allergic rhinitis)\b/,'knowledge/articles/is-hay-fever-a-fever.html'],
    [/\b(?:school sores?|impetigo)\b/,'knowledge/articles/what-are-school-sores.html'],
    [/\b(?:gastroenteritis|stomach bugs?|tummy bugs?|gastro bugs?|gastro)\b/,'knowledge/articles/is-a-tummy-bug-the-same-as-gastro.html'],
    [/\b(?:vaginal thrush|thrush)\b/,'knowledge/articles/is-this-thrush.html'],
    [/\b(?:blocked sinuses|sinusitis|sinus infections?|sinus problems|sinus pain|sinus)\b/,'knowledge/articles/is-this-sinus.html'],
    [/\b(book|booking|appointment|hotdoc)\b/,'book-appointment.html'],
    [/\b(referrals?|specialist referral|refer me)\b/,'referrals.html'],
    [/\b(scripts?|prescriptions?|repeat medication|refill|renew medication)\b/,'repeat-scripts.html'],
    [/\b(results?|test results?|blood test|pathology report|scan result)\b/,'test-results.html'],
    [/\b(parking|car park|carpark|where do i park|directions|drop off)\b/,'access-parking.html'],
    [/\b(earache|ear ache|sore ears?)\b/,'services/ear-care-ear-syringing.html'],
    [/\b(fees|cost|pricing|billing)\b/,'fees-billing.html'],
    [/\b(after hours|clinic closed|out of hours)\b/,'after-hours-care.html'],
    [/\b(ai transcription|transcription|recording consent)\b/,'ai-transcription-consent.html'],
  ];
  // Phrases that collide with a shorter word, or that have no published page.
  // Blocking the colliding page keeps hay fever off the fever guide, sore joints
  // and sore ear off sore throat, water infection off infection control, a
  // medical certificate off About Us, cold sore off sore throat and school sores,
  // period pain off the general pain guide, and shingles off winter illness.
  const blockedDestinations=query=>{
    const urls=[];
    if(/\bhay ?fever\b|\bhayfever\b/.test(query)) urls.push('knowledge/articles/when-should-i-be-concerned-about-a-fever.html');
    if(/\bsore joints?\b|\b(sore ears?|earache|ear ache)\b/.test(query)) urls.push('knowledge/articles/sore-throat-when-should-i-see-a-doctor.html');
    if(/\b(water|wee) infections?\b/.test(query)) urls.push('infection-prevention-control.html');
    if(/\binfection (?:control|prevention)\b/.test(query)) urls.push('knowledge/articles/is-a-water-infection-the-same-as-a-uti.html');
    if(/\bmedical certificates?\b/.test(query)) urls.push('about-us.html');
    if(/\bcold sores?\b/.test(query)){
      urls.push('knowledge/articles/sore-throat-when-should-i-see-a-doctor.html');
      urls.push('knowledge/articles/is-my-sore-throat-viral-or-bacterial.html');
      urls.push('knowledge/articles/what-are-school-sores.html');
    }
    if(/\b(?:period|menstrual) pains?\b/.test(query)) urls.push('knowledge/articles/when-should-i-be-concerned-about-pain.html');
    if(/\bshingles\b/.test(query)) urls.push('knowledge/articles/managing-winter-respiratory-illness.html');
    return new Set(urls);
  };
  const unpublishedPatientLanguage=query=>/\bcold sores?\b|\b(?:period|menstrual) pains?\b|\bshingles\b/.test(query);
  const clinicBookingLink=panel.querySelector('.digital-reception-actions [data-hotdoc-button]');
  const bookingActions=panel.querySelector('.digital-reception-actions');
  const BOOKING_URL=clinicBookingLink.href;
  // One booking destination. The clinic button stays only when no practitioner booking is shown.
  // Emergency hides the whole bar so 000, Lifeline, the emergency department and urgent GP advice stand alone.
  const setBookingMode=mode=>{
    const suppress=mode==='held'||mode==='emergency';
    clinicBookingLink.hidden=suppress;
    if(suppress)clinicBookingLink.setAttribute('tabindex','-1');
    else clinicBookingLink.removeAttribute('tabindex');
    // A practitioner journey, phone handoff, or emergency owns the only next step.
    // The clinic HotDoc button and Call Reception in this bar stay hidden.
    bookingActions.hidden=suppress;
    bookingActions.classList.remove('is-single');
    document.body.classList.toggle('booking-journey-held',suppress);
    if(window.WMCBookingArchitecture)window.WMCBookingArchitecture.sync();
  };
  if(clinicBookingLink){
    try{
      const clinicUrl=new URL(clinicBookingLink.href);
      const clinicLabel=clinicBookingLink.textContent.replace(/\s+/g,' ').trim();
      if(/\/doctors\/?$/.test(clinicUrl.pathname) && (clinicLabel==='Book Online'||clinicLabel==='Book Now'||clinicLabel==='Book an Appointment')){
        clinicBookingLink.textContent='Book Appointment';
      }
    }catch(_){}
  }
  const RESULTS_PER_BATCH=5;
  let shownResults=[],shownCount=0,activeIntent='clinical',careContext=null;
  const canonical=text=>norm(text).replace(/\bheadaches\b/g,'headache').replace(/\bcoughs\b/g,'cough')
    .replace(/\bpains\b/g,'pain').replace(/\bvaccinations\b/g,'vaccination');
  const hasWord=(field,word)=>(' '+canonical(field)+' ').includes(' '+canonical(word)+' ');
  const clearResults=()=>{shownResults=[];shownCount=0;careContext=null;activeIntent='clinical';};
  const getEntry=getCatalogEntry;
  // Published profile facts used only to route a practitioner request.
  // Gender is not a published field and is never inferred from a name.
  const PRACTITIONER_HOTDOC='https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/';
  const PRACTITIONERS=[
    {id:'anand', name:'Dr Anand Singh', given:'Anand', surname:'Singh', role:'gp', url:'doctors/dr-anand-singh.html', languages:['english','hindi'], leads:[{tag:'dermatology',rank:1,label:'dermatology'},{tag:'womens health',rank:2,label:"women's health"},{tag:'child health',rank:2,label:'child health'},{tag:'geriatric',rank:3,label:'geriatric medicine'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-anand-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:''},
    {id:'debra', name:'Dr Debra Larkins', given:'Debra', surname:'Larkins', role:'gp', url:'doctors/dr-debra-larkins.html', languages:['english'], leads:[{tag:'antenatal',rank:1,label:'shared antenatal care'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-debra-larkins-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:''},
    {id:'ranawake', name:'Dr Gemunu Suresh Ranawake', given:'Gemunu', surname:'Ranawake', role:'gp', url:'doctors/dr-gemunu-suresh-ranawake.html', languages:['english','sinhala'], leads:[{tag:'child health',rank:2,label:"children's health"},{tag:'mental health',rank:2,label:'mental health'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-gemunu-ranawake-strictly-doing-teleheath-for-female-patients-only-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:'Male patients cannot book. Female patients can be seen by telehealth only, with agreement to a telehealth consultation.'},
    {id:'karimi', name:'Dr Kooshyar Karimi', given:'Kooshyar', surname:'Karimi', role:'gp', url:'doctors/dr-kooshyar-karimi.html', languages:['arabic','english','persian','turkish'], leads:[{tag:'skin',rank:4,label:'procedural skin care and excisions'},{tag:'emergency',rank:2,label:'emergency medicine'},{tag:'internal',rank:2,label:'internal medicine'},{tag:'cosmetic',rank:3,label:'cosmetic and procedural medicine'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-kooshyar-karimi-2?wp=w_lightbox', restriction:''},
    {id:'mary', name:'Dr Mary Abadir', given:'Mary', surname:'Abadir', role:'specialist', url:'doctors/dr-mary-abadir.html', languages:[], leads:[{tag:'pregnancy',rank:1,label:'pregnancy care'},{tag:'menopause',rank:1,label:'menopause'},{tag:'gynaecology',rank:1,label:'gynaecology'}], booking:'phone', bookingUrl:'tel:+61732173344', restriction:''},
    {id:'nirupa', name:'Dr Nirupa Sivathasan', given:'Nirupa', surname:'Sivathasan', role:'gp', url:'doctors/dr-nirupa-sivathasan.html', languages:[], leads:[], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-nirupa-sivathasan?wp=w_lightbox', restriction:''},
    {id:'sambo', name:'Dr Sambo Luon', given:'Sambo', surname:'Luon', role:'gp', url:'doctors/dr-sambo-luon.html', languages:['english','khmer','mandarin'], leads:[{tag:'preventive',rank:1,label:'preventive medicine'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-sambo-luon-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:''},
    {id:'steven', name:'Dr Steven Chang', given:'Steven', surname:'Chang', role:'chiro', url:'doctors/dr-steven-chang.html', languages:['english','mandarin','taiwanese'], leads:[{tag:'chiropractic',rank:1,label:'chiropractic care'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-steven-chang-1?wp=w_lightbox', restriction:''},
    {id:'sumita', name:'Dr Sumita Singh', given:'Sumita', surname:'Singh', role:'gp', url:'doctors/dr-sumita-singh.html', languages:['english','hindi'], leads:[{tag:'adhd',rank:1,label:'mental health, including the ADHD information linked from the published profile'},{tag:'womens health',rank:1,label:"women's health"},{tag:'mental health',rank:1,label:'mental health'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-sumita-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:''},
    {id:'tanya', name:'Dr Tanya Goodwill', given:'Tanya', surname:'Goodwill', role:'gp', url:'doctors/dr-tanya-goodwill.html', languages:['english'], leads:[{tag:'womens health',rank:2,label:"women's health"},{tag:'mental health',rank:2,label:'mental health care'},{tag:'skin',rank:3,label:'skin checks'},{tag:'chronic',rank:4,label:'complex chronic medical conditions'},{tag:'child health',rank:3,label:"children's health"}], also:['adhd','maternity','diabetes'], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox', restriction:''},
    {id:'gul', name:'Dr Usman Gul', given:'Usman', surname:'Gul', role:'gp', url:'doctors/dr-usman-gul.html', languages:['english','urdu'], leads:[{tag:'mens health',rank:1,label:"men's health"}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-usman-gul-strictly-seeing-male-patients-only?wp=w_lightbox', restriction:'The practice lists Dr Gul as seeing male patients. Contact with female patients is telehealth only, with agreement to a telehealth consultation.'},
    {id:'wasantha', name:'Dr Wasantha Hettiarchchi', given:'Wasantha', surname:'Hettiarchchi', aliases:['hettiarachchi'], role:'gp', url:'doctors/dr-wasantha-hettiarchchi.html', languages:['english','sinhala'], leads:[{tag:'diabetes',rank:1,label:'diabetes management'},{tag:'mens health',rank:2,label:"men's health"},{tag:'pregnancy',rank:3,label:'pregnancy care'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'dr-wasantha-hettiarachchi-1?wp=w_lightbox', restriction:''},
    {id:'samuel', name:'Mr Samuel Stafford', given:'Samuel', surname:'Stafford', role:'physio', url:'doctors/mr-samuel-stafford.html', languages:[], leads:[{tag:'physiotherapy',rank:1,label:'physiotherapy'}], booking:'hotdoc', bookingUrl:PRACTITIONER_HOTDOC+'samuel-stafford-physiotherapist?wp=w_lightbox', restriction:''}
  ];
  const PRACTITIONER_TOPICS=[
    {id:'adhd', re:/\badhd\b/, lead:['adhd'], also:['adhd']},
    {id:'antenatal', re:/\bshared antenatal\b|\bantenatal care\b/, lead:['antenatal'], also:['maternity']},
    {id:'pregnancy', re:/\bpregnan|\bmaternity\b/, lead:['pregnancy','antenatal'], also:['maternity']},
    {id:'diabetes', re:/\bdiabet/, lead:['diabetes'], also:['diabetes']},
    {id:'skin', re:/\bskin check|\bskin cancer|\bmelanoma|\bdermatolog/, lead:['dermatology','skin'], also:['skin']},
    {id:'mens', re:/\bmens health\b|\bprostate\b/, lead:['mens health'], also:[]},
    {id:'womens', re:/\bwomens health\b/, lead:['womens health'], also:[]},
    {id:'menopause', re:/\bmenopause\b/, lead:['menopause'], also:['womens health']},
    {id:'cervical', re:/\bcervical\b|\bpap smear\b/, lead:['womens health'], also:['gynaecology']},
    {id:'chiro', re:/\b(chiropractor|chiropractic)\b/, lead:['chiropractic'], also:[]},
    {id:'physio', re:/\b(physiotherapist|physiotherapy|physio)\b/, lead:['physiotherapy'], also:[]}
  ];
  const PRACTITIONER_LANGS=[['hindi',/\bhindi\b/],['mandarin',/\bmandarin\b/],['urdu',/\burdu\b/],['sinhala',/\bsinhala\b/],['arabic',/\barabic\b/],['khmer',/\bkhmer\b/],['persian',/\b(persian|farsi)\b/],['turkish',/\bturkish\b/],['taiwanese',/\btaiwanese\b/]];
  const foldPractitionerQuery=raw=>norm(raw).replace(/\bmen s\b/g,'mens').replace(/\bwomen s\b/g,'womens');
  const hasPractitionerToken=(q,token)=>!!token && new RegExp('\\b'+token+'\\b').test(q);
  const genderPreference=q=>/\b(female|male)\s+(gp|doctor|practitioner)s?\b/.test(q) || /\b(female|male)\s+general\s+practitioner\b/.test(q) || /\b(woman|lady)\s+doctors?\b/.test(q) || /\bman\s+doctors?\b/.test(q);
  const practitionerRoleOk=(person,q)=>{
    if(/\b(chiropractor|chiropractic)\b/.test(q)) return person.role==='chiro';
    if(/\b(physiotherapist|physiotherapy|physio)\b/.test(q)) return person.role==='physio';
    if(/\b(obstetrician|gynaecologist|gynecologist|specialist)\b/.test(q)) return person.role==='specialist' || person.role==='gp';
    if(/\b(gp|general practitioner)\b/.test(q)) return person.role==='gp';
    if(/\bdoctors?\b/.test(q)) return person.role==='gp' || person.role==='specialist';
    return person.role==='gp' || person.role==='specialist';
  };
  const practitionerBlocked=(person,q)=>{
    const male=/\bmale\b/.test(q) || /\bprostate\b/.test(q) || /\bmens health\b/.test(q);
    const female=/\bfemale\b/.test(q) || /\b(woman|womens|menopause|cervical)\b/.test(q) || /\bpregnan/.test(q) || /\bantenatal\b/.test(q) || /\bmaternity\b/.test(q);
    if(person.id==='ranawake' && male) return true;
    if(person.id==='gul' && female && !male) return true;
    return false;
  };
  const nameMatches=q=>{
    const precise=PRACTITIONERS.filter(person=>q.includes(norm(person.name)) || (hasPractitionerToken(q,norm(person.given)) && (hasPractitionerToken(q,norm(person.surname)) || (person.aliases||[]).some(alias=>hasPractitionerToken(q,norm(alias))))));
    if(precise.length) return precise;
    const bySurname=PRACTITIONERS.filter(person=>hasPractitionerToken(q,norm(person.surname)) || (person.aliases||[]).some(alias=>hasPractitionerToken(q,norm(alias))));
    if(bySurname.length) return bySurname;
    const byGiven=PRACTITIONERS.filter(person=>hasPractitionerToken(q,norm(person.given)));
    return byGiven.length===1?byGiven:[];
  };
  const interestScore=(person,topics)=>{
    let best=0, reason='';
    for(const topic of topics){
      for(const tag of topic.lead){
        const lead=(person.leads||[]).find(item=>item.tag===tag);
        if(!lead) continue;
        const score=130-((lead.rank||1)-1)*8+((person.leads||[]).length<=2?20:0);
        if(score>best){best=score; reason='Matched on lead interest: '+lead.label+'.';}
      }
      if(best>=100) continue;
      for(const tag of topic.also||[]){
        const listed=(person.leads||[]).some(item=>item.tag===tag) || (person.also||[]).includes(tag);
        if(listed && 55>best){best=55; reason='Matched on a published interest related to this request.';}
      }
    }
    return {score:best, reason};
  };
  const orderPractitioners=rows=>rows.sort((a,b)=>b.score-a.score || a.surname.localeCompare(b.surname) || a.given.localeCompare(b.given));
  const rankPractitioners=(q,named)=>{
    if(named){
      return orderPractitioners(named.map(person=>({...person, score:1000, reason:'Matched by name.'}))).slice(0,3);
    }
    const topics=PRACTITIONER_TOPICS.filter(topic=>topic.re.test(q));
    const langs=PRACTITIONER_LANGS.filter(([,pattern])=>pattern.test(q)).map(([id])=>id);
    const rows=[];
    for(const person of PRACTITIONERS){
      if(!practitionerRoleOk(person,q) || practitionerBlocked(person,q)) continue;
      let score=0;
      const reasons=[];
      if(langs.length){
        const spoken=langs.filter(language=>person.languages.includes(language));
        if(!spoken.length) continue;
        score+=300;
        reasons.push('Matched because this practitioner speaks '+spoken.join(' and ')+'.');
      }
      if(topics.length){
        const hit=interestScore(person,topics);
        if(!hit.score) continue;
        score+=hit.score;
        reasons.push(hit.reason);
      }
      if(!langs.length && !topics.length){
        if(person.role!=='chiro' && person.role!=='physio') continue;
        score=200;
        reasons.push(person.role==='chiro'?'Matched by role: chiropractor.':'Matched by role: physiotherapist.');
      }
      if(score>0) rows.push({...person, score, reason:reasons.join(' ')});
    }
    return orderPractitioners(rows).slice(0,3);
  };
  const matchPractitioners=raw=>{
    const q=foldPractitionerQuery(raw);
    if(!q) return null;
    const named=nameMatches(q);
    if(named.length) return {kind:'people', people:rankPractitioners(q,named)};
    const topics=PRACTITIONER_TOPICS.filter(topic=>topic.re.test(q));
    const langs=PRACTITIONER_LANGS.filter(([,pattern])=>pattern.test(q)).map(([id])=>id);
    if(genderPreference(q) && !topics.length && !langs.length) return {kind:'gender'};
    const asking=/\b(who|which|help|need|want|looking|book|booking|appointment|doctor|doctors|gp|practitioner|specialist|speak|speaks|speaking|chiropractor|chiropractic|physiotherapist|physiotherapy|physio)\b/.test(q);
    if(!asking || (!topics.length && !langs.length)) return null;
    const people=rankPractitioners(q);
    if(!people.length) return {kind:'none', detail:langs.length?'No published practitioner lists that language for this request. Reception can help you book.':'No published practitioner lists that interest for this request. Reception can help you book.'};
    return {kind:'people', people};
  };
  const suggestPractitioner=raw=>{
    const q=foldPractitionerQuery(raw||'');
    if(!q || !PRACTITIONER_TOPICS.some(topic=>topic.re.test(q))) return null;
    return rankPractitioners(q)[0]||null;
  };
  const knownPractitioner=url=>PRACTITIONERS.find(person=>person.url===url)||null;
  const roleLabel=person=>({mary:'Obstetrician and gynaecologist',steven:'Chiropractor',samuel:'Physiotherapist'}[person.id]||'General practitioner');
  const bookingMethodText=person=>person.booking==='phone'?'Reception phone (07) 3217 3344':"This practitioner's HotDoc page";
  // Use real, published links from the chosen article. The list is already
  // collected and link-validated by the index builder; no clinical match is invented.
  const careFromGuide=(guide, raw)=>{
    if(!guide || !guide.url.startsWith('knowledge/articles/'))return null;
    const related=(guide.related||[]);
    const service=related.map(getEntry).find(e=>e?.category==='Service' && e.url.startsWith('services/'));
    const published=related.map(getEntry).find(e=>e?.category==='Doctor' && e.url.startsWith('doctors/'));
    const suggested=suggestPractitioner(raw);
    const practitioner=suggested || (published?knownPractitioner(published.url):null);
    const doctor=suggested?{url:suggested.url, h1:suggested.name, title:suggested.name}:(published||null);
    return (service||doctor)?{service, doctor, practitioner, matched:Boolean(suggested)}:null;
  };
  const itemMarkup=item=>`<a class="digital-reception-result" href="${esc(localHref(item.url))}"><strong>${esc(item.title||item.h1)}</strong><span>${esc(item.description||(item.headings||[]).slice(0,2).join(' · ')||'Read more on this page.')}</span></a>`;
  const articleBody=item=>`<a href="${esc(localHref(item.url))}"><strong>${esc(item.title||item.h1)}</strong><span>${esc(item.description||(item.headings||[]).slice(0,2).join(' · ')||'Read more on this page.')}</span></a>`;
  const practitionerCard=person=>`<article class="digital-reception-practitioner"><a href="${esc(localHref(person.url))}"><strong>${esc(person.name)}</strong><span>${esc(roleLabel(person))}</span></a><p>Why matched: ${esc(person.reason||'Named in the published guide above.')}</p>${person.restriction?`<p class="digital-reception-restriction">Restriction: ${esc(person.restriction)}</p>`:''}<p>Booking method: ${esc(bookingMethodText(person))}</p></article>`;
  const bookingAction=person=>{
    if(!person)return `<a class="digital-reception-journey-book" href="${esc(BOOKING_URL)}" data-hotdoc-widget="lightbox" data-hotdoc-button>Book Appointment</a>`;
    if(person.booking==='phone')return `<a class="digital-reception-journey-book" href="tel:+61732173344">Call reception to book ${esc(person.name)}</a>`;
    return `<a class="digital-reception-journey-book" href="${esc(person.bookingUrl)}" data-hotdoc-widget="lightbox" data-hotdoc-button>Book with ${esc(person.name)}</a>`;
  };
  const journeyStep=(number,title,body)=>`<li class="digital-reception-step"><span class="digital-reception-step-kicker">Step ${number}</span><strong class="digital-reception-step-title">${title}</strong>${body}</li>`;
  const moreMarkup=items=>items&&items.length?`<details class="digital-reception-more"><summary>More on this topic (${items.length})</summary><div class="digital-reception-more-list">${items.map(itemMarkup).join('')}</div></details>`:'';
  // Presentation only. Who is matched is decided before this runs.
  const renderJourney=({article,more,service,people,clinicFallback})=>{
    const list=(people||[]).slice(0,3);
    const primary=list[0]||null;
    const steps=[];
    if(article)steps.push(journeyStep(1,'Primary answer',articleBody(article)));
    if(service)steps.push(journeyStep(2,'Recommended service',`<a href="${esc(localHref(service.url))}"><strong>${esc(service.title||service.h1)}</strong></a>`));
    if(primary)steps.push(journeyStep(3,'Recommended practitioner',list.map(practitionerCard).join('')+'<p class="digital-reception-confirm">Availability and suitability must be confirmed.</p>'));
    else if(clinicFallback)steps.push(journeyStep(3,'Recommended practitioner',`<a href="${esc(localHref('team-general-practitioners.html'))}"><strong>View GP profiles</strong><span>No single practitioner is matched for this question.</span></a>`));
    if(primary||clinicFallback)steps.push(journeyStep(4,'Booking action',bookingAction(primary)));
    results.innerHTML=`<ol class="digital-reception-journey">${steps.join('')}</ol>`+moreMarkup(more);
    const articleName=article?(article.title||article.h1):'';
    searchAnnouncement.textContent=primary
      ?`Guided answer. ${articleName?articleName+'. ':''}${list.map(person=>person.name).join(', ')}. One booking action: ${bookingMethodText(primary)}.`
      :`Guided answer. ${articleName?articleName+'. ':''}One clinic booking action.`;
    setBookingMode(primary||clinicFallback?'held':'clinic');
  };
  const renderHandoff=match=>{
    if(match.kind==='gender'){
      searchAnnouncement.textContent='Gender preference is not published on practitioner profiles. Reception can help.';
      results.innerHTML=`<div class="digital-reception-result"><strong>Gender preference is not published.</strong><span>Practitioner profiles do not list a gender preference, so a female or male GP cannot be matched. Reception can help you choose.</span></div><a class="digital-reception-result" href="${esc(localHref('team-general-practitioners.html'))}"><strong>View GP profiles</strong><span>Read the published general practitioner profiles.</span></a><a class="digital-reception-journey-book" href="tel:+61732173344">Call reception</a>`;
    }else{
      searchAnnouncement.textContent='No matching practitioner is published for that request.';
      results.innerHTML=`<div class="digital-reception-result"><strong>No matching practitioner is published.</strong><span>${esc(match.detail)}</span></div><a class="digital-reception-journey-book" href="tel:+61732173344">Call reception</a>`;
    }
    setBookingMode('held');
  };
  const focusAnswer=requestId=>{
    requestAnimationFrame(()=>{
      if(requestId!==searchSerial||!panel.classList.contains('is-open'))return;
      const target=results.querySelector('.digital-reception-journey a[href], a.digital-reception-journey-book, a.digital-reception-result[href]');
      if(target)target.focus({preventScroll:false});
    });
  };
  const renderResults=()=>{
    if(activeIntent==='clinical'){
      const article=shownResults[0];
      const more=shownResults.slice(1);
      const person=careContext&&careContext.practitioner;
      renderJourney({article,more,service:careContext&&careContext.service,people:person?[person]:null,clinicFallback:!person});
      return;
    }
    setBookingMode('clinic');
    const visible=shownResults.slice(0,Math.min(shownCount,shownResults.length));
    const remaining=shownResults.length-visible.length;
    results.innerHTML=`<div class="digital-reception-results-heading"><strong>Information and next steps</strong><span>${shownResults.length} matching page${shownResults.length===1?'':'s'}</span></div>`+
      visible.map(itemMarkup).join('')+
      (remaining?`<button type="button" class="digital-reception-show-more" aria-label="Show more relevant website results">Show more (${remaining} remaining)</button>`:'');
    searchAnnouncement.textContent=`${shownResults.length} matching page${shownResults.length===1?'':'s'}; ${visible.length} displayed.${remaining?' More pages available.':''}`;
  };
  results.addEventListener('click',event=>{
    const booking=event.target.closest('.digital-reception-journey-book[data-hotdoc-button], .digital-reception-care-book[data-hotdoc-button]');
    if(booking){shut(false);return;}
    const more=event.target.closest('.digital-reception-show-more');
    if(!more)return;
    shownCount=Math.min(shownCount+RESULTS_PER_BATCH,shownResults.length);
    renderResults();
    const next=results.querySelector('.digital-reception-show-more');
    if(next)next.focus({preventScroll:true});
    else {
      const links=results.querySelectorAll('a.digital-reception-result');
      if(links.length)links[links.length-1].focus({preventScroll:true});
    }
  });
  results.addEventListener('toggle',event=>{
    const details=event.target;
    if(!details.open)return;
    const first=details.querySelector('a[href]');
    if(first)first.focus({preventScroll:true});
  },true);
  const run=async raw=>{
    const requestId=++searchSerial;
    const q=String(raw||'').trim();
    clearResults();
    results.removeAttribute('aria-busy');
    setBookingMode('clinic');
    if(!q){searchAnnouncement.textContent='Enter a topic or question.';results.innerHTML='<span class="digital-reception-status">Enter a topic or question to search this website.</span>';return;}
    if(emergency(q)){
      searchAnnouncement.textContent='Emergency information found. Call Triple Zero 000. Lifeline is 13 11 14. Emergency department and urgent GP options are shown.';
      results.innerHTML=`<div class="digital-reception-emergency"><strong>This needs urgent help.</strong><span>Digital Reception cannot assess symptoms or provide emergency advice. Use one of these options now.</span></div><a class="digital-reception-result" href="tel:000"><strong>Call 000</strong><span>Triple Zero for an ambulance in a life-threatening emergency.</span></a><a class="digital-reception-result" href="tel:131114"><strong>Lifeline</strong><span>Call 13 11 14 for 24-hour crisis support.</span></a><a class="digital-reception-result" href="${esc(localHref('after-hours-care.html'))}"><strong>Emergency department</strong><span>Princess Alexandra Hospital and Mater Hospital Brisbane adult emergency are listed on the After Hours Care page.</span></a><a class="digital-reception-result" href="tel:+61732173344"><strong>Urgent GP advice</strong><span>Call the clinic on (07) 3217 3344. When we are closed, call Hello Home Doctor on 134 100.</span></a>`;
      setBookingMode('emergency');
      focusAnswer(requestId);
      return;
    }
    const practitionerMatch=matchPractitioners(q);
    if(practitionerMatch && practitionerMatch.kind!=='people'){
      renderHandoff(practitionerMatch);
      focusAnswer(requestId);
      return;
    }
    // Searching feedback is deliberately shown only during a real query, not
    // as an invented appointment confirmation. This also prevents stale results
    // from remaining visible while a new query waits for the on-demand index.
    results.setAttribute('aria-busy','true');
    results.innerHTML='<span class="digital-reception-status">Finding relevant website information…</span>';
    searchAnnouncement.textContent='Finding relevant website information.';
    try{
      await loadIndex();
      const queryForRouting=norm(q);
      const routeBlocked=blockedDestinations(queryForRouting);
      const routeHints=TOPIC_SIGNALS.filter(([pattern,url])=>pattern.test(queryForRouting)&&!routeBlocked.has(url)).map(([,url])=>url);
      const routeDirect=DIRECT_PAGES.find(([pattern])=>pattern.test(queryForRouting));
      await loadShardsForQuery(q,routeHints,routeDirect);
    }
    catch(error){
      if(requestId===searchSerial){
        results.removeAttribute('aria-busy');
        if(practitionerMatch && practitionerMatch.kind==='people'){
          renderJourney({article:null,more:[],service:null,people:practitionerMatch.people,clinicFallback:false});
          focusAnswer(requestId);
          return;
        }
        if(panel.classList.contains('is-open'))indexUnavailable();
      }
      return;
    }
    if(requestId!==searchSerial||!panel.classList.contains('is-open'))return;
    results.removeAttribute('aria-busy');
    const query=norm(q), tokens=expand(q);
    // Editor-approved intent hints boost the relevant guide but NEVER replace
    // the set of other genuine matches (headache, pain, diabetes clusters, etc).
    const blocked=blockedDestinations(query);
    const hints=TOPIC_SIGNALS.filter(([pattern,url])=>pattern.test(query)&&!blocked.has(url)).map(([,url])=>url);
    const contentTerms=norm(q).split(' ').filter(w=>w.length>2&&!stopwords.has(w)&&!GENERIC_QUESTION_WORDS.has(w));
    const matched=searchable.map(record=>{
      const entry=record.entry;
      const isGuide=entry.category==='Knowledge Centre'&&entry.url.startsWith('knowledge/articles/');
      const text=canonical(entry.title+' '+entry.h1);
      const titleHits=contentTerms.filter(t=>hasWord(text,t)).length;
      const keywordHits=contentTerms.filter(t=>hasWord(record.keywords,t)).length;
      const hintIndex=hints.indexOf(entry.url);
      const hinted=hintIndex!==-1;
      const base=score(record,tokens,query);
      // Body-only mentions of pain, a rash or breathing problems do not make
      // a page a suitable health guide. Prefer actual titled subject coverage.
      const strongGuide=isGuide&&(hinted||titleHits>0||(keywordHits>=2&&base>=25));
      const suitableOther=!isGuide&&entry.category!=='Doctor'&&entry.category!=='Team'&&base>=18&&
        (titleHits>0||keywordHits>0||record.title.includes(query));
      const rank=base+titleHits*34+(hinted?165-hintIndex:0)+(isGuide?25:0);
      return {entry,isGuide,strongGuide,suitableOther,rank};
    });
    const guideMatches=matched.filter(item=>item.strongGuide&&!blocked.has(item.entry.url))
      .sort((a,b)=>b.rank-a.rank||a.entry.title.localeCompare(b.entry.title));
    if(practitionerMatch && practitionerMatch.kind==='people'){
      const primaryGuide=guideMatches[0]&&guideMatches[0].entry;
      const related=primaryGuide?careFromGuide(primaryGuide, q):null;
      renderJourney({
        article:primaryGuide||null,
        more:guideMatches.slice(1).map(item=>item.entry),
        service:related&&related.service||null,
        people:practitionerMatch.people,
        clinicFallback:false
      });
      focusAnswer(requestId);
      return;
    }
    // For ordinary information requests (parking, fees, test results), the
    // site's actual information pages remain searchable. For clinical searches,
    // service and doctor entries do not intrude on the guide results.
    const otherMatches=matched.filter(item=>item.suitableOther&&!blocked.has(item.entry.url))
      .sort((a,b)=>b.rank-a.rank||a.entry.title.localeCompare(b.entry.title));
    const CATCHMENT_SUBURBS=/\b(?:greenslopes|coorparoo|east brisbane|south brisbane|dutton park|kangaroo point|stones corner)\b/;
    const directListed=DIRECT_PAGES.find(([pattern])=>pattern.test(query));
    // A suburb question opens the one catchment page. A clinical topic, or an
    // existing direct page such as directions, keeps its own route.
    const direct=directListed || (hints.length===0 && CATCHMENT_SUBURBS.test(query) ? [CATCHMENT_SUBURBS,'local-healthcare-access.html'] : null);
    const directEntry=direct&&!blocked.has(direct[1])?getEntry(direct[1]):null;
    const clinicallyUnmatched=/\b(rash|rashes|hives|skin eruption|breathing issues?|breathing problems?|breathless|shortness of breath|short of breath|trouble breathing|wheezing|wheeze)\b/.test(query);
    const unpublished=unpublishedPatientLanguage(query)&&hints.length===0&&!directEntry;
    const selected=unpublished?[]:directEntry?[{entry:directEntry}]:guideMatches.length?guideMatches:(clinicallyUnmatched?[]:otherMatches);
    activeIntent=directEntry || (!guideMatches.length && !clinicallyUnmatched)?'task':'clinical';
    if(!selected.length){
      searchAnnouncement.textContent='No closely matching website information found.';
      const family=getEntry('services/family-health.html');
      if(clinicallyUnmatched && family){
        renderJourney({
          article:{url:'knowledge/index.html',title:'No directly matching guide found',description:'Try another search phrase or browse the Knowledge Centre. If you have urgent breathing difficulty, call 000.'},
          more:[],
          service:family,
          people:null,
          clinicFallback:true
        });
      }else{
        setBookingMode('clinic');
        results.innerHTML=`<div class="digital-reception-result"><strong>No directly matching guide found.</strong><span>Try another search phrase or browse the Knowledge Centre. If you have urgent breathing difficulty, call 000.</span></div><a class="digital-reception-result" href="${esc(localHref('knowledge/index.html'))}"><strong>Browse Knowledge Centre</strong><span>Explore patient education topics.</span></a>`;
      }
      focusAnswer(requestId);
      return;
    }
    shownResults=selected.map(item=>item.entry);
    careContext=activeIntent==='clinical'?careFromGuide(shownResults[0], q):null;
    shownCount=Math.min(RESULTS_PER_BATCH,shownResults.length);
    renderResults();
    focusAnswer(requestId);
  };
  find.addEventListener('click',()=>run(input.value)); input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(input.value);}}); panel.querySelectorAll('.digital-reception-quick button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;run(input.value);}));
})();
