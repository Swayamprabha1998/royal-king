// ═══════════════════════════════════════════════════════════════
//  GLIMMERTIDE — "The Sleeping Queen"
//  Story Data Layer · 30 levels · 6 chapters
//  Step 1 of the Narrative System — data only, no UI
// ═══════════════════════════════════════════════════════════════

export type AmbientTheme = 'warm' | 'rose' | 'cold' | 'dark' | 'battle' | 'ethereal';

export interface LevelStory {
  levelNumber: number;
  title: string;
  storyParagraph: string;
  openingVerse: [string, string, string, string];
  dreamWhisper: string;        // Queen's in-game toast at half-moves
  closureVerse: [string, string, string, string];
  closureSentence: string;     // One prose line shown after closure verse
}

export interface ChapterData {
  chapterNumber: number;
  title: string;
  subtitle: string;            // Location / memory type
  chapterVerse: [string, string, string, string];
  description: string;
  ambientTheme: AmbientTheme;
  levels: LevelStory[];
}

// ─────────────────────────────────────────────────────────────
//  HELPER: look up story by level number
// ─────────────────────────────────────────────────────────────
export const getLevelStory = (levelNumber: number): LevelStory | undefined => {
  for (const chapter of CHAPTERS) {
    const found = chapter.levels.find(l => l.levelNumber === levelNumber);
    if (found) return found;
  }
  return undefined;
};

export const getChapterForLevel = (levelNumber: number): ChapterData | undefined =>
  CHAPTERS.find(ch => ch.levels.some(l => l.levelNumber === levelNumber));

export const isFirstLevelOfChapter = (levelNumber: number): boolean =>
  CHAPTERS.some(ch => ch.levels[0]?.levelNumber === levelNumber);

export const isLastLevelOfChapter = (levelNumber: number): boolean =>
  CHAPTERS.some(ch => ch.levels[ch.levels.length - 1]?.levelNumber === levelNumber);


// ═══════════════════════════════════════════════════════════════
//  CHAPTER DATA
// ═══════════════════════════════════════════════════════════════

export const CHAPTERS: ChapterData[] = [

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 1 — THE WAKING WORLD  (levels 1–5)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 1,
    title: 'The Waking World',
    subtitle: 'The Flooded Castle',
    chapterVerse: [
      'She sleeps while the castle fills,',
      'each breath she takes, the water spills.',
      'He found the mirror in the deep —',
      'a door into her endless sleep.'
    ],
    description: 'The King discovers his castle is flooding because the Queen sleeps under a sorcerer\'s curse. He finds an ancient mirror and steps into her dream.',
    ambientTheme: 'warm',
    levels: [
      {
        levelNumber: 1,
        title: 'The King\'s Discovery',
        storyParagraph:
          'The castle cellars flood faster each hour. In the deepest chamber, half-submerged, the King finds an ancient mirror engraved with the Queen\'s likeness. A sorcerer\'s note tied to its frame reads: "Enter, or lose her forever."',
        openingVerse: [
          'The water climbs the cold stone walls,',
          'her name still carved above the halls.',
          'The mirror waits — a doorway through —',
          'I\'ll drain this flood and find you.'
        ],
        dreamWhisper: 'Is someone there? The dark is warm here...',
        closureVerse: [
          'One seal turns. A trickle slows.',
          'Somewhere in her dream, she knows.',
          'I felt it too — a breath, a stir.',
          'Keep going. I am here for her.'
        ],
        closureSentence: 'The first valve turns. The water drops an inch. Somewhere in the dream, she sighs.'
      },
      {
        levelNumber: 2,
        title: 'The First Step',
        storyParagraph:
          'The mirror shimmers and pulls him in. He stands in a grey ante-chamber — the outermost layer of her dream. The algae here is thin and new, as if the corruption has only just begun to reach her.',
        openingVerse: [
          'Grey halls, half-known, half-dreamed —',
          'nothing here is what it seemed.',
          'But I know these floors, these walls.',
          'I\'ve walked them in her words before.'
        ],
        dreamWhisper: 'Don\'t let the green things grow...',
        closureVerse: [
          'The grey lifts. Warmth returns ahead.',
          'Her dreaming leads me where I\'m led.',
          'Two steps in. I\'m finding her.',
          'Each drain I clear, her waters stir.'
        ],
        closureSentence: 'The grey haze lifts. The dream grows warmer, deeper.'
      },
      {
        levelNumber: 3,
        title: 'What the Cellars Remember',
        storyParagraph:
          'The castle\'s flooded cellars appear in the dream — but golden-lit, warm as they were on the morning of their wedding. Algae creeps along the walls, threatening to grey it all out.',
        openingVerse: [
          'I remember this ceiling, this stone,',
          'the day we made this castle home.',
          'Don\'t let the green erase it all —',
          'I\'ll hold this memory like a wall.'
        ],
        dreamWhisper: 'The gold... hold the gold, please.',
        closureVerse: [
          'The memory holds. The gold remains.',
          'I push the flood back through its drains.',
          'She murmured something soft and low —',
          'she felt me here. She knows I go.'
        ],
        closureSentence: 'The cellar glows golden again. She stirs softly in her sleep.'
      },
      {
        levelNumber: 4,
        title: 'The Guard\'s Old Post',
        storyParagraph:
          'A flooded guard post — two toy soldiers still standing at their stations, frozen mid-salute in a dream-loop. If the King does not drain the water, they will sink and this memory will shatter forever.',
        openingVerse: [
          'Old friends, still standing at the gate,',
          'your loyalty outlasts all fate.',
          'I\'ll hold the flood back from your post —',
          'you deserve more than to be lost.'
        ],
        dreamWhisper: 'They stood there every morning... don\'t let them go under.',
        closureVerse: [
          'They stand. The water falls away.',
          'Another fragment saved today.',
          'How many pieces hold her whole?',
          'Each one I keep protects her soul.'
        ],
        closureSentence: 'The toy soldiers hold their salute as the waters clear.'
      },
      {
        levelNumber: 5,
        title: 'The Mirror Gate',
        storyParagraph:
          'The first dream seal glows at the far end of the corridor — a locked door made of frozen light. The King must clear the final flooded chamber to reach it. Breaking this seal opens the passage to the Queen\'s deeper memories.',
        openingVerse: [
          'The first seal burns with cold gold light.',
          'One lock undone before tonight.',
          'Five more stand between us still —',
          'but love has always found its will.'
        ],
        dreamWhisper: 'Something loosened... I can feel it at the very edges.',
        closureVerse: [
          'The seal is broken. Something shifts.',
          'Her breathing steadies, and she lifts',
          'one hand toward where I stand unseen.',
          'I am coming. I will find my queen.'
        ],
        closureSentence: 'The first dream seal shatters. Deeper chambers open before him.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 2 — THE ROSE GARDEN  (levels 6–10)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 2,
    title: 'The Rose Garden',
    subtitle: 'Dream of Their Wedding',
    chapterVerse: [
      'Here she was happiest — roses and sun,',
      'the vows they exchanged before day was done.',
      'Now algae corrupts every petal and vine —',
      'I\'ll tend every bloom that was once hers and mine.'
    ],
    description: 'The King enters the Queen\'s happiest memory: the day of their wedding. The sorcerer\'s corruption seeps in as spreading algae, threatening to erase the warmth entirely.',
    ambientTheme: 'rose',
    levels: [
      {
        levelNumber: 6,
        title: 'The Garden Gate',
        storyParagraph:
          'He steps through the first seal and finds himself in sunlight. The rose garden from their wedding day stretches before him — impossibly vivid. But at the edges, where the memory blurs, dark green algae creeps slowly inward.',
        openingVerse: [
          'I remember this garden, these blooms,',
          'the scent she wore walking through rooms.',
          'The green things eat at the edges still —',
          'I\'ll cut them back. I always will.'
        ],
        dreamWhisper: 'The roses smell just like I remember...',
        closureVerse: [
          'The edges hold. The blooms stay red.',
          'I trace the path she always led.',
          'The algae pulls back, slow and thin.',
          'Let the dream breathe. Let the light in.'
        ],
        closureSentence: 'The garden gate swings open. The memory brightens around him.'
      },
      {
        levelNumber: 7,
        title: 'The Ceremony Aisle',
        storyParagraph:
          'The aisle where they walked is flooded ankle-deep. Rose petals drift on the surface. Algae grows thick between the flower-lined walkways, trying to consume the colour and warmth of her memory.',
        openingVerse: [
          'Each step I took beside you here',
          'I\'d walk again without a fear.',
          'The algae grows between our roses —',
          'I\'ll clear each path before it closes.'
        ],
        dreamWhisper: 'Walk slowly here... I want to remember every step.',
        closureVerse: [
          'The aisle is clear. The petals float.',
          'I hear the echo of a note —',
          'the wedding song, faint on the breeze.',
          'She\'s smiling somewhere in her ease.'
        ],
        closureSentence: 'The petals drift freely. A faint melody drifts through the dream.'
      },
      {
        levelNumber: 8,
        title: 'The Vow Stone',
        storyParagraph:
          'The flat stone where they exchanged their vows is half-buried in algae. The words they carved into it — their promises — are fading under the green. The King must clear it before the words disappear entirely.',
        openingVerse: [
          '"Always" — you carved it into stone.',
          'I\'ll not let that word die alone.',
          'The green grows thick across our vow —',
          'I carved it then. I\'ll hold it now.'
        ],
        dreamWhisper: 'Can you still read the words we wrote...?',
        closureVerse: [
          'The stone is clear. The words remain.',
          '"Always" — carved against the rain.',
          'I press my palm against the ground.',
          'She murmurs. Still she makes a sound.'
        ],
        closureSentence: 'The carved vows gleam clean in the dream-light. The Queen\'s lips move silently.'
      },
      {
        levelNumber: 9,
        title: 'The First Dance Gazebo',
        storyParagraph:
          'Their first dance was here — under this ivy-wrapped gazebo, music playing until the stars came out. Now the gazebo floods and the vines go dark, twisting into something wrong. The King moves quickly.',
        openingVerse: [
          'We danced here until the stars woke.',
          'I led, you followed, and we spoke',
          'of futures bright and futures near —',
          'I\'ll keep this dance alive right here.'
        ],
        dreamWhisper: 'I can almost hear the music... just a little more.',
        closureVerse: [
          'The vines go green again. The light',
          'returns beneath the gazebo\'s height.',
          'She\'s dancing somewhere in that sleep —',
          'these memories are hers to keep.'
        ],
        closureSentence: 'The gazebo glows warm. A ghost of music carries through the dream.'
      },
      {
        levelNumber: 10,
        title: 'The Wedding Seal',
        storyParagraph:
          'At the heart of the garden, where the fountain once played, the second dream seal pulses with rose-gold light. The algae is thickest here, defending the sorcerer\'s lock. The King drives it back one last time.',
        openingVerse: [
          'The second seal beats like a heart',
          'wrapped in thorns and kept apart.',
          'I\'ll break it open, petal by petal —',
          'love will outlast any metal.'
        ],
        dreamWhisper: 'Something pulling... the lock loosening... hurry, please hurry.',
        closureVerse: [
          'Rose-gold shatters across the air.',
          'The algae flees. The fountain stirs.',
          'She gasps — just once — and then goes still.',
          'Two seals gone. Three remain until.'
        ],
        closureSentence: 'The wedding memory holds. The second seal breaks. She breathes deeper.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 3 — THE HONEYMOON SHIP  (levels 11–15)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 3,
    title: 'The Honeymoon Ship',
    subtitle: 'Dream of the Sea Voyage',
    chapterVerse: [
      'The ship they sailed is frozen fast,',
      'the deck glazed over, bow to mast.',
      'She dreams of ocean, salt and swell —',
      'he\'ll thaw each memory and break the spell.'
    ],
    description: 'The King enters the memory of their honeymoon voyage. A sorcerer\'s ice storm has frozen the ship inside the dream. Ice tiles block every corridor and lock every gem in place.',
    ambientTheme: 'cold',
    levels: [
      {
        levelNumber: 11,
        title: 'The Harbour Departure',
        storyParagraph:
          'The harbour on the morning they set sail — bright and salt-aired, their whole kingdom cheering from the docks. But a cold has crept in from the dream\'s edges and the first ice crystals form on the cobblestones.',
        openingVerse: [
          'They cheered for us from every dock.',
          'I held your hand as we unlocked',
          'the ropes and set the bow to sea —',
          'I\'ll sail this dream back home for thee.'
        ],
        dreamWhisper: 'I loved the harbour in the morning...',
        closureVerse: [
          'The dock is clear. The ice retreats.',
          'The cheering echoes past the sleet.',
          'I push the frost back from the stone.',
          'She sailed with me. She\'s not alone.'
        ],
        closureSentence: 'The harbour brightens. The crowd\'s echo lingers warmly on the dream-air.'
      },
      {
        levelNumber: 12,
        title: 'Open Waters',
        storyParagraph:
          'The open-sea memory is vast and cold. Ice forms on the water\'s surface, locking tiles in place mid-drift. The King must work quickly before the whole ocean freezes solid in the dream.',
        openingVerse: [
          'Blue horizon, endless and wide,',
          'you stood at the bow at my side.',
          'The ice comes now to claim it all —',
          'I\'ll keep the sea open. I will not fall.'
        ],
        dreamWhisper: 'The water goes on forever here... it\'s so beautiful...',
        closureVerse: [
          'The ocean breathes again, unfrozen.',
          'The sky clears wide, the stars are chosen.',
          'She turns in sleep toward warmer things.',
          'I sail her dream on memory\'s wings.'
        ],
        closureSentence: 'The sea opens wide. Stars appear above the dream-ocean.'
      },
      {
        levelNumber: 13,
        title: 'The Ice Storm',
        storyParagraph:
          'The memory of the night an unexpected storm blew in — they laughed about it later, clinging to the mast. In the dream the storm is relentless. Ice tiles fill the board faster here than anywhere before.',
        openingVerse: [
          'You laughed when the storm hit the sails.',
          '"Adventure," you said — no travails.',
          'But the dream makes it colder, more cruel —',
          'I\'ll warm it for you, that\'s my rule.'
        ],
        dreamWhisper: 'We laughed then... why does it feel colder now...?',
        closureVerse: [
          'The storm breaks. The laughter returns.',
          'I hear it — distant — as the ice burns.',
          'She almost smiled there in her rest.',
          'I\'d weather a thousand storms for less.'
        ],
        closureSentence: 'The storm quiets. For a moment, the Queen almost smiles in her sleep.'
      },
      {
        levelNumber: 14,
        title: 'Frozen Decks',
        storyParagraph:
          'The ship\'s decks are glazed solid. Every plank, every rope, every railing — pure ice. The King slides through the memory, chipping at frozen tiles to reach the ship\'s core. The sorcerer\'s cold is strongest here.',
        openingVerse: [
          'Every plank, every rope, every mast',
          'frozen into her dreamscape fast.',
          'I\'ll thaw each memory board by board —',
          'the cold will break beneath love\'s word.'
        ],
        dreamWhisper: 'Cold... so cold now. Please don\'t stop.',
        closureVerse: [
          'The decks run clear. The ropes run free.',
          'I feel the ship\'s heart beat for me.',
          'She shivers once — the ice recoils.',
          'The dream holds warmth beneath its foils.'
        ],
        closureSentence: 'The ship creaks back to life. The frost retreats to the furthest edges.'
      },
      {
        levelNumber: 15,
        title: 'The Helm Seal',
        storyParagraph:
          'At the ship\'s wheel — where she stood laughing with salt spray in her hair — the third seal waits. Ice boulders block every approach. The King breaks through, driven by the image of her standing there.',
        openingVerse: [
          'You stood at the helm, hair unbound,',
          'the finest sight I\'d ever found.',
          'The seal locks that vision in ice —',
          'one blow of love will now suffice.'
        ],
        dreamWhisper: 'The helm... I loved to steer. It made me feel free.',
        closureVerse: [
          'The ice explodes in silver light.',
          'The helm is warm beneath tonight.',
          'Three seals gone. Her breathing slows',
          'to something peaceful. The cold goes.'
        ],
        closureSentence: 'The third seal breaks. The ship sails free in her dream at last.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 4 — THE NIGHTMARE  (levels 16–20)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 4,
    title: 'The Nightmare',
    subtitle: 'The Sorcerer\'s Corruption',
    chapterVerse: [
      'The deeper he goes, the darker it grows —',
      'the sorcerer\'s shadow over all that she knows.',
      'Twisted and wrong, the dream starts to break —',
      'he fights through the dark for his queen\'s sake.'
    ],
    description: 'The sorcerer\'s influence has corrupted the deepest layers of the dream. Boards are dark and chaotic. All obstacles combine. Power-ups behave unpredictably. This is the hardest chapter.',
    ambientTheme: 'dark',
    levels: [
      {
        levelNumber: 16,
        title: 'The First Shadow',
        storyParagraph:
          'The warmth of the honeymoon ship fades as the King descends deeper. The dream turns grey, then black. Familiar shapes grow wrong. The sorcerer\'s dark sigil marks every wall.',
        openingVerse: [
          'The light goes grey and then goes black.',
          'Something here wants to push me back.',
          'I feel the sorcerer\'s cold hand near —',
          'I will not bend. I will not fear.'
        ],
        dreamWhisper: 'There\'s something wrong here... don\'t come closer...',
        closureVerse: [
          'I push the shadow back one step.',
          'The dream breathes out a desperate breath.',
          'She\'s restless now — her sleep grows thin.',
          'Hold on. I\'m nearly halfway in.'
        ],
        closureSentence: 'A crack appears in the darkness. He steps through it.'
      },
      {
        levelNumber: 17,
        title: 'The Sorcerer\'s Mark',
        storyParagraph:
          'Dark sigils pulse and spread across the walls. Each one the King clears, three more appear. The algae here grows black at its tips. Ice and algae combine for the first time, locking tiles in a double grip.',
        openingVerse: [
          'Your marks are on every wall I see —',
          'but they cannot hold her against me.',
          'Each sigil I clear, I clear her mind.',
          'There is no hex I will not unwind.'
        ],
        dreamWhisper: 'I keep seeing his face in the dark... he put me here...',
        closureVerse: [
          'The sigils dim. The black retreats.',
          'The dream fights back. The sorcerer meets',
          'something he did not count upon —',
          'a love that will not be undone.'
        ],
        closureSentence: 'The dark marks fade. She stirs restlessly, fighting something in her sleep.'
      },
      {
        levelNumber: 18,
        title: 'Shattered Palace',
        storyParagraph:
          'The sorcerer has twisted a version of the palace into something unrecognisable — walls at wrong angles, staircases going nowhere, all of it flooding from above. The King navigates the broken dream.',
        openingVerse: [
          'Our palace stands — but wrong, inverted,',
          'every truth within it perverted.',
          'I know these halls. He cannot fool me.',
          'I\'ll walk them straight and set you free.'
        ],
        dreamWhisper: 'Where are we? This isn\'t our home...',
        closureVerse: [
          'The walls right themselves, brick by brick.',
          'The dream-palace heals, slow and thick.',
          'She murmurs something like my name.',
          'I heard it. Nothing sounds the same.'
        ],
        closureSentence: 'The palace reassembles itself, stone by stone, around him.'
      },
      {
        levelNumber: 19,
        title: 'The Dark Mirror',
        storyParagraph:
          'A twisted reflection of the King appears — made of shadow and algae, wearing a false crown. This is what the sorcerer wants the Queen to see in her sleep: that no one is coming. The King must shatter it.',
        openingVerse: [
          'He wears my face to make her doubt,',
          'to make her sleep without a shout.',
          'I\'ll break that mirror, kill that lie —',
          'I am here. I will not die.'
        ],
        dreamWhisper: 'There\'s something that looks like you... but it\'s cold...',
        closureVerse: [
          'The dark reflection cracks and falls.',
          'My name rings true across these halls.',
          'She knows now — someone real is near.',
          'She\'ll wake to find me. Have no fear.'
        ],
        closureSentence: 'The false king shatters into dark water. Her dreaming face relaxes.'
      },
      {
        levelNumber: 20,
        title: 'The Nightmare Seal',
        storyParagraph:
          'The fourth seal is buried at the nightmare\'s deepest point — hidden behind boulders, ice, algae, and darkness all at once. This is the sorcerer\'s strongest lock. The King has learned everything. He uses all of it.',
        openingVerse: [
          'Four locks hold her. Three are gone.',
          'This one screams to carry on.',
          'I have faced your worst — and worse.',
          'One blow more breaks this curse.'
        ],
        dreamWhisper: 'Break it... please... I can\'t breathe in here...',
        closureVerse: [
          'The fourth seal tears. The nightmare breaks.',
          'The darkness runs. The dreamer wakes',
          'not fully — but enough to know',
          'that someone real is in her shadow.'
        ],
        closureSentence: 'The nightmare shatters. The dream blooms warm again. She weeps quietly in her sleep.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 5 — THE FIRST BATTLE  (levels 21–25)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 5,
    title: 'The First Battle',
    subtitle: 'Memory of Courage',
    chapterVerse: [
      'They fought together, shield and crown,',
      'they held the wall, they stood their ground.',
      'She dreams of courage, blood and rain —',
      'he\'ll honour every memory of pain.'
    ],
    description: 'The sorcerer locked her most courageous memories deepest — because they make her strong. Boulder forts, explosions, and power-ups dominate these boards. The King fights like he did then: beside her.',
    ambientTheme: 'battle',
    levels: [
      {
        levelNumber: 21,
        title: 'Before the Battle',
        storyParagraph:
          'The eve of their first great siege — the Queen stood beside the King and refused to stay behind. This memory lives in her most fiercely. Heavy boulders from a collapsed fortress wall block the board.',
        openingVerse: [
          '"Stay back," I said. You shook your head.',
          '"Side by side," you chose instead.',
          'The boulders block this memory\'s gate —',
          'I\'ll move them all. It\'s not too late.'
        ],
        dreamWhisper: 'I remember not being afraid... hold on to that.',
        closureVerse: [
          'The wall comes down. The path runs clear.',
          'Your voice, remembered without fear.',
          'You were never one to stand behind.',
          'This memory lives in a brave mind.'
        ],
        closureSentence: 'The fortress wall crumbles. The memory of her courage blazes bright.'
      },
      {
        levelNumber: 22,
        title: 'The Siege',
        storyParagraph:
          'The memory of the siege itself — explosions still echo in the dream. Bomb power-ups ignite unpredictably. Boulders rain down. The King fights through it the same way he did then: methodically, without panic.',
        openingVerse: [
          'The walls shook and the sky turned red.',
          'You held the line while others fled.',
          'The dream-siege roars as loud as then —',
          'I\'ll hold the line for you again.'
        ],
        dreamWhisper: 'Hold the east wall... don\'t let them through...',
        closureVerse: [
          'The east wall holds. The siege retreats.',
          'The memory of two crowns defeats',
          'the worst that any enemy brings.',
          'She fights in sleep on borrowed wings.'
        ],
        closureSentence: 'The siege memory holds steady. The east wall stands unbroken.'
      },
      {
        levelNumber: 23,
        title: 'Side by Side',
        storyParagraph:
          'The clearest battle memory: the two of them, back to back, in the castle\'s inner court. Lightning flashed that day — and it flashes now in the dream. Lightning tiles power up and chain across the board.',
        openingVerse: [
          'Back to back, we held that court.',
          'The lightning lit the field and fort.',
          'It lights this dream the same way still —',
          'with you beside me, always will.'
        ],
        dreamWhisper: 'You were right there... I could hear you breathing...',
        closureVerse: [
          'The lightning clears the court in white.',
          'Our silhouettes burn in the light.',
          'She knows this memory in her bones.',
          'No sorcerer can claim what she owns.'
        ],
        closureSentence: 'Lightning clears the court. The memory of their unity burns bright and fierce.'
      },
      {
        levelNumber: 24,
        title: 'The Victory Feast',
        storyParagraph:
          'After the battle: a long table set with gold and feasting, the whole kingdom celebrating. Coins tumble everywhere in this memory. The board is rich with them. Collect all you can.',
        openingVerse: [
          'We feasted after — table long,',
          'the whole court full of food and song.',
          'The coins still tumble, gold and bright —',
          'collect them all this victory night.'
        ],
        dreamWhisper: 'You gave a toast... what did you say...?',
        closureVerse: [
          'The table gleams. The coins are gathered.',
          '"To her," I said. "To all we\'ve weathered."',
          'She smiled that night. She smiles now.',
          'One seal remains. I\'ll find it. How.'
        ],
        closureSentence: 'The feast blazes golden. She smiles in her sleep — the first true smile.'
      },
      {
        levelNumber: 25,
        title: 'The Battle Seal',
        storyParagraph:
          'The fifth seal hides behind a fortress wall of boulders, protected by the sorcerer\'s last defensive line. The King brings down the wall with every power-up he\'s collected. Only one seal remains after this.',
        openingVerse: [
          'The fifth lock hides behind stone walls.',
          'His last defence before it falls.',
          'I\'ve come too far to stop right here —',
          'the final chamber is near.'
        ],
        dreamWhisper: 'Almost... I can almost see the light beyond...',
        closureVerse: [
          'The fortress falls. The fifth seal cracks.',
          'The battle memory holds its tracks.',
          'Five down. One seal left in the deep.',
          'I\'ll find her at the core of sleep.'
        ],
        closureSentence: 'The fifth seal shatters. Only one lock remains between them.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  //  CHAPTER 6 — THE AWAKENING  (levels 26–30)
  // ─────────────────────────────────────────────────────────────
  {
    chapterNumber: 6,
    title: 'The Awakening',
    subtitle: 'The Final Dream',
    chapterVerse: [
      'The deepest layer waits beyond sight —',
      'her truest self, sealed from the light.',
      'Break the last lock and she will rise.',
      'Open her dream. Open her eyes.'
    ],
    description: 'The King reaches the very core of the Queen\'s dreaming mind. All memories converge. All obstacles combine. The last five levels build toward the final seal — and her awakening.',
    ambientTheme: 'ethereal',
    levels: [
      {
        levelNumber: 26,
        title: 'The Deep Dream',
        storyParagraph:
          'He has never been this far inside another\'s mind. The architecture here is pure imagination — not a memory of any place, but of feeling itself. Everything is lit from within. Even the algae glows, as if alive with something beautiful.',
        openingVerse: [
          'No room I know. No wall I\'ve touched.',
          'But every colour speaks of such',
          'a life we built, a love we tended —',
          'I\'m here where all your dreams are blended.'
        ],
        dreamWhisper: 'You made it... you actually came...',
        closureVerse: [
          'The deep dream breathes and opens wide.',
          'I feel her warmth on every side.',
          'She knows I\'m here. She holds the light.',
          'The last seal waits — one final fight.'
        ],
        closureSentence: 'The dream blooms open around him. She is everywhere here.'
      },
      {
        levelNumber: 27,
        title: 'Her Voice Returns',
        storyParagraph:
          'For the first time across all twenty-six chambers, the King hears her voice — not a whisper, but clear and close and certain. "I\'m here," she says. "Break the last lock." The board shakes with the weight of her presence.',
        openingVerse: [
          'Your voice — I heard it, clear at last.',
          'Not through glass, not from the past.',
          '"Break the last lock," you said to me.',
          '"I\'m waiting here. Please set me free."'
        ],
        dreamWhisper: 'I\'m right here. I can see you now.',
        closureVerse: [
          'Her voice rang true and then went still.',
          'The dream held its breath. I felt the thrill.',
          'She\'s waiting at the final door.',
          'I have never been so sure.'
        ],
        closureSentence: 'Her voice echoes warmly through every chamber. The final door is close.'
      },
      {
        levelNumber: 28,
        title: 'The Weaving of Memories',
        storyParagraph:
          'All her memories converge in this chamber — the rose garden, the frozen ship, the battle, the golden cellars — woven together in one vast, beautiful, flooding board. The King must honour every one of them to pass through.',
        openingVerse: [
          'Roses and sea-salt and cold stone halls,',
          'victory feast and battle calls —',
          'all of it here, all of it yours.',
          'I\'ll hold it together as the water pours.'
        ],
        dreamWhisper: 'This is everything I am... please be careful.',
        closureVerse: [
          'The weaving holds. The threads run bright.',
          'Rose-gold and frost and battle light.',
          'She is everything I\'ve moved through here.',
          'The last seal now. She is near.'
        ],
        closureSentence: 'All memories weave into one perfect, glowing chamber. He breathes in her entire life.'
      },
      {
        levelNumber: 29,
        title: 'The Sorcerer\'s Last Hold',
        storyParagraph:
          'The sorcerer himself is here — not in body, but in pure intent. One final trap: every obstacle maximised, the water rising faster than it ever has. The King has seen everything the dream can throw at him. He is ready.',
        openingVerse: [
          'You made your trap. You made it well.',
          'I\'ve walked through every room in your hell.',
          'But love is not a puzzle you can lock.',
          'I\'m breaking down your final block.'
        ],
        dreamWhisper: 'I believe in you. Don\'t be afraid of it.',
        closureVerse: [
          'The trap springs shut — and then it breaks.',
          'The sorcerer\'s grip on her dream shakes.',
          'His last hold snaps like frozen glass.',
          'The final seal is all. I\'ll pass.'
        ],
        closureSentence: 'The sorcerer\'s masterwork collapses. The last seal is laid bare.'
      },
      {
        levelNumber: 30,
        title: 'The Awakening',
        storyParagraph:
          'One board. One seal. The King stands before it — every level, every memory, every whispered word behind him. He drains the last of the water. He places his hand on the seal. It opens like a flower. Above him, in the waking world, the Queen opens her eyes.',
        openingVerse: [
          'This is the last door. This is the last wall.',
          'Everything I\'ve done has led to this hall.',
          'One seal remains between her sleep and my voice.',
          'Break it. Choose her. Make the choice.'
        ],
        dreamWhisper: 'I can see the light. I can feel your hand.',
        closureVerse: [
          'The seal opens. The dream goes white.',
          'She rises through the water, into light.',
          'Her eyes find mine across the room.',
          '"I heard you," she says. "Every step through the gloom."'
        ],
        closureSentence: 'The last seal breaks. The water drains. The Queen opens her eyes.'
      }
    ]
  }

];
