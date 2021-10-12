export const mediaDevices = navigator.mediaDevices;

export async function getDevices() {
  const devices = await mediaDevices.enumerateDevices();
  const vDevices: MediaDeviceInfo[] = [];
  const aDevices: MediaDeviceInfo[] = [];
  console.log(devices);
  devices.forEach((device) => {
    const { kind, deviceId, label } = device;
    switch (kind) {
      case "audioinput":
        aDevices.push(device);
        break;
      case "videoinput":
        vDevices.push(device);
        break;
    }
  });
  return {
    vDevices, aDevices
  };
}

export async function getStream({
  audioDeviceId,
  videoDeviceId
}: { audioDeviceId: string, videoDeviceId: string }) {
  const stream = await mediaDevices.getUserMedia({
    video: {
      deviceId: videoDeviceId
    },
    audio: {
      deviceId: audioDeviceId
    }
  });

  return stream;
}
