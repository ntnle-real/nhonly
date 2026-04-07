// MARK: SYSTEM(Storage) -> IndexedDB Persistence
// Purpose: Save audio blob + metadata (title, timestamp) to browser storage with error classification
// Success: accept blob + title → store in IndexedDB with timestamp → return archive ID
// Failure: database access denied, quota exceeded, or write transaction fails

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';
import { StorageError, classifyError } from './errors';

// Contract interfaces

interface InitDatabaseContract {
	serves: string;
	declares: {
		input: 'db_init_request';
		output: 'database_ready';
	};
	succeeds_if: {
		reads: ['db_init_request'];
		steps: ['open_indexeddb', 'create_store'];
		observes: ['database_opened', 'store_created'];
		returns: ['database_ready'];
	};
	fails_if: {
		observes: ['database_access_denied', 'quota_exceeded'];
	};
}

interface SaveStoryContract {
	serves: string;
	declares: {
		input: 'story_blob_title_duration';
		output: 'story_archived';
	};
	succeeds_if: {
		reads: ['story_blob_title_duration'];
		steps: ['start_transaction', 'add_story', 'commit'];
		observes: ['story_stored', 'timestamp_recorded', 'duration_recorded'];
		returns: ['story_archived'];
	};
	fails_if: {
		observes: ['database_not_ready', 'write_failed', 'quota_exceeded'];
	};
}

export interface ArchivedStory {
	id: number;
	title: string;
	audioBlob: Blob;
	timestamp: number; // milliseconds since epoch
	durationMs: number; // audio duration in milliseconds

	// NEW: Story type (optional for backward compatibility — missing = 'recording')
	type?: 'recording' | 'diorama';

	// NEW: Diorama-only fields (only present when type === 'diorama')
	dioramaId?: string;                   // matches DiogramaCatalogEntry.id
	dioramaPreviewText?: string;          // first fragment text
	dioramaApproximateDurationMs?: number; // estimated read-through time in ms
}

const DB_NAME = 'nhonly_archive';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

let db: IDBDatabase | null = null;

const initDatabaseContract: InitDatabaseContract = {
	serves: 'open or create IndexedDB database for story archive',
	declares: {
		input: 'db_init_request',
		output: 'database_ready'
	},
	succeeds_if: {
		reads: ['db_init_request'],
		steps: ['open_indexeddb', 'create_store'],
		observes: ['database_opened', 'store_created'],
		returns: ['database_ready']
	},
	fails_if: {
		observes: ['database_access_denied', 'quota_exceeded']
	}
};

/**
 * Initialize IndexedDB database.
 * Called on app mount. Success: opens/creates IndexedDB database with 'stories' object store
 * Failure: database access denied or quota exceeded
 * @throws StorageError if initialization fails
 */
export async function initDatabase(
	obs: ObservationSession = createObservationSession()
): Promise<void> {
	obs.read('db_init_request', {});

	return new Promise((resolve, reject) => {
		obs.step('open_indexeddb');
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			obs.observe(
				'database_access_denied',
				`indexedDB.open failed: ${request.error?.message}`
			);
			reject(
				classifyError(request.error ?? new Error('Failed to open IndexedDB'), {
					operation: 'init_database',
					api: 'IndexedDB'
				})
			);
		};

		request.onsuccess = () => {
			db = request.result;
			obs.observe('database_opened', `database "${DB_NAME}" opened`);
			obs.return_('database_ready', undefined);
			resolve();
		};

		request.onupgradeneeded = (event) => {
			obs.step('create_store');
			const target = event.target as IDBOpenDBRequest;
			const database = target.result;

			try {
				if (!database.objectStoreNames.contains(STORE_NAME)) {
					database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
					obs.observe('store_created', `object store "${STORE_NAME}" created`);
				}
			} catch (error) {
				obs.observe('database_access_denied', (error as Error).message);
				reject(classifyError(error, { operation: 'init_database', api: 'IndexedDB' }));
			}
		};
	});
}

const saveStoryContract: SaveStoryContract = {
	serves: 'write audio blob, title, duration, and timestamp to indexed archive',
	declares: {
		input: 'story_blob_title_duration',
		output: 'story_archived'
	},
	succeeds_if: {
		reads: ['story_blob_title_duration'],
		steps: ['start_transaction', 'add_story', 'commit'],
		observes: ['story_stored', 'timestamp_recorded', 'duration_recorded'],
		returns: ['story_archived']
	},
	fails_if: {
		observes: ['database_not_ready', 'write_failed', 'quota_exceeded']
	}
};

/**
 * Save story to archive.
 * Writes story (blob + title + duration + timestamp) to IndexedDB, returns ID
 * Failure: database not initialized or write transaction fails
 * @param title - Story title (validated for non-empty)
 * @param audioBlob - Audio Blob from recording
 * @param durationMs - Duration of audio in milliseconds
 * @returns Promise resolving to auto-generated story ID
 * @throws StorageError if save fails
 */
export async function saveStory(
	title: string,
	audioBlob: Blob,
	durationMs: number,
	obs: ObservationSession = createObservationSession()
): Promise<number> {
	obs.read('story_blob_title_duration', { title, durationMs, audioBlob: { size: audioBlob.size, type: audioBlob.type } });

	if (!db) {
		obs.observe('database_not_ready', 'db is null');
		throw classifyError(new Error('Database not initialized'), {
			operation: 'save_story',
			api: 'IndexedDB'
		});
	}

	return new Promise((resolve, reject) => {
		obs.step('start_transaction');
		const transaction = db!.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		obs.step('add_story');
		const story = {
			title: title.trim(),
			audioBlob,
			durationMs,
			timestamp: Date.now()
		};

		obs.observe('story_stored', `story title="${story.title}", size=${audioBlob.size}`);
		obs.observe('timestamp_recorded', `timestamp=${story.timestamp}`);
		obs.observe('duration_recorded', `durationMs=${durationMs}`);

		const request = store.add(story);

		request.onerror = () => {
			obs.observe('write_failed', `store.add failed: ${request.error?.message}`);
			reject(
				classifyError(request.error ?? new Error('Failed to save story'), {
					operation: 'save_story',
					api: 'IndexedDB'
				})
			);
		};

		request.onsuccess = () => {
			obs.step('commit');
			const id = request.result as number;
			obs.observe('story_archived', `story saved with id=${id}`);
			resolve(obs.return_('story_archived', id));
		};
	});
}

/**
 * Retrieve all archived stories.
 * Success: returns array of stored stories with metadata
 * Failure: returns empty array if database error
 * @returns Promise resolving to array of archived stories
 */
export async function getAllStories(
	obs: ObservationSession = createObservationSession()
): Promise<ArchivedStory[]> {
	obs.read('get_all_request', {});

	if (!db) {
		obs.observe('database_not_ready', 'db is null');
		return [];
	}

	return new Promise((resolve) => {
		obs.step('fetch_all_stories');
		const transaction = db!.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => {
			const stories = request.result as ArchivedStory[];
			obs.observe('stories_retrieved', `fetched ${stories.length} stories`);
			resolve(obs.return_('all_stories', stories));
		};

		request.onerror = () => {
			obs.observe('fetch_failed', request.error?.message ?? 'unknown error');
			resolve(obs.return_('all_stories', []));
		};
	});
}

/**
 * Retrieve single story by ID.
 * Success: returns story object if ID found
 * Failure: returns null if ID not found or error
 * @param id - Story ID from archive
 * @returns Promise resolving to story or null
 */
export async function getStory(
	id: number,
	obs: ObservationSession = createObservationSession()
): Promise<ArchivedStory | null> {
	obs.read('get_story_request', { id });

	if (!db) {
		obs.observe('database_not_ready', 'db is null');
		return null;
	}

	return new Promise((resolve) => {
		obs.step('fetch_story_by_id');
		const transaction = db!.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(id);

		request.onsuccess = () => {
			const story = request.result as ArchivedStory | undefined;
			if (story) {
				obs.observe('story_found', `story id=${id}, title="${story.title}"`);
			} else {
				obs.observe('story_not_found', `no story with id=${id}`);
			}
			resolve(obs.return_('story_or_null', story || null));
		};

		request.onerror = () => {
			obs.observe('fetch_failed', request.error?.message ?? 'unknown error');
			resolve(obs.return_('story_or_null', null));
		};
	});
}

/**
 * Test-only: Reset database state for testing purposes.
 * @internal
 */
export function __testResetDatabase(): void {
	db = null;
}
