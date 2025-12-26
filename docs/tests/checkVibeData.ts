/**
 * Check if tracks have Enhanced vibe analysis data
 */
import { prisma } from "../utils/db";

async function check() {
  // Get a sample of tracks with their analysis data
  const tracks = await prisma.track.findMany({
    take: 10,
    select: {
      title: true,
      album: { select: { artist: { select: { name: true } } } },
      analysisMode: true,
      moodHappy: true,
      moodSad: true,
      moodRelaxed: true,
      moodAggressive: true,
      danceabilityMl: true,
      valence: true,
      arousal: true,
      energy: true,
      bpm: true,
      moodTags: true,
    },
    where: {
      bpm: { not: null }
    }
  });
  
  console.log('Sample tracks with analysis data:');
  for (const t of tracks) {
    console.log(`\n${t.album?.artist?.name} - ${t.title}`);
    console.log(`  analysisMode: ${t.analysisMode || 'NOT SET (legacy)'}`);
    console.log(`  ML moods: happy=${t.moodHappy}, sad=${t.moodSad}, relaxed=${t.moodRelaxed}, aggressive=${t.moodAggressive}`);
    console.log(`  danceabilityMl: ${t.danceabilityMl}`);
    console.log(`  valence: ${t.valence}, arousal: ${t.arousal}`);
    console.log(`  energy: ${t.energy}, bpm: ${t.bpm}`);
    console.log(`  moodTags: ${t.moodTags?.join(', ') || 'none'}`);
  }
  
  // Count tracks with enhanced analysis
  const enhancedCount = await prisma.track.count({ where: { analysisMode: 'enhanced' } });
  const standardCount = await prisma.track.count({ where: { analysisMode: 'standard' } });
  const noModeCount = await prisma.track.count({ where: { analysisMode: null, bpm: { not: null } } });
  const totalAnalyzed = await prisma.track.count({ where: { bpm: { not: null } } });
  
  // Count tracks with ML mood data
  const withMoodHappy = await prisma.track.count({ where: { moodHappy: { not: null } } });
  
  console.log(`\n--- Analysis Mode Stats ---`);
  console.log(`Enhanced: ${enhancedCount}`);
  console.log(`Standard: ${standardCount}`);
  console.log(`No mode (legacy): ${noModeCount}`);
  console.log(`Total analyzed: ${totalAnalyzed}`);
  console.log(`With ML mood data: ${withMoodHappy}`);
  
  // Check specific songs the user mentioned
  console.log(`\n--- Checking specific songs ---`);
  const specificSongs = await prisma.track.findMany({
    where: {
      OR: [
        { title: { contains: "I Love You", mode: "insensitive" } },
        { title: { contains: "Roots", mode: "insensitive" } },
        { title: { contains: "Alright", mode: "insensitive" } },
      ]
    },
    select: {
      title: true,
      album: { select: { artist: { select: { name: true } } } },
      analysisMode: true,
      moodHappy: true,
      moodSad: true,
      moodRelaxed: true,
      moodAggressive: true,
      valence: true,
      arousal: true,
      energy: true,
      bpm: true,
      danceability: true,
      moodTags: true,
    }
  });
  
  for (const t of specificSongs) {
    console.log(`\n${t.album?.artist?.name} - ${t.title}`);
    console.log(`  analysisMode: ${t.analysisMode || 'NOT SET (legacy)'}`);
    console.log(`  ML moods: happy=${t.moodHappy}, sad=${t.moodSad}, relaxed=${t.moodRelaxed}, aggressive=${t.moodAggressive}`);
    console.log(`  valence: ${t.valence}, arousal: ${t.arousal}`);
    console.log(`  energy: ${t.energy}, bpm: ${t.bpm}, dance: ${t.danceability}`);
    console.log(`  moodTags: ${t.moodTags?.join(', ') || 'none'}`);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);

