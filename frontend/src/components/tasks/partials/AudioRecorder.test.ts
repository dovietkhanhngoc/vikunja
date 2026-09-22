import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import AudioRecorder from './AudioRecorder.vue'
import XButton from '@/components/input/Button.vue'

vi.mock('vue-i18n', async importOriginal => ({
	...(await importOriginal<typeof import('vue-i18n')>()),
	useI18n: () => ({t: (key: string) => key}),
}))

class MockMediaRecorder extends EventTarget {
	static isTypeSupported = vi.fn(() => true)

	mimeType: string
	state: RecordingState = 'inactive'

	constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
		super()
		this.mimeType = options?.mimeType ?? 'audio/webm'
	}

	start() {
		this.state = 'recording'
	}

	stop() {
		this.state = 'inactive'
		const dataEvent = new Event('dataavailable') as BlobEvent
		Object.defineProperty(dataEvent, 'data', {value: new Blob(['audio'], {type: this.mimeType})})
		this.dispatchEvent(dataEvent)
		this.dispatchEvent(new Event('stop'))
	}
}

const trackStop = vi.fn()
const getUserMedia = vi.fn(async () => ({
	getTracks: () => [{stop: trackStop}],
}) as unknown as MediaStream)

function mountRecorder() {
	return mount(AudioRecorder, {
		global: {
			components: {XButton},
			stubs: {Icon: true, RouterLink: true},
			mocks: {$t: (key: string) => key},
		},
	})
}

beforeEach(() => {
	vi.stubGlobal('MediaRecorder', MockMediaRecorder)
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: {getUserMedia},
	})
})

afterEach(() => {
	vi.restoreAllMocks()
	trackStop.mockClear()
	getUserMedia.mockClear()
})

describe('AudioRecorder', () => {
	it('emits a recorded audio file and releases the microphone', async () => {
		const wrapper = mountRecorder()

		await wrapper.get('button').trigger('click')
		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledWith({audio: true}))
		await wrapper.get('button').trigger('click')

		const [[file]] = wrapper.emitted<File[]>('recorded')!
		expect(file).toBeInstanceOf(File)
		expect(file.type).toBe('audio/webm;codecs=opus')
		expect(file.name).toMatch(/^recording-.*\.webm$/)
		expect(trackStop).toHaveBeenCalledOnce()
	})

	it('discards a cancelled recording and releases the microphone', async () => {
		const wrapper = mountRecorder()

		await wrapper.get('button').trigger('click')
		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce())
		await wrapper.findAll('button')[1].trigger('click')

		expect(wrapper.emitted('recorded')).toBeUndefined()
		expect(trackStop).toHaveBeenCalledOnce()
	})

	it('shows an error when microphone access is denied', async () => {
		getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
		const wrapper = mountRecorder()

		await wrapper.get('button').trigger('click')
		await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('task.attachment.microphoneAccessFailed'))

		expect(wrapper.emitted('recorded')).toBeUndefined()
	})

	it('stops the microphone without uploading when unmounted', async () => {
		const wrapper = mountRecorder()

		await wrapper.get('button').trigger('click')
		await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce())
		wrapper.unmount()

		expect(wrapper.emitted('recorded')).toBeUndefined()
		expect(trackStop).toHaveBeenCalledOnce()
	})

	it('releases a stream granted after the component was unmounted', async () => {
		let grantAccess!: (stream: MediaStream) => void
		getUserMedia.mockImplementationOnce(() => new Promise(resolve => {
			grantAccess = resolve
		}))
		const wrapper = mountRecorder()

		await wrapper.get('button').trigger('click')
		wrapper.unmount()
		grantAccess({getTracks: () => [{stop: trackStop}]} as unknown as MediaStream)
		await flushPromises()

		expect(wrapper.emitted('recorded')).toBeUndefined()
		expect(trackStop).toHaveBeenCalledOnce()
	})
})
