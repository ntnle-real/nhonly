import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPreviewURL, revokePreviewURL, getPreviewURL } from './preview';

/**
 * Mock URL API for testing.
 * Tests the blob URL creation and revocation.
 */

describe('preview.ts - Audio Preview Blob URL Management', () => {
	beforeEach(() => {
		// Reset any previous state by revoking
		try {
			revokePreviewURL();
		} catch {
			// Ignore if not initialized
		}

		// Mock URL.createObjectURL if not available
		if (!URL.createObjectURL) {
			(URL as any).createObjectURL = vi.fn((blob: Blob) => {
				return `blob:mock-${Math.random()}`;
			});
		}

		// Mock URL.revokeObjectURL if not available
		if (!URL.revokeObjectURL) {
			(URL as any).revokeObjectURL = vi.fn();
		}

		// Clear mocks
		vi.clearAllMocks();
	});

	describe('createPreviewURL', () => {
		it('should create object URL from blob', () => {
			const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

			const url = createPreviewURL(mockBlob);

			expect(url).toBeDefined();
			expect(typeof url).toBe('string');
			expect(url.startsWith('blob:')).toBe(true);
		});

		it('should return different URLs for different blobs', () => {
			const blob1 = new Blob(['data1'], { type: 'audio/wav' });
			const blob2 = new Blob(['data2'], { type: 'audio/wav' });

			const url1 = createPreviewURL(blob1);
			revokePreviewURL();

			const url2 = createPreviewURL(blob2);

			expect(url1).not.toBe(url2);
		});

		it('should revoke previous URL when creating new one', () => {
			const spy = vi.spyOn(URL, 'revokeObjectURL');

			const blob1 = new Blob(['data1'], { type: 'audio/wav' });
			const url1 = createPreviewURL(blob1);

			const blob2 = new Blob(['data2'], { type: 'audio/wav' });
			createPreviewURL(blob2);

			// Should have called revoke for first URL
			expect(spy).toHaveBeenCalledWith(url1);

			spy.mockRestore();
		});

		it('should update internal current URL reference', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			const url = createPreviewURL(blob);

			expect(getPreviewURL()).toBe(url);
		});
	});

	describe('revokePreviewURL', () => {
		it('should revoke object URL', () => {
			const spy = vi.spyOn(URL, 'revokeObjectURL');

			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			const url = createPreviewURL(blob);

			revokePreviewURL();

			expect(spy).toHaveBeenCalledWith(url);

			spy.mockRestore();
		});

		it('should clear current URL reference', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			createPreviewURL(blob);

			expect(getPreviewURL()).not.toBeNull();

			revokePreviewURL();

			expect(getPreviewURL()).toBeNull();
		});

		it('should handle multiple revoke calls gracefully', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			createPreviewURL(blob);

			revokePreviewURL();
			// Second call should not throw
			expect(() => revokePreviewURL()).not.toThrow();
		});

		it('should handle revoke when no URL created', () => {
			expect(() => revokePreviewURL()).not.toThrow();
		});
	});

	describe('getPreviewURL', () => {
		it('should return current preview URL', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			const url = createPreviewURL(blob);

			expect(getPreviewURL()).toBe(url);
		});

		it('should return null when no URL created', () => {
			expect(getPreviewURL()).toBeNull();
		});

		it('should return null after revoke', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });
			createPreviewURL(blob);

			revokePreviewURL();

			expect(getPreviewURL()).toBeNull();
		});
	});

	describe('integration tests', () => {
		it('should support create -> get -> revoke lifecycle', () => {
			const blob = new Blob(['audio data'], { type: 'audio/wav' });

			// Initially null
			expect(getPreviewURL()).toBeNull();

			// After create
			const url = createPreviewURL(blob);
			expect(getPreviewURL()).toBe(url);

			// After revoke
			revokePreviewURL();
			expect(getPreviewURL()).toBeNull();
		});

		it('should prevent memory leaks with multiple create/revoke cycles', () => {
			const spy = vi.spyOn(URL, 'revokeObjectURL');

			for (let i = 0; i < 5; i++) {
				const blob = new Blob([`audio data ${i}`], { type: 'audio/wav' });
				const url = createPreviewURL(blob);

				expect(getPreviewURL()).toBe(url);

				// Each iteration except first should have revoked previous URL
				if (i > 0) {
					expect(spy).toHaveBeenCalled();
				}
			}

			revokePreviewURL();

			expect(getPreviewURL()).toBeNull();

			spy.mockRestore();
		});

		it('should handle rapid create/revoke without errors', () => {
			const blobs = [1, 2, 3, 4, 5].map((i) => new Blob([`data${i}`], { type: 'audio/wav' }));

			blobs.forEach((blob) => {
				const url = createPreviewURL(blob);
				expect(getPreviewURL()).toBe(url);
			});

			expect(() => revokePreviewURL()).not.toThrow();
			expect(getPreviewURL()).toBeNull();
		});
	});
});
