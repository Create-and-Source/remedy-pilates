import { useState, useCallback, useRef, useEffect } from 'react';
import { useStyles } from '../theme';

// ── Class Sequencer — AI Exercise Flow Generator ──
// Generates timed exercise sequences with warm-up / main / cool-down phases.
// Inputs: class type, duration, level, focus areas, contraindications
// Outputs: ordered exercise list with sets, reps, timing, teaching cues

const CLASS_TYPES = [
  { id: 'reformer', name: 'Reformer Pilates', equipment: ['Reformer'], icon: '🔧' },
  { id: 'mat', name: 'Mat Pilates', equipment: ['Mat'], icon: '🧘' },
  { id: 'barre', name: 'Barre', equipment: ['Barre', 'Light weights', 'Ball'], icon: '🩰' },
  { id: 'barre-burn', name: 'Barre Burn', equipment: ['Barre', 'Bands', 'Weights'], icon: '🔥' },
  { id: 'trx', name: 'TRX Fusion', equipment: ['TRX', 'Mat'], icon: '💪' },
  { id: 'reformer-cardio', name: 'Reformer + Cardio', equipment: ['Reformer', 'Jump board'], icon: '⚡' },
  { id: 'stretch', name: 'Stretch & Restore', equipment: ['Mat', 'Foam roller', 'Strap'], icon: '🌿' },
  { id: 'prenatal', name: 'Prenatal Pilates', equipment: ['Reformer', 'Props'], icon: '🤰' },
];

const FOCUS_AREAS = ['Core', 'Glutes', 'Upper Body', 'Lower Body', 'Full Body', 'Flexibility', 'Balance', 'Posture'];

const LEVELS = [
  { id: 'beginner', name: 'Beginner', modifier: 0.7 },
  { id: 'intermediate', name: 'Intermediate', modifier: 1.0 },
  { id: 'advanced', name: 'Advanced', modifier: 1.3 },
  { id: 'mixed', name: 'Mixed Level', modifier: 0.9 },
];

const CONTRAINDICATIONS = [
  'Lower back pain', 'Knee injury', 'Shoulder injury', 'Neck pain',
  'Pregnancy', 'Wrist pain', 'Hip replacement', 'Osteoporosis',
  'Diastasis recti', 'Sciatica',
];

// ── Exercise Libraries ──
const EXERCISES = {
  reformer: {
    warmup: [
      { name: 'Footwork — Parallel', springs: '3R+1B', reps: '10', time: 3, cue: 'Neutral spine, even pressure through all 10 toes. Exhale to press, inhale to return.', focus: ['Core', 'Lower Body'], contra: [] },
      { name: 'Footwork — V Position', springs: '3R+1B', reps: '10', time: 2, cue: 'Heels together, toes apart. Wrap outer hips. Maintain carriage control.', focus: ['Core', 'Lower Body', 'Glutes'], contra: [] },
      { name: 'Footwork — Heels', springs: '3R+1B', reps: '10', time: 2, cue: 'Flex feet, dorsiflexion. Press through heels, feel hamstring engagement.', focus: ['Lower Body'], contra: ['Knee injury'] },
      { name: 'Hundred Prep', springs: '2R', reps: '50-100 pumps', time: 3, cue: 'Imprint spine, pump arms 6 inches. Inhale 5, exhale 5. Legs table-top or extended.', focus: ['Core'], contra: ['Neck pain'] },
      { name: 'Warm-Up Bridges', springs: '2R', reps: '8', time: 2, cue: 'Feet on footbar. Articulate spine up, hold, roll down one vertebra at a time.', focus: ['Core', 'Glutes'], contra: [] },
    ],
    main: [
      { name: 'Long Stretch', springs: '2R', reps: '6-8', time: 3, cue: 'Plank position on carriage. Push out with control, pull in using core. No sagging!', focus: ['Core', 'Upper Body', 'Full Body'], contra: ['Wrist pain', 'Shoulder injury'] },
      { name: 'Elephant', springs: '2R', reps: '8', time: 3, cue: 'Round spine, head down. Push carriage back with straight legs. Scoop abs deeply.', focus: ['Core', 'Flexibility'], contra: ['Lower back pain'] },
      { name: 'Knee Stretches — Round', springs: '2R', reps: '10', time: 2, cue: 'Knees on carriage, round spine. Quick pushes back. Stay in the C-curve.', focus: ['Core', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Knee Stretches — Flat', springs: '2R', reps: '10', time: 2, cue: 'Same position, flat back. Maintain neutral spine while pushing. Hip hinge pattern.', focus: ['Core', 'Lower Body', 'Posture'], contra: ['Knee injury'] },
      { name: 'Single Leg Press', springs: '2R', reps: '8 each', time: 4, cue: 'One foot on bar, other leg extended to ceiling. Press evenly through standing foot.', focus: ['Lower Body', 'Balance', 'Glutes'], contra: ['Knee injury'] },
      { name: 'Long Box — Pull Straps', springs: '1R', reps: '8', time: 3, cue: 'Prone on box. Pull straps alongside body, lift chest. Squeeze shoulder blades.', focus: ['Upper Body', 'Posture'], contra: ['Lower back pain', 'Shoulder injury'] },
      { name: 'Long Box — T Pull', springs: '1R', reps: '8', time: 3, cue: 'Arms wide to T shape, lift chest. Keep ribs connected. Exhale to lift.', focus: ['Upper Body', 'Posture'], contra: ['Shoulder injury'] },
      { name: 'Short Box — Round Back', springs: 'Straps', reps: '6', time: 3, cue: 'Sit tall, round back to lower. Use core to control the roll-back. Don\'t collapse.', focus: ['Core'], contra: ['Lower back pain'] },
      { name: 'Short Box — Flat Back', springs: 'Straps', reps: '6', time: 3, cue: 'Hinge back with flat spine. Arms overhead or crossed. Engage obliques to return.', focus: ['Core', 'Posture'], contra: ['Lower back pain'] },
      { name: 'Side Splits', springs: '1R', reps: '8', time: 3, cue: 'Stand on carriage + platform. Open legs to press out, close to pull in. Inner thigh fire!', focus: ['Lower Body', 'Balance', 'Glutes'], contra: ['Hip replacement'] },
      { name: 'Scooter', springs: '1R+1B', reps: '10 each', time: 4, cue: 'Standing lunge, push back leg. Keep front knee stacked. Glute burn incoming.', focus: ['Glutes', 'Balance', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Snake / Twist', springs: '1R+1B', reps: '4 each', time: 4, cue: 'Side plank on carriage. Push out, thread arm under. Advanced — control is everything.', focus: ['Core', 'Upper Body', 'Full Body'], contra: ['Wrist pain', 'Shoulder injury'] },
      { name: 'Semi-Circle', springs: '2R', reps: '4 each direction', time: 4, cue: 'Shoulders on carriage, feet on footbar. Arc hips up-out-down, reverse. Spinal mobility.', focus: ['Core', 'Flexibility'], contra: ['Neck pain', 'Lower back pain'] },
    ],
    cooldown: [
      { name: 'Mermaid Stretch', springs: '1B', reps: '4 each side', time: 3, cue: 'Side sitting, reach arm overhead. Breathe into the stretch. Open the ribcage.', focus: ['Flexibility'], contra: [] },
      { name: 'Hip Flexor Stretch', springs: '1B', reps: 'Hold 30s each', time: 3, cue: 'Kneeling lunge on carriage. Press out gently. Breathe and release the hip.', focus: ['Flexibility', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Spinal Twist', springs: 'None', reps: 'Hold 20s each', time: 2, cue: 'Seated twist, gentle rotation. Let the breath deepen the twist.', focus: ['Flexibility', 'Core'], contra: [] },
      { name: 'Eve\'s Lunge', springs: '1R', reps: '4 each', time: 3, cue: 'Standing split with control. Open hip, stretch psoas. Beautiful finish.', focus: ['Flexibility', 'Balance'], contra: ['Knee injury'] },
    ],
  },
  mat: {
    warmup: [
      { name: 'Pelvic Curl', springs: '-', reps: '8', time: 3, cue: 'Inhale to prepare, exhale to curl tailbone, roll spine up. Inhale at top, exhale to roll down.', focus: ['Core', 'Glutes'], contra: [] },
      { name: 'Spine Twist Supine', springs: '-', reps: '6 each side', time: 3, cue: 'Knees together, drop side to side. Keep shoulders grounded. Control the rotation.', focus: ['Core', 'Flexibility'], contra: [] },
      { name: 'Cat-Cow', springs: '-', reps: '8', time: 2, cue: 'Hands and knees. Inhale arch, exhale round. Move through every vertebra.', focus: ['Flexibility', 'Core'], contra: [] },
      { name: 'The Hundred', springs: '-', reps: '100 pumps', time: 4, cue: 'Curl up, pump arms. Inhale 5 counts, exhale 5. Legs at your level. Eyes on belly.', focus: ['Core'], contra: ['Neck pain'] },
    ],
    main: [
      { name: 'Roll Up', springs: '-', reps: '6-8', time: 3, cue: 'Arms reach to ceiling, curl up one vertebra at a time. Reach past toes, roll back down.', focus: ['Core', 'Flexibility'], contra: ['Lower back pain'] },
      { name: 'Single Leg Circles', springs: '-', reps: '5 each direction', time: 3, cue: 'One leg to ceiling, circle. Keep pelvis stable. Reverse direction.', focus: ['Core', 'Lower Body', 'Flexibility'], contra: [] },
      { name: 'Rolling Like a Ball', springs: '-', reps: '8', time: 2, cue: 'Balance on sit bones, round shape. Roll back to shoulder blades, return. Maintain the shape.', focus: ['Core', 'Balance'], contra: ['Lower back pain', 'Osteoporosis'] },
      { name: 'Single Leg Stretch', springs: '-', reps: '10 each', time: 3, cue: 'Curl up, alternate extending legs. Pull knee in, switch. Keep upper body lifted.', focus: ['Core'], contra: ['Neck pain'] },
      { name: 'Double Leg Stretch', springs: '-', reps: '8', time: 3, cue: 'Arms and legs reach away simultaneously, circle arms back, pull knees in. Big breath.', focus: ['Core', 'Full Body'], contra: ['Neck pain', 'Lower back pain'] },
      { name: 'Criss-Cross', springs: '-', reps: '10 each', time: 3, cue: 'Twist to each side, elbow toward opposite knee. Rotate from ribcage, not neck.', focus: ['Core'], contra: ['Neck pain'] },
      { name: 'Spine Stretch Forward', springs: '-', reps: '6', time: 3, cue: 'Sit tall, hinge forward. Stack up tall again. Imagine peeling off a wall.', focus: ['Flexibility', 'Core', 'Posture'], contra: [] },
      { name: 'Saw', springs: '-', reps: '4 each side', time: 3, cue: 'Twist, reach pinky past little toe. Opposition — back arm reaches back.', focus: ['Core', 'Flexibility'], contra: ['Lower back pain'] },
      { name: 'Swan Prep', springs: '-', reps: '6', time: 3, cue: 'Prone, hands by shoulders. Lengthen and lift chest. Keep pubic bone down. Extension!', focus: ['Upper Body', 'Posture'], contra: ['Lower back pain'] },
      { name: 'Side Kick Series', springs: '-', reps: '10 each', time: 4, cue: 'Side lying. Front/back kicks, up/down, circles. Stack hips, don\'t roll back.', focus: ['Lower Body', 'Glutes', 'Balance'], contra: ['Hip replacement'] },
      { name: 'Teaser', springs: '-', reps: '4', time: 3, cue: 'Roll up to V-sit, arms parallel to legs. The ultimate Pilates exercise. Control the descent.', focus: ['Core', 'Full Body', 'Balance'], contra: ['Lower back pain'] },
      { name: 'Swimming', springs: '-', reps: '20 beats', time: 2, cue: 'Prone, lift all limbs. Flutter opposite arm/leg. Keep length — reach long.', focus: ['Core', 'Upper Body', 'Posture'], contra: ['Lower back pain'] },
    ],
    cooldown: [
      { name: 'Mermaid', springs: '-', reps: '4 each side', time: 3, cue: 'Side bend, arm overhead. Breathe into the stretch. Feel the space between ribs.', focus: ['Flexibility'], contra: [] },
      { name: 'Seal', springs: '-', reps: '6', time: 2, cue: 'Rolling exercise with feet clapping. Playful finish. Balance at the top.', focus: ['Core', 'Balance'], contra: ['Lower back pain'] },
      { name: 'Spine Twist Seated', springs: '-', reps: '4 each side', time: 2, cue: 'Sit tall, arms wide. Rotate. Pulse pulse. Return center. Grow taller each time.', focus: ['Flexibility', 'Core'], contra: [] },
      { name: 'Child\'s Pose', springs: '-', reps: 'Hold 30s', time: 2, cue: 'Rest. Breathe. Let the spine release. You earned this.', focus: ['Flexibility'], contra: [] },
    ],
  },
  barre: {
    warmup: [
      { name: 'Plié Series — 1st Position', springs: '-', reps: '16', time: 3, cue: 'Heels together, turn out from hips. Bend and straighten. Stack the spine tall.', focus: ['Lower Body', 'Glutes'], contra: [] },
      { name: 'Relevé + Plié', springs: '-', reps: '8', time: 2, cue: 'Rise to toes, hold, plié down. Control the lower. Feel the shake!', focus: ['Lower Body', 'Balance'], contra: ['Knee injury'] },
      { name: 'Arm Series — Light Weights', springs: '2lb weights', reps: '16 each', time: 4, cue: 'Bicep curls, overhead press, lateral raise. Keep ribs knit. Posture matters here.', focus: ['Upper Body'], contra: ['Shoulder injury'] },
    ],
    main: [
      { name: 'Thigh Work — Chair Pose', springs: '-', reps: 'Hold 45s + pulses', time: 4, cue: 'Sit back, knees over ankles. Pulse down 1 inch. This is where it burns. Stay.', focus: ['Lower Body', 'Core'], contra: ['Knee injury'] },
      { name: 'Parallel Thigh at Barre', springs: '-', reps: 'Hold + 32 pulses', time: 4, cue: 'Rise to demi-pointe, bend knees. Tiny pulses. Thighs are working. Don\'t grip the barre.', focus: ['Lower Body', 'Balance'], contra: ['Knee injury'] },
      { name: 'Standing Seat Work', springs: '-', reps: '24 each side', time: 5, cue: 'Leg behind, press back. Lift and lower. Keep hips square. Glute on fire is the goal.', focus: ['Glutes', 'Balance'], contra: ['Hip replacement'] },
      { name: 'Arabesque Lifts', springs: '-', reps: '16 each side', time: 4, cue: 'Straight leg lifts behind. Small range, big engagement. Turn out for outer glute.', focus: ['Glutes', 'Balance', 'Posture'], contra: [] },
      { name: 'Pretzel', springs: '-', reps: '24 each side', time: 4, cue: 'Side sitting, back leg lifts. Press foot to ceiling. Outer hip and oblique work.', focus: ['Glutes', 'Core'], contra: ['Knee injury'] },
      { name: 'Flat Back at Barre', springs: '-', reps: '16 + hold', time: 4, cue: 'Hinge forward, flat spine. Hamstring curl or leg press. Core stays braced.', focus: ['Lower Body', 'Core', 'Posture'], contra: ['Lower back pain'] },
      { name: 'Core — Plank to Pike', springs: '-', reps: '8', time: 3, cue: 'Forearm plank, lift hips to pike. Lower with control. Abs pull up and in.', focus: ['Core', 'Full Body'], contra: ['Wrist pain', 'Shoulder injury'] },
      { name: 'Tricep Dips at Barre', springs: '-', reps: '16', time: 3, cue: 'Hands on barre behind. Bend elbows straight back, press up. Keep core tight.', focus: ['Upper Body'], contra: ['Shoulder injury', 'Wrist pain'] },
    ],
    cooldown: [
      { name: 'Standing Quad Stretch', springs: '-', reps: 'Hold 30s each', time: 2, cue: 'Pull heel to glute. Open the hip. Breathe into the front of the thigh.', focus: ['Flexibility', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Forward Fold', springs: '-', reps: 'Hold 30s', time: 2, cue: 'Ragdoll. Let gravity do the work. Nod yes and no to release the neck.', focus: ['Flexibility'], contra: [] },
      { name: 'Figure-4 Stretch', springs: '-', reps: 'Hold 30s each', time: 3, cue: 'Ankle on opposite knee. Sit back into stretch. Breathe into the glute.', focus: ['Flexibility', 'Glutes'], contra: ['Knee injury'] },
    ],
  },
  'barre-burn': {
    warmup: [
      { name: 'Dynamic Squat Series', springs: 'Band', reps: '16', time: 3, cue: 'Band above knees. Squat wide, press knees out against band. Activate glutes.', focus: ['Lower Body', 'Glutes'], contra: ['Knee injury'] },
      { name: 'Jumping Jacks — Low Impact', springs: '-', reps: '20', time: 2, cue: 'Step out wide, arms overhead. No jumping needed. Get the heart rate up.', focus: ['Full Body'], contra: [] },
      { name: 'Arm Burn — Band Pulls', springs: 'Band', reps: '16 each move', time: 3, cue: 'Band in hands: bicep curl, chest press, pull-apart. Don\'t rest between moves.', focus: ['Upper Body'], contra: ['Shoulder injury'] },
    ],
    main: [
      { name: 'Sumo Squat + Pulse', springs: 'Weights', reps: '16 + 32 pulses', time: 4, cue: 'Wide stance, toes out. Full squat then hold at bottom for pulses. Lower = harder.', focus: ['Lower Body', 'Glutes'], contra: ['Knee injury'] },
      { name: 'Curtsy Lunge to Lateral Raise', springs: '3lb weights', reps: '12 each', time: 4, cue: 'Step back into curtsy, raise arms to T. Compound movement. Control the lunge.', focus: ['Lower Body', 'Upper Body', 'Balance'], contra: ['Knee injury'] },
      { name: 'Barre Cardio Burst — Skaters', springs: '-', reps: '20', time: 2, cue: 'Side-to-side lateral jumps. Light on the feet. Arms swing for balance.', focus: ['Full Body', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Seat Series — Kick Backs', springs: 'Band', reps: '24 each', time: 5, cue: 'Band around ankles. Kickback, side lift, fire hydrant. No rest. Feel the outer hip.', focus: ['Glutes', 'Lower Body'], contra: [] },
      { name: 'Push-Up + Plank Series', springs: '-', reps: '10 + holds', time: 4, cue: 'Push-ups, then hold plank. Tap shoulders alternating. Core stays rock solid.', focus: ['Upper Body', 'Core'], contra: ['Wrist pain', 'Shoulder injury'] },
      { name: 'Core — Mountain Climbers', springs: '-', reps: '20', time: 2, cue: 'Drive knees to chest, fast. Plank position. Cardio + core in one.', focus: ['Core', 'Full Body'], contra: ['Wrist pain'] },
      { name: 'Tabletop Abs — Toe Taps', springs: '-', reps: '16', time: 3, cue: 'Supine, legs tabletop. Lower one toe at a time. Imprint spine. Never let the back arch.', focus: ['Core'], contra: [] },
    ],
    cooldown: [
      { name: 'Standing Hamstring Stretch', springs: '-', reps: 'Hold 30s each', time: 2, cue: 'Heel on barre or chair. Fold forward. Breathe into the back of the leg.', focus: ['Flexibility', 'Lower Body'], contra: [] },
      { name: 'Hip Flexor Lunge Stretch', springs: '-', reps: 'Hold 30s each', time: 3, cue: 'Low lunge, press hips forward. Arm reaches up and over. Breathe deeply.', focus: ['Flexibility', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Chest Opener', springs: '-', reps: 'Hold 20s', time: 2, cue: 'Interlace hands behind back. Lift chest, squeeze shoulder blades. Open the front body.', focus: ['Flexibility', 'Posture'], contra: [] },
    ],
  },
  trx: {
    warmup: [
      { name: 'TRX Squat', springs: 'TRX', reps: '12', time: 3, cue: 'Hold handles, sit back. Use straps for balance. Full depth squat.', focus: ['Lower Body'], contra: [] },
      { name: 'TRX Row — Light', springs: 'TRX', reps: '10', time: 2, cue: 'Lean back at 45°, pull chest to handles. Squeeze shoulder blades. Warm up the back.', focus: ['Upper Body', 'Posture'], contra: [] },
      { name: 'TRX Torso Rotation', springs: 'TRX', reps: '8 each', time: 2, cue: 'Arms extended, rotate open. Control the twist. Feet stay planted.', focus: ['Core', 'Flexibility'], contra: [] },
    ],
    main: [
      { name: 'TRX Pistol Squat', springs: 'TRX', reps: '8 each', time: 4, cue: 'Single leg squat, other foot forward. Straps for assist. Go as deep as you can.', focus: ['Lower Body', 'Balance'], contra: ['Knee injury'] },
      { name: 'TRX Chest Press', springs: 'TRX', reps: '12', time: 3, cue: 'Facing away, fall forward into push position. Press back up. More lean = harder.', focus: ['Upper Body', 'Core'], contra: ['Shoulder injury', 'Wrist pain'] },
      { name: 'TRX Lunge', springs: 'TRX', reps: '10 each', time: 4, cue: 'Rear foot in strap. Bulgarian split squat. Keep front knee stacked over ankle.', focus: ['Lower Body', 'Glutes', 'Balance'], contra: ['Knee injury'] },
      { name: 'TRX Y-Fly', springs: 'TRX', reps: '10', time: 3, cue: 'Lean back, arms to Y shape overhead. Squeeze upper back. Posture magic.', focus: ['Upper Body', 'Posture'], contra: ['Shoulder injury'] },
      { name: 'TRX Pike', springs: 'TRX', reps: '8', time: 3, cue: 'Feet in straps, plank position. Pike hips to ceiling. Abs do all the work.', focus: ['Core', 'Full Body'], contra: ['Shoulder injury', 'Wrist pain'] },
      { name: 'TRX Hamstring Curl', springs: 'TRX', reps: '10', time: 3, cue: 'Supine, heels in straps. Bridge up, curl heels toward glutes. Control the return.', focus: ['Lower Body', 'Glutes'], contra: [] },
      { name: 'TRX Plank + Saw', springs: 'TRX', reps: '8 each', time: 3, cue: 'Forearm plank, feet in straps. Rock forward and back. Tiny movement, huge core work.', focus: ['Core'], contra: ['Shoulder injury'] },
    ],
    cooldown: [
      { name: 'TRX Chest Stretch', springs: 'TRX', reps: 'Hold 30s', time: 2, cue: 'Face away, arms wide holding straps. Lean forward to open chest.', focus: ['Flexibility', 'Upper Body'], contra: [] },
      { name: 'TRX Hip Stretch', springs: 'TRX', reps: 'Hold 30s each', time: 3, cue: 'Pigeon stretch using TRX for balance. Sink into the hip.', focus: ['Flexibility', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Standing Roll-Down', springs: '-', reps: '4', time: 2, cue: 'Chin to chest, roll down vertebra by vertebra. Hang. Roll back up.', focus: ['Flexibility'], contra: [] },
    ],
  },
  'reformer-cardio': {
    warmup: [
      { name: 'Footwork — Running', springs: '3R+1B', reps: '20 alternating', time: 3, cue: 'Quick alternating heel lowers on the footbar. Light, bouncy. Get warm.', focus: ['Lower Body'], contra: [] },
      { name: 'Jump Board — Basic Jumps', springs: '2R', reps: '16', time: 3, cue: 'Parallel feet, jump and land softly. Point toes in air. Absorb the landing.', focus: ['Full Body', 'Lower Body'], contra: ['Knee injury'] },
      { name: 'Hundred', springs: '2R', reps: '100 pumps', time: 3, cue: 'Arms pumping, legs extended. Get the blood flowing. Energize the breath.', focus: ['Core'], contra: ['Neck pain'] },
    ],
    main: [
      { name: 'Jump Board — Tuck Jumps', springs: '2R', reps: '12', time: 3, cue: 'Jump, pull knees to chest. Extend to land. Fast and controlled.', focus: ['Core', 'Lower Body', 'Full Body'], contra: ['Knee injury', 'Lower back pain'] },
      { name: 'Jump Board — Scissor Jumps', springs: '2R', reps: '16', time: 3, cue: 'Alternate legs in air, like running. Quick switches. Light landings.', focus: ['Lower Body', 'Balance'], contra: ['Knee injury'] },
      { name: 'Jump Board — Wide to Narrow', springs: '2R', reps: '16', time: 3, cue: 'Jump feet wide, jump feet narrow. Inner thigh engagement. Keep rhythm.', focus: ['Lower Body', 'Glutes'], contra: ['Knee injury'] },
      { name: 'Long Stretch — Tempo', springs: '2R', reps: '10', time: 3, cue: 'Plank on carriage. Push out fast, pull in slow. Tempo challenge.', focus: ['Core', 'Upper Body'], contra: ['Wrist pain', 'Shoulder injury'] },
      { name: 'Standing Lunge on Carriage', springs: '1R+1B', reps: '12 each', time: 5, cue: 'One foot on platform, one on carriage. Push out into lunge. Deep burn.', focus: ['Lower Body', 'Glutes', 'Balance'], contra: ['Knee injury'] },
      { name: 'Short Box — Oblique Twist', springs: 'Straps', reps: '8 each', time: 3, cue: 'Sit on box, twist and reach. Come back through center. Controlled rotation.', focus: ['Core'], contra: ['Lower back pain'] },
    ],
    cooldown: [
      { name: 'Mermaid', springs: '1B', reps: '4 each', time: 3, cue: 'Side bend on reformer. Breathe deeply. Open the ribs.', focus: ['Flexibility'], contra: [] },
      { name: 'Hamstring Stretch on Carriage', springs: '1B', reps: 'Hold 30s each', time: 3, cue: 'Foot in strap, extend leg. Gently press carriage open. Let the hamstring release.', focus: ['Flexibility', 'Lower Body'], contra: [] },
    ],
  },
  stretch: {
    warmup: [
      { name: 'Diaphragmatic Breathing', springs: '-', reps: '10 breaths', time: 3, cue: 'Hand on belly. Inhale expand 360°. Exhale let everything soften. Settle in.', focus: ['Core', 'Flexibility'], contra: [] },
      { name: 'Gentle Spinal Roll', springs: '-', reps: '6', time: 3, cue: 'Supine, hug knees. Tiny rocks side to side. Massage the lower back.', focus: ['Flexibility'], contra: [] },
    ],
    main: [
      { name: 'Foam Roller — Thoracic Extension', springs: 'Foam roller', reps: 'Hold 2min', time: 4, cue: 'Roller under upper back. Arms overhead. Let gravity open the chest. Breathe.', focus: ['Flexibility', 'Posture'], contra: ['Osteoporosis'] },
      { name: 'Foam Roller — IT Band', springs: 'Foam roller', reps: '90s each side', time: 5, cue: 'Side lying on roller. Roll from hip to knee slowly. Pause on tender spots.', focus: ['Flexibility', 'Lower Body'], contra: [] },
      { name: 'Foam Roller — Lats', springs: 'Foam roller', reps: '60s each side', time: 4, cue: 'Side lying, arm extended. Roll the lat. Thumb up to the ceiling.', focus: ['Flexibility', 'Upper Body'], contra: [] },
      { name: 'Pigeon Pose', springs: '-', reps: 'Hold 90s each', time: 5, cue: 'Front shin across mat, back leg extended. Fold forward. Deep hip release.', focus: ['Flexibility', 'Lower Body', 'Glutes'], contra: ['Knee injury', 'Hip replacement'] },
      { name: 'Supine Figure-4', springs: '-', reps: 'Hold 90s each', time: 5, cue: 'Ankle on opposite knee. Pull bottom knee toward chest. Gentle rocking optional.', focus: ['Flexibility', 'Glutes'], contra: [] },
      { name: 'Strap-Assisted Hamstring', springs: 'Strap', reps: 'Hold 60s each', time: 4, cue: 'Strap around foot, extend leg to ceiling. Relax the hip. Let the strap do the work.', focus: ['Flexibility', 'Lower Body'], contra: [] },
      { name: 'Thread the Needle', springs: '-', reps: 'Hold 30s each', time: 3, cue: 'Quadruped, thread arm under. Rest shoulder and ear on mat. Thoracic rotation.', focus: ['Flexibility', 'Upper Body'], contra: [] },
    ],
    cooldown: [
      { name: 'Constructive Rest', springs: '-', reps: 'Hold 3min', time: 4, cue: 'Knees bent, feet wide, knees fall together. Arms rest. Let the psoas release.', focus: ['Flexibility'], contra: [] },
      { name: 'Savasana with Body Scan', springs: '-', reps: '3-5 min', time: 5, cue: 'Full release. Scan from toes to crown. Let go of any remaining tension. You did it.', focus: ['Flexibility'], contra: [] },
    ],
  },
  prenatal: {
    warmup: [
      { name: 'Seated Breathing', springs: '-', reps: '10 breaths', time: 3, cue: 'Lateral rib breathing. Expand the ribcage side to side. Connect with baby.', focus: ['Core'], contra: [] },
      { name: 'Cat-Cow on Hands and Knees', springs: '-', reps: '8', time: 3, cue: 'Gentle spinal flexion/extension. No deep backbend. Keep baby comfortable.', focus: ['Flexibility', 'Core'], contra: [] },
      { name: 'Side-Lying Leg Lifts', springs: '-', reps: '10 each', time: 3, cue: 'Side lying with support. Lift top leg gently. Maintain hip stability.', focus: ['Lower Body', 'Glutes'], contra: [] },
    ],
    main: [
      { name: 'Seated Footwork on Reformer', springs: '2R', reps: '10', time: 3, cue: 'Seated position, push with legs. Safe for all trimesters. Focus on alignment.', focus: ['Lower Body'], contra: [] },
      { name: 'Side-Lying Reformer Series', springs: '1R', reps: '8 each', time: 4, cue: 'Side lying on carriage. Leg press, circles. Avoid supine after 1st trimester.', focus: ['Lower Body', 'Glutes'], contra: [] },
      { name: 'Standing Arm Work', springs: '1B', reps: '10 each move', time: 4, cue: 'Bicep curls, chest expansion with springs. Light resistance. Stay tall.', focus: ['Upper Body', 'Posture'], contra: [] },
      { name: 'Pelvic Floor Engagement', springs: '-', reps: '10 holds', time: 3, cue: 'Kegel with breath. Exhale to engage, inhale to release. Elevator up, elevator down.', focus: ['Core'], contra: [] },
      { name: 'Modified Plank — Inclined', springs: '-', reps: 'Hold 20s x 3', time: 3, cue: 'Hands on box or barre. Inclined plank. Keep hips neutral. No belly sag.', focus: ['Core', 'Upper Body'], contra: [] },
      { name: 'Squats with Support', springs: '-', reps: '12', time: 3, cue: 'Hold barre or TRX. Wide squat. Open the hips. Practice for labor positions.', focus: ['Lower Body', 'Glutes'], contra: [] },
    ],
    cooldown: [
      { name: 'Hip Circles on Ball', springs: 'Physioball', reps: '10 each direction', time: 3, cue: 'Seated on ball. Circle hips gently. Release tension in the pelvis.', focus: ['Flexibility', 'Lower Body'], contra: [] },
      { name: 'Side-Lying Stretch', springs: '-', reps: 'Hold 30s each', time: 3, cue: 'Supported side lying. Top arm reaches overhead. Open the side body.', focus: ['Flexibility'], contra: [] },
      { name: 'Butterfly Stretch', springs: '-', reps: 'Hold 60s', time: 3, cue: 'Soles of feet together. Gentle forward fold. Breathe into the inner thighs.', focus: ['Flexibility', 'Lower Body'], contra: [] },
    ],
  },
};

// Generate sequence from inputs
function generateSequence(classType, duration, level, focusAreas, contras) {
  const library = EXERCISES[classType] || EXERCISES.mat;
  const levelMod = LEVELS.find(l => l.id === level)?.modifier || 1.0;

  // Filter exercises by contraindications
  const filterContra = (list) => list.filter(ex =>
    !ex.contra.some(c => contras.includes(c))
  );

  // Score exercises by focus alignment
  const scoreFocus = (ex) => {
    if (focusAreas.length === 0) return 1;
    const matchCount = ex.focus.filter(f => focusAreas.includes(f)).length;
    return matchCount > 0 ? 1 + matchCount * 0.5 : 0.3;
  };

  // Phase time allocation
  const warmupTime = Math.round(duration * 0.18);
  const cooldownTime = Math.round(duration * 0.15);
  const mainTime = duration - warmupTime - cooldownTime;

  // Pick exercises for each phase
  const pickExercises = (pool, targetMinutes) => {
    const filtered = filterContra(pool);
    const sorted = filtered.sort((a, b) => scoreFocus(b) - scoreFocus(a));
    const picked = [];
    let totalTime = 0;
    for (const ex of sorted) {
      if (totalTime + ex.time > targetMinutes + 1) continue;
      picked.push({ ...ex });
      totalTime += ex.time;
      if (totalTime >= targetMinutes - 1) break;
    }
    return picked;
  };

  const warmup = pickExercises(library.warmup, warmupTime);
  const main = pickExercises(library.main, mainTime);
  const cooldown = pickExercises(library.cooldown, cooldownTime);

  // Adjust reps for level
  const adjustForLevel = (exercises) => exercises.map(ex => {
    if (level === 'beginner') {
      return { ...ex, reps: ex.reps.replace(/(\d+)/g, (m) => Math.max(4, Math.round(parseInt(m) * 0.7))), levelNote: 'Reduce range of motion if needed' };
    }
    if (level === 'advanced') {
      return { ...ex, reps: ex.reps.replace(/(\d+)/g, (m) => Math.round(parseInt(m) * 1.3)), levelNote: 'Add tempo or hold at end range' };
    }
    return ex;
  });

  // Build timeline with running clock
  let clock = 0;
  const timeline = [];

  const addPhase = (name, exercises) => {
    exercises.forEach(ex => {
      timeline.push({ ...ex, phase: name, startMin: clock });
      clock += ex.time;
    });
  };

  addPhase('Warm-Up', adjustForLevel(warmup));
  addPhase('Main', adjustForLevel(main));
  addPhase('Cool-Down', adjustForLevel(cooldown));

  const ct = CLASS_TYPES.find(c => c.id === classType);

  return {
    classType: ct?.name || classType,
    equipment: ct?.equipment || [],
    duration,
    level: LEVELS.find(l => l.id === level)?.name || level,
    focusAreas,
    contraindications: contras,
    timeline,
    totalExercises: timeline.length,
    generatedAt: new Date().toISOString(),
  };
}

export default function ClassSequencer() {
  const s = useStyles();
  const [view, setView] = useState('setup'); // setup | sequence
  const [classType, setClassType] = useState('reformer');
  const [duration, setDuration] = useState(55);
  const [level, setLevel] = useState('intermediate');
  const [focusAreas, setFocusAreas] = useState([]);
  const [contras, setContras] = useState([]);
  const [sequence, setSequence] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  // ── Voice-Guided Mode ──
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceCountdown, setVoiceCountdown] = useState(null);
  const timerRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const speak = useCallback((text, onEnd) => {
    if (!synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1.0;
    if (onEnd) utter.onend = onEnd;
    synthRef.current.speak(utter);
  }, []);

  const startVoice = useCallback(() => {
    if (!sequence) return;
    setVoiceActive(true);
    setVoicePaused(false);
    setVoiceIdx(0);
    setExpandedIdx(0);
    const ex = sequence.timeline[0];
    speak(`Starting ${ex.phase}. First exercise: ${ex.name}. ${ex.cue}`);
  }, [sequence, speak]);

  const stopVoice = useCallback(() => {
    setVoiceActive(false);
    setVoicePaused(false);
    setVoiceCountdown(null);
    if (timerRef.current) clearInterval(timerRef.current);
    synthRef.current?.cancel();
  }, []);

  const advanceVoice = useCallback((idx) => {
    if (!sequence) return;
    const next = idx + 1;
    if (next >= sequence.timeline.length) {
      speak('Class complete. Great work!');
      stopVoice();
      return;
    }
    setVoiceIdx(next);
    setExpandedIdx(next);
    const ex = sequence.timeline[next];
    const isNewPhase = sequence.timeline[idx].phase !== ex.phase;
    const prefix = isNewPhase ? `Moving to ${ex.phase}. ` : '';
    speak(`${prefix}Next: ${ex.name}. ${ex.springs !== '-' ? `Springs: ${ex.springs}. ` : ''}${ex.reps} reps. ${ex.cue}`);
  }, [sequence, speak, stopVoice]);

  const nextExercise = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVoiceCountdown(null);
    advanceVoice(voiceIdx);
  }, [voiceIdx, advanceVoice]);

  const startTimer = useCallback(() => {
    if (!sequence) return;
    const ex = sequence.timeline[voiceIdx];
    const secs = ex.time * 60;
    setVoiceCountdown(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setVoiceCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          speak('Time. Moving on.', () => advanceVoice(voiceIdx));
          return null;
        }
        if (prev === 11) speak('10 seconds remaining');
        return prev - 1;
      });
    }, 1000);
  }, [sequence, voiceIdx, speak, advanceVoice]);

  const togglePause = useCallback(() => {
    if (voicePaused) {
      setVoicePaused(false);
      synthRef.current?.resume();
    } else {
      setVoicePaused(true);
      synthRef.current?.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [voicePaused]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); synthRef.current?.cancel(); };
  }, []);

  const toggleFocus = useCallback((f) => {
    setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  const toggleContra = useCallback((c) => {
    setContras(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }, []);

  const handleGenerate = useCallback(() => {
    const seq = generateSequence(classType, duration, level, focusAreas, contras);
    setSequence(seq);
    setView('sequence');
    setExpandedIdx(null);
  }, [classType, duration, level, focusAreas, contras]);

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16,
    boxShadow: s.shadow, padding: 24,
  };

  const phaseColors = {
    'Warm-Up': { bg: '#FEF3C7', color: '#D97706', icon: '🌅' },
    'Main': { bg: '#DBEAFE', color: '#2563EB', icon: '💪' },
    'Cool-Down': { bg: '#DCFCE7', color: '#16A34A', icon: '🌿' },
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: `400 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>
          Intelligence
        </div>
        <h1 style={{ font: `600 28px ${s.DISPLAY}`, color: s.text, margin: 0, lineHeight: 1.2 }}>
          Class Sequencer
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Generate timed exercise flows with teaching cues — warm-up, main work, cool-down
        </p>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setView('setup')} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: view === 'setup' ? s.accent : 'rgba(0,0,0,0.04)',
          color: view === 'setup' ? '#fff' : s.text2,
          font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
        }}>Setup</button>
        <button onClick={() => sequence && setView('sequence')} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: view === 'sequence' ? s.accent : 'rgba(0,0,0,0.04)',
          color: view === 'sequence' ? '#fff' : s.text2,
          font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
          opacity: sequence ? 1 : 0.4,
        }}>Sequence {sequence ? `(${sequence.totalExercises})` : ''}</button>
      </div>

      {/* Setup View */}
      {view === 'setup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left — Class type + Duration + Level */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Class Type */}
            <div>
              <label style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Class Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {CLASS_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setClassType(ct.id)} style={{
                    padding: '12px 14px', borderRadius: 10, border: classType === ct.id ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                    background: classType === ct.id ? (s.accentLight || 'rgba(196,112,75,0.1)') : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{ct.icon} {ct.name}</div>
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, marginTop: 2 }}>{ct.equipment.join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Duration: {duration} min
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[30, 45, 55, 60, 75].map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    border: duration === d ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                    background: duration === d ? (s.accentLight || 'rgba(196,112,75,0.1)') : 'transparent',
                    font: `500 13px ${s.FONT}`, color: duration === d ? s.accent : s.text2, cursor: 'pointer',
                  }}>{d}</button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Level
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    border: level === l.id ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                    background: level === l.id ? (s.accentLight || 'rgba(196,112,75,0.1)') : 'transparent',
                    font: `500 12px ${s.FONT}`, color: level === l.id ? s.accent : s.text2, cursor: 'pointer',
                  }}>{l.name}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Focus + Contraindications + Generate */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Focus Areas */}
            <div>
              <label style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Focus Areas (optional)
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FOCUS_AREAS.map(f => (
                  <button key={f} onClick={() => toggleFocus(f)} style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: focusAreas.includes(f) ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.06)',
                    background: focusAreas.includes(f) ? (s.accentLight || 'rgba(196,112,75,0.1)') : 'transparent',
                    font: `400 12px ${s.FONT}`, color: focusAreas.includes(f) ? s.accent : s.text2, cursor: 'pointer',
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Contraindications */}
            <div>
              <label style={{ font: `600 12px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Contraindications
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CONTRAINDICATIONS.map(c => (
                  <button key={c} onClick={() => toggleContra(c)} style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: contras.includes(c) ? '2px solid #DC2626' : '1px solid rgba(0,0,0,0.06)',
                    background: contras.includes(c) ? '#FEE2E2' : 'transparent',
                    font: `400 12px ${s.FONT}`, color: contras.includes(c) ? '#DC2626' : s.text2, cursor: 'pointer',
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Summary + Generate */}
            <div style={{ marginTop: 'auto', padding: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginBottom: 12, lineHeight: 1.6 }}>
                <strong>{CLASS_TYPES.find(c => c.id === classType)?.name}</strong> · {duration} min · {LEVELS.find(l => l.id === level)?.name}
                {focusAreas.length > 0 && <><br />Focus: {focusAreas.join(', ')}</>}
                {contras.length > 0 && <><br /><span style={{ color: '#DC2626' }}>Avoid: {contras.join(', ')}</span></>}
              </div>
              <button onClick={handleGenerate} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: s.accent, color: '#fff', font: `600 14px ${s.FONT}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Generate Sequence
              </button>
            </div>
          </div>

          <style>{`
            @media (max-width: 768px) {
              div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      )}

      {/* Sequence View */}
      {view === 'sequence' && sequence && (
        <div>
          {/* Sequence header */}
          <div style={{ ...cardStyle, marginBottom: 20, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>{sequence.classType}</div>
              <div style={{ font: `400 12px ${s.MONO}`, color: s.text3, marginTop: 4 }}>
                {sequence.duration} min · {sequence.level} · {sequence.totalExercises} exercises
              </div>
              {sequence.equipment.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {sequence.equipment.map(eq => (
                    <span key={eq} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.04)', font: `400 11px ${s.MONO}`, color: s.text2 }}>{eq}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setView('setup')} style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.6)', font: `400 12px ${s.FONT}`, color: s.text2, cursor: 'pointer',
              }}>Edit Setup</button>
              <button onClick={handleGenerate} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: s.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
              }}>Regenerate</button>
            </div>
          </div>

          {/* Voice Control Bar */}
          <div style={{
            ...cardStyle, marginBottom: 20, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            background: voiceActive ? 'rgba(22,163,74,0.06)' : cardStyle.background,
            border: voiceActive ? '1px solid rgba(22,163,74,0.3)' : cardStyle.border,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={voiceActive ? '#16A34A' : s.text3} strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span style={{ font: `500 13px ${s.FONT}`, color: voiceActive ? '#16A34A' : s.text, flex: 1 }}>
              {voiceActive
                ? voicePaused ? 'Paused' : `Exercise ${voiceIdx + 1} of ${sequence.timeline.length}`
                : 'Voice-Guided Mode'}
            </span>
            {voiceActive && voiceCountdown != null && (
              <span style={{ font: `700 16px ${s.MONO}`, color: voiceCountdown <= 10 ? '#DC2626' : '#16A34A' }}>
                {Math.floor(voiceCountdown / 60)}:{String(voiceCountdown % 60).padStart(2, '0')}
              </span>
            )}
            {!voiceActive ? (
              <button onClick={startVoice} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: '#16A34A', color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
              }}>Start Voice Guide</button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={togglePause} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.8)', font: `500 12px ${s.FONT}`, color: s.text, cursor: 'pointer',
                }}>{voicePaused ? 'Resume' : 'Pause'}</button>
                {voiceCountdown == null && !voicePaused && (
                  <button onClick={startTimer} style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none',
                    background: '#2563EB', color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
                  }}>Start Timer</button>
                )}
                <button onClick={nextExercise} style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: s.accent, color: '#fff', font: `500 12px ${s.FONT}`, cursor: 'pointer',
                }}>Next</button>
                <button onClick={stopVoice} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #DC2626',
                  background: 'transparent', font: `500 12px ${s.FONT}`, color: '#DC2626', cursor: 'pointer',
                }}>Stop</button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sequence.timeline.map((ex, i) => {
              const phase = phaseColors[ex.phase] || phaseColors['Main'];
              const isExpanded = expandedIdx === i;
              const isNewPhase = i === 0 || sequence.timeline[i - 1].phase !== ex.phase;

              return (
                <div key={i}>
                  {/* Phase divider */}
                  {isNewPhase && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 8px',
                    }}>
                      <span style={{ fontSize: 18 }}>{phase.icon}</span>
                      <span style={{ font: `600 13px ${s.MONO}`, color: phase.color, textTransform: 'uppercase', letterSpacing: 1 }}>{ex.phase}</span>
                      <div style={{ flex: 1, height: 1, background: phase.bg }} />
                    </div>
                  )}

                  {/* Exercise card */}
                  <div style={{
                    ...cardStyle, padding: 0, overflow: 'hidden',
                    borderLeft: `3px solid ${phase.color}`, cursor: 'pointer',
                    transition: 'all 0.2s',
                    ...(voiceActive && voiceIdx === i ? { boxShadow: `0 0 0 2px ${phase.color}, ${s.shadow}`, background: phase.bg } : {}),
                  }} onClick={() => { setExpandedIdx(isExpanded ? null : i); if (voiceActive) { setVoiceIdx(i); speak(`${sequence.timeline[i].name}. ${sequence.timeline[i].cue}`); } }}>
                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Time marker */}
                      <div style={{
                        width: 44, textAlign: 'center', flexShrink: 0,
                      }}>
                        <div style={{ font: `600 14px ${s.MONO}`, color: phase.color }}>{ex.startMin}'</div>
                        <div style={{ font: `400 9px ${s.MONO}`, color: s.text3 }}>{ex.time}min</div>
                      </div>

                      {/* Exercise info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{ex.name}</div>
                        <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                          {ex.springs !== '-' && <span style={{ marginRight: 8 }}>Springs: {ex.springs}</span>}
                          Reps: {ex.reps}
                        </div>
                      </div>

                      {/* Focus tags */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {ex.focus.slice(0, 2).map(f => (
                          <span key={f} style={{
                            padding: '2px 8px', borderRadius: 4,
                            background: focusAreas.includes(f) ? (s.accentLight || 'rgba(196,112,75,0.1)') : 'rgba(0,0,0,0.03)',
                            font: `400 10px ${s.MONO}`, color: focusAreas.includes(f) ? s.accent : s.text3,
                          }}>{f}</span>
                        ))}
                      </div>

                      {/* Expand */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Expanded: teaching cue */}
                    {isExpanded && (
                      <div style={{ padding: '0 18px 16px 76px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{
                          margin: '12px 0 0', padding: 14, background: phase.bg, borderRadius: 10,
                          font: `400 13px ${s.FONT}`, color: phase.color, lineHeight: 1.6,
                        }}>
                          <strong style={{ font: `600 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 0.5 }}>Teaching Cue</strong>
                          <br />{ex.cue}
                        </div>
                        {ex.levelNote && (
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 8, fontStyle: 'italic' }}>
                            Level note: {ex.levelNote}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {ex.focus.map(f => (
                            <span key={f} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.03)', font: `400 10px ${s.MONO}`, color: s.text3 }}>{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div style={{ ...cardStyle, marginTop: 20, padding: 18, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Warm-Up', 'Main', 'Cool-Down'].map(phase => {
              const exercises = sequence.timeline.filter(e => e.phase === phase);
              const totalMin = exercises.reduce((s, e) => s + e.time, 0);
              const pc = phaseColors[phase];
              return (
                <div key={phase} style={{ textAlign: 'center' }}>
                  <div style={{ font: `700 18px ${s.FONT}`, color: pc.color }}>{totalMin}'</div>
                  <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{phase} ({exercises.length})</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
