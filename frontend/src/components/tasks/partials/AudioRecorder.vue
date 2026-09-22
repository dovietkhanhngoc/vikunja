<template>
	<div
		v-if="isSupported"
		class="audio-recorder"
	>
		<XButton
			v-if="state === 'idle' || state === 'error'"
			:disabled="disabled"
			icon="microphone"
			variant="secondary"
			:shadow="false"
			@click="startRecording"
		>
			{{ $t('task.attachment.recordAudio') }}
		</XButton>

		<template v-else-if="state === 'recording' || state === 'finalizing'">
			<span
				class="recording-status"
				role="status"
				aria-live="polite"
			>
				<span class="recording-dot" />
				{{ $t('task.attachment.recordingAudio', {duration: formattedDuration}) }}
			</span>
			<XButton
				:disabled="state === 'finalizing'"
				icon="stop"
				:shadow="false"
				@click="stopRecording"
			>
				{{ $t('task.attachment.stopRecording') }}
			</XButton>
			<XButton
				:disabled="state === 'finalizing'"
				icon="times"
				variant="tertiary"
				:shadow="false"
				@click="cancelRecording"
			>
				{{ $t('misc.cancel') }}
			</XButton>
		</template>
		<span
			v-else
			class="recording-status"
			role="status"
		>
			{{ $t('task.attachment.preparingRecording') }}
		</span>

		<p
			v-if="errorMessage"
			class="recording-error"
			role="alert"
		>
			{{ errorMessage }}
		</p>
	</div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref} from 'vue'
import {useI18n} from 'vue-i18n'

const props = withDefaults(defineProps<{
	disabled?: boolean,
}>(), {
	disabled: false,
})

const emit = defineEmits<{
	recorded: [File],
}>()

type RecorderState = 'idle' | 'requesting' | 'recording' | 'finalizing' | 'error'

const {t} = useI18n({useScope: 'global'})
const state = ref<RecorderState>('idle')
const durationSeconds = ref(0)
const errorMessage = ref('')

const isSupported = computed(() => typeof navigator !== 'undefined'
	&& typeof navigator.mediaDevices?.getUserMedia === 'function'
	&& typeof MediaRecorder !== 'undefined')

const formattedDuration = computed(() => {
	const minutes = Math.floor(durationSeconds.value / 60)
	const seconds = durationSeconds.value % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

let stream: MediaStream | null = null
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []
let durationTimer: ReturnType<typeof setInterval> | null = null
let discardRecording = false
let isUnmounted = false

function supportedMimeType(): string | undefined {
	const candidates = [
		'audio/webm;codecs=opus',
		'audio/webm',
		'audio/ogg;codecs=opus',
		'audio/mp4',
	]

	return candidates.find(type => MediaRecorder.isTypeSupported(type))
}

function extensionForMimeType(mimeType: string): string {
	if (mimeType.includes('ogg')) return 'ogg'
	if (mimeType.includes('mp4')) return 'm4a'
	return 'webm'
}

function stopDurationTimer() {
	if (durationTimer !== null) {
		clearInterval(durationTimer)
		durationTimer = null
	}
}

function stopMediaTracks() {
	stream?.getTracks().forEach(track => track.stop())
	stream = null
}

function resetRecorder() {
	stopDurationTimer()
	stopMediaTracks()
	recorder = null
	chunks = []
	durationSeconds.value = 0
}

function recordingFile(blob: Blob): File {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	return new File(
		[blob],
		`recording-${timestamp}.${extensionForMimeType(blob.type)}`,
		{type: blob.type},
	)
}

async function startRecording() {
	if (!isSupported.value || props.disabled) return

	errorMessage.value = ''
	discardRecording = false
	chunks = []
	state.value = 'requesting'

	try {
		stream = await navigator.mediaDevices.getUserMedia({audio: true})
		if (isUnmounted) {
			stopMediaTracks()
			return
		}
		const mimeType = supportedMimeType()
		recorder = mimeType
			? new MediaRecorder(stream, {mimeType})
			: new MediaRecorder(stream)

		recorder.addEventListener('dataavailable', event => {
			if (event.data.size > 0) chunks.push(event.data)
		})
		recorder.addEventListener('stop', () => {
			const actualMimeType = recorder?.mimeType || mimeType || 'audio/webm'
			const blob = new Blob(chunks, {type: actualMimeType})
			const shouldEmit = !discardRecording && blob.size > 0

			resetRecorder()
			state.value = 'idle'
			if (shouldEmit) emit('recorded', recordingFile(blob))
		})
		recorder.addEventListener('error', () => {
			resetRecorder()
			state.value = 'error'
			errorMessage.value = t('task.attachment.recordingFailed')
		})

		recorder.start()
		state.value = 'recording'
		durationTimer = setInterval(() => durationSeconds.value++, 1000)
	} catch {
		resetRecorder()
		state.value = 'error'
		errorMessage.value = t('task.attachment.microphoneAccessFailed')
	}
}

function stopRecording() {
	if (recorder?.state !== 'recording') return
	state.value = 'finalizing'
	stopDurationTimer()
	recorder.stop()
}

function cancelRecording() {
	discardRecording = true
	if (recorder?.state === 'recording') {
		recorder.stop()
		return
	}
	resetRecorder()
	state.value = 'idle'
}

onBeforeUnmount(() => {
	isUnmounted = true
	discardRecording = true
	if (recorder?.state === 'recording') recorder.stop()
	resetRecorder()
})
</script>

<style lang="scss" scoped>
.audio-recorder {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: .5rem;
}

.recording-status {
	display: inline-flex;
	align-items: center;
	gap: .4rem;
	font-variant-numeric: tabular-nums;
}

.recording-dot {
	inline-size: .65rem;
	block-size: .65rem;
	border-radius: 50%;
	background: var(--danger);
	animation: recording-pulse 1.5s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

.recording-error {
	flex-basis: 100%;
	margin: 0;
	color: var(--danger);
}

@keyframes recording-pulse {
	50% {
		opacity: .35;
	}
}
</style>
