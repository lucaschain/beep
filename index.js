const context = new AudioContext()

const beep = (frequency, duration = 0.3) => {
  const oscillator = context.createOscillator()

  oscillator.frequency.setValueAtTime(frequency, context.currentTime)
  oscillator.type = "sawtooth"
  oscillator.connect(context.destination)

  oscillator.start(context.currentTime)
  return new Promise((resolve, _reject) => {
    setTimeout(() => {
      oscillator.stop(context.currentTime)
      resolve()
    }, duration * 1000)
  })
}

const semiTonesUp = (frequency, tones = 1) => (
  frequency * (Math.pow(2, (1/12) * tones))
)

const C = 261.63 * 2

async function start() {
  await beep(C)
  await beep(semiTonesUp(C, 3))
  await beep(semiTonesUp(C, 5))
}

const keys = "qwertyuiop".split('')
const freqs = keys.map((key, index) => {
  return [
    key,
    semiTonesUp(C, index + 1)
  ]
})

const notes = Object.fromEntries(freqs)

document.addEventListener('keypress', (event) => {
  if (!notes[event.key]) {
    return
  }
  beep(notes[event.key])
})

//const keys = "qwertyuiop"
