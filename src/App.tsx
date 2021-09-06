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

type RemoteStream = {
  stream: MediaStream;
  peerId: string;
};

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [join, setJoin] = useState(false);
  const [room, setRoom] = useState<MeshRoom | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const [enabledAudio, setEnabledAudio] = useState(true);
  const [enabledVideo, setEnabledVideo] = useState(true);

  const localVideoRef = useRef(null);

  const refreshDevices = useCallback(async (retry = 0) => {
    console.log('called refreshDevices');
    const {
      aDevices,
      vDevices,
    } = await getDevices();

    const audios = aDevices.filter(({ label }) => label !== '');
    const videos = vDevices.filter(({ label }) => label !== '');

    setAudioDevices(() => audios);
    setVideoDevices(() => videos);

    console.log({
      audios,
      videos
    });

    if (audios.length === 0 && videos.length === 0 && retry < 10) {
      setTimeout(() => refreshDevices(retry + 1), 3000);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = new Peer({
        key: 'bfae4862-4740-46d1-bf51-8ee9105b83f3',
        debug: 3
      });
      p.on('open', () => {
        console.log(p.id);
      });
      setPeer(() => p);
      await refreshDevices();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stream = await getStream({
        audioDeviceId,
        videoDeviceId,
      });
      setLocalStream(stream);
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
      if (!localStream) return;
      if (!peer || peer && !peer.open) return;
      const r: MeshRoom = peer.joinRoom('test-room-id', {
        stream: localStream
      });
      r.on('stream', async (stream) => {
        setRemoteStreams((prev) => [
          ...prev,
          {
            stream,
            peerId: stream.peerId
          }
        ]);
      });
      r.on('peerLeave', (_peerId) => {
        setRemoteStreams((prev) => prev.filter(({peerId}) => peerId !== _peerId));
      });
      setRoom(() => r);
      console.log(r);
    })();
  }, [join]);

  const toggleAudio = useCallback(() => {
    const audios = localStream && localStream.getAudioTracks();
    if (audios) {
      const [audio] = audios;
      audio.enabled = !enabledAudio;
      setEnabledAudio(!enabledAudio);
    }
  }, [localStream, enabledAudio]);

  const toggleVideo = useCallback(() => {
    const videos = localStream && localStream.getVideoTracks();
    if (videos) {
      const [video] = videos;
      video.enabled = !enabledVideo;
      setEnabledVideo(!enabledVideo);
    }
  }, [localStream, enabledVideo]);

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
      <div>
        <button onClick={_=>toggleVideo()}>{enabledVideo ? 'カメラを無効にする' : 'カメラを有効にする'}</button>
        <button onClick={_=>toggleAudio()}>{enabledAudio ? 'ミュートする' : 'ミュート解除'}</button>
      </div>
      <video
        ref={localVideoRef}
        width="400px"
        autoPlay
        muted
        playsInline
      />
      <div>
        {remoteStreams.map(({stream}) => (
          <video
            autoPlay
            playsInline
            ref={(video) => { if (video) video.srcObject = stream }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
