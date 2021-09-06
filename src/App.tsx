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
  const [shareStream, setShareStream] = useState<MediaStream | null>(null);
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
      });
      p.on('open', () => {
        console.log(p.id);
      });
      setPeer(() => p);
      await refreshDevices();
    })();
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef && localVideoRef.current) {
      const video: HTMLVideoElement = localVideoRef.current;
      video.srcObject = localStream;
      video.play();
    }
  }, [localVideoRef, localStream]);

  const replaceLocalStream = useCallback(async () => {
    if (shareStream) {
      if (room) {
        room.replaceStream(shareStream);
      }
      return;
    }

    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach(t => t.stop())
    }
    const stream = await getStream({
      audioDeviceId,
      videoDeviceId,
    });

    setLocalStream(stream);

    if (room) {
      room.replaceStream(stream);
    }
  }, [audioDeviceId, videoDeviceId, localStream, shareStream])

  useEffect(() => {
    replaceLocalStream();
  }, [audioDeviceId, videoDeviceId, shareStream]);

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

  const shareDisplay = useCallback(() => {
    (async () => {
      if (!room) return;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const tracks = stream.getTracks();
        tracks.forEach(t => {
          t.addEventListener('ended', () => {
            setShareStream(null);
          });
        });
        console.log('shareDisplay', stream);
        setShareStream(stream);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [room, localStream, setShareStream]);

  const stopShareDisplay = useCallback(() => {
    if (shareStream) {
      const tracks = shareStream.getTracks();
      tracks.forEach(t => {
        t.stop();
      });
    }
    setShareStream(null);
  }, [shareStream, localStream]);


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
        <button onClick={_=>setJoin(true)} disabled={join}>Join</button>
      </div>
      <div>
        <button onClick={_=>toggleVideo()}>{enabledVideo ? 'カメラを無効にする' : 'カメラを有効にする'}</button>
        <button onClick={_=>toggleAudio()}>{enabledAudio ? 'ミュートする' : 'ミュート解除'}</button>
        { !shareStream && <button onClick={_=>shareDisplay()} disabled={!join}>画面共有</button> }
        { shareStream && <button onClick={_=>stopShareDisplay()} disabled={!join}>画面共有を終える</button> }
      </div>
      <video
        ref={localVideoRef}
        width="400px"
        style={{
          width: '480px'
        }}
        autoPlay
        muted
        playsInline
      />
      {shareStream && (
        <video
          width="400px"
          style={{
            width: '480px'
          }}
          autoPlay
          muted
          playsInline
          ref={(video) => { if (video) video.srcObject = shareStream }}
        />
      )}
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
