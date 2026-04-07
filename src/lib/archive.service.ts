// MARK: SYSTEM(Service) -> Archive Data Service Layer
// Purpose: Provide high-level operations for reading and managing archived stories
// Success: Read all stories sorted newest-first with formatted metadata; delete stories permanently
// Failure: Database access errors or corrupted records

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';
import { getAllStories, getStory } from './archive';
import type { ArchivedStory } from './archive';
import { StorageError, classifyError } from './errors';
import { DIORAMA_CATALOG } from './diorama.catalog';

// Contract interfaces

interface ReadAndSortStoriesContract {
	serves: string;
	declares: {
		input: 'stories_request';
		output: 'sorted_stories_display';
	};
	succeeds_if: {
		reads: ['stories_request'];
		steps: ['fetch_all_stories', 'sort_by_timestamp', 'format_dates', 'format_durations'];
		observes: ['stories_fetched', 'stories_sorted', 'dates_formatted', 'durations_formatted'];
		returns: ['sorted_stories_display'];
	};
	fails_if: {
		observes: ['fetch_failed', 'database_error'];
	};
}

interface DeleteStoryContract {
	serves: string;
	declares: {
		input: 'delete_request';
		output: 'deletion_complete';
	};
	succeeds_if: {
		reads: ['delete_request'];
		steps: ['start_transaction', 'delete_record', 'commit'];
		observes: ['story_deleted', 'transaction_committed'];
		returns: ['deletion_complete'];
	};
	fails_if: {
		observes: ['database_not_ready', 'delete_failed', 'story_not_found'];
	};
}

const readAndSortStoriesContract: ReadAndSortStoriesContract = {
	serves: 'fetch all stories from IndexedDB, sort newest-first, format metadata for display',
	declares: {
		input: 'stories_request',
		output: 'sorted_stories_display'
	},
	succeeds_if: {
		reads: ['stories_request'],
		steps: ['fetch_all_stories', 'sort_by_timestamp', 'format_dates', 'format_durations'],
		observes: ['stories_fetched', 'stories_sorted', 'dates_formatted', 'durations_formatted'],
		returns: ['sorted_stories_display']
	},
	fails_if: {
		observes: ['fetch_failed', 'database_error']
	}
};

const deleteStoryContract: DeleteStoryContract = {
	serves: 'permanently remove story record from IndexedDB',
	declares: {
		input: 'delete_request',
		output: 'deletion_complete'
	},
	succeeds_if: {
		reads: ['delete_request'],
		steps: ['start_transaction', 'delete_record', 'commit'],
		observes: ['story_deleted', 'transaction_committed'],
		returns: ['deletion_complete']
	},
	fails_if: {
		observes: ['database_not_ready', 'delete_failed', 'story_not_found']
	}
};

/**
 * Helper function to format duration from milliseconds to MM:SS format.
 * @param ms - Duration in milliseconds
 * @returns Formatted string "MM:SS" (e.g., "12:34")
 */
function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Read all stories from IndexedDB, sort by timestamp descending (newest first),
 * and format dates and durations for display.
 * Success: returns array of stories with formatted metadata
 * Failure: returns empty array if database error
 * @param language - Language for date formatting ('vi' or 'en')
 * @param obs - Observation session
 * @returns Promise resolving to array of display stories
 */
export async function readAndSortStories(
	language: 'vi' | 'en' = 'en',
	obs: ObservationSession = createObservationSession()
): Promise<Array<{
	id: number;
	title: string;
	dateFormatted: string;
	durationFormatted: string;
	audioBlob: Blob;
	timestamp: number;
	type: 'recording' | 'diorama';
	dioramaId?: string;
	dioramaPreviewText?: string;
	dioramaApproximateDurationMs?: number;
}>> {
	// MARK: C3 Contract — Read and Sort Stories
	// Purpose: Fetch all stories, sort newest-first, format for display
	// Success: Stories returned with formatted metadata
	// Failure: Database error returns empty array

	obs.read('stories_request', {});

	try {
		obs.step('fetch_all_stories');
		const stories = await getAllStories(obs);
		obs.observe('stories_fetched', `fetched ${stories.length} stories`);

		// Build diorama display objects from catalog
		obs.step('synthesize_dioramas');
		const dioramaItems = DIORAMA_CATALOG.map((d) => ({
			id: -1 * DIORAMA_CATALOG.indexOf(d) - 1,  // Negative IDs for dioramas (no IndexedDB id)
			title: language === 'vi' ? d.titleVi : d.title,
			dateFormatted: '',  // Dioramas have no user date — leave empty
			durationFormatted: language === 'vi'
				? `~${Math.round(d.approximateDurationMs / 1000)} giây`
				: `~${Math.round(d.approximateDurationMs / 1000)} sec`,
			audioBlob: new Blob(),  // Empty blob — dioramas have no audio blob
			timestamp: d.createdAt,
			type: 'diorama' as const,
			dioramaId: d.id,
			dioramaPreviewText: d.previewText,
			dioramaApproximateDurationMs: d.approximateDurationMs,
		}));
		obs.observe('dioramas_synthesized', `synthesized ${dioramaItems.length} diorama items`);

		// Tag recording items with type: 'recording'
		obs.step('tag_recording_items');
		const recordingItems = stories.map((story) => ({
			id: story.id,
			title: story.title,
			dateFormatted: new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
				month: 'long', day: 'numeric', year: 'numeric'
			}).format(new Date(story.timestamp)),
			durationFormatted: formatDuration(story.durationMs),
			audioBlob: story.audioBlob,
			timestamp: story.timestamp,
			type: 'recording' as const,
			dioramaId: undefined,
			dioramaPreviewText: undefined,
			dioramaApproximateDurationMs: undefined,
		}));
		obs.observe('recordings_tagged', `tagged ${recordingItems.length} recording items`);

		// Merge and sort
		obs.step('merge_and_sort');
		const allItems = [...dioramaItems, ...recordingItems];
		allItems.sort((a, b) => b.timestamp - a.timestamp);
		obs.observe('items_merged_sorted', `merged and sorted ${allItems.length} total items`);

		return obs.return_('sorted_stories_display', allItems);
	} catch (error) {
		obs.observe('database_error', (error as Error).message);
		console.error('Error reading stories:', error);
		return obs.return_('sorted_stories_display', []);
	}
}

/**
 * Delete a story by ID from IndexedDB permanently.
 * Success: story record deleted and transaction committed
 * Failure: database error or story not found
 * @param id - Story ID to delete
 * @param obs - Observation session
 * @returns Promise resolving when deletion is complete
 * @throws StorageError if delete fails
 */
export async function deleteStory(
	id: number,
	obs: ObservationSession = createObservationSession()
): Promise<void> {
	// MARK: C3 Contract — Delete Story
	// Purpose: Permanently remove story from IndexedDB
	// Success: Transaction committed, story removed
	// Failure: Database error or story not found

	obs.read('delete_request', { id });

	// Get reference to database
	const db = (await getStory(id, obs))?.id === id ? true : false;

	return new Promise((resolve, reject) => {
		try {
			obs.step('start_transaction');

			// Open database for deletion
			const request = indexedDB.open('nhonly_archive', 1);

			request.onsuccess = () => {
				const database = request.result;
				obs.step('delete_record');

				const transaction = database.transaction(['stories'], 'readwrite');
				const store = transaction.objectStore('stories');
				const deleteRequest = store.delete(id);

				deleteRequest.onsuccess = () => {
					obs.observe('story_deleted', `story id=${id} deleted`);

					transaction.oncomplete = () => {
						obs.step('commit');
						obs.observe('transaction_committed', `transaction committed for id=${id}`);
						resolve(obs.return_('deletion_complete', undefined));
					};

					transaction.onerror = () => {
						obs.observe('delete_failed', `transaction failed: ${transaction.error?.message}`);
						reject(
							classifyError(transaction.error ?? new Error('Transaction failed'), {
								operation: 'delete_story',
								api: 'IndexedDB'
							})
						);
					};
				};

				deleteRequest.onerror = () => {
					obs.observe('delete_failed', `delete failed: ${deleteRequest.error?.message}`);
					reject(
						classifyError(deleteRequest.error ?? new Error('Failed to delete story'), {
							operation: 'delete_story',
							api: 'IndexedDB'
						})
					);
				};
			};

			request.onerror = () => {
				obs.observe('database_not_ready', `failed to open database: ${request.error?.message}`);
				reject(
					classifyError(request.error ?? new Error('Failed to open database'), {
						operation: 'delete_story',
						api: 'IndexedDB'
					})
				);
			};
		} catch (error) {
			obs.observe('delete_failed', (error as Error).message);
			reject(
				classifyError(error, { operation: 'delete_story', api: 'IndexedDB' })
			);
		}
	});
}
