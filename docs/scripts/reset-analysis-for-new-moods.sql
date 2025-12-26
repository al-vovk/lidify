-- Reset all enhanced tracks for re-analysis to populate new mood fields
-- (moodParty, moodAcoustic, moodElectronic)

-- Option 1: Reset only enhanced tracks (faster - already have ML models loaded)
UPDATE "Track"
SET 
    "analysisStatus" = 'pending',
    "moodParty" = NULL,
    "moodAcoustic" = NULL,
    "moodElectronic" = NULL
WHERE "analysisMode" = 'enhanced';

-- Check how many tracks will be re-analyzed
SELECT COUNT(*) as tracks_to_reanalyze FROM "Track" WHERE "analysisStatus" = 'pending';



