import { discoverAll } from './src';

discoverAll((device) => {
  console.log('found thermostat', device.address);
  let boost = false;
  device.on('update', info => console.log(device.address, info));
  setInterval(() => {
    device.getInfo();
  }, 300000);
  device.getInfo();
  process.on('SIGINFO', () => {
    console.log('boost', device.address, !boost);
    device.setBoost(!boost);
    boost = !boost;
  });
});
