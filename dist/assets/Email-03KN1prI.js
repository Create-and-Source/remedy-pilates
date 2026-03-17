import{E as e,G as t,H as n,W as r,j as i,n as a,q as o,v as s,x as c}from"./store-DdB3yLOh.js";var l=o(t(),1),u=r(),d={appointment:{name:`Appointment Reminder`,icon:`📅`,desc:`Remind patients of upcoming visits`,subject:`Your Appointment is Coming Up!`,body:`Hi [Patient],

This is a friendly reminder about your upcoming appointment:

Service: [Service]
Date: [Date]
Time: [Time]
Provider: [Provider]

Please arrive 10 minutes early. If you need to reschedule, reply to this email or call us.

See you soon!`},followup:{name:`Post-Treatment Follow-Up`,icon:`💝`,desc:`Check in after a treatment`,subject:`How Are You Feeling After Your Treatment?`,body:`Hi [Patient],

We hope you are feeling wonderful after your recent [Service] treatment!

Here are your aftercare reminders:
- [Aftercare tip 1]
- [Aftercare tip 2]
- [Aftercare tip 3]

If you have any questions or concerns, do not hesitate to reach out.

To maintain your results, we recommend scheduling your next session in [timeframe].

Warmly,
[Your MedSpa] Team`},promo:{name:`Special Offer`,icon:`✨`,desc:`Promote a deal or package`,subject:`Exclusive Offer Just For You`,body:`Hi [Patient],

We have something special for you!

[Offer details — e.g., 20% off your next Botox treatment]

This offer is valid through [end date]. Book online or reply to this email to reserve your spot.

Limited availability — do not miss out!

Best,
[Your MedSpa] Team`},newsletter:{name:`Monthly Newsletter`,icon:`📰`,desc:`Monthly updates and tips`,subject:`Monthly Update from [Your MedSpa]`,body:`Hi [Patient],

Here is what is new this month:

NEW SERVICES
- [New service or treatment]

SKIN TIPS
[Seasonal skincare advice]

SPECIAL OFFERS
- [Current promotions]

UPCOMING
- [Events or availability updates]

Thank you for trusting us with your care.

Warmly,
[Your MedSpa] Team`},reengagement:{name:`We Miss You`,icon:`💌`,desc:`Re-engage lapsed patients`,subject:`It Has Been a While — We Would Love to See You`,body:`Hi [Patient],

We noticed it has been a while since your last visit and wanted to check in!

Your last treatment was [Service] on [Date]. To maintain your beautiful results, we recommend scheduling a follow-up.

As a welcome back, enjoy [offer] on your next visit.

Book online or reply to schedule.

We miss you!
[Your MedSpa] Team`},blank:{name:`Start from Scratch`,icon:`📝`,desc:`Empty canvas`,subject:``,body:``}},f=[{id:`all`,name:`All Patients`,desc:`Everyone in your system`},{id:`members`,name:`Members`,desc:`Patients with membership`},{id:`recent`,name:`Recent Visitors`,desc:`Visited in last 30 days`},{id:`lapsed`,name:`Lapsed Patients`,desc:`No visit in 90+ days`},{id:`vip`,name:`VIP / High Spend`,desc:`Top spending patients`}];function p(){let t=n(),[,r]=(0,l.useState)(0);(0,l.useEffect)(()=>i(()=>r(e=>e+1)),[]);let[o,p]=(0,l.useState)(`compose`),[m,h]=(0,l.useState)(1),[g,_]=(0,l.useState)(`all`),[v,y]=(0,l.useState)(null),[b,x]=(0,l.useState)(``),[S,C]=(0,l.useState)(``),[w,T]=(0,l.useState)(!1),[E,D]=(0,l.useState)(``),O=(0,l.useRef)(null),k=s(),A=c(),j=e(),M=e=>{let t=e||g;if(t===`all`)return A.length;if(t===`members`)return A.filter(e=>e.membershipTier!==`None`).length;if(t===`recent`){let e=new Date;return e.setDate(e.getDate()-30),A.filter(t=>t.lastVisit&&new Date(t.lastVisit)>=e).length}if(t===`lapsed`){let e=new Date;return e.setDate(e.getDate()-90),A.filter(t=>t.lastVisit&&new Date(t.lastVisit)<e).length}return t===`vip`?A.filter(e=>e.totalSpent>5e5).length:0},N=f.find(e=>e.id===g)?.name||`All`,P=e=>{y(e);let t=d[e];x(t.subject.replace(`[Your MedSpa]`,j.businessName||`Your MedSpa`)),C(t.body.replace(/\[Your MedSpa\]/g,j.businessName||`Your MedSpa`))},F=()=>{!b.trim()||!S.trim()||(T(!0),setTimeout(()=>{a({subject:b,body:S,audience:N,status:`Sent`,recipientCount:M()}),T(!1),x(``),C(``),y(null),h(1),p(`sent`)},1200))},I=e=>{let t=O.current;if(!t)return;let n=t.selectionStart,r=t.selectionEnd,i=S.slice(n,r);C(S.slice(0,n)+e+i+e+S.slice(r))};return(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,marginBottom:24},children:(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h1`,{style:{font:`600 26px ${t.FONT}`,color:t.text,marginBottom:4},children:`Email`}),(0,u.jsx)(`p`,{style:{font:`400 14px ${t.FONT}`,color:t.text2},children:`Compose and send branded emails to your patients`})]})}),(0,u.jsx)(`div`,{style:{display:`flex`,gap:0,marginBottom:28,background:`#F0F0F0`,borderRadius:8,overflow:`hidden`,width:`fit-content`},children:[[`compose`,`Compose`],[`sent`,`Sent (${k.length})`]].map(([e,n])=>(0,u.jsx)(`button`,{onClick:()=>p(e),style:{padding:`9px 20px`,background:o===e?`#fff`:`transparent`,border:`none`,font:`500 13px ${t.FONT}`,color:o===e?t.text:t.text3,cursor:`pointer`,borderRadius:o===e?8:0,boxShadow:o===e?t.shadow:`none`},children:n},e))}),o===`compose`&&(0,u.jsxs)(`div`,{style:{maxWidth:720},children:[(0,u.jsx)(()=>(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8,marginBottom:28},children:[[1,2,3,4].map(e=>(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,u.jsx)(`div`,{onClick:()=>e<m&&h(e),style:{width:28,height:28,borderRadius:`50%`,display:`flex`,alignItems:`center`,justifyContent:`center`,background:m>=e?t.accent:`#E5E5E5`,color:m>=e?t.accentText:t.text3,font:`600 11px ${t.FONT}`,cursor:e<m?`pointer`:`default`},children:e}),e<4&&(0,u.jsx)(`div`,{style:{width:24,height:2,background:m>e?t.accent:`#E5E5E5`,borderRadius:1}})]},e)),(0,u.jsx)(`span`,{style:{font:`400 12px ${t.FONT}`,color:t.text3,marginLeft:8},children:[`Audience`,`Template`,`Write`,`Preview`][m-1]})]}),{}),m===1&&(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h2`,{style:{font:`600 20px ${t.FONT}`,color:t.text,marginBottom:20},children:`Who is this for?`}),(0,u.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(200px, 1fr))`,gap:10},children:f.map(e=>(0,u.jsxs)(`button`,{onClick:()=>_(e.id),style:{...t.cardStyle,padding:`18px 16px`,textAlign:`left`,cursor:`pointer`,borderColor:g===e.id?t.accent:`#E5E5E5`,borderWidth:g===e.id?2:1},children:[(0,u.jsx)(`div`,{style:{font:`600 14px ${t.FONT}`,color:g===e.id?t.accent:t.text,marginBottom:4},children:e.name}),(0,u.jsx)(`div`,{style:{font:`400 12px ${t.FONT}`,color:t.text3,marginBottom:6},children:e.desc}),(0,u.jsxs)(`div`,{style:{font:`600 12px ${t.MONO}`,color:t.accent},children:[M(e.id),` patients`]})]},e.id))}),(0,u.jsx)(`button`,{onClick:()=>h(2),style:{...t.pillAccent,marginTop:20},children:`Next — Choose Template`})]}),m===2&&(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h2`,{style:{font:`600 20px ${t.FONT}`,color:t.text,marginBottom:20},children:`Pick a starting point`}),(0,u.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(180px, 1fr))`,gap:10},children:Object.entries(d).map(([e,n])=>(0,u.jsxs)(`button`,{onClick:()=>P(e),style:{...t.cardStyle,padding:`18px 16px`,textAlign:`left`,cursor:`pointer`,borderColor:v===e?t.accent:`#E5E5E5`,borderWidth:v===e?2:1},children:[(0,u.jsx)(`div`,{style:{fontSize:28,marginBottom:8},children:n.icon}),(0,u.jsx)(`div`,{style:{font:`600 13px ${t.FONT}`,color:v===e?t.accent:t.text,marginBottom:4},children:n.name}),(0,u.jsx)(`div`,{style:{font:`400 11px ${t.FONT}`,color:t.text3},children:n.desc})]},e))}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:10,marginTop:20},children:[(0,u.jsx)(`button`,{onClick:()=>h(1),style:t.pillGhost,children:`Back`}),(0,u.jsx)(`button`,{onClick:()=>h(3),style:t.pillAccent,children:`Next — Write`})]})]}),m===3&&(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h2`,{style:{font:`600 20px ${t.FONT}`,color:t.text,marginBottom:20},children:`Write your email`}),(0,u.jsxs)(`div`,{style:{marginBottom:20},children:[(0,u.jsx)(`label`,{style:t.label,children:`Subject Line`}),(0,u.jsx)(`input`,{value:b,onChange:e=>x(e.target.value),style:{...t.input,fontSize:16,padding:`14px 16px`},placeholder:`What is this email about?`})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{style:t.label,children:`Body`}),(0,u.jsxs)(`div`,{style:{border:`1px solid #E5E5E5`,borderRadius:12,overflow:`hidden`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,gap:4,padding:`8px 12px`,background:`#FAFAFA`,borderBottom:`1px solid #F0F0F0`},children:[(0,u.jsx)(`button`,{onClick:()=>I(`**`),style:{...t.pillGhost,padding:`4px 8px`,fontSize:12,fontWeight:700},children:`B`}),(0,u.jsx)(`button`,{onClick:()=>I(`_`),style:{...t.pillGhost,padding:`4px 8px`,fontSize:12,fontStyle:`italic`},children:`I`}),(0,u.jsx)(`div`,{style:{flex:1}}),(0,u.jsx)(`span`,{style:{font:`400 11px ${t.FONT}`,color:t.text3,alignSelf:`center`},children:`Select text, then format`})]}),(0,u.jsx)(`textarea`,{ref:O,value:S,onChange:e=>C(e.target.value),rows:12,style:{width:`100%`,padding:20,border:`none`,outline:`none`,font:`400 14px/1.8 ${t.FONT}`,color:t.text,resize:`vertical`,boxSizing:`border-box`},placeholder:`Write your email here...`})]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:10,marginTop:20},children:[(0,u.jsx)(`button`,{onClick:()=>h(2),style:t.pillGhost,children:`Back`}),(0,u.jsx)(`button`,{onClick:()=>{b.trim()&&S.trim()&&h(4)},style:t.pillAccent,children:`Preview`})]})]}),m===4&&(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h2`,{style:{font:`600 20px ${t.FONT}`,color:t.text,marginBottom:20},children:`Preview & Send`}),(0,u.jsx)(`div`,{style:{background:`#F5F5F5`,borderRadius:12,padding:24,marginBottom:20},children:(0,u.jsxs)(`div`,{style:{background:`#fff`,borderRadius:10,overflow:`hidden`,boxShadow:t.shadow,maxWidth:520,margin:`0 auto`},children:[(0,u.jsxs)(`div`,{style:{background:t.accent,padding:`20px 24px`,textAlign:`center`},children:[(0,u.jsx)(`div`,{style:{font:`600 16px ${t.FONT}`,color:t.accentText},children:j.businessName||`Your MedSpa`}),(0,u.jsx)(`div`,{style:{font:`400 11px ${t.FONT}`,color:t.accentText,opacity:.7},children:j.tagline||``})]}),(0,u.jsxs)(`div`,{style:{padding:`24px`},children:[(0,u.jsx)(`h3`,{style:{font:`600 18px ${t.FONT}`,color:t.text,marginBottom:12},children:b||`(No subject)`}),(0,u.jsx)(`div`,{style:{font:`400 14px/1.8 ${t.FONT}`,color:`#444`,whiteSpace:`pre-wrap`},children:S||`(No content)`})]}),(0,u.jsxs)(`div`,{style:{padding:`16px 24px`,borderTop:`1px solid #F0F0F0`,textAlign:`center`,font:`400 11px ${t.FONT}`,color:t.text3},children:[j.businessName,` | `,j.email]})]})}),(0,u.jsxs)(`div`,{style:{...t.cardStyle,padding:20,display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:16},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`div`,{style:{font:`500 14px ${t.FONT}`,color:t.text},children:`Recipients`}),(0,u.jsxs)(`div`,{style:{font:`400 13px ${t.FONT}`,color:t.text2},children:[N,` — `,M(),` patients`]})]}),(0,u.jsx)(`button`,{onClick:()=>alert(`Test email sent to your inbox!`),style:t.pillOutline,children:`Send Test`})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:10},children:[(0,u.jsx)(`button`,{onClick:()=>h(3),style:t.pillGhost,children:`Back`}),(0,u.jsx)(`button`,{onClick:F,disabled:w,style:{...t.pillAccent,opacity:w?.6:1},children:w?`Sending...`:`Send to ${M()} patients`})]})]})]}),o===`sent`&&(0,u.jsx)(`div`,{style:t.tableWrap,children:(0,u.jsxs)(`table`,{style:{width:`100%`,borderCollapse:`collapse`},children:[(0,u.jsx)(`thead`,{children:(0,u.jsx)(`tr`,{style:{borderBottom:`1px solid #E5E5E5`},children:[`Subject`,`Audience`,`Recipients`,`Sent`,`Open Rate`,`Click Rate`].map(e=>(0,u.jsx)(`th`,{style:{padding:`12px 16px`,font:`500 11px ${t.MONO}`,textTransform:`uppercase`,letterSpacing:1,color:t.text3,textAlign:`left`},children:e},e))})}),(0,u.jsx)(`tbody`,{children:k.length===0?(0,u.jsx)(`tr`,{children:(0,u.jsx)(`td`,{colSpan:`6`,style:{padding:48,textAlign:`center`,font:`400 14px ${t.FONT}`,color:t.text3},children:`No emails sent yet. Compose your first email to get started.`})}):k.map(e=>{let n=Math.round(25+Math.random()*40),r=Math.round(5+Math.random()*15);return(0,u.jsxs)(`tr`,{style:{borderBottom:`1px solid #F5F5F5`},children:[(0,u.jsx)(`td`,{style:{padding:`14px 16px`,font:`500 13px ${t.FONT}`,color:t.text,maxWidth:280,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.subject}),(0,u.jsx)(`td`,{style:{padding:`14px 16px`},children:(0,u.jsx)(`span`,{style:{padding:`3px 10px`,borderRadius:100,font:`500 11px ${t.FONT}`,background:`#F5F5F5`,color:t.text2},children:e.audience})}),(0,u.jsx)(`td`,{style:{padding:`14px 16px`,font:`500 13px ${t.MONO}`,color:t.text},children:e.recipientCount}),(0,u.jsx)(`td`,{style:{padding:`14px 16px`,font:`400 13px ${t.FONT}`,color:t.text2},children:new Date(e.sentDate).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`})}),(0,u.jsx)(`td`,{style:{padding:`14px 16px`},children:(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,u.jsx)(`div`,{style:{width:48,height:4,background:`#F0F0F0`,borderRadius:2,overflow:`hidden`},children:(0,u.jsx)(`div`,{style:{width:`${n}%`,height:`100%`,background:n>40?t.success:t.accent,borderRadius:2}})}),(0,u.jsxs)(`span`,{style:{font:`500 12px ${t.MONO}`,color:n>40?t.success:t.accent},children:[n,`%`]})]})}),(0,u.jsxs)(`td`,{style:{padding:`14px 16px`,font:`500 12px ${t.MONO}`,color:t.text2},children:[r,`%`]})]},e.id)})})]})})]})}export{p as default};