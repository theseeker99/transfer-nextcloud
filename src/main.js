import Vue from 'vue'
import { addNewFileMenuEntry, Permission } from '@nextcloud/files'
import { translate, translatePlural } from '@nextcloud/l10n'
import Transfer from './Transfer.vue'

Vue.prototype.t = translate
Vue.prototype.n = translatePlural

const vueMountElement = document.createElement('div')
document.body.append(vueMountElement)

const vueMount = new Vue({
	el: vueMountElement,
	render: h => h(Transfer)
})

addNewFileMenuEntry({
	id: 'transfer',
	displayName: t('transfer', 'Upload by link'),
	iconSvgInline: "<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"mdi-cloud-upload\" viewBox=\"0 0 24 24\"><path d=\"M11 20H6.5Q4.22 20 2.61 18.43 1 16.85 1 14.58 1 12.63 2.17 11.1 3.35 9.57 5.25 9.15 5.88 6.85 7.75 5.43 9.63 4 12 4 14.93 4 16.96 6.04 19 8.07 19 11 20.73 11.2 21.86 12.5 23 13.78 23 15.5 23 17.38 21.69 18.69 20.38 20 18.5 20H13V12.85L14.6 14.4L16 13L12 9L8 13L9.4 14.4L11 12.85Z\" /></svg>",
	order: -1,

	// Only display in folders where this user has permission to create files
	if: context => (context.permissions & Permission.CREATE) !== 0,

	async handler(context, content) {
		vueMount.$children[0].open(context)
	}
})
