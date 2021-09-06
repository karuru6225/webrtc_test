import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import Peer, { MeshRoom } from 'skyway-js';
import './App.css';

const mediaDevices = navigator.mediaDevices;
async function getDevices() {
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

async function getStream({
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

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [join, setJoin] = useState(false);
  const [room, setRoom] = useState<MeshRoom | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');

  const localVideoRef = useRef(null);

  const refreshDevices = useCallback(async () => {
    const {
      aDevices,
      vDevices
    } = await getDevices();

    setAudioDevices(() => aDevices);
    setVideoDevices(() => vDevices);
  }, []);

  useEffect(() => {
    const p = new Peer({
      key: 'bfae4862-4740-46d1-bf51-8ee9105b83f3',
      debug: 3
    });
    p.on('open', () => {
      console.log(p.id);
    });
    setPeer(() => p);
    refreshDevices();
  }, []);

  useEffect(() => {
    (async () => {
      const stream = await getStream({
        audioDeviceId,
        videoDeviceId,
      });
      if (stream && localVideoRef && localVideoRef.current) {
        const video: HTMLVideoElement = localVideoRef.current;
        video.srcObject = stream;
        video.play();
      }

      if (room) {
        room.replaceStream(stream);
      }
    })();
  }, [audioDeviceId, videoDeviceId]);

  useEffect(() => {
    (async () => {
      if (!join) return;
      if (!peer || peer && !peer.open) return;
      const stream = await getStream({
        audioDeviceId,
        videoDeviceId,
      });
      const r: MeshRoom = peer.joinRoom('test-room-id', {
        stream
      });
      setRoom(() => r);
      console.log(r);
    })();
  }, [join]);

  return (
    <div className="App">
      <div>
        <label htmlFor="audio-devices">
          AudioDevice: 
        </label>
        <select
          id="audio-devices"
          value={audioDeviceId}
          onChange={e => setAudioDeviceId(e.currentTarget.value)}
        >
          {audioDevices.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="video-devices">
          VideoDevice: 
        </label>
        <select
          id="video-devices"
          value={videoDeviceId}
          onChange={e => setVideoDeviceId(e.currentTarget.value)}
        >
          {videoDevices.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button onClick={_=>setJoin(true)}>Join</button>
      </div>
      <video
        ref={localVideoRef}
        width="400px"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}

export default App;
