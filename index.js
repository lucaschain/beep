const context = new AudioContext()

let volume = context.createGain()
volume.gain.value = 0
volume.connect(context.destination)

let oscillator = context.createOscillator()
oscillator.type = "sine"
oscillator.connect(volume)
oscillator.start(context.currentTime)

events = []
let lastFrequency = null

const beepStart = (frequency, record = false) => {
  if (parseInt(frequency) == parseInt(oscillator.frequency.value) && volume.gain.value == 1) {
    return
  }
  document.body.innerHTML = frequency

  if (lastFrequency && record) {
    beepStop(lastFrequency, record)
  }

  lastFrequency = frequency
  oscillator.frequency.setValueAtTime(frequency, context.currentTime)

  volume.gain.value = 1

  if (record) {
    events.push({
      type: "beepStart",
      frequency: frequency,
      moment: Date.now(),
    })
  }
}

const beepStop = (frequency, record = false) => {
  if (parseInt(frequency) == parseInt(oscillator.frequency.value)) {
    lastFrequency = null
    volume.gain.value = 0

    if (record) {
      events.push({
        type: "beepStop",
        moment: Date.now(),
      })
    }
  }
}

const syncBeep = (frequency, duration) => {
  beepStart(frequency)
  return new Promise((resolve, _) => {
    setTimeout(() => {
      beepStop(frequency)
      resolve()
    }, duration)
  })
}

const sleep = (duration) => {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

const command = (name, params) => {
  return {
    name,
    params
  }
}
const commandsFromEvents = (events) => {
  let lastStart, lastStop

  return events.reduce((accum, cur, index) => {
    let newCommands = accum

    switch (cur.type) {
      case "beepStart":
        if (lastStop) {
          const delay = cur.moment - lastStop.moment
          if (delay > 0) {
            newCommands = [...newCommands, command("sleep", [delay])]
          }
        }
        lastStart = cur
        break
      case "beepStop":
        if (lastStart) {
          const delay = cur.moment - lastStart.moment
          if (delay > 0) {
            newCommands = [...newCommands, command("beep", [lastStart.frequency, delay])]
          }
        }
        lastStop = cur
        break
    }

    return newCommands
  }, [])
}

const writeCommand = (command) =>{
  return `${command.name}(${command.params.join(",")});`
}

const writeCommandsToScreen = (commands) => {
  console.log("Write")

  document.body.innerHTML = ""
  commands.forEach((command) => {
    document.body.innerHTML += `${writeCommand(command)}<br>`
  })
}

const playCommands = async (commands) => {
  console.log("Play")
  for (const command of commands) {
    switch (command.name) {
      case "beep":
        await syncBeep(...command.params)
        break
      case "sleep":
        await sleep(...command.params)
        break
    }
  }
}

const semiTonesUp = (frequency, tones = 1) => {
  const freq = frequency * (Math.pow(2, (1/12) * tones))

  return parseInt(freq * 100) / 100
}

const C = 261.63 * 2
const scale = [0,2,4,5,7,9,11,12]
const keys = "qwertyuiop".split('')
const freqs = keys.map((key, index) => {
  return [
    key,
    semiTonesUp(C, index + 1)
  ]
})

const notes = Object.fromEntries(freqs)

document.addEventListener('keydown', (event) => {
  if (!notes[event.key]) {
    if (event.key == "z") {
      const commands = commandsFromEvents(events)
      writeCommandsToScreen(commands)
      playCommands(commands)
    }
    if (event.key == "c") {
      console.log("Clearing")
      document.body.innerHTML = ""
      events = []
    }
    return
  }
  beepStart(notes[event.key], true)
})

document.addEventListener('keyup', (event) => {
  if (!notes[event.key]) {
    return
  }
  beepStop(notes[event.key], true)
})

