/* eslint no-bitwise: 0 */
export const writeCharacteristicUuid = '3fa4585ace4a3baddb4bb8df8179ea09';
export const notificationCharacteristicUuid = 'd0e8434dcd290996af416c90f4e0eb2a';
export const serviceUuid = '3e135142654f9090134aa6ff5bb77046';
export const deviceName = 'CC-RT-BLE';

export const payload = {
  getInfo: () => payload.setDatetime(new Date()),
  activateBoostmode: () => Buffer.from('4501', 'hex'),
  deactivateBoostmode: () => Buffer.from('4500', 'hex'),
  setAutomaticMode: () => Buffer.from('4000', 'hex'),
  setManualMode: () => Buffer.from('4040', 'hex'),
  setEcoMode: () => Buffer.from('4080', 'hex'),
  lockThermostat: () => Buffer.from('8001', 'hex'),
  unlockThermostat: () => Buffer.from('8000', 'hex'),
  setTemperature: temperature => Buffer.from(`41${temperature <= 7.5 ? '0' : ''}${(2 * temperature).toString(16)}`, 'hex'),
  requestProfile: (day) => {
    const data = Buffer.alloc(2);
    data[0] = 32;
    data[1] = day;
    return data;
  },
  setProfile: (day, periods) => {
    const data = Buffer.alloc(16);
    data[0] = 16;
    data[1] = day;
    periods.forEach((period, index) => {
      data[(index * 2) + 2] = period.temperature * 2;
      if (period.to) {
        data[(index * 2) + 3] = period.to;
      } else if (period.toHuman) {
        data[(index * 2) + 3] = (period.toHuman * 60) / 10;
      }
    });
    return data;
  },
  setTemperatureOffset: offset => Buffer.from(`13${((2 * offset) + 7).toString(16)}`, 'hex'),
  setDay: () => Buffer.from('43', 'hex'),
  setNight: () => Buffer.from('44', 'hex'),
  setComfortTemperatureForNightAndDay: (night, day) => {
    const tempNight = (2 * night).toString(16);
    const tempDay = (2 * day).toString(16);
    return Buffer.from(`11${tempDay}${tempNight}`, 'hex');
  },
  setWindowOpen: (temperature, minDuration) => {
    const temp = (2 * temperature).toString(16);
    const dur = (minDuration / 5).toString(16);
    return Buffer.from(`11${temp}${dur}`, 'hex');
  },
  setDatetime: (date) => {
    const data = Buffer.alloc(7);
    data[0] = 3;
    data[1] = (date.getFullYear() % 100);
    data[2] = (date.getMonth() + 1);
    data[3] = date.getDate();
    data[4] = date.getHours();
    data[5] = date.getMinutes();
    data[6] = date.getSeconds();
    return data;
  },
};

const status = {
  manual: 1,
  eco: 2,
  boost: 4,
  dst: 8,
  openWindow: 16,
  unknown: 32,
  unknown2: 64,
  lowBattery: 128,
};

export function parseInfo(info) {
  const statusMask = info[2];
  const valvePosition = info[3];
  const targetTemperature = info[5] / 2;

  return {
    automaticMode: (statusMask & status.manual) !== status.manual,
    manualMode: (statusMask & status.manual) === status.manual,
    eco: (statusMask & status.eco) === status.eco,
    boost: (statusMask & status.boost) === status.boost,
    dst: (statusMask & status.dst) === status.dst,
    openWindow: (statusMask & status.openWindow) === status.openWindow,
    lowBattery: (statusMask & status.lowBattery) === status.lowBattery,
    valvePosition,
    targetTemperature,
  };
}

export function parseProfile(buffer) {
  const profile = {};
  const periods = [];
  profile.periods = periods;
  if (buffer[0] === 33) {
    // eslint-disable-next-line prefer-destructuring
    profile.dayOfWeek = buffer[1]; // 0-saturday, 1-sunday
    for (let i = 2; i < buffer.length; i += 2) {
      if (buffer[i] !== 0) {
        const temperature = (buffer[i] / 2);
        const to = buffer[i + 1];
        const toHuman = ((buffer[i + 1] * 10) / 60);
        const from = periods.length === 0 ? 0 : periods[periods.length - 1].to;
        const fromHuman = periods.length === 0 ? 0 : periods[periods.length - 1].toHuman;
        periods.push({
          temperature,
          from,
          to,
          fromHuman,
          toHuman,
        });
      }
    }
  }
  return profile;
}
