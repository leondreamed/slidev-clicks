export interface Slidev {
	nav: {
		currentPage: number
		total: number
		clicks: number
		nextSlide(): Promise<void>
	}
}
