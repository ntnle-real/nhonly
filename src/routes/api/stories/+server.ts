// MARK: ROUTE(API Stories) -> Recording Persistence Endpoints
// Purpose: Accept recordings from browser, save to Supabase, list stories, delete recordings
// Success: Audio stored, metadata recorded, responses return correct data
// Failure: Invalid input, upload fails, or database error

import { json } from '@sveltejs/kit';
import { saveStory, deleteStory, getAllStories } from '$lib/stories.server';
import { createObservationSession } from '$lib/obs';
import type { RequestHandler } from './$types';

/**
 * MARK: HANDLER(POST /api/stories) -> Save New Recording
 * Purpose: Accept FormData with audio blob and metadata, save to Supabase
 * Success: Story ID returned, audio in storage, metadata in database
 * Failure: Invalid fields, upload fails, database error
 */
export const POST: RequestHandler = async ({ request }) => {
	const obs = createObservationSession();
	obs.step('handle_post_save_story');

	// Check if Supabase is configured
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.PUBLIC_SUPABASE_URL) {
		obs.observe('supabase_not_configured', {
			hasUrl: !!process.env.PUBLIC_SUPABASE_URL,
			hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
		});
		return json({
			error: 'Database not configured. Please set SUPABASE_SERVICE_ROLE_KEY and PUBLIC_SUPABASE_URL in .env.production'
		}, { status: 503 });
	}

	try {
		// Parse FormData
		obs.step('parse_form_data');

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const audioBlob = formData.get('audio') as Blob;
		const durationStr = formData.get('duration') as string;

		obs.read('form_input', {
			hasTitle: !!title,
			hasAudio: !!audioBlob,
			hasDuration: !!durationStr,
			audioSize: audioBlob?.size
		});

		// Validate input
		obs.step('validate_input');

		if (!title || typeof title !== 'string') {
			obs.observe('validation_failed', 'missing or invalid title');
			return json({ error: 'Missing or invalid title' }, { status: 400 });
		}

		if (!audioBlob) {
			obs.observe('validation_failed', 'missing audio blob');
			return json({ error: 'Missing audio file' }, { status: 400 });
		}

		if (!durationStr) {
			obs.observe('validation_failed', 'missing duration');
			return json({ error: 'Missing duration' }, { status: 400 });
		}

		const durationMs = parseInt(durationStr, 10);
		if (isNaN(durationMs) || durationMs <= 0) {
			obs.observe('validation_failed', 'invalid duration value');
			return json({ error: 'Invalid duration' }, { status: 400 });
		}

		obs.observe('input_valid', {
			title: title.substring(0, 50),
			durationMs
		});

		// Save story
		obs.step('save_story_to_supabase');

		const story = await saveStory(title, audioBlob, durationMs, obs);

		obs.observe('response_prepared', {
			storyId: story.id,
			status: 200
		});

		return json(
			{
				id: story.id,
				title: story.title,
				audioUrl: story.audio_url,
				durationMs: story.duration_ms,
				timestamp: story.timestamp
			},
			{ status: 201 }
		);
	} catch (error) {
		const errorMsg = String(error);
		obs.observe('post_handler_error', errorMsg);
		console.error('Failed to save story:', error);

		return json({ error: 'Failed to save story' }, { status: 500 });
	}
};

/**
 * MARK: HANDLER(GET /api/stories) -> List All Recordings
 * Purpose: Retrieve all saved stories for display in archive
 * Success: Returns array of stories sorted by timestamp descending
 * Failure: Database error (returns empty array)
 */
export const GET: RequestHandler = async () => {
	const obs = createObservationSession();
	obs.step('handle_get_all_stories');

	// Check if Supabase is configured
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.PUBLIC_SUPABASE_URL) {
		return json([], { status: 200 }); // Return empty array gracefully
	}

	try {
		obs.step('fetch_from_database');

		const stories = await getAllStories(obs);

		obs.observe('response_prepared', {
			storyCount: stories.length,
			status: 200
		});

		return json(stories, { status: 200 });
	} catch (error) {
		const errorMsg = String(error);
		obs.observe('get_handler_error', errorMsg);
		console.error('Failed to fetch stories:', error);

		// Return empty array on error (graceful degradation)
		return json([], { status: 200 });
	}
};

/**
 * MARK: HANDLER(DELETE /api/stories) -> Remove Recording
 * Purpose: Delete story metadata and audio file
 * Success: Story deleted from database and storage
 * Failure: Invalid ID or delete fails
 */
export const DELETE: RequestHandler = async ({ url }) => {
	const obs = createObservationSession();
	obs.step('handle_delete_story');

	// Check if Supabase is configured
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.PUBLIC_SUPABASE_URL) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	try {
		// Parse ID from query params
		obs.step('parse_id_parameter');

		const idStr = url.searchParams.get('id');

		if (!idStr) {
			obs.observe('validation_failed', 'missing id parameter');
			return json({ error: 'Missing story id' }, { status: 400 });
		}

		const id = parseInt(idStr, 10);
		if (isNaN(id) || id <= 0) {
			obs.observe('validation_failed', 'invalid id value');
			return json({ error: 'Invalid story id' }, { status: 400 });
		}

		obs.read('delete_request', { id });

		// Delete story
		obs.step('delete_story_from_supabase');

		await deleteStory(id, obs);

		obs.observe('response_prepared', {
			id,
			status: 200
		});

		return json({ success: true, id }, { status: 200 });
	} catch (error) {
		const errorMsg = String(error);
		obs.observe('delete_handler_error', errorMsg);
		console.error('Failed to delete story:', error);

		return json({ error: 'Failed to delete story' }, { status: 500 });
	}
};
