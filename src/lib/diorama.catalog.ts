// MARK: SYSTEM(Catalog) -> Diorama Registry
// Purpose: Hold hardcoded diorama definitions for the archive catalog
// Success: export typed catalog entries for all known dioramas
// Failure: none (pure data module)

export interface DiogramaCatalogEntry {
	id: string;                      // URL-safe identifier, e.g., "boy-on-beach-1976"
	title: string;                   // Display title in English
	titleVi: string;                 // Display title in Vietnamese
	previewText: string;             // First fragment (shown in archive list as preview)
	approximateDurationMs: number;   // Estimated read-through time in ms (e.g., 45000 = 45 sec)
	createdAt: number;               // Fixed timestamp for ordering (use Date.UTC(1976, 5, 15))
}

export const DIORAMA_CATALOG: DiogramaCatalogEntry[] = [
	{
		id: 'boy-on-beach-1976',
		title: 'The Boy on the Beach, Nhơn Lý, 1976',
		titleVi: 'Cậu bé trên bãi biển, Nhơn Lý, 1976',
		previewText: 'Nhơn Lý, 1976...',
		approximateDurationMs: 45000,
		createdAt: Date.UTC(1976, 5, 15),  // June 15, 1976
	}
];

// MARK: FUNCTION(getDioramaById) -> catalog lookup
// Purpose: Find a diorama entry by its URL id
// Success: returns catalog entry if found
// Failure: returns undefined if id not in catalog

export function getDioramaById(
	id: string
): DiogramaCatalogEntry | undefined {
	return DIORAMA_CATALOG.find((d) => d.id === id);
}
