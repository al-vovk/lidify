import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { enrichmentService } from "../services/enrichment";
import { getEnrichmentProgress, runFullEnrichment } from "../workers/unifiedEnrichment";

const router = Router();

router.use(requireAuth);

/**
 * GET /enrichment/progress
 * Get comprehensive enrichment progress (artists, track tags, audio analysis)
 */
router.get("/progress", async (req, res) => {
    try {
        const progress = await getEnrichmentProgress();
        res.json(progress);
    } catch (error) {
        console.error("Get enrichment progress error:", error);
        res.status(500).json({ error: "Failed to get progress" });
    }
});

/**
 * POST /enrichment/full
 * Trigger full enrichment (re-enriches everything regardless of status)
 * Admin only
 */
router.post("/full", requireAdmin, async (req, res) => {
    try {
        // This runs in the background
        runFullEnrichment().catch(err => {
            console.error("Full enrichment error:", err);
        });
        
        res.json({ 
            message: "Full enrichment started",
            description: "All artists, track tags, and audio analysis will be re-processed"
        });
    } catch (error) {
        console.error("Trigger full enrichment error:", error);
        res.status(500).json({ error: "Failed to start full enrichment" });
    }
});

/**
 * GET /enrichment/settings
 * Get enrichment settings for current user
 */
router.get("/settings", async (req, res) => {
    try {
        const userId = req.user!.id;
        const settings = await enrichmentService.getSettings(userId);
        res.json(settings);
    } catch (error) {
        console.error("Get enrichment settings error:", error);
        res.status(500).json({ error: "Failed to get settings" });
    }
});

/**
 * PUT /enrichment/settings
 * Update enrichment settings for current user
 */
router.put("/settings", async (req, res) => {
    try {
        const userId = req.user!.id;
        const settings = await enrichmentService.updateSettings(userId, req.body);
        res.json(settings);
    } catch (error) {
        console.error("Update enrichment settings error:", error);
        res.status(500).json({ error: "Failed to update settings" });
    }
});

/**
 * POST /enrichment/artist/:id
 * Enrich a single artist
 */
router.post("/artist/:id", async (req, res) => {
    try {
        const userId = req.user!.id;
        const settings = await enrichmentService.getSettings(userId);

        if (!settings.enabled) {
            return res.status(400).json({ error: "Enrichment is not enabled" });
        }

        const enrichmentData = await enrichmentService.enrichArtist(req.params.id, settings);

        if (!enrichmentData) {
            return res.status(404).json({ error: "No enrichment data found" });
        }

        if (enrichmentData.confidence > 0.3) {
            await enrichmentService.applyArtistEnrichment(req.params.id, enrichmentData);
        }

        res.json({
            success: true,
            confidence: enrichmentData.confidence,
            data: enrichmentData,
        });
    } catch (error: any) {
        console.error("Enrich artist error:", error);
        res.status(500).json({ error: error.message || "Failed to enrich artist" });
    }
});

/**
 * POST /enrichment/album/:id
 * Enrich a single album
 */
router.post("/album/:id", async (req, res) => {
    try {
        const userId = req.user!.id;
        const settings = await enrichmentService.getSettings(userId);

        if (!settings.enabled) {
            return res.status(400).json({ error: "Enrichment is not enabled" });
        }

        const enrichmentData = await enrichmentService.enrichAlbum(req.params.id, settings);

        if (!enrichmentData) {
            return res.status(404).json({ error: "No enrichment data found" });
        }

        if (enrichmentData.confidence > 0.3) {
            await enrichmentService.applyAlbumEnrichment(req.params.id, enrichmentData);
        }

        res.json({
            success: true,
            confidence: enrichmentData.confidence,
            data: enrichmentData,
        });
    } catch (error: any) {
        console.error("Enrich album error:", error);
        res.status(500).json({ error: error.message || "Failed to enrich album" });
    }
});

/**
 * POST /enrichment/start
 * Start library-wide enrichment (runs in background)
 */
router.post("/start", async (req, res) => {
    try {
        const userId = req.user!.id;
        const { notificationService } = await import("../services/notificationService");

        // Check if enrichment is enabled in system settings
        const { prisma } = await import("../utils/db");
        const systemSettings = await prisma.systemSettings.findUnique({
            where: { id: "default" },
            select: { autoEnrichMetadata: true },
        });

        if (!systemSettings?.autoEnrichMetadata) {
            return res.status(400).json({ error: "Enrichment is not enabled. Enable it in settings first." });
        }

        // Get user enrichment settings or use defaults
        const settings = await enrichmentService.getSettings(userId);

        // Override enabled flag with system setting
        settings.enabled = true;

        // Send notification that enrichment is starting
        await notificationService.notifySystem(
            userId,
            "Library Enrichment Started",
            "Enriching artist metadata in the background..."
        );

        // Start enrichment in background
        enrichmentService.enrichLibrary(userId).then(async () => {
            // Send notification when complete
            await notificationService.notifySystem(
                userId,
                "Library Enrichment Complete",
                "All artist metadata has been enriched"
            );
        }).catch(async (error) => {
            console.error("Background enrichment failed:", error);
            await notificationService.create({
                userId,
                type: "error",
                title: "Enrichment Failed",
                message: error.message || "Failed to enrich library metadata",
            });
        });

        res.json({
            success: true,
            message: "Library enrichment started in background",
        });
    } catch (error: any) {
        console.error("Start enrichment error:", error);
        res.status(500).json({ error: error.message || "Failed to start enrichment" });
    }
});

/**
 * PUT /library/artists/:id/metadata
 * Update artist metadata manually
 */
router.put("/artists/:id/metadata", async (req, res) => {
    try {
        const { name, bio, genres, mbid, heroUrl } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (bio) updateData.summary = bio;
        if (mbid) updateData.mbid = mbid;
        if (heroUrl) updateData.heroUrl = heroUrl;
        if (genres) updateData.manualGenres = JSON.stringify(genres);

        // Mark as manually edited
        updateData.manuallyEdited = true;

        const { prisma } = await import("../utils/db");
        const artist = await prisma.artist.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                albums: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        coverUrl: true,
                    },
                },
            },
        });

        res.json(artist);
    } catch (error: any) {
        console.error("Update artist metadata error:", error);
        res.status(500).json({ error: error.message || "Failed to update artist" });
    }
});

/**
 * PUT /library/albums/:id/metadata
 * Update album metadata manually
 */
router.put("/albums/:id/metadata", async (req, res) => {
    try {
        const { title, year, genres, rgMbid, coverUrl } = req.body;

        const updateData: any = {};
        if (title) updateData.title = title;
        if (year) updateData.year = parseInt(year);
        if (rgMbid) updateData.rgMbid = rgMbid;
        if (coverUrl) updateData.coverUrl = coverUrl;
        if (genres) updateData.manualGenres = JSON.stringify(genres);

        // Mark as manually edited
        updateData.manuallyEdited = true;

        const { prisma } = await import("../utils/db");
        const album = await prisma.album.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                artist: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tracks: {
                    select: {
                        id: true,
                        title: true,
                        trackNo: true,
                        duration: true,
                    },
                },
            },
        });

        res.json(album);
    } catch (error: any) {
        console.error("Update album metadata error:", error);
        res.status(500).json({ error: error.message || "Failed to update album" });
    }
});

export default router;
