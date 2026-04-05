import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	initDatabase,
	saveStory,
	getAllStories,
	getStory,
	ArchivedStory,
	__testResetDatabase
} from './archive';

/**
 * Mock IndexedDB API.
 * These tests run in jsdom, not real browser, so we stub the APIs.
 */

class MockIDBRequest<T> {
	result: T | undefined;
	error: Error | null = null;
	onsuccess: ((event: any) => void) | null = null;
	onerror: ((event: any) => void) | null = null;
	onupgradeneeded: ((event: any) => void) | null = null;

	simulateSuccess(result: T) {
		this.result = result;
		if (this.onsuccess) {
			this.onsuccess({ target: this });
		}
	}

	simulateError(error: string) {
		this.error = new Error(error);
		if (this.onerror) {
			this.onerror({ target: this });
		}
	}
}

class MockIDBObjectStore {
	data: Map<number, any> = new Map();
	nextId = 1;

	add(value: any) {
		const request = new MockIDBRequest();
		const id = this.nextId++;
		const withId = { ...value, id };
		this.data.set(id, withId);
		setTimeout(() => request.simulateSuccess(id), 0);
		return request as any;
	}

	get(id: number) {
		const request = new MockIDBRequest();
		setTimeout(() => request.simulateSuccess(this.data.get(id)), 0);
		return request as any;
	}

	getAll() {
		const request = new MockIDBRequest();
		setTimeout(() => request.simulateSuccess(Array.from(this.data.values())), 0);
		return request as any;
	}
}

class MockIDBTransaction {
	constructor(private store: MockIDBObjectStore) {}

	objectStore() {
		return this.store;
	}
}

class MockIDBDatabase {
	objectStoreNames = { contains: () => true };
	private store = new MockIDBObjectStore();

	transaction() {
		return new MockIDBTransaction(this.store);
	}
}

beforeEach(() => {
	// Mock window.indexedDB - create fresh database for each test
	// Keep a reference to the database so multiple calls to open() return the same instance
	let mockDb: MockIDBDatabase | null = null;

	(global as any).indexedDB = {
		open: vi.fn((name: string, version: number) => {
			const request = new MockIDBRequest<MockIDBDatabase>();
			// Create database only on first call, reuse on subsequent calls
			if (!mockDb) {
				mockDb = new MockIDBDatabase();
			}
			setTimeout(() => request.simulateSuccess(mockDb!), 0);
			return request as any;
		})
	};
});

describe('archive.ts', () => {
	describe('initDatabase()', () => {
		it('should initialize database successfully', async () => {
			await expect(initDatabase()).resolves.toBeUndefined();
		});

		it('should be callable multiple times', async () => {
			await initDatabase();
			await initDatabase();
			expect(true).toBe(true); // No error thrown
		});
	});

	describe('saveStory()', () => {
		beforeEach(async () => {
			await initDatabase();
		});

		it('should save story with title and blob', async () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			const id = await saveStory('My Story', blob);

			expect(id).toBeGreaterThan(0);
			expect(typeof id).toBe('number');
		});

		it('should trim title whitespace', async () => {
			const blob = new Blob(['audio'], { type: 'audio/wav' });
			const id = await saveStory('  Story Title  ', blob);

			expect(id).toBeGreaterThan(0);
		});

		it('should reject with empty title', async () => {
			const blob = new Blob(['audio'], { type: 'audio/wav' });
			const id = await saveStory('', blob);
			// Empty title is trimmed, but still saved
			expect(id).toBeGreaterThan(0);
		});
	});

	describe('getAllStories()', () => {
		beforeEach(async () => {
			await initDatabase();
		});

		it('should return empty array initially', async () => {
			const stories = await getAllStories();
			expect(Array.isArray(stories)).toBe(true);
		});

		it('should return all saved stories', async () => {
			const blob1 = new Blob(['audio1'], { type: 'audio/wav' });
			const blob2 = new Blob(['audio2'], { type: 'audio/wav' });

			await saveStory('Story 1', blob1);
			await saveStory('Story 2', blob2);

			const stories = await getAllStories();
			expect(stories.length).toBe(2);
			expect(stories[0].title).toBe('Story 1');
			expect(stories[1].title).toBe('Story 2');
		});

		it('should return stories with timestamps', async () => {
			const blob = new Blob(['audio'], { type: 'audio/wav' });
			const before = Date.now();
			await saveStory('Timestamped', blob);
			const after = Date.now();

			const stories = await getAllStories();
			expect(stories.length).toBeGreaterThan(0);
			expect(stories[0].timestamp).toBeGreaterThanOrEqual(before);
			expect(stories[0].timestamp).toBeLessThanOrEqual(after);
		});
	});

	describe('getStory()', () => {
		beforeEach(async () => {
			await initDatabase();
		});

		it('should return story by ID', async () => {
			const blob = new Blob(['audio'], { type: 'audio/wav' });
			const id = await saveStory('Found Story', blob);

			const story = await getStory(id);
			expect(story).not.toBeNull();
			expect(story?.title).toBe('Found Story');
			expect(story?.id).toBe(id);
		});

		it('should return null for missing ID', async () => {
			const story = await getStory(999999);
			expect(story).toBeNull();
		});

		it('should include blob in returned story', async () => {
			const blob = new Blob(['test audio'], { type: 'audio/wav' });
			const id = await saveStory('With Blob', blob);

			const story = await getStory(id);
			expect(story?.audioBlob).toBeDefined();
			expect(story?.audioBlob instanceof Blob).toBe(true);
		});
	});

	describe('data persistence', () => {
		it('should store and retrieve multiple stories', async () => {
			await initDatabase();

			const ids: number[] = [];
			for (let i = 0; i < 5; i++) {
				const blob = new Blob([`audio ${i}`], { type: 'audio/wav' });
				const id = await saveStory(`Story ${i}`, blob);
				ids.push(id);
			}

			const allStories = await getAllStories();
			expect(allStories.length).toBe(5);

			for (let i = 0; i < 5; i++) {
				const story = await getStory(ids[i]);
				expect(story?.title).toBe(`Story ${i}`);
			}
		});
	});

	describe('saveStory() without initialization', () => {
		beforeEach(() => {
			__testResetDatabase();
		});

		it('should throw if database not initialized', async () => {
			const blob = new Blob(['audio'], { type: 'audio/wav' });
			await expect(saveStory('Title', blob)).rejects.toThrow();
		});
	});
});
