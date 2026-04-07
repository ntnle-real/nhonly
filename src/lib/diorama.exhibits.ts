// MARK: SYSTEM(EXHIBIT) -> Diorama Asset Catalog
// Purpose: Define exhibit objects as structured artifacts with bilingual metadata.
// Success: Assets load with complete metadata; placard content surfaces correctly.
// Failure: Missing required fields rejected at type level.

/**
 * Exhibit asset: A meaning-bearing object in the diorama scene.
 * Grouped by appearance window (fragment) and display context.
 */
export interface DioramaExhibit {
	/** Stable ID for the object */
	id: string;

	/** Display name — English */
	nameEn: string;

	/** Display name — Vietnamese */
	nameVi: string;

	/** Object category: boat, tool, architecture, etc. */
	type: 'boat' | 'tool' | 'architecture' | 'livelihood' | 'landscape';

	/** Fragment window when this object appears (0-indexed) */
	appearanceFragment: number;

	/** Short exhibit/placard text — English */
	placarTextEn: string;

	/** Short exhibit/placard text — Vietnamese */
	placarTextVi: string;

	/** Where the asset lives: in-scene (rendered), supplemental (placard), or both */
	context: 'in-scene' | 'supplemental' | 'both';

	/** Optional reference image URL or local path */
	imageRef?: string;

	/** Confidence level: direct-documentation, oral-history, or reconstructed */
	confidence?: 'documented' | 'oral' | 'reconstructed';

	/** Optional provenance note */
	source?: string;
}

/**
 * Nhơn Lý, 1976 — Living Memory Exhibit Catalog
 * Objects selected from grounding document and memory structure.
 */
export const NHON_LY_1976_EXHIBITS: DioramaExhibit[] = [
	{
		id: 'thung-chai-01',
		nameEn: 'Thúng Chai (Basket Boat)',
		nameVi: 'Thúng Chai (Ghe Đan)',
		type: 'boat',
		appearanceFragment: 3,
		placarTextEn:
			'The thúng chai is a round, bamboo-woven boat created during the French colonial era. When France taxed boat ownership, fishermen argued these were "baskets" rather than boats—a clever workaround that allowed poor fishermen to continue their livelihoods.',
		placarTextVi:
			'Thúng chai là chiếc ghe tròn được đan từ tre, được tạo ra vào thời kỳ Pháp thuộc. Khi Pháp áp thuế các chiếc ghe, ngư dân lập luận rằng đây là "rổ" chứ không phải ghe—một cách giải quyết thông minh giúp ngư dân nghèo tiếp tục sinh kế.',
		context: 'both',
		confidence: 'documented',
		source: 'Grounding doc: Section 4 – Object-by-Object Meaning',
	},
	{
		id: 'fish-baskets-01',
		nameEn: 'Fish Baskets',
		nameVi: 'Rổ Cá',
		type: 'tool',
		appearanceFragment: 5,
		placarTextEn:
			'Fish baskets transport the daily catch from boat to shore and market. They are essential to the fish trade, where women select, bargain, and sell their catch. Peak fishing season in Nhơn Lý brings mainly tuna, scad, and squid.',
		placarTextVi:
			'Rổ cá chở cá từ ghe xuống bờ và chợ. Chúng rất quan trọng trong thương mại cá, nơi phụ nữ chọn lựa, thương lượng, và bán cá. Mùa đánh bắt cao điểm ở Nhơn Lý chủ yếu là cá ngừ, cá bụi, và mực.',
		context: 'both',
		confidence: 'documented',
		source: 'Grounding doc: Section 4 – Fish Baskets and Fish Trade',
	},
	{
		id: 'waterline-houses-01',
		nameEn: 'Houses Close to the Water',
		nameVi: 'Những Ngôi Nhà Sát Mép Nước',
		type: 'architecture',
		appearanceFragment: 4,
		placarTextEn:
			'Houses in Nhơn Lý are built close to the water, reflecting the villagers\' deep connection to the sea. This proximity allows easy access to fishing boats and the daily activities centered on shore. Architecture adapts to the coastal environment with low roofs and stone fences.',
		placarTextVi:
			'Những ngôi nhà ở Nhơn Lý được xây sát mép nước, phản ánh mối liên hệ sâu sắc của cư dân với biển. Sự gần gũi này cho phép tiếp cận dễ dàng với những chiếc ghe và các hoạt động hàng ngày tập trung ở bờ. Kiến trúc thích nghi với môi trường ven biển với mái thấp và tường đá.',
		context: 'in-scene',
		confidence: 'documented',
		source: 'Grounding doc: Section 4 – Houses Close to the Water',
	},
	{
		id: 'women-fish-trade-01',
		nameEn: 'Women of the Fish Trade',
		nameVi: 'Những Người Phụ Nữ Bên Rổ Cá',
		type: 'livelihood',
		appearanceFragment: 5,
		placarTextEn:
			'Women in Nhơn Lý are central to the fishing economy. While men work boats, women process and sell fish, make and mend nets, and manage tourist accommodations. Women\'s Unions often lead in community decision-making and resource allocation.',
		placarTextVi:
			'Phụ nữ ở Nhơn Lý là trung tâm của nền kinh tế đánh bắt. Trong khi nam giới làm việc trên ghe, phụ nữ chế biến và bán cá, may và sửa lưới, quản lý chỗ ở khách. Hội Phụ nữ thường dẫn đầu trong quyết định cộng đồng và phân bổ tài nguyên.',
		context: 'supplemental',
		confidence: 'documented',
		source: 'Grounding doc: Section 3 – The Role of Women',
	},
	{
		id: 'shoreline-workplace-01',
		nameEn: 'The Shoreline as Workplace',
		nameVi: 'Bờ Biển Là Nơi Làm Việc',
		type: 'landscape',
		appearanceFragment: 1,
		placarTextEn:
			'The shoreline of Nhơn Lý is not a scenic backdrop but a bustling workplace. Fishing boats dock here, fish are unloaded and sorted, daily trade occurs. The shoreline is the heart of the village\'s economic and social life.',
		placarTextVi:
			'Bờ biển Nhơn Lý không phải là nền tảng phong cảnh mà là một nơi làm việc sôi nổi. Những chiếc ghe đánh bắt cập bến ở đây, cá được dỡ hàng và phân loại, thương mại hàng ngày diễn ra. Bờ biển là trái tim của cuộc sống kinh tế và xã hội của làng.',
		context: 'in-scene',
		confidence: 'documented',
		source: 'Grounding doc: Section 4 – Shoreline as Workplace',
	},
	{
		id: 'fishing-rhythm-01',
		nameEn: 'The Rhythm of Fishing',
		nameVi: 'Nhịp Điệu Đánh Bắt',
		type: 'livelihood',
		appearanceFragment: 2,
		placarTextEn:
			'Daily life in Nhơn Lý revolves around the fishing rhythm. Early mornings are liveliest when boats dock with fresh catch. Women are responsible for sorting, cleaning, drying, and selling fish—work crucial for preserving quality and supporting household income.',
		placarTextVi:
			'Cuộc sống hàng ngày ở Nhơn Lý xoay quanh nhịp điệu đánh bắt. Sáng sớm là lúc nhộn nhịp nhất khi ghe cập bến với cá tươi. Phụ nữ chịu trách nhiệm phân loại, làm sạch, phơi khô, và bán cá—công việc quan trọng để bảo tồn chất lượng và hỗ trợ thu nhập gia đình.',
		context: 'supplemental',
		confidence: 'documented',
		source: 'Grounding doc: Section 3 – The Rhythm of the Fishing Village',
	},
];

/**
 * Retrieve exhibits visible during a specific fragment window.
 * Includes objects that appear in the current or adjacent fragments.
 */
export function getExhibitsForFragment(
	fragmentIndex: number,
	window: number = 1
): DioramaExhibit[] {
	return NHON_LY_1976_EXHIBITS.filter(
		(exhibit) =>
			Math.abs(exhibit.appearanceFragment - fragmentIndex) <= window
	);
}

/**
 * Retrieve in-scene exhibits (rendered as part of the visual scene).
 */
export function getInSceneExhibits(): DioramaExhibit[] {
	return NHON_LY_1976_EXHIBITS.filter(
		(exhibit) =>
			exhibit.context === 'in-scene' || exhibit.context === 'both'
	);
}

/**
 * Retrieve supplemental exhibits (placard/exhibit info only).
 */
export function getSupplementalExhibits(
	fragmentIndex: number
): DioramaExhibit[] {
	return getExhibitsForFragment(fragmentIndex, 0).filter(
		(exhibit) =>
			exhibit.context === 'supplemental' || exhibit.context === 'both'
	);
}
