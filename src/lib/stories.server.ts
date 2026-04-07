// MARK: SYSTEM(Stories) -> Recording Persistence Layer
// Purpose: Save, retrieve, and manage user recordings in Supabase
// Success: Audio files stored, metadata recorded, queries return correct data
// Failure: Upload fails, database error, or invalid input

import { getSupabaseAdminClient } from './supabase.server';
import { createObservationSession } from './obs';
import type { ObservationSession } from './obs';

/**
 * MARK: FUNCTION(saveStory) -> Store Recording in Supabase
 * Purpose: Upload audio blob to Storage, record metadata in database
 * Success: Audio uploaded to bucket, story record created with metadata, URL returned
 * Failure: Upload fails, database insert fails, or invalid input
 */
export async function saveStory(
	title: string,
	audioBlob: Blob,
	durationMs: number,
	obs: ObservationSession = createObservationSession()
) {
	obs.read('story_input', { title, durationMs, audioSize: audioBlob.size });

	try {
		// Step 1: Upload audio to Supabase Storage
		obs.step('upload_audio_to_storage');

		const fileName = `${Date.now()}_${title.replace(/\s+/g, '_').substring(0, 50)}.webm`;

		const { data: uploadData, error: uploadError } = await getSupabaseAdminClient().storage
			.from('recordings')
			.upload(fileName, audioBlob, { cacheControl: '3600', upsert: false });

		if (uploadError) {
			obs.observe('upload_failed', {
				error: uploadError.message,
				fileName
			});
			throw new Error(`Failed to upload audio: ${uploadError.message}`);
		}

		obs.observe('audio_uploaded', {
			fileName,
			size: audioBlob.size
		});

		// Step 2: Get public URL for audio
		obs.step('get_audio_url');

		const { data } = getSupabaseAdminClient().storage.from('recordings').getPublicUrl(fileName);
		const audioUrl = data.publicUrl;

		obs.observe('audio_url_generated', audioUrl);

		// Step 3: Save metadata to database
		obs.step('save_story_metadata');

		const { data: storyData, error: dbError } = await getSupabaseAdminClient()
			.from('stories')
			.insert([
				{
					title,
					audio_url: audioUrl,
					duration_ms: durationMs,
					timestamp: Date.now(),
					type: 'recording'
				}
			])
			.select();

		if (dbError) {
			obs.observe('database_insert_failed', {
				error: dbError.message,
				code: dbError.code
			});
			throw new Error(`Failed to save story metadata: ${dbError.message}`);
		}

		if (!storyData || storyData.length === 0) {
			obs.observe('unexpected_result', 'Insert succeeded but no data returned');
			throw new Error('Insert succeeded but no story record returned');
		}

		const story = storyData[0];

		obs.observe('story_saved', {
			id: story.id,
			title: story.title,
			url: story.audio_url
		});

		return obs.return_('story_record', story);
	} catch (error) {
		obs.observe('save_failed', {
			error: String(error),
			title
		});
		throw error;
	}
}

/**
 * MARK: FUNCTION(getAllStories) -> Fetch All Recordings
 * Purpose: Retrieve all saved stories from database
 * Success: Returns array of stories sorted by timestamp
 * Failure: Database query error
 */
export async function getAllStories(obs: ObservationSession = createObservationSession()) {
	obs.step('fetch_all_stories');

	try {
		const { data, error } = await getSupabaseAdminClient()
			.from('stories')
			.select('*')
			.order('timestamp', { ascending: false });

		if (error) {
			obs.observe('fetch_failed', {
				error: error.message,
				code: error.code
			});
			return obs.return_('stories_list_empty', []);
		}

		obs.observe('stories_fetched', {
			count: data?.length || 0
		});

		return obs.return_('stories_list', data || []);
	} catch (error) {
		obs.observe('unexpected_error', String(error));
		return obs.return_('stories_list_empty', []);
	}
}

/**
 * MARK: FUNCTION(getStoryById) -> Fetch Single Recording
 * Purpose: Retrieve specific story by ID
 * Success: Returns story record with audio URL
 * Failure: Story not found or database error
 */
export async function getStoryById(id: number, obs: ObservationSession = createObservationSession()) {
	obs.read('story_id_input', id);

	try {
		obs.step('fetch_story_by_id');

		const { data, error } = await getSupabaseAdminClient()
			.from('stories')
			.select('*')
			.eq('id', id)
			.single();

		if (error) {
			obs.observe('fetch_failed', {
				error: error.message,
				id
			});
			return obs.return_('story_not_found', null);
		}

		obs.observe('story_found', {
			id: data.id,
			title: data.title
		});

		return obs.return_('story_record', data);
	} catch (error) {
		obs.observe('unexpected_error', String(error));
		return obs.return_('story_not_found', null);
	}
}

/**
 * MARK: FUNCTION(deleteStory) -> Remove Recording
 * Purpose: Delete story metadata and audio file from storage
 * Success: Story record deleted, audio file removed
 * Failure: Story not found or delete fails
 */
export async function deleteStory(
	id: number,
	obs: ObservationSession = createObservationSession()
) {
	obs.read('delete_request', { id });

	try {
		// Step 1: Get the story to find audio file path
		obs.step('fetch_story_for_deletion');

		const { data: story, error: fetchError } = await getSupabaseAdminClient()
			.from('stories')
			.select('audio_url')
			.eq('id', id)
			.single();

		if (fetchError || !story) {
			obs.observe('story_not_found_for_delete', id);
			return obs.return_('deletion_skipped', { id, reason: 'story_not_found' });
		}

		obs.observe('story_found_for_deletion', { id, hasAudio: !!story.audio_url });

		// Step 2: Delete from database
		obs.step('delete_story_metadata');

		const { error: deleteError } = await getSupabaseAdminClient()
			.from('stories')
			.delete()
			.eq('id', id);

		if (deleteError) {
			obs.observe('delete_failed', {
				error: deleteError.message,
				id
			});
			throw new Error(`Failed to delete story: ${deleteError.message}`);
		}

		obs.observe('story_metadata_deleted', id);

		// Step 3: Delete audio file from storage (if URL exists)
		if (story.audio_url) {
			obs.step('delete_audio_file');

			// Extract file path from URL
			const filePathMatch = story.audio_url.match(/recordings\/(.+)$/);
			if (filePathMatch) {
				const filePath = filePathMatch[1];

				const { error: storageError } = await getSupabaseAdminClient().storage
					.from('recordings')
					.remove([filePath]);

				if (storageError) {
					obs.observe('audio_deletion_failed', {
						error: storageError.message,
						filePath
					});
					// Don't throw — metadata is already deleted
				} else {
					obs.observe('audio_file_deleted', filePath);
				}
			}
		}

		return obs.return_('deletion_complete', { id, success: true });
	} catch (error) {
		obs.observe('delete_error', String(error));
		throw error;
	}
}
