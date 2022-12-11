import { outdent } from 'outdent'
import type { Plugin } from 'vite'

export default function slidevClicks(): Plugin {
	return {
		name: 'inject-main-scripts',
		transformIndexHtml(html) {
			return html.replace(
				'</head>',
				outdent`
					</head>
					<script type='module'>
						import 'slidev-clicks/promise-patch'
					</script>
				`
			)
		},
	}
}
