/* Team data: match-day goals and weekly practice plans. Edit this file each week. */

const POS_ROLE = { ST:'striker', LW:'wings', RW:'wings', CAM:'cam', CM:'cam', LM:'wide-mids', RM:'wide-mids', CDM:'cdm', LB:'backs', CB:'backs', RB:'backs', GK:'gk' };
/* Match 3 goals. For a new match, copy this list, change the goals, and add it to the top of MATCHES below. */
const MATCH_3 = [
  { group:'Attack', players:[
    { no:'17', name:'Lia', pos:['ST','LW'], goal:'Stay high, time your runs', today:'Stay level with the last defender all game. Make 3 delayed runs and take 1 weak-foot shot.' , show: [['striker','Stay high'], ['striker','Delayed run','Delayed run',{ view:'half' }]] },
    { no:'33', name:'Cruz', pos:['LW','ST'], goal:'Take her on', today:'Go at your defender 3+ times. When the ball is on the right, crash the back post.' , show: [['wings','Win the 1v1'], ['wings','Back post']] },
    { no:'', name:'Avery', pos:['RW','RM','LW'], goal:'Face their goal', today:'Every time you get the ball, turn toward their goal. Stuck? Big kick up the line.' , show: ['face-goal'] },
    { no:'', name:'Joanna', pos:['RW','LW'], goal:'Get involved', today:'Know your spot, move toward the ball, and ask for it. Aim for 5+ touches.' , show: ['get-involved', ['wings','Your spot','Your spot']] }
  ]},
  { group:'Midfield', players:[
    { no:'24', name:'Kenya', pos:['CAM','CM'], goal:'Find the pocket, feed Lia', today:'Get between their mids and defenders, turn, and slip 2 through balls to Lia.' , show: [['cam','Find the pocket'], ['cam','Feed the striker']] },
    { no:'', name:'Sofia', pos:['CAM','ST'], goal:'Shoot or slip it', today:'Peek up while you dribble. Get 2 shots or through balls.' , show: [['cam','Turn, look up'], ['cam','Shoot or slip it']] },
    { no:'45', name:'Aadhya', pos:['LM','RM','ST'], goal:'Dribble, then release', today:'Draw a defender, then release 2 through balls before the runner is offside.' , show: [['wide-mids','Dribble, release']] },
    { no:'6', name:'Natalie', pos:['LM','LW'], goal:'One in, one out', today:'When the wing cuts in, go wide. Take on a defender 2+ times.' , show: [['wide-mids','Share the side'], ['wings','Win the 1v1']] },
    { no:'26', name:'Sydney', pos:['RM','LM'], goal:'Win it, find a pass', today:'After you win it, shield it, look up, and find a teammate 3+ times.' , show: [['wide-mids','Win it, pass it']] },
    { no:'', name:'Jensyne', pos:['RM','RW'], goal:'Cross it in', today:'Get to the end line and cross it in 2+ times. Sprint home on counters.' , show: [['wide-mids','Cross it in'], ['wide-mids','Track back']] },
    { no:'', name:'Frida', pos:['CDM','CB'], goal:'Stay central', today:'Never touch the sideline paint. Switch play to the open side 2+ times.' , show: [['cdm','Slide, don\u2019t drift'], ['cdm','Win it, move it']] },
    { no:'2', name:'Josie', pos:['CDM','CM'], goal:'Keep it simple', today:'Two touches max. Step in on big touches and win 3 balls in the middle.' , show: [['cdm','Step in'], ['cdm','Win it, move it']] }
  ]},
  { group:'Defense', players:[
    { no:'5', name:'Dahlia', pos:['LB','CB','RB'], goal:'Be loud', today:'Call “Man on,” “Time,” or “Mine” every play. Stay goal-side and don’t dive in.' , show: [['backs','Be loud'], ['backs','Stay goal-side']] },
    { no:'', name:'Ximena', pos:['LB','CDM'], goal:'Space or safe', today:'No dribbling in our half. Space? Pass it. Pressure? Clear it up the sideline.' , show: [['backs','Space or safe']] }
  ]},
  { group:'Goalkeeper', players:[
    { no:'', name:'Raven', pos:['GK','RB'], goal:'Low and ready', today:'Get into your low ready stance before every shot. After a save, throw or roll it wide.' , show: [['gk','Low saves'], ['gk','Distribute wide']] }
  ]}
];


/* Match 4 goals: built for the top team in our group. */
const MATCH_4 = [
  { group:'Attack', players:[
    { no:'17', name:'Lia', pos:['ST','LW'], goal:'Finish in the box', today:'Always run forward onto the ball, never backward. Get in the box, take one touch to set it, then shoot.',
      practice: ['Finishing in the box', 'Delayed runs'],
      show: [['striker','Control to shot'], ['striker','Don\u2019t drop deep'], ['striker','Delayed run','Delayed run',{ view:'half' }]] },
    { no:'33', name:'Cruz', pos:['LW','ST'], goal:'Stay wide, run onto it', today:'Stay wide by the sideline so their defense stretches. When the CAM looks up, sprint in behind onto the ball toward the corner flag.',
      practice: ['Wings: show square, then go', 'Through balls that break the line'],
      show: ['through-options:0', ['wings','Stay wide'], ['wings','Back post']] },
    { no:'', name:'Avery', pos:['RW','RM','LW'], goal:'Stay wide, run onto it', today:'Stay wide by the sideline. When we pass it forward, run onto it toward their corner flag. Ball out on our side? Sprint to it and throw it in.',
      practice: ['Through balls that break the line', 'Quick restarts'],
      show: ['through-options:0', ['wings','Stay wide'], 'restarts:0'] },
    { no:'', name:'Joanna', pos:['RW','LW'], goal:'Stay wide, then go', today:'Stay wide by the sideline. When the ball comes forward, run onto it. Call for it and aim for 5+ touches.',
      practice: ['Wings: show square, then go', 'Through balls that break the line'],
      show: ['through-options:0', ['wings','Stay wide'], 'get-involved'] }
  ]},
  { group:'Midfield', players:[
    { no:'24', name:'Kenya', pos:['CAM','CM'], goal:'Corner or over the top', today:'Look up first. Slide it down the line toward the corner flag for the wings. If the middle is open, play it over the top to Lia in space.',
      practice: ['Through balls that break the line'],
      show: ['through-options', ['cam','Find the pocket']] },
    { no:'', name:'Sofia', pos:['CAM','ST'], goal:'Corner or over the top', today:'Look up first. Play it toward the corner flags for the wings, or over the top to Lia when the middle is open. Then arrive late to shoot.',
      practice: ['Through balls that break the line', 'Finishing in the box'],
      show: ['through-options', ['cam','Arrive late']] },
    { no:'45', name:'Aadhya', pos:['LM','RM','ST'], goal:'Come home, then go', today:'When we lose it, sprint home on the inside. When we win it, dribble and release the through ball.',
      practice: ['Recover when we get beat', 'Through balls that break the line'],
      show: [['wide-mids','Track back'], ['wide-mids','Dribble, release']] },
    { no:'6', name:'Natalie', pos:['LM','LW'], goal:'Track back inside', today:'Every time we lose it, sprint back on the inside of your attacker. Get goal-side before you tackle.',
      practice: ['Recover when we get beat'],
      show: [['wide-mids','Track back'], ['wide-mids','Share the side']] },
    { no:'26', name:'Sydney', pos:['RM','LM'], goal:'Win it, slip it through', today:'Shield it, look up, and slide a through ball to the wing or Lia. On corners, be the first short option.',
      practice: ['Through balls that break the line', 'Corner kicks'],
      show: [['wide-mids','Win it, pass it'], ['corner1-right','RM · Short 1','Corner: short option']] },
    { no:'', name:'Jensyne', pos:['RM','RW'], goal:'Cross it in', today:'Get to the end line and cross it in 2+ times for our finishers. Sprint home inside every time we lose it.',
      practice: ['Recover when we get beat', 'Finishing in the box'],
      show: [['wide-mids','Cross it in'], ['wide-mids','Track back']] },
    { no:'', name:'Frida', pos:['CDM','CB'], goal:'Guard the middle', today:'Stay central in front of the backs. Step in when their player takes a big touch.',
      practice: ['Step in on the dribbler'],
      show: [['cdm','Slide, don’t drift'], ['cdm','Step in']] },
    { no:'2', name:'Josie', pos:['CDM','CM'], goal:'Win second balls', today:'On corners and clearances, step up between the circle and the box and win the loose ball. Two touches max.',
      practice: ['Corner kicks'],
      show: [['corner1-right','CDM · Support','Corner: support'], ['cdm','Win it, move it']] }
  ]},
  { group:'Defense', players:[
    { no:'5', name:'Dahlia', pos:['LB','CB','RB'], goal:'Force it wide', today:'Close the middle and show your attacker the sideline. Call “Man on,” “Time,” and “Mine” every play.',
      practice: ['Force them wide'],
      show: [['backs','Force it wide'], ['backs','Be loud']] },
    { no:'', name:'Ximena', pos:['LB','CDM'], goal:'Step in, then play it', today:'Stay goal-side and patient. When your attacker takes a big touch, step in and win it. Then space? Pass it. Pressure? Clear it.',
      practice: ['Step in on the dribbler', 'Force them wide'],
      show: [['backs','Stay goal-side'], ['cdm','Step in'], ['backs','Space or safe']] }
  ]},
  { group:'Goalkeeper', players:[
    { no:'', name:'Raven', pos:['GK','RB'], goal:'Fast goal kicks', today:'Ball out over our end line? Grab it, set it on the six fast, and find LM or RM before they set up. Low ready stance on every shot.',
      practice: ['Quick restarts'],
      show: ['restarts:1', ['gk','Distribute wide'], ['gk','Low saves']] }
  ]}
];

/* Newest match first: the Match day tab and the home page open on it. */
const MATCHES = [
  { match: 4, label: 'Match 4', week: 4, teamGoal: 'Stay compact. Strike in behind.',
    when: 'Sat, Oct 17 · 1:00 PM', where: 'Riverwalk #2', home: true,
    opponent: { name: 'NASA Fire Breathing Rubber Duckies', standing: '1st in Bracket A', record: '4 W · 1 L · 0 D · 8 goals for, 5 against' },
    plan: [
      { title: 'Stay compact', body: 'They’re top of our group with 8 goals in 5 games, so don’t give them space. When we lose it, wide mids sprint home on the inside and we defend with five across the back.',
        cue: 'Wide mids come home.', show: ['formation:2', ['wide-mids','Track back','Track back inside']] },
      { title: 'Force them wide', body: 'Don’t let them dribble through the middle. Wing backs show them the sideline, CDM guards the middle, and CB stays home as the last line.',
        cue: 'Push it wide.', show: [['backs','Force it wide'], ['backs','Recovery spot','CB recovers'], ['cdm','Step in']] },
      { title: 'Get in behind them', body: 'They’ve given up 5 goals in 5 games, so their back line can be beaten. Wings stay wide to stretch them. CAMs play it down the line toward the corner flags, or over the top to Lia when the middle is open.',
        cue: 'Into space, not to feet.', show: ['through-options', ['striker','Delayed run'], ['wings','Show, then go']] },
      { title: 'Win the restarts', body: 'Set pieces are our best chance against a good team. Listen for “1!” or “2!” on corners, and get every throw-in and goal kick back in play fast.',
        cue: 'Listen for 1 or 2.', show: [['corner1-right','Full play','Corner 1'], ['corner2-right','Full play','Corner 2'], 'restarts:0'] },
      { title: 'Play our game', body: 'Coaches stay quiet during play. Talk to each other, trust your job, and we’ll make changes at subs.',
        cue: 'Talk to each other.' }
    ],
    groups: MATCH_4 },
  { match: 3, label: 'Match 3', teamGoal: 'Wings stay wide, wide mids come home.', groups: MATCH_3 }
];

/* ---------- practice plans ---------- */
const PRACTICE = [
  { week: 4, label: 'Week 4',
    headline: 'Set pieces, quick restarts, and our formation.',
    note: { label: 'New this week', title: 'Coaches step back. You run the game.',
            body: 'Coaches won\u2019t be calling out where to go during play. If we need to change something, we\u2019ll do it at a substitution when you come off. You know your jobs, so trust yourself and talk to each other on the field.' },
    tag: 'Corners, quick restarts and the whole-team shape, plus through balls, delayed runs, finishing, and defending together.',
    groups: [
      { name: 'Whole team', items: [
        { title: 'Corner kicks', body: 'Two plays from the same setup. The taker calls out “1!” or “2!” to set the play, and everyone knows their job.', cue: 'Listen for 1 or 2.',
          show: [['corner1-right','Full play','Corner 1'], ['corner2-right','Full play','Corner 2']] },
        { title: 'Quick restarts', body: 'Ball out on the sideline? Know it\u2019s our throw, sprint, grab it, and throw it in. Ball out over the end line? Know if it\u2019s a goal kick or a corner, get the ball, and set up. No waiting for a coach.', cue: 'Know it, run, get it, go.',
          show: ['restarts'] },
        { title: 'Our formation', body: 'Everyone knows their spot in the 3-4-3 diamond. When we attack, wings stay wide. When we defend, wide mids come home.', cue: 'Wings stay wide, wide mids come home.',
          show: ['formation'] }
      ]},
      { name: 'Offense', items: [
        { title: 'Through balls that break the line', body: 'Slide the pass into the space behind their defenders for our striker and wings to run onto. Pass to where they’re going, not to their feet.', cue: 'Into space, not to feet.',
          show: [['cam','Feed the striker','CAM feeds the striker'], ['wide-mids','Dribble, release','Wide mid releases it']] },
        { title: 'Delayed runs', body: 'The striker waits for the passer’s head to go down, then goes. Curve the run along the line or flash across it to stay onside.', cue: 'Head goes down = GO.',
          show: [['striker','Delayed run','Delayed run'], ['striker','The flash','The flash']] },
        { title: 'Wings: show square, then go', body: 'Wings check toward the ball to show for a pass, then spin and sprint onto the through ball in behind.', cue: 'Show, then spin.',
          show: [['wings','Show, then go','Show, then go']] },
        { title: 'Finishing in the box', body: 'One touch to set it, one touch to shoot. Shoot early and use either foot, because an extra touch lets defenders close you down.', cue: 'Touch, shot.',
          show: [['striker','Control to shot','Control to shot'], ['cam','Arrive late','Arrive late']] }
      ]},
      { name: 'Defense', items: [
        { title: 'Force them wide', body: 'Curve your run so the ball carrier can’t go through the middle. The sideline is our extra defender.', cue: 'Push it wide.',
          show: [['striker','Defend first','Press from the front'], ['backs','Force it wide','Wing backs force it wide']] },
        { title: 'Step in on the dribbler', body: 'When someone dribbles at you, stay goal-side and patient. When she takes a big touch, step in and win it.', cue: 'Big touch? Step in.',
          show: [['cdm','Step in','Step in'], ['backs','Stay goal-side','Stay goal-side']] },
        { title: 'Recover when we get beat', body: 'Got beat? Don’t stop. Sprint back toward our goal and get goal-side again. A teammate covers until you’re back.', cue: 'Beat? Sprint home.',
          show: [['wide-mids','Track back','Track back'], ['backs','Recovery spot','CB recovers']] }
      ]}
    ] }
];
