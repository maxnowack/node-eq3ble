/* eslint no-bitwise: 0 */
export const writeCharacteristic = '3fa4585ace4a3baddb4bb8df8179ea09'
export const notificationCharacteristic = 'd0e8434dcd290996af416c90f4e0eb2a'
export const serviceUuid = '3e135142654f9090134aa6ff5bb77046'

export const payload = {
  getInfo: () => new Buffer('03', 'hex'),
  activateBoostmode: () => new Buffer('4501', 'hex'),
  deactivateBoostmode: () => new Buffer('4500', 'hex'),
  setAutomaticMode: () => new Buffer('4000', 'hex'),
  setManualMode: () => new Buffer('4040', 'hex'),
  setEcoMode: () => new Buffer('4080', 'hex'),
  lockThermostat: () => new Buffer('8001', 'hex'),
  unlockThermostat: () => new Buffer('8000', 'hex'),
  setTemperature: temperature => new Buffer(`41${temperature <= 7.5 ? '0' : ''}${(2 * temperature).toString(16)}`, 'hex'),
  setTemperatureOffset: offset => new Buffer(`13${((2 * offset) + 7).toString(16)}`, 'hex'),
  setDay: () => new Buffer('43', 'hex'),
  setNight: () => new Buffer('44', 'hex'),
  setComfortTemperatureForNightAndDay: (night, day) => {
    const tempNight = (2 * night).toString(16)
    const tempDay = (2 * day).toString(16)
    return new Buffer(`11${tempDay}${tempNight}`, 'hex')
  },
  setWindowOpen: (temperature, minDuration) => {
    const temp = (2 * temperature).toString(16)
    const dur = (minDuration / 5).toString(16)
    return new Buffer(`11${temp}${dur}`, 'hex')
  },
  setDatetime: (date) => {
    const prefix = '03'
    const year = date.getFullYear().toString(16)
    const month = (date.getMonth() + 1).toString(16)
    const day = date.getDay().toString(16)
    const hour = date.getHours().toString(16)
    const minute = date.getMinutes().toString(16)
    const second = date.getSeconds().toString(16)
    return new Buffer(prefix + year + month + day + hour + minute + second, 'hex')
  },
}

const status = {
  manual: 1,
  holiday: 2,
  boost: 4,
  dst: 8,
  openWindow: 16,
  unknown: 32,
  unknown2: 64,
  lowBattery: 128,
}

export function parseInfo(info) {
  const statusMask = info[2]
  const valvePosition = info[3]
  const targetTemperature = info[5] / 2

  return {
    status: {
      manual: (statusMask & status.manual) === status.manual,
      holiday: (statusMask & status.holiday) === status.holiday,
      boost: (statusMask & status.boost) === status.boost,
      dst: (statusMask & status.dst) === status.dst,
      openWindow: (statusMask & status.openWindow) === status.openWindow,
      lowBattery: (statusMask & status.lowBattery) === status.lowBattery,
    },
    valvePosition,
    targetTemperature,
  }
}
