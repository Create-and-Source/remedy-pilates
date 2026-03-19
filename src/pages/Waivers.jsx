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

ALLERGIES (medications, latex, topicals, materials)
_______________________________________________

PREVIOUS INJURIES OR SURGERIES
Injury/Surgery: _________________________  Year: ______  Currently affecting me? [ ] Yes [ ] No
Injury/Surgery: _________________________  Year: ______  Currently affecting me? [ ] Yes [ ] No

CURRENT PHYSICAL ACTIVITY LEVEL
[ ] Sedentary (little to no regular exercise)
[ ] Lightly active (1-2 days/week)
[ ] Moderately active (3-4 days/week)
[ ] Very active (5+ days/week)

FITNESS GOALS
_______________________________________________

WOMEN ONLY
Are you pregnant or possibly pregnant? [ ] Yes [ ] No
Are you currently breastfeeding? [ ] Yes [ ] No
Have you given birth within the last 6 months? [ ] Yes [ ] No

JOINT AND PHYSICAL HISTORY
Do you have chronic pain in any joints? [ ] Yes [ ] No  Location: _______________
Do you have any diagnosed spinal conditions (disc herniation, scoliosis, stenosis)? [ ] Yes [ ] No
Have you been advised to avoid certain exercises by a physician or physical therapist? [ ] Yes [ ] No
Do you experience dizziness, shortness of breath, or chest pain during exercise? [ ] Yes [ ] No
Do you have any balance or coordination concerns? [ ] Yes [ ] No

I certify that the above information is true, accurate, and complete to the best of my knowledge. I will inform [Business Name] of any changes to my health status.

Patient Signature: _________________________
Date: ____________` },

  // ═══ CLASS & TRAINING WAIVERS ═══
  { id: 'reformer', name: 'Reformer Class Waiver', category: 'Equipment', content: `REFORMER PILATES CLASS — PARTICIPATION WAIVER AND RELEASE

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

  { id: 'barre', name: 'Barre Class Waiver', category: 'Equipment', content: `BARRE CLASS — PARTICIPATION WAIVER AND RELEASE

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

  { id: 'private-session', name: 'Private Training Waiver', category: 'Equipment', content: `PRIVATE TRAINING SESSION — PARTICIPATION WAIVER AND RELEASE

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

  // ═══ SPECIALTY CLASS WAIVERS ═══
  { id: 'mat-pilates', name: 'Mat Pilates Class Waiver', category: 'Class', content: `MAT PILATES CLASS — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in Mat Pilates classes at [Business Name].

NATURE OF ACTIVITY: Mat Pilates classes involve a series of controlled movements performed on a floor mat. Classes focus on core strength, spinal alignment, flexibility, and mind-body connection. No equipment beyond a mat is required, though props such as resistance bands, small balls, and foam rollers may be used.

PHYSICAL DEMANDS: I understand that Mat Pilates may require:
- Core engagement throughout the duration of class
- Spinal flexion, extension, and rotation movements
- Hip flexor and hamstring flexibility work
- Upper body weight-bearing in positions such as plank and side-lying
- Balance challenges

RISKS: I understand the following risks associated with Mat Pilates:
- Muscle soreness, particularly in the core, hip flexors, and lower back
- Neck strain if head and shoulder lifts are performed with improper form
- Lower back discomfort if neutral spine alignment is not maintained
- Wrist strain in weight-bearing positions
- Aggravation of pre-existing conditions if not modified appropriately

MODIFICATIONS AND DISCLOSURE: I agree to:
- Inform my instructor of any injuries, surgeries, or physical limitations before class
- Use props and modifications as directed by my instructor
- Avoid any movement that causes sharp pain or joint discomfort
- Ask for modification rather than pushing through pain

HEALTH DISCLOSURE: I confirm I have consulted a physician if I have any cardiovascular conditions, recent surgeries, pregnancy, spinal conditions, or other circumstances that may affect my ability to safely participate.

I voluntarily assume all risks associated with participation in Mat Pilates classes and release [Business Name] and its instructors from liability for injury arising from my participation.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  { id: 'private', name: 'Barre Class Waiver', category: 'Class', content: `BARRE CLASS — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in Barre fitness classes at [Business Name].

NATURE OF ACTIVITY: Barre classes combine elements of ballet, Pilates, and functional fitness using a ballet barre, light handheld weights, resistance bands, and bodyweight exercises. Classes involve high-repetition, small-range movements targeting specific muscle groups, particularly the thighs, glutes, core, and upper body.

ACKNOWLEDGMENT OF PHYSICAL EXERTION: I understand that Barre classes require sustained physical effort and may result in:
- Significant muscle fatigue and soreness, particularly in thighs, glutes, and core
- Temporary muscle shaking ("the Barre shake") — this is normal and expected
- Delayed onset muscle soreness (DOMS) 24-72 hours after class
- Elevated heart rate and cardiovascular exertion

INJURY RISKS: I understand the following risks associated with Barre participation:
- Muscle strains, particularly in the hip flexors, hamstrings, and calves
- Knee discomfort from deep turnout, plié, or squat positions
- Ankle and foot fatigue, especially during relevé work
- Lower back discomfort if core engagement is insufficient
- Wrist or shoulder strain during floor work or resistance band exercises
- Overexertion if modifications are not used appropriately

EQUIPMENT USE: I understand that Barre classes may utilize:
- Ballet barre (wall-mounted or freestanding) for balance and support
- Light handheld weights (typically 1–5 lbs)
- Resistance bands or loops
- Exercise ball or small props
I agree to use all equipment as directed by the instructor and to notify the instructor of any discomfort with equipment use.

PROPER FORM AND SAFETY:
- I agree to follow all instructor cues and accept offered modifications
- I understand that maintaining proper form is essential to prevent injury
- I will inform my instructor of any injuries, surgeries, or physical limitations before class
- I will not attempt movements that cause sharp pain or joint discomfort
- I will ask for modifications rather than forcing range of motion

FOOTWEAR: I understand that grip socks are required for all Barre classes. Bare feet are not permitted on the studio floor for safety reasons.

HEALTH DISCLOSURE: I confirm I have consulted a physician if I have any cardiovascular conditions, recent surgeries, pregnancy, chronic joint conditions, or other circumstances that may affect my ability to safely participate.

I voluntarily assume all risks associated with participation in Barre classes and release [Business Name] and its instructors from liability for injury arising from my participation, provided that I have fully disclosed relevant health information.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  { id: 'group-fitness', name: 'Group Fitness Class Waiver', category: 'Class', content: `GROUP FITNESS CLASS — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in group fitness classes at [Business Name].

CLASS TYPES COVERED BY THIS WAIVER:
[ ] Mat Pilates          [ ] Barre
[ ] Stretch & Recovery   [ ] Cardio Pilates
[ ] Yoga Fusion          [ ] Other: _______________

NATURE OF ACTIVITY: Group fitness classes involve structured physical exercise led by a certified instructor. Classes vary in intensity and format but all involve movement-based exercise designed to improve strength, flexibility, cardiovascular fitness, or body awareness.

PHYSICAL RISKS: I understand that group fitness participation carries inherent risks, including but not limited to:
- Muscle soreness, strains, or sprains
- Joint discomfort or injury (shoulders, knees, hips, lower back)
- Falls or loss of balance
- Cardiovascular exertion
- Overexertion if modifications are not used appropriately
- Aggravation of pre-existing injuries or physical conditions

INSTRUCTOR GUIDANCE:
- I agree to follow all instructor cues, corrections, and safety instructions
- I will accept modifications offered by the instructor
- I understand that attempting movements beyond my current ability increases injury risk
- I will ask for modifications rather than forcing movements that cause pain

DISCLOSURE OF LIMITATIONS: I agree to inform the instructor before class of any:
- Recent injuries, surgeries, or physical limitations
- Pregnancy or postpartum status
- Chronic pain or joint conditions
- Medical conditions that may affect my ability to exercise safely

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  // ═══ INDIVIDUAL & SPECIALTY WAIVERS ═══
  { id: 'private-training', name: 'Private Training — Equipment Consent', category: 'Training', content: `PRIVATE TRAINING SESSION — EQUIPMENT USE AND INFORMED CONSENT WAIVER

I, [Client Name], wish to participate in private one-on-one training sessions at [Business Name].

NATURE OF ACTIVITY: Private training sessions provide individualized instruction in Pilates and/or movement-based fitness. Sessions are customized to the client's specific goals, current fitness level, injury history, and physical limitations.

EQUIPMENT USED IN PRIVATE SESSIONS: Private sessions may utilize any combination of the following equipment:
- Pilates Reformer (spring-resistance sliding carriage machine)
- Cadillac / Tower (vertical frame with springs, bars, and straps)
- Wunda Chair (spring-loaded pedal resistance device)
- Stability ball, foam roller, resistance bands, and small props
- Bodyweight and mat-based exercises

I agree to receive instruction on proper equipment use before beginning any exercise and to ask questions when I am unsure of proper form or setup.

RISKS OF ONE-ON-ONE TRAINING: I understand that private training may involve:
- Progressive physical challenge designed to build strength, flexibility, and body awareness
- Hands-on instructor cueing and tactile corrections (with my verbal consent prior to each session)
- Higher-intensity or more technically demanding work than group classes
- Muscle fatigue, soreness, or exertion beyond my current conditioning level

PERSONALIZED PROGRAMMING AND INJURY DISCLOSURE:
- I agree to provide complete and honest information about my physical history, including past injuries, surgeries, chronic pain, joint conditions, and medical diagnoses
- I understand that withholding relevant health information may result in programming that is inappropriate for my condition
- I agree to communicate openly during all sessions if any exercise causes sharp pain, joint discomfort, dizziness, or concern
- I will not attempt exercises discussed or described outside our sessions without prior instructor approval

PROGRESSION:
- I understand that my program will be progressively adjusted as I develop strength and skill
- I agree to respect my instructor's guidance regarding readiness to advance to more challenging exercises or equipment configurations

CANCELLATION: I understand the studio's cancellation policy and agree that private sessions cancelled with less than 24 hours notice may be subject to a cancellation fee.

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation, provided sessions are conducted in accordance with my fully disclosed health information.

Client Signature: _________________________
Date: ____________
Instructor: _________________________` },

  { id: 'stretch-recovery', name: 'Stretch & Recovery Waiver', category: 'Recovery', content: `STRETCH & RECOVERY SESSION — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to participate in Stretch & Recovery sessions at [Business Name].

NATURE OF ACTIVITY: Stretch & Recovery sessions are guided flexibility and recovery-focused sessions that may include assisted stretching, self-guided foam rolling, mobility exercises, and relaxation techniques. These sessions are designed to improve range of motion, reduce muscle tension, and support recovery from physical activity.

SESSION ELEMENTS: Stretch & Recovery sessions may include any combination of:
- Assisted static and dynamic stretching (instructor-guided, hands-on assistance with prior consent)
- Foam rolling and self-myofascial release techniques
- Mobility drills using resistance bands, blocks, or bolsters
- Guided breathwork and relaxation techniques
- Flexibility assessment and progress tracking

PHYSICAL RISKS: I understand that stretching and flexibility work carries the following potential risks:
- Temporary muscle discomfort or soreness following deep stretching
- Overstretching or strain if range of motion is pushed beyond current limits
- Joint discomfort, particularly in the hips, shoulders, hamstrings, or lower back
- Nerve sensitivity or temporary tingling during deep hip or posterior chain stretches
- Aggravation of pre-existing muscle tightness or joint conditions if contraindications are not disclosed

CONTRAINDICATIONS AND HEALTH DISCLOSURE: I understand that Stretch & Recovery sessions may not be appropriate if I have:
- Acute muscle tears, sprains, or strains (must be cleared by a physician)
- Recent surgery or joint replacement (must provide medical clearance)
- Osteoporosis or bone density conditions that increase fracture risk
- Hypermobility syndrome or Ehlers-Danlos Syndrome (modifications required)
- Active inflammation or flare-up of a joint condition
- Numbness, tingling, or nerve-related symptoms in any limb
I agree to disclose all relevant conditions before my session and to update my instructor of any changes to my health status.

ASSISTED STRETCHING CONSENT: I understand that assisted stretching involves my instructor applying gentle pressure to guide my body through a stretch. I consent to hands-on assistance and agree to communicate immediately if any stretch causes sharp pain, joint discomfort, or numbness. My instructor will stop and modify at my request at any time.

FOAM ROLLING GUIDANCE: I understand that foam rolling is a self-applied technique and that I am responsible for controlling the pressure and duration applied to any given area. My instructor will provide guidance, but I acknowledge that excessive pressure may cause temporary bruising or discomfort.

I voluntarily assume all risks associated with participation in Stretch & Recovery sessions and release [Business Name] and its instructors from liability for injury arising from my participation, provided that I have fully disclosed relevant health and physical information.

Client Signature: _________________________
Date: ____________
Instructor/Witness: _________________________` },

  // ═══ WELLNESS & PROGRAM WAIVERS ═══
  { id: 'foundations-program', name: 'Pilates Foundations Program Waiver', category: 'Program', content: `PILATES FOUNDATIONS PROGRAM — PARTICIPATION WAIVER AND RELEASE

I, [Client Name], wish to enroll in the Pilates Foundations Program at [Business Name].

PROGRAM DESCRIPTION: The Pilates Foundations Program is a structured multi-week introduction to Pilates principles and practice. The program includes a combination of mat work, introductory reformer instruction, and movement education. Sessions are designed for those new to Pilates or returning after a long break.

PROGRAM SCHEDULE:
Program length: _______ weeks
Session frequency: _______ sessions per week
Instructor assigned: _______________________________

PHYSICAL DEMANDS: I understand the program will progressively build:
- Core strength and stability
- Spinal mobility and flexibility
- Body awareness and movement efficiency
- Breathing coordination with movement

RISKS: I understand that participation in a progressive Pilates program carries the following potential risks:
- Muscle soreness, particularly in early weeks as new movement patterns are introduced
- Temporary joint discomfort if movements are performed with improper alignment
- Fatigue or overexertion if session frequency or intensity is increased too quickly
- Aggravation of pre-existing conditions if not properly disclosed and accommodated

PROGRAM PARTICIPATION EXPECTATIONS:
- I agree to attend sessions consistently and complete the full program for best results
- I understand that individual results vary based on consistency, effort, and starting fitness level
- I agree to communicate openly with my instructor about any discomfort, concerns, or life changes that may affect my participation
- I understand that if I miss sessions, I may need to reschedule to maintain program continuity

HEALTH DISCLOSURE: I confirm that I have fully disclosed all relevant injuries, surgeries, and health conditions on my intake form. I will notify my instructor immediately of any changes to my health status during the program.

I voluntarily assume all risks associated with participation and release [Business Name] and its instructors from liability for injury arising from my participation.

Client Signature: _________________________
Date: ____________
Instructor: _________________________` },

  { id: 'prenatal', name: 'Prenatal Pilates Waiver', category: 'Specialty', content: `PRENATAL PILATES — PARTICIPATION WAIVER AND INFORMED CONSENT

I, [Client Name], wish to participate in Prenatal Pilates sessions at [Business Name].

NATURE OF ACTIVITY: Prenatal Pilates is a modified Pilates practice specifically designed for pregnant clients. Sessions focus on maintaining core and pelvic floor strength, improving posture, reducing pregnancy-related discomfort, and preparing the body for labor and postpartum recovery. All exercises are adapted for pregnancy safety.

PHYSICIAN CLEARANCE: I confirm that I have received clearance from my obstetrician, midwife, or healthcare provider to participate in prenatal exercise. I understand that clearance should be re-confirmed if any complications arise during my pregnancy.

Attending Provider: _________________________
Estimated Due Date: _________________________
Current Week of Pregnancy: _________

PREGNANCY-SPECIFIC RISKS: I understand that even with modifications, prenatal exercise carries the following considerations:
- Pelvic girdle pain or symphysis pubis dysfunction can be aggravated by certain movements
- Round ligament discomfort during transitions or lateral movements
- Diastasis recti (abdominal separation) risk if inappropriate loading is applied
- Balance challenges increase as pregnancy progresses and center of gravity shifts
- Overheating is a concern — I will stay hydrated and rest when needed

MOVEMENTS I WILL AVOID (per prenatal guidelines):
- Lying flat on my back for extended periods after the first trimester
- Deep twisting or compressive movements
- High-impact or jumping movements
- Heavy abdominal loading or traditional crunches
- Any movement that causes pain, pressure, or shortness of breath

STOP SIGNS: I agree to stop exercising immediately and contact my healthcare provider if I experience:
- Vaginal bleeding or fluid leakage
- Chest pain or difficulty breathing beyond normal exertion
- Dizziness, faintness, or severe headache
- Painful uterine contractions
- Decreased fetal movement
- Calf pain or swelling

I voluntarily assume all risks associated with prenatal Pilates participation and release [Business Name] and its instructors from liability for injury arising from my participation, provided I have disclosed my pregnancy status and all relevant health information.

Client Signature: _________________________
Date: ____________
Instructor: _________________________` },

  // ═══ OPTIONAL / POLICY CONSENTS ═══
  { id: 'photo', name: 'Photo / Marketing Consent', category: 'Optional', content: `CONSENT FOR PHOTOGRAPHY AND MARKETING USE

[Business Name] — Photo Release and Usage Authorization

SECTION 1: SESSION PHOTOGRAPHY
I authorize [Business Name] and its instructors to take before, during, and after photographs and/or videos of my sessions for use in client progress tracking and my personal client file.

[ ] I CONSENT to session photography for my client file

SECTION 2: MARKETING AND EDUCATIONAL USE
I understand that [Business Name] may wish to use my photographs for educational, marketing, or promotional purposes including but not limited to: social media (Instagram, Facebook, TikTok), website, print materials, presentations, and advertising.

Please select ONE:
[ ] OPTION A — NO marketing use. Photos are for my client file ONLY.
[ ] OPTION B — ANONYMOUS use only. Photos may be used but my face will be cropped or obscured so I am NOT identifiable.
[ ] OPTION C — IDENTIFIABLE use. Photos may be used with my face visible. [Business Name] may tag me on social media with my permission.

SECTION 3: TERMS
- I will not receive compensation for the use of my photographs
- I may revoke this consent at any time by submitting a written request
- Revoking consent does not apply to materials already published or distributed
- [Business Name] will make reasonable efforts to remove content upon revocation
- My decision regarding marketing use will NOT affect the quality of instruction I receive

Client Signature: _________________________
Date: ____________
Witness: _________________________` },

  { id: 'cancellation', name: 'Cancellation / No-Show Policy', category: 'Policy', content: `CANCELLATION AND NO-SHOW POLICY ACKNOWLEDGMENT

[Business Name] — Appointment Policy

We value your time and ours. To ensure all clients receive timely care, we maintain the following policies:

CANCELLATION POLICY:
- Appointments must be cancelled or rescheduled at least 24 hours in advance
- Cancellations with less than 24 hours notice will incur a late cancellation fee equal to 50% of the scheduled service cost
- Some premium sessions (private training, specialty workshops) require 48 hours notice

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
- We accept: Cash, Credit/Debit Cards, Class Packs, Monthly Memberships
- All prices are subject to change without notice
- Consultations are complimentary unless otherwise stated

FITNESS SERVICES AND INSURANCE:
- Pilates and fitness sessions are not covered by standard health insurance
- [Business Name] does not bill insurance for fitness or movement sessions
- Clients with FSA/HSA accounts should consult their plan administrator regarding eligibility

REFUND POLICY:
- Sessions and services are non-refundable once performed
- Product purchases may be returned unopened within 14 days with receipt
- Gift cards and account credits are non-refundable
- Class pack and membership payments are non-refundable but may be transferred per our transfer policy

CLASS PACKS AND MEMBERSHIPS:
- Class packs are valid for the duration specified at time of purchase
- Monthly memberships auto-renew unless cancelled per the membership agreement
- [Business Name] is not responsible for unused classes if the client does not attend scheduled sessions

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
    { id: 'W-1', templateId: 'general', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Sarah Chen, CPT', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-2', templateId: 'reformer', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Jordan Taylor, PMA-CPT', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-3', templateId: 'photo', clientId: 'CLT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: '', status: 'signed', photoConsent: 'identifiable', expiresAt: ago(-360) },
    { id: 'W-4', templateId: 'general', clientId: 'CLT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Jordan Taylor, PMA-CPT', status: 'signed', expiresAt: ago(-335) },
    { id: 'W-5', templateId: 'barre', clientId: 'CLT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Sarah Chen, CPT', status: 'signed', expiresAt: ago(-335) },
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
