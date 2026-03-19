// Consent Forms & Waivers — digital signature, template management, compliance tracking
import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import { getPatients, getServices, getSettings, subscribe } from '../data/store';

const WAIVERS_KEY = 'rp_waivers';
function getWaivers() { try { return JSON.parse(localStorage.getItem(WAIVERS_KEY)) || []; } catch { return []; } }
function saveWaivers(w) { localStorage.setItem(WAIVERS_KEY, JSON.stringify(w)); }

const TEMPLATES = [
  // ═══ REQUIRED FOR EVERY PATIENT ═══
  { id: 'general', name: 'General Liability Waiver', category: 'Required', content: `GENERAL LIABILITY WAIVER AND ASSUMPTION OF RISK

I, [Client Name], voluntarily choose to participate in Pilates and/or fitness classes and sessions at [Business Name].

I understand and acknowledge the following:

1. NATURE OF ACTIVITY: Pilates and fitness classes involve physical exercise and movement training. My instructor has explained the activities, their expected benefits, and any relevant safety considerations.

2. NO GUARANTEE OF RESULTS: Individual results from Pilates and fitness training vary. No guarantee has been made regarding specific physical outcomes. Progress depends on consistency, effort, and individual factors.

3. RISKS AND COMPLICATIONS: I understand there are inherent risks with any physical activity program, including but not limited to:
   - Muscle soreness, strains, or sprains
   - Joint discomfort or injury
   - Falls or loss of balance
   - Cardiovascular exertion
   - Aggravation of pre-existing physical conditions

4. HEALTH DISCLOSURE: I have truthfully disclosed relevant information about my physical health, prior injuries, surgeries, chronic conditions, and any physician restrictions on my activity level.

5. INSTRUCTOR GUIDANCE: I agree to follow all instructor cues and safety instructions. I will inform my instructor before class of any new injuries, pain, or health changes that may affect my participation.

6. PHOTOGRAPHY: I authorize [Business Name] to take photographs or video for instructional or promotional purposes, subject to my separate photo consent selection.

7. FINANCIAL RESPONSIBILITY: I understand that fitness sessions are elective services. I am responsible for all fees associated with my participation.

I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction. I voluntarily choose to participate.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  { id: 'hipaa', name: 'Privacy Policy', category: 'Required', content: `ACKNOWLEDGMENT OF RECEIPT OF NOTICE OF PRIVACY PRACTICES

HIPAA PRIVACY NOTICE — [Business Name]

I acknowledge that I have been provided with a copy of [Business Name]'s Notice of Privacy Practices, which describes how my protected health information (PHI) may be used and disclosed.

I understand that:

1. [Business Name] may use and disclose my PHI for session, payment, and healthcare operations purposes.

2. [Business Name] has the right to change its privacy practices and that I may obtain a revised notice by requesting one.

3. I have the right to:
   - Request restrictions on certain uses and disclosures of my PHI
   - Receive confidential communications by alternative means or at alternative locations
   - Inspect and copy my PHI
   - Request amendments to my PHI
   - Receive an accounting of disclosures of my PHI
   - File a complaint if I believe my privacy rights have been violated

4. [Business Name] is required by law to maintain the privacy of my PHI and to provide me with notice of its legal duties and privacy practices.

5. My PHI will not be used for marketing purposes or sold without my written authorization.

Patient Signature: _________________________
Date: ____________
If unable to obtain signature, state reason: _________________________` },

  { id: 'medical-history', name: 'Medical History Form', category: 'Required', content: `PATIENT MEDICAL HISTORY AND HEALTH QUESTIONNAIRE

[Business Name] — Confidential Medical Information

PERSONAL INFORMATION
Full Name: _________________________
Date of Birth: __________ Gender: __________
Emergency Contact: _________________________ Phone: __________

MEDICAL HISTORY (check all that apply)
[ ] Diabetes                    [ ] Heart disease / Heart murmur
[ ] High blood pressure         [ ] Thyroid disorder
[ ] Autoimmune disease          [ ] Bleeding/clotting disorder
[ ] Hepatitis / HIV             [ ] Seizure disorder / Epilepsy
[ ] Cancer (type: ___________)  [ ] Kidney disease
[ ] Liver disease               [ ] Respiratory disease / Asthma
[ ] Skin conditions (eczema, psoriasis, rosacea)
[ ] History of keloid or hypertrophic scarring
[ ] Depression / Anxiety        [ ] Other: _______________

CURRENT MEDICATIONS (include dosage)
_______________________________________________
_______________________________________________

SUPPLEMENTS / VITAMINS
_______________________________________________

ALLERGIES (medications, latex, adhesives, metals, topicals)
_______________________________________________

PREVIOUS COSMETIC PROCEDURES
_______________________________________________
_______________________________________________

WOMEN ONLY
Are you pregnant or possibly pregnant? [ ] Yes [ ] No
Are you currently breastfeeding? [ ] Yes [ ] No
Are you taking birth control? [ ] Yes [ ] No

SKIN HISTORY
Do you have a history of cold sores / herpes simplex? [ ] Yes [ ] No
Do you use retinoids (Retin-A, tretinoin, Accutane)? [ ] Yes [ ] No
Have you had a chemical peel or laser session in the last 6 months? [ ] Yes [ ] No
Do you tan or use tanning beds? [ ] Yes [ ] No
Do you use blood thinners (aspirin, ibuprofen, fish oil, vitamin E)? [ ] Yes [ ] No

DEVICES
Do you have a pacemaker or defibrillator? [ ] Yes [ ] No
Do you have any metal implants? [ ] Yes [ ] No

I certify that the above information is true, accurate, and complete to the best of my knowledge. I will inform [Business Name] of any changes to my medical history.

Patient Signature: _________________________
Date: ____________` },

  // ═══ CLASS & TRAINING WAIVERS ═══
  { id: 'botox', name: 'Reformer Class Waiver', category: 'Equipment', content: `REFORMER PILATES CLASS — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in Reformer Pilates classes at [Business Name].

NATURE OF ACTIVITY: Reformer Pilates involves physical exercise using a spring-resistance machine (reformer). Sessions include lying, seated, kneeling, and standing movements on a moving carriage. Exercises range from beginner to advanced levels.

ACKNOWLEDGMENT OF PHYSICAL RISKS: I understand that participation in Reformer Pilates carries inherent risks, including but not limited to:
- Muscle soreness, strains, or sprains
- Joint discomfort or injury (shoulders, knees, hips, lower back)
- Falls or loss of balance on the reformer carriage
- Equipment-related injuries if springs or straps are mishandled
- Aggravation of pre-existing conditions
- Cardiovascular exertion

PROPER FORM AND INSTRUCTOR GUIDANCE:
- I agree to listen to and follow all instructor cues and corrections
- I will inform my instructor of any injuries, surgeries, or physical limitations before class
- I understand that attempting movements beyond my current ability increases injury risk
- I will ask for modifications rather than forcing movements that cause pain

EQUIPMENT SAFETY:
- I agree to follow all equipment setup and safety instructions
- I will not adjust spring resistance without instructor guidance
- I understand proper carriage stop and footbar positioning procedures
- I will report any equipment concerns to my instructor immediately

HEALTH DISCLOSURE: I confirm that I have consulted a physician if I have any cardiovascular conditions, recent surgeries, pregnancy, or other conditions that may affect my ability to safely participate.

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  { id: 'filler', name: 'Barre Class Waiver', category: 'Equipment', content: `BARRE CLASS — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in Barre classes at [Business Name].

NATURE OF ACTIVITY: Barre classes combine elements of ballet, Pilates, and yoga using a ballet barre, light weights, resistance bands, and bodyweight exercises. Classes involve high repetition, small-range movements targeting specific muscle groups.

ACKNOWLEDGMENT OF PHYSICAL EXERTION: I understand that Barre classes require sustained physical effort and may result in:
- Significant muscle fatigue and soreness, particularly in thighs, glutes, and core
- Temporary muscle shaking ("the Barre shake") — this is normal and expected
- Delayed onset muscle soreness (DOMS) 24-72 hours after class
- Elevated heart rate and cardiovascular exertion

INJURY ACKNOWLEDGMENT: I understand the following risks associated with Barre participation:
- Muscle strains, particularly in the hip flexors, hamstrings, and calves
- Knee discomfort from deep turnout or plié positions
- Ankle and foot strain
- Lower back discomfort if core engagement is insufficient
- Wrist strain during floor work

PROPER FOOTWEAR AND ATTIRE:
- I understand that grip socks are required for all Barre classes
- Bare feet are not permitted on the studio floor for safety reasons
- I agree to wear form-fitting clothing that allows the instructor to observe alignment

MODIFICATIONS: I agree to accept and use modifications offered by the instructor. I will communicate any physical limitations, recent injuries, or pregnancy status before class begins.

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  { id: 'sculptra', name: 'Private Training Waiver', category: 'Equipment', content: `PRIVATE TRAINING SESSION — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in private one-on-one training sessions at [Business Name].

NATURE OF ACTIVITY: Private training sessions provide individualized instruction in Pilates and/or movement work. Sessions are customized to the client's specific goals, current fitness level, and any physical limitations or injury history.

ACKNOWLEDGMENT OF ONE-ON-ONE SESSION RISKS: I understand that private training involves:
- Progressive physical challenge designed to build strength, flexibility, and body awareness
- Hands-on instructor cueing and tactile corrections (with my consent)
- Higher-intensity or more technically demanding work than group classes
- The possibility of muscle fatigue, soreness, or exertion beyond what I am accustomed to

CUSTOM PROGRAM ACKNOWLEDGMENT:
- I understand that my instructor will design a program based on information I provide about my health, injuries, and goals
- I agree to provide complete and honest information about my physical history, including past injuries, surgeries, chronic pain, and medical conditions
- I understand that withholding relevant health information may result in programming that is inappropriate for my condition
- I agree to communicate openly during sessions if any exercise causes pain, discomfort, or concern

PROGRESSION AND MODIFICATIONS:
- I understand that my program will be progressively adjusted as I develop strength and skill
- I agree to respect my instructor's guidance regarding readiness to advance to more challenging exercises
- I will not attempt exercises demonstrated or described outside of our sessions without prior instructor approval

CANCELLATION: I understand the studio's cancellation policy and agree that private sessions cancelled with less than 24 hours notice may be subject to a cancellation fee.

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation, provided that sessions are conducted in accordance with my disclosed health information.

Client Signature: _________________________
Date: ____________
Instructor: _________________________` },

  // ═══ SKIN TREATMENT CONSENTS ═══
  { id: 'microneedling', name: 'Private Session / RF Consent', category: 'Skin', content: `INFORMED CONSENT FOR MICRONEEDLING / RF MICRONEEDLING
(Morpheus8 / SkinPen / Potenza / Vivace)

DESCRIPTION: Private Session creates controlled micro-injuries to stimulate collagen production and skin renewal. RF (radiofrequency) microneedling adds heat energy for deeper remodeling. Treats fine lines, acne scars, pore size, texture, and skin laxity.

EXPECTED RESULTS:
- Mild improvement after 1 session; optimal results after 3-4 sessions
- Sessions spaced 4-6 weeks apart
- Continued improvement for 3-6 months after final session
- Annual maintenance recommended

RISKS AND SIDE EFFECTS:
- Redness (like a sunburn) lasting 24-72 hours
- Swelling, particularly around eyes and forehead (24-48 hours)
- Pinpoint bleeding during session
- Skin dryness, flaking, or peeling for 3-7 days
- Temporary skin sensitivity
- Bruising
- Post-inflammatory hyperpigmentation (higher risk in darker skin tones)
- Infection (rare)
- Scarring (rare)
- Burns (RF microneedling — rare)
- Herpes simplex outbreak if history of cold sores

CONTRAINDICATIONS:
- Active acne, eczema, psoriasis, or rosacea flare at session site
- Open wounds or active skin infection
- Accutane use within the last 6 months
- Pregnancy or breastfeeding
- Active cold sore outbreak
- Blood clotting disorders or anticoagulant therapy
- Skin cancer at session site
- Pacemaker or metal implants in session area (RF only)
- Keloid tendency

PRE-TREATMENT:
- Discontinue retinoids 5-7 days prior
- Discontinue exfoliating acids (AHA/BHA) 3 days prior
- No sun exposure or tanning for 2 weeks prior
- Take antiviral medication if prescribed (cold sore history)
- Arrive with clean skin, no makeup

POST-TREATMENT:
- Redness and swelling are NORMAL for 24-72 hours
- Use only gentle cleanser and hyaluronic acid serum for 48 hours
- Apply SPF 30+ daily — your skin is extra sensitive to UV
- Avoid makeup for 24 hours
- Avoid retinoids and active ingredients for 5-7 days
- Avoid sun exposure, swimming, saunas for 1 week
- Do NOT pick at flaking skin

Patient Signature: _________________________
Date: ____________` },

  { id: 'laser', name: 'Laser / TRX Consent', category: 'Laser', content: `INFORMED CONSENT FOR LASER AND INTENSE PULSED LIGHT (TRX) TREATMENT

DESCRIPTION: Laser and TRX sessions use focused light energy to target specific skin concerns including sun damage, pigmentation, redness, broken capillaries, hair removal, skin resurfacing, and tattoo removal.

TREATMENT TYPE (provider will check):
[ ] TRX Photofacial          [ ] Laser Hair Removal
[ ] Fractional Laser Resurfacing  [ ] Vascular Laser
[ ] Tattoo Removal           [ ] Other: _______________

RISKS AND SIDE EFFECTS:
- Redness, swelling, and warmth (like a sunburn) — 1-7 days
- Crusting, scabbing, or blistering
- Temporary darkening (hyperpigmentation) or lightening (hypopigmentation) of skin
- Permanent pigment changes (rare, higher risk in darker skin tones)
- Burns
- Scarring (rare)
- Eye injury if protective eyewear is removed during session
- Infection
- Incomplete results — multiple sessions usually required
- Reactivation of herpes simplex (cold sores)
- Paradoxical hair growth (laser hair removal — rare)

CONTRAINDICATIONS:
- Pregnancy or breastfeeding
- Active tan or sunburn (session must be postponed)
- Use of photosensitizing medications (certain antibiotics, retinoids)
- Accutane use within the last 6 months
- Active skin infection or open wounds
- History of keloid scarring
- Seizure disorders triggered by light
- Gold thread implants

PRE-TREATMENT REQUIREMENTS:
- NO sun exposure or tanning for 2 weeks before AND after session
- Discontinue retinoids 5-7 days prior
- No self-tanner on session area (must be fully faded)
- Shave session area 24 hours prior (laser hair removal)
- Remove all makeup, lotions, and deodorant from session area
- Take antiviral medication if prescribed

POST-TREATMENT:
- Apply cool compresses as needed
- Use gentle cleanser and moisturizer only
- SPF 30+ daily (reapply every 2 hours if outdoors)
- Avoid picking at crusts or dark spots — they will flake off naturally
- Avoid swimming pools, hot tubs, and saunas for 1 week
- Avoid strenuous exercise for 48 hours

I confirm I have NOT used Accutane in the last 6 months.
I confirm I do NOT have an active tan.

Patient Signature: _________________________
Date: ____________
Provider: _________________________` },

  { id: 'chemical-peel', name: 'Chemical Peel Consent', category: 'Skin', content: `INFORMED CONSENT FOR CHEMICAL PEEL

DESCRIPTION: A chemical peel uses a controlled application of acid solution to remove damaged outer layers of skin, revealing smoother, more even-toned skin beneath. Peels range from superficial (lunchtime peels) to deep.

PEEL TYPE (provider will note):
[ ] Superficial (glycolic, lactic, salicylic)
[ ] Medium (TCA 15-35%)
[ ] Deep (TCA 50%+, phenol)

RISKS AND SIDE EFFECTS:
- Redness, stinging, and warmth during and after application
- Peeling, flaking, and dryness for 3-10 days (varies by depth)
- Temporary darkening of skin before peeling
- Post-inflammatory hyperpigmentation (especially in darker skin tones)
- Hypopigmentation (lightening)
- Prolonged redness
- Infection
- Scarring (rare, more common with deeper peels)
- Cold sore reactivation
- Allergic reaction
- Sun sensitivity for 2-4 weeks

CONTRAINDICATIONS:
- Pregnancy or breastfeeding
- Active cold sore outbreak
- Open wounds, sunburn, or active skin condition at site
- Accutane use within 6 months (superficial) or 12 months (medium/deep)
- Recent waxing of session area (within 1 week)
- Allergy to peel ingredients

POST-TREATMENT:
- DO NOT pick, peel, or scratch flaking skin
- Use gentle cleanser, hydrating serum, and heavy moisturizer
- SPF 50 daily — absolutely no sun exposure without protection
- Avoid retinoids and exfoliants until peeling is complete
- Avoid sweating/exercise for 24-48 hours
- Avoid makeup until peeling subsides (typically 3-5 days)

Patient Signature: _________________________
Date: ____________` },

  // ═══ BODY / SURGICAL CONSENTS ═══
  { id: 'pdo-threads', name: 'PDO Thread Lift Consent', category: 'Lifting', content: `INFORMED CONSENT FOR PDO (POLYDIOXANONE) THREAD LIFT

DESCRIPTION: PDO thread lifts use dissolvable sutures inserted beneath the skin to lift sagging tissue and stimulate collagen production. Threads dissolve over 4-6 months; collagen-lifting effect lasts 12-18 months.

THREAD TYPES:
- Smooth threads: Collagen stimulation, skin rejuvenation
- Barbed/cog threads: Mechanical lifting of tissue

RISKS AND SIDE EFFECTS:
- Bruising, swelling, and tenderness (7-14 days)
- Temporary pulling, tugging, or tightness sensation
- Dimpling or puckering of skin (usually temporary)
- Asymmetry
- Thread migration or protrusion through skin
- Infection
- Nerve damage (temporary numbness or tingling)
- Visible threads beneath skin surface
- Scarring
- Need for thread removal
- Allergic reaction (rare — PDO is the same material used in surgical sutures)

CONTRAINDICATIONS:
- Pregnancy or breastfeeding
- Active skin infection
- Autoimmune conditions
- Blood clotting disorders
- Tendency to form keloid scars
- Current use of blood thinners (must discuss with provider)

POST-TREATMENT:
- Sleep on your back with head elevated for 1 week
- Avoid extreme facial expressions for 2 weeks
- No dental work for 2 weeks
- Avoid strenuous exercise for 2 weeks
- Do NOT massage face or apply pressure to treated areas
- Avoid saunas and excessive heat for 2 weeks
- Soft food diet for 1-2 days if jaw area was treated

Patient Signature: _________________________
Date: ____________` },

  { id: 'body-contouring', name: 'Body Contouring Consent', category: 'Body', content: `INFORMED CONSENT FOR NON-SURGICAL BODY CONTOURING

TREATMENT TYPE (provider will note):
[ ] CoolSculpting / Cryolipolysis    [ ] Radiofrequency Body Tightening
[ ] Laser Lipolysis                   [ ] Ultrasound Cavitation
[ ] BodyTite / InMode                 [ ] Other: _______________

DESCRIPTION: Non-surgical body contouring sessions reduce localized fat deposits and/or tighten skin using various energy-based technologies. These are NOT weight loss sessions — they are designed for clients at or near their goal weight with stubborn areas.

RISKS AND SIDE EFFECTS:
- Redness, swelling, bruising, tenderness at session site
- Numbness or tingling (may last several weeks)
- Temporary hardening, firmness, or ridging of session area
- Skin sensitivity
- Paradoxical adipose hyperplasia (PAH) — treated area gets larger instead of smaller (rare, CoolSculpting specific)
- Burns (thermal sessions)
- Uneven results or asymmetry
- Multiple sessions typically required for optimal results

IMPORTANT EXPECTATIONS:
- Results are NOT immediate — fat cell elimination takes 8-12 weeks
- You must maintain a stable weight and healthy lifestyle
- This is NOT a substitute for diet, exercise, or liposuction
- Typical fat reduction: 20-25% per session area per session

Patient Signature: _________________________
Date: ____________` },

  // ═══ WELLNESS CONSENTS ═══
  { id: 'weight-loss', name: 'Weight Loss / GLP-1 Consent', category: 'Wellness', content: `INFORMED CONSENT FOR MEDICAL WEIGHT LOSS PROGRAM
(Semaglutide / Tirzepatide / Compounded GLP-1 Medications)

DESCRIPTION: GLP-1 receptor agonist medications (semaglutide, tirzepatide) are injectable prescription medications that reduce appetite and slow gastric emptying. Originally developed for Type 2 diabetes, they are now FDA-approved (or used off-label) for chronic weight management.

EXPECTED RESULTS:
- Typical weight loss: 15-25% of body weight over 12-18 months
- Dose is gradually increased over 8-16 weeks to minimize side effects
- Weekly subcutaneous injection (self-administered at home)
- Regular provider check-ins required

COMMON SIDE EFFECTS (especially during dose escalation):
- Nausea (most common — usually improves over time)
- Vomiting, diarrhea, or constipation
- Abdominal pain or bloating
- Decreased appetite (this is expected/desired)
- Headache, fatigue, dizziness
- Injection site reactions

SERIOUS RISKS (rare):
- Pancreatitis (severe abdominal pain — seek emergency care)
- Gallbladder disease / gallstones
- Kidney injury
- Hypoglycemia (especially if diabetic or on other diabetes medications)
- Thyroid tumors including medullary thyroid carcinoma (seen in animal studies)
- Suicidal ideation or changes in mood (report immediately)
- Severe allergic reaction
- Gastroparesis (delayed gastric emptying)
- Muscle loss (protein intake and exercise are critical)

CONTRAINDICATIONS:
- Personal or family history of medullary thyroid carcinoma or MEN 2 syndrome
- Pregnancy, breastfeeding, or planning pregnancy within 2 months of stopping
- History of pancreatitis
- Severe gastrointestinal disease
- Type 1 diabetes

PROGRAM REQUIREMENTS:
- Monthly provider visits for monitoring and dose adjustment
- Blood work as recommended (baseline and periodic)
- Adequate protein intake (minimum 60-80g/day) to preserve muscle mass
- Regular physical activity including resistance training
- Discontinuation plan — this is not necessarily a lifetime medication

I understand this is an ongoing medical program requiring regular monitoring.

Patient Signature: _________________________
Date: ____________
Provider: _________________________` },

  { id: 'iv-therapy', name: 'IV Therapy Consent', category: 'Wellness', content: `INFORMED CONSENT FOR INTRAVENOUS (IV) NUTRIENT THERAPY

DESCRIPTION: IV therapy delivers vitamins, minerals, amino acids, and/or fluids directly into the bloodstream for maximum absorption. Common formulations include Myers' Cocktail, NAD+, glutathione, high-dose Vitamin C, and custom blends.

FORMULATION (provider will note): _______________

RISKS AND SIDE EFFECTS:
- Pain, bruising, or swelling at the IV insertion site
- Infiltration (fluid leaking into surrounding tissue)
- Phlebitis (vein inflammation)
- Infection at insertion site
- Allergic reaction to IV components
- Lightheadedness or dizziness
- Nausea
- Metallic taste in mouth (common with certain vitamins)
- Headache
- Vein irritation or hardening with repeated sessions
- Air embolism (extremely rare)
- Anaphylaxis (extremely rare)

CONTRAINDICATIONS:
- Kidney disease or renal insufficiency
- Heart failure or fluid overload conditions
- Known allergy to any IV components
- Hemochromatosis (iron overload) — for iron-containing formulas
- G6PD deficiency — for high-dose Vitamin C

I understand IV therapy is considered complementary/alternative and is not intended to diagnose, treat, or cure any disease.

Patient Signature: _________________________
Date: ____________` },

  // ═══ OPTIONAL / POLICY CONSENTS ═══
  { id: 'photo', name: 'Photo / Marketing Consent', category: 'Optional', content: `CONSENT FOR CLINICAL PHOTOGRAPHY AND MARKETING USE

[Business Name] — Photo Release and Usage Authorization

SECTION 1: CLINICAL PHOTOGRAPHY
I authorize [Business Name] and its providers to take before, during, and after photographs and/or videos of my session for inclusion in my confidential medical record.

[ ] I CONSENT to clinical photography for my medical record

SECTION 2: MARKETING AND EDUCATIONAL USE
I understand that [Business Name] may wish to use my photographs for educational, marketing, or promotional purposes including but not limited to: social media (Instagram, Facebook, TikTok), website, print materials, presentations, and advertising.

Please select ONE:
[ ] OPTION A — NO marketing use. Photos are for my medical record ONLY.
[ ] OPTION B — ANONYMOUS use only. Photos may be used but my face will be cropped or obscured so I am NOT identifiable.
[ ] OPTION C — IDENTIFIABLE use. Photos may be used with my face visible. [Business Name] may tag me on social media with my permission.

SECTION 3: TERMS
- I will not receive compensation for the use of my photographs
- I may revoke this consent at any time by submitting a written request
- Revoking consent does not apply to materials already published or distributed
- [Business Name] will make reasonable efforts to remove content upon revocation
- My decision regarding marketing use will NOT affect the quality of care I receive

Patient Signature: _________________________
Date: ____________
Witness: _________________________` },

  { id: 'cancellation', name: 'Cancellation / No-Show Policy', category: 'Policy', content: `CANCELLATION AND NO-SHOW POLICY ACKNOWLEDGMENT

[Business Name] — Appointment Policy

We value your time and ours. To ensure all clients receive timely care, we maintain the following policies:

CANCELLATION POLICY:
- Appointments must be cancelled or rescheduled at least 24 hours in advance
- Cancellations with less than 24 hours notice will incur a late cancellation fee equal to 50% of the scheduled service cost
- Some premium sessions (threads, body contouring, surgical procedures) require 48-72 hours notice

NO-SHOW POLICY:
- A "no-show" is defined as failure to arrive within 15 minutes of your scheduled appointment time without prior notice
- No-show fee: 100% of the scheduled service cost
- After 2 no-shows, a credit card on file will be required to book future appointments
- After 3 no-shows, [Business Name] reserves the right to require prepayment

LATE ARRIVAL:
- If you arrive late, we will do our best to accommodate you
- If your late arrival does not allow sufficient time for your session, we may need to reschedule and a late cancellation fee may apply

PACKAGES AND MEMBERSHIPS:
- Missed package appointments are considered "used" if not cancelled within the required timeframe
- Membership benefits do not roll over month to month unless specified in your membership agreement

I have read and understand [Business Name]'s cancellation and no-show policy.

Patient Signature: _________________________
Date: ____________` },

  { id: 'financial', name: 'Financial Responsibility', category: 'Policy', content: `FINANCIAL RESPONSIBILITY AND PAYMENT POLICY

[Business Name] — Payment Agreement

PAYMENT:
- Payment is due in full at the time of service unless prior arrangements have been made
- We accept: Cash, Credit/Debit Cards, CareCredit, Cherry Financing
- All prices are subject to change without notice
- Consultations are complimentary unless otherwise stated

AESTHETIC SERVICES AND INSURANCE:
- Aesthetic and cosmetic sessions are elective procedures and are NOT covered by health insurance
- [Business Name] does not bill insurance for aesthetic services
- It is the client's responsibility to determine if any session may be covered by their insurance

REFUND POLICY:
- Treatments and services are non-refundable once performed
- Product purchases may be returned unopened within 14 days with receipt
- Gift cards and account credits are non-refundable
- Package and membership payments are non-refundable but may be transferred per our transfer policy

FINANCING:
- Third-party financing options are available (CareCredit, Cherry, etc.)
- [Business Name] is not responsible for the terms, interest, or fees of third-party financing
- Financing approval is between the patient and the financing company

COLLECTIONS:
- Outstanding balances not paid within 30 days may be subject to a late fee
- Accounts past 90 days may be referred to a collection agency

I have read and agree to [Business Name]'s financial policies.

Patient Signature: _________________________
Date: ____________` },
];

function initWaivers() {
  if (localStorage.getItem('rp_waivers_init')) return;
  const now = new Date();
  const ago = (days) => new Date(now - days * 86400000).toISOString();
  saveWaivers([
    { id: 'W-1', templateId: 'general', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Jessica Park, NP', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-2', templateId: 'botox', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Dr. Sarah Mitchell', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-3', templateId: 'photo', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: '', status: 'signed', photoConsent: 'identifiable', expiresAt: ago(-360) },
    { id: 'W-4', templateId: 'general', clientId: 'CLT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Emily Chen, RN', status: 'signed', expiresAt: ago(-335) },
    { id: 'W-5', templateId: 'laser', clientId: 'CLT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Jessica Park, NP', status: 'signed', expiresAt: ago(-335) },
    { id: 'W-6', templateId: 'general', clientId: 'CLT-1005', patientName: 'Mia Garcia', signedAt: null, signatureData: null, witnessName: '', status: 'pending', expiresAt: null },
    { id: 'W-7', templateId: 'hipaa', clientId: 'CLT-1002', patientName: 'Sophia Brown', signedAt: ago(20), signatureData: 'Sophia Brown', witnessName: '', status: 'signed', expiresAt: ago(-345) },
  ]);
  localStorage.setItem('rp_waivers_init', 'true');
}

export default function Waivers() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initWaivers(); setTick(t => t + 1); }, []);

  const [waivers, setWaivers] = useState(getWaivers);
  const [tab, setTab] = useState('waivers'); // 'waivers' | 'templates' | 'send'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ clientId: '', templateIds: [] });
  const [showPreview, setShowPreview] = useState(null);
  const [showSign, setShowSign] = useState(null);
  const [signName, setSignName] = useState('');
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const clients = getPatients();
  const settings = getSettings();
  const refresh = () => setWaivers(getWaivers());

  const filtered = waivers.filter(w => {
    if (search) { const q = search.toLowerCase(); if (!w.patientName?.toLowerCase().includes(q)) return false; }
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => (b.signedAt || '9999').localeCompare(a.signedAt || '9999'));

  const signedCount = waivers.filter(w => w.status === 'signed').length;
  const pendingCount = waivers.filter(w => w.status === 'pending').length;

  const handleSendWaivers = () => {
    if (!sendForm.clientId || sendForm.templateIds.length === 0) return;
    const pat = clients.find(p => p.id === sendForm.clientId);
    const all = getWaivers();
    sendForm.templateIds.forEach(tId => {
      all.push({
        id: `W-${Date.now()}-${tId}`,
        templateId: tId,
        clientId: sendForm.clientId,
        patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown',
        signedAt: null, signatureData: null, witnessName: '', status: 'pending', expiresAt: null,
      });
    });
    saveWaivers(all);
    refresh();
    setShowSend(false);
    setSendForm({ clientId: '', templateIds: [] });
  };

  const handleSign = (waiverId) => {
    if (!signName.trim()) return;
    const all = getWaivers().map(w => {
      if (w.id === waiverId) {
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
        return { ...w, status: 'signed', signedAt: new Date().toISOString(), signatureData: signName, expiresAt: exp.toISOString() };
      }
      return w;
    });
    saveWaivers(all);
    refresh();
    setShowSign(null);
    setSignName('');
  };

  const toggleTemplate = (id) => {
    setSendForm(prev => ({
      ...prev,
      templateIds: prev.templateIds.includes(id) ? prev.templateIds.filter(t => t !== id) : [...prev.templateIds, id],
    }));
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .wv-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .wv-template-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .wv-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Waivers</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Digital consent forms, e-signatures, and compliance tracking</p>
        </div>
        <button onClick={() => setShowSend(true)} style={s.pillAccent}>+ Send Waivers</button>
      </div>

      {/* Stats */}
      <div className="wv-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Waivers', value: waivers.length },
          { label: 'Signed', value: signedCount, color: s.success },
          { label: 'Pending Signature', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'Templates', value: TEMPLATES.length },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '14px 18px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: `600 22px ${s.FONT}`, color: k.color || s.text }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {[['waivers', 'Patient Waivers'], ['templates', 'Templates']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '9px 20px', background: tab === k ? '#fff' : 'transparent', border: 'none',
            font: `500 13px ${s.FONT}`, color: tab === k ? s.text : s.text3, cursor: 'pointer',
            borderRadius: tab === k ? 8 : 0, boxShadow: tab === k ? s.shadow : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'waivers' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient..." style={{ ...s.input, maxWidth: 240 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['signed', 'Signed'], ['pending', 'Pending']].map(([id, label]) => (
                <button key={id} onClick={() => setStatusFilter(id)} style={{
                  ...s.pill, padding: '6px 14px', fontSize: 12,
                  background: statusFilter === id ? s.accent : 'transparent',
                  color: statusFilter === id ? s.accentText : s.text2,
                  border: statusFilter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={s.tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                  {['Patient', 'Form', 'Status', 'Signed', 'Expires', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const tpl = TEMPLATES.find(t => t.id === w.templateId);
                  const expired = w.expiresAt && new Date(w.expiresAt) < new Date();
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '12px 14px', font: `500 13px ${s.FONT}`, color: s.text }}>{w.patientName}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{tpl?.name || 'Unknown'}</div>
                        <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{tpl?.category}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase',
                          background: w.status === 'signed' ? '#F0FDF4' : '#FFF7ED',
                          color: w.status === 'signed' ? s.success : s.warning,
                        }}>{expired ? 'Expired' : w.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px', font: `400 12px ${s.FONT}`, color: s.text2 }}>
                        {w.signedAt ? new Date(w.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', font: `400 12px ${s.FONT}`, color: expired ? s.danger : s.text3 }}>
                        {w.expiresAt ? new Date(w.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setShowPreview(tpl)} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10 }}>View</button>
                          {w.status === 'pending' && <button onClick={() => { setShowSign(w.id); setSignName(''); }} style={{ ...s.pillAccent, padding: '4px 10px', fontSize: 10 }}>Sign</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No waivers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className="wv-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {TEMPLATES.map(tpl => (
            <div key={tpl.id} style={{ ...s.cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{tpl.name}</div>
                <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F5F5F5', font: `500 10px ${s.FONT}`, color: s.text2 }}>{tpl.category}</span>
              </div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, lineHeight: 1.5, maxHeight: 80, overflow: 'hidden', marginBottom: 12 }}>{tpl.content.slice(0, 150)}...</div>
              <button onClick={() => setShowPreview(tpl)} style={{ ...s.pillOutline, padding: '5px 12px', fontSize: 11 }}>Preview</button>
            </div>
          ))}
        </div>
      )}

      {/* Send Waivers Modal */}
      {showSend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowSend(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Send Consent Forms</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Patient</label>
              <select value={sendForm.clientId} onChange={e => setSendForm({ ...sendForm, clientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select patient...</option>
                {clients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Select Forms</label>
              <div style={{ display: 'grid', gap: 6 }}>
                {TEMPLATES.map(tpl => (
                  <label key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: sendForm.templateIds.includes(tpl.id) ? `2px solid ${s.accent}` : '1px solid #E5E5E5', cursor: 'pointer' }}>
                    <input type="checkbox" checked={sendForm.templateIds.includes(tpl.id)} onChange={() => toggleTemplate(tpl.id)} style={{ accentColor: s.accent }} />
                    <div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{tpl.name}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{tpl.category}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSend(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSendWaivers} style={{ ...s.pillAccent, opacity: sendForm.clientId && sendForm.templateIds.length > 0 ? 1 : 0.4 }}>Send {sendForm.templateIds.length} Form{sendForm.templateIds.length !== 1 ? 's' : ''}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowPreview(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 640, width: '90%', boxShadow: s.shadowLg, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>{showPreview.name}</h2>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#FAFAFA', padding: 20, borderRadius: 10, border: '1px solid #F0F0F0' }}>
              {showPreview.content.replace(/\[Business Name\]/g, settings.businessName || 'Pilates & Barre')}
            </div>
            <button onClick={() => setShowPreview(null)} style={{ ...s.pillGhost, marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {showSign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowSign(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Sign Consent Form</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Type Full Legal Name</label>
              <input value={signName} onChange={e => setSignName(e.target.value)} style={{ ...s.input, fontSize: 18, fontStyle: 'italic', textAlign: 'center' }} placeholder="Full Name" autoFocus />
            </div>
            <div style={{ padding: 16, background: '#FAFAFA', borderRadius: 10, textAlign: 'center', marginBottom: 16, border: '1px dashed #DDD', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {signName ? (
                <span style={{ font: `italic 28px 'Georgia', serif`, color: s.text }}>{signName}</span>
              ) : (
                <span style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Signature preview</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSign(null)} style={s.pillGhost}>Cancel</button>
              <button onClick={() => handleSign(showSign)} disabled={!signName.trim()} style={{ ...s.pillAccent, opacity: signName.trim() ? 1 : 0.4 }}>Sign & Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
